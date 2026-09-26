// seed.js — fills campos.db with small, realistic demo data.
// Run:  npm run seed   (from the repo root)  or  node seed.js  (from server/)
// Reset: delete server/campos.db first, then seed again. That's the whole story.
//
// Demo accounts (all passwords are "password123"):
//   admin@campos.edu        (Admin — Dr. Ravi Selvam)
//   meera@campos.edu        (Faculty — Meera Sundaram, CSE)
//   arun@campos.edu         (Faculty — Arun Kumar, ECE)
//   ram@campos.edu          (Faculty — Ram, MAT)
//   s1..s16@campos.edu      (Students — short names)
const bcrypt = require('bcryptjs');
const db = require('./db');

// Single shared demo password for every seeded account. Kept here (not in the
// README) so the repo's front page doesn't advertise credentials.
const DEMO_PASSWORD = 'password123';

// Start from scratch every time so the demo is repeatable.
db.exec(`
  DROP TABLE IF EXISTS constraint_status;
  DROP TABLE IF EXISTS academic_constraints;
  DROP TABLE IF EXISTS announcements;
  DROP TABLE IF EXISTS timetable;
  DROP TABLE IF EXISTS assignment_submissions;
  DROP TABLE IF EXISTS assignments;
  DROP TABLE IF EXISTS marks;
  DROP TABLE IF EXISTS attendance;
  DROP TABLE IF EXISTS enrollments;
  DROP TABLE IF EXISTS course_offerings;
  DROP TABLE IF EXISTS courses;
  DROP TABLE IF EXISTS students;
  DROP TABLE IF EXISTS faculty;
  DROP TABLE IF EXISTS departments;
  DROP TABLE IF EXISTS users;
`);
db.createSchema(); // re-create the empty tables we just dropped

const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

// ── Users ───────────────────────────────────────────────────────────────
// login_id = what you type on the login page (NOT email):
//   admin -> ADM001, faculty -> faculty code (FAC001...), students -> roll no (CSE001...)
const insUser = db.prepare(
  'INSERT INTO users (name, email, login_id, password_hash, role) VALUES (?, ?, ?, ?, ?)'
);
const admin = insUser.run('Dr. Ravi Selvam', 'admin@campos.edu', 'ADM001', hash, 'admin').lastInsertRowid;
const meera = insUser.run('Meera Sundaram', 'meera@campos.edu', 'FAC001', hash, 'faculty').lastInsertRowid;
const arun  = insUser.run('Arun Kumar', 'arun@campos.edu', 'FAC002', hash, 'faculty').lastInsertRowid;
const ram   = insUser.run('Ram', 'ram@campos.edu', 'FAC003', hash, 'faculty').lastInsertRowid;

const studentUserIds = [];
// Short single names keep every dropdown/table readable.
const STUDENT_NAMES = [
  'Kayal', 'Sakthi', 'Priya', 'Vignesh',
  'Sneha', 'Karthik', 'Ananya', 'Hari',
  'Divya', 'Adhitya', 'Nithya', 'Mani',
  'Vikram', 'Deepak', 'Meena', 'Rhea',
];
for (let i = 1; i <= 16; i++) {
  const rollNo = i <= 8 ? `CSE${String(i).padStart(3, '0')}`
    : i <= 12 ? `ECE${String(i - 8).padStart(3, '0')}`
    : `MAT${String(i - 12).padStart(3, '0')}`;
  studentUserIds.push(
    insUser.run(STUDENT_NAMES[i - 1], `s${i}@campos.edu`, rollNo, hash, 'student').lastInsertRowid
  );
}

// ── Departments / Faculty / Students / Courses ──────────────────────────────
const insDept = db.prepare('INSERT INTO departments (name, code) VALUES (?, ?)');
const cse = insDept.run('Computer Science', 'CSE').lastInsertRowid;
const ece = insDept.run('Electronics', 'ECE').lastInsertRowid;
const mat = insDept.run('Mathematics', 'MAT').lastInsertRowid;

const insFac = db.prepare(
  'INSERT INTO faculty (user_id, faculty_code, department_id, designation) VALUES (?, ?, ?, ?)'
);
const fMeera = insFac.run(meera, 'FAC001', cse, 'Associate Professor').lastInsertRowid;
const fArun  = insFac.run(arun, 'FAC002', ece, 'Assistant Professor').lastInsertRowid;
const fRam   = insFac.run(ram, 'FAC003', mat, 'Assistant Professor').lastInsertRowid;

// 8 students in CSE section A, 4 in ECE section A, 4 in MAT section A.
const insStu = db.prepare(
  'INSERT INTO students (user_id, roll_no, department_id, section, year) VALUES (?, ?, ?, ?, ?)'
);
const cseStudents = [], eceStudents = [], matStudents = [];
studentUserIds.forEach((uid, idx) => {
  if (idx < 8) cseStudents.push(insStu.run(uid, `CSE00${idx + 1}`, cse, 'A', 2).lastInsertRowid);
  else if (idx < 12) eceStudents.push(insStu.run(uid, `ECE00${idx - 7}`, ece, 'A', 2).lastInsertRowid);
  else matStudents.push(insStu.run(uid, `MAT00${idx - 11}`, mat, 'A', 2).lastInsertRowid);
});

const insCourse = db.prepare(
  'INSERT INTO courses (code, name, department_id, credits) VALUES (?, ?, ?, ?)'
);
const dbms  = insCourse.run('CS201', 'Database Systems', cse, 4).lastInsertRowid;
const os    = insCourse.run('CS202', 'Operating Systems', cse, 3).lastInsertRowid;
const cn    = insCourse.run('CS301', 'Computer Networks', cse, 3).lastInsertRowid;
const dsp   = insCourse.run('EC201', 'Digital Signal Processing', ece, 4).lastInsertRowid;
const alg   = insCourse.run('MAT101', 'Algebra', mat, 3).lastInsertRowid;

// ── Course offerings (faculty -> course -> section) ─────────────────────────
const insOff = db.prepare(
  'INSERT INTO course_offerings (course_id, faculty_id, section, semester) VALUES (?, ?, ?, ?)'
);
const offDbms = insOff.run(dbms, fMeera, 'A', 'Odd 2026').lastInsertRowid;
const offOs   = insOff.run(os,   fMeera, 'A', 'Odd 2026').lastInsertRowid;
const offCn   = insOff.run(cn,   fMeera, 'A', 'Odd 2026').lastInsertRowid;
const offDsp  = insOff.run(dsp,  fArun,  'A', 'Odd 2026').lastInsertRowid;
const offAlg  = insOff.run(alg,  fRam,   'A', 'Odd 2026').lastInsertRowid;

const insEnr = db.prepare(
  'INSERT INTO enrollments (offering_id, student_id) VALUES (?, ?)'
);
cseStudents.forEach(s => { insEnr.run(offDbms, s); insEnr.run(offOs, s); insEnr.run(offCn, s); });
eceStudents.forEach(s => insEnr.run(offDsp, s));
matStudents.forEach(s => insEnr.run(offAlg, s));

// ── Timetable: weekly classes (repeated by weekday) ─────────────────────────
const insSlot = db.prepare(
  "INSERT INTO timetable (type, offering_id, day_or_date, start_time, end_time, room) VALUES ('class', ?, ?, ?, ?, ?)"
);
insSlot.run(offDbms, 'Monday',    '09:00', '10:00', 'LH-1');
insSlot.run(offDbms, 'Wednesday', '09:00', '10:00', 'LH-1');
insSlot.run(offOs,   'Tuesday',   '10:00', '11:00', 'LH-2');
insSlot.run(offOs,   'Thursday',  '10:00', '11:00', 'LH-2');
insSlot.run(offCn,   'Friday',    '11:00', '12:00', 'LH-3');
insSlot.run(offDsp,  'Monday',    '14:00', '15:00', 'EC-Lab');
insSlot.run(offAlg,  'Tuesday',   '14:00', '15:00', 'LH-4');

// ── Timetable: exams (one specific date each) ───────────────────────────────
const insExam = db.prepare(
  "INSERT INTO timetable (type, offering_id, day_or_date, start_time, end_time, room) VALUES ('exam', ?, ?, ?, ?, ?)"
);
insExam.run(offDbms, '2026-10-12', '09:30', '11:00', 'Exam Hall 1');
insExam.run(offOs,   '2026-10-14', '09:30', '11:00', 'Exam Hall 1');
insExam.run(offCn,   '2026-10-16', '14:00', '15:30', 'Exam Hall 2');
insExam.run(offDsp,  '2026-10-13', '09:30', '11:00', 'Exam Hall 2');
insExam.run(offAlg,  '2026-10-17', '09:30', '11:00', 'Exam Hall 1');

// ── Attendance: last 6 weekdays for DBMS + OS, ~85% present ─────────────────
const insAtt = db.prepare(
  'INSERT INTO attendance (offering_id, student_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)'
);
function lastWeekdays(n) {
  const days = [];
  const d = new Date();
  while (days.length < n) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  return days;
}
lastWeekdays(6).forEach((date, di) => {
  cseStudents.forEach((s, si) => {
    // deterministic pattern: skip a few so percentages aren't all 100%
    const present = !((si + di) % 7 === 3 || (si + di) % 11 === 5);
    insAtt.run(offDbms, s, date, present ? 'present' : 'absent', meera);
    insAtt.run(offOs, s, date, ((si + di) % 9 === 4) ? 'absent' : 'present', meera);
  });
});

// ── Marks: CAT1 for everyone, CAT2 for some, so faculty can demo entering rest ──
const insMark = db.prepare(
  'INSERT INTO marks (offering_id, student_id, cat1, cat2, assignment, fat) VALUES (?, ?, ?, ?, ?, ?)'
);
cseStudents.forEach((s, i) => {
  insMark.run(offDbms, s, 22 + (i % 6), i % 2 ? 24 : null, 8 + (i % 3), null);
  insMark.run(offOs,   s, 18 + (i % 9), null, null, null);
});

// ── One assignment with a couple of submissions ─────────────────────────────
const asg = db.prepare(
  "INSERT INTO assignments (offering_id, title, description, deadline) VALUES (?, ?, ?, ?)"
).run(offDbms, 'ER Diagram - College System',
  'Draw an ER diagram for the college database. Submit a diagram link (draw.io/imgur).',
  '2026-10-05T23:59').lastInsertRowid;
const insSub = db.prepare(
  'INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, mark, marked_at) VALUES (?, ?, ?, ?, ?)'
);
insSub.run(asg, cseStudents[0], 'https://drive.google.com/er-diagram-aisha', 9, new Date().toISOString());
insSub.run(asg, cseStudents[1], 'https://imgur.com/er-diagram-rahul', null, null);

// ── Announcements ───────────────────────────────────────────────────────────
const insAnn = db.prepare(
  "INSERT INTO announcements (title, message, target_type, target_offering_id, author_id) VALUES (?, ?, ?, ?, ?)"
);
insAnn.run('CAT1 marks published', 'CAT1 marks for CS201 are now visible. Check the Marks page.', 'all', null, admin);
insAnn.run('DBMS assignment deadline extended', 'Submit the ER diagram by Friday midnight.', 'course', offDbms, meera);

// ── Academic task (the flagship constraint demo) ────────────────────────────
const constraint = db.prepare(
  "INSERT INTO academic_constraints (title, description, target_role, due_time) VALUES (?, ?, ?, ?)"
).run('Mark today\'s attendance by 6 PM',
  'All faculty must mark attendance for every class held today before 18:00.',
  'faculty', '18:00').lastInsertRowid;

// Everyone starts pending; it flips to 'completed' when faculty marks attendance.
const insStatus = db.prepare(
  "INSERT INTO constraint_status (constraint_id, user_id, status) VALUES (?, ?, 'pending')"
);
insStatus.run(constraint, meera);
insStatus.run(constraint, arun);

console.log('Seed complete.');
console.log(`Logins (password: ${DEMO_PASSWORD}):`);
console.log('  admin@campos.edu   (Admin)');
console.log('  meera@campos.edu   (Faculty)');
console.log('  arun@campos.edu    (Faculty)');
console.log('  s1@campos.edu ... s16@campos.edu (Students)');
