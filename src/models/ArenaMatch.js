const mongoose = require('mongoose');

// Resultado de una partida de Arena — alimenta el leaderboard global.
const arenaMatchSchema = new mongoose.Schema({
  code:  { type: String },
  nivel: { type: String, default: 'A1' },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:   { type: String },
    score:  { type: Number, default: 0 },
  }],
  winnerName: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ArenaMatch', arenaMatchSchema);
