// Constraints.jsx (admin) — the most original CampOS feature.
// Create a task -> every faculty gets a 'pending' status row -> it flips to
// 'completed' automatically when they mark attendance -> admin sees X/Y.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function Constraints() {
  const { data: list, reload } = useGet('/constraints');
  const [form, setForm] = useState({ title: '', description: '', due_time: '18:00' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/constraints', form);
      setForm({ title: '', description: '', due_time: '18:00' });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to create task');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this task and all its statuses?')) return;
    await api.delete(`/constraints/${id}`);
    reload();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Academic Tasks</h1>

      <Section title="Create task for all faculty">
        <form onSubmit={submit} className="space-y-3 max-w-xl">
          <input className="input" placeholder="e.g. Mark today's attendance by 6 PM" required
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="input" rows={2} placeholder="Description (optional)"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 items-end">
            <div>
              <label className="label">Due time</label>
              <input className="input" type="time" required value={form.due_time}
                onChange={(e) => setForm({ ...form, due_time: e.target.value })} />
            </div>
            <button className="btn">Create task</button>
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </form>
      </Section>

      <Section title="Tasks & compliance">
        {list?.length === 0 && <p className="text-gray-500 text-sm">No tasks yet.</p>}
        <table className="table-base">
          <thead><tr><th>Task</th><th>Due</th><th>Compliance</th><th>Progress</th><th></th></tr></thead>
          <tbody>
            {list?.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="font-medium">{c.title}</div>
                  {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
                </td>
                <td>{c.due_time}</td>
                <td className="font-semibold">
                  {c.completed_count || 0}/{c.total_assigned} completed
                </td>
                <td>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500"
                      style={{ width: `${c.total_assigned ? 100 * (c.completed_count || 0) / c.total_assigned : 0}%` }} />
                  </div>
                </td>
                <td><button className="btn-red" onClick={() => remove(c.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
