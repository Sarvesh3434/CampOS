// TimetableGrid.jsx — renders the week as a real GRID (rows = time slots,
// columns = Monday..Saturday) instead of a flat linear table.
//
// How it works: entries arrive as a flat list of slots
//   { day_or_date, start_time, end_time, course_code, course_name, ... }
// We collect all distinct start times, sort them, and place each slot in the
// cell [row = its start time, column = its day]. Empty cells show a dash.
// Each course gets its own pastel color, so the week reads like a real
// school timetable chart.
import { DAYS } from './timetableConstants.js';

// Stable pastel palette, cycled by course code.
const COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
];

export default function TimetableGrid({ slots }) {
  const days = DAYS; // Monday..Saturday columns
  const rows = [...new Set(slots.map((s) => s.start_time))].sort(); // unique period starts

  // Index slots by "day|start" for O(1) cell lookup while rendering.
  const cell = {};
  const colorOf = {};
  let colorIdx = 0;
  for (const s of slots) {
    cell[`${s.day_or_date}|${s.start_time}`] = s;
    if (!colorOf[s.course_code]) colorOf[s.course_code] = COLORS[colorIdx++ % COLORS.length];
  }

  if (slots.length === 0) {
    return <p className="text-gray-500 text-sm">No classes scheduled this week.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border bg-gray-50 p-2 text-xs text-gray-500 w-24">Time</th>
            {days.map((d) => (
              <th key={d} className="border bg-gray-50 p-2 text-xs font-semibold text-gray-600">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((time) => (
            <tr key={time}>
              <td className="border bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                {time}
              </td>
              {days.map((d) => {
                const s = cell[`${d}|${time}`];
                if (!s) return <td key={d} className="border p-2 text-center text-gray-300">—</td>;
                return (
                  <td key={d} className="border p-1">
                    <div className={`rounded-lg border px-2 py-2 ${colorOf[s.course_code]}`}>
                      <div className="font-bold text-xs">{s.course_code}</div>
                      <div className="text-[11px] leading-tight truncate">{s.course_name}</div>
                      <div className="text-[11px] opacity-70">
                        {s.start_time}–{s.end_time} · {s.room}
                      </div>
                      {/* extra info (faculty for students, section for faculty) */}
                      {s.faculty_name && (
                        <div className="text-[11px] opacity-70 truncate">{s.faculty_name}</div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(colorOf).map(([code, cls]) => (
          <span key={code} className={`text-xs px-2 py-1 rounded border ${cls}`}>
            {code}
          </span>
        ))}
      </div>
    </div>
  );
}
