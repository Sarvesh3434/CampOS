// Login.jsx — ID + password -> JWT in localStorage -> redirect by role.
//
// No emails, no demo credentials shown anywhere (as requested).
// Users log in with:
//   students  -> roll number   (e.g. CSE001)
//   faculty   -> faculty code  (e.g. FAC001)
//   admin     -> admin code    (e.g. ADM001)
//
// The page pings /api/health and shows a status pill, so "backend not
// running" is never confused with "wrong password".
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api, { API_BASE } from '../api';

const HOME = { admin: '/dashboard', faculty: '/dashboard', student: '/dashboard' };

export default function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverUp, setServerUp] = useState(null); // null = checking

  // Ping the backend on load and whenever the tab regains focus.
  // Uses the same base as the api instance (respecting VITE_API_URL).
  const ping = () =>
    axios.get(`${API_BASE}/health`, { timeout: 3000 })
      .then(() => setServerUp(true))
      .catch(() => setServerUp(false));

  useEffect(() => {
    ping();
    window.addEventListener('focus', ping);
    return () => window.removeEventListener('focus', ping);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', {
        login_id: loginId.trim().toUpperCase(),
        password,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(HOME[data.user.role] || '/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Start it with "npm run dev" and try again.');
        setServerUp(false);
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-slate-900 rounded-3xl shadow-lift overflow-hidden
        grid md:grid-cols-2 border border-white/10 animate-fade-up">

        {/* ── Left: brand panel (hidden on small screens) ─────────────── */}
        <div className="relative hidden md:flex flex-col justify-between p-10
          bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
          {/* soft decorative glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/25
                flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M22 10L12 5 2 10l10 5 10-5z" />
                  <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                </svg>
              </div>
              <span className="font-display text-2xl font-bold tracking-tight">CampOS</span>
            </div>
          </div>

          <div className="relative space-y-6">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight">
              One platform for your<br />whole campus.
            </h2>
            <ul className="space-y-3.5 text-sm text-blue-50/90">
              {[
                'Attendance, marks & assignments in one place',
                'Auto-generated timetables and exam schedules',
                'Role-based dashboards for admin, faculty & students',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-blue-100/60">© 2026 CampOS · Academic Management</p>
        </div>

        {/* ── Right: the form ─────────────────────────────────────────── */}
        <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
          {/* mobile-only brand */}
          <div className="md:hidden mb-6 flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Camp<span className="text-blue-600">OS</span>
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1 mb-5">Sign in with your campus ID to continue.</p>

          {/* server status pill — distinguishes "server down" from "wrong password" */}
          <div className="flex mb-5">
            <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium border ${
              serverUp === false ? 'bg-red-50 text-red-700 border-red-200'
              : serverUp === true ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                serverUp === false ? 'bg-red-500 animate-pulse'
                : serverUp === true ? 'bg-emerald-500'
                : 'bg-slate-400 animate-pulse'
              }`}></span>
              {serverUp === false ? 'Server offline' : serverUp === true ? 'Server connected' : 'Checking server…'}
            </span>
          </div>

          {serverUp === false && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 leading-relaxed">
              <b>Backend not running.</b> In the project folder run:
              <code className="block bg-red-100 rounded px-2 py-1 mt-1 font-mono">npm run dev</code>
              Then refresh this page.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Login ID</label>
              <input className="input font-mono uppercase" value={loginId} required
                autoComplete="username"
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="CSE001 / FAC001 / ADM001" />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Students: roll number · Faculty: faculty code · Admin: admin code
              </p>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-16" type={showPw ? 'text' : 'password'} value={password} required
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-500 cursor-pointer">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3.5 py-2.5 animate-fade-in">
                {error}
              </div>
            )}
            <button className="btn w-full" disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
              {!busy && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
