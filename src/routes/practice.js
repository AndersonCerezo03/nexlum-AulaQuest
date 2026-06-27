const router   = require('express').Router();
const User     = require('../models/User');
const auth     = require('../middleware/auth');
const mongoose = require('mongoose');

const TRIAL_DAYS = 3;

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function trialStatus(user) {
  if (user.isPremium || user.role === 'admin') return { active: true, expired: false, daysLeft: null };
  if (!user.trialStartDate) return { active: true, expired: false, daysLeft: TRIAL_DAYS };
  const msElapsed = Date.now() - new Date(user.trialStartDate).getTime();
  const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));
  return { active: daysLeft > 0, expired: daysLeft === 0, daysLeft };
}

router.post('/word-done', auth, async function(req, res) {
  try {
    const { temaId, word } = req.body;
    if (!temaId || !word) return res.status(400).json({ msg: 'Faltan datos' });

    const user  = await User.findById(req.user._id);
    const db    = mongoose.connection.db;
    const curso = await db.collection('cursos').findOne({ nivel: user.englishLevel });
    const tema  = (curso?.temas || []).find(t => t.id === temaId);

    if (!tema) return res.status(404).json({ msg: 'Tema no encontrado' });

    // ── Chequeo de trial ────────────────────────────────────────────────────
    const trial = trialStatus(user);
    if (trial.expired) {
      return res.status(403).json({
        msg: 'Tu periodo de prueba gratuita ha terminado.',
        trialExpired: true,
      });
    }

    // ── Chequeo de límite diario (solo usuarios no premium) ─────────────────
    if (!user.isPremium && user.role !== 'admin') {
      const hoy = new Date();
      const dp  = user.dailyProgress || {};
      const mismoTema  = dp.topicId === temaId;
      const mismoDia   = dp.date && isSameDay(new Date(dp.date), hoy);

      if (mismoDia && !mismoTema) {
        return res.status(429).json({
          msg: 'Solo puedes avanzar en un tema por día en la versión gratuita. Vuelve mañana para continuar.',
          dailyLocked: true,
          dailyTopicId: dp.topicId,
        });
      }

      // Registrar el tema del día si es la primera práctica de hoy
      if (!mismoDia || !dp.topicId) {
        user.dailyProgress = { date: hoy, topicId: temaId };
      }
    }

    const palabrasDelTema = tema.vocabulario.map(v => v.en.toLowerCase().trim());
    if (!palabrasDelTema.includes(word.toLowerCase().trim()))
      return res.status(400).json({ msg: 'Palabra no pertenece a este tema' });

    const completadas = user.progresoTemas.get(temaId) || [];

    if (!completadas.map(w=>w.toLowerCase()).includes(word.toLowerCase().trim())) {
      completadas.push(word);
      user.progresoTemas.set(temaId, completadas);
      user.experiencePoints += 10;
      user.wordsCorrect += 1;
    }

    user.practiceCount = (user.practiceCount || 0) + 1;
    user.lastActive = new Date();

    const totalPalabras = tema.vocabulario.length;
    const temaCompleto  = completadas.length >= totalPalabras;

    const todosTemas    = curso.temas.map(t => t.id);
    const todosCompletos = todosTemas.every(id => {
      const prog = user.progresoTemas.get(id) || [];
      const tot  = curso.temas.find(t=>t.id===id)?.vocabulario?.length || 0;
      return prog.length >= tot;
    });

    await user.save();

    return res.json({
      ok: true,
      temaCompleto,
      todosCompletos,
      completadas:  completadas.length,
      totalPalabras,
      user,
    });
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.get('/progreso', auth, async function(req, res) {
  try {
    const user  = await User.findById(req.user._id);
    const db    = mongoose.connection.db;
    const curso = await db.collection('cursos').findOne({ nivel: user.englishLevel });
    if (!curso) return res.status(404).json({ msg: 'Curso no encontrado' });

    // Inicializar trialStartDate la primera vez que accede al aula
    let dirty = false;
    if (!user.trialStartDate && !user.isPremium && user.role !== 'admin') {
      user.trialStartDate = new Date();
      dirty = true;
    }
    if (dirty) await user.save();

    const temas = (curso.temas || []).map((t, idx) => {
      const completadas = user.progresoTemas.get(t.id) || [];
      const total       = t.vocabulario?.length || 0;
      const completo    = completadas.length >= total;
      const prevCompleto = idx === 0 ? true : (() => {
        const prev     = curso.temas[idx-1];
        const prevComp = user.progresoTemas.get(prev.id) || [];
        return prevComp.length >= (prev.vocabulario?.length || 0);
      })();
      return {
        id:                 t.id,
        titulo:             t.titulo,
        icono:              t.icono,
        total,
        completadas:        completadas.length,
        completo,
        desbloqueado:       prevCompleto,
        palabrasCompletadas: completadas,
      };
    });

    const todosCompletos = temas.every(t => t.completo);
    const yaAprobado     = (user.nivelesAprobados || []).includes(user.englishLevel);

    // Estado del trial y límite diario
    const trial = trialStatus(user);
    const hoy   = new Date();
    const dp    = user.dailyProgress || {};
    const dailyTopicId = (dp.date && isSameDay(new Date(dp.date), hoy)) ? (dp.topicId || '') : '';

    return res.json({
      nivel:            user.englishLevel,
      temas,
      todosCompletos,
      quizHabilitado:   todosCompletos && !yaAprobado,
      ultimoTema:       user.ultimoTema || '',
      experiencePoints: user.experiencePoints,
      wordsCorrect:     user.wordsCorrect,
      isPremium:        user.isPremium || false,
      trial: {
        expired:  trial.expired,
        daysLeft: trial.daysLeft,
        active:   trial.active,
      },
      dailyTopicId,
    });
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.post('/ultimo-tema', auth, async function(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, { ultimoTema: req.body.temaId || '' });
    return res.json({ ok: true });
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;