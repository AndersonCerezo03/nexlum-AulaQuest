const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generarToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

// POST /api/auth/registro
const registro = async (req, res) => {
  try {
    const { nombre, email, password, nivelIngles } = req.body;

    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });

    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    const user = await User.create({
      nombre,
      email,
      password,
      avatar: { nivelIngles: nivelIngles || 'A1', nombre }
    });

    const token = generarToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valido = await user.compararPassword(password);
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = generarToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  res.json(req.user);
};

module.exports = { registro, login, me };
