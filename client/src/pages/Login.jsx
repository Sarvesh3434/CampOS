// Login.jsx — email + password -> JWT in localStorage -> redirect by role.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const HOME = { admin: '/dashboard', faculty: '/dashboard', student: '/dashboard' };

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const quick = (em) => { setEmail(em); setPassword('password123'); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h1 className="text-3xl font-bold text-center mb-1 tracking-tight">
          Camp<span className="text-blue-600">OS</span>
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">Academic Management Platform</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)} placeholder="you@campos.edu" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="btn w-full" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          <p className="font-semibold mb-1">Demo accounts (password: password123)</p>
          {[
            ['Admin — Dr. Ravi Selvam', 'admin@campos.edu'],
            ['Faculty — Meera Sundaram', 'meera@campos.edu'],
            ['Student — Kayalvizhi', 's1@campos.edu'],
          ].map(([r, em]) => (
            <button key={em} type="button" onClick={() => quick(em)}
              className="block text-blue-600 hover:underline">
              {r}: {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
