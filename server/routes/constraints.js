// constraints — the most original CampOS feature.
// Admin creates a task like "Faculty must mark attendance by 6 PM".
//   - Faculty see it as Pending on their dashboard.
//   - It flips to Completed automatically when faculty actually mark attendance
//     (the auto-complete lives in routes/attendance.js — no extra button).
//   - Admin sees a simple compliance count, e.g. "8/10 faculty completed".
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/constraints  { title, description, due_time } — admin only.
// Creates the task AND a 'pending' status row for every faculty member.
router.post('/', requireRole('admin'), (req, res) => {
  const { title, description, due_time } = req.body || {};
  if (!title || !due_time) {
    return res.status(400).json({ error: 'Title and due time are required.' });
  }

  const create = db.transaction(() => {
    const info = db.prepare(
      'INSERT INTO academic_constraints (title, description, target_role, due_time) VALUES (?, ?, ?, ?)'
    ).run(title, description || '', 'faculty', due_time);

    const faculties = db.prepare('SELECT f.user_id FROM faculty f').all();
    const ins = db.prepare("INSERT INTO constraint_status (constraint_id, user_id, status) VALUES (?, ?, 'pending')");
    for (const f of faculties) ins.run(info.lastInsertRowid, f.user_id);
    return info.lastInsertRowid;
  });
  const id = create();

  res.json(db.prepare('SELECT * FROM academic_constraints WHERE id = ?').get(id));
});

// GET /api/constraints — admin view: every task + X/Y compliance counts.
router.get('/', requireRole('admin'), (_req, res) => {
  res.json(db.prepare(`
    SELECT a.*,
           COUNT(cs.id) AS total_assigned,
           SUM(CASE WHEN cs.status = 'completed' THEN 1 ELSE 0 END) AS completed_count
    FROM academic_constraints a
    LEFT JOIN constraint_status cs ON cs.constraint_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all());
});

// GET /api/constraints/mine — faculty view: own task list (pending/completed).
router.get('/mine', requireRole('faculty'), (req, res) => {
  res.json(db.prepare(`
    SELECT a.id, a.title, a.description, a.due_time, cs.status, cs.completed_at
    FROM academic_constraints a
    JOIN constraint_status cs ON cs.constraint_id = a.id
    WHERE cs.user_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.id));
});

// DELETE /api/constraints/:id — admin only.
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM academic_constraints WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
