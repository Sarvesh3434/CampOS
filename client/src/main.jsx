import React from 'react';
import ReactDOM from 'react-dom/client';
// HashRouter instead of BrowserRouter so the app also works on static hosts
// like GitHub Pages (no server rewrites needed; deep links always resolve).
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
