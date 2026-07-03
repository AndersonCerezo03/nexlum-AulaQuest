const mongoose = require('mongoose');

// ─── AulaQuest Royale — resultado de partida (para stats y temporadas) ───
const royaleMatchSchema = new mongoose.Schema({
  code:    { type: String },
  solo:    { type: Boolean, default: false },
  ganador: { type: String, default: '' },        // nombre de la escuadra ganadora
  players: [{
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:     { type: String },
    squad:    { type: String },
    duelsWon: { type: Number, default: 0 },
    kills:    { type: Number, default: 0 },
    revives:  { type: Number, default: 0 },
    win:      { type: Boolean, default: false },
    puntos:   { type: Number, default: 0 },
  }],
}, { timestamps: true });

module.exports = mongoose.model('RoyaleMatch', royaleMatchSchema);
