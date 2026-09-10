import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  MoreVertical, 
  Printer, 
  Share2, 
  LayoutGrid, 
  List,
  Clock,
  Download,
  Copy,
  CalendarDays,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  Mail,
  Video,
  FileText
} from 'lucide-react';
import TeacherCalendarsecondRight from './TeacherCalendarsecondRight';

const weekDays = [
  { name: 'Monday', date: 'Oct 23', classes: 5, meetings: 1 },
  { name: 'Tuesday', date: 'Oct 24', classes: 5, prep: '1hr' },
  { name: 'Wednesday', date: 'Oct 25', classes: 4, conference: 1 },
  { name: 'Thursday', date: 'Oct 26', classes: 5, meeting: '1' },
  { name: 'Friday', date: 'Oct 27', classes: 'Field trip', allDay: true },
];

const scheduleEvents = [
  { day: 0, start: '8:30 AM', duration: 90, title: 'Mathematics', room: 'Room 4B', students: 28, color: 'bg-green-50 text-green-700 border-green-200' },
  { day: 1, start: '8:30 AM', duration: 90, title: 'Mathematics', room: 'Room 5B', students: 25, color: 'bg-green-50 text-green-700 border-green-200' },
  { day: 2, start: '8:30 AM', duration: 90, title: 'Mathematics', room: 'Room 4C', students: 26, color: 'bg-green-50 text-green-700 border-green-200' },
  { day: 0, start: '10:30 AM', duration: 60, title: 'English', room: 'Room 4B', students: 28, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { day: 2, start: '10:30 AM', duration: 60, title: 'English', room: 'Room 2B', students: 28, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { day: 0, start: '1:30 PM', duration: 60, title: 'Science Lab', room: 'Science Lab', students: 28, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { day: 1, start: '1:30 PM', duration: 60, title: 'Science Lab', room: 'Science Lab', students: 28, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { day: 2, start: '1:30 PM', duration: 90, title: 'Social Studies', room: 'Room 4B', students: 28, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { day: 0, start: '3:30 PM', duration: 60, title: 'Grade Meeting', room: 'Conference Room', students: '-', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { day: 1, start: '3:30 PM', duration: 60, title: 'Art', room: 'Art Room', students: 28, color: 'bg-red-50 text-red-700 border-red-200' },
  { day: 2, start: '3:30 PM', duration: 60, title: 'Parent Conf', room: 'Online', students: 1, color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

const TeacherCalendarsecond = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('Week');

  const handleViewChange = (v) => {
    if (v === 'Month') {
      navigate('/teacher/calendar');
    } else {
      setActiveView(v);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0">
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-gray-100">
           <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight leading-none italic">Weekly Schedule & Planning</h1>
              <div className="flex items-center gap-3 mt-4">
                 <button className="p-2 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-white text-gray-400 hover:text-blue-600 transition-all shadow-xs">
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 <div className="flex items-center gap-2 font-black text-blue-700 px-4 py-2 bg-blue-50 border border-blue-100/50 rounded-2xl italic tracking-tight uppercase tracking-widest text-[11px]">
                   <CalendarIcon className="w-4 h-4" />
                   October 23-27, 2023
                 </div>
                 <button className="p-2 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-white text-gray-400 hover:text-blue-600 transition-all shadow-xs">
                   <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1.5 p-1 bg-gray-100/50 rounded-2xl border border-gray-100 w-fit self-end">
                {['Month', 'Week', 'Day', 'Agenda'].map((view) => (
                  <button 
                    key={view}
                    onClick={() => handleViewChange(view)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === view ? 'bg-blue-700 text-white shadow-xl shadow-blue-500/10' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 self-end">
                 <button className="px-5 py-2.5 rounded-2xl bg-blue-50 text-blue-700 text-xs font-black shadow-[0_4px_12px_rgba(0,100,255,0.05)] border border-blue-100/50">Today</button>
                 <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-900 text-white text-xs font-black shadow-xl shadow-blue-500/10 hover:bg-blue-800 transition-all">
                    <Plus className="w-4 h-4" /> Add Event
                 </button>
              </div>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:flex flex-col gap-6 w-64 shrink-0">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
               <h3 className="text-xs font-black text-gray-500 mb-5 uppercase tracking-widest px-1 leading-none italic">Weekly Overview</h3>
               <div className="space-y-4">
                  {weekDays.map((day, i) => (
                    <div key={i} className="group cursor-pointer">
                       <div className="flex justify-between items-end mb-1 px-1">
                          <p className="text-xs font-black text-gray-800 group-hover:text-blue-700 transition-colors uppercase italic tracking-tighter">{day.name}, {day.date}</p>
                          <p className="text-[10px] font-bold text-blue-500">{day.classes} classes</p>
                       </div>
                       <div className="w-full h-1 bg-gray-50 rounded-full group-hover:bg-blue-50 transition-colors" />
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
               <h3 className="text-xs font-black text-gray-500 mb-5 uppercase tracking-widest px-1 italic">Upcoming Deadlines</h3>
               <div className="space-y-3">
                  <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 hover:bg-white hover:shadow-xl transition-all border-dashed">
                     <p className="text-[10px] font-black text-orange-700 leading-tight">Math quiz grades due - Thursday</p>
                  </div>
                  <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 hover:bg-white hover:shadow-xl transition-all border-dashed">
                     <p className="text-[10px] font-black text-red-700 leading-tight italic">Field trip forms - Friday</p>
                  </div>
                  <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100/50 hover:bg-white hover:shadow-xl transition-all border-dashed">
                     <p className="text-[10px] font-black text-green-700 leading-tight">Progress reports - Next Monday</p>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
               <h3 className="text-xs font-black text-gray-500 mb-5 uppercase tracking-widest px-1 italic">Resource Calendar</h3>
               <div className="space-y-2">
                  {[
                    { label: 'Projector', time: 'Tue 1PM', color: 'bg-green-600' },
                    { label: 'Tablet Set', time: 'Thu 10AM', color: 'bg-blue-700' },
                    { label: 'Library', time: 'Fri AM', color: 'bg-purple-700' }
                  ].map((res, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2 bg-gray-50/50 rounded-xl border border-gray-100/50 font-black">
                       <span className="text-[10px] text-gray-600">{res.label}</span>
                       <span className={`text-[8px] text-white ${res.color} px-2 py-0.5 rounded-full uppercase tracking-tighter`}>{res.time}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[800px]">
             <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-b border-gray-50">
                <div className="py-6 border-r border-gray-50 flex items-center justify-center italic text-blue-900/40 text-[9px] font-black uppercase tracking-widest">Time</div>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => {
                   const isToday = day === 'Wednesday';
                   return (
                     <div key={i} className={`py-6 flex flex-col items-center justify-center border-r last:border-0 border-gray-50 ${isToday ? 'bg-blue-50/30 ring-1 ring-blue-100/50 relative' : ''}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-700' : 'text-gray-400'}`}>{day}</p>
                        <p className={`text-base font-black uppercase tracking-tight italic ${isToday ? 'text-blue-900 underline decoration-blue-500' : 'text-gray-600'}`}>Oct {23 + i}</p>
                        {isToday && <div className="absolute -bottom-1 w-full h-1 bg-blue-600 rounded-full" />}
                     </div>
                   );
                })}
             </div>

             <div className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                {Array.from({ length: 11 }).map((_, i) => (
                   <div key={i} className="grid grid-cols-[100px_1fr] h-[100px] border-b border-gray-50">
                      <div className="border-r border-gray-50 flex items-start justify-center pt-3 text-[10px] font-black italic uppercase tracking-tighter text-blue-900/60 font-mono">
                        {i + 8}:00 AM
                      </div>
                      <div className="grid grid-cols-5 h-full relative">
                         {Array.from({ length: 5 }).map((_, j) => (
                            <div key={j} className="border-r last:border-0 border-gray-50 h-full" />
                         ))}
                      </div>
                   </div>
                ))}

                <div className="absolute inset-0 grid grid-cols-[100px_1fr]">
                   <div />
                   <div className="grid grid-cols-5 h-full relative group">
                      {scheduleEvents.map((ev, i) => {
                        const top = (parseInt(ev.start.split(':')[0]) - 8 + (ev.start.includes('PM') && ev.start.split(':')[0] !== '12' ? 4 : 0)) * 100 + (parseInt(ev.start.split(':')[1]) / 60) * 100;
                        const height = (ev.duration / 60) * 100;
                        return (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02, zIndex: 10, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            style={{ 
                              gridColumn: ev.day + 1, 
                              top: `${top}px`, 
                              height: `${height}px` 
                            }}
                            className={`absolute inset-x-2 rounded-2xl border-2 p-3 shadow-sm flex flex-col justify-between overflow-hidden cursor-pointer backdrop-blur-[2px] ${ev.color}`}
                          >
                             <div className="flex justify-between items-start">
                                <h4 className="text-[11px] font-black uppercase tracking-tight leading-tight">{ev.title}</h4>
                                <CheckCircle2 className="w-3.5 h-3.5 opacity-60" />
                             </div>
                             <div className="mt-auto">
                                <p className="text-[10px] font-black italic opacity-80">{ev.room}</p>
                                <p className="text-[9px] font-bold opacity-60 italic">{ev.students} students</p>
                             </div>
                          </motion.div>
                        );
                      })}
                      <div 
                        className="absolute w-full h-1 bg-red-600/80 shadow-[0_0_15px_rgba(255,0,0,0.5)] z-20 flex items-center pointer-events-none" 
                        style={{ top: '220px' }}
                      >
                         <div className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-sm -ml-[100px] shadow-lg">NOW 10:12 AM</div>
                         <div className="w-3 h-3 bg-red-600 rounded-full -ml-[6px] ring-4 ring-red-100" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 py-4 px-2">
           <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-100 text-xs font-black text-gray-600 hover:border-blue-200 transition-all shadow-xs">
                 <Printer className="w-4 h-4" /> Print Week
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-100 text-xs font-black text-gray-600 hover:border-blue-200 transition-all shadow-xs">
                 <Download className="w-4 h-4" /> Export Calendar
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-100 text-xs font-black text-gray-600 hover:border-blue-200 transition-all shadow-xs">
                 <Copy className="w-4 h-4" /> Copy to Next Week
              </button>
           </div>
           <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-50 text-gray-600 text-xs font-black hover:bg-blue-900 hover:text-white transition-all shadow-xs">
                 <Share2 className="w-4 h-4" /> Share Schedule
              </button>
              <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-700 text-white text-xs font-black shadow-xl shadow-blue-500/20 hover:bg-blue-800 transition-all shadow-lg flex items-center gap-2 italic">
                 <Eye className="w-5 h-5" /> View Availability
              </button>
           </div>
        </div>
      </div>

      <div className="lg:w-80 w-full shrink-0">
        <TeacherCalendarsecondRight />
      </div>
    </div>
  );
};

export default TeacherCalendarsecond;
