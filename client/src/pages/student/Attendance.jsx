// Attendance.jsx (student) — my attendance % per course. This updates the
// moment faculty saves attendance (refresh and show the judge!).
import { useGet, Section } from '../../components/UI.jsx';

export default function AttendanceStudent() {
  const { data: rows, loading, error } = useGet('/attendance/me');

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">My Attendance</h1>
      <Section title="Course-wise attendance">
        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        <table className="table-base">
          <thead><tr><th>Course</th><th>Present</th><th>Total classes</th><th>Attendance %</th></tr></thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.course_code}>
                <td>{r.course_code} — {r.course_name}</td>
                <td>{r.present ?? 0}</td>
                <td>{r.total_classes}</td>
                <td>
                  <span className={`font-semibold ${(r.percentage ?? 0) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {r.percentage ?? 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
