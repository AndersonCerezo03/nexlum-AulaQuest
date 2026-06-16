const Mision = require('../models/Mision');
const User   = require('../models/User');

// GET /api/misiones?nivel=A1&habilidad=conversacion
const getMisiones = async (req, res) => {
  try {
    const filtro = { activa: true };
    if (req.query.nivel)     filtro.nivel     = req.query.nivel;
    if (req.query.habilidad) filtro.habilidad = req.query.habilidad;

    const misiones = await Mision.find(filtro).select('-ejercicios');
    res.json(misiones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/misiones/:id
const getMision = async (req, res) => {
  try {
    const mision = await Mision.findById(req.params.id);
    if (!mision) return res.status(404).json({ error: 'Misión no encontrada' });
    res.json(mision);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/misiones/:id/completar
const completarMision = async (req, res) => {
  try {
    const mision = await Mision.findById(req.params.id);
    if (!mision) return res.status(404).json({ error: 'Misión no encontrada' });

    const user = req.user;
    const nivel = mision.nivel;

    // Evitar duplicado
    if (!user.progreso[nivel]) user.progreso[nivel] = { xp: 0, misionesCompletadas: [] };
    if (user.progreso[nivel].misionesCompletadas.includes(mision._id.toString()))
      return res.status(400).json({ error: 'Misión ya completada' });

    // Sumar XP
    user.progreso[nivel].xp = (user.progreso[nivel].xp || 0) + mision.xpRecompensa;
    user.progreso[nivel].misionesCompletadas.push(mision._id.toString());
    user.avatar.xp += mision.xpRecompensa;

    await user.save();
    res.json({
      mensaje: `¡Misión completada! +${mision.xpRecompensa} XP`,
      xpGanado: mision.xpRecompensa,
      xpTotal: user.avatar.xp,
      progreso: user.progreso[nivel]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/misiones  (solo admin — seed de misiones)
const crearMision = async (req, res) => {
  try {
    const mision = await Mision.create(req.body);
    res.status(201).json(mision);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMisiones, getMision, completarMision, crearMision };
