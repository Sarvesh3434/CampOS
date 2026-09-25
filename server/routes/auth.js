// auth routes — login only (no register: admin creates all accounts).
// POST /api/auth/login  { email, password }  -> { token, user }
// GET  /api/auth/me                          -> fresh user record for a valid token
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── Simple rate limiting (in-memory, per email) ─────────────────────────────
// Deliberately low-tech for a demo: counts failed logins per email and makes
// the attacker wait. Memory resets on restart — fine for a college demo.
const attempts = new Map(); // email -> { count, firstAt }
const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function tooManyAttempts(email) {
  const rec = attempts.get(email);
  if (!rec) return false;
  if (Date.now() - rec.firstAt > WINDOW_MS) { attempts.delete(email); return false; }
  return rec.count >= MAX_FAILS;
}
function recordFailure(email) {
  const rec = attempts.get(email) || { count: 0, firstAt: Date.now() };
  rec.count += 1;
  attempts.set(email, rec);
}
const clearAttempts = (email) => attempts.delete(email);

// ── Login ───────────────────────────────────────────────────────────────────
// Users log in with their ID (not email):
//   students -> roll number (CSE001), faculty -> faculty code (FAC001),
//   admin -> ADM001. Match case-insensitively and ignore stray spaces.
router.post('/login', (req, res) => {
  const body = req.body || {};
  const loginId = String(body.login_id || body.email || '').trim().toUpperCase();
  const password = String(body.password || '');
  if (!loginId || !password) {
    return res.status(400).json({ error: 'ID and password are required.' });
  }
  if (tooManyAttempts(loginId)) {
    return res.status(429).json({ error: 'Too many failed attempts. Wait 10 minutes.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE UPPER(login_id) = ?').get(loginId);

  // Anti user-enumeration: even when the email doesn't exist, we run one
  // bcrypt compare against a dummy hash. Response time stays identical, so
  // nobody can discover which emails are registered by timing requests.
  const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8jKHBfojYEnQiJGQCbGcXmcVpkAulW';
  const ok = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !ok) {
    recordFailure(loginId);
    return res.status(401).json({ error: 'Invalid ID or password.' });
  }

  clearAttempts(loginId);

  // The role travels inside the token — pages use it to pick a landing page.
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, login_id: user.login_id, email: user.email, role: user.role } });
});

// ── Session check ───────────────────────────────────────────────────────────
// GET /api/auth/me — the client calls this on page load to confirm the stored
// token is still valid AND the account still exists (e.g. admin removed the
// user while the tab was open). Returns fresh data, not the stale JWT payload.
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, login_id, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
  res.json(user);
});

module.exports = router;
