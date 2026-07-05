const mongoose = require('mongoose');

// ─── El Tribunal (C2) — Caso ───
const tribunalCaseSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  briefText:        { type: String, required: true },       // 2-3 frases, whimsical, no controversial
  difficulty:       { type: Number, default: 2, min: 1, max: 5 },
  suggestedDevices: { type: [String], default: [] },        // pool para mandatos
  createdBy:        { type: String, enum: ['ai', 'seed'], default: 'seed' },
  language:         { type: String, default: 'en' },
}, { timestamps: true });

module.exports = mongoose.model('TribunalCase', tribunalCaseSchema);
