// Announcements.jsx — everyone sees the relevant list; admin/faculty get a post form.
import { useState } from 'react';
import api from '../api';
import { useGet, Section } from '../components/UI.jsx';

const me = () => JSON.parse(localStorage.getItem('user') || '{}');

export default function Announcements() {
  const u = me();
  const { data: list, reload } = useGet('/announcements');
  const { data: offerings } = useGet(u.role === 'student' ? '/courses' : '/offerings');
  const [form, setForm] = useState({ title: '', message: '', target_type: 'all', target_offering_id: '' });
  const [err, setErr] = useState('');

  const canPost = u.role === 'admin' || u.role === 'faculty';

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/announcements', {
        ...form,
        target_offering_id: form.target_type === 'course' ? form.target_offering_id : null,
      });
      setForm({ title: '', message: '', target_type: 'all', target_offering_id: '' });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to post');
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Announcements</h1>

      {canPost && (
        <Section title="Post an announcement">
          <form onSubmit={submit} className="space-y-3 max-w-xl">
            <input className="input" placeholder="Title" required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" placeholder="Message" required rows={3}
              value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <div className="flex gap-3 items-center">
              <select className="input w-40" value={form.target_type}
                onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
                <option value="all">Everyone</option>
                <option value="course">Specific course</option>
              </select>
              {form.target_type === 'course' && (
                <select className="input flex-1" required value={form.target_offering_id}
                  onChange={(e) => setForm({ ...form, target_offering_id: e.target.value })}>
                  <option value="">Select course offering…</option>
                  {(offerings || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.course_code} — Sec {o.section} ({o.faculty_name})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {err && <p className="text-red-600 text-sm">{err}</p>}
            <button className="btn">Post</button>
          </form>
        </Section>
      )}

      <Section title="Latest">
        {list?.length === 0 && <p className="text-gray-500 text-sm">No announcements yet.</p>}
        <ul className="space-y-3">
          {list?.map((a) => (
            <li key={a.id} className="border-b pb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">{a.title}</span>
                <span className="text-xs text-gray-400">
                  {a.course_code ? `${a.course_code} · ` : ''}{a.author_name} · {a.created_at?.slice(0, 10)}
                </span>
              </div>
              <p className="text-sm text-gray-700">{a.message}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
