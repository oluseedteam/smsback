import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, Bell, ChevronRight } from 'lucide-react';

const dayPatterns = [
  { day: 'Monday',    pct: 95, color: 'bg-green-500' },
  { day: 'Tuesday',   pct: 100,color: 'bg-green-500' },
  { day: 'Wednesday', pct: 84, color: 'bg-yellow-400' },
  { day: 'Thursday',  pct: 95, color: 'bg-green-500' },
  { day: 'Friday',    pct: 88, color: 'bg-yellow-400' },
];

const followUp = [
  { name: 'David Martinez', reason: '4 tardies this week',  action: 'Send Reminder',   actionColor: 'bg-blue-600 text-white' },
  { name: 'Ashley Kim',     reason: '3 absences this term (2 unexcused)', action: 'Schedule Meeting', actionColor: 'bg-orange-100 text-orange-700' },
];

const alerts = [
  { label: 'School minimum 90% required: Class: 95.8%', type: 'success', icon: '✅' },
  { label: 'Perfect attendance: 12 students',          type: 'info',    icon: '🏆' },
  { label: 'At-risk students: 2',                      type: 'warn',    icon: '⚠️',  count: 2 },
];

const quickActions = [
  'Request Absence (Parents)',
  'Print Attendance Sheet',
  'Email Daily Report',
  'Generate Term Report',
];

const notifications = [
  { msg: 'Sarah Williams – Excused absence note received', time: '2 hours ago' },
  { msg: 'David Martinez – Late arrival parent notification sent', time: '1 hour ago' },
  { msg: 'Perfect attendance achieved by Emma Johnson (20)', time: 'Yesterday' },
];

const TeacherAttendanceRight = () => (
  <div className="space-y-6">
    {/* Attendance Patterns */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-blue-600" /> Attendance Patterns
      </h3>
      <div className="space-y-3">
        {dayPatterns.map((d, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs font-bold mb-1 text-gray-600">
              <span>{d.day}</span>
              <span>{d.pct}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${d.color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${d.pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
              />
            </div>
          </div>
        ))}
        <p className="text-[10px] text-orange-500 font-bold mt-1">⚠️ Slightly below average on Fridays</p>
      </div>
    </div>

    {/* Students Requiring Follow-Up */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
        <AlertTriangle className="w-4 h-4 text-orange-500" /> Students Requiring Follow-up
      </h3>
      <div className="space-y-3">
        {followUp.map((f, i) => (
          <div key={i} className="p-3 bg-orange-50 rounded-2xl border border-orange-100">
            <p className="text-xs font-bold text-gray-800">{f.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 mb-2">{f.reason}</p>
            <button className={`text-[10px] font-bold px-3 py-1 rounded-lg ${f.actionColor}`}>
              {f.action}
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* Attendance Alerts */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">Attendance Alerts</h3>
      <div className="space-y-2 mb-2">
        {alerts.map((a, i) => (
          <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl text-[11px] font-semibold ${
            a.type === 'success' ? 'bg-green-50 text-green-700' :
            a.type === 'warn'    ? 'bg-orange-50 text-orange-700' :
                                   'bg-blue-50 text-blue-700'
          }`}>
            <span>{a.icon} {a.label}</span>
            {a.count && <span className="font-black">{a.count}</span>}
          </div>
        ))}
      </div>
      <button className="text-xs font-bold text-blue-600 hover:underline">View details →</button>
    </div>

    {/* Quick Actions */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-3 text-sm">Quick Actions</h3>
      <div className="space-y-1">
        {quickActions.map((a, i) => (
          <motion.button
            key={i}
            whileHover={{ x: 3 }}
            className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-blue-600 transition-all"
          >
            <span className="flex items-center gap-2">{['📞','🖨','📧','📊'][i]} {a}</span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
          </motion.button>
        ))}
      </div>
    </div>

    {/* Recent Notifications */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
        <Bell className="w-4 h-4 text-blue-600" /> Recent Notifications
      </h3>
      <div className="space-y-3">
        {notifications.map((n, i) => (
          <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
            <p className="text-xs text-gray-700 leading-snug">{n.msg}</p>
            <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TeacherAttendanceRight;
