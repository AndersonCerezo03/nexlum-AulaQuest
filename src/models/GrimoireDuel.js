const mongoose = require('mongoose');

// ─── AulaQuest Grimoire — resultado de duelo (historial y ELO) ───
const grimoireDuelSchema = new mongoose.Schema({
  mode:    { type: String, default: 'bot' },       // bot | code | ranked | tournament
  ganador: { type: String, default: '' },           // nombre del ganador
  rondas:  { type: String, default: '' },           // '2-1'
  players: [{
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:     { type: String },
    elo:      { type: Number, default: 1000 },
    eloDelta: { type: Number, default: 0 },
    win:      { type: Boolean, default: false },
    bot:      { type: Boolean, default: false },
  }],
}, { timestamps: true });

module.exports = mongoose.model('GrimoireDuel', grimoireDuelSchema);
