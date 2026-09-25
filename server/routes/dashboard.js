// dashboard — one endpoint per role. Each returns 4-6 numbers for stat cards
// plus "today's classes" and "upcoming exams" lists. No charts, just numbers.
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const TODAY = () => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

const CLASS_JOIN = `
  SELECT t.id, t.start_time, t.end_time, t.room,
         c.code AS course_code, c.name AS course_name, o.section, u.name AS faculty_name
  FROM timetable t
  JOIN course_offerings o ON o.id = t.offering_id
  JOIN courses c ON c.id = o.course_id
  JOIN faculty f ON f.id = o.faculty_id
  JOIN users u ON u.id = f.user_id
`;

// GET /api/dashboard/admin
router.get('/admin', requireRole('admin'), (_req, res) => {
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    stats: {
      students:   count('SELECT COUNT(*) AS n FROM students'),
      faculty:    count('SELECT COUNT(*) AS n FROM faculty'),
      courses:    count('SELECT COUNT(*) AS n FROM courses'),
      departments:count('SELECT COUNT(*) AS n FROM departments'),
      offerings:  count('SELECT COUNT(*) AS n FROM course_offerings'),
      pending_tasks: db.prepare(
        "SELECT COUNT(*) AS n FROM constraint_status WHERE status = 'pending'"
      ).get().n,
    },
    todays_classes: db.prepare(CLASS_JOIN + ' WHERE t.type = ? AND t.day_or_date = ? ORDER BY t.start_time')
      .all('class', TODAY()),
    upcoming_exams: db.prepare(CLASS_JOIN + `
      WHERE t.type = 'exam' AND t.day_or_date >= date('now') ORDER BY t.day_or_date LIMIT 6`).all(),
  });
});

// GET /api/dashboard/faculty
router.get('/faculty', requireRole('faculty'), (req, res) => {
  const me = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(req.user.id);
  if (!me) return res.json({ stats: {}, todays_classes: [], upcoming_exams: [], pending_tasks: [] });

  res.json({
    stats: {
      my_courses: db.prepare('SELECT COUNT(*) AS n FROM course_offerings WHERE faculty_id = ?').get(me.id).n,
      students: db.prepare(
        'SELECT COUNT(DISTINCT student_id) AS n FROM enrollments WHERE offering_id IN (SELECT id FROM course_offerings WHERE faculty_id = ?)'
      ).get(me.id).n,
      assignments: db.prepare(
        'SELECT COUNT(*) AS n FROM assignments WHERE offering_id IN (SELECT id FROM course_offerings WHERE faculty_id = ?)'
      ).get(me.id).n,
      pending_submissions: db.prepare(`
        SELECT COUNT(*) AS n FROM assignment_submissions sub
        JOIN assignments a ON a.id = sub.assignment_id
        WHERE sub.mark IS NULL AND a.offering_id IN (SELECT id FROM course_offerings WHERE faculty_id = ?)
      `).get(me.id).n,
    },
    todays_classes: db.prepare(CLASS_JOIN + `
      WHERE t.type = 'class' AND t.day_or_date = ? AND f.id = ? ORDER BY t.start_time`)
      .all(TODAY(), me.id),
    upcoming_exams: db.prepare(CLASS_JOIN + `
      WHERE t.type = 'exam' AND t.day_or_date >= date('now') AND f.id = ? ORDER BY t.day_or_date LIMIT 6`)
      .all(me.id),
    // Pending academic tasks show right on the dashboard (demo step 5).
    pending_tasks: db.prepare(`
      SELECT a.title, a.due_time, cs.status FROM academic_constraints a
      JOIN constraint_status cs ON cs.constraint_id = a.id
      WHERE cs.user_id = ? AND cs.status = 'pending'
    `).all(req.user.id),
  });
});

// GET /api/dashboard/student
router.get('/student', requireRole('student'), (req, res) => {
  const me = db.prepare('SELECT id, section FROM students WHERE user_id = ?').get(req.user.id);
  if (!me) return res.json({ stats: {}, todays_classes: [], upcoming_exams: [], announcements: [] });

  const att = db.prepare(`
    SELECT COUNT(a.id) AS total,
           SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present
    FROM attendance a
    WHERE a.student_id = ?
  `).get(me.id);
  const overall = att.total ? Math.round(100 * att.present / att.total) : 0;

  res.json({
    stats: {
      courses: db.prepare('SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ?').get(me.id).n,
      attendance_overall: overall,
      assignments_submitted: db.prepare(`
        SELECT COUNT(*) AS n FROM assignment_submissions WHERE student_id = ?
      `).get(me.id).n,
      upcoming_exams: db.prepare(`
        SELECT COUNT(*) AS n FROM timetable
        WHERE type = 'exam' AND day_or_date >= date('now')
          AND offering_id IN (SELECT offering_id FROM enrollments WHERE student_id = ?)
      `).get(me.id).n,
    },
    todays_classes: db.prepare(CLASS_JOIN + `
      WHERE t.type = 'class' AND t.day_or_date = ? AND o.section = ?
        AND o.id IN (SELECT offering_id FROM enrollments WHERE student_id = ?)
      ORDER BY t.start_time`).all(TODAY(), me.section, me.id),
    upcoming_exams: db.prepare(CLASS_JOIN + `
      WHERE t.type = 'exam' AND t.day_or_date >= date('now')
        AND o.id IN (SELECT offering_id FROM enrollments WHERE student_id = ?)
      ORDER BY t.day_or_date LIMIT 6`).all(me.id),
    announcements: db.prepare(`
      SELECT title, message, created_at FROM announcements
      WHERE target_type = 'all' OR target_offering_id IN
        (SELECT offering_id FROM enrollments WHERE student_id = ?)
      ORDER BY created_at DESC LIMIT 5
    `).all(me.id),
  });
});

module.exports = router;
