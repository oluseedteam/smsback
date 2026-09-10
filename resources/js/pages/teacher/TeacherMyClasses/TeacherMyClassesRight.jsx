import React from 'react';
import { BookOpen, CalendarDays, ClipboardCheck, Library, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const SHORTCUTS = [
  { label: 'Gradebook', path: '/teacher/gradebook', icon: ClipboardCheck },
  { label: 'Attendance', path: '/teacher/attendance', icon: CalendarDays },
  { label: 'Students', path: '/teacher/students', icon: Users },
  { label: 'Resources', path: '/teacher/resources', icon: Library },
];

export default function TeacherMyClassesRight({ classes = [] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-800">
          <BookOpen className="h-4 w-4 text-blue-600" /> Assigned Schedule
        </h3>
        {classes.length === 0 ? (
          <p className="text-xs text-gray-500">No teaching groups are assigned.</p>
        ) : (
          <div className="space-y-3">
            {classes.slice(0, 6).map(schoolClass => (
              <div key={schoolClass.id} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-800">{schoolClass.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{schoolClass.grade_level}{schoolClass.arm ? ` · ${schoolClass.arm}` : ''}</p>
                <p className="mt-1 text-[10px] font-bold text-blue-700">{(schoolClass.subjects || []).map(subject => subject.name).join(', ') || 'No subjects assigned'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-800">Teaching Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.map(shortcut => (
            <Link key={shortcut.path} to={shortcut.path} className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 p-3 text-center text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
              <shortcut.icon className="h-4 w-4" /> {shortcut.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
