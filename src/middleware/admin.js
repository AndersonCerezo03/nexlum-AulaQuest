module.exports = function(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ msg: 'Sin sesion' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Acceso restringido: solo administradores' });
  }
  return next();
};