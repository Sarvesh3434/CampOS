// attendance — the flagship demo feature.
//
// Faculty flow:
//   GET  /api/attendance/roster?offering_id=1&date=2026-09-25
//        -> students enrolled in that offering, plus any already-marked status
//   POST /api/attendance/mark  { offering_id, date, records: [{student_id, status}] }
//        -> upserts one row per student (UNIQUE constraint makes re-marking safe)
//   GET  /api/attendance/history?offering_id=1&limit=15
//        -> past dates with present/total counts, newest first
//
// Student flow:
//   GET /api/attendance/me -> per-course attendance % for the logged-in student
//
// ⭐ Academic-task integration: when a faculty member marks attendance, any
// pending constraint targeted at faculty is auto-marked 'completed'. That's the
// whole trick that makes the expo demo's step 5 work with zero extra clicks.
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Faculty ownership check: does this offering belong to the logged-in faculty?
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
  return row.id;
}

// Date sanity: YYYY-MM-DD, real calendar date, and NOT in the future
// (you can't mark attendance for tomorrow). Back-dating stays allowed so
// faculty can fill in a missed day — demo-friendly.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(date) {
  if (!DATE_RE.test(date || '')) return false;
  const d = new Date(date + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date(); today.setHours(23, 59, 59, 999);
  return d <= today;
}

// GET /api/attendance/roster?offering_id=&date=
router.get('/roster', requireRole('faculty'), (req, res) => {
  const { offering_id, date } = req.query;
  if (!offering_id || !date) {
    return res.status(400).json({ error: 'offering_id and date are required.' });
  }
  if (!validDate(date)) {
    return res.status(400).json({ error: 'Date must be YYYY-MM-DD and not in the future.' });
  }
  assertOwnsOffering(req.user, offering_id);

  const rows = db.prepare(`
    SELECT s.id AS student_id, s.roll_no, u.name,
           a.status AS marked_status
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN attendance a
      ON a.offering_id = e.offering_id AND a.student_id = s.id AND a.date = ?
    WHERE e.offering_id = ?
    ORDER BY s.roll_no
  `).all(date, offering_id);
  res.json(rows);
});

// POST /api/attendance/mark  { offering_id, date, records: [{ student_id, status }] }
router.post('/mark', requireRole('faculty'), (req, res) => {
  const { offering_id, date, records } = req.body || {};
  if (!offering_id || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'offering_id, date and records are required.' });
  }
  if (!validDate(date)) {
    return res.status(400).json({ error: 'Date must be YYYY-MM-DD and not in the future.' });
  }
  assertOwnsOffering(req.user, offering_id);

  const upsert = db.prepare(`
    INSERT INTO attendance (offering_id, student_id, date, status, marked_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (offering_id, student_id, date)
    DO UPDATE SET status = excluded.status, marked_by = excluded.marked_by
  `);

  let savedCount = 0;
  const save = db.transaction(() => {
    for (const r of records) {
      // Skip malformed rows (bad id / bad status) instead of failing the whole batch.
      if (!r.student_id || (r.status !== 'present' && r.status !== 'absent')) continue;
      upsert.run(offering_id, r.student_id, date, r.status, req.user.id);
      savedCount += 1;
    }
    // ⭐ Auto-complete any pending faculty constraints (demo step 5).
    db.prepare(`
      UPDATE constraint_status
      SET status = 'completed', completed_at = datetime('now')
      WHERE user_id = ? AND status = 'pending'
    `).run(req.user.id);
  });
  save();

  if (savedCount === 0) {
    return res.status(400).json({ error: 'No valid records. Each needs student_id and status present/absent.' });
  }
  res.json({ ok: true, saved: savedCount });
});

// GET /api/attendance/history?offering_id=1&limit=15
// One row per marked date: how many present, how many total. Lets faculty
// verify a day was already marked before re-marking it.
router.get('/history', requireRole('faculty'), (req, res) => {
  const offering_id = req.query.offering_id;
  const limit = Math.min(Number(req.query.limit) || 15, 60);
  if (!offering_id) return res.status(400).json({ error: 'offering_id is required.' });
  assertOwnsOffering(req.user, offering_id);

  res.json(db.prepare(`
    SELECT date,
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
    FROM attendance
    WHERE offering_id = ?
    GROUP BY date
    ORDER BY date DESC
    LIMIT ?
  `).all(offering_id, limit));
});

// GET /api/attendance/me — student's own attendance % per course.
router.get('/me', requireRole('student'), (req, res) => {
  const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.json([]);

  const rows = db.prepare(`
    SELECT c.code AS course_code, c.name AS course_name, o.section,
           COUNT(a.id) AS total_classes,
           SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
           ROUND(100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id), 1) AS percentage
    FROM enrollments e
    JOIN course_offerings o ON o.id = e.offering_id
    JOIN courses c ON c.id = o.course_id
    LEFT JOIN attendance a ON a.offering_id = e.offering_id AND a.student_id = e.student_id
    WHERE e.student_id = ?
    GROUP BY o.id
    ORDER BY c.code
  `).all(student.id);
  res.json(rows);
});

module.exports = router;
