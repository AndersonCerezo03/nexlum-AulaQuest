const router = require('express').Router();
const auth   = require('../middleware/auth');
const CityDistrict = require('../models/CityDistrict');
const CityMission  = require('../models/CityMission');
const CityTeam     = require('../models/CityTeam');
const CityProgress = require('../models/CityProgress');

// ─── AulaQuest City — API REST (estado + equipos) ───
// Lo que cambia en tiempo real (cartas, feed, SOS, puntos) va por Socket.io;
// aquí va la carga inicial y la gestión de equipos persistentes.

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0/I/1 para no confundir
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

// GET /api/city/state — todo lo necesario para pintar el juego
router.get('/state', auth, async function (req, res) {
  try {
    const [districts, missions, team] = await Promise.all([
      CityDistrict.find({}).sort({ orden: 1 }).lean(),
      CityMission.find({}).sort({ distrito: 1, orden: 1 }).lean(),
      CityTeam.findOne({ 'miembros.userId': req.user._id }).lean(),
    ]);
    let progress = await CityProgress.findOne({ userId: req.user._id }).lean();
    if (!progress) progress = (await CityProgress.create({ userId: req.user._id })).toObject();
    return res.json({ districts, missions, team, progress, userId: String(req.user._id) });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// POST /api/city/team — crear equipo { nombre }
router.post('/team', auth, async function (req, res) {
  try {
    const ya = await CityTeam.findOne({ 'miembros.userId': req.user._id });
    if (ya) return res.status(400).json({ msg: 'Ya estás en un equipo. Sal primero para crear otro.' });
    const nombre = String(req.body.nombre || '').trim().slice(0, 30);
    if (nombre.length < 3) return res.status(400).json({ msg: 'El nombre del equipo necesita al menos 3 letras.' });
    let code;
    do { code = genCode(); } while (await CityTeam.findOne({ code }));
    const team = await CityTeam.create({
      nombre, code,
      miembros: [{ userId: req.user._id, name: req.user.name }],
      feed: [{ tipo: 'join', texto: 'founded the team 🏙️', name: req.user.name, fecha: new Date() }],
    });
    await CityProgress.updateOne({ userId: req.user._id }, { teamId: team._id }, { upsert: true });
    return res.json({ team });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// POST /api/city/team/join — unirse con código { code }
router.post('/team/join', auth, async function (req, res) {
  try {
    const ya = await CityTeam.findOne({ 'miembros.userId': req.user._id });
    if (ya) return res.status(400).json({ msg: 'Ya estás en un equipo. Sal primero para cambiarte.' });
    const code = String(req.body.code || '').trim().toUpperCase();
    const team = await CityTeam.findOne({ code });
    if (!team) return res.status(404).json({ msg: 'Equipo no encontrado. Revisa el código.' });
    if (team.miembros.length >= 8) return res.status(400).json({ msg: 'El equipo está lleno (máx. 8).' });
    team.miembros.push({ userId: req.user._id, name: req.user.name });
    team.feed.push({ tipo: 'join', texto: 'joined the team 👋', name: req.user.name, fecha: new Date() });
    if (team.feed.length > 60) team.feed = team.feed.slice(-60);
    await team.save();
    await CityProgress.updateOne({ userId: req.user._id }, { teamId: team._id }, { upsert: true });
    return res.json({ team });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// POST /api/city/team/leave — salir del equipo
router.post('/team/leave', auth, async function (req, res) {
  try {
    const team = await CityTeam.findOne({ 'miembros.userId': req.user._id });
    if (!team) return res.status(404).json({ msg: 'No estás en ningún equipo.' });
    team.miembros = team.miembros.filter(m => String(m.userId) !== String(req.user._id));
    if (team.miembros.length === 0) await CityTeam.deleteOne({ _id: team._id });
    else {
      team.feed.push({ tipo: 'join', texto: 'left the team', name: req.user.name, fecha: new Date() });
      await team.save();
    }
    await CityProgress.updateOne({ userId: req.user._id }, { teamId: null });
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

module.exports = router;
