// assignments — faculty creates assignments; students submit text/link only
// (no file uploads by design); faculty reviews submissions and enters marks.
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

function assertOwnsOffering(user, offeringId) {
  const row = db.prepare(`
    SELECT f.id FROM course_offerings o
    JOIN faculty f ON f.id = o.faculty_id
    WHERE o.id = ? AND f.user_id = ?
  `).get(offeringId, user.id);
  if (!row) {
    const err = new Error('You can only manage your own courses.');
    err.status = 403;
    throw err;
  }
}

// ── Faculty endpoints ───────────────────────────────────────────────────────

// GET /api/assignments?offering_id=1 — faculty: assignments for one own course.
router.get('/', requireRole('faculty'), (req, res) => {
  const { offering_id } = req.query;
  if (!offering_id) return res.status(400).json({ error: 'offering_id is required.' });
  assertOwnsOffering(req.user, offering_id);
  res.json(db.prepare(
    'SELECT * FROM assignments WHERE offering_id = ? ORDER BY deadline'
  ).all(offering_id));
});

// POST /api/assignments  { offering_id, title, description, deadline }
router.post('/', requireRole('faculty'), (req, res) => {
  const offering_id = req.body?.offering_id;
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  const deadline = String(req.body?.deadline || '').trim();
  if (!offering_id || !title || !deadline) {
    return res.status(400).json({ error: 'Course, title and deadline are required.' });
  }
  // deadline comes from <input type="datetime-local">: "YYYY-MM-DDTHH:MM"
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(deadline) || Number.isNaN(new Date(deadline).getTime())) {
    return res.status(400).json({ error: 'Deadline must be a valid date and time.' });
  }
  assertOwnsOffering(req.user, offering_id);
  const info = db.prepare(
    'INSERT INTO assignments (offering_id, title, description, deadline) VALUES (?, ?, ?, ?)'
  ).run(offering_id, title, description, deadline);
  res.json(db.prepare('SELECT * FROM assignments WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/assignments/:id — faculty removes their own assignment.
router.delete('/:id', requireRole('faculty'), (req, res) => {
  const asg = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!asg) return res.status(404).json({ error: 'Assignment not found.' });
  assertOwnsOffering(req.user, asg.offering_id);
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/assignments/:id/submissions — faculty: all submissions for one assignment.
router.get('/:id/submissions', requireRole('faculty'), (req, res) => {
  const asg = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!asg) return res.status(404).json({ error: 'Assignment not found.' });
  assertOwnsOffering(req.user, asg.offering_id);

  // Left join so faculty also sees students who have NOT submitted yet.
  const rows = db.prepare(`
    SELECT s.id AS student_id, s.roll_no, u.name,
           sub.id AS submission_id, sub.submission_text, sub.submitted_at, sub.mark
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN assignment_submissions sub
      ON sub.assignment_id = ? AND sub.student_id = s.id
    WHERE e.offering_id = ?
    ORDER BY s.roll_no
  `).all(req.params.id, asg.offering_id);
  res.json(rows);
});

// POST /api/assignments/:id/mark  { student_id, mark } — faculty grades one submission.
router.post('/:id/mark', requireRole('faculty'), (req, res) => {
  const { student_id, mark } = req.body || {};
  const asg = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!asg) return res.status(404).json({ error: 'Assignment not found.' });
  assertOwnsOffering(req.user, asg.offering_id);

  const info = db.prepare(`
    UPDATE assignment_submissions SET mark = ?, marked_at = datetime('now')
    WHERE assignment_id = ? AND student_id = ?
  `).run(mark === '' ? null : Number(mark), req.params.id, student_id);
  if (info.changes === 0) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ ok: true });
});

// ── Student endpoints ───────────────────────────────────────────────────────

// GET /api/assignments/mine — student: assignments across enrolled courses
// (including whether they already submitted).
router.get('/mine', requireRole('student'), (req, res) => {
  const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.json([]);

  res.json(db.prepare(`
    SELECT a.id, a.title, a.description, a.deadline,
           c.code AS course_code, c.name AS course_name,
           sub.submission_text, sub.submitted_at, sub.mark
    FROM enrollments e
    JOIN assignments a ON a.offering_id = e.offering_id
    JOIN course_offerings o ON o.id = e.offering_id
    JOIN courses c ON c.id = o.course_id
    LEFT JOIN assignment_submissions sub
      ON sub.assignment_id = a.id AND sub.student_id = e.student_id
    WHERE e.student_id = ?
    ORDER BY a.deadline
  `).all(student.id));
});

// POST /api/assignments/:id/submit  { submission_text } — student submits link/text.
router.post('/:id/submit', requireRole('student'), (req, res) => {
  const { submission_text } = req.body || {};
  if (!submission_text) return res.status(400).json({ error: 'Submission text/link is required.' });

  const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.status(403).json({ error: 'Not a student account.' });

  // Student must be enrolled in the assignment's course.
  const enrolled = db.prepare(`
    SELECT 1 FROM assignments a
    JOIN enrollments e ON e.offering_id = a.offering_id
    WHERE a.id = ? AND e.student_id = ?
  `).get(req.params.id, student.id);
  if (!enrolled) return res.status(403).json({ error: 'You are not enrolled in this course.' });

  db.prepare(`
    INSERT INTO assignment_submissions (assignment_id, student_id, submission_text)
    VALUES (?, ?, ?)
    ON CONFLICT (assignment_id, student_id)
    DO UPDATE SET submission_text = excluded.submission_text, submitted_at = datetime('now')
  `).run(req.params.id, student.id, submission_text);
  res.json({ ok: true });
});

module.exports = router;
