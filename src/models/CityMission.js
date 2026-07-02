const mongoose = require('mongoose');

// ─── AulaQuest City — Misión de un distrito (3-4 pasos) ───
// Tipos de paso:
//  choice  → diálogo con NPC, elegir la respuesta correcta (opts + answer índice)
//  build   → armar la frase tocando palabras en orden (words + answer string)
//  listen  → TTS del navegador dice "say" y el jugador elige lo que escuchó (opts + answer índice)
//  teach   → "Profesor por un día": usa una palabra aportada por OTRO compañero;
//            el texto puede llevar el placeholder {word}, que el frontend
//            reemplaza en vivo con una carta del diccionario del equipo.
// El error nunca castiga: feedback bilingüe explica la regla y se reintenta el paso.
const stepSchema = new mongoose.Schema({
  type:   { type: String, enum: ['choice', 'build', 'listen', 'teach'], required: true },
  say:    { type: String, default: '' },     // línea del NPC / instrucción (inglés simple)
  sayEs:  { type: String, default: '' },     // subtítulo de apoyo en español (gris pequeño)
  opts:   { type: [String], default: [] },   // choice / listen / teach
  words:  { type: [String], default: [] },   // build: banco de palabras desordenadas
  answer: { type: mongoose.Schema.Types.Mixed, required: true }, // índice (choice/listen/teach) o frase exacta (build)
  feedback: {                                // regla gramatical al fallar (enseña, no castiga)
    en: { type: String, default: '' },
    es: { type: String, default: '' },
  },
  card: {                                    // carta que entra al diccionario del equipo al superar el paso
    en: { type: String, default: '' },
    es: { type: String, default: '' },
  },
}, { _id: false });

const cityMissionSchema = new mongoose.Schema({
  distrito: { type: String, required: true, index: true },  // id del CityDistrict
  orden:    { type: Number, default: 0 },
  titulo:   { type: String, required: true },                // 'A table for two'
  tituloEs: { type: String, default: '' },
  npc:      { type: String, default: '' },                   // nombre del personaje ('Waiter Sam')
  npcIcon:  { type: String, default: '🙂' },
  pasos:    { type: [stepSchema], default: [] },
  xpPaso:   { type: Number, default: 15 },                   // responder un paso
  xpTeach:  { type: Number, default: 25 },                   // enseñar (paso teach) da más que responder
}, { timestamps: true });

cityMissionSchema.index({ distrito: 1, orden: 1 });

module.exports = mongoose.model('CityMission', cityMissionSchema);
