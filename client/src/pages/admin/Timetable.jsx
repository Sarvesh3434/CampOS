// Timetable.jsx (admin) — creates weekly class slots and previews them in a
// color-coded grid (same view faculty/students see). Exams are on a separate
// page but in the SAME table (type column does the splitting).
import { useState } from 'react';
import api from '../../api';
import TimetableGrid from '../../components/TimetableGrid.jsx';
import { useGet, Section } from '../../components/UI.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableAdmin() {
  const [section, setSection] = useState('A');
  const { data: list, reload } = useGet(`/timetable?section=${section}&type=class`);
  const { data: offerings } = useGet('/offerings');
  const [form, setForm] = useState({ offering_id: '', day_or_date: 'Monday', start_time: '09:00', end_time: '10:00', room: '' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/timetable', { ...form, type: 'class' });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to add slot');
    }
  };

  const remove = async (id) => {
    await api.delete(`/timetable/${id}`);
    reload();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Weekly Timetable (Section {section})</h1>

      <Section title="Add class slot">
        <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Course offering</label>
            <select className="input w-72" required value={form.offering_id}
              onChange={(e) => setForm({ ...form, offering_id: e.target.value })}>
              <option value="">Select…</option>
              {(offerings || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.course_code} — Sec {o.section} — {o.faculty_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Day</label>
            <select className="input" value={form.day_or_date}
              onChange={(e) => setForm({ ...form, day_or_date: e.target.value })}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start</label>
            <input className="input" type="time" required value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div>
            <label className="label">End</label>
            <input className="input" type="time" required value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <div>
            <label className="label">Room</label>
            <input className="input w-28" value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
          <button className="btn">Add slot</button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </Section>

      <Section
        title="Weekly grid preview"
        right={
          <select className="input w-28" value={section} onChange={(e) => setSection(e.target.value)}>
            <option>A</option><option>B</option><option>C</option>
          </select>
        }
      >
        <TimetableGrid slots={list || []} />
      </Section>

      <Section title="All slots (list view)">
        <table className="table-base">
          <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Faculty</th><th>Room</th><th></th></tr></thead>
          <tbody>
            {list?.map((t) => (
              <tr key={t.id}>
                <td>{t.day_or_date}</td>
                <td>{t.start_time}–{t.end_time}</td>
                <td>{t.course_code} — {t.course_name}</td>
                <td>{t.faculty_name}</td>
                <td>{t.room}</td>
                <td><button className="btn-red" onClick={() => remove(t.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
