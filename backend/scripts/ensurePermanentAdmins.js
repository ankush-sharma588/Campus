const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const PermanentAdminSeed = require('../models/permanentAdminSeed.model');

// First two are permanent superadmins. The campus email is the permanent
// management account. Password is supplied only through Render's secret env.
const PERMANENT_ACCOUNTS = [
  { email: 'aaravnandal1212@gmail.com', first_name: 'Aarav', role: 'superuser' },
  { email: 'priya2002muskan@gmail.com', first_name: 'Priya', role: 'superuser' },
  { email: '24010021002@gateway.edu.in', first_name: 'Campus Management', role: 'management_admin' },
];

async function ensurePermanentAdmins() {
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!bootstrapPassword) {
    console.warn('[bootstrap] BOOTSTRAP_ADMIN_PASSWORD is not set; permanent admin accounts were not initialized.');
    return;
  }
  if (bootstrapPassword.length < 12) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(bootstrapPassword, 12);

  for (const account of PERMANENT_ACCOUNTS) {
    const email = account.email.toLowerCase();
    let marker = await PermanentAdminSeed.findOne({ email });
    let user = await User.findOne({ email });

    if (!marker) {
      // One-time initialization: claim these three identities for their
      // configured roles and set the common bootstrap password.
      if (!user) user = new User({ email });
      user.first_name = account.first_name;
      user.email = email;
      user.role = account.role;
      user.password = passwordHash;
      user.emailVerified = true;
      user.token = undefined;
      await user.save();

      try {
        await PermanentAdminSeed.create({ email, role: account.role });
      } catch (error) {
        // A simultaneous startup can race on the unique email index.
        if (error.code !== 11000) throw error;
      }
      console.log(`[bootstrap] Initialized permanent ${account.role} account: ${email}`);
      continue;
    }

    // Restore a deleted permanent identity and keep its role fixed, but do not
    // overwrite the password after initial setup (password resets stay valid).
    if (!user) {
      await User.create({
        first_name: account.first_name,
        email,
        password: passwordHash,
        role: account.role,
        emailVerified: true,
      });
      console.warn(`[bootstrap] Restored missing permanent account: ${email}`);
    } else if (user.role !== account.role || !user.emailVerified) {
      user.role = account.role;
      user.emailVerified = true;
      await user.save();
    }
  }
}

module.exports = ensurePermanentAdmins;
