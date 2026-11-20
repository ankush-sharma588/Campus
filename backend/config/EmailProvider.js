/**
 * Transactional email provider for Render Free and other hosts that restrict SMTP.
 * Uses Brevo's HTTPS API (port 443), not SMTP ports 25/465/587.
 *
 * Environment:
 *   BREVO_API_KEY       Brevo API key (keep server-side)
 *   BREVO_SENDER_EMAIL  Sender address verified in Brevo
 *   BREVO_SENDER_NAME   Optional display name (defaults to PlaceHub)
 */
function normalizeRecipients(value, fieldName) {
  if (value == null) return undefined;

  const entries = Array.isArray(value) ? value : [value];
  const recipients = entries
    .filter(Boolean)
    .map((entry) => {
      if (typeof entry === 'string') return { email: entry.trim() };
      if (typeof entry === 'object') {
        const email = entry.email || entry.address;
        if (!email) {
          throw new Error(`Invalid ${fieldName} recipient: missing email address.`);
        }
        const recipient = { email: String(email).trim() };
        if (entry.name) recipient.name = String(entry.name).trim();
        return recipient;
      }
      throw new Error(`Invalid ${fieldName} recipient.`);
    });

  return recipients.length ? recipients : undefined;
}

/**
 * Send a message. `to` may be an email address, an array of addresses, or
 * { to, cc, bcc, replyTo } as used by existing notification code.
 */
async function sendMail(to, subject, html, text) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error(
      'Email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in the backend environment.'
    );
  }

  const recipients = typeof to === 'string' || Array.isArray(to) ? { to } : (to || {});
  const toList = normalizeRecipients(recipients.to, 'to');
  if (!toList?.length) {
    throw new Error('Email requires at least one recipient.');
  }

  const payload = {
    sender: {
      name: process.env.BREVO_SENDER_NAME || process.env.MAIL_FROM_NAME || 'PlaceHub',
      email: senderEmail,
    },
    to: toList,
    subject,
  };

  // Brevo accepts one body format per request. Prefer the existing HTML
  // template; send plain text only when HTML is not supplied.
  if (html) payload.htmlContent = html;
  else if (text) payload.textContent = text;

  const cc = normalizeRecipients(recipients.cc, 'cc');
  const bcc = normalizeRecipients(recipients.bcc, 'bcc');
  const replyTo = normalizeRecipients(recipients.replyTo, 'reply-to');
  if (cc) payload.cc = cc;
  if (bcc) payload.bcc = bcc;
  if (replyTo?.[0]) payload.replyTo = replyTo[0];

  let response;
  try {
    response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Email provider request timed out. Please try again.');
    }
    throw new Error(`Could not reach the email provider: ${error.message}`);
  }

  const responseText = await response.text();
  let result = {};
  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }
  }

  if (!response.ok) {
    const detail = result.message || result.code || `HTTP ${response.status}`;
    throw new Error(`Brevo email API error (${response.status}): ${detail}`);
  }

  return {
    messageId: result.messageId,
    response: result,
  };
}

module.exports = sendMail;
