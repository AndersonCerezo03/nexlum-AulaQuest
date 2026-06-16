const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  q:    { type: String, required: true },
  opts: { type: [String], required: true },
  ans:  { type: Number, required: true },
  tipo: { type: String, enum: ['vocab','grammar','listening','fill'], default: 'vocab' },
});

const quizSchema = new mongoose.Schema({
  nivel:       { type: String, required: true, unique: true, uppercase: true },
  nivelTarget: { type: String, required: true, uppercase: true },
  titulo:      { type: String, required: true },
  descripcion: { type: String },
  minScore:    { type: Number, default: 7 },
  totalPregs:  { type: Number, default: 10 },
  preguntas:   [questionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);