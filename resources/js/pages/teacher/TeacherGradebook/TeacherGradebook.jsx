import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Save,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Sliders,
  Award,
  Layers,
  HelpCircle,
  Lock
} from 'lucide-react';
import { getClasses } from '../../../services/classService';
import { getSubjects } from '../../../services/subjectService';
import {
  getScoreSheet,
  saveScoreSheet,
  submitScoreSheet,
  getAcademicSessions,
  getAffectiveAndPsychomotor,
  saveAffectiveAndPsychomotor
} from '../../../services/reportCardService';
import { confirmDialog } from '../../../services/dialogService';
import toast from 'react-hot-toast';

export default function TeacherGradebook() {
  const [activeTab, setActiveTab] = useState('scoresheet'); // 'scoresheet' | 'domains'
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Selectors
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Scoresheet data
  const [scoreSheetData, setScoreSheetData] = useState(null);
  const [scores, setScores] = useState({}); // { studentId: { [componentKey]: score } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Affective & Psychomotor data
  const [domainData, setDomainData] = useState(null);
  const [domainEntries, setDomainEntries] = useState({});
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [savingDomains, setSavingDomains] = useState(false);

  useEffect(() => {
    initFilters();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedSession && selectedTerm) {
      if (activeTab === 'scoresheet') {
        fetchScoreSheet();
      } else {
        fetchDomainData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, selectedTerm, selectedClass, selectedSubject, activeTab]);

  const initFilters = async () => {
    try {
      const [sessionsRes, classesRes, subjectsRes] = await Promise.all([
        getAcademicSessions(),
        getClasses(),
        getSubjects(),
      ]);

      const sessionList = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.data || []);
      const classList = Array.isArray(classesRes) ? classesRes : (classesRes?.data || []);
      const subjectList = Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []);

      setSessions(sessionList);
      setClasses(classList);
      setSubjects(subjectList);

      const activeSession = sessionList.find(s => s.is_current) || sessionList[0];
      if (activeSession) {
        setSelectedSession(activeSession.id);
        setSelectedTerm(activeSession.current_term || '1st Term');
      }
      if (classList.length > 0) setSelectedClass(classList[0].id);
      if (subjectList.length > 0) setSelectedSubject(subjectList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScoreSheet = async () => {
    setLoading(true);
    try {
      const data = await getScoreSheet({
        school_class_id: selectedClass,
        academic_session_id: selectedSession,
        term: selectedTerm,
        subject_id: selectedSubject,
      });

      setScoreSheetData(data);

      // Build local editable scores map
      const map = {};
      const components = data.config?.components || [];
      (data.students || []).forEach(s => {
        map[s.student_id] = Object.fromEntries(components.map(component => [
          component.key,
          s.assessment_scores?.[component.key] ?? '',
        ]));
      });
      setScores(map);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load marksheet.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainData = async () => {
    setLoadingDomains(true);
    try {
      const data = await getAffectiveAndPsychomotor({
        school_class_id: selectedClass,
        academic_session_id: selectedSession,
        term: selectedTerm,
      });
      setDomainData(data);

      const map = {};
      (data.students || []).forEach(s => {
        map[s.student_id] = {
          affective_ratings: s.affective_ratings || {},
          psychomotor_ratings: s.psychomotor_ratings || {},
          class_teacher_comment: s.class_teacher_comment || '',
          principal_comment: s.principal_comment || '',
        };
      });
      setDomainEntries(map);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load domain assessment data.');
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleScoreChange = (studentId, field, value) => {
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      }
    }));
  };

  const handleSaveScores = async () => {
    if (scoreSheetData?.is_locked) {
      return toast.error('This marksheet is locked because results have been approved or released.');
    }

    const components = scoreSheetData?.config?.components || [];

    // Validate scores
    for (const sc of Object.values(scores)) {
      for (const component of components) {
        const value = sc[component.key];
        if (component.type !== 'cbt' && value !== '' && (parseFloat(value) < 0 || parseFloat(value) > Number(component.max_score))) {
          return toast.error(`${component.label} must be between 0 and ${component.max_score}.`);
        }
      }
    }

    setSaving(true);
    try {
      const payloadScores = Object.keys(scores).map(studentId => {
        const assessmentScores = Object.fromEntries(components
          .filter(component => component.type !== 'cbt')
          .map(component => [
            component.key,
            scores[studentId][component.key] !== '' ? parseFloat(scores[studentId][component.key]) : null,
          ]));

        return {
          student_id: parseInt(studentId),
          ca1_score: assessmentScores.ca1 ?? null,
          ca2_score: assessmentScores.ca2 ?? null,
          exam_score: assessmentScores.written ?? assessmentScores.exam ?? null,
          assessment_scores: assessmentScores,
        };
      });

      const res = await saveScoreSheet({
        school_class_id: selectedClass,
        academic_session_id: selectedSession,
        term: selectedTerm,
        subject_id: selectedSubject,
        scores: payloadScores,
      });

      toast.success(res.message || 'Scores saved successfully!');
      fetchScoreSheet();
    } catch (e) {
      toast.error(e.message || 'Failed to save scores.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitScoreSheet = async () => {
    if (scoreSheetData?.is_locked) {
      return toast.error('This marksheet has already been approved/locked.');
    }
    const ok = await confirmDialog({
      title: 'Submit Marksheet',
      message: 'Submit this score sheet to Admin for final review and approval?',
      confirmText: 'Yes, Submit to Admin',
      type: 'primary',
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      await handleSaveScores();
      const res = await submitScoreSheet({
        school_class_id: selectedClass,
        academic_session_id: selectedSession,
        term: selectedTerm,
        subject_id: selectedSubject,
      });
      toast.success(res.message || 'Marksheet submitted to Admin.');
      fetchScoreSheet();
    } catch (e) {
      toast.error(e.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDomains = async () => {
    setSavingDomains(true);
    try {
      const entries = Object.keys(domainEntries).map(studentId => ({
        student_id: parseInt(studentId),
        affective_ratings: domainEntries[studentId].affective_ratings,
        psychomotor_ratings: domainEntries[studentId].psychomotor_ratings,
        class_teacher_comment: domainEntries[studentId].class_teacher_comment,
        principal_comment: domainEntries[studentId].principal_comment,
      }));

      const res = await saveAffectiveAndPsychomotor({
        school_class_id: selectedClass,
        academic_session_id: selectedSession,
        term: selectedTerm,
        entries,
      });

      toast.success(res.message || 'Behavioral ratings and comments saved!');
      fetchDomainData();
    } catch (e) {
      toast.error(e.message || 'Failed to save domain ratings.');
    } finally {
      setSavingDomains(false);
    }
  };

  const assessmentComponents = scoreSheetData?.config?.components || [];
  const isCbt = assessmentComponents.some(component => component.type === 'cbt');

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" /> Teacher Score Sheet & Marksheet
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Authoritative CA and Exam marksheets. Only students with confirmed course registrations appear.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'scoresheet' ? (
            <>
              <button
                onClick={handleSaveScores}
                disabled={saving || !scoreSheetData?.students?.length || scoreSheetData?.is_locked}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Scores
              </button>

              <button
                onClick={handleSubmitScoreSheet}
                disabled={submitting || !scoreSheetData?.students?.length || scoreSheetData?.is_locked}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit to Admin
              </button>
            </>
          ) : (
            <button
              onClick={handleSaveDomains}
              disabled={savingDomains || !domainData?.students?.length}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {savingDomains ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Domains & Comments
            </button>
          )}
        </div>
      </div>

      {/* Locked Notice */}
      {scoreSheetData?.is_locked && activeTab === 'scoresheet' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-xs font-bold">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>This marksheet is locked. The administration has approved or released these results. Contact an administrator to make changes.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('scoresheet')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'scoresheet' ? 'bg-white text-blue-900 shadow-sm font-black' : 'text-gray-500'
          }`}
        >
          <Award className="w-4 h-4" /> Academic Marksheet
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'domains' ? 'bg-white text-blue-900 shadow-sm font-black' : 'text-gray-500'
          }`}
        >
          <Layers className="w-4 h-4" /> Affective & Psychomotor
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Session */}
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Academic Session</label>
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subject (only for scoresheet) */}
          {activeTab === 'scoresheet' && (
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─── TAB 1: ACADEMIC MARKSHEET ─── */}
      {activeTab === 'scoresheet' && (
        <div className="space-y-4">
          {/* Assessment Config Info Bar */}
          {scoreSheetData && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-black text-slate-800 uppercase">{scoreSheetData.subject?.name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-slate-600 font-bold">{scoreSheetData.total_registered} Registered Students</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isCbt ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {isCbt ? 'Includes CBT (Auto-Scored)' : 'Teacher-Entered Assessment'}
                </span>
                <span className="text-gray-500 font-medium">
                  {assessmentComponents.map(component => `${component.label} (${component.max_score})`).join(' + ')} = {scoreSheetData.config.total_max}
                </span>
              </div>
            </div>
          )}

          {/* Marksheet Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading registered students...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-slate-50 text-gray-500 uppercase text-[10px] font-black tracking-wider">
                      <th className="p-4">Student</th>
                      {assessmentComponents.map(component => (
                        <th key={component.key} className="p-4 text-center w-32">
                          {component.label} (Max {component.max_score})
                          {component.type === 'cbt' && <span className="block text-[8px] text-purple-600 font-black">CBT VERIFIED</span>}
                        </th>
                      ))}
                      <th className="p-4 text-center w-24">Total</th>
                      <th className="p-4 text-center w-20">Grade</th>
                      <th className="p-4 text-center w-28">Remark</th>
                      <th className="p-4 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(scoreSheetData?.students || []).map((student) => {
                      const stScores = scores[student.student_id] || {};
                      const liveTotal = assessmentComponents.reduce((total, component) => {
                        const rawValue = component.type === 'cbt'
                          ? student.assessment_scores?.[component.key]
                          : stScores[component.key];
                        return total + (rawValue === '' || rawValue === null || rawValue === undefined ? 0 : Number(rawValue));
                      }, 0);

                      return (
                        <tr key={student.student_id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Student */}
                          <td className="p-4">
                            <div className="font-bold text-slate-800 text-sm">{student.student_name}</div>
                            <div className="text-[11px] font-mono text-blue-900 font-semibold">{student.student_identifier}</div>
                          </td>

                          {assessmentComponents.map(component => (
                            <td key={component.key} className="p-4 text-center">
                            {component.type === 'cbt' ? (
                              student.cbt_pending ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                  CBT Pending
                                </span>
                              ) : (
                                <div className="font-black text-purple-700 text-sm font-mono">
                                  {student.assessment_scores?.[component.key] ?? '-'} <span className="text-[10px] text-gray-400">({student.cbt_raw_percent}%)</span>
                                </div>
                              )
                            ) : (
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={component.max_score}
                                disabled={scoreSheetData?.is_locked}
                                value={stScores[component.key] ?? ''}
                                onChange={e => handleScoreChange(student.student_id, component.key, e.target.value)}
                                className="w-20 text-center bg-slate-50 border border-slate-200 rounded-xl py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                                placeholder="0.0"
                              />
                            )}
                            </td>
                          ))}

                          {/* Total */}
                          <td className="p-4 text-center font-black text-slate-900 text-sm">
                            {liveTotal.toFixed(1)}
                          </td>

                          {/* Grade */}
                          <td className="p-4 text-center font-black">
                            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-slate-100 text-slate-800">
                              {student.grade || '-'}
                            </span>
                          </td>

                          {/* Remark */}
                          <td className="p-4 text-center font-semibold text-slate-600">
                            {student.remark || '-'}
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              student.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              student.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {(!scoreSheetData?.students || scoreSheetData.students.length === 0) && (
                      <tr>
                        <td colSpan={assessmentComponents.length + 5} className="p-12 text-center text-gray-400 italic">
                          No students in this class have registered for {scoreSheetData?.subject?.name || 'this subject'} yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: AFFECTIVE & PSYCHOMOTOR ─── */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden">
            {loadingDomains ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading domain assessments...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {(domainData?.students || []).map((student) => {
                  const entry = domainEntries[student.student_id] || {
                    affective_ratings: {},
                    psychomotor_ratings: {},
                    class_teacher_comment: '',
                  };

                  return (
                    <div key={student.student_id} className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{student.student_name}</h4>
                          <span className="text-[11px] font-mono text-blue-900 font-semibold">{student.student_identifier}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Affective Traits */}
                        <div>
                          <h5 className="font-black text-blue-900 uppercase text-[10px] tracking-wider mb-2">
                            Affective Domain (1-{domainData?.max_rating_scale || 5})
                          </h5>
                          <div className="space-y-2">
                            {(domainData?.affective_traits || []).map((trait) => (
                              <div key={trait} className="flex items-center justify-between">
                                <span className="text-slate-700 font-medium">{trait}</span>
                                <select
                                  value={entry.affective_ratings?.[trait] || 5}
                                  onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setDomainEntries(prev => ({
                                      ...prev,
                                      [student.student_id]: {
                                        ...prev[student.student_id],
                                        affective_ratings: {
                                          ...prev[student.student_id]?.affective_ratings,
                                          [trait]: val,
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-16 bg-white border border-slate-200 rounded-lg p-1 text-center font-bold text-blue-900 outline-none"
                                >
                                  {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Psychomotor Skills */}
                        <div>
                          <h5 className="font-black text-blue-900 uppercase text-[10px] tracking-wider mb-2">
                            Psychomotor Domain (1-{domainData?.max_rating_scale || 5})
                          </h5>
                          <div className="space-y-2">
                            {(domainData?.psychomotor_traits || []).map((trait) => (
                              <div key={trait} className="flex items-center justify-between">
                                <span className="text-slate-700 font-medium">{trait}</span>
                                <select
                                  value={entry.psychomotor_ratings?.[trait] || 5}
                                  onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setDomainEntries(prev => ({
                                      ...prev,
                                      [student.student_id]: {
                                        ...prev[student.student_id],
                                        psychomotor_ratings: {
                                          ...prev[student.student_id]?.psychomotor_ratings,
                                          [trait]: val,
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-16 bg-white border border-slate-200 rounded-lg p-1 text-center font-bold text-blue-900 outline-none"
                                >
                                  {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Class Teacher Comment */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                          Class Teacher Comment
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. A dedicated and enthusiastic student..."
                          value={entry.class_teacher_comment || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setDomainEntries(prev => ({
                              ...prev,
                              [student.student_id]: {
                                ...prev[student.student_id],
                                class_teacher_comment: val,
                              }
                            }));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
