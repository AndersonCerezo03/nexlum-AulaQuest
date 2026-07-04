const mongoose = require('mongoose');

// ─── AulaQuest Grimoire — carta/hechizo (nivel C1) ───
// Cada carta es un reto C1 contrarreloj. La respuesta correcta NUNCA se envía
// al cliente antes de resolver (el server valida).
const grimoireCardSchema = new mongoose.Schema({
  cardId:  { type: String, required: true, unique: true },
  school:  { type: String, enum: ['fire', 'ice', 'lightning', 'nature', 'shield', 'legendary'], required: true, index: true },
  nombre:  { type: String, required: true },
  tipo:    { type: String, enum: ['damage', 'heal'], default: 'damage' },
  valor:   { type: Number, default: 20 },
  rareza:  { type: String, enum: ['common', 'rare', 'legendary'], default: 'common' },
  segundos:{ type: Number, default: 12 },      // tiempo del reto al lanzar
  reto: {
    q:    { type: String, required: true },
    qEs:  { type: String, default: '' },
    opts: { type: [String], required: true },
    ans:  { type: Number, required: true },
    feedback: { en: { type: String, default: '' }, es: { type: String, default: '' } },
    say:    { type: String, default: '' },     // listening: texto para el TTS
    accent: { type: String, default: '' },     // 'en-GB' | 'en-AU'
  },
}, { timestamps: true });

module.exports = mongoose.model('GrimoireCard', grimoireCardSchema);
