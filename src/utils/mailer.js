// Mailer con Resend (API HTTP) — funciona en Render (no usa puertos SMTP bloqueados)
// Mantiene las mismas funciones: enviarCorreo(to, subject, html) y plantilla(...)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Remitente: si no verificas dominio, Resend solo permite onboarding@resend.dev
const FROM = process.env.MAIL_FROM || 'AulaQuest <onboarding@resend.dev>';

async function enviarCorreo(to, subject, html) {
  // Si hay API key de Resend, envia por su API
  if (RESEND_API_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM, to: [to], subject: subject, html: html }),
      });

      if (resp.ok) {
        console.log('📧  Correo enviado a ' + to + ' — ' + subject);
        return { sent: true };
      } else {
        const errText = await resp.text();
        console.error('❌ Resend error (' + resp.status + '): ' + errText);
        return { sent: false, error: errText };
      }
    } catch (e) {
      console.error('❌ Error enviando con Resend: ' + e.message);
      return { sent: false, error: e.message };
    }
  }

  // Sin API key: modo consola (desarrollo)
  console.log('\n================ CORREO (modo dev, sin RESEND_API_KEY) ================');
  console.log('Para:    ' + to);
  console.log('Asunto:  ' + subject);
  console.log('Cuerpo:  ' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('======================================================================\n');
  return { sent: false, dev: true };
}

function plantilla(titulo, texto, urlBoton, textoBoton) {
  return (
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0d1117;color:#e2e8f0;border-radius:12px">' +
      '<h2 style="color:#6366f1;margin:0 0 12px">🎓 AulaQuest</h2>' +
      '<h3 style="margin:0 0 8px">' + titulo + '</h3>' +
      '<p style="color:#94a3b8;line-height:1.5">' + texto + '</p>' +
      (urlBoton ?
        '<a href="' + urlBoton + '" style="display:inline-block;margin-top:16px;background:#6366f1;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">' + (textoBoton || 'Continuar') + '</a>' +
        '<p style="color:#64748b;font-size:12px;margin-top:16px">Si el boton no funciona, copia este enlace:<br>' + urlBoton + '</p>'
        : '') +
    '</div>'
  );
}

module.exports = { enviarCorreo, plantilla };