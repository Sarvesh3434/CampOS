// Courses.jsx — admin adds courses to a department.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function Courses() {
  const { data: list, reload } = useGet('/courses');
  const { data: departments } = useGet('/departments');
  const [form, setForm] = useState({ code: '', name: '', department_id: '', credits: 3 });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/courses', form);
      setForm({ code: '', name: '', department_id: '', credits: 3 });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to add');
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete course ${c.code}?`)) return;
    try {
      await api.delete(`/courses/${c.id}`);
      reload();
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed'); // e.g. still allocated
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Courses</h1>
      <Section title="Add course">
        <form onSubmit={submit} className="grid grid-cols-5 gap-3 items-end max-w-4xl">
          <div>
            <label className="label">Code</label>
            <input className="input" placeholder="CS210" required
              value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Name</label>
            <input className="input" placeholder="Data Structures" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">—</option>
              {(departments || []).map((d) => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Credits</label>
            <input className="input" type="number" min="1" max="6"
              value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
          </div>
          <button className="btn col-span-5">Add course</button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </Section>

      <Section title="All courses">
        <table className="table-base">
          <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Credits</th><th>Allocations</th><th></th></tr></thead>
          <tbody>
            {list?.map((c) => (
              <tr key={c.id}>
                <td className="font-mono">{c.code}</td>
                <td>{c.name}</td>
                <td>{c.department_name || '—'}</td>
                <td>{c.credits}</td>
                <td>{c.offering_count}</td>
                <td><button className="btn-red" onClick={() => remove(c)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
