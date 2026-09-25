// Timetable.jsx (student) — my section's week as a color-coded grid.
import TimetableGrid from '../../components/TimetableGrid.jsx';
import { useGet, Section } from '../../components/UI.jsx';

export default function TimetableStudent() {
  const { data: rows } = useGet('/timetable/student/mine?type=class');

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">My Timetable</h1>
      <Section title="Weekly classes (my section)">
        <TimetableGrid slots={rows || []} />
      </Section>
    </>
  );
}
