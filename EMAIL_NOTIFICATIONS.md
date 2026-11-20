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

- `SMTP_USER`: the Gmail address used to send PlaceHub emails.
- `SMTP_PASS`: the Google App Password for that account, entered as 16 characters with no spaces.
- `SMTP_SERVICE`: `gmail` (optional; this is the default).
- `FRONTEND_URL`: `https://dcrust-campus-placement.vercel.app`.
- `MAIL_FROM_NAME`: `PlaceHub` (optional).

Do not put SMTP credentials in Vercel or in frontend code. Do not commit `.env` files to GitHub.

## Test email locally

From the backend directory, with the variables in `backend/.env`:

```bash
npm run test:email -- your-own-email@example.com
```

Or:

```bash
node scripts/test-email.js your-own-email@example.com
```

A successful test prints a Nodemailer message ID. A failed test prints the SMTP error in the terminal/Render logs.

## Delivery behavior

Email delivery is best-effort: PlaceHub saves the account, job, application, status or notice first. If Gmail is unavailable or SMTP is misconfigured, the primary operation remains saved and the backend logs the email failure. Bulk job/notice messages use BCC batches so student email addresses are not shown to other recipients.

For large-scale production sending, consider a transactional email provider rather than a personal Gmail account because Gmail applies sending and recipient limits.
