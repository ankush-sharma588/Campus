require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require("path");

const app = express();

// CORS: set CLIENT_URL to your deployed frontend (comma-separated for several).
// If it is not set (local dev) every origin is allowed.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// public folder for users profile
app.use('/profileImgs', express.static(path.join(__dirname, 'public/profileImgs')));
app.use('/resume', express.static(path.join(__dirname, 'public/resumes')));
app.use('/offerLetter', express.static(path.join(__dirname, 'public/offerLetter')));

// database import 
const mongodb = require('./config/MongoDB');
mongodb();


// routes for user
app.use('/user', require('./routes/user.route'));
// routes for student user
app.use('/student', require('./routes/student.route'));
// routes for tpo user
app.use('/tpo', require('./routes/tpo.route'));
// routes for management user
app.use('/management', require('./routes/management.route'));
// routes for admin user
app.use('/admin', require('./routes/superuser.route'));

// route for company
app.use('/company', require('./routes/company.route'));
// test + health routes (health is used by Render / Docker health checks)
app.use('/test', (req, res) => {
  res.status(200).send("Working Fine!");
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// central error handler (incl. CORS rejections)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.message?.includes('CORS') ? 403 : 500).json({ success: false, message: err.message || 'Internal server error' });
});

['MONGODB_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach((k) => {
  if (!process.env[k]) console.warn(`[warn] Missing environment variable: ${k}`);
});

// Run a normal server (Render, Docker, local). On Vercel the app is exported instead.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4518;
  app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
}

module.exports = app;
