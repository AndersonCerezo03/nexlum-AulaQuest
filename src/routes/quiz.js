const router = require('express').Router();
const auth   = require('../middleware/auth');
const Quiz   = require('../models/Quiz');
const User   = require('../models/User');

const LEVEL_ORDER = ['A1','A2','B1','B2','C1','C2'];

// GET /api/quiz/:nivel
router.get('/:nivel', auth, async function(req, res) {
  try {
    const nivel = req.params.nivel.toUpperCase();
    const quiz = await Quiz.findOne({ nivel });
    if (!quiz) return res.status(404).json({ msg: 'Quiz no encontrado para nivel ' + nivel });

    const shuffled = [...quiz.preguntas].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, quiz.totalPregs);

    return res.json({
      nivel:       quiz.nivel,
      nivelTarget: quiz.nivelTarget,
      titulo:      quiz.titulo,
      descripcion: quiz.descripcion,
      minScore:    quiz.minScore,
      totalPregs:  quiz.totalPregs,
      preguntas:   selected.map(q => ({
        _id:  q._id,
        q:    q.q,
        opts: q.opts,
        ans:  q.ans,
        tipo: q.tipo,
      })),
    });
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

// POST /api/quiz/:nivel/submit
router.post('/:nivel/submit', auth, async function(req, res) {
  try {
    const nivel = req.params.nivel.toUpperCase();
    const { preguntasIds, respuestas } = req.body;

    const quiz = await Quiz.findOne({ nivel });
    if (!quiz) return res.status(404).json({ msg: 'Quiz no encontrado' });

    let correctas = 0;
    const detalle = preguntasIds.map((id, i) => {
      const q = quiz.preguntas.id(id);
      if (!q) return { pregunta: '?', tuRespuesta: '?', correcta: '?', ok: false };
      const ok = respuestas[i] === q.ans;
      if (ok) correctas++;
      return {
        pregunta:    q.q,
        tuRespuesta: q.opts[respuestas[i]] || '—',
        correcta:    q.opts[q.ans],
        ok,
      };
    });

    const passed = correctas >= quiz.minScore;
    let user = req.user;

    if (passed) {
      const currentIdx = LEVEL_ORDER.indexOf(user.englishLevel);
      const targetIdx  = LEVEL_ORDER.indexOf(quiz.nivelTarget);
      // Solo sube de nivel si es el siguiente inmediato y aún no lo tiene
      const updates = {};
      if (targetIdx === currentIdx + 1) {
        updates.englishLevel = quiz.nivelTarget;
      }
      // Registrar nivel aprobado
      if (!user.nivelesAprobados) user.nivelesAprobados = [];
      if (!user.nivelesAprobados.includes(nivel)) {
        updates.$addToSet = { nivelesAprobados: nivel };
      }
      user = await User.findByIdAndUpdate(
        user._id,
        { ...updates },
        { new: true }
      );
    }

    return res.json({
      passed,
      correctas,
      total:    quiz.totalPregs,
      minScore: quiz.minScore,
      pct:      Math.round((correctas / quiz.totalPregs) * 100),
      detalle,
      user: passed ? user : null,
    });
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;