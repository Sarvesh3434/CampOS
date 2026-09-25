// Assignments.jsx (faculty) — create assignments for your courses, then open
// one to see every student's submission (or "Not submitted") and grade it.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function AssignmentsFaculty() {
  const { data: courses } = useGet('/offerings/mine');
  const [offeringId, setOfferingId] = useState('');
  const { data: list, reload } = useGet(offeringId ? `/assignments?offering_id=${offeringId}` : null);
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [openId, setOpenId] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', { ...form, offering_id: offeringId });
      setForm({ title: '', description: '', deadline: '' });
      reload();
    } catch (e2) {
      alert(e2.response?.data?.error || 'Failed to create');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/assignments/${id}`).catch(() => {});
    reload();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Assignments</h1>

      <Section title="Choose course">
        <select className="input w-72" value={offeringId} onChange={(e) => { setOfferingId(e.target.value); setOpenId(null); }}>
          <option value="">Select…</option>
          {(courses || []).map((o) => (
            <option key={o.id} value={o.id}>{o.course_code} — {o.course_name} (Sec {o.section})</option>
          ))}
        </select>
      </Section>

      {offeringId && (
        <>
          <Section title="Create assignment">
            <form onSubmit={create} className="space-y-3 max-w-xl">
              <input className="input" placeholder="Title" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Description / instructions"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-3 items-end">
                <div>
                  <label className="label">Deadline</label>
                  <input className="input" type="datetime-local" required value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <button className="btn">Create</button>
              </div>
            </form>
          </Section>

          <Section title="Assignments">
            {list?.length === 0 && <p className="text-gray-500 text-sm">None yet.</p>}
            <ul className="space-y-3">
              {list?.map((a) => (
                <li key={a.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-sm text-gray-600">{a.description}</div>
                      <div className="text-xs text-gray-400 mt-1">Due: {a.deadline?.replace('T', ' ')}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-sm" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                        {openId === a.id ? 'Hide submissions' : 'Submissions'}
                      </button>
                      <button className="btn-red" onClick={() => remove(a.id)}>Delete</button>
                    </div>
                  </div>
                  {openId === a.id && <Submissions assignmentId={a.id} />}
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </>
  );
}

// Loads one assignment's submissions; faculty can grade inline.
function Submissions({ assignmentId }) {
  const { data: subs, reload } = useGet(`/assignments/${assignmentId}/submissions`);

  const grade = async (studentId, mark) => {
    await api.post(`/assignments/${assignmentId}/mark`, { student_id: studentId, mark });
    reload();
  };

  return (
    <table className="table-base mt-3">
      <thead><tr><th>Roll no</th><th>Name</th><th>Submission</th><th>Submitted</th><th>Mark /10</th></tr></thead>
      <tbody>
        {(subs || []).map((s) => (
          <tr key={s.student_id}>
            <td className="font-mono">{s.roll_no}</td>
            <td>{s.name}</td>
            <td className="max-w-xs truncate">
              {s.submission_text
                ? <a href={s.submission_text} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{s.submission_text}</a>
                : <span className="text-gray-400">Not submitted</span>}
            </td>
            <td className="text-xs text-gray-500">{s.submitted_at?.slice(0, 10) || '—'}</td>
            <td>
              <input
                type="number" min="0" max="10" defaultValue={s.mark ?? ''}
                className="input w-16" onBlur={(e) => grade(s.student_id, e.target.value)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
