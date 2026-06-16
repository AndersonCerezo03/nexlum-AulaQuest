const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

// Solo este correo puede ser administrador
const ADMIN_EMAIL = 'andersoncerezo03@gmail.com';

const email = (process.argv[2] || '').toLowerCase().trim();

if (!email) {
  console.error('Falta el email. Uso: node src/seeds/makeAdmin.js correo@ejemplo.com');
  process.exit(1);
}

if (email !== ADMIN_EMAIL) {
  console.error('Acceso denegado: solo ' + ADMIN_EMAIL + ' puede ser administrador.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(function() {
    // Por seguridad, quita admin a cualquier otro usuario que lo tuviera
    return User.updateMany({ email: { $ne: ADMIN_EMAIL }, role: 'admin' }, { role: 'user' });
  })
  .then(function() {
    return User.findOneAndUpdate({ email: email }, { role: 'admin' }, { new: true }).select('-password');
  })
  .then(function(user) {
    if (!user) console.error('No existe usuario con el email: ' + email + '. Registralo primero en la app.');
    else console.log('Ahora es ADMIN (unico): ' + user.name + ' (' + user.email + ')');
    return mongoose.disconnect();
  })
  .then(function() { process.exit(0); })
  .catch(function(err) { console.error('Error:', err.message); process.exit(1); });