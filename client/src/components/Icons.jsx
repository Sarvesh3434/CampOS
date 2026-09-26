// Icons.jsx — tiny inline SVG icon set (stroke style, no icon library needed).
// Usage: <Icon name="dashboard" className="w-4 h-4" />
// All icons use stroke="currentColor" so they inherit text color.

const PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  departments: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M15 9h4a2 2 0 0 1 2 2v10" />
      <path d="M9 7h.01M9 11h.01M9 15h.01" />
    </>
  ),
  courses: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-4.5" />
      <path d="M9 7.5h6" />
    </>
  ),
  faculty: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18.5 14.4c1.9.9 3.5 2.9 3.5 5.6" />
    </>
  ),
  students: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      <path d="M2 11l3 1.5" />
    </>
  ),
  allocation: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2v4M16 2v4" />
      <path d="M9.5 15.5l1.8 1.8 3.7-3.7" />
    </>
  ),
  enrollments: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </>
  ),
  timetable: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  exams: (
    <>
      <path d="M6 3h12l1 18H5L6 3z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
      <path d="M15 2v3M9 2v3" />
    </>
  ),
  tasks: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2v4M16 2v4" />
      <path d="M9.5 14.5l1.8 1.8 3.7-3.7" />
    </>
  ),
  announcements: (
    <>
      <path d="M3 11l14-6v14L3 13v-2z" />
      <path d="M7 13.5V19a1.5 1.5 0 0 0 3 0v-4" />
      <path d="M17 9a3 3 0 0 1 0 5" />
    </>
  ),
  attendance: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2v4M16 2v4" />
      <path d="M9 14.5l2 2 4-4" />
    </>
  ),
  marks: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
    </>
  ),
  assignments: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
};

export default function Icon({ name, className = 'w-4 h-4' }) {
  const path = PATHS[name] || PATHS.dashboard;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {path}
    </svg>
  );
}
