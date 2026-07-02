const mongoose = require('mongoose');

// ─── AulaQuest City — Equipo persistente (dura semanas, no una partida) ───
// A diferencia de las salas de Arena (en memoria), los equipos viven en MongoDB.
// El diccionario compartido y el feed se actualizan en tiempo real vía Socket.io,
// pero SIEMPRE quedan guardados aquí para cuando alguien entra después.
const cityTeamSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 30 },
  code:   { type: String, required: true, unique: true },   // código de invitación (6 caracteres)
  miembros: [{
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:     { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
  }],                                                        // 2-8 jugadores (1 puede crear y esperar)
  puntos: { type: Number, default: 0 },                      // puntos de EQUIPO (SOS, palabras compartidas...)

  // Progreso del equipo: una misión cuenta para el distrito cuando CUALQUIER
  // miembro la completa; el distrito se completa cuando todas sus misiones
  // fueron completadas por el equipo. Eso alimenta el desbloqueo.
  misionesCompletadas: [{
    distrito:  { type: String },
    misionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'CityMission' },
    porUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    porName:   { type: String },
    fecha:     { type: Date, default: Date.now },
  }],
  distritosCompletados: { type: [String], default: [] },     // ids de CityDistrict

  // Diccionario compartido: cada carta desbloqueada por cualquier jugador
  diccionario: [{
    en:         { type: String, required: true },
    es:         { type: String, default: '' },
    aportadaPor:{ type: String, default: '' },               // nombre visible
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fecha:      { type: Date, default: Date.now },
  }],

  // Feed de actividad (se conservan las últimas ~60 entradas)
  feed: [{
    tipo:  { type: String, default: 'info' },                // mission | card | sos | unlock | join
    texto: { type: String, default: '' },
    name:  { type: String, default: '' },
    fecha: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('CityTeam', cityTeamSchema);
