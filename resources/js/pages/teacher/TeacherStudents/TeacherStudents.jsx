import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, LayoutGrid, List, MessageSquare,
  ChevronDown, ChevronUp,
  Download, Mail, Loader2
} from 'lucide-react';
import TeacherStudentsRight from './TeacherStudentsRight';
import { getClasses, getClass } from '../../../services/classService';
import apiFetch from '../../../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120 } },
};

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const isStudent = localStorage.getItem('role') === 'student';

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        let classesData;
        if (isStudent) {
          const res = await apiFetch('/my/classes');
          classesData = res?.school_classes || [];
        } else {
          classesData = await getClasses();
        }
        
        const list = Array.isArray(classesData) ? classesData : (classesData?.data || []);
        setClasses(list);
        if (list.length > 0) {
          await handleClassChange(list[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [isStudent]);


  const handleClassChange = async (classId) => {
    setLoading(true);
    try {
      const classDetail = await getClass(classId);
      setSelectedClass(classDetail);
      const studentList = (classDetail.students || []).map(s => ({
        ...s,
        initials: s.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('') || '?',
        status: 'present',
      }));
      setStudents(studentList);
    } catch (error) {
      console.error("Failed to fetch class details:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = students.length;

  if (loading && classes.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0">
      {/* Main content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Student Roster – {selectedClass?.name || 'Class'}
            </h1>
            {!isStudent && (
              <div className="flex items-center gap-2 mt-2">
                <select 
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border-none outline-none cursor-pointer"
                  value={selectedClass?.id || ''}
                  onChange={(e) => handleClassChange(e.target.value)}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.grade_level}</option>
                  ))}
                </select>
              </div>
            )}
            {isStudent && selectedClass && (
              <span className="inline-block mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                {selectedClass.name} - {selectedClass.grade_level}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-xl border ${view === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-xl border ${view === 'grid' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="px-4 py-2 rounded-full text-xs font-bold border bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100">
            All Students ({totalStudents})
          </span>
        </div>

        {/* Search + bulk actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm bg-white shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
              <Mail className="w-4 h-4" /> Message All Parents
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export Roster
            </button>
          </div>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">
            {search ? 'No students match your search.' : 'No students in this class yet.'}
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map(student => {
              const isOpen = expanded === student.id;

              return (
                <motion.div
                  key={student.id}
                  variants={itemVariants}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm shrink-0">
                        {student.initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <h3 className="font-bold text-gray-800">{student.full_name}</h3>
                          <span className="text-xs text-gray-400 font-medium">{student.student_id || `STU-${student.id}`}</span>
                        </div>

                        {/* Info row */}
                        <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-gray-600">
                          <span>ID: <span className="font-bold text-gray-900">{student.student_id || 'N/A'}</span></span>
                          {student.department && (
                            <span>Dept: <span className="font-bold text-gray-900 capitalize">{student.department}</span></span>
                          )}
                          {student.email && (
                            <span>Email: <span className="font-bold text-gray-900">{student.email}</span></span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center shrink-0">
                        <button className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all">
                          View Profile
                        </button>
                        <button className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all">
                          Add Note
                        </button>
                        <button
                          onClick={() => setExpanded(isOpen ? null : student.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-gray-100 bg-gray-50 p-5 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Student Details</p>
                            <p className="text-sm text-gray-700 font-medium">Full Name: {student.full_name}</p>
                            <p className="text-sm text-gray-700">Student ID: {student.student_id || 'N/A'}</p>
                            {student.department && (
                              <p className="text-sm text-gray-700 capitalize">Department: {student.department}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                            <p className="text-sm text-gray-700">{student.email || 'No email provided'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Actions</p>
                            <button className="mt-1 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                              <MessageSquare className="w-3.5 h-3.5" /> Send message now
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="lg:w-80 w-full">
        <TeacherStudentsRight classData={selectedClass} students={students} />
      </div>
    </div>
  );
};

export default TeacherStudents;
