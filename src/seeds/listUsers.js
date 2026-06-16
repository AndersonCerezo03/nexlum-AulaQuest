const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(function() { return User.find({}).select('name email role'); })
  .then(function(users) {
    if (!users.length) { console.log('No hay usuarios. Registrate primero en la app.'); }
    else {
      console.log('=== USUARIOS ===');
      users.forEach(function(u) { console.log(u.email + '  |  ' + u.name + '  |  ' + u.role); });
    }
    return mongoose.disconnect();
  })
  .then(function() { process.exit(0); })
  .catch(function(err) { console.error('Error:', err.message); process.exit(1); });