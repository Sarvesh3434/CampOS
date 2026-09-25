// enrollments — admin puts students into course offerings.
// This is the link that lets faculty see students in their roster and lets
// students see courses on their dashboards.
const express = require('express');
const db = require('../db');
const { requireRole, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/enrollments?offering_id=1 — students in one offering (with names).
// Admin + faculty (rosters); students use their own /me endpoints instead.
router.get('/', requireAnyRole('admin', 'faculty'), (req, res) => {
  const { offering_id } = req.query;
  if (!offering_id) return res.status(400).json({ error: 'offering_id is required.' });

  const rows = db.prepare(`
    SELECT e.id, e.student_id, e.offering_id, s.roll_no, u.name, s.section
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    WHERE e.offering_id = ?
    ORDER BY s.roll_no
  `).all(offering_id);
  res.json(rows);
});

// POST /api/enrollments  { offering_id, student_id } — admin only.
// ⭐ Department rule: a student can only be enrolled in courses offered by
// THEIR OWN department (CSE students -> CSE courses only). Enforced here so
// even a hand-crafted API request can't cross departments.
router.post('/', requireRole('admin'), (req, res) => {
  const { offering_id, student_id } = req.body || {};
  if (!offering_id || !student_id) {
    return res.status(400).json({ error: 'offering_id and student_id are required.' });
  }

  const student = db.prepare(`
    SELECT s.department_id, d.code AS dept_code FROM students s
    LEFT JOIN departments d ON d.id = s.department_id WHERE s.id = ?
  `).get(student_id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const course = db.prepare(`
    SELECT c.department_id, c.code, d.code AS dept_code FROM course_offerings o
    JOIN courses c ON c.id = o.course_id
    LEFT JOIN departments d ON d.id = c.department_id
    WHERE o.id = ?
  `).get(offering_id);
  if (!course) return res.status(404).json({ error: 'Course offering not found.' });

  if (student.department_id && course.department_id &&
      student.department_id !== course.department_id) {
    return res.status(400).json({
      error: `Department mismatch: ${course.code} belongs to ${course.dept_code || 'another department'}, ` +
             `but this student is in ${student.dept_code || 'a different department'}. ` +
             `Students can only enroll in their own department's courses.`,
    });
  }

  try {
    const info = db.prepare(
      'INSERT INTO enrollments (offering_id, student_id) VALUES (?, ?)'
    ).run(offering_id, student_id);
    res.json(db.prepare('SELECT * FROM enrollments WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Already enrolled (or invalid ids).' });
  }
});

// DELETE /api/enrollments/:id — admin only.
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM enrollments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
