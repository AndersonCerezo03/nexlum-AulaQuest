const mongoose = require('mongoose');

// ─── Oración de ejemplo + explicación de uso por palabra (cache permanente) ───
// Se genera UNA vez con OpenAI y queda guardada: las siguientes veces sale de aquí.
const ejemploPalabraSchema = new mongoose.Schema({
  en:          { type: String, required: true, unique: true },  // palabra/frase en inglés
  es:          { type: String, default: '' },
  frase:       { type: String, required: true },                // oración de ejemplo en inglés
  fraseEs:     { type: String, default: '' },                    // traducción de la oración
  explicacion: { type: String, default: '' },                    // uso/conjugación explicado en español simple
}, { timestamps: true });

module.exports = mongoose.model('EjemploPalabra', ejemploPalabraSchema);
