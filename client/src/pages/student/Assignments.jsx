// Assignments.jsx (student) — see assignments for my courses, submit a link or
// text (no file uploads by design), re-submit to update, see my mark.
import { useState } from 'react';
import api from '../../api';
import { useGet, Section } from '../../components/UI.jsx';

export default function AssignmentsStudent() {
  const { data: list, reload } = useGet('/assignments/mine');
  const [openId, setOpenId] = useState(null);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Assignments</h1>
      <Section title="All assignments">
        {list?.length === 0 && <p className="text-gray-500 text-sm">Nothing assigned yet.</p>}
        <ul className="space-y-3">
          {list?.map((a) => (
            <li key={a.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.course_code} · due {a.deadline?.replace('T', ' ')}</div>
                  <div className="text-sm text-gray-600 mt-1">{a.description}</div>
                  {a.submission_text && (
                    <div className="text-xs mt-2">
                      ✅ Submitted {a.submitted_at?.slice(0, 10)} —{' '}
                      {a.mark != null ? <b className="text-green-700">Mark: {a.mark}/10</b> : 'awaiting grade'}
                    </div>
                  )}
                </div>
                <button className="btn-sm" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                  {a.submission_text ? 'Re-submit' : 'Submit'}
                </button>
              </div>
              {openId === a.id && (
                <SubmitBox
                  assignmentId={a.id}
                  initial={a.submission_text || ''}
                  onDone={() => { setOpenId(null); reload(); }}
                />
              )}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function SubmitBox({ assignmentId, initial, onDone }) {
  const [text, setText] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api.post(`/assignments/${assignmentId}/submit`, { submission_text: text });
      onDone();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <textarea className="input" rows={2} required placeholder="Paste a link (drive/imgur) or write your answer…"
        value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex items-center gap-3">
        <button className="btn-sm" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
        {err && <span className="text-red-600 text-sm">{err}</span>}
      </div>
    </form>
  );
}
