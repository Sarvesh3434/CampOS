// Exams.jsx (student) — upcoming exams for my enrolled courses, sorted by date.
import { useGet, Section } from '../../components/UI.jsx';

export default function ExamsStudent() {
  const { data: rows } = useGet('/timetable/student/mine?type=exam');

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Exam Schedule</h1>
      <Section title="Upcoming exams">
        {rows?.length === 0 && <p className="text-gray-500 text-sm">No exams scheduled.</p>}
        <table className="table-base">
          <thead><tr><th>Date</th><th>Time</th><th>Course</th><th>Room</th></tr></thead>
          <tbody>
            {(rows || []).map((t) => (
              <tr key={t.id}>
                <td>{t.day_or_date}</td>
                <td>{t.start_time}–{t.end_time}</td>
                <td>{t.course_code} — {t.course_name}</td>
                <td>{t.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
