// Timetable.jsx (student) — my section's weekly class schedule.
import { useGet, Section } from '../../components/UI.jsx';

export default function TimetableStudent() {
  const { data: rows } = useGet('/timetable/student/mine?type=class');

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">My Timetable</h1>
      <Section title="Weekly classes (my section)">
        <table className="table-base">
          <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Faculty</th><th>Room</th></tr></thead>
          <tbody>
            {(rows || []).map((t) => (
              <tr key={t.id}>
                <td>{t.day_or_date}</td>
                <td>{t.start_time}–{t.end_time}</td>
                <td>{t.course_code} — {t.course_name}</td>
                <td>{t.faculty_name}</td>
                <td>{t.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
