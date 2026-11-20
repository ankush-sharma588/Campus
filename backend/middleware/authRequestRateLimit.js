const buckets = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 60;

/**
 * Lightweight process-local limit for unauthenticated auth/OTP endpoints.
 * OTP-specific limits are also enforced in MongoDB by email, expiry and attempt count.
 */
function authRequestRateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ msg: 'Too many authentication requests. Please try again later.' });
  }

  // Bound memory use if many distinct client IPs hit this process.
  if (buckets.size > 10000) {
    for (const [key, value] of buckets.entries()) {
      if (now >= value.resetAt) buckets.delete(key);
    }
  }

  return next();
}

module.exports = authRequestRateLimit;
