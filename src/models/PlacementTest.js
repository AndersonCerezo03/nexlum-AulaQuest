const mongoose = require('mongoose');

const preguntaSchema = new mongoose.Schema({
  q:     { type: String, required: true },
  opts:  { type: [String], default: [] },
  ans:   { type: Number }, // índice correcto (MC/image); las de pronunciación no lo usan
  tipo:  { type: String, enum: ['vocab','grammar','listening','fill','pronunciation','image'] },
  nivel: { type: String, enum: ['A1','A2','B1','B2','C1','C2'] },
  audio:  { type: String },
  target: { type: String }, // para pronunciación: lo que el usuario debe decir
  img:    { type: String }, // imagen alusiva (emoji) que se muestra grande en la pregunta
}, { _id: true });

const placementSchema = new mongoose.Schema({
  preguntas: [preguntaSchema],
}, { collection: 'placement_test' });

module.exports = mongoose.model('PlacementTest', placementSchema);
