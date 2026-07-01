const router = require('express').Router();
const auth   = require('../middleware/auth');

// Voz de Mr. Alex con OpenAI TTS — clara y con pronunciación correcta en inglés.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// gpt-4o-mini-tts permite guiar estilo y pronunciación con "instructions".
// Configurables por env para probar voces/modelo sin redeploy.
const TTS_MODEL    = process.env.TTS_MODEL || 'gpt-4o-mini-tts';
const VOICE_MRALEX = process.env.TTS_VOICE || 'onyx'; // alloy, echo, nova, onyx, shimmer, fable...

// Instrucciones de estilo por idioma. IMPORTANTE: nunca se mezcla ES/EN en un
// mismo audio — el inglés se sintetiza con instrucción en inglés y el español
// aparte, para que la pronunciación no se dañe.
const INSTR_EN =
  'Speak in clear, natural American English with correct, precise pronunciation. ' +
  'You are a friendly English teacher for beginner Spanish-speaking students. ' +
  'Articulate each word clearly at a calm, steady pace so learners can understand and repeat after you.';

const INSTR_EN_SLOW =
  'Speak in very clear, natural American English with correct pronunciation. ' +
  'You are an English teacher for absolute beginners. Speak slowly and gently, ' +
  'articulating every syllable and pausing slightly between words so students can repeat after you.';

const INSTR_ES =
  'Habla en espanol latinoamericano neutro, claro y calido, como un profesor amable ' +
  'que explica a sus estudiantes. Pronuncia con naturalidad y a un ritmo tranquilo.';

function instructionsFor(lang) {
  if (lang === 'es')      return INSTR_ES;
  if (lang === 'en-slow') return INSTR_EN_SLOW;
  return INSTR_EN;
}

// Genera audio MP3 con OpenAI. La velocidad fina la ajusta el frontend con playbackRate.
async function synthesize(text, lang) {
  const body = {
    model:           TTS_MODEL,
    input:           text,
    voice:           VOICE_MRALEX,
    response_format: 'mp3',
  };
  // gpt-4o-mini-tts usa "instructions" (no soporta "speed").
  // tts-1 / tts-1-hd usan "speed" (no soportan "instructions").
  if (TTS_MODEL === 'gpt-4o-mini-tts') {
    body.instructions = instructionsFor(lang);
  } else {
    body.speed = lang === 'en-slow' ? 0.75 : 1.0; // 0.25–4.0 (1.0 = normal)
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + OPENAI_API_KEY,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.text()).slice(0, 200); } catch (e) {}
    throw new Error('TTS error ' + lang + ' (' + response.status + ') ' + detail);
  }
  return response.arrayBuffer();
}

// POST /api/tts/speak — texto en inglés
router.post('/speak', auth, async function(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Falta el texto' });
    const buf = await synthesize(text, 'en');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buf));
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

// POST /api/tts/speak-es — texto en español
router.post('/speak-es', auth, async function(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Falta el texto' });
    const buf = await synthesize(text, 'es');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buf));
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

// POST /api/tts/speak-slow — modo tortuga, súper lento
router.post('/speak-slow', auth, async function(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Falta el texto' });
    const buf = await synthesize(text, 'en-slow');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buf));
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
