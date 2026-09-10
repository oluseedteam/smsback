import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2, AlertTriangle, Clock, Trophy,
  ChevronLeft, ChevronRight, List, LayoutGrid,
  Save, Send, Loader2
} from 'lucide-react';
import TeacherAttendanceRight from './TeacherAttendanceRight';
import { getClasses, getClass } from '../../../services/classService';
import { saveBulkAttendance } from '../../../services/attendanceService';

import PopupModal from '../../../components/PopupModal';

const statusConfig = {
  present: { label: 'Present', icon: CheckCircle2, ring: 'ring-green-400', bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-400' },
  absent:  { label: 'Absent',  icon: AlertTriangle, ring: 'ring-red-400',   bg: 'bg-red-50',    text: 'text-red-500',    dot: 'bg-red-400' },
  late:    { label: 'Late',    icon: Clock,          ring: 'ring-orange-400',bg: 'bg-orange-50', text: 'text-orange-500', dot: 'bg-orange-400' },
  excused: { label: 'Excused', icon: Clock,          ring: 'ring-blue-400',  bg: 'bg-blue-50',   text: 'text-blue-500',   dot: 'bg-blue-400' },
};

const TeacherAttendance = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('First');
  const [view, setView] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const classesData = await getClasses();
        setClasses(classesData);
        if (classesData.length > 0) {
          const firstClass = await getClass(classesData[0].id);
          setSelectedClass(firstClass);
          setStudents(firstClass.students.map(s => ({
            ...s,
            status: 'present', // Default to present
            time: null
          })));
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleClassChange = async (classId) => {
    setLoading(true);
    try {
      const classDetail = await getClass(classId);
      setSelectedClass(classDetail);
      setStudents(classDetail.students.map(s => ({
        ...s,
        status: 'present',
        time: null
      })));
    } catch (error) {
      console.error("Failed to fetch class details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id, nextStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const payload = {
        attendance_date: new Date().toISOString().split('T')[0],
        school_class_id: selectedClass.id,
        term: selectedTerm,
        records: students.map(s => ({
          student_id: s.id,
          status: s.status,
          arrival_time: s.time || null
        }))
      };
      await saveBulkAttendance(payload);
      setPopup({ isOpen: true, type: 'success', title: 'Saved!', message: 'Attendance has been saved successfully.' });
    } catch (error) {
      setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to save attendance: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const presentCount  = students.filter(s => s.status === 'present').length;
  const lateCount     = students.filter(s => s.status === 'late').length;

  const stats = [
    { label: 'Present Today',     value: `${presentCount}/${students.length}`, sub: students.length ? `${Math.round((presentCount/students.length)*100)}% rate` : '0%', icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Late Arrivals',     value: `${lateCount}`,   sub: 'Needs attention', icon: Clock, bg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Absences',          value: `${students.length - presentCount - lateCount}`,  sub: 'Check for excuses', icon: AlertTriangle, bg: 'bg-red-50', iconColor: 'text-red-500' },
    { label: 'Total Enrolled',    value: `${students.length}`, sub: 'Class capacity', icon: Trophy, bg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0">
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Attendance Tracking – {selectedClass?.name || 'No Class Selected'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <select 
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border-none outline-none cursor-pointer"
                value={selectedClass?.id || ''}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.grade_level}</option>
                ))}
              </select>
              <select 
                className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border-none outline-none cursor-pointer"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                <option value="First">First Term</option>
                <option value="Second">Second Term</option>
                <option value="Third">Third Term</option>
              </select>
              <span className="text-xs font-bold text-gray-400">📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <p className="text-2xl font-black text-gray-800">{s.value}</p>
              <p className="text-xs font-bold text-gray-600 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-800">Class Roll – {selectedClass?.name}</h2>
            <div className="flex gap-2">
              <button onClick={() => setView('grid')} className={`p-2 rounded-xl border ${view === 'grid' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('list')} className={`p-2 rounded-xl border ${view === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <button 
              onClick={() => markAll('present')}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 font-bold rounded-2xl text-xs hover:bg-green-100 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark All Present
            </button>
            <button 
              onClick={() => markAll('absent')}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 font-bold rounded-2xl text-xs hover:bg-red-100 transition-all"
            >
              Mark All Absent
            </button>
          </div>

          {view === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {students.map(s => {
                const sc = statusConfig[s.status] || statusConfig.present;
                const Icon = sc.icon;
                const statuses = ['present', 'absent', 'late', 'excused'];
                const next = statuses[(statuses.indexOf(s.status) + 1) % 4];
                return (
                  <motion.div
                    key={s.id}
                    whileHover={{ y: -2 }}
                    onClick={() => toggle(s.id, next)}
                    className={`flex flex-col items-center p-4 rounded-3xl border-2 cursor-pointer transition-all ${sc.ring} ring-2 ${sc.bg}`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-gray-100 to-gray-50 shadow-sm flex items-center justify-center font-bold text-gray-600 text-sm mb-3">
                      {s.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <p className="text-xs font-bold text-gray-800 text-center leading-tight">{s.full_name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-gray-500 text-center leading-tight truncate max-w-full">{s.full_name?.split(' ').slice(1).join(' ')}</p>
                    <div className={`flex items-center gap-1 mt-2 ${sc.text}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{sc.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {view === 'list' && (
            <div className="space-y-2">
              {students.map(s => {
                const sc = statusConfig[s.status] || statusConfig.present;
                const Icon = sc.icon;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {s.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <span className="flex-1 text-sm font-bold text-gray-800">{s.full_name}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${sc.bg} ${sc.text}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{sc.label}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {['present', 'absent', 'late', 'excused'].map(st => (
                        <button
                          key={st}
                          onClick={() => toggle(s.id, st)}
                          title={statusConfig[st].label}
                          className={`w-2 h-2 rounded-full transition-all ${s.status === st ? statusConfig[st].dot : 'bg-gray-200 hover:bg-gray-400'}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-72 w-full">
        <TeacherAttendanceRight />
      </div>

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
      />
    </div>
  );
};

export default TeacherAttendance;
