// offerings — Course Allocation: admin links Faculty -> Course -> Section.
// This is the table every other feature JOINs against, so the GET here is the
// workhorse: it returns course/faculty names ready for dropdowns everywhere.
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/offerings — full allocation list with readable names.
router.get('/', (_req, res) => {
  res.json(db.prepare(`
    SELECT o.id, o.section, o.semester,
           c.id AS course_id, c.code AS course_code, c.name AS course_name,
           f.id AS faculty_id, f.faculty_code, u.name AS faculty_name,
           (SELECT COUNT(*) FROM enrollments e WHERE e.offering_id = o.id) AS enrolled_count
    FROM course_offerings o
    JOIN courses c ON c.id = o.course_id
    JOIN faculty f ON f.id = o.faculty_id
    JOIN users u ON u.id = f.user_id
    ORDER BY c.code, o.section
  `).all());
});

// GET /api/offerings/mine — faculty: only offerings allocated to them.
// (GET /offerings returns everything so admin pages can use it for dropdowns;
// faculty pages use /mine.)
router.get('/mine', requireRole('faculty'), (req, res) => {
  res.json(db.prepare(`
    SELECT o.id, o.section, o.semester,
           c.code AS course_code, c.name AS course_name,
           (SELECT COUNT(*) FROM enrollments e WHERE e.offering_id = o.id) AS enrolled_count
    FROM course_offerings o
    JOIN courses c ON c.id = o.course_id
    JOIN faculty f ON f.id = o.faculty_id
    WHERE f.user_id = ?
    ORDER BY c.code
  `).all(req.user.id));
});

// POST /api/offerings  { course_id, faculty_id, section, semester } — admin only.
router.post('/', requireRole('admin'), (req, res) => {
  const { course_id, faculty_id, semester } = req.body || {};
  const section = String(req.body?.section || '').trim().toUpperCase();
  if (!course_id || !faculty_id || !section) {
    return res.status(400).json({ error: 'Course, faculty and section are required.' });
  }
  // Validate that course, faculty and section make sense before inserting.
  if (!db.prepare('SELECT 1 FROM courses WHERE id = ?').get(course_id)) {
    return res.status(400).json({ error: 'Course does not exist.' });
  }
  if (!db.prepare('SELECT 1 FROM faculty WHERE id = ?').get(faculty_id)) {
    return res.status(400).json({ error: 'Faculty does not exist.' });
  }
  try {
    const info = db.prepare(
      'INSERT INTO course_offerings (course_id, faculty_id, section, semester) VALUES (?, ?, ?, ?)'
    ).run(course_id, faculty_id, section, String(semester || '').trim() || 'Odd 2026');
    res.json(db.prepare('SELECT * FROM course_offerings WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    // UNIQUE(course_id, section) violation = this course is already taught to
    // this section. A friendlier message than "UNIQUE constraint failed".
    res.status(400).json({ error: 'This course is already allocated to that section. Remove the old allocation first.' });
  }
});

// DELETE /api/offerings/:id — admin only.
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM course_offerings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
