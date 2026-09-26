// UI.jsx — tiny shared pieces used by most pages: a data-fetch hook,
// a stat card, and a section wrapper. Kept in one file on purpose.
import { useEffect, useState } from 'react';
import api from '../api';
import Icon from './Icons.jsx';

// useGet(url) -> { data, loading, error, reload }
// The simplest possible fetching pattern: useEffect + useState, nothing else.
// Pass url = null to skip fetching (e.g. until a dropdown value is chosen).
export function useGet(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState('');

  const load = () => {
    if (!url) { setLoading(false); return; }
    setLoading(true);
    api.get(url)
      .then((res) => { setData(res.data); setError(''); })
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [url]);
  return { data, loading, error, reload: load };
}

const ACCENTS = {
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-100' },
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  purple: { bg: 'bg-violet-50',  text: 'text-violet-600',  ring: 'ring-violet-100' },
  orange: { bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'ring-amber-100' },
  red:    { bg: 'bg-red-50',     text: 'text-red-600',     ring: 'ring-red-100' },
  teal:   { bg: 'bg-teal-50',    text: 'text-teal-600',    ring: 'ring-teal-100' },
};

// StatCard({ label, value, accent, icon }) — colored icon chip + big number.
export function StatCard({ label, value, accent = 'blue', icon }) {
  const a = ACCENTS[accent] || ACCENTS.blue;
  return (
    <div className="card flex items-center gap-4 group">
      {icon && (
        <div className={`shrink-0 w-11 h-11 rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring}
          flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
          <Icon name={icon} className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
        <div className={`stat-number ${a.text}`}>{value}</div>
      </div>
    </div>
  );
}

// Section({ title, subtitle, right, children }) — card wrapper with a heading.
// `right` is an actions slot (buttons) aligned with the title.
export function Section({ title, subtitle, children, right }) {
  return (
    <div className="card mb-6 animate-fade-up">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// PageHeader({ title, subtitle, icon }) — consistent h1 + intro line on every page.
export function PageHeader({ title, subtitle, icon }) {
  return (
    <div className="flex items-center gap-3 mb-6 animate-fade-up">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white
          flex items-center justify-center shadow-glow shrink-0">
          <Icon name={icon} className="w-5 h-5" />
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-slate-800 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
