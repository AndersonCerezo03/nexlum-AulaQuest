const mongoose = require('mongoose');

// ─── AulaQuest Files — Caso de detectives (nivel B1) ───
// Guion FIJO en MongoDB (sin IA en esta versión). El culpable, la
// contradicción y la teoría correcta solo se envían al cliente en el reveal.

const pasoInterrogatorioSchema = new mongoose.Schema({
  // El jugador elige la pregunta gramaticalmente correcta (past simple /
  // continuous / present perfect). Fallar enseña la regla y se reintenta.
  opts:   { type: [String], required: true },   // 3 formas de la pregunta
  ans:    { type: Number, required: true },      // índice de la correcta
  feedback: { en: String, es: String },          // regla gramatical bilingüe
  respuesta:   { type: String, default: '' },    // lo que contesta el sospechoso (guion)
  respuestaEs: { type: String, default: '' },
  clue:   { en: String, es: String },            // pista que entra al tablero del escuadrón
  // Ejercicio de reported speech para "archivar" la evidencia en deliberación (opcional)
  rsOpts: { type: [String], default: [] },
  rsAns:  { type: Number, default: -1 },
  rsFeedback: { en: String, es: String },
}, { _id: false });

const sospechosoSchema = new mongoose.Schema({
  id:       { type: String, required: true },
  nombre:   { type: String, required: true },
  cargo:    { type: String, default: '' },       // "Security guard"
  cargoEs:  { type: String, default: '' },
  retrato:  {                                    // retrato SVG procedural
    skin: String, hair: String, hairStyle: String, acc: String, // acc: glasses|hat|scarf|none
  },
  color:    { type: String, default: '#06b6d4' },
  coartada:   { type: String, default: '' },
  coartadaEs: { type: String, default: '' },
  interrogatorio: { type: [pasoInterrogatorioSchema], default: [] },
}, { _id: false });

const filesCaseSchema = new mongoose.Schema({
  numero:   { type: Number, required: true, unique: true },
  titulo:   { type: String, required: true },
  tituloEs: { type: String, default: '' },
  activo:   { type: Boolean, default: true },
  tutorial: [{ en: String, es: String, icono: String }],          // 3 pasos
  cinematica: [{ texto: String, textoEs: String, icono: String }], // 3 escenas narradas
  mapa:     [{ lugar: String, lugarEs: String, icono: String, nota: String, notaEs: String }],
  timeline: [{ hora: String, evento: String, eventoEs: String }],
  sospechosos: { type: [sospechosoSchema], default: [] },
  teorias:  [{ texto: String, textoEs: String }],                 // opciones de teoría (must/can't have been)
  // ── Solo servidor (se manda al cliente únicamente en el reveal) ──
  culpable:      { type: String, required: true },                // id del sospechoso
  teoriaCorrecta:{ type: Number, required: true },                // índice en teorias
  contradiccion: { en: String, es: String },                      // la mentira que lo delata
}, { timestamps: true });

module.exports = mongoose.model('FilesCase', filesCaseSchema);
