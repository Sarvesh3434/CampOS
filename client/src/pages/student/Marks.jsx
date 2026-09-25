// Marks.jsx (student) — my CAT1/CAT2/Assignment/FAT marks per course.
import { useGet, Section } from '../../components/UI.jsx';

export default function MarksStudent() {
  const { data: rows, loading, error } = useGet('/marks/me');

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">My Marks</h1>
      <Section title="Marks by course">
        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        <table className="table-base">
          <thead><tr><th>Course</th><th>CAT1 /50</th><th>CAT2 /50</th><th>Assignment /10</th><th>FAT /100</th></tr></thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.course_code}>
                <td>{r.course_code} — {r.course_name}</td>
                <td>{r.cat1 ?? '—'}</td>
                <td>{r.cat2 ?? '—'}</td>
                <td>{r.assignment ?? '—'}</td>
                <td>{r.fat ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
