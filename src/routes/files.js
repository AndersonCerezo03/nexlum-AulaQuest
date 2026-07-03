const router = require('express').Router();
const auth   = require('../middleware/auth');
const FilesMatch = require('../models/FilesMatch');

// ─── AulaQuest Files — progreso del jugador (casos resueltos y MVPs) ───
router.get('/stats', auth, async function (req, res) {
  try {
    const matches = await FilesMatch.find({ 'players.userId': req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    let resueltos = 0, mvps = 0, puntos = 0;
    for (const m of matches) {
      const yo = m.players.find(p => String(p.userId) === String(req.user._id));
      if (!yo) continue;
      const miSquad = m.squads.find(s => s.nombre === yo.squad);
      if (miSquad && miSquad.acerto) resueltos++;
      if (yo.mvp) mvps++;
      puntos += yo.puntos || 0;
    }
    return res.json({ partidas: matches.length, resueltos, mvps, puntos });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

module.exports = router;
