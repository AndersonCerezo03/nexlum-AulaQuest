const router = require('express').Router();
const auth   = require('../middleware/auth');

const N8N_URL     = process.env.N8N_INTERVIEW_URL || 'http://localhost:5678/webhook/interview';
const OPENAI_KEY  = process.env.OPENAI_API_KEY || '';

const MAX_MSG_LEN = 2000;

router.post('/message', auth, async function(req, res) {
  try {
    let { message, history, jobTitle, level } = req.body;

    message = typeof message === 'string' ? message.trim() : '';
    if (message.length > MAX_MSG_LEN)
      return res.status(400).json({ success: false, error: 'Mensaje demasiado largo' });
    if (!Array.isArray(history)) history = [];
    if (history.length > 40) history = history.slice(-40);
    jobTitle = (typeof jobTitle === 'string' ? jobTitle : 'Software Developer').slice(0, 120);
    level    = (typeof level === 'string' ? level : 'mid').slice(0, 20);

    const n8nRes = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, jobTitle, level }),
    });

    const n8nText = await n8nRes.text();
    if (!n8nRes.ok) return res.status(502).json({ success: false, error: 'n8n no disponible' });

    let data;
    try { data = JSON.parse(n8nText); }
    catch(e) { return res.status(502).json({ success: false, error: 'Respuesta invalida de n8n' }); }

    let audioBase64 = '';
    const speakText = (data.interviewer || '').toString().slice(0, 4000);
    if (OPENAI_KEY && speakText) {
      try {
        const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'tts-1', input: speakText, voice: 'onyx', response_format: 'mp3' }),
        });
        if (ttsRes.ok) {
          const arrayBuffer = await ttsRes.arrayBuffer();
          audioBase64 = Buffer.from(arrayBuffer).toString('base64');
        }
      } catch(e) {
        console.error('TTS error:', e.message);
      }
    }

    return res.json({
      success: true,
      interviewer: data.interviewer || '',
      feedback: data.feedback || '',
      score: data.score || null,
      isFinished: data.isFinished || false,
      audio: audioBase64,
    });

  } catch(err) {
    console.error('Interview error:', err.message);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
});

module.exports = router;