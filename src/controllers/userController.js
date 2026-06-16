const User = require('../models/User');

const XP_POR_NIVEL = { A1:500, A2:1200, B1:2800, B2:5500, C1:10000, C2:20000 };
const RANGOS = [
  { minXP:0,     rango:'Principiante' },
  { minXP:500,   rango:'Aprendiz'     },
  { minXP:1200,  rango:'Explorador'   },
  { minXP:2800,  rango:'Estudiante'   },
  { minXP:5500,  rango:'Intermedio'   },
  { minXP:10000, rango:'Avanzado'     },
  { minXP:20000, rango:'Maestro'      }
];

function calcularRango(xp) {
  let rango = 'Principiante';
  for (const r of RANGOS) { if (xp >= r.minXP) rango = r.rango; }
  return rango;
}

// GET /api/users/perfil
const getPerfil = async (req, res) => {
  res.json(req.user);
};

// PUT /api/users/avatar
const actualizarAvatar = async (req, res) => {
  try {
    const { nivelIngles } = req.body;
    if (!['A1','A2','B1','B2','C1','C2'].includes(nivelIngles))
      return res.status(400).json({ error: 'Nivel inválido' });

    req.user.avatar.nivelIngles = nivelIngles;
    await req.user.save();
    res.json({ mensaje: 'Avatar actualizado', avatar: req.user.avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users/xp  — sumar XP y actualizar rango
const sumarXP = async (req, res) => {
  try {
    const { xp, nivel } = req.body;
    if (!xp || !nivel) return res.status(400).json({ error: 'xp y nivel requeridos' });

    const user = req.user;
    user.avatar.xp += xp;
    user.avatar.rango = calcularRango(user.avatar.xp);

    // Actualizar progreso del nivel
    if (!user.progreso[nivel]) user.progreso[nivel] = { xp: 0 };
    user.progreso[nivel].xp = (user.progreso[nivel].xp || 0) + xp;

    // Marcar como completado si alcanzó el XP del nivel
    if (user.progreso[nivel].xp >= XP_POR_NIVEL[nivel]) {
      user.progreso[nivel].completado = true;
    }

    await user.save();
    res.json({ xpTotal: user.avatar.xp, rango: user.avatar.rango, progreso: user.progreso });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/progreso
const getProgreso = async (req, res) => {
  res.json({
    avatar: req.user.avatar,
    progreso: req.user.progreso
  });
};

module.exports = { getPerfil, actualizarAvatar, sumarXP, getProgreso };
