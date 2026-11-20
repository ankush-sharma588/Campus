const User = require('../models/user.model');
const sendMail = require('../config/EmailProvider');

const APP_URL = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://dcrust-campus-placement.vercel.app')
  .split(',')[0]
  .trim()
  .replace(/\/$/, '');
const BRAND = 'PlaceHub';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function plainText(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function emailLayout(title, content, actionLabel = 'Open PlaceHub', actionUrl = APP_URL) {
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(actionUrl);
  return `<!doctype html>
  <html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#172033">
    <div style="max-width:620px;margin:28px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:24px 28px;background:#172554;color:#ffffff">
        <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:.85">${BRAND}</div>
        <h1 style="font-size:23px;margin:10px 0 0">${safeTitle}</h1>
      </div>
      <div style="padding:28px;line-height:1.6;font-size:15px">${content}
        <p style="margin:26px 0"><a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:7px;font-weight:600">${escapeHtml(actionLabel)}</a></p>
        <p style="color:#64748b;font-size:13px">This is an automated notification from ${BRAND}. Please do not reply to this email.</p>
      </div>
      <div style="padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px">&copy; ${new Date().getFullYear()} ${BRAND}</div>
    </div>
  </body></html>`;
}

async function deliver(to, subject, html, text) {
  try {
    await sendMail(to, subject, html, text);
    return true;
  } catch (error) {
    console.error(`[email] Could not send "${subject}":`, error.message);
    return false;
  }
}

async function deliverBulk(addresses, subject, html, text) {
  const uniqueAddresses = [...new Set((addresses || []).filter(Boolean).map((address) => String(address).trim()).filter(Boolean))];
  if (!uniqueAddresses.length) return { sent: 0, failed: 0 };

  // BCC in small batches so recipients do not see one another's email addresses.
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < uniqueAddresses.length; index += 40) {
    const batch = uniqueAddresses.slice(index, index + 40);
    // Keep recipient addresses private: put one recipient in To and the rest in BCC.
    const ok = await deliver({ to: batch[0], bcc: batch.slice(1) }, subject, html, text);
    if (ok) sent += batch.length;
    else failed += batch.length;
  }
  return { sent, failed };
}

async function getRoleEmails(role, extraFilter = {}) {
  const recipients = await User.find({
    role,
    email: { $exists: true, $ne: '' },
    ...extraFilter,
  }).select('email').lean();
  return recipients.map((user) => user.email);
}

async function sendSignupConfirmation(student) {
  const name = escapeHtml(student.first_name || 'Student');
  const html = emailLayout('Your student registration was received',
    `<p>Hello <strong>${name}</strong>,</p>
     <p>Your PlaceHub student account has been created successfully. It is currently waiting for approval from the placement team.</p>
     <p>You will be able to use student placement features after your account is approved.</p>`);
  return deliver(student.email, 'PlaceHub: Student registration received', html,
    `Hello ${student.first_name || 'Student'}, your student registration was received and is awaiting approval.`);
}

async function notifyStudentApproved(student) {
  const name = escapeHtml(student.first_name || 'Student');
  const html = emailLayout('Your student account has been approved',
    `<p>Hello <strong>${name}</strong>,</p>
     <p>Your PlaceHub student account has been approved by the placement team.</p>
     <p>You can now sign in, complete your placement profile and explore available opportunities.</p>`);
  return deliver(student.email, 'PlaceHub: Your student account is approved', html,
    `Hello ${student.first_name || 'Student'}, your PlaceHub student account has been approved. You can now sign in and use the placement portal.`);
}

async function notifyAccountCreated(user, role) {
  const name = escapeHtml(user.first_name || 'there');
  const safeRole = escapeHtml(role || user.role || 'user');
  const html = emailLayout(`Your ${safeRole} account has been created`,
    `<p>Hello <strong>${name}</strong>,</p>
     <p>Your PlaceHub ${safeRole} account has been created by the college placement team.</p>
     <p>Sign in using the credentials shared with you by your institution. If you need help accessing your account, contact the placement team.</p>`);
  return deliver(user.email, `PlaceHub: Your ${safeRole} account is ready`, html,
    `Your PlaceHub ${role || user.role} account has been created. Sign in using the credentials shared by your institution.`);
}

async function sendAccountCredentials({ email, name, role, password }) {
  const html = emailLayout(`Your ${role} account is ready`,
    `<p>Hello <strong>${escapeHtml(name || 'there')}</strong>,</p>
     <p>Your PlaceHub ${escapeHtml(role)} account has been created.</p>
     <div style="padding:16px;background:#f1f5f9;border-radius:8px">
       <p><strong>Email:</strong> ${escapeHtml(email)}</p>
       <p><strong>Temporary password:</strong> ${escapeHtml(password)}</p>
     </div>
     <p>Please sign in and change your password as soon as possible. Keep this message private.</p>`,
    'Sign in to PlaceHub');
  return deliver(email, `PlaceHub: Your ${role} account details`, html,
    `Your PlaceHub ${role} account is ready. Email: ${email}. Temporary password: ${password}. Please change it after signing in.`);
}

async function notifyJobPosted(job, companyName) {
  try {
    const students = await getRoleEmails('student', { 'studentProfile.isApproved': true });
    const title = escapeHtml(job.jobTitle);
    const company = escapeHtml(companyName || 'Company');
    const deadline = job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('en-IN') : 'See the job listing';
    const description = escapeHtml(plainText(job.jobDescription).slice(0, 500));
    const html = emailLayout('A new placement opportunity is available',
      `<p>A new opportunity has been posted for approved PlaceHub students.</p>
       <div style="padding:16px;background:#f1f5f9;border-radius:8px">
         <h2 style="margin:0 0 8px">${title}</h2>
         <p><strong>Company:</strong> ${company}</p>
         <p><strong>Application deadline:</strong> ${escapeHtml(deadline)}</p>
         ${description ? `<p>${description}</p>` : ''}
       </div>
       <p>Sign in to review the full eligibility criteria and apply before the deadline.</p>`,
      'View placement opportunities');
    const result = await deliverBulk(students, `PlaceHub: New job opportunity - ${plainText(job.jobTitle)}`,
      html, `A new job opportunity is available: ${plainText(job.jobTitle)} at ${companyName || 'a company'}. Application deadline: ${deadline}. Sign in to PlaceHub to check eligibility and apply.`);
    console.log(`[email] New job notice: ${result.sent} recipients sent, ${result.failed} failed.`);
    return result;
  } catch (error) {
    console.error('[email] Could not prepare new-job notification:', error.message);
    return { sent: 0, failed: 0 };
  }
}

async function notifyApplicationReceived(student, job, companyName) {
  const name = escapeHtml(student.first_name || 'Student');
  const jobTitle = escapeHtml(job.jobTitle || 'the placement opportunity');
  const company = escapeHtml(companyName || 'the company');
  const html = emailLayout('Your job application was submitted',
    `<p>Hello <strong>${name}</strong>,</p>
     <p>Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been recorded successfully.</p>
     <p>You can check your application status in your PlaceHub dashboard.</p>`);
  const studentSent = await deliver(student.email, `PlaceHub: Application received - ${plainText(job.jobTitle)}`,
    html, `Your application for ${plainText(job.jobTitle)} at ${companyName || 'the company'} has been received.`);

  try {
    const tpoEmails = await getRoleEmails('tpo_admin');
    const tpoHtml = emailLayout('A student applied for a placement',
      `<p><strong>${name}</strong> (${escapeHtml(student.email)}) applied for <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
       <p>Sign in to PlaceHub to review the applicants.</p>`, 'Review applicants', `${APP_URL}/tpo/job-listings`);
    await deliverBulk(tpoEmails, `PlaceHub: New applicant - ${plainText(job.jobTitle)}`, tpoHtml,
      `${student.first_name || 'A student'} applied for ${plainText(job.jobTitle)} at ${companyName || 'the company'}.`);
  } catch (error) {
    console.error('[email] Could not notify TPOs of application:', error.message);
  }
  return studentSent;
}

async function notifyApplicationStatus(student, job, changes) {
  const name = escapeHtml(student.first_name || 'Student');
  const jobTitle = escapeHtml(job.jobTitle || 'your application');
  const details = changes.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join('');
  const summary = changes.map(([label, value]) => `${label}: ${value}`).join('\n');
  const html = emailLayout('Your placement application was updated',
    `<p>Hello <strong>${name}</strong>,</p>
     <p>There has been an update to your application for <strong>${jobTitle}</strong>:</p>
     <ul>${details}</ul>
     <p>Sign in to PlaceHub for the latest information and any next steps.</p>`);
  return deliver(student.email, `PlaceHub: Application update - ${plainText(job.jobTitle)}`,
    html, `Your application for ${plainText(job.jobTitle)} was updated.\n${summary}`);
}

async function notifyNotice(receiverRole, notice, senderRole) {
  try {
    const recipients = await getRoleEmails(receiverRole,
      receiverRole === 'student' ? { 'studentProfile.isApproved': true } : {});
    const title = escapeHtml(notice.title || 'New notice');
    const message = escapeHtml(notice.message || '').replace(/\r?\n/g, '<br>');
    const html = emailLayout('A new college notice has been published',
      `<p><strong>${title}</strong></p>
       <div style="padding:16px;background:#f1f5f9;border-radius:8px">${message}</div>
       <p>Published by: ${escapeHtml(senderRole || 'Placement team')}</p>`);
    const result = await deliverBulk(recipients, `PlaceHub Notice: ${plainText(notice.title || 'New notice')}`,
      html, `${notice.title || 'New notice'}\n\n${notice.message || ''}\n\nPublished by: ${senderRole || 'Placement team'}`);
    console.log(`[email] Notice "${plainText(notice.title)}": ${result.sent} recipients sent, ${result.failed} failed.`);
    return result;
  } catch (error) {
    console.error('[email] Could not prepare notice email:', error.message);
    return { sent: 0, failed: 0 };
  }
}

module.exports = {
  sendSignupConfirmation,
  notifyStudentApproved,
  notifyAccountCreated,
  sendAccountCredentials,
  notifyJobPosted,
  notifyApplicationReceived,
  notifyApplicationStatus,
  notifyNotice,
};
