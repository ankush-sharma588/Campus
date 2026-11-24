// Kept as a compatibility export for any older controller that imports it.
// New account-creation flows use utils/emailNotifications.js so email failures
// do not undo a successfully created database record.
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const emailTemplate = ({ role, name, email, password }) => {
  const appUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://dcrust-campus-placement.vercel.app').split(',')[0].trim().replace(/\/$/, '');
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#172033">
    <div style="max-width:620px;margin:28px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="padding:24px;background:#172554;color:#fff"><h2 style="margin:0">Welcome to PlaceHub</h2><p>Campus Placement Portal</p></div>
      <div style="padding:28px"><p>Hello <strong>${escapeHtml(name)}</strong>,</p>
        <p>Your PlaceHub ${escapeHtml(role)} account has been created.</p>
        <div style="background:#f1f5f9;padding:16px;border-radius:8px"><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Temporary password:</strong> ${escapeHtml(password)}</p></div>
        <p>Please sign in and change your password as soon as possible. Keep these credentials private.</p>
        <p><a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:7px">Log in to PlaceHub</a></p>
      </div><div style="padding:16px;background:#f8fafc;color:#64748b;font-size:12px">&copy; ${new Date().getFullYear()} PlaceHub</div>
    </div></body></html>`;
};

module.exports = emailTemplate;
