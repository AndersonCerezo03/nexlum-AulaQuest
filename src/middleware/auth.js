const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(req, res, next) {
  var header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ msg: 'Sin token' });

  var token = header.split(' ')[1];
  var decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch(e) {
    return res.status(401).json({ msg: 'Token invalido' });
  }

  User.findById(decoded.id).select('-password')
    .then(function(user) {
      if (!user) return res.status(401).json({ msg: 'Usuario no encontrado' });
      req.user = user;
      return next();
    })
    .catch(function(e) {
      return res.status(500).json({ msg: e.message });
    });
};