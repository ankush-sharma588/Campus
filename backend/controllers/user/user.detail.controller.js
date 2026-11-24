const UserDetail = async (req, res) => {
  // Return only safe user data. The previous implementation returned the
  // password hash and dereferenced student-only fields for every role, which
  // caused superadmin/management profiles to fail.
  const safeUser = req.user.toObject();
  safeUser.id = String(safeUser._id);

  delete safeUser._id;
  delete safeUser.__v;
  delete safeUser.password;
  delete safeUser.token;

  return res.status(200).json(safeUser);
};

module.exports = UserDetail;
