// timetable — ONE table serves two pages:
//   type='class' -> weekly timetable (day_or_date = 'Monday', repeats every week)
//   type='exam'  -> exam schedule   (day_or_date = '2026-10-12', one specific date)
// The UI just filters by type — exactly the trick described in the project prompt.
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const JOIN = `
  SELECT t.*, c.code AS course_code, c.name AS course_name, o.section,
         c.department_id, d.code AS department_code,
         f.id AS faculty_id, u.name AS faculty_name
  FROM timetable t
  JOIN course_offerings o ON o.id = t.offering_id
  JOIN courses c ON c.id = o.course_id
  LEFT JOIN departments d ON d.id = c.department_id
  JOIN faculty f ON f.id = o.faculty_id
  JOIN users u ON u.id = f.user_id
`;

// POST /api/timetable — admin only. Body decides class vs exam via `type`.
router.post('/', requireRole('admin'), (req, res) => {
  const { type, offering_id, start_time, end_time, room } = req.body || {};
  const day_or_date = String(req.body?.day_or_date || '').trim();
  if (!offering_id || !day_or_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Course offering, day/date and times are required.' });
  }
  if (type === 'class' && !WEEKDAYS.includes(day_or_date)) {
    return res.status(400).json({ error: 'Class day must be a weekday name like Monday.' });
  }
  if (type === 'exam' && !/^\d{4}-\d{2}-\d{2}$/.test(day_or_date)) {
    return res.status(400).json({ error: 'Exam date must be YYYY-MM-DD.' });
  }
  // Times must parse and start before end — no 10:00–09:00 classes.
  const TIME_RE = /^\d{2}:\d{2}$/;
  if (!TIME_RE.test(start_time) || !TIME_RE.test(end_time) || start_time >= end_time) {
    return res.status(400).json({ error: 'Times must be HH:MM with start before end.' });
  }
  // Duplicate guard: same offering, same day/date, overlapping time = mistake.
  const clash = db.prepare(`
    SELECT id FROM timetable
    WHERE offering_id = ? AND day_or_date = ?
      AND start_time < ? AND end_time > ?
  `).get(offering_id, day_or_date, end_time, start_time);
  if (clash) {
    return res.status(400).json({ error: 'This course already has a slot at that day/time.' });
  }
  const info = db.prepare(
    'INSERT INTO timetable (type, offering_id, day_or_date, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(type === 'exam' ? 'exam' : 'class', offering_id, day_or_date, start_time, end_time, room || 'TBA');
  res.json(db.prepare('SELECT * FROM timetable WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/timetable/:id — admin only.
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM timetable WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/timetable?section=A&type=class&department_id=1 — admin: filterable list.
// department_id lets admins view one department's schedule at a time
// (CSE timetable vs ECE timetable). Departments come from the course.
router.get('/', (req, res) => {
  const { section, type, department_id } = req.query;
  let sql = JOIN + ' WHERE 1=1';
  const params = [];
  if (section) { sql += ' AND o.section = ?'; params.push(section); }
  if (type) { sql += ' AND t.type = ?'; params.push(type); }
  if (department_id) { sql += ' AND c.department_id = ?'; params.push(department_id); }
  sql += type === 'exam'
    ? ' ORDER BY t.day_or_date, t.start_time'
    : ` ORDER BY CASE t.day_or_date ${WEEKDAYS.map((d, i) => `WHEN '${d}' THEN ${i}`).join(' ')} END, t.start_time`;
  res.json(db.prepare(sql).all(...params));
});

// GET /api/timetable/faculty/mine?type=class — faculty: own teaching slots.
router.get('/faculty/mine', requireRole('faculty'), (req, res) => {
  const { type } = req.query;
  const rows = db.prepare(JOIN + `
    WHERE f.user_id = ? ${type ? 'AND t.type = ?' : ''}
    ORDER BY t.day_or_date, t.start_time
  `).all(req.user.id, ...(type ? [type] : []));
  res.json(rows);
});

// GET /api/timetable/student/mine?type=exam — student: own section's slots.
router.get('/student/mine', requireRole('student'), (req, res) => {
  const { type } = req.query;
  const student = db.prepare('SELECT section FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.json([]);

  const rows = db.prepare(JOIN + `
    WHERE o.section = ? AND o.id IN (SELECT offering_id FROM enrollments WHERE student_id IN
      (SELECT id FROM students WHERE user_id = ?))
      ${type ? 'AND t.type = ?' : ''}
    ORDER BY t.day_or_date, t.start_time
  `).all(student.section, req.user.id, ...(type ? [type] : []));
  res.json(rows);
});

module.exports = router;
