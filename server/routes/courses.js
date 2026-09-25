// courses — Admin adds/views/removes courses. DELETE is blocked while the
// course is still allocated to a faculty+section (offerings reference it).
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses — joined with department name + allocation/enrollment counts.
router.get('/', (_req, res) => {
  res.json(db.prepare(`
    SELECT c.*, d.name AS department_name, d.code AS department_code,
           (SELECT COUNT(*) FROM course_offerings o WHERE o.course_id = c.id) AS offering_count
    FROM courses c LEFT JOIN departments d ON d.id = c.department_id
    ORDER BY c.code
  `).all());
});

// POST /api/courses — admin only.
router.post('/', requireRole('admin'), (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const name = String(req.body?.name || '').trim();
  const { department_id, credits } = req.body || {};

  if (!code || !name) return res.status(400).json({ error: 'Code and name are required.' });

  const creditsNum = Number(credits || 3);
  if (!Number.isInteger(creditsNum) || creditsNum < 1 || creditsNum > 6) {
    return res.status(400).json({ error: 'Credits must be a whole number between 1 and 6.' });
  }
  if (department_id && !db.prepare('SELECT 1 FROM departments WHERE id = ?').get(department_id)) {
    return res.status(400).json({ error: 'Department does not exist.' });
  }

  try {
    const info = db.prepare(
      'INSERT INTO courses (code, name, department_id, credits) VALUES (?, ?, ?, ?)'
    ).run(code, name, department_id || null, creditsNum);
    res.json(db.prepare('SELECT * FROM courses WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Course code already exists.' });
  }
});

// DELETE /api/courses/:id — admin only. Refuses while allocations exist
// (deleting would cascade away offerings and, through them, attendance/marks).
router.delete('/:id', requireRole('admin'), (req, res) => {
  const n = db.prepare('SELECT COUNT(*) AS n FROM course_offerings WHERE course_id = ?')
    .get(req.params.id).n;
  if (n > 0) {
    return res.status(400).json({
      error: `Cannot delete: course is allocated in ${n} offering(s). Remove the allocation(s) first.`,
    });
  }
  const info = db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Course not found.' });
  res.json({ ok: true });
});

module.exports = router;
