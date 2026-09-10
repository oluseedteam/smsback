import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  AlertCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Plus, 
  ChevronRight, 
  TrendingUp,
  Mail,
  MoreHorizontal,
  CheckCircle,
  Link2,
  FileText,
  Video
} from 'lucide-react';

const TeacherCalendarsecondRight = () => {
  return (
    <div className="space-y-6">
      {/* Today's Highlights */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-black text-gray-800 text-sm italic">Today's Highlights</h3>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100/50 group hover:bg-orange-100 transition-all cursor-pointer">
            <h4 className="text-xs font-black text-orange-700 leading-tight">English in 45 minutes</h4>
            <p className="text-[10px] text-orange-600 mt-1 font-bold">Room 4B • Creative Writing lesson</p>
          </div>
          
          <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 group hover:bg-blue-100 transition-all cursor-pointer">
            <h4 className="text-xs font-black text-blue-700 leading-tight italic">Pending Tasks</h4>
            <p className="text-[10px] text-blue-600 mt-1 font-bold">3 assignments to grade</p>
            <p className="text-[10px] text-blue-600 font-bold italic">1 parent meeting at 3:30 PM</p>
          </div>

          <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100/50 group hover:bg-red-100 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h4 className="text-xs font-black text-red-700 leading-tight flex items-center gap-1.5 uppercase tracking-tight">
               <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /> Reminder
            </h4>
            <p className="text-[10px] text-red-600 mt-1 font-bold">Field trip forms due tomorrow!</p>
          </div>
        </div>
      </motion.div>

      {/* This Week Summary */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-2">
             <Calendar className="w-5 h-5 text-blue-600" />
             <h3 className="font-black text-gray-800 text-sm">This Week Summary</h3>
           </div>
           <button className="p-1 rounded-lg hover:bg-gray-50 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
           </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold leading-none">
            <span className="text-gray-400 uppercase tracking-widest text-[9px]">Teaching Hours</span>
            <span className="text-blue-700 text-sm">22.5 hrs</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold leading-none py-2 border-b border-gray-50">
            <span className="text-gray-400 uppercase tracking-widest text-[9px]">Total Classes</span>
            <span className="text-gray-800 text-sm">20 periods</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold leading-none py-2 border-b border-gray-50">
            <span className="text-gray-400 uppercase tracking-widest text-[9px]">Prep Time</span>
            <span className="text-blue-500 text-sm">3.5 hrs</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold leading-none pt-1">
            <span className="text-gray-400 uppercase tracking-widest text-[9px]">Meetings</span>
            <span className="text-red-500 text-sm">2</span>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100/50">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-blue-600 rounded-full" />
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-3">Week 65% complete</p>
          </div>
        </div>
      </div>

      {/* Quick Add Event Form */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 overflow-hidden relative">
        <h3 className="font-black text-gray-800 text-sm mb-5 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-500" /> Quick Add Event
        </h3>
        <div className="space-y-3">
          <input type="text" placeholder="Event Title" className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-[11px] font-black focus:ring-2 focus:ring-blue-500 outline-hidden transition-all shadow-xs" />
          <input type="text" placeholder="Location/Room" className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-[11px] font-black focus:ring-2 focus:ring-blue-500 outline-hidden transition-all shadow-xs" />
          
          <div className="grid grid-cols-2 gap-3">
             <div className="relative">
                <input type="text" placeholder="09:00" className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-[11px] font-black italic focus:ring-2 focus:ring-blue-500 outline-hidden transition-all" />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
             </div>
             <div className="relative">
                <input type="text" placeholder="10:00" className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-[11px] font-black italic focus:ring-2 focus:ring-blue-500 outline-hidden transition-all" />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
             </div>
          </div>

          <div className="flex items-center gap-2 pl-1 py-1">
             <input type="checkbox" id="recurring" className="w-4 h-4 rounded-lg bg-gray-100 border-gray-200 text-blue-600 focus:ring-blue-500 focus:ring-offset-0" />
             <label htmlFor="recurring" className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter cursor-pointer">Recurring weekly</label>
          </div>

          <button className="w-full py-4 bg-blue-950 text-white rounded-[20px] text-[11px] font-black hover:bg-blue-900 shadow-xl shadow-blue-500/10 transition-all h-12">
            Add to Schedule
          </button>
        </div>
      </div>

      {/* Conflicts & Alerts */}
      <div className="bg-red-50/20 rounded-[32px] p-6 shadow-sm border border-red-100/50 ring-1 ring-red-50/50">
        <div className="flex items-center gap-2 mb-4">
           <AlertCircle className="w-5 h-5 text-red-500" />
           <h3 className="font-black text-red-800 text-sm uppercase tracking-tight">Conflicts & Alerts</h3>
        </div>
        <div className="p-4 bg-green-50 rounded-2xl border border-green-100/50">
           <p className="text-[11px] text-green-700 font-bold flex items-center gap-2 italic leading-tight">
             <CheckCircle className="w-4 h-4 shrink-0" /> No scheduling conflicts detected
           </p>
        </div>
      </div>

      {/* Room Assignments */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-800 text-sm mb-5 flex items-center gap-2 italic">
          <MapPin className="w-5 h-5 text-indigo-500" /> Room Assignments
        </h3>
        <div className="space-y-2">
          {[
            { room: 'Home Room: Room 4B', status: 'Primary', color: 'bg-blue-600' },
            { room: 'Science Lab (Tue/Thu)', status: 'Booked', color: 'bg-blue-900' },
            { room: 'Art Room (Tue/Fri)', status: 'Booked', color: 'bg-blue-800' },
            { room: 'Gymnasium (M/W/F)', status: 'Booked', color: 'bg-green-600' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-2xl border border-gray-50 bg-gray-50/30 group hover:bg-white hover:shadow-2xl hover:shadow-gray-100/50 transition-all cursor-pointer">
              <span className="text-[11px] font-black text-gray-600">{item.room}</span>
              <span className={`text-[8px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-widest ${item.color}`}>{item.status}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-1">
          Request room change <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lesson Plans */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5 italic">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <h3 className="font-black text-gray-800 text-sm">Lesson Plans</h3>
        </div>
        <p className="text-[10px] font-bold text-gray-400 mb-4 px-1 uppercase tracking-tight">Quick access to this week's plans</p>
        <div className="space-y-2">
          {[
            { label: 'Math - Addition & Subtraction', icon: FileText },
            { label: 'English - Creative Writing', icon: FileText },
            { label: 'Science - Plants & Animals', icon: Video },
            { label: 'Social Studies - Community', icon: Link2 },
          ].map((plan, i) => (
            <button key={i} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-purple-50 hover:shadow-xs transition-all text-left text-blue-700 group">
              <plan.icon className="w-4 h-4 text-purple-400 group-hover:text-purple-600" />
              <span className="text-[11px] font-black underline group-hover:no-underline">{plan.label}</span>
            </button>
          ))}
        </div>
        <button className="w-full py-3.5 bg-blue-700 text-white rounded-2xl text-[11px] font-black hover:bg-blue-800 shadow-xl shadow-blue-100 transition-all mt-6 shadow-lg shadow-blue-100 uppercase tracking-widest">
           Upload Materials
        </button>
      </div>
    </div>
  );
};

export default TeacherCalendarsecondRight;
