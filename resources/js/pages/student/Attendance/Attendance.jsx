import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Flame,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import AttendaceRight from './AttendaceRight';
import apiFetch from '../../../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await apiFetch('/my/attendance');
        setAttendance(res.data || res);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present': return 'bg-green-50 text-green-700 border-green-100';
      case 'absent': return 'bg-red-50 text-red-600 border-red-100';
      case 'late': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const rate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 px-1 sm:px-4 lg:px-0 scroll-smooth pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 space-y-6 sm:space-y-8 min-w-0"
      >
        <motion.section
          variants={itemVariants}
          className="bg-green-500 rounded-[32px] p-5 sm:p-8 text-white shadow-xl relative overflow-hidden group"
        >
          <div className="relative">
            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-90 mb-6 text-center">
              📅 My Attendance Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {[
                { label: 'Days Present', value: presentCount, icon: '✅' },
                { label: 'Days Absent', value: absentCount, icon: '❌' },
                { label: 'Times Late', value: lateCount, icon: '⏰' },
                { label: 'Attendance Rate', value: `${rate}%`, icon: '🏆' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/20 backdrop-blur-md p-3 sm:p-5 rounded-2xl flex flex-col items-center text-center border border-white/10 shadow-sm"
                >
                  <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</span>
                  <h3 className="text-xl sm:text-3xl font-black">{stat.value}</h3>
                  <p className="text-[8px] sm:text-[10px] font-black uppercase opacity-70 mt-1.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm sm:text-base">
              My Attendance Details
            </h3>
          </div>

          <div className="space-y-4">
            {attendance.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 border-l-4 
                  ${item.status === 'present' ? 'border-l-green-400' : item.status === 'absent' ? 'border-l-red-400' : 'border-l-yellow-400'}`}
              >
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-gray-800 text-sm sm:text-base uppercase tracking-tight leading-tight">
                       {new Date(item.attendance_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                       {item.status}
                    </span>
                 </div>
                 {item.note && (
                    <p className="text-[11px] font-bold text-gray-400 italic mt-2">
                       💬 {item.note}
                    </p>
                 )}
              </motion.div>
            ))}
            {attendance.length === 0 && (
              <div className="text-center py-12 text-gray-400 italic">
                No attendance records found.
              </div>
            )}
          </div>
        </motion.section>
      </motion.div>

      <div className="lg:w-80 w-full">
        <AttendaceRight attendance={attendance} />
      </div>
    </div>
  );
};

export default Attendance;
