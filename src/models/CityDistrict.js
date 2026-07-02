const mongoose = require('mongoose');

// ─── AulaQuest City — Distrito de la ciudad (nivel A2) ───
// Cada distrito es un tema A2. El desbloqueo es POR EQUIPO:
// requiereCompletados = cuantos distritos debe haber completado el equipo
// para abrir este (0 = abierto desde el inicio). Es dato, no código:
// se ajusta en la BD sin tocar nada.
const cityDistrictSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },  // 'restaurant', 'airport'...
  nombre:   { type: String, required: true },                // 'Restaurant' (UI en inglés)
  nombreEs: { type: String, default: '' },                   // subtítulo de apoyo en español
  tema:     { type: String, default: '' },                   // 'Ordering food'
  temaEs:   { type: String, default: '' },                   // 'Pedir comida'
  icono:    { type: String, default: '🏙️' },
  color:    { type: String, default: '#06b6d4' },            // acento del distrito
  orden:    { type: Number, default: 0 },
  requiereCompletados: { type: Number, default: 0 },         // distritos completados por el equipo para desbloquear
}, { timestamps: true });

module.exports = mongoose.model('CityDistrict', cityDistrictSchema);
