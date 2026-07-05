const mongoose = require('mongoose');

// ─── El Tribunal (C2) — Estadísticas persistentes del jugador ───
const tribunalStatsSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name:              { type: String, default: '' },
  matchesPlayed:     { type: Number, default: 0 },
  totalEthos:        { type: Number, default: 0 },
  totalPathos:       { type: Number, default: 0 },
  totalLogos:        { type: Number, default: 0 },
  bestCalibrationGap:{ type: Number, default: 999 },
  rankTitle:         { type: String, default: 'Oyente Novato' },
  badgeHistory:      { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('TribunalStats', tribunalStatsSchema);
