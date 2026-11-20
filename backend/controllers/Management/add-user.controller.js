const Users = require('../../models/user.model');
const bcrypt = require('bcrypt');
const generatePassword = require('../../utlis/generatePassword');
const { sendAccountCredentials } = require('../../utils/emailNotifications');

async function createAccount({ email, first_name, number, role, profileField }) {
  if (!email || !first_name || !number) {
    return { status: 400, body: { msg: 'Name, email and phone number are required.' } };
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (await Users.findOne({ email: normalizedEmail })) {
    return { status: 409, body: { msg: 'User Already Exists!' } };
  }

  const password = generatePassword();
  const hashPassword = await bcrypt.hash(password, 10);
  const accountData = {
    first_name: String(first_name).trim(),
    email: normalizedEmail,
    number,
    password: hashPassword,
    role,
  };

  if (profileField === 'studentProfile') {
    accountData.studentProfile = { isApproved: true };
  }

  await Users.create(accountData);
  const emailSent = await sendAccountCredentials({
    email: normalizedEmail,
    name: first_name,
    role: role === 'tpo_admin' ? 'TPO' : role === 'management_admin' ? 'Management' : 'Student',
    password,
  });

  return {
    status: 201,
    body: {
      msg: emailSent
        ? 'User Created! Login credentials were sent by email.'
        : 'User Created, but the email could not be sent. Check SMTP settings in Render.',
      emailSent,
    },
  };
}

const AddTPO = async (req, res) => {
  try {
    const result = await createAccount({ ...req.body, role: 'tpo_admin' });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('management-user-add-tpo => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

const AddManagement = async (req, res) => {
  try {
    const result = await createAccount({ ...req.body, role: 'management_admin' });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('management-user-add-management => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

const AddStudent = async (req, res) => {
  try {
    const result = await createAccount({ ...req.body, role: 'student', profileField: 'studentProfile' });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('management-user-add-student => ', error);
    return res.status(500).json({ msg: 'Internal Server Error!' });
  }
};

module.exports = { AddTPO, AddManagement, AddStudent };
