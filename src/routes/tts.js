const router = require('express').Router();
const auth   = require('../middleware/auth');

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_EN = 'Ix8C14HEHgIQkJswik2o'; // El profesor de lenguas filosóficas — Mr. Alex (pronunciación clara)
const VOICE_ES = 'Ix8C14HEHgIQkJswik2o'; // misma voz de Mr. Alex para mantener consistencia

async function synthesize(text, voiceId, lang, speed) {
  const spd = lang === 'en-slow' ? 0.30 : (speed || 0.42);
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key':   ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability:        1.0,
          similarity_boost: 1.0,
          speed:            spd,
          style:            0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!response.ok) throw new Error('TTS error ' + lang);
  return response.arrayBuffer();
}

// POST /api/tts/speak — texto en inglés
router.post('/speak', auth, async function(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Falta el texto' });
    const buf = await synthesize(text, VOICE_EN, 'en');
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
    const buf = await synthesize(text, VOICE_ES, 'es');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buf));
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

// POST /api/tts/speak-slow — modo tortuga, super lento
router.post('/speak-slow', auth, async function(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Falta el texto' });
    const buf = await synthesize(text, VOICE_EN, 'en-slow');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buf));
  } catch(err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;