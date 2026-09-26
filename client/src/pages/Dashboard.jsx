// Dashboard.jsx — one page, three variants. It calls the matching /api/dashboard
// endpoint and renders stat cards + simple lists (no charts, per the prompt).
import { useGet, StatCard, Section } from '../components/UI.jsx';
import Icon from '../components/Icons.jsx';

const role = () => JSON.parse(localStorage.getItem('user') || '{}').role;
const name = () => JSON.parse(localStorage.getItem('user') || '{}').name || '';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const ROLE_TAG = {
  admin: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
  faculty: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  student: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
};

function TasksPending({ tasks }) {
  if (!tasks?.length) return null;
  return (
    <Section title="Pending Academic Tasks" subtitle="Assigned to you — action required">
      <ul className="space-y-2.5">
        {tasks.map((t, i) => (
          <li key={i} className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200
            rounded-xl px-4 py-3 hover:border-amber-300 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Icon name="tasks" className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700 truncate">
                {t.title} <span className="text-slate-400 font-normal">· due {t.due_time}</span>
              </span>
            </div>
            <span className="badge bg-amber-100 text-amber-700 uppercase shrink-0">{t.status}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// little colored chip with the course code
function CourseChip({ code }) {
  return (
    <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-100 font-mono shrink-0">
      {code}
    </span>
  );
}

function SlotsList({ title, subtitle, rows, dateKey }) {
  return (
    <Section title={title} subtitle={subtitle}>
      {rows?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="timetable" className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-slate-400 text-sm mt-2">Nothing scheduled.</p>
        </div>
      )}
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
                {dateKey && <td className="text-slate-500 whitespace-nowrap">{r.day_or_date}</td>}
                <td>
                  <div className="flex items-center gap-2.5">
                    <CourseChip code={r.course_code} />
                    <span className="font-medium text-slate-700">{r.course_name}</span>
                  </div>
                </td>
                <td className="font-mono text-xs text-slate-600 whitespace-nowrap">
                  {r.start_time}–{r.end_time}
                </td>
                <td className="text-slate-600">{r.room}</td>
                <td><span className="badge bg-slate-100 text-slate-600">Sec {r.section}</span></td>
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
        <StatCard label="Total Students" value={s.students} accent="blue" icon="students" />
        <StatCard label="Total Faculty" value={s.faculty} accent="purple" icon="faculty" />
        <StatCard label="Total Courses" value={s.courses} accent="green" icon="courses" />
        <StatCard label="Departments" value={s.departments} accent="teal" icon="departments" />
        <StatCard label="Course Allocations" value={s.offerings} accent="orange" icon="allocation" />
        <StatCard label="Pending Tasks" value={s.pending_tasks} accent="red" icon="tasks" />
      </div>
      <SlotsList title="Today's Classes" subtitle="Happening across campus today" rows={data.todays_classes} />
      <SlotsList title="Upcoming Exams" subtitle="Next scheduled exams" rows={data.upcoming_exams} dateKey="Date" />
    </>
  );
}

function FacultyDash({ data }) {
  const s = data.stats;
  return (
    <>
      <TasksPending tasks={data.pending_tasks} />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="My Courses" value={s.my_courses} accent="blue" icon="courses" />
        <StatCard label="My Students" value={s.students} accent="green" icon="students" />
        <StatCard label="Assignments" value={s.assignments} accent="purple" icon="assignments" />
        <StatCard label="Ungraded Submissions" value={s.pending_submissions} accent="orange" icon="marks" />
      </div>
      <SlotsList title="Today's Classes" subtitle="Your teaching schedule today" rows={data.todays_classes} />
      <SlotsList title="Upcoming Exams" subtitle="For the courses you teach" rows={data.upcoming_exams} dateKey="Date" />
    </>
  );
}

function StudentDash({ data }) {
  const s = data.stats;
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Enrolled Courses" value={s.courses} accent="blue" icon="courses" />
        <StatCard label="Overall Attendance" value={`${s.attendance_overall}%`}
          accent={s.attendance_overall >= 75 ? 'green' : 'red'} icon="attendance" />
        <StatCard label="Assignments Submitted" value={s.assignments_submitted} accent="purple" icon="assignments" />
        <StatCard label="Upcoming Exams" value={s.upcoming_exams} accent="orange" icon="exams" />
      </div>
      <SlotsList title="Today's Classes" subtitle="Your schedule today" rows={data.todays_classes} />
      <SlotsList title="Upcoming Exams" subtitle="Mark your calendar" rows={data.upcoming_exams} dateKey="Date" />
      {data.announcements?.length > 0 && (
        <Section title="Announcements" subtitle="Latest updates">
          <ul className="space-y-3">
            {data.announcements.map((a, i) => (
              <li key={i} className="flex gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon name="announcements" className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-700">{a.title}</div>
                  <div className="text-sm text-slate-500">{a.message}</div>
                </div>
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

  if (loading) return <p className="text-slate-400 animate-pulse">Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      {/* Greeting banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900
        rounded-2xl p-6 mb-6 text-white shadow-lift animate-fade-up">
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-blue-200/80 text-xs font-medium uppercase tracking-widest">{todayLabel()}</p>
            <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
              {greeting()}, {name().split(' ')[0]} 👋
            </h1>
          </div>
          <span className={`badge ring-1 ${ROLE_TAG[r] || ''} capitalize shrink-0`}>{r}</span>
        </div>
      </div>

      {r === 'admin' && <AdminDash data={data} />}
      {r === 'faculty' && <FacultyDash data={data} />}
      {r === 'student' && <StudentDash data={data} />}
    </>
  );
}
