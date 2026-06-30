const User     = require('../models/User');
const mongoose = require('mongoose');

const NIVELES = ['A1','A2','B1','B2','C1','C2'];

const getStats = function(req, res) {
  Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'admin' }),
    User.aggregate([
      { $group: { _id: '$englishLevel', total: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    User.aggregate([
      { $group: {
          _id: null,
          xpTotal:      { $sum: '$experiencePoints' },
          palabrasTotal:{ $sum: '$wordsCorrect' }
      } }
    ])
  ])
  .then(function(r) {
    const totalUsuarios = r[0];
    const totalAdmins   = r[1];
    const porNivelArr   = r[2];
    const sumas         = r[3][0] || { xpTotal: 0, palabrasTotal: 0 };

    const porNivel = {};
    porNivelArr.forEach(function(n) { porNivel[n._id || 'A1'] = n.total; });

    return res.json({
      totalUsuarios: totalUsuarios,
      totalAdmins:   totalAdmins,
      totalAlumnos:  totalUsuarios - totalAdmins,
      xpTotal:       sumas.xpTotal,
      palabrasTotal: sumas.palabrasTotal,
      porNivel:      porNivel
    });
  })
  .catch(function(err) {
    return res.status(500).json({ msg: err.message });
  });
};

const getUsers = function(req, res) {
  User.find({})
    .select('-password')
    .sort({ experiencePoints: -1, createdAt: -1 })
    .then(function(users) {
      return res.json({ total: users.length, users: users });
    })
    .catch(function(err) {
      return res.status(500).json({ msg: err.message });
    });
};

const getLevel = function(req, res) {
  const nivel = (req.params.nivel || '').toUpperCase();
  if (NIVELES.indexOf(nivel) === -1) {
    return res.status(400).json({ msg: 'Nivel invalido' });
  }

  const db = mongoose.connection.db;

  Promise.all([
    db.collection('cursos').findOne({ nivel: nivel }),
    User.find({ englishLevel: nivel, role: { $ne: 'admin' } }).select('-password')
  ])
  .then(function(r) {
    const curso   = r[0];
    const alumnos = r[1];

    if (!curso) {
      return res.status(404).json({ msg: 'No existe el curso del nivel ' + nivel });
    }

    const temasCurso = (curso.temas || []).map(function(t) {
      return {
        id:            t.id,
        titulo:        t.titulo,
        icono:         t.icono || '',
        totalPalabras: (t.vocabulario || []).length
      };
    });
    const totalPalabrasNivel = temasCurso.reduce(function(a, t) { return a + t.totalPalabras; }, 0);

    const alumnosData = alumnos.map(function(u) {
      const prog = u.progresoTemas || new Map();
      const get  = function(id) {
        if (typeof prog.get === 'function') return prog.get(id) || [];
        return prog[id] || [];
      };

      let completadasTotal = 0;
      let temasCompletos   = 0;

      const temas = temasCurso.map(function(t) {
        const hechas   = get(t.id).length;
        const completo = t.totalPalabras > 0 && hechas >= t.totalPalabras;
        completadasTotal += hechas;
        if (completo) temasCompletos++;
        return {
          id:          t.id,
          titulo:      t.titulo,
          icono:       t.icono,
          completadas: hechas,
          total:       t.totalPalabras,
          completo:    completo,
          pct:         t.totalPalabras > 0 ? Math.round((hechas / t.totalPalabras) * 100) : 0
        };
      });

      return {
        _id:              u._id,
        name:             u.name,
        email:            u.email,
        experiencePoints: u.experiencePoints || 0,
        wordsCorrect:     u.wordsCorrect || 0,
        aprobado:         (u.nivelesAprobados || []).indexOf(nivel) !== -1,
        ultimoTema:       u.ultimoTema || '',
        temasCompletos:   temasCompletos,
        progresoGeneral:  totalPalabrasNivel > 0 ? Math.round((completadasTotal / totalPalabrasNivel) * 100) : 0,
        temas:            temas
      };
    });

    alumnosData.sort(function(a, b) { return b.progresoGeneral - a.progresoGeneral; });

    return res.json({
      nivel:              nivel,
      totalTemas:         temasCurso.length,
      totalPalabrasNivel: totalPalabrasNivel,
      temas:              temasCurso,
      totalAlumnos:       alumnosData.length,
      alumnos:            alumnosData
    });
  })
  .catch(function(err) {
    return res.status(500).json({ msg: err.message });
  });
};

const getStudent = function(req, res) {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID invalido' });
  }

  const db = mongoose.connection.db;

  User.findById(id).select('-password')
    .then(function(u) {
      if (!u) return res.status(404).json({ msg: 'Estudiante no encontrado' });

      return db.collection('cursos').find({}).toArray().then(function(cursos) {
        const prog = u.progresoTemas || new Map();
        const get  = function(tid) {
          if (typeof prog.get === 'function') return prog.get(tid) || [];
          return prog[tid] || [];
        };

        const byNivel = {};
        cursos.forEach(function(c) { byNivel[c.nivel] = c; });

        const niveles = NIVELES.map(function(nivel) {
          const curso = byNivel[nivel];
          const temasCurso = curso ? (curso.temas || []) : [];
          let completadasTotal = 0, totalPalabras = 0, temasCompletos = 0;

          const temas = temasCurso.map(function(t) {
            const total  = (t.vocabulario || []).length;
            const hechas = get(t.id).length;
            const completo = total > 0 && hechas >= total;
            completadasTotal += hechas;
            totalPalabras    += total;
            if (completo) temasCompletos++;
            return {
              id: t.id, titulo: t.titulo, icono: t.icono || '',
              completadas: hechas, total: total, completo: completo,
              pct: total > 0 ? Math.round((hechas/total)*100) : 0
            };
          });

          return {
            nivel: nivel,
            aprobado: (u.nivelesAprobados || []).indexOf(nivel) !== -1,
            esActual: u.englishLevel === nivel,
            temasCompletos: temasCompletos,
            totalTemas: temasCurso.length,
            progreso: totalPalabras > 0 ? Math.round((completadasTotal/totalPalabras)*100) : 0,
            temas: temas
          };
        });

        return res.json({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          englishLevel: u.englishLevel,
          emailVerified: u.emailVerified,
          interviewUnlocked: u.interviewUnlocked || false,
          interviewRequestedAt: u.interviewRequestedAt || null,
          experiencePoints: u.experiencePoints || 0,
          wordsCorrect: u.wordsCorrect || 0,
          practiceCount: u.practiceCount || 0,
          lastActive: u.lastActive || null,
          ultimoTema: u.ultimoTema || '',
          nivelesAprobados: u.nivelesAprobados || [],
          createdAt: u.createdAt,
          niveles: niveles
        });
      });
    })
    .catch(function(err) {
      return res.status(500).json({ msg: err.message });
    });
};

const updateStudent = function(req, res) {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID invalido' });
  }

  const cambios = {};
  const NIVELES_OK = ['A1','A2','B1','B2','C1','C2'];

  if (typeof req.body.name === 'string') {
    const n = req.body.name.trim();
    if (n.length < 2 || n.length > 60) return res.status(400).json({ msg: 'Nombre invalido (2 a 60 caracteres)' });
    cambios.name = n;
  }
  if (typeof req.body.email === 'string') {
    const e = req.body.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return res.status(400).json({ msg: 'Correo invalido' });
    cambios.email = e;
  }
  if (typeof req.body.englishLevel === 'string') {
    if (NIVELES_OK.indexOf(req.body.englishLevel) === -1) return res.status(400).json({ msg: 'Nivel invalido' });
    cambios.englishLevel = req.body.englishLevel;
  }
  if (typeof req.body.emailVerified === 'boolean') {
    cambios.emailVerified = req.body.emailVerified;
  }
  if (typeof req.body.interviewUnlocked === 'boolean') {
    cambios.interviewUnlocked = req.body.interviewUnlocked;
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ msg: 'No hay cambios para guardar' });
  }

  const checkEmail = cambios.email
    ? User.findOne({ email: cambios.email, _id: { $ne: id } })
    : Promise.resolve(null);

  checkEmail
    .then(function(dup) {
      if (dup) return res.status(400).json({ msg: 'Ese correo ya esta en uso por otro usuario' });
      return User.findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
        .select('-password')
        .then(function(u) {
          if (!u) return res.status(404).json({ msg: 'Estudiante no encontrado' });
          return res.json({ msg: 'Cambios guardados', user: u });
        });
    })
    .catch(function(err) {
      return res.status(500).json({ msg: err.message });
    });
};

const deleteStudent = function(req, res) {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID invalido' });
  }
  if (String(req.user._id) === String(id)) {
    return res.status(400).json({ msg: 'No puedes eliminar tu propia cuenta de administrador' });
  }

  User.findById(id)
    .then(function(u) {
      if (!u) return res.status(404).json({ msg: 'Estudiante no encontrado' });
      if (u.role === 'admin') {
        return res.status(403).json({ msg: 'No se puede eliminar a otro administrador' });
      }
      return User.findByIdAndDelete(id).then(function() {
        return res.json({ msg: 'Alumno eliminado correctamente', id: id });
      });
    })
    .catch(function(err) {
      return res.status(500).json({ msg: err.message });
    });
};

module.exports = { getStats: getStats, getUsers: getUsers, getLevel: getLevel, getStudent: getStudent, updateStudent: updateStudent, deleteStudent: deleteStudent };