const mongoose = require('mongoose');

// ─── El Tribunal (C2) — Sesión de partida ───
const tribunalMatchSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  status:   { type: String, enum: ['lobby', 'in_progress', 'finished'], default: 'lobby' },
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  players: [{
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    displayName: { type: String },
    role:        { type: String, enum: ['advocate', 'jury', 'cross_examiner'], default: 'jury' },
    ethos:       { type: Number, default: 50 },
    pathos:      { type: Number, default: 50 },
    logos:       { type: Number, default: 50 },
  }],
  currentRoundIndex: { type: Number, default: 0 },
  totalRounds:       { type: Number, default: 0 },   // cuántas rondas jugará (round-robin)
  rounds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TribunalRound' }],
}, { timestamps: true });

module.exports = mongoose.model('TribunalMatch', tribunalMatchSchema);
