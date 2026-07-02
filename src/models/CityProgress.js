const mongoose = require('mongoose');

// ─── AulaQuest City — Progreso personal del jugador ───
// XP individual, racha diaria y meta de 3 misiones al día.
// La fecha se guarda como 'YYYY-MM-DD' para comparar días sin líos de zona horaria.
const cityProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'CityTeam', default: null },

  xp:     { type: Number, default: 0 },                      // XP personal de City
  racha:  { type: Number, default: 0 },                      // días seguidos cumpliendo la meta
  ultimoDiaMeta: { type: String, default: '' },              // último día que cumplió la meta ('YYYY-MM-DD')

  // Meta diaria: 3 misiones por jugador
  fechaHoy:    { type: String, default: '' },                // día de los contadores ('YYYY-MM-DD')
  misionesHoy: { type: Number, default: 0 },                 // se reinicia al cambiar fechaHoy

  misionesCompletadas: [{
    distrito: { type: String },
    misionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CityMission' },
    fecha:    { type: Date, default: Date.now },
  }],
  cartasAportadas: { type: Number, default: 0 },             // cartas que este jugador metió al diccionario
}, { timestamps: true });

module.exports = mongoose.model('CityProgress', cityProgressSchema);
