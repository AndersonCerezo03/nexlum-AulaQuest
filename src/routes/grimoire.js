const router = require('express').Router();
const auth   = require('../middleware/auth');
const GrimoireCard   = require('../models/GrimoireCard');
const GrimoirePlayer = require('../models/GrimoirePlayer');

function ligaDeElo(e) { return e >= 1800 ? 'Archimago' : e >= 1500 ? 'Diamante' : e >= 1300 ? 'Oro' : e >= 1100 ? 'Plata' : 'Bronce'; }
function pubCard(c) { return { cardId: c.cardId, school: c.school, nombre: c.nombre, tipo: c.tipo, valor: c.valor, rareza: c.rareza, segundos: c.segundos }; }

// GET /api/grimoire/me — perfil, colección, mazo y cartas base
router.get('/me', auth, async function (req, res) {
  try {
    let gp = await GrimoirePlayer.findOne({ userId: req.user._id });
    if (!gp) gp = await GrimoirePlayer.create({ userId: req.user._id });
    const cards = await GrimoireCard.find({}).lean();
    // pool jugable: todas las comunes + las desbloqueadas por el jugador
    const owned = new Set(gp.coleccion);
    const pool = cards.filter(c => c.rareza === 'common' || owned.has(c.cardId)).map(pubCard);
    return res.json({
      elo: gp.elo, liga: ligaDeElo(gp.elo), wins: gp.wins, losses: gp.losses,
      mazo: gp.mazo, coleccion: gp.coleccion, historial: gp.historial.slice(0, 15),
      pool, total: cards.length,
    });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// POST /api/grimoire/deck — guardar mazo activo { cardIds:[8] }
router.post('/deck', auth, async function (req, res) {
  try {
    const ids = Array.isArray(req.body.cardIds) ? req.body.cardIds.slice(0, 8) : [];
    await GrimoirePlayer.updateOne({ userId: req.user._id }, { mazo: ids }, { upsert: true });
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// GET /api/grimoire/leaderboard — ranking global C1 por ELO
router.get('/leaderboard', auth, async function (req, res) {
  try {
    const top = await GrimoirePlayer.find({}).sort({ elo: -1 }).limit(20).populate('userId', 'name').lean();
    return res.json({ top: top.map((p, i) => ({ pos: i + 1, name: p.userId ? p.userId.name : '—', elo: p.elo, liga: ligaDeElo(p.elo), wins: p.wins })) });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

module.exports = router;
