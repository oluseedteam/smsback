import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  HardHat, 
  FileText, 
  UserSquare2, 
  Search, 
  Filter, 
  MoreVertical,
  ArrowDownRight,
  Loader2,
  BookOpen,
  Award,
  Briefcase,
  Camera,
  ArrowRight,
  Sparkles,
  Mail,
  Clock,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../../../services/dashboardService';
import { getMediaGallery } from '../../../services/mediaService';
import AcademicSetupChecklist from '../../../components/AcademicSetupChecklist';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getDashboardSummary();
        setData(res.summary);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const stats = [
    { title: "Academic Sections", value: data?.academic_sections ?? 0, change: data?.current_session || 'No current session', up: true, icon: UserSquare2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Students", value: data?.total_students ?? 0, change: 'Active directory', up: true, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Teachers", value: data?.total_teachers ?? 0, change: 'Staff directory', up: true, icon: HardHat, color: "text-green-600", bg: "bg-green-50" },
    { title: "Pending Scores", value: data?.pending_score_submissions ?? 0, change: 'Teacher submitted', up: true, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Awaiting Approval", value: data?.results_awaiting_approval ?? 0, change: 'Report cards', up: true, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Released Results", value: data?.released_results ?? 0, change: 'Available to students', up: true, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Upcoming CBT", value: data?.upcoming_cbt_exams ?? 0, change: 'Published exams', up: true, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Failed Emails", value: data?.failed_report_card_emails ?? 0, change: 'Needs retry', up: false, icon: Mail, color: "text-red-600", bg: "bg-red-50" },
    { title: "Pending Promotion", value: data?.students_pending_promotion ?? 0, change: 'Third-term decisions', up: true, icon: Award, color: "text-yellow-700", bg: "bg-yellow-50" },
  ];

  const quickActions = [
    { label: 'Configure Assessment', path: '/admin/report-card/settings' },
    { label: 'Create CBT', path: '/admin/cbt-results' },
    { label: 'Review Results', path: '/admin/results' },
    { label: 'Release Results', path: '/admin/report-cards' },
    { label: 'View Email Failures', path: '/admin/report-cards' },
    { label: 'Promote Students', path: '/admin/promotions' },
  ];

  const attendanceData = data?.attendance_history || [
    { day: "MO", val: 0 },
    { day: "TU", val: 0 },
    { day: "WE", val: 0 },
    { day: "TH", val: 0 },
    { day: "FR", val: 0 },
  ];

  const maxVal = Math.max(...attendanceData.map(d => d.val), 10);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-950 text-white rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-blue-200 font-black">Current Academic Period</p>
          <h1 className="text-2xl font-black mt-1">{data?.current_session || 'No current session configured'}</h1>
          <p className="text-sm text-blue-200 mt-1">{data?.current_term || 'Set a current term in Academic Settings'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(action => (
            <Link key={action.label} to={action.path} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/10">
              {action.label}
            </Link>
          ))}
        </div>
      </div>
      
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all group"
          >
            <p className="text-sm font-bold text-gray-500 mb-4">{s.title}</p>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-black text-blue-900 tracking-tight mb-2">{s.value}</h3>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${s.up ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'}`}>
                   {s.change} <span className="opacity-60 normal-case font-bold tracking-normal italic ml-1">Live Update</span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${s.bg} ${s.color} transition-all group-hover:scale-110 shadow-sm shadow-blue-900/5`}>
                <s.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Academic Setup Readiness Checklist */}
      <AcademicSetupChecklist />

      {/* Chart Section */}
      <div className="bg-white rounded-[32px] md:rounded-[40px] p-4 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 md:mb-12 text-center md:text-left">
          <h2 className="text-lg md:text-xl font-black text-blue-900 italic tracking-tight underline decoration-blue-100 decoration-4 underline-offset-8">General Student Attendance</h2>
          <div className="text-[10px] md:text-[11px] font-black text-gray-600 bg-gray-50 rounded-xl px-4 md:px-5 py-2 md:py-3 uppercase tracking-wider">
            Last 7 Days
          </div>
        </div>

        <div className="relative h-[250px] md:h-[320px] flex items-end justify-between px-2 md:px-16 border-b border-gray-50 pb-4 overflow-x-auto gap-4">
           {/* Grid lines (simulated) */}
           <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2 md:pr-16 bg-gradient-to-t from-gray-50/20 to-transparent">
              {[100, 80, 60, 40, 20, 0].map(val => (
                <div key={val} className="flex items-center gap-2 md:gap-6 text-[10px] font-black text-gray-300">
                   <span className="w-6 md:w-8 text-right leading-none translate-y-[-1px] tabular-nums">{val}%</span>
                   <div className="flex-1 h-px bg-gray-100/30" />
                </div>
              ))}
           </div>

           {/* Bars */}
           {attendanceData.map((d, i) => (
             <div key={i} className="flex flex-col items-center justify-end h-full gap-2 md:gap-4 group relative z-10 flex-1 min-w-[40px] md:min-w-[60px] max-w-[80px]">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.val / maxVal) * 85 || 0}%` }}
                  transition={{ duration: 1.5, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-blue-900 rounded-t-xl md:rounded-t-2xl shadow-2xl shadow-blue-900/40 hover:bg-blue-800 transition-all cursor-pointer relative"
                >
                   <AnimatePresence>
                      <motion.div initial={{ opacity: 0, y: 10 }} whileHover={{ opacity: 1, y: 0 }} className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none italic whitespace-nowrap hidden md:group-hover:block transition-all z-20">
                         {d.val} Records
                      </motion.div>
                   </AnimatePresence>
                </motion.div>
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 group-hover:text-blue-900 transition-all uppercase tracking-widest italic">{d.day.slice(0,3)}</p>
             </div>
           ))}
        </div>
      </div>

      {/* Recent Contact Inquiries & Tour Requests Section */}
      <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-blue-900 font-heading">
                Recent Contact & Tour Inquiries
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Latest submissions received from website visitors
              </p>
            </div>
          </div>

          <Link
            to="/admin/inquiries"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition"
          >
            <span>View All Inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!data?.recent_inquiries || data.recent_inquiries.length === 0) ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl">
            <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No recent contact inquiries yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recent_inquiries.map((inq) => (
              <div
                key={inq.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-3 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {inq.name ? inq.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{inq.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {inq.inquiry_type}
                      </span>
                      {inq.status === 'pending' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {inq.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {inq.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-[11px] text-slate-400">
                    {inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                  <Link
                    to="/admin/inquiries"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Room Quick Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-[32px] p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-400/20 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 bg-sky-400/10 px-2.5 py-0.5 rounded-full border border-sky-400/20">
                Media & Gallery
              </span>
              <span className="text-xs text-slate-300">• {getMediaGallery().length} Photos Published</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold font-heading">
              Manage Campus Photos & Media Room
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Upload new photographs of student activities, competitions, academic labs, and press announcements to the public Media Room.
            </p>
          </div>
        </div>

        <Link
          to="/admin/media"
          className="px-6 py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Open Media Control</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
