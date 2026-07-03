const router = require('express').Router();
const auth   = require('../middleware/auth');
const RoyaleMatch = require('../models/RoyaleMatch');

// ─── AulaQuest Royale — stats del jugador y top de temporada ───
router.get('/stats', auth, async function (req, res) {
  try {
    const [mine, top] = await Promise.all([
      RoyaleMatch.find({ 'players.userId': req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
      RoyaleMatch.aggregate([
        { $unwind: '$players' },
        { $match: { 'players.userId': { $ne: null } } },
        { $group: { _id: '$players.name', wins: { $sum: { $cond: ['$players.win', 1, 0] } }, duels: { $sum: '$players.duelsWon' }, puntos: { $sum: '$players.puntos' } } },
        { $sort: { puntos: -1 } }, { $limit: 10 },
      ]),
    ]);
    let wins = 0, duels = 0, revives = 0, puntos = 0;
    for (const m of mine) {
      const yo = m.players.find(p => String(p.userId) === String(req.user._id));
      if (!yo) continue;
      if (yo.win) wins++; duels += yo.duelsWon || 0; revives += yo.revives || 0; puntos += yo.puntos || 0;
    }
    return res.json({ partidas: mine.length, wins, duels, revives, puntos, top: top.map(t => ({ name: t._id, wins: t.wins, duels: t.duels, puntos: t.puntos })) });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

module.exports = router;
