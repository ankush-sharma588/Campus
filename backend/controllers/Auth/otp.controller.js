const User = require('../../models/user.model');
const jwt = require('jsonwebtoken');
const { verifyOtp, resendOtp, issueOtp, normalizeEmail } = require('../../services/otp.service');
const { sendSignupConfirmation } = require('../../utils/emailNotifications');

async function VerifyOtp(req, res) {
  const { email, purpose, code } = req.body;
  if (!['signup', 'login'].includes(purpose)) {
    return res.status(400).json({ msg: 'Invalid verification request.' });
  }

  try {
    const verified = await verifyOtp({ email, purpose, code });
    const user = await User.findOne({ _id: verified.userId, email: verified.email });
    if (!user) return res.status(400).json({ msg: 'Account not found.' });

    user.emailVerified = true;

    if (purpose === 'signup') {
      if (user.role !== 'student') return res.status(400).json({ msg: 'Invalid signup account.' });
      await user.save();
      void sendSignupConfirmation(user);
      return res.status(200).json({ verified: true, msg: 'Email verified. Your account is waiting for placement-team approval.' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: 'Authentication is not configured on the server.' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
    user.token = token;
    await user.save();
    return res.status(200).json({ verified: true, token, msg: 'Login successful.' });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    return res.status(error.statusCode || 500).json({ msg: error.statusCode ? error.message : 'Could not verify the code. Please try again.' });
  }
}

async function ResendOtp(req, res) {
  const email = normalizeEmail(req.body.email);
  const { purpose } = req.body;
  if (!email || !['signup', 'login', 'password_reset'].includes(purpose)) {
    return res.status(400).json({ msg: 'Email and a valid verification purpose are required.' });
  }

  try {
    if (purpose === 'login' || purpose === 'password_reset') {
      const result = await resendOtp({ email, purpose });
      return res.status(200).json({ msg: 'A new verification code has been sent.', ...result });
    }

    const user = await User.findOne({ email, role: 'student', emailVerified: false });
    if (!user) return res.status(400).json({ msg: 'No unverified student registration was found.' });
    const result = await issueOtp({ user, purpose: 'signup' });
    return res.status(200).json({ msg: 'A new verification code has been sent.', ...result });
  } catch (error) {
    console.error('OTP resend error:', error.message);
    return res.status(error.statusCode || 503).json({
      msg: error.statusCode ? error.message : 'Could not send the verification email. Please try again later.',
      retryAfter: error.retryAfter,
    });
  }
}

async function ForgotPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ msg: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Keep unknown-account responses generic to avoid exposing registered users.
      return res.status(200).json({ msg: 'If an account exists for that email, a password reset code has been sent.' });
    }

    try {
      const delivery = await issueOtp({ user, purpose: 'password_reset' });
      return res.status(200).json({
        msg: 'A password reset code has been sent. It expires in 5 minutes.',
        expiresInSeconds: delivery.expiresInSeconds,
        resendAfterSeconds: delivery.resendAfterSeconds,
      });
    } catch (deliveryError) {
      // Do not silently tell the user that an OTP was sent when Brevo rejected it.
      console.error('Password reset OTP delivery failed:', deliveryError.message);
      return res.status(deliveryError.statusCode || 503).json({
        msg: deliveryError.statusCode
          ? deliveryError.message
          : 'Email delivery is temporarily unavailable. Please try again later.',
        retryAfter: deliveryError.retryAfter,
      });
    }
  } catch (error) {
    console.error('Forgot password request error:', error.message);
    return res.status(500).json({ msg: 'Unable to process the request. Please try again later.' });
  }
}

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

async function ResetPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  const { code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ msg: 'Email, verification code and new password are required.' });
  }
  if (!PASSWORD_PATTERN.test(newPassword)) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character.' });
  }

  try {
    const verified = await verifyOtp({ email, purpose: 'password_reset', code });
    const user = await User.findOne({ _id: verified.userId, email: verified.email });
    if (!user) return res.status(400).json({ msg: 'Account not found.' });

    const bcrypt = require('bcrypt');
    user.password = await bcrypt.hash(newPassword, 12);
    user.emailVerified = true;
    user.token = undefined;
    await user.save();

    await require('../../models/otpChallenge.model').deleteMany({ email, userId: user._id });
    return res.status(200).json({ msg: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error.message);
    return res.status(error.statusCode || 500).json({ msg: error.statusCode ? error.message : 'Unable to reset password. Please try again.' });
  }
}

module.exports = { VerifyOtp, ResendOtp, ForgotPassword, ResetPassword };
