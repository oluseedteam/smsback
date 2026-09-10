import React from 'react';
import { Bell, CalendarCheck2, MessageSquare, Target, TrendingUp } from 'lucide-react';

const REMINDERS = [
  'If you are sick, stay home and rest.',
  'Ask your parent or guardian to notify the school.',
  'Bring any required note when you return.',
  'Schedule appointments outside school hours when possible.',
];

export default function AttendaceRight({ attendance = [] }) {
  const presentLike = attendance.filter(record => ['present', 'late', 'excused'].includes(record.status)).length;
  const rate = attendance.length > 0 ? Math.round((presentLike / attendance.length) * 100) : 0;
  const ordered = [...attendance].sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date));
  const currentStreak = ordered.findIndex(record => !['present', 'late', 'excused'].includes(record.status));
  const streak = currentStreak === -1 ? ordered.length : currentStreak;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="text-sm font-bold uppercase tracking-tight text-gray-800">Recorded Attendance</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
            <p className="text-2xl font-black text-green-700">{rate}%</p>
            <p className="mt-1 text-[10px] font-black uppercase text-green-600">Attendance rate</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
            <p className="text-2xl font-black text-blue-700">{streak}</p>
            <p className="mt-1 text-[10px] font-black uppercase text-blue-600">Current streak</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>Calculated from {attendance.length} attendance record{attendance.length === 1 ? '' : 's'} in your portal.</span>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          <h3 className="text-sm font-bold uppercase tracking-tight text-gray-800">Attendance Guidance</h3>
        </div>
        <div className="space-y-3">
          {REMINDERS.map(reminder => (
            <div key={reminder} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700">
              <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
              <span>{reminder}</span>
            </div>
          ))}
        </div>
      </div>

      <a href="/student/messages" className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-sm hover:bg-blue-700">
        <MessageSquare className="h-4 w-4" /> Contact the School
      </a>
    </div>
  );
}
