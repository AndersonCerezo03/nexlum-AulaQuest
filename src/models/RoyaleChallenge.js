const mongoose = require('mongoose');

// ─── AulaQuest Royale — reto B2 (battle royale de inglés) ───
// tipo: phrasal | idiom | paraphrase | listening
//  - listening: "say" es el texto que dice el TTS del navegador; el jugador
//    elige lo que escuchó.
// El feedback bilingüe siempre explica el phrasal/idiom/regla (nunca castiga).
const royaleChallengeSchema = new mongoose.Schema({
  tipo:  { type: String, enum: ['phrasal', 'idiom', 'paraphrase', 'listening'], required: true, index: true },
  q:     { type: String, required: true },     // enunciado
  qEs:   { type: String, default: '' },         // apoyo en español (gris)
  say:   { type: String, default: '' },         // solo listening: lo que dice el TTS
  opts:  { type: [String], required: true },    // 3-4 opciones
  ans:   { type: Number, required: true },       // índice correcto
  feedback: { en: { type: String, default: '' }, es: { type: String, default: '' } },
  dif:   { type: Number, default: 1 },          // 1 fácil, 2 medio, 3 difícil
}, { timestamps: true });

module.exports = mongoose.model('RoyaleChallenge', royaleChallengeSchema);
