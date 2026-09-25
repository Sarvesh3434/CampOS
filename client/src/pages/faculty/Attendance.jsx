// Attendance.jsx (faculty) — the flagship demo screen.
// 1) pick one of your courses  2) pick a date (default: today)
// 3) roster loads with any previously-saved statuses  4) toggle P/A, Save.
// Saving also auto-completes pending academic tasks — watch the admin dashboard!
import { useEffect, useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendanceFaculty() {
  const { data: courses } = useGet('/offerings/mine');
  const [offeringId, setOfferingId] = useState('');
  const [date, setDate] = useState(today());
  const [roster, setRoster] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Load roster whenever course/date changes; default everyone to 'present'
  // unless the server says they were already marked.
  useEffect(() => {
    if (!offeringId || !date) return;
    api.get('/attendance/roster', { params: { offering_id: offeringId, date } })
      .then((res) =>
        setRoster(res.data.map((r) => ({
          ...r,
          status: r.marked_status || 'present',
        })))
      )
      .catch((e) => setMsg(e.response?.data?.error || e.message));
  }, [offeringId, date]);

  const toggle = (id) =>
    setRoster(roster.map((r) =>
      r.student_id === id ? { ...r, status: r.status === 'present' ? 'absent' : 'present' } : r
    ));

  const setAll = (status) => setRoster(roster.map((r) => ({ ...r, status })));

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const records = roster.map((r) => ({ student_id: r.student_id, status: r.status }));
      await api.post('/attendance/mark', { offering_id: offeringId, date, records });
      setMsg('Saved ✓ Attendance is visible to students right now.');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'present').length;

  // Previously marked days for the chosen course — confirms a day is done
  // before re-marking it.
  const { data: history } = useGet(offeringId ? `/attendance/history?offering_id=${offeringId}` : null);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Mark Attendance</h1>

      <Section title="1. Choose course and date">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Course</label>
            <select className="input w-72" value={offeringId} onChange={(e) => setOfferingId(e.target.value)}>
              <option value="">Select…</option>
              {(courses || []).map((o) => (
                <option key={o.id} value={o.id}>{o.course_code} — {o.course_name} (Sec {o.section})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </Section>

      {offeringId && (
        <Section
          title={`2. Mark students — ${presentCount}/${roster.length} present`}
          right={
            <div className="flex gap-2">
              <button type="button" className="btn-sm" onClick={() => setAll('present')}>All present</button>
              <button type="button" className="btn-sm" onClick={() => setAll('absent')}>All absent</button>
            </div>
          }
        >
          <table className="table-base">
            <thead><tr><th>Roll no</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              {roster.map((r) => (
                <tr key={r.student_id}>
                  <td className="font-mono">{r.roll_no}</td>
                  <td>{r.name}</td>
                  <td>
                    <button
                      onClick={() => toggle(r.student_id)}
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        r.status === 'present'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.status === 'present' ? 'Present' : 'Absent'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center gap-3">
            <button className="btn" onClick={save} disabled={busy || roster.length === 0}>
              {busy ? 'Saving…' : 'Save attendance'}
            </button>
            {msg && <span className="text-sm text-green-700">{msg}</span>}
          </div>
        </Section>
      )}

      {offeringId && (
        <Section title="Recently marked days">
          {history?.length === 0 && <p className="text-gray-500 text-sm">Nothing marked yet for this course.</p>}
          {history?.length > 0 && (
            <table className="table-base">
              <thead><tr><th>Date</th><th>Present</th><th>Total</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.date}>
                    <td>{h.date}</td>
                    <td>{h.present}</td>
                    <td>{h.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}
    </>
  );
}
