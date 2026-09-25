// MyCourses.jsx — faculty sees only courses allocated to them, with enrolled counts.
import { useGet, Section } from '../../components/UI.jsx';

export default function MyCourses() {
  const { data: list, loading, error } = useGet('/offerings/mine');

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">My Courses</h1>
      <Section title="Allocated courses">
        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        <table className="table-base">
          <thead><tr><th>Course</th><th>Section</th><th>Semester</th><th>Enrolled students</th></tr></thead>
          <tbody>
            {(list || []).map((o) => (
              <tr key={o.id}>
                <td>{o.course_code} — {o.course_name}</td>
                <td>{o.section}</td>
                <td>{o.semester}</td>
                <td>{o.enrolled_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
