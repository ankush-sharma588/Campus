const mongoose = require('mongoose');

// Records which fixed management/superadmin identities have had their initial
// password configured. This prevents every redeploy from resetting passwords.
const PermanentAdminSeedSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ['management_admin', 'superuser'], required: true },
  seededAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model('PermanentAdminSeed', PermanentAdminSeedSchema);
