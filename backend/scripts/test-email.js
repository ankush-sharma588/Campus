const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sendMail = require('../config/EmailProvider');

const recipient = process.argv[2];
if (!recipient) {
  console.error('Usage: node scripts/test-email.js recipient@example.com');
  process.exit(1);
}

const html = `<!doctype html><html><body style="font-family:Arial,sans-serif">
  <h2>PlaceHub email test successful</h2>
  <p>Your backend Brevo API configuration can send email notifications.</p>
</body></html>`;

sendMail(recipient, 'PlaceHub: Email notification test', html,
  'Your backend Brevo API configuration can send email notifications.')
  .then((info) => {
    console.log(`Email sent successfully to ${recipient}. Message ID: ${info.messageId}`);
  })
  .catch((error) => {
    console.error('Email test failed:', error.message);
    process.exitCode = 1;
  });
