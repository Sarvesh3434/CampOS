// Exams.jsx (admin) — creates exam entries. Same timetable table, type='exam'
// (day_or_date is a real date instead of a weekday).
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function ExamsAdmin() {
  const { data: list, reload } = useGet('/timetable?type=exam');
  const { data: offerings } = useGet('/offerings');
  const [form, setForm] = useState({ offering_id: '', day_or_date: '', start_time: '09:30', end_time: '11:00', room: '' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/timetable', { ...form, type: 'exam' });
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to add exam');
    }
  };

  const remove = async (id) => {
    await api.delete(`/timetable/${id}`);
    reload();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Exam Schedule</h1>

      <Section title="Add exam">
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
            <label className="label">Date</label>
            <input className="input" type="date" required value={form.day_or_date}
              onChange={(e) => setForm({ ...form, day_or_date: e.target.value })} />
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
            <input className="input w-36" value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
          <button className="btn">Add exam</button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </Section>

      <Section title="All exams (sorted by date)">
        <table className="table-base">
          <thead><tr><th>Date</th><th>Time</th><th>Course</th><th>Section</th><th>Faculty</th><th>Room</th><th></th></tr></thead>
          <tbody>
            {list?.map((t) => (
              <tr key={t.id}>
                <td>{t.day_or_date}</td>
                <td>{t.start_time}–{t.end_time}</td>
                <td>{t.course_code} — {t.course_name}</td>
                <td>{t.section}</td>
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
