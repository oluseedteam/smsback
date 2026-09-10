import React from 'react';
import { motion } from 'motion/react';
import { PlusCircle, ChevronRight, Clock } from 'lucide-react';

const quickActions = [
  { label: 'New Message',             icon: '✉️' },
  { label: 'Message All Parents',     icon: '👨‍👩‍👧' },
  { label: 'Message Student',         icon: '👤' },
  { label: 'Send Class Announcement', icon: '📢' },
  { label: 'Schedule Parent Conference', icon: '📅' },
];

const templates = [
  { label: 'Homework reminder',    icon: '📚' },
  { label: 'Absence follow-up',    icon: '📋' },
  { label: 'Positive behavior note', icon: '⭐' },
  { label: 'Progress concern',     icon: '📊' },
  { label: 'Meeting invitation',   icon: '🤝' },
  { label: 'Weekly update',        icon: '📰' },
];

const scheduled = [
  { label: 'Weekly newsletter', sub: 'Friday at 4:00 PM' },
];

const TeacherMessagesRight = ({ onAction, onTemplate }) => (
  <div className="space-y-6">
    {/* Quick Actions */}
    <div className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle className="w-4 h-4 text-blue-600" /> Actions
      </h3>
      <div className="space-y-2">
        {quickActions.map((a, i) => (
          <motion.button
            key={i}
            whileHover={{ x: 3 }}
            onClick={() => onAction?.(a.label)}
            className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${
              i === 0
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
                : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100'
            }`}
          >
            <span className="text-sm">{a.icon}</span> {a.label}
          </motion.button>
        ))}
      </div>
    </div>

    {/* Message Templates */}
    <div className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Templates</h3>
        <span className="text-[10px] font-black text-blue-600 cursor-pointer hover:underline uppercase">Manage</span>
      </div>
      <div className="space-y-1.5">
        {templates.map((t, i) => (
          <button 
            key={i} 
            onClick={() => onTemplate?.(t.label)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all text-left border border-transparent"
          >
            <span className="text-sm">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
    </div>

    {/* Scheduled Messages */}
    <div className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-[11px] uppercase tracking-wider">
        <Clock className="w-4 h-4 text-blue-600" /> Scheduled
      </h3>
      <div className="space-y-3">
        {scheduled.map((s, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[11px] font-black text-gray-800 uppercase leading-none mb-1.5">{s.label}</p>
            <p className="text-[10px] font-bold text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TeacherMessagesRight;
