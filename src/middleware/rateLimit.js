module.exports = function rateLimit(opts) {
  const windowMs = opts.windowMs || 15 * 60 * 1000;
  const max      = opts.max || 10;
  const msg      = opts.msg || 'Demasiados intentos. Intenta de nuevo mas tarde.';
  const hits     = new Map();

  setInterval(function() {
    const now = Date.now();
    for (const [ip, v] of hits.entries()) {
      if (v.resetAt <= now) hits.delete(ip);
    }
  }, windowMs).unref();

  return function(req, res, next) {
    const ip = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown').toString();
    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const segundos = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(segundos));
      return res.status(429).json({ msg: msg, retryAfter: segundos });
    }
    return next();
  };
};