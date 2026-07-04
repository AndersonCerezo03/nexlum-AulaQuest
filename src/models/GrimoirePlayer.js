const mongoose = require('mongoose');

// ─── AulaQuest Grimoire — perfil de duelista (extiende al usuario, no lo modifica) ───
const grimoirePlayerSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  elo:       { type: Number, default: 1000 },
  liga:      { type: String, default: 'Bronce' },
  wins:      { type: Number, default: 0 },
  losses:    { type: Number, default: 0 },
  coleccion: { type: [String], default: [] },     // cardIds desbloqueados (además del set inicial)
  mazo:      { type: [String], default: [] },      // 8 cardIds del mazo activo
  temporada: { type: String, default: '' },        // 'YYYY-MM' del último ajuste de temporada
  historial: [{
    oponente:  { type: String },
    resultado: { type: String },                   // 'win' | 'loss'
    eloDelta:  { type: Number },
    fecha:     { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('GrimoirePlayer', grimoirePlayerSchema);
