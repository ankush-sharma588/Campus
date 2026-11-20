const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

function getTransporter() {
  const { SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('Email is not configured. Set SMTP_USER and SMTP_PASS in the backend environment.');
  }

  if (!transporter) {
    const config = {
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    };

    if (process.env.SMTP_HOST) {
      config.host = process.env.SMTP_HOST;
      config.port = Number(process.env.SMTP_PORT || 587);
      config.secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    } else {
      config.service = process.env.SMTP_SERVICE || 'gmail';
    }

    transporter = nodemailer.createTransport(config);
  }

  return transporter;
}

/**
 * Send an email. `to` may be an address or a Nodemailer recipient object
 * such as { to: 'sender@example.com', bcc: ['one@example.com'] }.
 * Errors are intentionally propagated; notification callers decide whether
 * an email failure should affect the main API operation.
 */
async function sendMail(to, subject, html, text) {
  const transporter = getTransporter();
  const recipients = typeof to === 'string' || Array.isArray(to) ? { to } : to;

  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'PlaceHub'}" <${process.env.SMTP_USER}>`,
    ...recipients,
    subject,
    html,
    ...(text ? { text } : {}),
  });
}

module.exports = sendMail;
