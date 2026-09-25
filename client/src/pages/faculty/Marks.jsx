// Marks.jsx (faculty) — pick a course, edit the whole class sheet (CAT1, CAT2,
// Assignment, FAT), save all at once. Blank = not yet entered (stored NULL).
import { useEffect, useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function MarksFaculty() {
  const { data: courses } = useGet('/offerings/mine');
  const [offeringId, setOfferingId] = useState('');
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!offeringId) return;
    api.get('/marks', { params: { offering_id: offeringId } })
      .then((res) => setRows(res.data.map((r) => ({
        ...r, cat1: r.cat1 ?? '', cat2: r.cat2 ?? '', assignment: r.assignment ?? '', fat: r.fat ?? '',
      }))))
      .catch((e) => setMsg(e.response?.data?.error || e.message));
  }, [offeringId]);

  const edit = (id, field, value) =>
    setRows(rows.map((r) => (r.student_id === id ? { ...r, [field]: value } : r)));

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await api.post('/marks', { offering_id: offeringId, records: rows });
      setMsg('Saved ✓ Students can see their marks now.');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const input = (r, field, max) => (
    <input
      type="number" min="0" max={max} className="input w-20"
      value={r[field]}
      onChange={(e) => edit(r.student_id, field, e.target.value)}
    />
  );

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Enter Marks</h1>

      <Section title="Choose course">
        <select className="input w-72" value={offeringId} onChange={(e) => setOfferingId(e.target.value)}>
          <option value="">Select…</option>
          {(courses || []).map((o) => (
            <option key={o.id} value={o.id}>{o.course_code} — {o.course_name} (Sec {o.section})</option>
          ))}
        </select>
      </Section>

      {offeringId && (
        <Section title="Class mark sheet">
          <table className="table-base">
            <thead>
              <tr>
                <th>Roll no</th><th>Name</th>
                <th>CAT1 /50</th><th>CAT2 /50</th><th>Assignment /10</th><th>FAT /100</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student_id}>
                  <td className="font-mono">{r.roll_no}</td>
                  <td>{r.name}</td>
                  <td>{input(r, 'cat1', 50)}</td>
                  <td>{input(r, 'cat2', 50)}</td>
                  <td>{input(r, 'assignment', 10)}</td>
                  <td>{input(r, 'fat', 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center gap-3">
            <button className="btn" onClick={save} disabled={busy || rows.length === 0}>
              {busy ? 'Saving…' : 'Save marks'}
            </button>
            {msg && <span className="text-sm text-green-700">{msg}</span>}
          </div>
        </Section>
      )}
    </>
  );
}
