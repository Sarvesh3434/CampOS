// Offerings.jsx — Course Allocation: admin links Faculty -> Course -> Section.
// This is the link that makes attendance/marks/assignments/timetable all work.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function Offerings() {
  const { data: list, reload } = useGet('/offerings');
  const { data: courses } = useGet('/courses');
  const { data: faculty } = useGet('/faculty');
  const [form, setForm] = useState({ course_id: '', faculty_id: '', section: 'A', semester: 'Odd 2026' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/offerings', form);
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to allocate');
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this allocation? Related attendance/marks will also be removed.')) return;
    await api.delete(`/offerings/${id}`);
    reload();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Course Allocation</h1>
      <Section title="Allocate faculty to course + section">
        <form onSubmit={submit} className="flex flex-wrap gap-3 items-end max-w-4xl">
          <div>
            <label className="label">Course</label>
            <select className="input w-64" required value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
              <option value="">Select…</option>
              {(courses || []).map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Faculty</label>
            <select className="input w-56" required value={form.faculty_id}
              onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}>
              <option value="">Select…</option>
              {(faculty || []).map((f) => (
                <option key={f.id} value={f.id}>{f.faculty_code} — {f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input w-24" value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}>
              <option>A</option><option>B</option><option>C</option>
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <input className="input w-36" value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })} />
          </div>
          <button className="btn">Allocate</button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </Section>

      <Section title="Current allocations">
        <table className="table-base">
          <thead>
            <tr><th>Course</th><th>Faculty</th><th>Section</th><th>Semester</th><th>Enrolled</th><th></th></tr>
          </thead>
          <tbody>
            {list?.map((o) => (
              <tr key={o.id}>
                <td>{o.course_code} — {o.course_name}</td>
                <td>{o.faculty_name}</td>
                <td>{o.section}</td>
                <td>{o.semester}</td>
                <td>{o.enrolled_count}</td>
                <td><button className="btn-red" onClick={() => remove(o.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
