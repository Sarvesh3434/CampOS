// api.js — one Axios instance for the whole app.
// The JWT is stored in localStorage (per the project prompt's simple-auth plan)
// and this interceptor attaches it to every request automatically.
import axios from 'axios';

// API base defaults to "/api" for local dev (Vite proxies it to :3001).
// For static deploys (GitHub Pages) point it at your server:
//   client/.env.production -> VITE_API_URL=https://your-server.example.com/api
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

export const API_BASE = API_URL; // exported for one-off calls (login health ping)

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If a token is rejected/expired, bounce back to the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Works with both BrowserRouter (local) and HashRouter (static host).
      if (!window.location.hash.startsWith('#/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
