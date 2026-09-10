import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trophy, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  Plus,
  Send,
  Calendar as CalendarIcon,
  Search,
  Filter,
  User,
  MoreVertical,
  X,
  FileText,
  Mail,
  History,
  TrendingUp
} from 'lucide-react';
import TeacherAttendacesecondRight from './TeacherAttendacesecondRight';

const attendanceLog = [
  { date: 'Oct 25, 2023', status: 'present', timeIn: '8:25 AM', timeOut: '3:30 PM', notes: 'On time', verified: 'System' },
  { date: 'Oct 24, 2023', status: 'present', timeIn: '8:30 AM', timeOut: '3:30 PM', notes: '-', verified: 'System' },
  { date: 'Oct 23, 2023', status: 'present', timeIn: '8:32 AM', timeOut: '3:30 PM', notes: '-', verified: 'System' },
  { date: 'Oct 17, 2023', status: 'absent',   timeIn: '-',        timeOut: '-',        notes: 'Sick with fever', verified: 'School Nurse', excused: true },
  { date: 'Oct 12, 2023', status: 'late',     timeIn: '8:52 AM', timeOut: '3:30 PM', notes: 'Traffic delay', verified: 'Miss Roberts' },
];

const statusConfig = {
  present: { label: 'Present', icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-400' },
  absent:  { label: 'Absent (Excused)', icon: X, bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
  late:    { label: 'Late Arrival', icon: Clock, bg: 'bg-orange-50', text: 'text-orange-500', dot: 'bg-orange-400' },
};

const calDays = [
  null, null, null, null, null, null, null,
  1, 2, 3, 4, 5, 6, 7,
  8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28,
  29, 30, 31, null, null, null, null,
];

const attendanceMarkers = {
  2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 9: 'present', 10: 'present', 11: 'present', 12: 'late', 13: 'present', 16: 'present', 17: 'absent', 18: 'present', 19: 'present', 20: 'present', 23: 'present', 24: 'present', 25: 'current'
};

const TeacherAttendacesecond = () => {
  const [activeTab, setActiveTab] = useState('individual');

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0">
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Student Attendance Records - Grade 4B</h1>
            <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
              <button 
                onClick={() => setActiveTab('individual')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Individual View
              </button>
              <button 
                onClick={() => setActiveTab('class')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'class' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Class Overview
              </button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden shadow-xs transition-all" 
              />
            </div>
          </div>
          <div className="flex gap-3 h-fit">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-black text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all bg-white shadow-xs">
              <Download className="w-3.5 h-3.5" /> Export Data
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-black text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all bg-white shadow-xs">
              <Printer className="w-3.5 h-3.5" /> Print Report
            </button>
          </div>
        </div>

        {/* Filters and Stats Summary */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-2xl text-[11px] shadow-lg shadow-blue-100">All Students</button>
              <button className="px-4 py-2 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 font-bold rounded-2xl text-[11px] transition-all border border-gray-100">Perfect Attendance</button>
              <button className="px-4 py-2 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-2xl text-[11px] transition-all border border-gray-100">Attendance Concerns</button>
              <button className="px-4 py-2 bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600 font-bold rounded-2xl text-[11px] transition-all border border-gray-100">Frequent Tardies</button>
            </div>
            <div className="flex-1" />
            <div className="h-8 w-px bg-gray-100" />
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </div>
          </div>
        </div>

        {/* Student Profile Header */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6">
             <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors">
               <MoreVertical size={18} />
             </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <div className="relative">
              <div className="w-28 h-28 rounded-[36px] overflow-hidden border-4 border-white shadow-xl ring-2 ring-gray-100">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" alt="Emma Rose Johnson" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Emma Rose Johnson</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 py-1.5 px-3 bg-gray-50 rounded-xl border border-gray-100/50 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-blue-500" /> STU-2024-0947
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 py-1.5 px-3 bg-gray-50 rounded-xl border border-gray-100/50">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Grade 4B
                  </span>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100/50 uppercase tracking-widest shadow-xs">Good Standing</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1.5">Current Term Attendance</p>
                <p className="text-2xl font-black text-gray-900 leading-none">Above class average (95.8%)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 p-2">
            {[
              { label: 'Days Present', value: '48', icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-500' },
              { label: 'Days Absent (excused)', value: '2', icon: CalendarIcon, bg: 'bg-red-50', iconColor: 'text-red-500' },
              { label: 'Times Late', value: '1', icon: Clock, bg: 'bg-blue-50/50', iconColor: 'text-blue-500' },
              { label: 'Attendance Rate', value: '96%', icon: Trophy, bg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50 hover:bg-white hover:shadow-2xl hover:shadow-gray-100 transition-all text-center"
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <p className="text-3xl font-black text-gray-900 leading-none mb-1">{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
           <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">October 2023 - Emma's Attendance</h3>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-xl border border-gray-200 hover:border-blue-200 text-gray-400 hover:text-blue-600 transition-all bg-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 px-6 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-black text-blue-600 tracking-tight">October</span>
                </div>
                <button className="p-2 rounded-xl border border-gray-200 hover:border-blue-200 text-gray-400 hover:text-blue-600 transition-all bg-white">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
           </div>

           <div className="grid grid-cols-7 gap-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-[11px] font-black text-gray-400 uppercase tracking-widest py-3 mb-2">{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <div key={i} className="aspect-square" />;
                const status = attendanceMarkers[day];
                const isWeekend = i % 7 === 0 || i % 7 === 6;
                
                let bgClass = "bg-white border-gray-50 hover:border-blue-200 hover:bg-gray-50/50 shadow-xs";
                let textClass = "text-gray-700";
                
                if (status === 'present') {
                  bgClass = "bg-green-50 border-green-100 hover:bg-green-100/50 shadow-xs";
                  textClass = "text-green-700 font-bold";
                } else if (status === 'absent') {
                  bgClass = "bg-red-50 border-red-100 hover:bg-red-100/50 shadow-xs";
                  textClass = "text-red-700 font-bold";
                } else if (status === 'late') {
                  bgClass = "bg-orange-50 border-orange-100 hover:bg-orange-100/50 shadow-xs";
                  textClass = "text-orange-700 font-bold";
                } else if (status === 'current') {
                  bgClass = "bg-blue-50 border-blue-500 ring-2 ring-blue-100 shadow-xl";
                  textClass = "text-blue-700 font-bold";
                }
                
                if (isWeekend) {
                   bgClass = "bg-gray-100/30 border-transparent opacity-60";
                   textClass = "text-gray-400";
                }

                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${bgClass}`}
                  >
                    <p className={`text-sm ${textClass}`}>{day}</p>
                    {status === 'present' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-1 opacity-60" />}
                    {status === 'absent' && <X className="w-3.5 h-3.5 text-red-500 mt-1 opacity-60" />}
                    {status === 'late' && <Clock className="w-3.5 h-3.5 text-orange-500 mt-1 opacity-60" />}
                    {status === 'current' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />}
                  </motion.div>
                );
              })}
           </div>
        </div>

        {/* Detailed Attendance Log */}
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Detailed Attendance Log</h3>
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </div>

          <div className="overflow-x-auto rounded-[32px] border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Time In</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Time Out</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Notes</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendanceLog.map((log, i) => {
                  const sc = statusConfig[log.status];
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-gray-800">{log.date}</p>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${sc.bg} ${sc.text} w-fit`}>
                           <sc.icon className="w-3.5 h-3.5" />
                           <span className="text-[10px] font-black uppercase tracking-tight">{sc.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-gray-500 font-mono italic">{log.timeIn}</td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-gray-500 font-mono italic">{log.timeOut}</td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-gray-500 font-medium group-hover:text-gray-800 transition-colors italic">{log.notes}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">{log.verified}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-between items-center mt-10 gap-6">
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-xs font-black text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all bg-white shadow-xs">
                <ChevronLeft className="w-4 h-4" /> Previous: Michael Chen
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-xs font-black text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all bg-white shadow-xs">
                Next: Sarah Williams <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <button className="px-8 py-3 rounded-2xl border border-gray-200 text-xs font-black text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                Return to Class View
              </button>
              <button className="px-8 py-3 rounded-2xl bg-blue-700 text-white font-black text-xs hover:bg-blue-800 shadow-xl shadow-blue-100 transition-all">
                Print Individual Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="lg:w-80 w-full">
        <TeacherAttendacesecondRight />
      </div>
    </div>
  );
};

export default TeacherAttendacesecond;
