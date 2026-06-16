const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarEmail(email) {
  if (!email || typeof email !== 'string') return 'El correo es requerido';
  const e = email.trim().toLowerCase();
  if (e.length > 120) return 'El correo es demasiado largo';
  if (!EMAIL_RE.test(e)) return 'El formato del correo no es valido';
  return null;
}

function validarPassword(password) {
  if (!password || typeof password !== 'string') return 'La contraseña es requerida';
  if (password.length < 8)  return 'La contraseña debe tener minimo 8 caracteres';
  if (password.length > 100) return 'La contraseña es demasiado larga';
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una minuscula';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una mayuscula';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un numero';
  return null;
}

function validarNombre(name) {
  if (!name || typeof name !== 'string') return 'El nombre es requerido';
  const n = name.trim();
  if (n.length < 2)  return 'El nombre es demasiado corto';
  if (n.length > 60) return 'El nombre es demasiado largo';
  if (!/^[\p{L}\p{M}\s'.-]+$/u.test(n)) return 'El nombre contiene caracteres no validos';
  return null;
}

function validarNivel(nivel) {
  return ['A1','A2','B1','B2','C1','C2'].includes(nivel);
}

module.exports = { validarEmail, validarPassword, validarNombre, validarNivel };