import React from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  MoreHorizontal, 
  TrendingUp, 
  Trophy,
  Activity,
  Heart,
  ChevronRight,
  Mail,
  Phone,
  Settings,
  Send,
  UserCheck,
  FileText,
  MessageCircle,
  BarChart3
} from 'lucide-react';

const CheckCircle = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TeacherAttendacesecondRight = () => {
  return (
    <div className="space-y-6">
      {/* Emma's Attendance Overview */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800">Emma's Overview</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-gray-500">Progress to Perfect Attendance</span>
              <span className="text-blue-600">18/20 days</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '90%' }} />
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-xs font-medium text-gray-500">Class Average Comparison</span>
            <span className="text-xs font-bold text-gray-800">96% vs 95.8%</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-xs font-medium text-gray-500">Term-over-Term Trend</span>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +2%
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-medium text-gray-500">Attendance Streak</span>
            <span className="text-xs font-bold text-blue-600 font-mono">15 consecutive days</span>
          </div>
        </div>
      </motion.div>

      {/* Absence Analysis */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-800">Absence Analysis</h3>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {[
            { label: 'Excused Absences', value: '2 days', color: 'text-blue-600' },
            { label: 'Illness', value: '2', color: 'text-gray-700' },
            { label: 'Appointments', value: '0', color: 'text-gray-700' },
            { label: 'Family', value: '0', color: 'text-gray-700' },
            { label: 'Unexcused Absences', value: '0 days', color: 'text-red-500 font-bold' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">• {item.label}</span>
              <span className={`text-[11px] font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-2xl border border-green-100">
          <p className="text-[10px] text-green-700 font-bold leading-tight">
            ✓ No pattern detected in absence days.
          </p>
        </div>
      </div>

      {/* Tardiness Patterns */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-gray-800">Tardiness Patterns</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Total Late Arrivals</span>
            <span className="text-xs font-bold text-gray-800">1 this term</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Average Late Time</span>
            <span className="text-xs font-bold text-gray-800">22 minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Most Common Day</span>
            <span className="text-xs font-bold text-blue-600">Thursday</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-[10px] text-blue-700 font-bold leading-tight uppercase tracking-tight">
            Reporting — no tardies last 2 weeks.
          </p>
        </div>
      </div>

      {/* Parent Communication */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-gray-800">Parent Communication</h3>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email (Primary)</p>
              <p className="text-xs font-bold text-gray-700">jennifer.johnson@email.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Phone className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
              <p className="text-xs font-bold text-gray-700">(555) 123-4567</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Notification Settings:</p>
          {['Daily attendance updates', 'Absence alerts', 'Tardy notifications'].map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle size={12} className="text-green-500" />
              <span className="text-[11px] font-medium text-gray-600">{n}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
          Send Message
        </button>
        <p className="text-center text-[9px] text-gray-400 mt-2">Last communication: Oct 17</p>
      </div>

      {/* Actions & Follow-up */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" /> Actions & Follow-up
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Mark Absent', icon: UserCheck },
            { label: 'Add Note', icon: FileText },
            { label: 'Request Parent Meeting', icon: MessageCircle },
            { label: 'Generate Attendance Letter', icon: FileText },
            { label: 'Excuse Absence', icon: UserCheck },
          ].map((action, i) => (
            <button key={i} className="w-full flex items-center gap-2.5 p-3 rounded-2xl border border-gray-50 hover:bg-gray-50 hover:border-gray-200 transition-all text-left group">
              <action.icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goals & Incentives */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-gray-800">Goals & Incentives</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
              <span>Perfect Attendance Badge</span>
              <span className="text-gray-700">18/20 days</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }} />
            </div>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-medium text-gray-500">Class Rank</span>
            <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg">8th of 28</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-medium text-gray-500">Term Goal: 96%</span>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">On track <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>
      </div>

      {/* Related Information */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" /> Related Information
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Recent Grades', value: 'A- (89%)', color: 'text-blue-600' },
            { label: 'Homework Completion', value: '15/18', color: 'text-gray-700' },
            { label: 'Class Participation', value: 'Active', color: 'text-green-600' },
            { label: 'Behavioral Concerns', value: 'None', color: 'text-gray-500' },
          ].map((info, i) => (
            <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <span className="text-[11px] font-medium text-gray-400">{info.label}</span>
              <span className={`text-[11px] font-bold ${info.color}`}>{info.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-2">
          <Heart className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[9px] text-red-700 font-bold leading-tight">
            Health Alert: Peanut allergy on file
          </p>
        </div>
      </div>

      {/* Historical Comparison */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" /> Historical Comparison
        </h3>
        <div className="h-24 w-full bg-linear-to-b from-indigo-50/50 to-white rounded-2xl flex items-end justify-between px-4 pb-2">
          {[40, 60, 55, 75, 70, 85, 80].map((h, i) => (
            <motion.div 
              key={i} 
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.1 }}
              className="w-2 bg-indigo-500/20 rounded-t-sm"
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 px-1 text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
          <span>TR 1Q 22</span>
          <span>TR 2Q 23</span>
          <span>TR 3Q 23</span>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendacesecondRight;
