import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, BarChart2, Clock, ChevronRight, PlusCircle } from 'lucide-react';

const upcoming = [
  { date: 'Today • Oct 25', label: 'Parent-Teacher Conference', sub: "Emma's parents • 2:30 PM • Room 4B", accent: 'border-l-blue-500 bg-blue-50' },
  { date: 'Friday • Oct 27', label: 'Field Trip to Zoo',        sub: 'Grade 4B • All Day • Depart 8:00 AM', accent: 'border-l-green-500 bg-green-50' },
  { date: 'Saturday • Oct 28', label: 'Weekend',               sub: 'No school', accent: 'border-l-gray-300 bg-gray-50' },
  { date: 'Monday • Oct 30', label: 'Book Fair Begins',        sub: 'Library • All event', accent: 'border-l-purple-500 bg-purple-50' },
  { date: 'Tuesday • Oct 31', label: 'Science Project Due',    sub: 'Grade 4B • Submit by 3:00 PM', accent: 'border-l-red-400 bg-red-50' },
];

const weekSummary = [
  { label: 'Classes',     value: 20 },
  { label: 'Assignments', value: 8 },
  { label: 'Tests',       value: 2 },
  { label: 'Meetings',    value: 3 },
];

const deadlines = [
  { subject: 'Math',    label: 'Math Practice Sheet',  due: '2 days',  subjectColor: 'bg-blue-100 text-blue-700' },
  { subject: 'Science', label: 'Plant Parts Project',  due: '5 days',  subjectColor: 'bg-green-100 text-green-700' },
  { subject: 'English', label: 'Reading Log',          due: '1 week',  subjectColor: 'bg-purple-100 text-purple-700' },
];

const district = [
  { label: 'Report Cards',      date: 'Nov 3' },
  { label: 'PT Conferences',    date: 'Nov 7-8' },
  { label: 'Thanksgiving Break',date: 'Nov 22-24' },
  { label: 'Winter Break',      date: 'Dec 22 - Jan 3' },
];

const TeacherCalendarRight = () => {
  const [eventTitle, setEventTitle] = useState('');

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-blue-600" /> Upcoming Events
        </h3>
        <div className="space-y-3">
          {upcoming.map((e, i) => (
            <motion.div
              key={i}
              whileHover={{ x: 3 }}
              className={`p-3 rounded-2xl border-l-4 ${e.accent} cursor-pointer`}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{e.date}</p>
              <p className="text-xs font-bold text-gray-800 mt-0.5">{e.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{e.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* This Week Summary */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-blue-600" /> This Week Summary
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {weekSummary.map((w, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-gray-800">{w.value}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{w.label}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold mb-1 text-gray-600">
            <span>Week Completion</span><span>71%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '71%' }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* Quick Add Event */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600" /> Quick Add Event
        </h3>
        <div className="space-y-3">
          <input type="date" defaultValue="2023-10-25"
            className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <div className="grid grid-cols-2 gap-2">
            <input type="time" defaultValue="09:00"
              className="border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <input type="time" defaultValue="10:00"
              className="border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <input
            type="text"
            value={eventTitle}
            onChange={e => setEventTitle(e.target.value)}
            placeholder="Event title…"
            className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
            Add Event
          </button>
          <button className="w-full text-xs text-blue-600 font-bold hover:underline">Advanced options</button>
        </div>
      </div>

      {/* Assignment Deadlines */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-blue-600" /> Assignment Deadlines
        </h3>
        <div className="space-y-3">
          {deadlines.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.subjectColor}`}>{d.subject}</span>
                <span className="text-xs font-medium text-gray-700">{d.label}</span>
              </div>
              <span className="text-xs font-bold text-orange-600">{d.due}</span>
            </div>
          ))}
        </div>
      </div>

      {/* District Calendar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 text-sm">📅 District Calendar</h3>
        <div className="space-y-2 mb-4">
          {district.map((d, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-700 font-medium">{d.label}</span>
              <span className="text-xs font-bold text-blue-600">{d.date}</span>
            </div>
          ))}
        </div>
        <button className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-2xl py-2.5 text-xs font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all">
          🔄 Sync with School Calendar
        </button>
      </div>
    </div>
  );
};

export default TeacherCalendarRight;
