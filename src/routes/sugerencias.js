// Buzón de sugerencias — envía el mensaje directo al correo de NexLum
const express = require('express');
const router  = express.Router();
const { enviarCorreo, plantilla } = require('../utils/mailer');

const DESTINO = 'hola@nexlum.co';

// Anti-spam sencillo: máximo 1 sugerencia por IP por minuto
const ultimas = new Map();

router.post('/', async function (req, res) {
  try {
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'x').split(',')[0].trim();
    const antes = ultimas.get(ip) || 0;
    if (Date.now() - antes < 60000) {
      return res.status(429).json({ msg: 'Espera un momento antes de enviar otra sugerencia.' });
    }

    const nombre  = String(req.body.nombre || '').trim().slice(0, 80) || 'Anónimo';
    const email   = String(req.body.email  || '').trim().slice(0, 120);
    const mensaje = String(req.body.mensaje|| '').trim().slice(0, 2000);
    if (mensaje.length < 5) return res.status(400).json({ msg: 'Escribe tu sugerencia (mínimo 5 caracteres).' });

    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = plantilla(
      '💡 Nueva sugerencia — AulaQuest',
      '<b>De:</b> ' + esc(nombre) + (email ? ' (' + esc(email) + ')' : '') + '<br>' +
      '<b>Fecha:</b> ' + new Date().toLocaleString('es-CO') + '<br><br>' +
      '<b>Sugerencia:</b><br>' + esc(mensaje).replace(/\n/g, '<br>'),
      null, null
    );
    await enviarCorreo(DESTINO, '💡 Sugerencia de ' + nombre + ' — AulaQuest', html);
    ultimas.set(ip, Date.now());
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ msg: 'No se pudo enviar. Intenta de nuevo.' });
  }
});

module.exports = router;
