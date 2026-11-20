# PlaceHub email OTP security

PlaceHub uses email OTP verification for student signup, email-based two-factor login for all four roles (student, TPO, management and superuser), and OTP-based password recovery.

## OTP policy

- Six-digit cryptographically generated code.
- Five-minute validity and one-time use.
- Maximum five incorrect verification attempts per issued code.
- Minimum 60-second delay between sends to the same email and purpose.
- Only an HMAC-SHA256 hash of the OTP is stored in MongoDB.
- Expired OTP records are automatically removed using a MongoDB TTL index.
- Password reset revokes the current saved login token.
- Forgot-password responses do not reveal whether an email address has an account.

## Environment variables

Set these in Render's backend environment (and in `backend/.env` for local development). Email is sent through Brevo's HTTPS API, not SMTP:

```env
JWT_SECRET=<long-random-jwt-signing-secret>
OTP_SECRET=<different-long-random-secret>
BREVO_API_KEY=<Brevo-API-key>
BREVO_SENDER_EMAIL=<verified-sender-address>
BREVO_SENDER_NAME=PlaceHub Placement Cell
MAIL_FROM_NAME=PlaceHub Placement Cell
FRONTEND_URL=https://dcrust-campus-placement.vercel.app
CLIENT_URL=https://dcrust-campus-placement.vercel.app
```

`OTP_SECRET` must be a long random value and should be different from `JWT_SECRET`. If it is omitted, the OTP service falls back to `JWT_SECRET` for compatibility. Do not commit `.env` or secrets to GitHub.

## User experience

1. Student signup creates an unverified student account and emails an OTP. The account is marked verified only after the correct code is submitted.
2. Every role login first checks email/password, then emails a second-factor OTP. A JWT is issued only after OTP verification.
3. Forgot password emails an OTP. The user must provide the OTP and a new password before the password hash is changed.
4. All OTPs are single-use. Resend is throttled per email/purpose.

## Demo accounts

The existing demo seeder uses `.test` email addresses. These are reserved example addresses and normally cannot receive mail. With login OTP enabled, update seeded demo users to email addresses or aliases that can actually receive mail before testing those accounts. Do not add a production OTP bypass for demo users.

## API endpoints

- `POST /student/signup` — start student registration and send signup OTP.
- `POST /auth/otp/verify` — verify a signup or login OTP (`email`, `purpose`, `code`).
- `POST /auth/otp/resend` — resend an active OTP (`email`, `purpose`).
- `POST /student/login`, `/tpo/login`, `/management/login`, `/admin/login` — password check and issue login OTP challenge.
- `POST /auth/password/forgot` — request password reset OTP.
- `POST /auth/password/reset` — verify reset OTP and set a new password (`email`, `code`, `newPassword`).
