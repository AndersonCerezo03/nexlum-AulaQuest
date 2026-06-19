const router    = require('express').Router();
const auth      = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const User      = require('../models/User');
const mongoose  = require('mongoose');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const MAX_MSG_LEN = 1500;

const LANGUAGES = {
  en: { name: 'Inglés',   flag: '🇬🇧', available: true  },
  fr: { name: 'Francés',  flag: '🇫🇷', available: false },
  de: { name: 'Alemán',   flag: '🇩🇪', available: false },
  pt: { name: 'Portugués',flag: '🇧🇷', available: false },
  it: { name: 'Italiano', flag: '🇮🇹', available: false },
};

const limiterChat = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, msg: 'Demasiados mensajes al asistente. Espera unos minutos.' });

async function buildUserContext(user) {
  const db = mongoose.connection.db;
  const lang = user.learningLanguage || 'en';
  const langInfo = LANGUAGES[lang] || LANGUAGES.en;

  let temasResumen = 'Sin datos de curso.';
  try {
    const curso = await db.collection('cursos').findOne({ nivel: user.englishLevel });
    if (curso?.temas) {
      const temas = curso.temas.map((t, idx) => {
        const completadas = (user.progresoTemas?.get?.(t.id) || user.progresoTemas?.[t.id] || []).length;
        const total = t.vocabulario?.length || 0;
        const completo = completadas >= total;
        const prevCompleto = idx === 0 ? true : (() => {
          const prev = curso.temas[idx - 1];
          const prevComp = (user.progresoTemas?.get?.(prev.id) || user.progresoTemas?.[prev.id] || []).length;
          return prevComp >= (prev.vocabulario?.length || 0);
        })();
        return `- ${t.titulo}: ${completadas}/${total} palabras${completo ? ' (completo)' : ''}${!prevCompleto ? ' (bloqueado)' : ''}`;
      });
      temasResumen = temas.join('\n');
    }
  } catch (_) {}

  const nivelesAprobados = (user.nivelesAprobados || []).join(', ') || 'ninguno';
  const ultimoTema = user.ultimoTema || 'ninguno';

  return {
    name: user.name,
    level: user.englishLevel,
    xp: user.experiencePoints || 0,
    wordsCorrect: user.wordsCorrect || 0,
    nivelesAprobados,
    ultimoTema,
    temasResumen,
    learningLanguage: lang,
    languageName: langInfo.name,
    languageAvailable: langInfo.available,
  };
}

function buildSystemPrompt(ctx) {
  const langNote = ctx.languageAvailable
    ? `El estudiante aprende ${ctx.languageName} (contenido completo disponible en la app).`
    : `El estudiante eligió aprender ${ctx.languageName}, pero ese idioma aún no tiene contenido en la app. Solo inglés está disponible por ahora. Explícale amablemente que puede practicar inglés mientras preparamos ${ctx.languageName}, y que su preferencia quedó guardada.`;

  return `Eres Aria, la guía inteligente de AulaQuest (plataforma de Nexlum Software para aprender idiomas).

Tu rol:
- Responder dudas sobre cómo usar la app, el proceso de aprendizaje y las funciones.
- Guiar al estudiante según su progreso real.
- Ayudar a elegir o cambiar el idioma que quiere aprender.
- Responder en español claro y amable (a menos que el estudiante pida otro idioma para la conversación).
- Respuestas concisas: 2-4 párrafos cortos máximo. Usa viñetas cuando ayude.

Contexto del estudiante:
- Nombre: ${ctx.name}
- Nivel CEFR actual: ${ctx.level}
- XP: ${ctx.xp} | Palabras acertadas: ${ctx.wordsCorrect}
- Niveles aprobados: ${ctx.nivelesAprobados}
- Último tema visitado: ${ctx.ultimoTema}
- ${langNote}

Progreso por tema (nivel ${ctx.level}):
${ctx.temasResumen}

Cómo funciona AulaQuest:
1. Elige un tema de vocabulario y practica con Mr. Alex (tutor de voz): pronuncia palabras en inglés y gana XP (+10 por palabra).
2. Los temas se desbloquean en orden: hay que completar el anterior para abrir el siguiente.
3. Al completar TODOS los temas de un nivel, se habilita el Quiz de avance. Hay que sacar mínimo 7/10 para subir de nivel.
4. Minijuegos (memoria, lluvia de palabras, etc.) se desbloquean al completar ciertos temas según el nivel.
5. En nivel C2 hay entrevistas de trabajo con IA (AI Teacher, NEXA, Michael).
6. El panel admin (solo administradores) muestra estadísticas de estudiantes.

Idiomas disponibles para aprender:
- 🇬🇧 Inglés — disponible (6 niveles A1–C2)
- 🇫🇷 Francés — próximamente
- 🇩🇪 Alemán — próximamente
- 🇧🇷 Portugués — próximamente
- 🇮🇹 Italiano — próximamente

Si preguntan por soporte técnico, pagos o información comercial, sugiere el botón de WhatsApp de Nexlum.

No inventes datos que no tengas. Si no sabes algo, dilo con honestidad.`;
}

router.get('/languages', auth, function(_req, res) {
  const list = Object.entries(LANGUAGES).map(([code, info]) => ({
    code, name: info.name, flag: info.flag, available: info.available,
  }));
  return res.json({ languages: list, current: _req.user.learningLanguage || 'en' });
});

router.put('/language', auth, async function(req, res) {
  try {
    const code = (req.body.language || '').toLowerCase().trim();
    if (!LANGUAGES[code]) return res.status(400).json({ success: false, error: 'Idioma no válido' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { learningLanguage: code },
      { new: true }
    ).select('-password');

    const info = LANGUAGES[code];
    return res.json({
      success: true,
      language: code,
      name: info.name,
      available: info.available,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/chat', auth, limiterChat, async function(req, res) {
  try {
    if (!OPENAI_KEY) {
      return res.status(503).json({ success: false, error: 'Asistente no configurado (falta OPENAI_API_KEY)' });
    }

    let { message, history } = req.body;
    message = typeof message === 'string' ? message.trim() : '';
    if (!message) return res.status(400).json({ success: false, error: 'Mensaje vacío' });
    if (message.length > MAX_MSG_LEN) return res.status(400).json({ success: false, error: 'Mensaje demasiado largo' });
    if (!Array.isArray(history)) history = [];
    if (history.length > 20) history = history.slice(-20);

    const user = await User.findById(req.user._id);
    const ctx  = await buildUserContext(user);
    const systemPrompt = buildSystemPrompt(ctx);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string').slice(-16),
      { role: 'user', content: message },
    ];

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENAI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    const aiText = await aiRes.text();
    if (!aiRes.ok) {
      console.error('Guide OpenAI error:', aiText.slice(0, 200));
      return res.status(502).json({ success: false, error: 'Error del asistente IA' });
    }

    let data;
    try { data = JSON.parse(aiText); } catch (_) {
      return res.status(502).json({ success: false, error: 'Respuesta inválida del asistente' });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || 'No pude generar una respuesta. Intenta de nuevo.';

    return res.json({
      success: true,
      reply,
      learningLanguage: ctx.learningLanguage,
      languageName: ctx.languageName,
    });
  } catch (err) {
    console.error('Guide chat error:', err.message);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
});

module.exports = router;
