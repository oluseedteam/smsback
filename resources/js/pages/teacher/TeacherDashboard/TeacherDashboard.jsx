import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Activity,
  Award,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  PlusCircle,
  BarChart2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import TeacherDashboardRight from './TeacherDashboardRight';
import apiFetch from '../../../services/api';
import { getClasses } from '../../../services/classService';
import { getAssignments } from '../../../services/assignmentService';
import { getMessages } from '../../../services/messageService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const TeacherDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, classesRes, assignRes, msgRes] = await Promise.all([
          apiFetch('/dashboard/summary'),
          getClasses(),
          getAssignments(),
          getMessages({ sender_type: 'admin' })
        ]);
        setSummary(sumRes?.summary || {});
        setTeacherClasses(Array.isArray(classesRes) ? classesRes : (classesRes?.data || []));
        setAssignments(Array.isArray(assignRes) ? assignRes : (assignRes?.data || []));
        setBroadcasts(msgRes?.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const stats = [
    { title: 'My Students',            value: summary?.my_students || 0,        subtitle: 'Assigned to your classes', icon: Users,        bg: 'bg-green-100', iconColor: 'text-green-600' },
    { title: 'Results Entered',        value: summary?.results_entered || 0,    subtitle: 'Total grading done',       icon: CheckCircle2, bg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { title: 'My Classes',             value: summary?.my_classes || 0,         subtitle: 'Groups managed',           icon: BookOpen,     bg: 'bg-blue-100',   iconColor: 'text-blue-600' },
    { title: 'Attendance Today',       value: summary?.attendance_today || 0,   subtitle: 'Total records',            icon: Calendar,     bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ];

  const scheduleColors = [
    { accent: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-600' },
    { accent: 'border-l-purple-500', badge: 'bg-purple-50 text-purple-600' },
    { accent: 'border-l-green-500', badge: 'bg-green-50 text-green-600' },
    { accent: 'border-l-orange-500', badge: 'bg-orange-50 text-orange-600' },
  ];

  const schedule = teacherClasses.slice(0, 4).map((tc, i) => {
    const color = scheduleColors[i % scheduleColors.length];
    return {
      id: tc.id,
      time: tc.academic_year || 'Academic assignment',
      subject: tc.name,
      topic: (tc.subjects || []).map(subject => subject.name).join(', ') || tc.grade_level,
      room: tc.room || 'No room recorded',
      ...color
    };
  });

  const recentActivity = assignments.slice(0, 3).map((assign) => ({
    name: 'You',
    action: `assigned "${assign.title}"`,
    time: `Due: ${assign.due_date}`,
    status: 'review',
    type: 'success'
  }));

  const upcomingEvents = broadcasts.length > 0 ? broadcasts.slice(0, 3).map(b => ({
    day: '📢',
    label: b.content.substring(0, 30) + (b.content.length > 30 ? '...' : ''),
    sub: `Broadcasted on ${new Date(b.created_at).toLocaleDateString()}`,
    color: 'bg-blue-50 text-blue-600'
  })) : [
    { day: '✨', label: 'No new broadcasts', sub: 'Check back later', color: 'bg-gray-50 text-gray-400' }
  ];



  const quickActions = [
    { label: 'Record Attendance', icon: ClipboardCheck, path: '/teacher/attendance' },
    { label: 'Enter Grades',      icon: GraduationCap, path: '/teacher/gradebook' },
    { label: 'Send Message',      icon: MessageSquare, path: '/teacher/messages' },
    { label: 'Create Assignment', icon: PlusCircle, path: '/teacher/assignments' },
    { label: 'Schedule Meeting',  icon: Calendar, path: '/teacher/calendar' },
    { label: 'View Reports',      icon: BarChart2, path: '/teacher/results' },
  ];

  const attentionItems = [
    { label: 'Draft score sheets', value: summary?.pending_submissions || 0, path: '/teacher/gradebook' },
    { label: 'Submitted results', value: summary?.submitted_results || 0, path: '/teacher/results' },
    { label: 'Returned or rejected results', value: summary?.returned_results || 0, path: '/teacher/gradebook' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const teacherName = JSON.parse(localStorage.getItem('user'))?.full_name || 'Teacher';

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0">
      {/* ── Main column ─────────────────────────── */}
      <motion.div
        className="flex-1 space-y-8 min-w-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Banner */}
        <div className="bg-blue-700 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Welcome back, {teacherName}! ✨</h1>
            <p className="text-sm opacity-70">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className={`inline-flex p-2 rounded-xl bg-white/20 mb-3`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold">{s.value}</h3>
                  <p className="text-xs font-semibold mt-1 leading-snug">{s.title}</p>
                  <p className="text-[10px] opacity-60 mt-1">{s.subtitle}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" />
        </div>

        {/* Assigned Classes */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-blue-600" /> Assigned Classes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {schedule.length > 0 ? schedule.map((s, i) => (
              <div key={i} className={`p-4 rounded-2xl bg-gray-50 border-l-4 ${s.accent} hover:bg-white hover:shadow-md transition-all`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.time}</p>
                <h3 className="font-bold text-gray-800 text-base mb-0.5">{s.subject}</h3>
                <p className="text-xs text-gray-500 mb-3">{s.topic} • {s.room}</p>
                <span className={`inline-flex text-[10px] font-bold px-3 py-1.5 rounded-xl ${s.badge}`}>Assigned class</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 py-4 col-span-2">No assigned classes found.</p>
            )}
          </div>
        </motion.div>

        {/* Recent Student Activity */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-600" /> Recent Student Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.type === 'danger' ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <Users className={`w-4 h-4 ${a.type === 'danger' ? 'text-red-500' : 'text-blue-500'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-bold">{a.name}</span> {a.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 py-4">No recent activity found.</p>
            )}
          </div>

          {/* Needs Attention */}
          <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <h3 className="text-sm font-bold text-orange-600 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" /> Needs Attention
            </h3>
            {attentionItems.length > 0 ? attentionItems.map((item) => (
              <a key={item.label} href={item.path} className="flex justify-between items-center text-xs text-orange-700 py-1.5 border-b border-orange-100 last:border-0">
                <span>{item.label}</span>
                <span className="bg-orange-100 text-orange-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">
                  {item.value}
                </span>
              </a>
            )) : <p className="text-xs text-orange-700">No grading follow-ups are pending.</p>}
          </div>
        </motion.div>

        {/* Upcoming This Week */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-blue-600" /> Upcoming This Week
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((e, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 ${e.color} rounded-2xl`}>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-sm">
                  {e.day}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{e.label}</h4>
                  <p className="text-xs text-gray-500">{e.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Right sidebar ────────────────────────── */}
      <div className="lg:w-80 w-full">
        <TeacherDashboardRight 
          quickActions={quickActions} 
          performers={summary?.performers}
          performance={summary?.performance}
        />
      </div>
    </div>
  );
};

export default TeacherDashboard;
