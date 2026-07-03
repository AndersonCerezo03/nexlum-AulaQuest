const mongoose = require('mongoose');

// ─── AulaQuest Files — Resultado de un evento (para progreso y MVPs) ───
// La partida en vivo corre en memoria (como Arena); aquí se guarda el
// resultado final: casos resueltos, puntos y MVP por jugador.
const filesMatchSchema = new mongoose.Schema({
  code:   { type: String },
  caso:   { type: Number, default: 7 },
  solo:   { type: Boolean, default: false },
  squads: [{
    nombre:   { type: String },
    puntos:   { type: Number, default: 0 },
    acerto:   { type: Boolean, default: false },   // culpable correcto
    teoriaOk: { type: Boolean, default: false },
  }],
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:   { type: String },
    squad:  { type: String },
    rol:    { type: String },
    puntos: { type: Number, default: 0 },
    mvp:    { type: Boolean, default: false },
  }],
}, { timestamps: true });

module.exports = mongoose.model('FilesMatch', filesMatchSchema);
