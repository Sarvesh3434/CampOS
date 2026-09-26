import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path:
//   - local dev / other hosts -> '/' (Vite proxies /api to :3001)
//   - GitHub Pages (repo CampOS) -> '/CampOS/' so built asset URLs resolve
// Override with BASE_PATH=/custom/ if the repo is ever renamed.
const isPages = process.env.DEPLOY_TARGET === 'pages';
const BASE = process.env.BASE_PATH || (isPages ? '/CampOS/' : '/');

// Proxy /api to the Express server so Axios can just call "/api/...".
export default defineConfig({
  plugins: [react()],
  base: BASE,
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
