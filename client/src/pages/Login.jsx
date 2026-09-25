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
import api from '../api';

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
  const ping = () =>
    axios.get('/api/health', { timeout: 3000 })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h1 className="text-3xl font-bold text-center mb-1 tracking-tight">
          Camp<span className="text-blue-600">OS</span>
        </h1>
        <p className="text-center text-gray-500 text-sm mb-5">Academic Management Platform</p>

        {/* server status pill — distinguishes "server down" from "wrong password" */}
        <div className="flex justify-center mb-5">
          <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium ${
            serverUp === false ? 'bg-red-50 text-red-700 border border-red-200'
            : serverUp === true ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-50 text-gray-500 border border-gray-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              serverUp === false ? 'bg-red-500 animate-pulse'
              : serverUp === true ? 'bg-green-500'
              : 'bg-gray-400 animate-pulse'
            }`}></span>
            {serverUp === false ? 'Server offline' : serverUp === true ? 'Server connected' : 'Checking server…'}
          </span>
        </div>

        {serverUp === false && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 leading-relaxed">
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
            <p className="text-[11px] text-gray-400 mt-1">
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
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline">
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button className="btn w-full" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
