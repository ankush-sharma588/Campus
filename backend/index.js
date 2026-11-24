require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Render runs the API behind a reverse proxy; trust one proxy hop for client IP rate limits.
app.set('trust proxy', 1);

// CORS: set CLIENT_URL to your deployed frontend (comma-separated for several).
// If it is not set (local dev) every origin is allowed.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Public folders for profile photos, resumes and offer letters.
app.use('/profileImgs', express.static(path.join(__dirname, 'public/profileImgs')));
app.use('/resume', express.static(path.join(__dirname, 'public/resumes')));
app.use('/offerLetter', express.static(path.join(__dirname, 'public/offerLetter')));

// Authentication and application routes.
app.use('/auth', require('./routes/auth.route'));
app.use('/user', require('./routes/user.route'));
app.use('/student', require('./routes/student.route'));
app.use('/tpo', require('./routes/tpo.route'));
app.use('/management', require('./routes/management.route'));
app.use('/admin', require('./routes/superuser.route'));
app.use('/company', require('./routes/company.route'));

// Health routes for Render and deployment checks.
app.get('/test', (req, res) => res.status(200).send('Working Fine!'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler, including CORS rejections.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error('[api]', error.message);
  res.status(error.message?.includes('CORS') ? 403 : 500).json({
    success: false,
    message: error.message || 'Internal server error',
  });
});

['MONGODB_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach((key) => {
  if (!process.env[key]) console.warn(`[warn] Missing environment variable: ${key}`);
});

async function initializeDatabase() {
  const connectDB = require('./config/MongoDB');
  await connectDB();
  await require('./scripts/ensurePermanentAdmins')();
}

// Do not accept traffic on Render until MongoDB and the persistent admin
// bootstrap have completed. In serverless mode the connection is initialized
// at module load, matching the existing deployment pattern.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4518;
  initializeDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
    })
    .catch((error) => {
      console.error('[startup] Database/bootstrap initialization failed:', error.message);
      process.exit(1);
    });
} else {
  initializeDatabase().catch((error) => {
    console.error('[startup] Database/bootstrap initialization failed:', error.message);
  });
}

module.exports = app;
