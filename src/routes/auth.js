const router  = require('express').Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const auth    = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const { validarEmail, validarPassword, validarNombre, validarNivel } = require('../utils/validators');
const { enviarCorreo, plantilla } = require('../utils/mailer');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const REQUIRE_VERIFY = String(process.env.REQUIRE_EMAIL_VERIFICATION || 'false') === 'true';

const MAX_FAILED = 5;
const LOCK_MS    = 15 * 60 * 1000;

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const sha256    = (s) => crypto.createHash('sha256').update(s).digest('hex');

const limiterRegistro = rateLimit({ windowMs: 15*60*1000, max: 10, msg: 'Demasiados registros desde esta red. Espera unos minutos.' });
const limiterLogin    = rateLimit({ windowMs: 15*60*1000, max: 15, msg: 'Demasiados intentos de inicio de sesion. Espera unos minutos.' });
const limiterReset    = rateLimit({ windowMs: 15*60*1000, max: 8,  msg: 'Demasiadas solicitudes. Espera unos minutos.' });

router.post('/register', limiterRegistro, async function(req, res) {
  try {
    const name  = (req.body.name || '').trim();
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';
    const englishLevel = req.body.englishLevel || 'A1';

    const eNombre = validarNombre(name);     if (eNombre) return res.status(400).json({ msg: eNombre });
    const eEmail  = validarEmail(email);     if (eEmail)  return res.status(400).json({ msg: eEmail });
    const ePass   = validarPassword(password); if (ePass) return res.status(400).json({ msg: ePass });
    if (!validarNivel(englishLevel)) return res.status(400).json({ msg: 'Nivel de ingles invalido' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Ese correo ya esta registrado' });

    const rawVerify = crypto.randomBytes(32).toString('hex');
    const u = new User({
      name, email, password, englishLevel,
      verifyToken: sha256(rawVerify),
      verifyTokenExp: new Date(Date.now() + 24*60*60*1000),
      emailVerified: false,
    });
    const saved = await u.save();

    const url = APP_URL + '/?verify=' + rawVerify;
    await enviarCorreo(
      email,
      'Confirma tu cuenta en AulaQuest',
      plantilla('Bienvenido, ' + name + ' 👋', 'Gracias por registrarte. Confirma tu correo para activar tu cuenta. El enlace vence en 24 horas.', url, 'Confirmar mi cuenta')
    );

    if (REQUIRE_VERIFY) {
      return res.status(201).json({ msg: 'Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesion.', needVerify: true });
    }
    const token = signToken(saved._id);
    return res.status(201).json({ token, user: saved, msg: 'Cuenta creada. Te enviamos un correo de confirmacion.' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.post('/login', limiterLogin, async function(req, res) {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';
    if (!email || !password) return res.status(400).json({ msg: 'Correo y contraseña requeridos' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: 'Credenciales incorrectas' });

    if (user.isLocked()) {
      const min = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ msg: 'Cuenta bloqueada temporalmente por seguridad. Intenta en ' + min + ' min.' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      user.failedLogins = (user.failedLogins || 0) + 1;
      if (user.failedLogins >= MAX_FAILED) {
        user.lockUntil = new Date(Date.now() + LOCK_MS);
        user.failedLogins = 0;
        await user.save();
        return res.status(423).json({ msg: 'Demasiados intentos fallidos. Cuenta bloqueada 15 minutos por seguridad.' });
      }
      await user.save();
      const restantes = MAX_FAILED - user.failedLogins;
      return res.status(401).json({ msg: 'Credenciales incorrectas. Te quedan ' + restantes + ' intento(s).' });
    }

    if (REQUIRE_VERIFY && !user.emailVerified && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Debes confirmar tu correo antes de iniciar sesion.', needVerify: true });
    }

    user.failedLogins = 0;
    user.lockUntil = undefined;
    user.lastActive = new Date();
    await user.save();

    const token = signToken(user._id);
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.get('/verify/:token', async function(req, res) {
  try {
    const hashed = sha256(req.params.token || '');
    const user = await User.findOne({ verifyToken: hashed, verifyTokenExp: { $gt: new Date() } });
    if (!user) return res.status(400).json({ msg: 'Enlace de verificacion invalido o vencido' });

    user.emailVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExp = undefined;
    await user.save();
    return res.json({ msg: 'Correo confirmado correctamente. Ya puedes iniciar sesion.' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.post('/resend-verify', limiterReset, async function(req, res) {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const user = await User.findOne({ email });
    const generico = { msg: 'Si la cuenta existe y no esta confirmada, te enviamos un nuevo correo.' };
    if (!user || user.emailVerified) return res.json(generico);

    const rawVerify = crypto.randomBytes(32).toString('hex');
    user.verifyToken = sha256(rawVerify);
    user.verifyTokenExp = new Date(Date.now() + 24*60*60*1000);
    await user.save();

    const url = APP_URL + '/?verify=' + rawVerify;
    await enviarCorreo(email, 'Confirma tu cuenta en AulaQuest',
      plantilla('Confirma tu correo', 'Usa este enlace para activar tu cuenta (vence en 24h).', url, 'Confirmar mi cuenta'));
    return res.json(generico);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.post('/forgot-password', limiterReset, async function(req, res) {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const generico = { msg: 'Si el correo existe, te enviamos instrucciones para recuperar tu contraseña.' };
    const eEmail = validarEmail(email);
    if (eEmail) return res.json(generico);

    const user = await User.findOne({ email });
    if (!user) return res.json(generico);

    const rawReset = crypto.randomBytes(32).toString('hex');
    user.resetToken = sha256(rawReset);
    user.resetTokenExp = new Date(Date.now() + 60*60*1000);
    await user.save();

    const url = APP_URL + '/?reset=' + rawReset;
    await enviarCorreo(email, 'Recupera tu contraseña — AulaQuest',
      plantilla('Restablecer contraseña', 'Pediste recuperar tu contraseña. Este enlace vence en 1 hora. Si no fuiste tu, ignora este correo.', url, 'Crear nueva contraseña'));
    return res.json(generico);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.post('/reset-password', limiterReset, async function(req, res) {
  try {
    const token = req.body.token || '';
    const password = req.body.password || '';

    const ePass = validarPassword(password);
    if (ePass) return res.status(400).json({ msg: ePass });

    const hashed = sha256(token);
    const user = await User.findOne({ resetToken: hashed, resetTokenExp: { $gt: new Date() } });
    if (!user) return res.status(400).json({ msg: 'Enlace de recuperacion invalido o vencido' });

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExp = undefined;
    user.failedLogins = 0;
    user.lockUntil = undefined;
    await user.save();
    return res.json({ msg: 'Contraseña actualizada. Ya puedes iniciar sesion.' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.get('/user', auth, function(req, res) {
  return res.json(req.user);
});

module.exports = router;