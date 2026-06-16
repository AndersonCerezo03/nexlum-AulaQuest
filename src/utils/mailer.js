let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { /* no instalado: modo consola */ }

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM      = process.env.MAIL_FROM || 'AulaQuest <no-reply@aulaquest.com>';

let transporter = null;
if (nodemailer && SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function enviarCorreo(to, subject, html) {
  if (transporter) {
    await transporter.sendMail({ from: FROM, to: to, subject: subject, html: html });
    console.log('📧  Correo enviado a ' + to + ' — ' + subject);
    return { sent: true };
  }
  console.log('\n================ CORREO (modo dev, sin SMTP) ================');
  console.log('Para:    ' + to);
  console.log('Asunto:  ' + subject);
  console.log('Cuerpo:  ' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('============================================================\n');
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