// Students.jsx — admin adds students (creates their login too) and removes them.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function Students() {
  const { data: list, reload } = useGet('/students');
  const { data: departments } = useGet('/departments');
  const [form, setForm] = useState({ name: '', email: '', password: '', roll_no: '', department_id: '', section: 'A', year: 2 });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/students', form);
      setForm({ name: '', email: '', password: '', roll_no: '', department_id: '', section: 'A', year: 2 });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to add');
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this student and their login?')) return;
    setErr('');
    try {
      await api.delete(`/students/${id}`);
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to remove student');
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Students</h1>
      <Section title="Add student">
        <form onSubmit={submit} className="grid grid-cols-4 gap-3 items-end max-w-4xl">
          <div><label className="label">Name</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Password</label>
            <input className="input" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><label className="label">Roll no</label>
            <input className="input" placeholder="CSE013" required value={form.roll_no}
              onChange={(e) => setForm({ ...form, roll_no: e.target.value })} /></div>
          <div><label className="label">Department</label>
            <select className="input" value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">—</option>
              {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select></div>
          <div><label className="label">Section</label>
            <select className="input" value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}>
              <option>A</option><option>B</option><option>C</option>
            </select></div>
          <div><label className="label">Year</label>
            <input className="input" type="number" min="1" max="5" value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <button className="btn">Add student</button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </Section>

      {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

      <Section title="All students">
        <table className="table-base">
          <thead><tr><th>Roll no</th><th>Name</th><th>Email</th><th>Department</th><th>Section</th><th>Year</th><th></th></tr></thead>
          <tbody>
            {list?.map((s) => (
              <tr key={s.id}>
                <td className="font-mono">{s.roll_no}</td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.department_name || '—'}</td>
                <td>{s.section}</td>
                <td>{s.year}</td>
                <td><button className="btn-red" onClick={() => remove(s.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
