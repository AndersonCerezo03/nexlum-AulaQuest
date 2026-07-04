const mongoose = require('mongoose');

// ─── AulaQuest Grimoire — torneo de aula (bracket de eliminación) ───
// El bracket vivo corre en memoria en el socket; aquí se guarda el resultado.
const grimoireTournamentSchema = new mongoose.Schema({
  code:       { type: String },
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  size:       { type: Number, default: 8 },
  estado:     { type: String, default: 'lobby' },   // lobby | running | done
  jugadores:  [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, name: String }],
  ganador:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('GrimoireTournament', grimoireTournamentSchema);
