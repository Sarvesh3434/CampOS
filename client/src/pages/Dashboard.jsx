// Dashboard.jsx — one page, three variants. It calls the matching /api/dashboard
// endpoint and renders stat cards + simple lists (no charts, per the prompt).
import api from '../api';
import { useGet, StatCard, Section } from '../components/UI.jsx';

const role = () => JSON.parse(localStorage.getItem('user') || '{}').role;

function TasksPending({ tasks }) {
  if (!tasks?.length) return null;
  return (
    <Section title="Pending Academic Tasks">
      <ul className="space-y-2">
        {tasks.map((t, i) => (
          <li key={i} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <span className="text-sm">{t.title} <span className="text-gray-500">(due {t.due_time})</span></span>
            <span className="text-xs font-semibold text-yellow-700 uppercase">{t.status}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SlotsList({ title, rows, dateKey }) {
  return (
    <Section title={title}>
      {rows?.length === 0 && <p className="text-gray-500 text-sm">Nothing scheduled.</p>}
      {rows?.length > 0 && (
        <table className="table-base">
          <thead>
            <tr>
              {dateKey && <th>{dateKey}</th>}
              <th>Course</th><th>Time</th><th>Room</th><th>Section</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {dateKey && <td>{r.day_or_date}</td>}
                <td>{r.course_code} — {r.course_name}</td>
                <td>{r.start_time}–{r.end_time}</td>
                <td>{r.room}</td>
                <td>{r.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function AdminDash({ data }) {
  const s = data.stats;
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Students" value={s.students} />
        <StatCard label="Total Faculty" value={s.faculty} />
        <StatCard label="Total Courses" value={s.courses} />
        <StatCard label="Departments" value={s.departments} />
        <StatCard label="Course Allocations" value={s.offerings} />
        <StatCard label="Pending Tasks" value={s.pending_tasks} />
      </div>
      <SlotsList title="Today's Classes" rows={data.todays_classes} />
      <SlotsList title="Upcoming Exams" rows={data.upcoming_exams} dateKey="Date" />
    </>
  );
}

function FacultyDash({ data }) {
  const s = data.stats;
  return (
    <>
      <TasksPending tasks={data.pending_tasks} />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="My Courses" value={s.my_courses} />
        <StatCard label="My Students" value={s.students} />
        <StatCard label="Assignments" value={s.assignments} />
        <StatCard label="Ungraded Submissions" value={s.pending_submissions} />
      </div>
      <SlotsList title="Today's Classes" rows={data.todays_classes} />
      <SlotsList title="Upcoming Exams (my courses)" rows={data.upcoming_exams} dateKey="Date" />
    </>
  );
}

function StudentDash({ data }) {
  const s = data.stats;
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Enrolled Courses" value={s.courses} />
        <StatCard label="Overall Attendance" value={`${s.attendance_overall}%`} />
        <StatCard label="Assignments Submitted" value={s.assignments_submitted} />
        <StatCard label="Upcoming Exams" value={s.upcoming_exams} />
      </div>
      <SlotsList title="Today's Classes" rows={data.todays_classes} />
      <SlotsList title="Upcoming Exams" rows={data.upcoming_exams} dateKey="Date" />
      {data.announcements?.length > 0 && (
        <Section title="Announcements">
          <ul className="space-y-2">
            {data.announcements.map((a, i) => (
              <li key={i} className="border-b pb-2">
                <div className="font-medium text-sm">{a.title}</div>
                <div className="text-sm text-gray-600">{a.message}</div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

export default function Dashboard() {
  const r = role();
  const { data, loading, error } = useGet(`/dashboard/${r}`);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      <h1 className="text-2xl font-bold mb-4 capitalize">{r} Dashboard</h1>
      {r === 'admin' && <AdminDash data={data} />}
      {r === 'faculty' && <FacultyDash data={data} />}
      {r === 'student' && <StudentDash data={data} />}
    </>
  );
}
