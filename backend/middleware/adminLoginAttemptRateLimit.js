const attemptsByIp = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// Process-local guard for privileged login endpoints. This complements the
// general authentication request limiter and is intentionally conservative.
function adminLoginAttemptRateLimit(req, res, next) {
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = attemptsByIp.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    attemptsByIp.set(key, entry);
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ msg: 'Too many failed admin login attempts. Try again later.', retryAfter });
  }

  res.once('finish', () => {
    if (res.statusCode === 400 || res.statusCode === 401) entry.count += 1;
  });

  if (attemptsByIp.size > 10000) {
    for (const [address, value] of attemptsByIp.entries()) {
      if (now >= value.resetAt) attemptsByIp.delete(address);
    }
  }

  return next();
}

module.exports = adminLoginAttemptRateLimit;
