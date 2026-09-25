# CampOS — Academic Management Platform

A beginner-friendly, full-stack academic management platform (learning project / expo demo).
Admin, Faculty, and Student all see the same **live data** from a real SQLite database
through a real Express API — no mock data anywhere.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite, plain JSX), React Router, Axios, Tailwind CSS |
| Backend | Node.js + Express (plain JS, flat routes → raw SQL) |
| Database | SQLite — single file `server/campos.db` (Node's built-in `node:sqlite`, no native deps) |
| Auth | JWT (stored in localStorage) + bcryptjs |

## Quick Start

```bash
# 1. Install dependencies (server + client)
npm install
npm install --prefix server
npm install --prefix client

# 2. Create the database with demo data
npm run seed

# 3. Start the API (port 3001) in one terminal
npm run server

# 4. Start the web app (port 5173) in another terminal
npm run client

# Or run both at once:
npm run dev
```

Then open **http://localhost:5173**

### Demo Accounts (password: `password123`)

| Role | Email |
|---|---|
| Admin | admin@campos.edu |
| Faculty | meera@campos.edu |
| Faculty | arun@campos.edu |
| Students | s1@campos.edu … s12@campos.edu |

## Resetting the Demo

```bash
rm server/campos.db   # (delete campos.db-wal / campos.db-shm too if present)
npm run seed
```

## The 5-Step Demo Script (rehearse this!)

1. **Admin** logs in → Courses → add a course → Course Allocation → assign faculty + section →
   Enrollments → add students to it.
2. **Faculty** logs in (another tab) → sees the course under *My Courses* →
   Mark Attendance → pick course + today → toggle students → **Save**.
3. **Student** logs in (another tab) → My Attendance → the new class is already counted.
4. **Admin** → Academic Tasks → create "Mark today's attendance by 6 PM" →
   every faculty sees it as **Pending** on their dashboard.
5. **Faculty** marks attendance → the task flips to **Completed automatically** →
   Admin's Academic Tasks page shows the compliance count (e.g. `1/2 completed`).

## Project Structure

```
server/                 Express API (port 3001)
  index.js              entry point, mounts all routes
  db.js                 SQLite connection + schema (node:sqlite, built-in)
  seed.js               demo data (npm run seed)
  middleware/auth.js    JWT guard + role check
  routes/               one flat file per feature:
    auth, departments, courses, faculty, students,
    offerings (allocation), enrollments, attendance,
    marks, assignments, timetable (classes + exams),
    constraints (academic tasks), announcements, dashboard
client/                 React app (port 5173, Vite)
  src/api.js            Axios instance + JWT interceptor
  src/App.jsx           all routes
  src/components/       ProtectedRoute, Layout (sidebar), UI helpers
  src/pages/            Login, Dashboard, Announcements
    admin/              Departments, Courses, Faculty, Students,
                        Offerings, Enrollments, Timetable, Exams, Tasks
    faculty/            MyCourses, Attendance, Marks, Assignments, Timetable
    student/            Attendance, Marks, Assignments, Timetable, Exams
```

## Design Notes (the "why")

- **One `timetable` table** holds both weekly classes (`type='class'`, weekday name)
  and exams (`type='exam'`, a date). The UI just filters — two pages, one table.
- **Academic Tasks auto-complete**: the completion logic lives inside the attendance
  save. When faculty mark attendance, any pending faculty task flips to completed —
  no extra button, which is exactly what makes the demo impressive.
- **Attendance upserts**: `UNIQUE(offering_id, student_id, date)` + `ON CONFLICT`
  means re-marking a day updates instead of duplicating.
- **Raw SQL everywhere** on purpose — you should be able to explain every query.

## Database Tables

users, students, faculty, departments, courses, course_offerings, enrollments,
attendance, marks, assignments, assignment_submissions, timetable, announcements,
academic_constraints, constraint_status
