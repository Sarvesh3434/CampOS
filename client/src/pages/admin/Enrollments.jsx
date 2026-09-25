// Enrollments.jsx (admin) — put students into a course offering.
// After this, faculty see the students in attendance/marks/assignment rosters.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function Enrollments() {
  const { data: offerings } = useGet('/offerings');
  const { data: students } = useGet('/students');
  const [offeringId, setOfferingId] = useState('');
  const { data: enrolled, reload } = useGet(offeringId ? `/enrollments?offering_id=${offeringId}` : null);
  const [studentId, setStudentId] = useState('');
  const [err, setErr] = useState('');

  const enrolledIds = new Set((enrolled || []).map((e) => e.student_id));
  const available = (students || []).filter((s) => !enrolledIds.has(s.id));

  // ⭐ Department scoping: the selected offering's department decides which
  // students can be enrolled. CSE course -> only CSE students are listed.
  const selectedOffering = (offerings || []).find((o) => String(o.id) === String(offeringId));
  const scoped = selectedOffering
    ? available.filter((s) => !selectedOffering.course_code ||
        s.roll_no.startsWith(selectedOffering.course_code.replace(/\d+$/, '')))
    : available;

  const enroll = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/enrollments', { offering_id: offeringId, student_id: studentId });
      setStudentId('');
      reload();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to enroll');
    }
  };

  const remove = async (id) => {
    await api.delete(`/enrollments/${id}`);
    reload();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Enrollments</h1>

      <Section title="1. Choose a course offering">
        <select className="input w-96" value={offeringId} onChange={(e) => setOfferingId(e.target.value)}>
          <option value="">Select…</option>
          {(offerings || []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.course_code} — {o.course_name} · Sec {o.section} · {o.faculty_name}
            </option>
          ))}
        </select>
      </Section>

      {offeringId && (
        <>
          <Section title="2. Enroll a student">
            <form onSubmit={enroll} className="flex gap-3 items-end max-w-xl">
              <div className="flex-1">
                <label className="label">
                  Student (same department only — {selectedOffering ? selectedOffering.course_code.replace(/\d+$/, '') : '—'} students)
                </label>
                <select className="input" required value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}>
                  <option value="">Select…</option>
                  {scoped.map((s) => (
                    <option key={s.id} value={s.id}>{s.roll_no} — {s.name}</option>
                  ))}
                </select>
                {selectedOffering && scoped.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No unenrolled {selectedOffering.course_code.replace(/\d+$/, '')} students left.
                  </p>
                )}
              </div>
              <button className="btn">Enroll</button>
            </form>
            {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
          </Section>

          <Section title="3. Enrolled students">
            <table className="table-base">
              <thead><tr><th>Roll no</th><th>Name</th><th>Section</th><th></th></tr></thead>
              <tbody>
                {(enrolled || []).map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono">{e.roll_no}</td>
                    <td>{e.name}</td>
                    <td>{e.section}</td>
                    <td><button className="btn-red" onClick={() => remove(e.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}
    </>
  );
}
