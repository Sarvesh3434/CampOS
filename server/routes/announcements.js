// announcements — admin/faculty post; everyone sees relevant ones.
// target_type='all' -> everyone; 'course' -> only users enrolled in / teaching
// that offering. Kept simple: no departments/sections targeting (per prompt).
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/announcements — role-aware list:
//   admin: everything; faculty: 'all' + courses they teach; student: 'all' + enrolled courses.
router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare(`
      SELECT a.*, c.code AS course_code, u.name AS author_name
      FROM announcements a
      LEFT JOIN course_offerings o ON o.id = a.target_offering_id
      LEFT JOIN courses c ON c.id = o.course_id
      JOIN users u ON u.id = a.author_id
      ORDER BY a.created_at DESC
    `).all();
  } else if (req.user.role === 'faculty') {
    rows = db.prepare(`
      SELECT a.*, c.code AS course_code, u.name AS author_name
      FROM announcements a
      LEFT JOIN course_offerings o ON o.id = a.target_offering_id
      LEFT JOIN courses c ON c.id = o.course_id
      JOIN users u ON u.id = a.author_id
      WHERE a.target_type = 'all' OR o.faculty_id = (SELECT id FROM faculty WHERE user_id = ?)
      ORDER BY a.created_at DESC
    `).all(req.user.id);
  } else {
    rows = db.prepare(`
      SELECT a.*, c.code AS course_code, u.name AS author_name
      FROM announcements a
      LEFT JOIN course_offerings o ON o.id = a.target_offering_id
      LEFT JOIN courses c ON c.id = o.course_id
      JOIN users u ON u.id = a.author_id
      WHERE a.target_type = 'all' OR o.id IN (
        SELECT offering_id FROM enrollments WHERE student_id = (SELECT id FROM students WHERE user_id = ?)
      )
      ORDER BY a.created_at DESC
    `).all(req.user.id);
  }
  res.json(rows);
});

// POST /api/announcements  { title, message, target_type, target_offering_id } — admin/faculty.
router.post('/', (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Only admin and faculty can post announcements.' });
  }
  const { title, message, target_type, target_offering_id } = req.body || {};
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required.' });

  // Faculty may only target their own courses; admin may target anything.
  if (req.user.role === 'faculty' && target_type === 'course') {
    const own = db.prepare(`
      SELECT 1 FROM course_offerings WHERE id = ? AND faculty_id = (SELECT id FROM faculty WHERE user_id = ?)
    `).get(target_offering_id, req.user.id);
    if (!own) return res.status(403).json({ error: 'You can only post to your own courses.' });
  }

  const info = db.prepare(`
    INSERT INTO announcements (title, message, target_type, target_offering_id, author_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, message, target_type === 'course' ? 'course' : 'all',
         target_type === 'course' ? target_offering_id : null, req.user.id);
  res.json(db.prepare('SELECT * FROM announcements WHERE id = ?').get(info.lastInsertRowid));
});

module.exports = router;
