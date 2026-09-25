// faculty — Admin adds/views/removes faculty. Creating a faculty row also
// creates the login account (users table) — one transaction, since both must
// succeed. Emails are stored lowercase to match the login normalization.
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireRole, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/faculty — list with department names + how many courses each teaches.
// Admin sees it in the Faculty page; students don't need faculty contact data.
router.get('/', requireAnyRole('admin', 'faculty'), (_req, res) => {
  res.json(db.prepare(`
    SELECT f.*, u.name, u.email, d.name AS department_name,
           (SELECT COUNT(*) FROM course_offerings o WHERE o.faculty_id = f.id) AS course_count
    FROM faculty f
    JOIN users u ON u.id = f.user_id
    LEFT JOIN departments d ON d.id = f.department_id
    ORDER BY f.faculty_code
  `).all());
});

// POST /api/faculty  { name, email, password, faculty_code, department_id, designation }
router.post('/', requireRole('admin'), (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const faculty_code = String(b.faculty_code || '').trim().toUpperCase();
  const password = String(b.password || '');

  if (!name || !email || !password || !faculty_code) {
    return res.status(400).json({ error: 'Name, email, password and faculty code are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (b.department_id && !db.prepare('SELECT 1 FROM departments WHERE id = ?').get(b.department_id)) {
    return res.status(400).json({ error: 'Department does not exist.' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const create = db.transaction(() => {
      const userId = db.prepare(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'faculty')"
      ).run(name, email, hash).lastInsertRowid;
      const info = db.prepare(
        'INSERT INTO faculty (user_id, faculty_code, department_id, designation) VALUES (?, ?, ?, ?)'
      ).run(userId, faculty_code, b.department_id || null,
            String(b.designation || '').trim() || 'Assistant Professor');

      // New faculty must appear in existing academic tasks too — give them a
      // 'pending' row for every task created before they joined. Without this,
      // the admin compliance count (X/Y) would silently exclude them.
      db.prepare(
        "INSERT INTO constraint_status (constraint_id, user_id, status) " +
        "SELECT id, ?, 'pending' FROM academic_constraints"
      ).run(userId);

      return info.lastInsertRowid;
    });
    const id = create();
    res.json(db.prepare(`
      SELECT f.*, u.name, u.email FROM faculty f JOIN users u ON u.id = f.user_id WHERE f.id = ?
    `).get(id));
  } catch (e) {
    res.status(400).json({ error: 'Email or faculty code already exists.' });
  }
});

// DELETE /api/faculty/:id — removes faculty row + login account (CASCADE).
// Refuses while the faculty member still teaches at least one course, so an
// accidental click can't silently destroy their offerings.
router.delete('/:id', requireRole('admin'), (req, res) => {
  const fac = db.prepare('SELECT id, user_id FROM faculty WHERE id = ?').get(req.params.id);
  if (!fac) return res.status(404).json({ error: 'Faculty not found.' });

  const n = db.prepare('SELECT COUNT(*) AS n FROM course_offerings WHERE faculty_id = ?').get(fac.id).n;
  if (n > 0) {
    return res.status(400).json({
      error: `Cannot remove: faculty still teaches ${n} course(s). Remove the allocation(s) first.`,
    });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(fac.user_id);
  res.json({ ok: true });
});

module.exports = router;
