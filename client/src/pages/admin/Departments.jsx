// Departments.jsx — add + list. The pattern all admin CRUD pages follow.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function Departments() {
  const { data: list, reload } = useGet('/departments');
  const [form, setForm] = useState({ name: '', code: '' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/departments', form);
      setForm({ name: '', code: '' });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to add');
    }
  };

  const remove = async (d) => {
    if (!confirm(`Delete department ${d.code}?`)) return;
    try {
      await api.delete(`/departments/${d.id}`);
      reload();
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed'); // e.g. still has courses
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Departments</h1>
      <Section title="Add department">
        <form onSubmit={submit} className="flex gap-3 max-w-xl">
          <input className="input" placeholder="Name (e.g. Computer Science)" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input w-36" placeholder="Code (e.g. CSE)" required
            value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <button className="btn">Add</button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </Section>

      <Section title="All departments">
        <table className="table-base">
          <thead><tr><th>Code</th><th>Name</th><th>Courses</th><th>Faculty</th><th>Students</th><th></th></tr></thead>
          <tbody>
            {list?.map((d) => (
              <tr key={d.id}>
                <td className="font-mono">{d.code}</td>
                <td>{d.name}</td>
                <td>{d.course_count}</td>
                <td>{d.faculty_count}</td>
                <td>{d.student_count}</td>
                <td><button className="btn-red" onClick={() => remove(d)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
