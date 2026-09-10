import React from 'react';
import { Calendar, HelpCircle, Star, MessageSquare } from 'lucide-react';

const HomeworkRight = ({ assignments = [] }) => {
  const weekDays = Array.from({ length: 5 }).map((_, i) => {
    // Get current week's Monday through Friday
    const curr = new Date();
    const day = curr.getDay(); // 0 is Sunday
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1) + i; // adjust when day is sunday
    const d = new Date(curr.setDate(diff));
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const hasAssignmentDue = assignments.some(a => {
      if (!a.due_date) return false;
      const due = new Date(a.due_date);
      return due.getDate() === d.getDate() && due.getMonth() === d.getMonth() && due.getFullYear() === d.getFullYear();
    });

    return { day: dayName, date: d.getDate(), active: hasAssignmentDue };
  });

  const dueThisWeek = assignments.filter(a => {
    if (!a.due_date) return false;
    const due = new Date(a.due_date);
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    // VERY rough "this week" estimate (within next 7 days or recently past this week)
    return Math.abs(due - now) < 7 * msInDay;
  });

  const summaryData = {};
  dueThisWeek.forEach(a => {
    const s = a.subject?.name || 'General';
    summaryData[s] = (summaryData[s] || 0) + 1;
  });

  const colors = ["bg-orange-500", "bg-purple-500", "bg-green-500", "bg-blue-500"];
  const summary = Object.keys(summaryData).map((key, i) => ({
    subject: key,
    count: summaryData[key],
    color: colors[i % colors.length]
  }));

  return (
    <div className="space-y-6">
      {/* This Week */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-gray-800">This Week</h3>
        </div>
        
        <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {weekDays.map((date, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col items-center p-2 min-w-[45px] rounded-xl transition-all duration-300
                ${date.active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-blue-50/50 text-gray-500 hover:bg-blue-50'}`}
            >
              <span className="text-[10px] font-bold uppercase mb-1">{date.day}</span>
              <span className="text-lg font-bold">{date.date}</span>
              {date.active && <div className="w-1 h-1 bg-white rounded-full mt-1"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Assignments Summary */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative">
          <h2 className="text-4xl font-black text-blue-600 mb-1">{dueThisWeek.length}</h2>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-4">assignments due this week</p>
          
          <div className="space-y-3">
            {summary.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-xs font-bold text-gray-600">{item.subject}</span>
                </div>
                <span className="text-xs font-black text-gray-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Need Help? Owl Card */}
      <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 text-center shadow-sm hover:shadow-md transition-shadow">
        <div className="text-4xl mb-3">🦉</div>
        <h3 className="text-sm font-bold text-gray-800 mb-1 leading-tight">Need help with your homework?</h3>
        <p className="text-[10px] text-gray-500 mb-4">Ask your teacher or parent!</p>
        <button className="flex items-center justify-center gap-2 w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100">
          <MessageSquare className="w-4 h-4" /> Send Message
        </button>
      </div>

      {/* Gold Stars Earned */}
      <div className="bg-yellow-400 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Star className="w-10 h-10 text-white fill-white mx-auto mb-4 animate-pulse" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Gold Stars Earned</h3>
          <h2 className="text-5xl font-black mb-1">8</h2>
          <p className="text-[10px] opacity-90 mt-2 font-medium">from homework this month!</p>
        </div>
      </div>
    </div>
  );
};

export default HomeworkRight;
