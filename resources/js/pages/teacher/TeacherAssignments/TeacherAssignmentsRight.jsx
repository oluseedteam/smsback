import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, BarChart2, ChevronRight, PlayCircle, Wrench } from 'lucide-react';



const stats = [
  { label: 'Avg Submission Rate', value: '87%' },
  { label: 'On-Time Completion',  value: '94%' },
  { label: 'Class Average',       value: 'B+' },
  { label: 'Most Improved',       value: '+15%', positive: true },
];

const templates = ['Math Worksheet', 'Reading Comprehension', 'Lab Report', 'Project Rubric'];

const tools = ['Rubric Builder', 'Comment Bank', 'Grade Calculator', 'Standards Alignment'];

const TeacherAssignmentsRight = ({ assignments = [] }) => {
  const activeAssignments = assignments.filter(a => a.status === 'active' || !a.status);
  const totalItemsToGrade = activeAssignments.reduce((acc, a) => acc + (a.submissions_count || a.submissions?.length || 0), 0);

  const bgColors = ['bg-blue-600', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];

  const queue = activeAssignments.length > 0 ? activeAssignments.slice(0, 5).map((a, i) => ({
    label: a.title,
    count: a.submissions_count || a.submissions?.length || 0,
    color: bgColors[i % bgColors.length]
  })) : [
    { label: 'No Active Assignments', count: 0, color: 'bg-gray-300' }
  ];

  return (
    <div className="space-y-6">
    {/* Grading Queue */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-orange-500" /> Grading Queue
      </h3>
      <div className="bg-red-50 rounded-2xl p-4 text-center mb-4 border border-red-100">
        <p className="text-xs text-gray-500 font-medium">Total Items to Grade</p>
        <p className="text-4xl font-black text-red-500 mt-1">{totalItemsToGrade}</p>
      </div>
      <div className="space-y-2 mb-4">
        {queue.map((q, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${q.color}`} />
              <span className="text-sm font-medium text-gray-700">{q.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{q.count}</span>
          </div>
        ))}
      </div>
      <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
        <PlayCircle className="w-4 h-4" /> Start Grading
      </button>
    </div>

    {/* Quick Stats */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-blue-600" /> Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className={`text-xl font-black ${s.positive ? 'text-green-600' : 'text-gray-800'}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Templates */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
        Templates
        <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">Browse All »</span>
      </h3>
      <div className="space-y-1">
        {templates.map((t, i) => (
          <motion.button
            key={i}
            whileHover={{ x: 4 }}
            className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 group text-sm font-medium text-gray-700 transition-all"
          >
            <span className="flex items-center gap-2 group-hover:text-blue-600">
              <span className="text-base">{['📐', '📖', '🔬', '📋'][i]}</span> {t}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>

    {/* Grading Tools */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-gray-500" /> Grading Tools
      </h3>
      <div className="space-y-1">
        {tools.map((t, i) => (
          <motion.button
            key={i}
            whileHover={{ x: 4 }}
            className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 group text-sm font-medium text-gray-700 transition-all"
          >
            <span className="flex items-center gap-2 group-hover:text-blue-600">
              <span>{['📊', '💬', '🧮', '📌'][i]}</span> {t}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>

    {/* Schedule Assistant */}
    <div className="bg-green-50 border border-green-100 rounded-3xl p-5">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
        🤖 Schedule Assistant
      </h3>
      <p className="text-xs text-gray-600 leading-relaxed">
        Consider assigning the next reading comprehension on Monday after the field trip. Students will be fresh and engaged!
      </p>
    </div>
  </div>
  );
};

export default TeacherAssignmentsRight;
