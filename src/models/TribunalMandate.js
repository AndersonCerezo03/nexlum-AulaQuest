const mongoose = require('mongoose');

// ─── El Tribunal (C2) — Mandato retórico secreto del Advocate ───
const tribunalMandateSchema = new mongoose.Schema({
  caseId:           { type: mongoose.Schema.Types.ObjectId, ref: 'TribunalCase', required: true },
  requiredDevices:  { type: [String], default: [] },   // ej ["hedging","litotes"]
  requiresBluff:    { type: Boolean, default: false },
  bluffInstruction: { type: String, default: '' },
  registerTarget:   { type: String, enum: ['formal', 'academic', 'diplomatic'], default: 'formal' },
}, { timestamps: true });

module.exports = mongoose.model('TribunalMandate', tribunalMandateSchema);
