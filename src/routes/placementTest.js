const router = require('express').Router();
const auth   = require('../middleware/auth');
const PlacementTest = require('../models/PlacementTest');
const User   = require('../models/User');

const LEVEL_ORDER = ['A1','A2','B1','B2','C1','C2'];
const NIVEL_THRESHOLD = 0.6; // ≥60% de aciertos en un nivel para considerarlo "dominado" (diagnóstico)

// Categoría (área) para el desglose, derivada del tipo de pregunta
function categoriaDe(tipo) {
  if (tipo === 'image')         return 'imagenes';
  if (tipo === 'vocab')         return 'vocabulario';
  if (tipo === 'listening')     return 'listening';
  if (tipo === 'pronunciation') return 'pronunciacion';
  return 'gramatica'; // grammar, fill
}

// Nivel estimado = sube de nivel mientras domine cada uno (≥60%) en orden.
// Se detiene en el primer nivel que NO domina (evita sobreestimar por aciertos sueltos en niveles altos).
function estimarNivel(porNivel) {
  let estimado = 'A1';
  for (const n of LEVEL_ORDER) {
    const x = porNivel[n];
    if (x && x.t > 0 && x.c / x.t >= NIVEL_THRESHOLD) estimado = n;
    else break;
  }
  return estimado;
}

// GET /api/placement-test
// Devuelve el test de diagnóstico como lista ordenada (fácil → difícil): { preguntas: [...] }
router.get('/', auth, async function(req, res) {
  try {
    const doc = await PlacementTest.findOne();
    if (!doc) return res.status(404).json({ msg: 'Test de diagnóstico no encontrado. Ejecuta el seed.' });

    const preguntas = doc.preguntas.map(p => ({
      _id:    p._id,
      q:      p.q,
      opts:   p.opts || [],
      tipo:   p.tipo,
      nivel:  p.nivel,
      audio:  p.audio  || null,
      target: p.target || null,   // solo para pronunciación
      img:    p.img    || null,   // imagen alusiva (emoji)
      ans:    p.ans,              // el cliente lo usa para el feedback inmediato; el backend recalcula el diagnóstico
    }));

    return res.json({ preguntas });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// POST /api/placement-test/submit
// Body: { respuestas: [{ id, ans }] }  (pronunciación: ans=1 correcto, ans=0 incorrecto)
// Calcula el diagnóstico, lo guarda y SIEMPRE deja al alumno en el Aula 1 (A1).
router.post('/submit', auth, async function(req, res) {
  try {
    const { respuestas } = req.body;
    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json({ msg: 'Debes enviar tus respuestas.' });
    }

    const doc = await PlacementTest.findOne();
    if (!doc) return res.status(404).json({ msg: 'Test de diagnóstico no encontrado.' });

    const mapa = {};
    for (const p of doc.preguntas) mapa[p._id.toString()] = p;

    let puntaje = 0;
    const areas    = { imagenes:{c:0,t:0}, vocabulario:{c:0,t:0}, gramatica:{c:0,t:0}, listening:{c:0,t:0}, pronunciacion:{c:0,t:0} };
    const porNivel = {}; for (const n of LEVEL_ORDER) porNivel[n] = { c:0, t:0 };

    for (const r of respuestas) {
      const p = mapa[r.id];
      if (!p) continue;
      const correcto = p.tipo === 'pronunciation' ? r.ans === 1 : r.ans === p.ans;
      const cat = categoriaDe(p.tipo);
      areas[cat].t++;          if (correcto) areas[cat].c++;
      porNivel[p.nivel].t++;   if (correcto) porNivel[p.nivel].c++;
      if (correcto) puntaje++;
    }

    const total         = respuestas.length;
    const nivelEstimado = estimarNivel(porNivel);

    const diagnostico = { fecha: new Date(), puntaje, total, nivelEstimado, areas, porNivel };

    const user = await User.findById(req.user._id);
    user.diagnostico    = diagnostico;
    user.englishLevel   = 'A1';            // todos empiezan en el Aula 1; el test solo diagnostica
    user.levelAssigned  = true;
    user.trialStartDate = user.trialStartDate || new Date();
    user.markModified('diagnostico');
    await user.save();

    return res.json({ diagnostico, user });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
