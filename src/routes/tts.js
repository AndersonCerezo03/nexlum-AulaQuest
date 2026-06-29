const router = require('express').Router();
const auth   = require('../middleware/auth');

// Voz de Mr. Alex con OpenAI TTS — clara y entendible para los aprendices.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VOICE_MRALEX   = 'onyx';     // voz masculina clara (alloy, echo, fable, onyx, nova, shimmer)
const TTS_MODEL      = 'tts-1';    // rápido y económico (tts-1-hd = más calidad, más caro)

// Genera audio MP3 con OpenAI. La velocidad fina la ajusta el frontend con playbackRate.
async function synthesize(text, lang) {
  const speed = lang === 'en-slow' ? 0.75 : 1.0; // 0.25–4.0 (1.0 = normal)
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + OPENAI_API_KEY,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:           TTS_MODEL,
      input:           text,
      voice:           VOICE_MRALEX,
      speed,
      response_format: 'mp3',
    }),
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
