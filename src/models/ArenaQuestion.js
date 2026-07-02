const mongoose = require('mongoose');

// Pregunta del modo multijugador "AulaQuest Arena".
// Independiente del quiz normal: incluye datos del "Centro de aprendizaje"
// que se muestran tras responder cada ronda.
const arenaQuestionSchema = new mongoose.Schema({
  nivel: { type: String, default: 'A1', uppercase: true, index: true },
  tema:  { type: String, default: '' },          // id del tema A1 (greetings, numbers, ...)
  icon:  { type: String, default: '' },           // emoji/ícono grande (algunas preguntas lo muestran)
  image: { type: String, default: '' },           // url opcional (futuro)
  q:     { type: String, required: true },        // enunciado
  opts:  { type: [String], required: true },      // 4 opciones
  ans:   { type: Number, required: true },        // índice de la correcta (0-3)
  // Centro de aprendizaje — se muestra al terminar la ronda
  learn: {
    word:    { type: String, default: '' },       // palabra clave en inglés
    pron:    { type: String, default: '' },        // pronunciación fácil (ej. "je-LÓU")
    meaning: { type: String, default: '' },        // significado en español
    example: { type: String, default: '' },        // frase de ejemplo
  },
}, { timestamps: true });

module.exports = mongoose.model('ArenaQuestion', arenaQuestionSchema);
