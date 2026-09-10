import React from 'react';
import { AlertTriangle, FileText, Users, ChevronRight } from 'lucide-react';

const reports = [
  { label: 'Generate Report Cards',   icon: FileText,      color: 'text-blue-600' },
  { label: 'Attendance Report',       icon: Users,         color: 'text-green-600' },
  { label: 'Grade Report',            icon: FileText,      color: 'text-purple-600' },
  { label: 'Emergency Contact List',  icon: AlertTriangle, color: 'text-red-600' },
  { label: 'Seating Chart',           icon: Users,         color: 'text-gray-600' },
];

const TeacherStudentsRight = ({ classData, students = [] }) => {
  const totalStudents = students.length;

  const overview = [
    { label: 'Total Students',     value: `${totalStudents}`,      highlight: false },
    { label: 'Class Name',         value: classData?.name || 'N/A', highlight: false },
    { label: 'Grade Level',        value: classData?.grade_level || 'N/A', highlight: false },
    { label: 'Room',               value: classData?.room || 'N/A', highlight: false },
  ];

  return (
    <div className="space-y-6">
      {/* Class Overview */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-blue-600" /> Class Overview
        </h3>
        <div className="space-y-2.5">
          {overview.map((o, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{o.label}</span>
              <span className={`font-bold text-sm ${o.color ?? 'text-gray-900'}`}>{o.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-600" /> Quick Reports
        </h3>
        <div className="space-y-1">
          {reports.map((r, i) => (
            <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 group transition-all">
              <span className={`flex items-center gap-2 text-sm font-medium text-gray-700`}>
                <r.icon className={`w-4 h-4 ${r.color}`} /> {r.label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentsRight;
