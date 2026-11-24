const User = require('../../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { normalizeEmail } = require('../../services/otp.service');

// Password-only login for student, TPO, management and superadmin roles.
// Signup verification and password recovery continue to use email OTP.
function createLoginWithOtpController(requiredRole) {
  return async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ msg: 'Authentication is not configured on the server.' });
    }

    try {
      const user = await User.findOne({ email, role: requiredRole });
      if (!user) return res.status(401).json({ msg: 'Email or password is incorrect.' });

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) return res.status(401).json({ msg: 'Email or password is incorrect.' });

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
      );

      user.token = token;
      await user.save();

      return res.status(200).json({
        otpRequired: false,
        token,
        role: user.role,
        msg: 'Login successful.',
      });
    } catch (error) {
      console.error(`${requiredRole} password login error:`, error.message);
      return res.status(500).json({ msg: 'Unable to log in right now. Please try again.' });
    }
  };
}

module.exports = createLoginWithOtpController;
