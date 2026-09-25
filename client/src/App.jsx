// App.jsx — all routes in one flat file. After login the user lands on
// /dashboard; ProtectedRoute checks token + role before rendering a page.
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Announcements from './pages/Announcements.jsx';

import Departments from './pages/admin/Departments.jsx';
import Courses from './pages/admin/Courses.jsx';
import Students from './pages/admin/Students.jsx';
import Faculty from './pages/admin/Faculty.jsx';
import Offerings from './pages/admin/Offerings.jsx';
import Enrollments from './pages/admin/Enrollments.jsx';
import TimetableAdmin from './pages/admin/Timetable.jsx';
import ExamsAdmin from './pages/admin/Exams.jsx';
import Constraints from './pages/admin/Constraints.jsx';

import MyCourses from './pages/faculty/MyCourses.jsx';
import AttendanceFaculty from './pages/faculty/Attendance.jsx';
import MarksFaculty from './pages/faculty/Marks.jsx';
import AssignmentsFaculty from './pages/faculty/Assignments.jsx';
import TimetableFaculty from './pages/faculty/Timetable.jsx';

import AttendanceStudent from './pages/student/Attendance.jsx';
import MarksStudent from './pages/student/Marks.jsx';
import AssignmentsStudent from './pages/student/Assignments.jsx';
import TimetableStudent from './pages/student/Timetable.jsx';
import ExamsStudent from './pages/student/Exams.jsx';

const homeFor = (role) => (role === 'admin' ? '/admin/departments' : '/dashboard');

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />

          {/* Admin */}
          <Route path="/admin/departments" element={<ProtectedRoute role="admin"><Departments /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute role="admin"><Courses /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="admin"><Students /></ProtectedRoute>} />
          <Route path="/admin/faculty" element={<ProtectedRoute role="admin"><Faculty /></ProtectedRoute>} />
          <Route path="/admin/offerings" element={<ProtectedRoute role="admin"><Offerings /></ProtectedRoute>} />
          <Route path="/admin/enrollments" element={<ProtectedRoute role="admin"><Enrollments /></ProtectedRoute>} />
          <Route path="/admin/timetable" element={<ProtectedRoute role="admin"><TimetableAdmin /></ProtectedRoute>} />
          <Route path="/admin/exams" element={<ProtectedRoute role="admin"><ExamsAdmin /></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<ProtectedRoute role="admin"><Constraints /></ProtectedRoute>} />

          {/* Faculty */}
          <Route path="/faculty/courses" element={<ProtectedRoute role="faculty"><MyCourses /></ProtectedRoute>} />
          <Route path="/faculty/attendance" element={<ProtectedRoute role="faculty"><AttendanceFaculty /></ProtectedRoute>} />
          <Route path="/faculty/marks" element={<ProtectedRoute role="faculty"><MarksFaculty /></ProtectedRoute>} />
          <Route path="/faculty/assignments" element={<ProtectedRoute role="faculty"><AssignmentsFaculty /></ProtectedRoute>} />
          <Route path="/faculty/timetable" element={<ProtectedRoute role="faculty"><TimetableFaculty /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/student/attendance" element={<ProtectedRoute role="student"><AttendanceStudent /></ProtectedRoute>} />
          <Route path="/student/marks" element={<ProtectedRoute role="student"><MarksStudent /></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute role="student"><AssignmentsStudent /></ProtectedRoute>} />
          <Route path="/student/timetable" element={<ProtectedRoute role="student"><TimetableStudent /></ProtectedRoute>} />
          <Route path="/student/exams" element={<ProtectedRoute role="student"><ExamsStudent /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
