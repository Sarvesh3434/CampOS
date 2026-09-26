// index.js — Express entry point for CampOS API.
// Structure is deliberately flat: one routes/<feature>.js file per feature,
// each doing routes -> raw SQL queries. No services, no extra layers.
const express = require('express');
const cors = require('cors');

// Auto-seed for hosted deploys (Render free tier has an ephemeral disk, so
// campos.db disappears on every redeploy/restart). When the users table is
// empty and SEED_ON_BOOT is set, run seed.js once so the demo is instantly
// usable. Locally this is a no-op because your seeded DB already has users.
try {
  const db = require('./db');
  const row = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (String(process.env.SEED_ON_BOOT) === '1' && row.n === 0) {
    console.log('Empty database detected — seeding demo data...');
    require('child_process').execSync('node seed.js', { stdio: 'inherit', cwd: __dirname });
  }
} catch (e) {
  console.error('Startup seed check failed:', e.message);
}

const { auth } = require('./middleware/auth');

const app = express();
app.use(cors());          // Vite dev server (5173) -> API (3001)
app.use(express.json());  // parse JSON request bodies

// Simple request log — helpful while demoing/debugging.
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check: open http://localhost:3001/api/health in a browser.
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Auth routes are public; everything below requires a valid token.
app.use('/api/auth', require('./routes/auth'));

// All remaining routes sit behind the JWT guard.
app.use('/api/departments', auth, require('./routes/departments'));
app.use('/api/courses', auth, require('./routes/courses'));
app.use('/api/faculty', auth, require('./routes/faculty'));
app.use('/api/students', auth, require('./routes/students'));
app.use('/api/offerings', auth, require('./routes/offerings'));
app.use('/api/enrollments', auth, require('./routes/enrollments'));
app.use('/api/attendance', auth, require('./routes/attendance'));
app.use('/api/marks', auth, require('./routes/marks'));
app.use('/api/assignments', auth, require('./routes/assignments'));
app.use('/api/timetable', auth, require('./routes/timetable'));
app.use('/api/constraints', auth, require('./routes/constraints'));
app.use('/api/announcements', auth, require('./routes/announcements'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));

// Basic error handler so a bad query shows a clean message instead of crashing.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`CampOS API running on http://localhost:${PORT}`));
