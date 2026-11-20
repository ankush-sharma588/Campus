# PlaceHub email notifications

The backend now sends transactional emails for these events:

- Student self-registration: confirmation that the account is awaiting approval.
- Student account approval: confirmation when the placement team approves the account.
- Student/TPO/management account creation by an administrator: login credentials.
- New placement job: notification to approved student accounts.
- Job application: confirmation to the student and notification to TPO accounts.
- Application update: notification to the student when status, interview round/result, selection/joining date, offer letter or package changes.
- College notice: email to the selected recipient role (approved students or TPOs, based on the notice audience).

## Render environment variables

Set these on the **backend Web Service** in Render → Environment:

- `BREVO_API_KEY`: a Brevo API key. Keep it only in Render's backend environment.
- `BREVO_SENDER_EMAIL`: the sender address you registered and verified in Brevo.
- `BREVO_SENDER_NAME`: `PlaceHub` (optional; this is the display name).
- `FRONTEND_URL`: `https://dcrust-campus-placement.vercel.app`.

Do not put the Brevo API key in Vercel or in frontend code. Do not commit `.env` files to GitHub.

## Test email locally

From the backend directory, with the variables in `backend/.env`:

```bash
npm run test:email -- your-own-email@example.com
```

Or:

```bash
node scripts/test-email.js your-own-email@example.com
```

A successful test prints the Brevo message ID. A failed test prints the provider error in the terminal/Render logs.

## Delivery behavior

Email delivery is best-effort: PlaceHub saves the account, job, application, status or notice first. If Brevo is unavailable or its API configuration is incorrect, the primary operation remains saved and the backend logs the email failure. Bulk job/notice messages use BCC batches so student email addresses are not shown to other recipients.

Brevo Free currently includes 300 email sends per day. Check its current plan limits before sending large notification batches.

## Set up Brevo

1. Create a Brevo account and open **SMTP & API → API Keys** (the API key is used by the HTTPS API; do not use the SMTP key).
2. Under **Settings → Senders, Domains, IPs → Senders**, add the sender email address you control. If its domain is not authenticated, Brevo prompts you to verify the address using a code sent to that mailbox.
3. Copy the API key and verified sender email into the Render backend environment as `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`. Keep these values out of Vercel and frontend code.
4. Redeploy the Render backend, then test with `npm run test:email -- your-own-email@example.com` from the backend directory.

Domain authentication is recommended for deliverability. A free mailbox sender can be verified by email, but Brevo notes that free sender domains such as Gmail/Yahoo cannot be domain-authenticated and may have weaker inbox placement.
