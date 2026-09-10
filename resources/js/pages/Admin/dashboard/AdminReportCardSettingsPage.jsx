import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  School,
  Calendar,
  Layers,
  Award,
  Mail,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle,
  Sliders,
  FileText
} from 'lucide-react';
import {
  getReportCardSettings,
  updateReportCardSettings,
  createAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
  createGradingScale,
  updateGradingScale,
  deleteGradingScale,
  resetGradingScales,
  saveAssessmentConfig
} from '../../../services/reportCardService';
import { confirmDialog, promptDialog } from '../../../services/dialogService';
import toast from 'react-hot-toast';

export default function AdminReportCardSettingsPage() {
  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data from backend
  const [settings, setSettings] = useState({});
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradingScales, setGradingScales] = useState([]);
  const [assessmentConfigs, setAssessmentConfigs] = useState([]);

  // New Session form
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionCurrent, setNewSessionCurrent] = useState(false);
  const [newSessionStart, setNewSessionStart] = useState('');
  const [newSessionEnd, setNewSessionEnd] = useState('');

  // New Grading scale form
  const [newScale, setNewScale] = useState({
    school_class_id: '',
    academic_session_id: '',
    grade: 'A',
    min_score: 75,
    max_score: 100,
    remark: 'Excellent',
    grade_point: 4.0,
  });

  // Selected scope for grading scale viewer
  const [scaleScopeClass, setScaleScopeClass] = useState('');
  const [scaleScopeSession, setScopeSession] = useState('');

  // Assessment config form
  const [assessmentForm, setAssessmentForm] = useState({
    school_class_id: '',
    academic_session_id: '',
    subject_id: '',
    term: '1st Term',
    ca1_max: 20,
    ca2_max: 20,
    assignment_max: 0,
    test_max: 0,
    project_max: 0,
    attendance_max: 0,
    cbt_max: 0,
    written_max: 60,
    exam_max: 60,
    total_max: 100,
    exam_method: 'written',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getReportCardSettings();
      setSettings(res.settings || {});
      setSessions(res.sessions || []);
      setClasses(res.classes || []);
      setSubjects(res.subjects || []);
      setGradingScales(res.grading_scales || []);
      setAssessmentConfigs(res.assessment_configurations || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load report card settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateReportCardSettings(settings);
      toast.success('Settings updated successfully!');
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName) return;
    try {
      await createAcademicSession({
        name: newSessionName,
        is_current: newSessionCurrent,
        terms: ['1st Term', '2nd Term', '3rd Term'],
        current_term: '1st Term',
        start_date: newSessionStart || null,
        end_date: newSessionEnd || null,
      });
      toast.success(`Academic Session ${newSessionName} created!`);
      setNewSessionName('');
      setNewSessionCurrent(false);
      setNewSessionStart('');
      setNewSessionEnd('');
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'Failed to create session.');
    }
  };

  const handleDeleteSession = async (session) => {
    const ok = await confirmDialog({
      title: 'Delete Academic Session',
      message: `Delete ${session.name}? Sessions with academic history cannot be deleted.`,
      confirmText: 'Yes, Delete',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await deleteAcademicSession(session.id);
      toast.success(`${session.name} deleted.`);
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'This session cannot be deleted.');
    }
  };

  const handleAddGradingScale = async (e) => {
    e.preventDefault();
    try {
      await createGradingScale({
        ...newScale,
        school_class_id: newScale.school_class_id || null,
        academic_session_id: newScale.academic_session_id || null,
      });
      toast.success('Grading scale rule added.');
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'Failed to add grading rule.');
    }
  };

  const handleDeleteGradingScale = async (id) => {
    try {
      await deleteGradingScale(id);
      toast.success('Grading scale rule removed.');
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'Failed to remove rule.');
    }
  };

  const handleEditGradingScale = async (scale) => {
    const minScore = await promptDialog({
      title: 'Edit Minimum Score',
      message: `Minimum score (%) for grade ${scale.grade}:`,
      defaultValue: String(scale.min_score),
    });
    if (minScore === null) return;

    const maxScore = await promptDialog({
      title: 'Edit Maximum Score',
      message: `Maximum score (%) for grade ${scale.grade}:`,
      defaultValue: String(scale.max_score),
    });
    if (maxScore === null) return;

    const remark = await promptDialog({
      title: 'Edit Grade Remark',
      message: `Remark for grade ${scale.grade}:`,
      defaultValue: scale.remark || '',
    });
    if (remark === null) return;

    try {
      await updateGradingScale(scale.id, { min_score: minScore, max_score: maxScore, remark });
      toast.success('Grading rule updated.');
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'Failed to update grading rule.');
    }
  };

  const handleResetScales = async () => {
    const ok = await confirmDialog({
      title: 'Reset Grading Scales',
      message: 'Reset grading scales in this scope to standard GHRA defaults?',
      confirmText: 'Yes, Reset Defaults',
      type: 'warning',
    });
    if (!ok) return;
    try {
      await resetGradingScales({
        school_class_id: scaleScopeClass || undefined,
        academic_session_id: scaleScopeSession || undefined,
      });
      toast.success('Reset to standard grading scales.');
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'Failed to reset.');
    }
  };

  const handleSaveAssessmentConfig = async (e) => {
    e.preventDefault();
    try {
      const componentDefinitions = [
        ['ca1', 'CA 1', 'continuous_assessment', assessmentForm.ca1_max],
        ['ca2', 'CA 2', 'continuous_assessment', assessmentForm.ca2_max],
        ['assignment', 'Assignment', 'assignment', assessmentForm.assignment_max],
        ['test', 'Test', 'test', assessmentForm.test_max],
        ['project', 'Project', 'project', assessmentForm.project_max],
        ['attendance', 'Attendance', 'attendance', assessmentForm.attendance_max],
        ['cbt', 'CBT', 'cbt', assessmentForm.cbt_max],
        ['written', 'Written Exam', 'written', assessmentForm.written_max],
      ];
      const components = componentDefinitions
        .filter(([, , , maxScore]) => Number(maxScore) > 0)
        .map(([key, label, type, maxScore]) => ({ key, label, type, max_score: Number(maxScore) }));
      const totalMax = components.reduce((total, component) => total + component.max_score, 0);
      if (totalMax <= 0) {
        return toast.error('Configure at least one assessment component.');
      }

      await saveAssessmentConfig({
        ...assessmentForm,
        components,
        total_max: totalMax,
        exam_max: Number(assessmentForm.cbt_max) + Number(assessmentForm.written_max),
        exam_method: Number(assessmentForm.cbt_max) > 0 ? 'cbt' : 'written',
        school_class_id: assessmentForm.school_class_id || null,
        academic_session_id: assessmentForm.academic_session_id || null,
        subject_id: assessmentForm.subject_id || null,
      });
      toast.success('Assessment configuration saved!');
      fetchSettings();
    } catch (e) {
      toast.error(e.message || 'Failed to save configuration.');
    }
  };

  const filteredScales = gradingScales.filter(s => {
    if (scaleScopeClass && String(s.school_class_id) !== String(scaleScopeClass)) return false;
    if (scaleScopeSession && String(s.academic_session_id) !== String(scaleScopeSession)) return false;
    return true;
  });

  const tabs = [
    { id: 'branding', label: 'School & Signatures', icon: School },
    { id: 'template', label: 'Report Template', icon: FileText },
    { id: 'sessions', label: 'Academic Sessions', icon: Calendar },
    { id: 'annual', label: 'Annual / Cumulative Policy', icon: Award },
    { id: 'assessments', label: 'Assessment Config & CBT', icon: Sliders },
    { id: 'grading', label: 'Class Grading Scales', icon: Award },
    { id: 'traits', label: 'Affective & Psychomotor', icon: Layers },
    { id: 'email', label: 'Email & Delivery Rules', icon: Mail },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" /> Report Card & Academic Settings
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure authoritative grading scales, assessment weightings, CBT/Written methods, affective traits, and email templates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-blue-900'
                : 'text-gray-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 1. SCHOOL & BRANDING ─── */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-800 border-b border-gray-100 pb-3">
            School Identity & Principal Endorsement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">School Name</label>
              <input
                required
                value={settings.school_name || ''}
                onChange={e => setSettings({ ...settings, school_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Motto</label>
              <input
                value={settings.motto || ''}
                onChange={e => setSettings({ ...settings, motto: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">School Address</label>
              <input
                value={settings.address || ''}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Official Phone</label>
              <input
                value={settings.phone || ''}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Official Email</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={e => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Principal's Name</label>
              <input
                value={settings.principal_name || ''}
                onChange={e => setSettings({ ...settings, principal_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Logo URL (or Base64)</label>
              <input
                value={settings.logo_url || ''}
                onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://... or data:image/png;base64,..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Principal Signature URL</label>
              <input
                value={settings.principal_signature_url || ''}
                onChange={e => setSettings({ ...settings, principal_signature_url: e.target.value })}
                placeholder="https://... or data:image/png;base64,..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Branding Settings
          </button>
        </form>
      )}

      {activeTab === 'template' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-black text-slate-800">Official Report Card Template</h2>
            <p className="text-xs text-gray-500 mt-1">These options are snapshotted when a report card is generated, so historical records retain their original presentation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Theme</label>
              <select
                value={settings.report_card_theme || 'classic'}
                onChange={e => setSettings({ ...settings, report_card_theme: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800"
              >
                <option value="classic">Classic Blue</option>
                <option value="modern">Modern Teal</option>
                <option value="minimal">Minimal Slate</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">School Website</label>
              <input
                type="url"
                value={settings.website || ''}
                onChange={e => setSettings({ ...settings, website: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">School Stamp URL (or Base64)</label>
              <input
                value={settings.school_stamp_url || ''}
                onChange={e => setSettings({ ...settings, school_stamp_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Footer Text</label>
              <textarea
                rows="3"
                value={settings.report_card_footer_text || ''}
                onChange={e => setSettings({ ...settings, report_card_footer_text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ['show_student_photo', 'Show Student Photo'],
              ['show_position', 'Show Position'],
              ['show_grade_point', 'Show Grade Point'],
              ['show_attendance', 'Show Attendance'],
              ['show_teacher_signature', 'Show Teacher Signature'],
              ['show_principal_signature', 'Show Principal Signature'],
              ['show_school_stamp', 'Show School Stamp'],
              ['show_watermark', 'Show Watermark'],
              ['show_promotion', 'Show Promotion Decision'],
              ['show_annual_summary', 'Show Annual Summary'],
              ['require_class_teacher_review', 'Require Class-Teacher Review'],
            ].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings[field] === true}
                  onChange={e => setSettings({ ...settings, [field]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Template Settings
          </button>
        </form>
      )}

      {/* ─── 2. ACADEMIC SESSIONS ─── */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Create Session */}
          <form onSubmit={handleCreateSession} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Session Name</label>
              <input
                required
                placeholder="e.g. 2026/2027"
                value={newSessionName}
                onChange={e => setNewSessionName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Start Date</label>
              <input
                type="date"
                value={newSessionStart}
                onChange={e => setNewSessionStart(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">End Date</label>
              <input
                type="date"
                min={newSessionStart || undefined}
                value={newSessionEnd}
                onChange={e => setNewSessionEnd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="isCur"
                checked={newSessionCurrent}
                onChange={e => setNewSessionCurrent(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isCur" className="text-xs font-bold text-slate-700 cursor-pointer">Set as Active Current Session</label>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Session
            </button>
          </form>

          {/* Session List */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden">
            <h3 className="font-black text-slate-800 text-sm mb-4">Configured Academic Sessions</h3>
            <div className="divide-y divide-gray-100">
              {sessions.map(s => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{s.name}</span>
                      {s.is_current && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                          Current Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Terms: {(s.terms || ['1st Term', '2nd Term', '3rd Term']).join(' • ')} | Active: {s.current_term} | Status: {s.status || 'upcoming'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!s.is_current && (
                      <>
                        <button
                          onClick={async () => {
                            await updateAcademicSession(s.id, { is_current: true, status: 'active' });
                            toast.success(`${s.name} set as current session.`);
                            fetchSettings();
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Set Current
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete unused session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ANNUAL / CUMULATIVE CALCULATION POLICY ─── */}
      {activeTab === 'annual' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-800 border-b border-gray-100 pb-3">
            Third Term Annual Calculation & Promotion Policy
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                  Annual Result Calculation Method
                </label>
                <select
                  value={settings.annual_calculation_method || 'equal'}
                  onChange={e => setSettings({ ...settings, annual_calculation_method: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="equal">Equal Weighting (Average of 1st, 2nd, and 3rd Terms)</option>
                  <option value="weighted">Custom Weighted Terms (e.g. 20% 1st, 20% 2nd, 60% 3rd)</option>
                  <option value="third_term_only">3rd Term Score Only (Ignore previous terms)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Determines how annual subject totals and overall cumulative averages are calculated on 3rd Term Report Cards.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                  Missing Term Policy
                </label>
                <select
                  value={settings.missing_term_policy || 'average_available'}
                  onChange={e => setSettings({ ...settings, missing_term_policy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="average_available">Average Available Terms (Grace for transfer students)</option>
                  <option value="require_all">Require All Terms (Treat missing terms as 0)</option>
                </select>
              </div>
            </div>

            {settings.annual_calculation_method === 'weighted' && (
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                <label className="block text-xs font-black uppercase text-amber-900">
                  Term Weights (%) — Must sum to 100%
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block mb-1">1st Term Weight (%)</span>
                    <input
                      type="number"
                      value={settings.annual_term_weights?.[0] ?? 20}
                      onChange={e => {
                        const w = [...(settings.annual_term_weights || [20, 20, 60])];
                        w[0] = parseFloat(e.target.value) || 0;
                        setSettings({ ...settings, annual_term_weights: w });
                      }}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block mb-1">2nd Term Weight (%)</span>
                    <input
                      type="number"
                      value={settings.annual_term_weights?.[1] ?? 20}
                      onChange={e => {
                        const w = [...(settings.annual_term_weights || [20, 20, 60])];
                        w[1] = parseFloat(e.target.value) || 0;
                        setSettings({ ...settings, annual_term_weights: w });
                      }}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block mb-1">3rd Term Weight (%)</span>
                    <input
                      type="number"
                      value={settings.annual_term_weights?.[2] ?? 60}
                      onChange={e => {
                        const w = [...(settings.annual_term_weights || [20, 20, 60])];
                        w[2] = parseFloat(e.target.value) || 0;
                        setSettings({ ...settings, annual_term_weights: w });
                      }}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showCum"
                  checked={settings.show_cumulative_on_third_term !== false}
                  onChange={e => setSettings({ ...settings, show_cumulative_on_third_term: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showCum" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Display Annual Cumulative Subject Table on Third Term Report Cards
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoEmail"
                  checked={settings.automatic_report_card_email !== false}
                  onChange={e => setSettings({ ...settings, automatic_report_card_email: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoEmail" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Automatically dispatch student and parent emails when admin releases results
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Annual Policy
          </button>
        </form>
      )}

      {/* ─── 3. ASSESSMENT CONFIGURATIONS & CBT ─── */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveAssessmentConfig} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-sm pb-2 border-b border-gray-100">
              Configure CA & Exam Assessment Structure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Class Scope (Optional)</label>
                <select
                  value={assessmentForm.school_class_id}
                  onChange={e => setAssessmentForm({ ...assessmentForm, school_class_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Classes (Global Default)</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Subject Scope (Optional)</label>
                <select
                  value={assessmentForm.subject_id}
                  onChange={e => setAssessmentForm({ ...assessmentForm, subject_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Subjects (Default)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Academic Session (Optional)</label>
                <select
                  value={assessmentForm.academic_session_id}
                  onChange={e => setAssessmentForm({ ...assessmentForm, academic_session_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Sessions</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Term</label>
                <select
                  value={assessmentForm.term}
                  onChange={e => setAssessmentForm({ ...assessmentForm, term: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  {['1st Term', '2nd Term', '3rd Term'].map(term => <option key={term}>{term}</option>)}
                </select>
              </div>

              {[
                ['ca1_max', 'CA 1 Max Score'],
                ['ca2_max', 'CA 2 Max Score'],
                ['assignment_max', 'Assignment Max Score'],
                ['test_max', 'Test Max Score'],
                ['project_max', 'Project Max Score'],
                ['attendance_max', 'Attendance Max Score'],
                ['cbt_max', 'CBT Max Score (Auto-Scored)'],
                ['written_max', 'Written Exam Max Score'],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={assessmentForm[field]}
                    onChange={e => setAssessmentForm({ ...assessmentForm, [field]: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-500">
              The total is calculated from active components. You can combine CBT and written components for hybrid exams.
            </p>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Assessment Rule
            </button>
          </form>

          {/* Configs table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden">
            <h3 className="font-black text-slate-800 text-sm mb-4">Active Assessment Rules</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-black">
                    <th className="p-3">Scope / Class</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Term</th>
                    <th className="p-3">Components</th>
                    <th className="p-3 text-center">Total Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assessmentConfigs.map(c => (
                    <tr key={c.id}>
                      <td className="p-3 font-bold text-slate-800">{c.school_class?.name || 'All Classes (Global)'}</td>
                      <td className="p-3 text-slate-700">{c.subject?.name || 'All Subjects'}</td>
                      <td className="p-3 text-slate-700">{c.term}</td>
                      <td className="p-3 text-slate-700">
                        {(c.components || []).map(component => `${component.label}: ${component.max_score}`).join(' • ') || `CA1: ${c.ca1_max} • CA2: ${c.ca2_max} • Exam: ${c.exam_max}`}
                      </td>
                      <td className="p-3 text-center font-black text-slate-900">{c.total_max}</td>
                    </tr>
                  ))}
                  {assessmentConfigs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                        Standard Default: CA1: 20 | CA2: 20 | Exam: 60 | Total: 100 (Written)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. CLASS-SPECIFIC GRADING SCALES ─── */}
      {activeTab === 'grading' && (
        <div className="space-y-6">
          {/* Scope Filters */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={scaleScopeClass}
                onChange={e => setScaleScopeClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="">Global / All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select
                value={scaleScopeSession}
                onChange={e => setScopeSession(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="">All Sessions</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <button
              onClick={handleResetScales}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Scope to Standard Defaults
            </button>
          </div>

          {/* Add Scale Entry Form */}
          <form onSubmit={handleAddGradingScale} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-sm pb-2 border-b border-gray-100">
              Add / Override Grading Rule
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Grade Letter</label>
                <input
                  required
                  value={newScale.grade}
                  onChange={e => setNewScale({ ...newScale, grade: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 text-center uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Min Score (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newScale.min_score}
                  onChange={e => setNewScale({ ...newScale, min_score: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Max Score (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newScale.max_score}
                  onChange={e => setNewScale({ ...newScale, max_score: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Remark</label>
                <input
                  required
                  value={newScale.remark}
                  onChange={e => setNewScale({ ...newScale, remark: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  + Add Rule
                </button>
              </div>
            </div>
          </form>

          {/* Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden">
            <h3 className="font-black text-slate-800 text-sm mb-4">Grading Rules in Scope</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-black">
                  <th className="p-3">Grade</th>
                  <th className="p-3">Score Range</th>
                  <th className="p-3">Remark</th>
                  <th className="p-3">Class Scope</th>
                  <th className="p-3">Session</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredScales.map(scale => (
                  <tr key={scale.id}>
                    <td className="p-3 font-black text-blue-900 text-sm">{scale.grade}</td>
                    <td className="p-3 font-bold text-slate-800">{scale.min_score}% - {scale.max_score}%</td>
                    <td className="p-3 text-slate-700">{scale.remark}</td>
                    <td className="p-3 text-gray-500">{scale.school_class?.name || 'Global'}</td>
                    <td className="p-3 text-gray-500">{scale.academic_session?.name || 'All'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleEditGradingScale(scale)}
                        className="px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGradingScale(scale.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 5. AFFECTIVE & PSYCHOMOTOR ─── */}
      {activeTab === 'traits' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-800 border-b border-gray-100 pb-3">
            Affective & Psychomotor Behavioral Domain Traits
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                Affective Domain Traits (Comma-separated)
              </label>
              <textarea
                rows={3}
                value={(settings.affective_traits || []).join(', ')}
                onChange={e => setSettings({
                  ...settings,
                  affective_traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Default: Punctuality, Neatness, Honesty, Cooperation, Responsibility, Attitude</p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                Psychomotor Domain Skills (Comma-separated)
              </label>
              <textarea
                rows={3}
                value={(settings.psychomotor_traits || []).join(', ')}
                onChange={e => setSettings({
                  ...settings,
                  psychomotor_traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Default: Handwriting, Drawing, Sports, Practical Skills, Coordination</p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Rating Scale Max Value</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.max_rating_scale || 5}
                onChange={e => setSettings({ ...settings, max_rating_scale: parseInt(e.target.value) || 5 })}
                className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Domain Config
          </button>
        </form>
      )}

      {/* ─── 6. EMAIL & DELIVERY SETTINGS ─── */}
      {activeTab === 'email' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-800 border-b border-gray-100 pb-3">
            Email Delivery & Release Gate Rules
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Email Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.email_accent_color || '#2563eb'}
                    onChange={e => setSettings({ ...settings, email_accent_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border-none cursor-pointer p-0"
                  />
                  <input
                    value={settings.email_accent_color || '#2563eb'}
                    onChange={e => setSettings({ ...settings, email_accent_color: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">School Fee Release Policy</label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="reqFee"
                    checked={settings.require_fee_payment_for_release || false}
                    onChange={e => setSettings({ ...settings, require_fee_payment_for_release: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="reqFee" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Block release & emails unless student fee is PAID
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Result Release Email Message</label>
              <textarea
                rows={2}
                value={settings.result_release_email_message || ''}
                onChange={e => setSettings({ ...settings, result_release_email_message: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Email Footer Message</label>
              <textarea
                rows={2}
                value={settings.email_footer_message || ''}
                onChange={e => setSettings({ ...settings, email_footer_message: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Email Settings
          </button>
        </form>
      )}
    </div>
  );
}
