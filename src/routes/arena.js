const router = require('express').Router();
const auth   = require('../middleware/auth');
const ArenaMatch = require('../models/ArenaMatch');

// GET /api/arena/leaderboard — top 10 global (mejores puntajes por partida)
router.get('/leaderboard', auth, async function(req, res) {
  try {
    const top = await ArenaMatch.aggregate([
      { $unwind: '$players' },
      { $sort: { 'players.score': -1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: '$players.name', score: '$players.score', fecha: '$createdAt' } },
    ]);
    return res.json({ top });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
