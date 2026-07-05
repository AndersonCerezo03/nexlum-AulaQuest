const mongoose = require('mongoose');

// ─── El Tribunal (C2) — Ronda ───
const tribunalRoundSchema = new mongoose.Schema({
  matchId:          { type: mongoose.Schema.Types.ObjectId, ref: 'TribunalMatch', required: true },
  caseId:           { type: mongoose.Schema.Types.ObjectId, ref: 'TribunalCase' },
  mandateId:        { type: mongoose.Schema.Types.ObjectId, ref: 'TribunalMandate' },
  advocateUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  crossExaminerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // mandate_reveal → arguing → cross_exam → jury_voting → verdict
  phase:            { type: String, enum: ['mandate_reveal', 'arguing', 'cross_exam', 'jury_voting', 'verdict'], default: 'mandate_reveal' },
  transcript:       { type: String, default: '' },
  crossExamQuestion:{ type: String, default: '' },
  crossExamAnswer:  { type: String, default: '' },
  jurorVotes: [{
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    taggedDevices:    { type: [String], default: [] },
    bluffVote:        { type: Boolean, default: false },
    registerBreakVote:{ type: Boolean, default: false },
    submittedAt:      { type: Date, default: Date.now },
  }],
  magistrateVerdict: {
    actualDevicesUsed:        { type: [String] },
    mandateFidelity:          { type: Number },
    bluffWasPresent:          { type: Boolean },
    bluffExecutionScore:      { type: Number },
    registerBreakOccurred:    { type: Boolean },
    registerConsistencyScore: { type: Number },
    crossExamComposureScore:  { type: Number },
    magistrateConfidence:     { type: Number },
    shortRationale:           { type: String },
    rawLLMResponse:           { type: mongoose.Schema.Types.Mixed },
  },
  // resultados por jugador de esta ronda (para mostrar diffs en el veredicto)
  outcomes: { type: mongoose.Schema.Types.Mixed, default: {} },
  timers: {
    argueSeconds:    { type: Number, default: 90 },
    crossExamSeconds:{ type: Number, default: 45 },
    juryVoteSeconds: { type: Number, default: 60 },
  },
}, { timestamps: true });

module.exports = mongoose.model('TribunalRound', tribunalRoundSchema);
