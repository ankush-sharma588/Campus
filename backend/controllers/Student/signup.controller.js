const User = require('../../models/user.model');
const bcrypt = require('bcrypt');
const { sendSignupConfirmation } = require('../../utils/emailNotifications');

const Signup = async (req, res) => {
  const { first_name, email, number, password } = req.body;

  try {
    if (!first_name || !email || !number || !password) {
      return res.status(400).json({ msg: 'Name, email, phone number and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ msg: 'User Already Exists!' });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      first_name: String(first_name).trim(),
      email: normalizedEmail,
      number,
      password: hashPassword,
      role: 'student',
      studentProfile: { isApproved: false },
    });

    // Email is best-effort: a temporary SMTP outage must not undo registration.
    void sendSignupConfirmation(newUser);
    return res.status(201).json({
      msg: 'User Created! Your account is waiting for placement-team approval.',
    });
  } catch (error) {
    console.error('student.signup.controller.js => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

module.exports = Signup;
