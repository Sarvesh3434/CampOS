// db.js — SQLite connection + schema for CampOS.
// Uses node:sqlite (built into Node.js 22.5+ — no compiler, no native deps,
// zero setup). The whole database is a single file: campos.db.
// To reset everything: delete campos.db, re-run seed.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'campos.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;'); // enforce FK links (offering -> course, etc.)

// createSchema() runs all CREATE TABLE IF NOT EXISTS statements.
// Called on startup; also exported so seed.js can re-create tables after dropping them.
function createSchema() {
  db.exec(`
    -- Every table has id + created_at. Kept slightly denormalized on purpose —
    -- easier to understand while learning than a fully normalized design.

    -- Login accounts. role: 'admin' | 'faculty' | 'student'
    -- JWT payload will carry { id, role } so route guards are a simple check.
    -- login_id is what the user types to log in: students use their roll no
    -- (CSE001), faculty their faculty code (FAC001), admin ADM001. Emails are
    -- stored for reference but NOT used for login.
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      login_id      TEXT,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('admin','faculty','student')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);

    CREATE TABLE IF NOT EXISTS departments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      code       TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      faculty_code  TEXT NOT NULL UNIQUE,   -- e.g. FAC001
      department_id INTEGER REFERENCES departments(id),
      designation   TEXT DEFAULT 'Assistant Professor',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roll_no       TEXT NOT NULL UNIQUE,   -- e.g. CSE001
      department_id INTEGER REFERENCES departments(id),
      section       TEXT NOT NULL DEFAULT 'A',
      year          INTEGER NOT NULL DEFAULT 2,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      code          TEXT NOT NULL UNIQUE,   -- e.g. CS201
      name          TEXT NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      credits       INTEGER NOT NULL DEFAULT 3,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- THE core link: one faculty teaches one course to one section.
    -- Everything else (attendance, marks, assignments, timetable) hangs off this.
    -- UNIQUE(course_id, section) = a course can only be allocated once per
    -- section, preventing confusing duplicate allocations.
    CREATE TABLE IF NOT EXISTS course_offerings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      faculty_id  INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
      section     TEXT NOT NULL,
      semester    TEXT NOT NULL DEFAULT 'Odd 2026',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (course_id, section)
    );

    -- A student is enrolled in a specific offering (not just a course).
    CREATE TABLE IF NOT EXISTS enrollments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      offering_id INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
      student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (offering_id, student_id)
    );

    -- One row per student per offering per date. UNIQUE makes re-marking the
    -- same day an UPDATE (INSERT ... ON CONFLICT) instead of a duplicate.
    CREATE TABLE IF NOT EXISTS attendance (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      offering_id INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
      student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,            -- YYYY-MM-DD
      status      TEXT NOT NULL CHECK (status IN ('present','absent')),
      marked_by   INTEGER REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (offering_id, student_id, date)
    );

    -- The 4 categories fixed by the MVP: CAT1, CAT2, Assignment, FAT.
    CREATE TABLE IF NOT EXISTS marks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      offering_id INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
      student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      cat1        INTEGER,
      cat2        INTEGER,
      assignment  INTEGER,
      fat         INTEGER,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (offering_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      offering_id INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      deadline    TEXT NOT NULL,            -- datetime-local string
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Text/link submissions only — no file uploads (by design, see prompt §6).
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id   INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      submission_text TEXT NOT NULL,
      mark            INTEGER,              -- filled later by faculty
      submitted_at    TEXT NOT NULL DEFAULT (datetime('now')),
      marked_at       TEXT,
      UNIQUE (assignment_id, student_id)
    );

    -- Shared table for BOTH weekly classes and exams.
    --   type='class' -> day_or_date holds a weekday name ('Monday'), repeats weekly
    --   type='exam'  -> day_or_date holds a date ('2026-10-12'), one-time
    -- Course/section/faculty come from the offering via JOIN — one source of truth.
    CREATE TABLE IF NOT EXISTS timetable (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      type        TEXT NOT NULL DEFAULT 'class' CHECK (type IN ('class','exam')),
      offering_id INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
      day_or_date TEXT NOT NULL,
      start_time  TEXT NOT NULL,            -- HH:MM
      end_time    TEXT NOT NULL,            -- HH:MM
      room        TEXT DEFAULT 'TBA',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- target_type 'all' shows to everyone; 'course' shows to users of that offering.
    CREATE TABLE IF NOT EXISTS announcements (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      title              TEXT NOT NULL,
      message            TEXT NOT NULL,
      target_type        TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all','course')),
      target_offering_id INTEGER REFERENCES course_offerings(id) ON DELETE CASCADE,
      author_id          INTEGER NOT NULL REFERENCES users(id),
      created_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Admin-created tasks, e.g. "Faculty must mark attendance by 6 PM".
    CREATE TABLE IF NOT EXISTS academic_constraints (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_role TEXT NOT NULL DEFAULT 'faculty',
      due_time    TEXT NOT NULL,            -- HH:MM, e.g. 18:00
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- One row per faculty per constraint. Starts 'pending'; flips to 'completed'
    -- automatically when the faculty performs the action (see routes/attendance.js).
    CREATE TABLE IF NOT EXISTS constraint_status (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      constraint_id INTEGER NOT NULL REFERENCES academic_constraints(id) ON DELETE CASCADE,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
      completed_at  TEXT,
      UNIQUE (constraint_id, user_id)
    );
  `);
}

createSchema();

// ── Tiny migration for databases created before login_id existed ──────────
// ALTER fails harmlessly if the column already exists; the UPDATEs backfill
// login ids from roll numbers / faculty codes so old databases keep working.
try { db.exec("ALTER TABLE users ADD COLUMN login_id TEXT"); } catch (e) { /* already there */ }
try {
  db.exec(`
    UPDATE users SET login_id = COALESCE(
      (SELECT roll_no FROM students WHERE students.user_id = users.id),
      'ADM' || printf('%03d', id))
    WHERE role = 'student' AND login_id IS NULL;
    UPDATE users SET login_id = COALESCE(
      (SELECT faculty_code FROM faculty WHERE faculty.user_id = users.id),
      'FAC' || printf('%03d', id))
    WHERE role = 'faculty' AND login_id IS NULL;
    UPDATE users SET login_id = 'ADM' || printf('%03d', id)
    WHERE role = 'admin' AND login_id IS NULL;
  `);
} catch (e) { /* nothing to backfill */ }

db.createSchema = createSchema; // attach so seed.js can call db.createSchema()

// node:sqlite has no .transaction() helper, so provide one with the same
// contract as better-sqlite3: tx = db.transaction(fn); tx(...args) runs fn
// inside BEGIN/COMMIT (rolls back on throw).
if (typeof db.transaction !== 'function') {
  db.transaction = (fn) => (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
}

module.exports = db;
