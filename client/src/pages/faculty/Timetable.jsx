// Timetable.jsx (faculty) — my teaching week as a color-coded grid + exam duties.
import TimetableGrid from '../../components/TimetableGrid.jsx';
import { useGet, Section } from '../../components/UI.jsx';

export default function TimetableFaculty() {
  const { data: classes } = useGet('/timetable/faculty/mine?type=class');
  const { data: exams } = useGet('/timetable/faculty/mine?type=exam');

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">My Timetable</h1>

      <Section title="Weekly teaching schedule">
        <TimetableGrid slots={classes || []} />
      </Section>

      <Section title="Exam duties">
        {exams?.length === 0 && <p className="text-gray-500 text-sm">No exam duties assigned.</p>}
        {exams?.length > 0 && (
          <table className="table-base">
            <thead><tr><th>Date</th><th>Time</th><th>Course</th><th>Section</th><th>Room</th></tr></thead>
            <tbody>
              {exams.map((t) => (
                <tr key={t.id}>
                  <td>{t.day_or_date}</td>
                  <td>{t.start_time}–{t.end_time}</td>
                  <td>{t.course_code} — {t.course_name}</td>
                  <td>{t.section}</td>
                  <td>{t.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </>
  );
}
