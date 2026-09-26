// Layout — app shell: dark sidebar with icons + main area with a topbar.
// Links (and icons) differ per role.
// On mobile (< md) the sidebar becomes a slide-in drawer behind a hamburger.
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from './Icons.jsx';

const user = () => JSON.parse(localStorage.getItem('user') || 'null');

const LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/departments', label: 'Departments', icon: 'departments' },
    { to: '/admin/courses', label: 'Courses', icon: 'courses' },
    { to: '/admin/faculty', label: 'Faculty', icon: 'faculty' },
    { to: '/admin/students', label: 'Students', icon: 'students' },
    { to: '/admin/offerings', label: 'Course Allocation', icon: 'allocation' },
    { to: '/admin/enrollments', label: 'Enrollments', icon: 'enrollments' },
    { to: '/admin/timetable', label: 'Timetable', icon: 'timetable' },
    { to: '/admin/exams', label: 'Exam Schedule', icon: 'exams' },
    { to: '/admin/tasks', label: 'Academic Tasks', icon: 'tasks' },
    { to: '/announcements', label: 'Announcements', icon: 'announcements' },
  ],
  faculty: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/faculty/courses', label: 'My Courses', icon: 'courses' },
    { to: '/faculty/attendance', label: 'Mark Attendance', icon: 'attendance' },
    { to: '/faculty/marks', label: 'Enter Marks', icon: 'marks' },
    { to: '/faculty/assignments', label: 'Assignments', icon: 'assignments' },
    { to: '/faculty/timetable', label: 'My Timetable', icon: 'timetable' },
    { to: '/announcements', label: 'Announcements', icon: 'announcements' },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/student/attendance', label: 'My Attendance', icon: 'attendance' },
    { to: '/student/marks', label: 'My Marks', icon: 'marks' },
    { to: '/student/assignments', label: 'Assignments', icon: 'assignments' },
    { to: '/student/timetable', label: 'My Timetable', icon: 'timetable' },
    { to: '/student/exams', label: 'Exam Schedule', icon: 'exams' },
    { to: '/announcements', label: 'Announcements', icon: 'announcements' },
  ],
};

const ROLE_TAG = {
  admin: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
  faculty: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  student: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
};

export default function Layout() {
  const navigate = useNavigate();
  const u = user();
  const [open, setOpen] = useState(false); // mobile drawer

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const links = LINKS[u?.role] || [];

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar (fixed drawer on mobile, static column on desktop) ─── */}
      <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 flex flex-col
        shadow-lift transition-transform duration-300 ease-out md:static md:w-60 md:shrink-0
        md:h-screen md:sticky md:top-0 md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
            flex items-center justify-center shadow-glow shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
              <path d="M22 10L12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
            </svg>
          </div>
          <div className="font-display font-bold text-lg tracking-tight leading-none">
            Camp<span className="text-blue-400">OS</span>
            <div className="text-[10px] font-sans font-medium text-slate-400 mt-1 tracking-wide uppercase">
              Academic Platform
            </div>
          </div>
          {/* close button (mobile) */}
          <button onClick={() => setOpen(false)} title="Close menu"
            className="ml-auto md:hidden text-slate-400 hover:text-white cursor-pointer p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" className="w-5 h-5"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Menu
          </p>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)} /* close drawer after tapping a link */
              className={({ isActive }) =>
                `group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm mb-0.5
                 font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-glow'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon name={l.icon} className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100" />
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700
              ring-2 ring-white/10 flex items-center justify-center text-sm font-bold shrink-0">
              {u?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate leading-tight">{u?.name}</div>
              <div className="text-[11px] text-slate-500 font-mono truncate">{u?.login_id}</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
            <span className={`badge ring-1 ${ROLE_TAG[u?.role] || ''} capitalize`}>{u?.role}</span>
            <button onClick={logout} title="Log out"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-300 transition-colors cursor-pointer">
              <Icon name="logout" className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main + topbar ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar — mobile only: hamburger + brand */}
        <header className="sticky top-0 z-20 md:hidden bg-white/90 backdrop-blur border-b border-slate-200
          flex items-center gap-3 px-4 py-3">
          <button onClick={() => setOpen(true)} title="Open menu"
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" className="w-6 h-6">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display font-bold tracking-tight text-slate-900">
            Camp<span className="text-blue-600">OS</span>
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
