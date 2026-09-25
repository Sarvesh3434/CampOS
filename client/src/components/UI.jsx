// UI.jsx — tiny shared pieces used by most pages: a data-fetch hook,
// a stat card, and a section wrapper. Kept in one file on purpose.
import { useEffect, useState } from 'react';
import api from '../api';

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

export function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="stat-number">{value}</div>
    </div>
  );
}

export function Section({ title, children, right }) {
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}
