const mongoose = require('mongoose');

const misionSchema = new mongoose.Schema({
  titulo:      { type: String, required: true },
  descripcion: { type: String, required: true },
  nivel:       { type: String, enum: ['A1','A2','B1','B2','C1','C2'], required: true },
  habilidad:   { type: String, enum: ['conversacion','escritura','comprension','lectura'], required: true },
  xpRecompensa:{ type: Number, default: 100 },
  duracionMin: { type: Number, default: 15 },
  activa:      { type: Boolean, default: true },
  ejercicios: [{
    pregunta: String,
    opciones: [String],
    respuestaCorrecta: Number,
    tipo: { type: String, enum: ['opcion_multiple','traduccion','completar'] }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Mision', misionSchema);
