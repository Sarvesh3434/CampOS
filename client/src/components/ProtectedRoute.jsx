// ProtectedRoute — the auth guard for every page.
//
// Two checks:
//   1) Fast local check: is there a token + user in localStorage? (instant)
//   2) Server check: GET /api/auth/me confirms the token is valid AND the
//      account still exists. This catches stale sessions (admin removed the
//      user, token expired, etc.) instead of trusting localStorage blindly.
//
// Works both wrapped around children and as a layout route (Outlet).
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../api';

export default function ProtectedRoute({ role, children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const checking = useState(() => !!token)[0]; // remember if we had a token at mount
  const [valid, setValid] = useState(null);    // null = still verifying
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    api.get('/auth/me')
      .then((res) => {
        if (!alive) return;
        // Keep localStorage in sync with the server's fresh copy (role/name
        // could have changed server-side since login).
        localStorage.setItem('user', JSON.stringify(res.data));
        setLocalUser(res.data);
        setValid(true);
      })
      .catch(() => alive && setValid(false));
    return () => { alive = false; };
  }, [token]);

  // No token at all -> straight to login.
  if (!token) return <Navigate to="/login" replace />;

  // While verifying, show a blank screen instead of flashing the page.
  if (checking && valid === null) return <div className="p-6 text-gray-500">Checking session…</div>;

  if (valid === false) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // Role check happens against the server-verified user.
  if (role && localUser && localUser.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}
