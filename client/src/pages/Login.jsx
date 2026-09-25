// Login.jsx — email + password -> JWT in localStorage -> redirect by role.
//
// Also handles the #1 setup mistake gracefully: if the backend server isn't
// running (e.g. you opened the client without `npm run dev`), the page shows
// a clear red banner telling you exactly what to do — instead of a cryptic
// "Network Error" after submitting.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';

const HOME = { admin: '/dashboard', faculty: '/dashboard', student: '/dashboard' };

const DEMO_ACCOUNTS = [
  { role: 'Admin', name: 'Dr. Ravi Selvam', email: 'admin@campos.edu', color: 'bg-purple-100 text-purple-700' },
  { role: 'Faculty', name: 'Meera Sundaram', email: 'meera@campos.edu', color: 'bg-blue-100 text-blue-700' },
  { role: 'Student', name: 'Kayalvizhi', email: 's1@campos.edu', color: 'bg-green-100 text-green-700' },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverUp, setServerUp] = useState(null); // null = checking

  // Ping the backend once on load (and again whenever the tab regains focus,
  // so the banner clears itself the moment you start the server).
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
      // trim + lowercase to match how the server normalizes emails
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(HOME[data.user.role] || '/dashboard');
    } catch (err) {
      if (!err.response) {
        // No HTTP response at all = server unreachable.
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
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center mb-1 tracking-tight">
            Camp<span className="text-blue-600">OS</span>
          </h1>
          <p className="text-center text-gray-500 text-sm mb-5">Academic Management Platform</p>

          {/* server status pill — removes all guesswork about why login fails */}
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
              <b>Backend not running.</b> Open a terminal in the project folder and run:
              <code className="block bg-red-100 rounded px-2 py-1 mt-1 font-mono">npm run dev</code>
              Then refresh this page.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} required
                onChange={(e) => setEmail(e.target.value)} placeholder="you@campos.edu" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-16" type={showPw ? 'text' : 'password'} value={password} required
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

        {/* demo account quick-fill cards */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} type="button"
              onClick={() => { setEmail(a.email); setPassword('password123'); setError(''); }}
              className="bg-white/10 backdrop-blur rounded-xl p-3 text-left hover:bg-white/20 transition-colors border border-white/10">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.color}`}>{a.role}</span>
              <div className="text-white text-xs font-medium mt-1.5 truncate">{a.name}</div>
              <div className="text-slate-400 text-[10px] truncate">{a.email}</div>
            </button>
          ))}
        </div>
        <p className="text-center text-slate-400 text-xs mt-3">
          Click a card to fill credentials · password: <span className="font-mono">password123</span>
        </p>
      </div>
    </div>
  );
}
