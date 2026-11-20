const crypto = require('crypto');
const OtpChallenge = require('../models/otpChallenge.model');
const sendMail = require('../config/EmailProvider');

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function otpSecret() {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('OTP_SECRET or JWT_SECRET must be configured.');
  return secret;
}

function hashOtp(email, purpose, code) {
  return crypto
    .createHmac('sha256', otpSecret())
    .update(`${email}:${purpose}:${code}`)
    .digest('hex');
}

function createHttpError(message, statusCode, retryAfter) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (retryAfter) error.retryAfter = retryAfter;
  return error;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

async function sendOtpEmail({ email, firstName, purpose, code }) {
  const heading = purpose === 'signup'
    ? 'Verify your email address'
    : purpose === 'login'
      ? 'Your PlaceHub login verification code'
      : 'Reset your PlaceHub password';
  const safeName = escapeHtml(firstName || 'there');
  const safeCode = escapeHtml(code);
  const html = `<!doctype html>
  <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#172033">
    <div style="max-width:560px;margin:28px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="padding:22px 26px;background:#172554;color:#fff"><div style="font-size:13px;letter-spacing:1px;text-transform:uppercase">PlaceHub</div><h1 style="font-size:22px;margin:10px 0 0">${heading}</h1></div>
      <div style="padding:26px;line-height:1.6"><p>Hello ${safeName},</p><p>Use this one-time verification code to continue:</p>
        <div style="margin:22px 0;padding:18px;text-align:center;background:#eff6ff;border-radius:9px;font-size:32px;letter-spacing:9px;font-weight:700;color:#1d4ed8">${safeCode}</div>
        <p>This code expires in <strong>5 minutes</strong> and can be used only once. You have up to 5 attempts.</p>
        <p>If you did not request this code, you can ignore this email. Never share this code with anyone.</p>
        <p style="font-size:12px;color:#64748b">Automated security message from PlaceHub.</p>
      </div>
    </div>
  </body></html>`;
  const text = `Hello ${firstName || 'there'}, your PlaceHub verification code is ${code}. It expires in 5 minutes and can be used once. Never share this code.`;
  const subject = purpose === 'signup'
    ? 'PlaceHub: Verify your email'
    : purpose === 'login'
      ? 'PlaceHub: Login verification code'
      : 'PlaceHub: Password reset code';

  await sendMail(email, subject, html, text);
}

async function issueOtp({ user, purpose }) {
  if (!user || !user.email || !user._id) {
    throw createHttpError('Unable to start verification for this account.', 400);
  }
  if (!['signup', 'login', 'password_reset'].includes(purpose)) {
    throw createHttpError('Invalid verification purpose.', 400);
  }

  const email = normalizeEmail(user.email);
  const now = new Date();
  const existing = await OtpChallenge.findOne({ email, purpose });
  if (existing && now.getTime() - new Date(existing.lastSentAt).getTime() < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now.getTime() - new Date(existing.lastSentAt).getTime())) / 1000);
    throw createHttpError(`Please wait ${retryAfter} seconds before requesting another code.`, 429, retryAfter);
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const challenge = await OtpChallenge.findOneAndUpdate(
    { email, purpose },
    {
      $set: {
        userId: user._id,
        otpHash: hashOtp(email, purpose, code),
        attempts: 0,
        lastSentAt: now,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendOtpEmail({ email, firstName: user.first_name, purpose, code });
  } catch (error) {
    await OtpChallenge.deleteOne({ _id: challenge._id });
    throw error;
  }

  return { email, expiresInSeconds: OTP_TTL_MS / 1000, resendAfterSeconds: RESEND_COOLDOWN_MS / 1000 };
}

async function verifyOtp({ email: rawEmail, purpose, code: rawCode }) {
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode || '').trim();
  if (!email || !/^\d{6}$/.test(code)) {
    throw createHttpError('Enter the 6-digit verification code.', 400);
  }

  const challenge = await OtpChallenge.findOne({ email, purpose }).select('+otpHash');
  if (!challenge) throw createHttpError('The code is invalid or has expired. Request a new code.', 400);
  if (challenge.expiresAt.getTime() <= Date.now()) {
    await OtpChallenge.deleteOne({ _id: challenge._id });
    throw createHttpError('The code has expired. Request a new code.', 400);
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    throw createHttpError('Too many incorrect attempts. Request a new code.', 429);
  }

  const expected = Buffer.from(challenge.otpHash, 'hex');
  const actual = Buffer.from(hashOtp(email, purpose, code), 'hex');
  const isMatch = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!isMatch) {
    const updated = await OtpChallenge.findOneAndUpdate(
      { _id: challenge._id, attempts: { $lt: MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    const remaining = Math.max(0, MAX_ATTEMPTS - (updated?.attempts ?? MAX_ATTEMPTS));
    throw createHttpError(`Incorrect code. ${remaining} attempt(s) remaining.`, remaining ? 400 : 429);
  }

  // Atomic consume prevents a valid OTP from being replayed by parallel requests.
  const consumed = await OtpChallenge.findOneAndDelete({
    _id: challenge._id,
    otpHash: challenge.otpHash,
    attempts: { $lt: MAX_ATTEMPTS },
  });
  if (!consumed) throw createHttpError('The code was already used or is no longer valid.', 400);

  return { userId: consumed.userId, email: consumed.email, purpose: consumed.purpose };
}

async function resendOtp({ email, purpose }) {
  const normalized = normalizeEmail(email);
  const challenge = await OtpChallenge.findOne({ email: normalized, purpose });
  if (!challenge) throw createHttpError('No active verification was found. Start the process again.', 400);
  const User = require('../models/user.model');
  const user = await User.findById(challenge.userId);
  if (!user) {
    await OtpChallenge.deleteOne({ _id: challenge._id });
    throw createHttpError('The account is no longer available.', 400);
  }
  return issueOtp({ user, purpose });
}

module.exports = {
  issueOtp,
  verifyOtp,
  resendOtp,
  normalizeEmail,
  createHttpError,
};
