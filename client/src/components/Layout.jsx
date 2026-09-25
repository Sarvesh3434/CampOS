// Layout — sidebar navigation + top bar. Links differ per role.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const user = () => JSON.parse(localStorage.getItem('user') || 'null');

const LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/courses', label: 'Courses' },
    { to: '/admin/faculty', label: 'Faculty' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/offerings', label: 'Course Allocation' },
    { to: '/admin/enrollments', label: 'Enrollments' },
    { to: '/admin/timetable', label: 'Timetable' },
    { to: '/admin/exams', label: 'Exam Schedule' },
    { to: '/admin/tasks', label: 'Academic Tasks' },
    { to: '/announcements', label: 'Announcements' },
  ],
  faculty: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/faculty/courses', label: 'My Courses' },
    { to: '/faculty/attendance', label: 'Mark Attendance' },
    { to: '/faculty/marks', label: 'Enter Marks' },
    { to: '/faculty/assignments', label: 'Assignments' },
    { to: '/faculty/timetable', label: 'My Timetable' },
    { to: '/announcements', label: 'Announcements' },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/student/attendance', label: 'My Attendance' },
    { to: '/student/marks', label: 'My Marks' },
    { to: '/student/assignments', label: 'Assignments' },
    { to: '/student/timetable', label: 'My Timetable' },
    { to: '/student/exams', label: 'Exam Schedule' },
    { to: '/announcements', label: 'Announcements' },
  ],
};

export default function Layout() {
  const navigate = useNavigate();
  const u = user();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-56 bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100 flex flex-col shadow-xl">
        <div className="p-4 text-xl font-bold border-b border-slate-700/60 tracking-tight">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
          Camp<span className="text-blue-400">OS</span>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {(LINKS[u?.role] || []).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 text-sm">
          <div className="font-semibold">{u?.name}</div>
          <div className="text-slate-400 capitalize">{u?.role}</div>
          <button onClick={logout} className="mt-2 text-red-300 hover:text-red-200">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 max-w-6xl">
        <Outlet />
      </main>

      <style>{`
        .card { transition: box-shadow 0.15s ease; }
      `}</style>
    </div>
  );
}
