import React from 'react';
import { Award, CheckCircle, Printer, Star, BookOpen } from 'lucide-react';

export default function GradesRight({ reportCard }) {
  if (!reportCard) return null;

  const { summary, academic, results = [] } = reportCard;

  const topSubjects = [...results].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Term Performance Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">
            {academic?.term} Summary
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-bold uppercase">Registered Subjects</span>
            <span className="font-black text-slate-800">{summary?.total_subjects || results.length}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-bold uppercase">Average Score</span>
            <span className="font-black text-blue-600 text-sm">{summary?.average_score || 0}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-bold uppercase">Overall Grade</span>
            <span className="font-black text-sky-600 text-sm">{summary?.overall_grade || 'N/A'}</span>
          </div>

          {summary?.position && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-bold uppercase">Class Position</span>
              <span className="font-black text-blue-700">
                {summary.position}{['st','nd','rd'][(summary.position % 10)-1] || 'th'}
                {summary?.total_students_in_class && ` of ${summary.total_students_in_class}`}
              </span>
            </div>
          )}

          {summary?.attendance_total > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-bold uppercase">Attendance</span>
              <span className="font-black text-slate-800">
                {summary.attendance_present} / {summary.attendance_total} days
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Subjects */}
      {topSubjects.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Star className="w-5 h-5 text-sky-500" />
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">
              Top Performing Subjects
            </h3>
          </div>

          <div className="space-y-2">
            {topSubjects.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-xs text-slate-800">{s.subject_name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{s.remark}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs text-blue-600">{s.total_score} pts</span>
                  <span className="block text-[9px] font-black text-slate-500">Grade {s.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg space-y-3">
        <h4 className="font-black text-xs uppercase tracking-wider text-sky-300">Official Actions</h4>
        <p className="text-[11px] text-blue-100">
          Download or print a crisp copy of your certified report card.
        </p>
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white text-blue-950 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-sky-400 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>
    </div>
  );
}
