const router   = require('express').Router();
const User     = require('../models/User');
const auth     = require('../middleware/auth');
const mongoose = require('mongoose');

const TRIAL_DAYS = 10;

// ── Energía: 1 token se recarga cada 15 min, hasta el máximo ──
const REFILL_MS = 15 * 60 * 1000;
function refillEnergy(user) {
  if (user.isPremium || user.role === 'admin') { user.energyTokens = user.energyMax || 5; return; }
  const max = user.energyMax || 5;
  if (user.energyTokens == null) user.energyTokens = max;
  if (user.energyTokens >= max) { user.energyUpdatedAt = new Date(); return; }
  const base = user.energyUpdatedAt ? new Date(user.energyUpdatedAt).getTime() : Date.now();
  const ganados = Math.floor((Date.now() - base) / REFILL_MS);
  if (ganados > 0) {
    user.energyTokens = Math.min(max, user.energyTokens + ganados);
    user.energyUpdatedAt = new Date(base + ganados * REFILL_MS);
  }
}
function energyPayload(user) {
  const max = user.energyMax || 5;
  const ilimitado = user.isPremium || user.role === 'admin';
  let nextMs = 0;
  if (!ilimitado && user.energyTokens < max) {
    const base = user.energyUpdatedAt ? new Date(user.energyUpdatedAt).getTime() : Date.now();
    nextMs = Math.max(0, base + REFILL_MS - Date.now());
  }
  return { tokens: ilimitado ? max : user.energyTokens, max, nextMs, ilimitado };
}

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

// ─── POST /api/practice/ejemplo — oración de ejemplo + explicación de uso ───
// Mr. Alex enseña cada palabra EN CONTEXTO: una oración real, su traducción y
// cómo se usa/conjuga, explicado en español simple. Se genera UNA vez con
// OpenAI y queda cacheada en Mongo (las siguientes veces no cuesta nada).
const EjemploPalabra = require('../models/EjemploPalabra');

router.post('/ejemplo', auth, async function(req, res) {
  try {
    const en = String(req.body.en || '').trim();
    const es = String(req.body.es || '').trim();
    if (!en) return res.status(400).json({ msg: 'Falta la palabra' });

    // 1) Cache en Mongo
    const cached = await EjemploPalabra.findOne({ en });
    if (cached) return res.json({ frase: cached.frase, fraseEs: cached.fraseEs, explicacion: cached.explicacion });

    // 2) Generar con OpenAI (barato, una sola vez por palabra)
    const KEY = process.env.OPENAI_API_KEY;
    let frase = '', fraseEs = '', explicacion = '';
    if (KEY) {
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'Eres Mr. Alex, profesor de inglés para principiantes hispanohablantes. Respondes SOLO JSON válido.' },
              { role: 'user', content:
                'Palabra/frase en inglés: "' + en + '" (significa: "' + es + '").\n' +
                'Devuelve JSON con: {"frase": una oración de ejemplo MUY simple (nivel principiante, máx 8 palabras) usando exactamente esa palabra en una conversación real, ' +
                '"fraseEs": su traducción al español, ' +
                '"explicacion": 1-2 frases en español MUY simple explicando cómo se usa la palabra en la oración (si es verbo, cómo se conjuga: ej. "am se usa con I: I am = yo soy"; si es sustantivo/frase, cuándo se dice)}.' },
            ],
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const j = JSON.parse(d.choices[0].message.content);
          frase = String(j.frase || '').slice(0, 140);
          fraseEs = String(j.fraseEs || '').slice(0, 140);
          explicacion = String(j.explicacion || '').slice(0, 260);
        }
      } catch (e) { /* cae al fallback */ }
    }
    // 3) Fallback sin IA: plantilla básica
    if (!frase) {
      frase = 'I say "' + en + '" every day.';
      fraseEs = 'Digo "' + en + '" todos los días.';
      explicacion = '"' + en + '" significa "' + es + '". Úsala en tus conversaciones en inglés.';
    }
    await EjemploPalabra.create({ en, es, frase, fraseEs, explicacion }).catch(() => {});
    return res.json({ frase, fraseEs, explicacion });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// ─── GET /api/practice/energy — saldo de tokens ───
router.get('/energy', auth, async function(req, res) {
  try {
    const user = await User.findById(req.user._id);
    refillEnergy(user); await user.save();
    return res.json(energyPayload(user));
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ─── POST /api/practice/energy/spend — gasta 1 token (al equivocarse) ───
router.post('/energy/spend', auth, async function(req, res) {
  try {
    const user = await User.findById(req.user._id);
    refillEnergy(user);
    const ilimitado = user.isPremium || user.role === 'admin';
    let ok = true;
    if (!ilimitado) {
      if (user.energyTokens <= 0) ok = false;
      else { user.energyTokens -= 1; if (user.energyUpdatedAt == null) user.energyUpdatedAt = new Date(); }
    }
    await user.save();
    return res.json(Object.assign({ ok }, energyPayload(user)));
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ─── POST /api/practice/frase — reto "completa la frase" (usar lo aprendido) ───
// Genera con OpenAI una frase con un hueco {en} + 3 opciones; cacheada por palabra.
const FraseReto = require('mongoose').models.FraseReto || require('mongoose').model('FraseReto', new (require('mongoose').Schema)({
  en: { type: String, unique: true }, prompt: String, promptEs: String, opts: [String], ans: Number,
  explic: String,
}, { timestamps: true }));

router.post('/frase', auth, async function(req, res) {
  try {
    const en = String(req.body.en || '').trim();
    const es = String(req.body.es || '').trim();
    if (!en) return res.status(400).json({ msg: 'Falta la palabra' });
    const cached = await FraseReto.findOne({ en });
    if (cached) return res.json({ prompt: cached.prompt, promptEs: cached.promptEs, opts: cached.opts, ans: cached.ans, explic: cached.explic });

    const KEY = process.env.OPENAI_API_KEY;
    let out = null;
    if (KEY) {
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini', temperature: 0.4, response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'Eres Mr. Alex, profesor de inglés para principiantes. Respondes SOLO JSON válido.' },
              { role: 'user', content:
                'Palabra en inglés: "' + en + '" (significa "' + es + '").\n' +
                'Crea un ejercicio de "completa la frase" para practicar CÓMO USARLA en una conversación real.\n' +
                'JSON: {"prompt": una frase corta en inglés con un hueco marcado como "___" donde va "' + en + '" (ej: "___, how are you?"), ' +
                '"promptEs": la traducción de la frase completa al español, ' +
                '"opts": array de 3 opciones en inglés donde SOLO UNA es "' + en + '" y las otras 2 son distractores plausibles del mismo tipo, ' +
                '"ans": el índice (0-2) de la opción correcta "' + en + '", ' +
                '"explic": 1 frase MUY simple en español explicando por qué esa palabra completa la frase}.' },
            ],
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const j = JSON.parse(d.choices[0].message.content);
          if (j && Array.isArray(j.opts) && j.opts.length === 3 && typeof j.ans === 'number') {
            out = { prompt: String(j.prompt || '').slice(0, 120), promptEs: String(j.promptEs || '').slice(0, 140), opts: j.opts.map(o => String(o).slice(0, 40)), ans: j.ans, explic: String(j.explic || '').slice(0, 200) };
          }
        }
      } catch (e) {}
    }
    if (!out) {
      // Fallback sin IA
      const distract = ['Goodbye', 'Please', 'Thanks'].filter(x => x.toLowerCase() !== en.toLowerCase()).slice(0, 2);
      const opts = [en, distract[0] || 'Please', distract[1] || 'Thanks'];
      out = { prompt: '___ (' + es + ')', promptEs: 'Completa con la palabra correcta.', opts, ans: 0, explic: '"' + en + '" significa "' + es + '".' };
    }
    await FraseReto.create(Object.assign({ en }, out)).catch(() => {});
    return res.json(out);
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

module.exports = router;