# PlaceHub — Campus Placement Portal

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Technology](#technology)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Checks](#checks)

## Introduction

PlaceHub is a campus placement portal for students, Training and Placement Officers (TPOs), management users, and super administrators. The production hosting layout is a Vite/React frontend on **Vercel**, an Express API on **Render**, MongoDB for application data, Cloudinary for file uploads, and Brevo for transactional email.

## Features

- **Student portal:** account registration and login, placement profile, resume upload, job applications, internships, notices, and application status.
- **TPO portal:** job and company management, student listings, application updates, and offer-letter uploads.
- **Management portal:** student and TPO oversight, notices, job/company views, and placement information.
- **Super-admin portal:** user administration for management, TPO, and student accounts.
- **Authentication:** password login, role-protected routes, email OTP flows, password reset, and rate-limited authentication endpoints.
- **Email and file services:** Brevo transactional email and Cloudinary-hosted profile/resume/offer-letter assets.

## Technology

- **Frontend:** React, Vite, React Router, Tailwind CSS, and Bootstrap.
- **Backend:** Node.js, Express, Mongoose, and JWT.
- **Database:** MongoDB (MongoDB Atlas is supported).
- **Email:** Brevo HTTPS API.
- **File storage:** Cloudinary.
- **Hosting:** Vercel (frontend) and Render (API).

Use Node.js **22.x** for local development, Docker, and Render. The Render service is pinned to Node.js 22.23.5; Vercel is configured for the 22.x line. Keep both `package-lock.json` files committed and use `npm ci` to install dependencies reproducibly. The repository ignores generated dependency and build folders; existing tracked copies must be removed from Git's index once after applying this maintenance patch (see the command below).

## Project Structure

```text
Campus/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── test/
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── vercel.json
├── kubernetes/        # optional deployment manifests
├── docker-compose.yaml
├── render.yaml        # Render API blueprint only
└── README.md
```

## User Roles

- **Students:** view opportunities, maintain their profile, apply for jobs, upload documents, and follow application status.
- **TPO admins:** manage job listings, companies, applications, interviews, and offer letters.
- **Management admins:** oversee students and TPOs, notices, companies, and placement information.
- **Super admins:** manage management, TPO, and student accounts.

## Local Development

### 1. Backend

```bash
cd Campus/backend
cp .env.example .env
npm ci
```

Edit `backend/.env` and provide at least:

- `MONGODB_URL`: a MongoDB connection string.
- `JWT_SECRET` and `OTP_SECRET`: two different long, random secrets.
- `BOOTSTRAP_ADMIN_PASSWORD`: the one-time password used to initialize the permanent management/super-admin accounts. Use a long value and keep it private.
- Cloudinary and Brevo values when you need uploads and email delivery.
- `CLIENT_URL=http://localhost:5173` and `FRONTEND_URL=http://localhost:5173` for local development.

Start the API:

```bash
npm start
```

The API listens on port `4518` by default. Its health endpoint is `http://localhost:4518/health`; application routes are mounted at `/auth`, `/user`, `/student`, `/tpo`, `/management`, `/admin`, and `/company`.

### 2. Frontend

In a second terminal:

```bash
cd Campus/frontend
cp .env.example .env
npm ci
npm run dev
```

Set `VITE_BACKEND_URL=http://localhost:4518` in `frontend/.env`. It must be the **backend origin only**; do not append `/api`, because the frontend calls root-level API paths such as `/user/detail` and `/auth/otp/verify`.

## Deployment

### Remove previously tracked generated files once

Adding folders to `.gitignore` does not untrack files that were committed earlier. On your maintenance branch, run this once from the repository root after applying the patch:

```bash
git rm -r --cached --ignore-unmatch backend/node_modules frontend/node_modules frontend/dist
```

This removes those generated paths from Git's index while leaving the local folders on disk. The updated `.gitignore` prevents them from being added again.

### Render — API

1. Create a Render Blueprint from this repository and select `render.yaml`, or create a Node web service manually.
2. The API service uses `backend/` as its root directory, `npm ci --omit=dev --no-audit --no-fund` as its build command, `npm start` as its start command, and `/health` as its health check.
3. Set `MONGODB_URL` to your MongoDB Atlas connection string. Set Cloudinary and Brevo credentials in Render's Environment page. Never put credentials in Git.
4. Set `BOOTSTRAP_ADMIN_PASSWORD` to a long random password for the initial permanent accounts. It must be at least 12 characters. After initialization, changing this variable does not reset the already-seeded users' passwords.
5. Set `CLIENT_URL` to the exact Vercel frontend origin, for example `https://your-project.vercel.app`. Multiple origins can be comma-separated. Set `FRONTEND_URL` to the public frontend URL used in notification links.

The Render blueprint intentionally creates **only the API**. Production and preview services should use separate environment variables and, ideally, separate MongoDB databases.

### Vercel — frontend

1. Import the same repository into Vercel and set **Root Directory** to `frontend`.
2. The included `frontend/vercel.json` sets `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory. Set the project Node.js version to 22 if the project settings expose that option.
3. Set the environment variable `VITE_BACKEND_URL` to the Render API origin, such as `https://your-api.onrender.com`. Do not add a trailing path such as `/api`.
4. Redeploy after changing `VITE_BACKEND_URL`; Vite embeds this value into the built frontend.

### Safe preview workflow

Before changing a production deployment, test this maintenance branch separately:

- Create a **separate Render staging API service** from branch `maintenance/deploy-stability`, using root directory `backend` and staging environment values. Point it to a staging database rather than production data.
- Create a **separate Vercel preview project**, or a branch preview, using branch `maintenance/deploy-stability`, root directory `frontend`, and `VITE_BACKEND_URL` set to the staging API URL.
- Set the staging API's `CLIENT_URL` to the exact Vercel preview origin. If the preview URL changes, update `CLIENT_URL` and redeploy the API.
- Exercise student password login, admin/TPO/management login, OTP send/verify/resend, password reset, role restrictions, dashboard navigation, file uploads, and the main student/TPO/management/admin workflows.
- Keep the existing production projects on their current branch until the preview checks have passed and you have reviewed the changes.

### Docker Compose — optional local stack

Docker Compose runs a local MongoDB container, backend, and Nginx frontend.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Set a long URL-safe `MONGO_ROOT_PASSWORD` in the root `.env`. Set `JWT_SECRET`, `OTP_SECRET`, `BOOTSTRAP_ADMIN_PASSWORD`, and any Cloudinary/Brevo credentials in `backend/.env`. Then validate and start:

```bash
docker compose config
docker compose up --build
```

Open `http://localhost:8080`. In this Docker setup the frontend is built with `VITE_BACKEND_URL=/api`; Nginx forwards `/api/*` to the backend and strips that prefix. The ordinary Vercel/local Vite setup uses the backend origin directly, as described above.

### Kubernetes — optional

Kubernetes manifests and secret-creation guidance are in [`kubernetes/README.md`](kubernetes/README.md). Do not commit populated Secret manifests or credentials.

## Checks

Run these checks locally before merging or deploying:

```bash
# Frontend
cd frontend
npm ci
npm run lint
npm run build

# Backend (from the repository root)
cd ../backend
npm ci
npm test
npm run check
```

`npm test` runs the backend's small Node.js unit-test set; `npm run check` syntax-checks backend JavaScript files. These are not substitutes for staging tests against MongoDB, Brevo, Cloudinary, and the browser workflows listed above.
