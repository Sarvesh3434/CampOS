// Faculty.jsx — admin adds faculty (creates their login too) and removes them.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function Faculty() {
  const { data: list, reload } = useGet('/faculty');
  const { data: departments } = useGet('/departments');
  const [form, setForm] = useState({ name: '', email: '', password: '', faculty_code: '', department_id: '', designation: '' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/faculty', form);
      setForm({ name: '', email: '', password: '', faculty_code: '', department_id: '', designation: '' });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to add');
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this faculty member and their login?')) return;
    await api.delete(`/faculty/${id}`);
    reload();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Faculty</h1>
      <Section title="Add faculty">
        <form onSubmit={submit} className="grid grid-cols-3 gap-3 items-end max-w-3xl">
          <div><label className="label">Name</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Password</label>
            <input className="input" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><label className="label">Faculty code</label>
            <input className="input" placeholder="FAC003" required value={form.faculty_code}
              onChange={(e) => setForm({ ...form, faculty_code: e.target.value })} /></div>
          <div><label className="label">Department</label>
            <select className="input" value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">—</option>
              {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select></div>
          <div><label className="label">Designation</label>
            <input className="input" value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
          <button className="btn col-span-3">Add faculty</button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </Section>

      <Section title="All faculty">
        <table className="table-base">
          <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th></th></tr></thead>
          <tbody>
            {list?.map((f) => (
              <tr key={f.id}>
                <td className="font-mono">{f.faculty_code}</td>
                <td>{f.name}</td>
                <td>{f.email}</td>
                <td>{f.department_name || '—'}</td>
                <td>{f.designation}</td>
                <td><button className="btn-red" onClick={() => remove(f.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
