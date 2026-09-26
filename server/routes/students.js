// students — Admin adds/views/removes students. Same pattern as faculty:
// creating a student also creates their login account in the same transaction.
// Emails stored lowercase to match the login normalization.
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireRole, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/students — list with department names.
// Only admin + faculty may see the full roster (it contains personal emails);
// students get their own course data through the /me endpoints instead.
router.get('/', requireAnyRole('admin', 'faculty'), (_req, res) => {
  res.json(db.prepare(`
    SELECT s.*, u.name, u.email, d.name AS department_name,
           (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) AS enrolled_count
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN departments d ON d.id = s.department_id
    ORDER BY s.roll_no
  `).all());
});

// POST /api/students  { name, email, password, roll_no, department_id, section, year }
router.post('/', requireRole('admin'), (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const roll_no = String(b.roll_no || '').trim().toUpperCase();
  const password = String(b.password || '');

  if (!name || !email || !password || !roll_no) {
    return res.status(400).json({ error: 'Name, email, password and roll no are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const section = String(b.section || 'A').trim().toUpperCase();
  const year = Number(b.year || 2);
  if (!Number.isInteger(year) || year < 1 || year > 5) {
    return res.status(400).json({ error: 'Year must be a whole number between 1 and 5.' });
  }
  if (b.department_id && !db.prepare('SELECT 1 FROM departments WHERE id = ?').get(b.department_id)) {
    return res.status(400).json({ error: 'Department does not exist.' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const create = db.transaction(() => {
      // login_id = roll number — students log in with their roll no, not email.
      const userId = db.prepare(
        "INSERT INTO users (name, email, login_id, password_hash, role) VALUES (?, ?, ?, ?, 'student')"
      ).run(name, email, roll_no, hash).lastInsertRowid;
      const info = db.prepare(
        'INSERT INTO students (user_id, roll_no, department_id, section, year) VALUES (?, ?, ?, ?, ?)'
      ).run(userId, roll_no, b.department_id || null, section, year);
      return info.lastInsertRowid;
    });
    const id = create();
    res.json(db.prepare(`
      SELECT s.*, u.name, u.email FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = ?
    `).get(id));
  } catch (e) {
    res.status(400).json({ error: 'Email or roll no already exists.' });
  }
});

// DELETE /api/students/:id — removes student row + login account (CASCADE).
// Their enrollments are removed first (attendance/marks history goes with the
// cascade), so the delete never gets stuck behind course memberships.
router.delete('/:id', requireRole('admin'), (req, res) => {
  const stu = db.prepare('SELECT id, user_id FROM students WHERE id = ?').get(req.params.id);
  if (!stu) return res.status(404).json({ error: 'Student not found.' });

  db.prepare('DELETE FROM enrollments WHERE student_id = ?').run(stu.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(stu.user_id);
  res.json({ ok: true });
});

module.exports = router;
