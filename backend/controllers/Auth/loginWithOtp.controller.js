const User = require('../../models/user.model');
const bcrypt = require('bcrypt');
const { issueOtp, normalizeEmail } = require('../../services/otp.service');

function createLoginWithOtpController(requiredRole) {
  return async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required.' });
    }

    try {
      const user = await User.findOne({ email });
      if (!user || user.role !== requiredRole) {
        return res.status(400).json({ msg: 'Credentials Not Matched!' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Credentials Not Matched!' });
      }

      const delivery = await issueOtp({ user, purpose: 'login' });
      return res.status(200).json({
        otpRequired: true,
        email: delivery.email,
        expiresInSeconds: delivery.expiresInSeconds,
        resendAfterSeconds: delivery.resendAfterSeconds,
        msg: 'A verification code has been sent to your email address.',
      });
    } catch (error) {
      console.error(`${requiredRole} login OTP error:`, error.message);
      return res.status(error.statusCode || 503).json({
        msg: error.statusCode ? error.message : 'Could not send the verification email. Please try again later.',
        retryAfter: error.retryAfter,
      });
    }
  };
}

module.exports = createLoginWithOtpController;
