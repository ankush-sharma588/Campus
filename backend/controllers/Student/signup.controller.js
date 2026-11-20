const User = require('../../models/user.model');
const bcrypt = require('bcrypt');
const { issueOtp, normalizeEmail } = require('../../services/otp.service');

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const Signup = async (req, res) => {
  const { first_name, number, password } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    if (!first_name || !email || !number || !password) {
      return res.status(400).json({ msg: 'Name, email, phone number and password are required.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ msg: 'Enter a valid email address.' });
    }
    if (!PASSWORD_PATTERN.test(password)) {
      return res.status(400).json({ msg: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character.' });
    }
    if (!/^\d{10}$/.test(String(number))) {
      return res.status(400).json({ msg: 'Phone number must contain exactly 10 digits.' });
    }

    let user = await User.findOne({ email });
    if (user && (user.role !== 'student' || user.emailVerified)) {
      return res.status(400).json({ msg: 'User Already Exists!' });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    if (!user) {
      user = await User.create({
        first_name: String(first_name).trim(),
        email,
        number: Number(number),
        password: hashPassword,
        role: 'student',
        emailVerified: false,
        studentProfile: { isApproved: false },
      });
    } else {
      // An unverified registration may be safely completed again by its email owner.
      user.first_name = String(first_name).trim();
      user.number = Number(number);
      user.password = hashPassword;
      await user.save();
    }

    const delivery = await issueOtp({ user, purpose: 'signup' });
    return res.status(200).json({
      otpRequired: true,
      email: delivery.email,
      expiresInSeconds: delivery.expiresInSeconds,
      resendAfterSeconds: delivery.resendAfterSeconds,
      msg: 'A 6-digit verification code has been sent to your email address.',
    });
  } catch (error) {
    console.error('student.signup.controller.js =>', error.message);
    return res.status(error.statusCode || 503).json({
      msg: error.statusCode ? error.message : 'Could not send the verification email. Please try again later.',
      retryAfter: error.retryAfter,
    });
  }
};

module.exports = Signup;
