// marks — faculty enters CAT1/CAT2/Assignment/FAT per student per course;
// student views their own marks. One row per (offering, student) — entering
// again updates the same row instead of duplicating.
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

// GET /api/marks?offering_id=1 — faculty: whole class sheet for one course.
router.get('/', requireRole('faculty'), (req, res) => {
  const { offering_id } = req.query;
  if (!offering_id) return res.status(400).json({ error: 'offering_id is required.' });
  assertOwnsOffering(req.user, offering_id);

  const rows = db.prepare(`
    SELECT s.id AS student_id, s.roll_no, u.name,
           m.cat1, m.cat2, m.assignment, m.fat
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN marks m ON m.offering_id = e.offering_id AND m.student_id = s.id
    WHERE e.offering_id = ?
    ORDER BY s.roll_no
  `).all(offering_id);
  res.json(rows);
});

// POST /api/marks  { offering_id, records: [{ student_id, cat1, cat2, assignment, fat }] }
// Empty/blank fields are stored as NULL so faculty can fill categories gradually.
router.post('/', requireRole('faculty'), (req, res) => {
  const { offering_id, records } = req.body || {};
  if (!offering_id || !Array.isArray(records)) {
    return res.status(400).json({ error: 'offering_id and records are required.' });
  }
  assertOwnsOffering(req.user, offering_id);

  // Clamp to the same ranges the UI shows (CAT /50, Assignment /10, FAT /100).
  // Server-side enforcement matters: trusting the client alone means anyone
  // with curl could post cat1 = 500.
  const clamp = (v, max) => {
    if (v === '' || v === undefined || v === null) return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return Math.max(0, Math.min(max, Math.round(n)));
  };
  const RANGES = { cat1: 50, cat2: 50, assignment: 10, fat: 100 };
  const upsert = db.prepare(`
    INSERT INTO marks (offering_id, student_id, cat1, cat2, assignment, fat)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (offering_id, student_id)
    DO UPDATE SET cat1 = excluded.cat1, cat2 = excluded.cat2,
                  assignment = excluded.assignment, fat = excluded.fat
  `);

  const save = db.transaction(() => {
    for (const r of records) {
      if (!r.student_id) continue;
      upsert.run(offering_id, r.student_id,
        clamp(r.cat1, RANGES.cat1),
        clamp(r.cat2, RANGES.cat2),
        clamp(r.assignment, RANGES.assignment),
        clamp(r.fat, RANGES.fat));
    }
  });
  save();

  res.json({ ok: true, saved: records.length });
});

// GET /api/marks/me — student: own marks for every enrolled course.
router.get('/me', requireRole('student'), (req, res) => {
  const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.json([]);

  const rows = db.prepare(`
    SELECT c.code AS course_code, c.name AS course_name,
           m.cat1, m.cat2, m.assignment, m.fat
    FROM enrollments e
    JOIN course_offerings o ON o.id = e.offering_id
    JOIN courses c ON c.id = o.course_id
    LEFT JOIN marks m ON m.offering_id = e.offering_id AND m.student_id = e.student_id
    WHERE e.student_id = ?
    ORDER BY c.code
  `).all(student.id);
  res.json(rows);
});

module.exports = router;
