const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:         { type: String, required: true, minlength: 8 },
  role:             { type: String, enum: ['user','admin'], default: 'user' },
  englishLevel:     { type: String, enum: ['A1','A2','B1','B2','C1','C2'], default: 'A1' },
  learningLanguage: { type: String, enum: ['en','fr','de','pt','it'], default: 'en' },
  experiencePoints: { type: Number, default: 0 },
  wordsCorrect:     { type: Number, default: 0 },
  nivelesAprobados: { type: [String], default: [] },
  progresoTemas: {
    type: Map,
    of: [String],
    default: {}
  },
  ultimoTema: { type: String, default: '' },

  levelAssigned:  { type: Boolean, default: false },
  trialStartDate: { type: Date },
  isPremium:      { type: Boolean, default: false },

  // Entrevistas con IA: bloqueadas por defecto; el admin las desbloquea por alumno
  interviewUnlocked:    { type: Boolean, default: false },
  interviewRequestedAt: { type: Date },

  // Resultado del test de diagnóstico (informativo; el alumno lo ve en el aula)
  diagnostico: {
    fecha:         { type: Date },
    puntaje:       { type: Number },   // aciertos
    total:         { type: Number },   // total de preguntas
    nivelEstimado: { type: String },   // A1–C2 estimado
    areas:         { type: mongoose.Schema.Types.Mixed }, // { vocabulario:{c,t}, gramatica:{c,t}, ... }
    porNivel:      { type: mongoose.Schema.Types.Mixed },  // { A1:{c,t}, A2:{c,t}, ... }
  },
  dailyProgress: {
    date:    { type: Date },
    topicId: { type: String, default: '' },
  },

  practiceCount: { type: Number, default: 0 },
  lastActive:    { type: Date },

  emailVerified:  { type: Boolean, default: false },
  verifyToken:    { type: String },
  verifyTokenExp: { type: Date },

  resetToken:    { type: String },
  resetTokenExp: { type: Date },

  failedLogins: { type: Number, default: 0 },
  lockUntil:    { type: Date },
}, { timestamps: true });


// --- BLINDAJE DE ADMIN: solo este correo puede tener rol admin ---
const ADMIN_EMAIL = 'andersoncerezo03@gmail.com';

userSchema.pre('save', async function() {
  // Blindaje: nadie mas puede ser admin
  if (this.role === 'admin' && this.email !== ADMIN_EMAIL) {
    throw new Error('Solo el correo autorizado puede ser administrador.');
  }
  // Hash de password solo si cambio
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

userSchema.methods.toJSON = function() {
  const o = this.toObject();
  delete o.password;
  delete o.verifyToken;
  delete o.verifyTokenExp;
  delete o.resetToken;
  delete o.resetTokenExp;
  delete o.failedLogins;
  delete o.lockUntil;
  return o;
};

module.exports = mongoose.model('User', userSchema);