import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  CheckCircle, 
  Save, 
  Loader2, 
  Award, 
  Calendar, 
  AlertCircle, 
  Search, 
  Filter, 
  Layers, 
  CheckSquare, 
  RotateCcw,
  School,
  GraduationCap
} from 'lucide-react';
import { getAvailableSubjects, registerCourses, getAcademicSessions } from '../../../services/reportCardService';
import { getClasses } from '../../../services/classService';
import toast from 'react-hot-toast';

export default function CourseRegistrationPage() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentClassName, setCurrentClassName] = useState('');
  const [studentName, setStudentName] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [registrationDeadline, setRegistrationDeadline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & category filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'registered' | 'compulsory' | 'elective'

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedSession && selectedTerm) {
      fetchSubjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, selectedTerm, selectedClass]);

  const init = async () => {
    try {
      const [sessionsRes, classesRes] = await Promise.all([
        getAcademicSessions(),
        getClasses().catch(() => []),
      ]);

      const sessionList = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.data || []);
      const rawClassList = Array.isArray(classesRes) ? classesRes : (classesRes?.data || []);

      setSessions(sessionList);
      setClasses(rawClassList);

      const activeSession = sessionList.find(s => s.is_current) || sessionList[0];
      if (activeSession) {
        setSelectedSession(activeSession.id);
        setSelectedTerm(activeSession.current_term || '1st Term');
      }

      if (rawClassList.length > 0) {
        setSelectedClass(rawClassList[0].id);
        setCurrentClassName(rawClassList[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await getAvailableSubjects({
        academic_session_id: selectedSession,
        term: selectedTerm,
        school_class_id: selectedClass || undefined,
      });

      const list = res.subjects || [];
      setSubjects(list);
      setIsRegistrationOpen(res.is_registration_open ?? true);
      setRegistrationDeadline(res.registration_deadline ?? null);
      if (res.class_id && !selectedClass) {
        setSelectedClass(res.class_id);
      }
      if (res.class_name) {
        setCurrentClassName(res.class_name);
      }
      if (res.student?.name) {
        setStudentName(res.student.name);
      }

      // If classes list wasn't populated earlier, populate from backend response
      if (classes.length === 0 && res.class_id && res.class_name) {
        setClasses([{ id: res.class_id, name: res.class_name }]);
      }

      // Compulsory subjects must always be selected
      const compulsoryIds = list.filter(s => s.is_compulsory).map(s => s.id);
      const registeredIds = list.filter(s => s.is_registered).map(s => s.id);
      const initialSelected = Array.from(new Set([...compulsoryIds, ...registeredIds]));
      setSelectedSubjectIds(initialSelected);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load school subjects.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubject = (subject) => {
    if (!isRegistrationOpen) {
      return toast.error('Course registration is closed for this session.');
    }
    if (subject.is_compulsory && selectedSubjectIds.includes(subject.id)) {
      return toast.error(`${subject.name} is a compulsory subject and cannot be deselected.`);
    }

    setSelectedSubjectIds(prev =>
      prev.includes(subject.id)
        ? prev.filter(id => id !== subject.id)
        : [...prev, subject.id]
    );
  };

  const handleSelectAll = () => {
    if (!isRegistrationOpen) return;
    const compulsoryIds = subjects.filter(s => s.is_compulsory).map(s => s.id);
    if (selectedSubjectIds.length === subjects.length) {
      // Reset back to compulsory only
      setSelectedSubjectIds(compulsoryIds);
      toast.success('Reset selection to compulsory subjects.');
    } else {
      setSelectedSubjectIds(subjects.map(s => s.id));
      toast.success(`Selected all ${subjects.length} school subjects.`);
    }
  };

  const handleSaveRegistration = async () => {
    if (!isRegistrationOpen) {
      return toast.error('Course registration is closed for this session.');
    }
    if (selectedSubjectIds.length === 0) {
      return toast.error('Please select at least one subject to register.');
    }

    setSaving(true);
    try {
      const targetClassId = selectedClass || (classes[0]?.id ?? 1);
      const res = await registerCourses({
        school_class_id: targetClassId,
        academic_session_id: selectedSession,
        term: selectedTerm,
        subject_ids: selectedSubjectIds,
      });

      toast.success(res.message || 'Course registration completed successfully!');
      fetchSubjects();
    } catch (e) {
      toast.error(e.message || 'Failed to complete course registration.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered and searched subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesSearch = 
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.teacher_name && subject.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === 'registered') return selectedSubjectIds.includes(subject.id);
      if (activeFilter === 'compulsory') return subject.is_compulsory;
      if (activeFilter === 'elective') return !subject.is_compulsory;
      return true;
    });
  }, [subjects, searchQuery, activeFilter, selectedSubjectIds]);

  const compulsoryCount = subjects.filter(s => s.is_compulsory).length;
  const electiveCount = subjects.length - compulsoryCount;
  const registeredCount = selectedSubjectIds.length;

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" /> Student Course Registration
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Register your subjects from all approved school offerings. Your official terminal report card and gradebook will reflect these registered courses.
          </p>
        </div>

        <button
          onClick={handleSaveRegistration}
          disabled={saving || subjects.length === 0 || !isRegistrationOpen}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Confirm & Save Registration</span>
        </button>
      </div>

      {/* Registration Status Warning if closed */}
      {!isRegistrationOpen && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-800 text-xs font-bold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>
            Course registration is currently closed for this academic session.
            {registrationDeadline && ` Deadline was: ${new Date(registrationDeadline).toLocaleDateString()}.`}
            {' '}Please contact school administration if you require late registration.
          </span>
        </div>
      )}

      {/* Student & Class Details Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Enrolled Student Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">{studentName || 'Student Profile'}</h2>
          <p className="text-xs text-slate-300 flex items-center gap-2">
            <span>Class: <strong className="text-white">{currentClassName || 'Primary / Secondary Class'}</strong></span>
            <span>•</span>
            <span>Session: <strong className="text-white">{sessions.find(s => s.id === Number(selectedSession))?.name || 'Current Session'}</strong></span>
            <span>•</span>
            <span>Term: <strong className="text-white">{selectedTerm}</strong></span>
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-blue-200">School Total</div>
            <div className="text-lg font-black text-white">{subjects.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-emerald-300">Selected</div>
            <div className="text-lg font-black text-emerald-300">{registeredCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-amber-300">Compulsory</div>
            <div className="text-lg font-black text-amber-300">{compulsoryCount}</div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Academic Session */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Academic Session</label>
              <select
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Term</label>
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            {/* Class (if multiple) */}
            {classes.length > 1 && (
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Class / Section</label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    setSelectedClass(e.target.value);
                    const found = classes.find(c => String(c.id) === String(e.target.value));
                    if (found) setCurrentClassName(found.name);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              disabled={!isRegistrationOpen || subjects.length === 0}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-40"
            >
              {selectedSubjectIds.length === subjects.length ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Compulsory</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select All Subjects ({subjects.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Pills */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search school subjects by title or code..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({subjects.length})
            </button>
            <button
              onClick={() => setActiveFilter('registered')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === 'registered'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Registered ({registeredCount})
            </button>
            <button
              onClick={() => setActiveFilter('compulsory')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === 'compulsory'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Compulsory ({compulsoryCount})
            </button>
            <button
              onClick={() => setActiveFilter('elective')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === 'elective'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Electives ({electiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading all school subjects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredSubjects.map((s) => {
            const isChecked = selectedSubjectIds.includes(s.id);

            return (
              <div
                key={s.id}
                onClick={() => handleToggleSubject(s)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isChecked
                    ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-400/30'
                    : 'bg-white border-gray-100 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="space-y-1.5 pr-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                      {s.code}
                    </span>
                    {s.is_compulsory ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-amber-800">
                        Compulsory
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-600">
                        Elective
                      </span>
                    )}
                    {s.status === 'withdrawn' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-700">
                        Withdrawn
                      </span>
                    )}
                    {s.is_registered && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800">
                        Registered
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-slate-900 text-sm leading-tight">{s.name}</h3>
                  {s.teacher_name ? (
                    <p className="text-[11px] text-gray-500 font-medium">Teacher: {s.teacher_name}</p>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">Department Faculty</p>
                  )}
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  isChecked
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border-2 border-gray-200 group-hover:border-blue-500'
                }`}>
                  {isChecked && <CheckCircle className="w-4 h-4" />}
                </div>
              </div>
            );
          })}

          {filteredSubjects.length === 0 && (
            <div className="col-span-full p-12 bg-white rounded-3xl border border-gray-100 text-center text-gray-400 italic space-y-2">
              <p>No subjects matched your filter criteria.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-blue-600 underline cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
