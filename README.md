# PlaceHub — Campus Placement Portal

A role-based campus placement workspace for students, Training and Placement Officers (TPOs), management teams and system administrators.

PlaceHub brings student onboarding, job opportunities, applications, notices, placement updates and offer records into one organised workflow.

## Product at a glance

| Workspace | What it is for |
| --- | --- |
| Student | Maintain a placement profile, browse openings, apply, track application status and record internships or offers. |
| TPO | Manage companies and job postings, review student activity, publish notices and coordinate placement workflows. |
| Management | Monitor placement activity, manage TPO access and review student/company information. |
| Super Admin | Manage system users and platform administration. |

## Architecture

The frontend and backend are independently deployable. The browser never connects directly to the database.

```text
Browser
  |
  v
Vercel — React + Vite static frontend
  |
  | HTTPS requests (VITE_BACKEND_URL)
  v
Render — Express API (backend/)
  |              |                |
  v              v                v
MongoDB Atlas   Cloudinary        Brevo
(users, jobs,   (profile media,   (transactional
applications,   resumes, offers)  email / OTP)
notices)
```

### System boundaries

- **Frontend:** static React application; presentation and client-side routing only.
- **API:** owns authentication, authorization, validation, business rules and database access.
- **MongoDB Atlas:** source of truth for user and placement records.
- **Cloudinary:** stores uploaded media and documents.
- **Brevo:** sends transactional email and verification codes.
- **Secrets:** stay on the backend. Never place private credentials in a `VITE_*` variable.

## Technology

- **Frontend:** React, Vite, React Router, Tailwind CSS, Bootstrap
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** JWT, password hashing and email OTP workflows
- **File storage:** Cloudinary
- **Transactional email:** Brevo HTTPS API
- **Hosting:** Vercel (frontend) and Render (API)

## Repository layout

```text
Campus/
├── backend/
│   ├── config/           # MongoDB, Cloudinary and upload configuration
│   ├── controllers/      # Request handling and business logic
│   ├── middleware/       # Authentication and request protection
│   ├── models/           # Mongoose data models
│   ├── routes/           # Express route groups
│   ├── services/         # OTP and application services
│   ├── scripts/          # Setup and maintenance tasks
│   ├── tests/            # Automated backend tests
│   ├── index.js
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── style/
│   ├── vercel.json       # SPA rewrite for direct route visits
│   └── .env.example
├── .github/workflows/    # CI checks
├── render.yaml           # Render API-only blueprint
└── README.md
```

## Local development

### Prerequisites

- Node.js **20.19+** (or a supported current Node 22 release)
- npm
- MongoDB Atlas connection string or local MongoDB instance
- Cloudinary credentials for file uploads
- Verified Brevo sender and API key for email/OTP workflows

### 1. Clone the repository

```bash
git clone https://github.com/ankush-sharma588/Campus.git
cd Campus
```

### 2. Start the API

```bash
cd backend
cp .env.example .env
npm ci
npm start
```

The API listens on port **4518** by default. Set the required values in `backend/.env` before starting it. The server waits for MongoDB and the permanent-admin bootstrap routine before accepting traffic.

### 3. Start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Vite normally serves the app at `http://localhost:5173`. The frontend environment file should contain:

```env
VITE_BACKEND_URL=http://localhost:4518
```

Use the bare API origin. Do not append `/api`: route groups are mounted at the backend root (for example `/student`, `/auth` and `/user`).

## Environment variables

### Backend — Render and local `.env`

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` locally; `production` on Render. |
| `PORT` | HTTP port; Render supplies this automatically. Local default is `4518`. |
| `MONGODB_URL` | MongoDB connection string. Keep credentials private. |
| `JWT_SECRET` | Long, random secret used to sign authentication tokens. |
| `JWT_EXPIRES_IN` | Token lifetime; current default is `12h`. |
| `OTP_SECRET` | Separate long, random secret for OTP protection. |
| `BOOTSTRAP_ADMIN_PASSWORD` | One-time password for the permanent-admin bootstrap. Store it only in hosting-provider secrets, never in Git. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary secret. |
| `BREVO_API_KEY` | Brevo transactional email API key. |
| `BREVO_SENDER_EMAIL` | Verified sender email. |
| `BREVO_SENDER_NAME` | Sender display name; defaults to PlaceHub. |
| `FRONTEND_URL` | Public frontend URL used in email links. |
| `CLIENT_URL` | Exact frontend origin(s) allowed by API CORS, comma-separated, including scheme and host and without a trailing slash. |

The bootstrap password is not a normal account password. A seed marker prevents established permanent-account passwords from being overwritten on every restart. Keep the bootstrap value private and follow the supported account process for subsequent password changes.

### Frontend — Vercel and local `.env`

| Variable | Purpose |
| --- | --- |
| `VITE_BACKEND_URL` | Public API origin used by the browser. This is not a secret. |

Only expose values that are safe for every visitor to see in the browser.

## Deployment

### Frontend — Vercel

1. Keep the existing Vercel Production environment pointed at the existing production Render API.
2. Set the project root directory to `frontend`.
3. Use the Vite framework preset.
4. Build command: `npm ci && npm run build`.
5. Output directory: `dist`.
6. Keep the existing Production value of `VITE_BACKEND_URL` unchanged.
7. Add a separate Preview value of `VITE_BACKEND_URL` pointing to the new staging Render API.
8. Keep `frontend/vercel.json`. Its SPA rewrite supports direct visits and refreshes on React Router paths such as `/student/signup`.

### Backend — Render staging

1. Create a **new** Render service from this repository using the updated `render.yaml`.
2. Confirm the service name is `placehub-api-staging`, branch is `maintenance/deploy-stability`, and region is Singapore.
3. Set root directory to `backend`, build command to `npm ci --omit=dev`, start command to `npm start`, and health check path to `/health`.
4. Configure the staging-only backend variables. Set `NODE_ENV=production` and `CLIENT_URL` to the Vercel Preview origin.
5. Use a separate MongoDB database name such as `placement_staging` in `MONGODB_URL`. Use separate staging JWT/OTP/bootstrap secrets. Do not reuse the production database path or production credentials.
6. Use a test-only sender / recipient strategy for OTP verification. Do not send test codes to real users.
7. Allow the staging service to reach the MongoDB Atlas cluster.

The `render.yaml` file describes a **new staging API service only**. It is intentionally named and pinned to the maintenance branch so it does not replace the existing production service, which remains on `main`.

### Safe release workflow

- Work on a feature or maintenance branch.
- Review frontend changes with Vercel Preview Deployments.
- Deploy the maintenance branch to a separate Render staging API with a separate database name.
- Set Vercel Preview's `VITE_BACKEND_URL` to that staging API; keep Vercel Production's value unchanged.
- Verify authentication, role access, uploads, OTP delivery, protected routes and database-aware health checks in staging.
- Merge to `main` only after review. Never point staging tests at production data.

## Main application routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/student/signup` | Student registration and email verification |
| `/student/login` | Student sign-in |
| `/tpo/login` | TPO sign-in |
| `/management/login` | Management sign-in |
| `/admin` | Super-admin sign-in |
| `/student/dashboard` | Student workspace |
| `/tpo/dashboard` | TPO workspace |
| `/management/dashboard` | Management workspace |
| `/admin/Dashboard` | Super-admin workspace |

Friendly aliases `/signup` and `/login` redirect to the student signup and login routes.

## API surface

The Express API mounts these route groups at the root:

- `/auth` — OTP verification/resend and password recovery
- `/user` — account and user details
- `/student` — signup, login, job applications, internships and student data
- `/tpo` — TPO workflows
- `/management` — management workflows
- `/admin` — super-admin workflows
- `/company` — company records
- `/health` — API and database health

Controllers and middleware are the source of truth for request validation and permissions. Hiding a frontend control is not an authorization boundary.

## Quality checks

Run these before requesting a deployment:

```bash
# Frontend production build and lint
cd frontend
npm ci
npm run build
npm run lint

# Backend automated tests
cd ../backend
npm ci
npm test
```

The CI workflow checks the frontend production build and backend automated tests. Lint is intentionally a separate check so existing lint debt is visible rather than hidden behind a successful build.

## Operational and system-design notes

- `/health` reports a degraded status if the MongoDB connection is unavailable.
- OTP resend throttling and expired verification challenges are expected user-facing states; surface clear recovery guidance instead of treating every 4xx response as a server crash.
- The current IP-based authentication limiter uses process-local memory. Before scaling to multiple API instances, move IP limits to a shared store so the same client cannot bypass limits by reaching another instance.
- Keep secrets in Render environment settings and local `.env` files only. Example files contain placeholders, not usable credentials.
- The maintenance helper removes previously tracked dependency/build folders from Git's index while leaving local copies in place; `.gitignore` prevents them being committed again.
- Use staging databases and test email addresses for automated integration tests. Do not send unsolicited OTPs to real users.
- Keep the API stateless where practical. Store durable workflow state in MongoDB, use explicit role checks on the server, and avoid making the browser authoritative for account roles or application status.
- Add request IDs and structured server logs before expanding the number of API instances; avoid logging passwords, OTP values, tokens or document contents.
- Use database indexes for frequently queried fields (such as normalized email and application ownership), and validate query plans before adding indexes to high-write collections.
- Move heavy document processing and notification fan-out to a queue only when the measured workload needs it. Keep the initial free-tier architecture small and observable.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Frontend shows “Network Error” | Confirm `VITE_BACKEND_URL`, Render status and the `CLIENT_URL` CORS allowlist. |
| Direct route refresh returns 404 | Confirm Vercel root directory is `frontend` and `frontend/vercel.json` is present. |
| API does not start | Check Render build/runtime logs and required backend variables, especially `MONGODB_URL` and `JWT_SECRET`. |
| OTP does not arrive | Verify the Brevo API key, sender verification, sender address, resend limits and Render logs. |
| Dashboard returns to login | Confirm the token is present, unexpired and accepted by backend authentication middleware. |

---

**PlaceHub — Campus Placement Portal**
