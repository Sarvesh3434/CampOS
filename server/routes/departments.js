// departments — Admin adds/views/removes departments. Simple as it gets:
// raw SQL, no extra layers. DELETE blocks removal while courses/faculty/students
// still reference the department (friendlier than a cryptic FK error).
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/departments — any logged-in user can list (needed for form dropdowns).
router.get('/', (_req, res) => {
  res.json(db.prepare(`
    SELECT d.*,
           (SELECT COUNT(*) FROM courses c WHERE c.department_id = d.id) AS course_count,
           (SELECT COUNT(*) FROM faculty f WHERE f.department_id = d.id) AS faculty_count,
           (SELECT COUNT(*) FROM students s WHERE s.department_id = d.id) AS student_count
    FROM departments d ORDER BY d.name
  `).all());
});

// POST /api/departments — admin only.
router.post('/', requireRole('admin'), (req, res) => {
  const name = String(req.body?.name || '').trim();
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required.' });
  try {
    const info = db.prepare('INSERT INTO departments (name, code) VALUES (?, ?)').run(name, code);
    res.json(db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Department code already exists.' });
  }
});

// DELETE /api/departments/:id — admin only. Refuses while anything references it.
router.delete('/:id', requireRole('admin'), (req, res) => {
  const { course_count, faculty_count, student_count } = db.prepare(`
    SELECT (SELECT COUNT(*) FROM courses  WHERE department_id = ?) AS course_count,
           (SELECT COUNT(*) FROM faculty  WHERE department_id = ?) AS faculty_count,
           (SELECT COUNT(*) FROM students WHERE department_id = ?) AS student_count
  `).get(req.params.id, req.params.id, req.params.id);

  if (course_count + faculty_count + student_count > 0) {
    return res.status(400).json({
      error: `Cannot delete: department still has ${course_count} courses, ${faculty_count} faculty, ${student_count} students.`,
    });
  }
  const info = db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Department not found.' });
  res.json({ ok: true });
});

module.exports = router;
