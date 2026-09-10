import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  Printer, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  BookOpen, 
  Layers, 
  Filter,
  X,
  Sparkles,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import apiFetch from '../../../services/api';
import { confirmDialog, alertDialog, promptDialog } from '../../../services/dialogService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DEFAULT_PERIODS = [
  { period_number: 1, period_name: 'Period 1', start_time: '08:00', end_time: '08:45', is_break: false },
  { period_number: 2, period_name: 'Period 2', start_time: '08:45', end_time: '09:30', is_break: false },
  { period_number: 3, period_name: 'Period 3', start_time: '09:30', end_time: '10:15', is_break: false },
  { period_number: 4, period_name: 'Short Break', start_time: '10:15', end_time: '10:45', is_break: true },
  { period_number: 5, period_name: 'Period 4', start_time: '10:45', end_time: '11:30', is_break: false },
  { period_number: 6, period_name: 'Period 5', start_time: '11:30', end_time: '12:15', is_break: false },
  { period_number: 7, period_name: 'Lunch Break', start_time: '12:15', end_time: '13:00', is_break: true },
  { period_number: 8, period_name: 'Period 6', start_time: '13:00', end_time: '13:45', is_break: false },
  { period_number: 9, period_name: 'Period 7', start_time: '13:45', end_time: '14:30', is_break: false },
];

export default function AdminTimetablePage() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [entries, setEntries] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'requests'

  // Edit Modal State
  const [editingCell, setEditingCell] = useState(null); // { day, period } or existing entry
  const [cellForm, setCellForm] = useState({
    subject_id: '',
    teacher_id: '',
    room: '',
    is_break: false,
    period_name: '',
    start_time: '',
    end_time: '',
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSessionId && selectedClassId) {
      fetchTimetable();
      fetchChangeRequests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId, selectedTerm, selectedClassId, selectedSection]);

  const loadInitialData = async () => {
    try {
      const [sessRes, classRes, subRes, teachRes] = await Promise.all([
        apiFetch('/academic-sessions'),
        apiFetch('/classes'),
        apiFetch('/subjects'),
        apiFetch('/users?role=teacher'),
      ]);

      const sessionList = sessRes.sessions || sessRes || [];
      setSessions(sessionList);
      
      const current = sessionList.find(s => s.is_current) || sessionList[0];
      if (current) {
        setSelectedSessionId(current.id);
        setSelectedTerm(current.current_term || '1st Term');
      }

      const classList = classRes.classes || classRes || [];
      setClasses(classList);
      if (classList[0]) {
        setSelectedClassId(classList[0].id);
      }

      setSubjects(subRes.subjects || subRes || []);
      setTeachers(teachRes.data || teachRes || []);
    } catch (err) {
      console.error('Failed to load initial timetable data', err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch(`/timetables?academic_session_id=${selectedSessionId}&term=${selectedTerm}&school_class_id=${selectedClassId}&section=${selectedSection}`);
      setEntries(res.entries || []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load timetable entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const res = await apiFetch('/timetable/change-requests');
      setChangeRequests(res || []);
    } catch (err) {
      console.error('Failed to load change requests', err);
    }
  };

  const openCellEditor = (day, period) => {
    const existing = entries.find(e => e.day_of_week === day && e.period_number === period.period_number);
    setErrorMessage('');
    setSuccessMessage('');
    
    if (existing) {
      setEditingCell(existing);
      setCellForm({
        subject_id: existing.subject_id || '',
        teacher_id: existing.teacher_id || '',
        room: existing.room || '',
        is_break: existing.is_break || false,
        period_name: existing.period_name || period.period_name,
        start_time: existing.start_time || period.start_time,
        end_time: existing.end_time || period.end_time,
      });
    } else {
      setEditingCell({ day_of_week: day, period_number: period.period_number });
      setCellForm({
        subject_id: '',
        teacher_id: '',
        room: '',
        is_break: period.is_break || false,
        period_name: period.period_name,
        start_time: period.start_time,
        end_time: period.end_time,
      });
    }
  };

  const handleSaveCell = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiFetch('/timetables', {
        method: 'POST',
        body: JSON.stringify({
          academic_session_id: selectedSessionId,
          term: selectedTerm,
          school_class_id: selectedClassId,
          section: selectedSection || null,
          day_of_week: editingCell.day_of_week,
          period_number: editingCell.period_number,
          period_name: cellForm.period_name,
          start_time: cellForm.start_time,
          end_time: cellForm.end_time,
          subject_id: cellForm.is_break ? null : (cellForm.subject_id || null),
          teacher_id: cellForm.is_break ? null : (cellForm.teacher_id || null),
          room: cellForm.room || null,
          is_break: cellForm.is_break,
        }),
      });

      setSuccessMessage('Timetable slot saved successfully.');
      setEditingCell(null);
      fetchTimetable();
    } catch (err) {
      setErrorMessage(err.message || 'Conflict detected: could not save timetable slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCell = async (id) => {
    const ok = await confirmDialog({
      title: 'Clear Timetable Slot',
      message: 'Are you sure you want to clear this timetable slot?',
      confirmText: 'Yes, Clear Slot',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await apiFetch(`/timetables/${id}`, { method: 'DELETE' });
      setEditingCell(null);
      fetchTimetable();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to clear slot');
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      await apiFetch(`/timetable/change-requests/${id}/approve`, { method: 'PATCH' });
      fetchChangeRequests();
      fetchTimetable();
      await alertDialog({
        title: 'Request Approved',
        message: 'Change request approved and timetable updated.',
        type: 'success',
      });
    } catch (err) {
      await alertDialog({
        title: 'Approval Conflict',
        message: err.message || 'Could not approve request due to slot conflicts.',
        type: 'danger',
      });
    }
  };

  const handleRejectRequest = async (id) => {
    const note = await promptDialog({
      title: 'Decline Change Request',
      message: 'Enter reason for decline:',
      defaultValue: 'Schedule conflict with room or teacher',
      confirmText: 'Decline Request',
      type: 'warning',
    });
    if (note === null) return;
    try {
      await apiFetch(`/timetable/change-requests/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_notes: note }),
      });
      fetchChangeRequests();
      await alertDialog({
        title: 'Request Declined',
        message: 'Change request rejected.',
        type: 'info',
      });
    } catch (err) {
      await alertDialog({
        title: 'Error',
        message: err.message || 'Failed to reject request.',
        type: 'danger',
      });
    }
  };

  const currentClassObj = classes.find(c => c.id == selectedClassId);
  const currentSessionObj = sessions.find(s => s.id == selectedSessionId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      {loading && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">
          Loading timetable entries…
        </div>
      )}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          {successMessage}
        </div>
      )}
      
      {/* ── Page Header & Controls ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-800 font-bold border border-blue-100 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Timetable Matrix & Scheduling
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time conflict prevention, teacher period allocations & swap requests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'matrix' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Matrix Grid
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'requests' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Change Requests</span>
              {changeRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Matrix
          </button>
        </div>
      </div>

      {/* ── Selection Filters Bar ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Academic Session
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Academic Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="1st Term">1st Term</option>
            <option value="2nd Term">2nd Term</option>
            <option value="3rd Term">3rd Term</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            School Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Stream / Arm (Optional)
          </label>
          <input
            type="text"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            placeholder="e.g. Gold, A, Science"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* ── Active Tab Content ── */}
      {activeTab === 'matrix' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          
          {/* Printable Header Banner */}
          <div className="hidden print:block mb-6 text-center border-b pb-4">
            <h1 className="text-xl font-black text-blue-950 uppercase">GHRA</h1>
            <p className="text-xs font-bold text-sky-600 uppercase">SHAPING YOUNG MINDS, BUILDING FUTURE LEADERS</p>
            <p className="text-sm font-bold text-slate-900 mt-2">
              Official Class Timetable: {currentClassObj?.name} {selectedSection ? `(${selectedSection})` : ''} — {selectedTerm}, {currentSessionObj?.name}
            </p>
          </div>

          {/* Matrix Grid Container */}
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse text-xs min-w-[900px]">
              <thead>
                <tr className="bg-blue-900 text-white font-bold uppercase text-[11px] tracking-wider text-center">
                  <th className="p-3 w-28 text-left border border-blue-800">Day / Period</th>
                  {DEFAULT_PERIODS.map(p => (
                    <th key={p.period_number} className={`p-2.5 border border-blue-800 ${p.is_break ? 'bg-blue-950/80 w-20' : 'w-32'}`}>
                      <span className="block font-black">{p.period_name}</span>
                      <span className="text-[9.5px] font-normal text-blue-200 block">{p.start_time} - {p.end_time}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day} className="border-b border-slate-100">
                    <td className="p-3 font-black text-blue-950 bg-blue-50/50 border border-slate-200">
                      {day}
                    </td>

                    {DEFAULT_PERIODS.map(period => {
                      const entry = entries.find(e => e.day_of_week === day && e.period_number === period.period_number);
                      const isBreak = entry?.is_break || period.is_break;

                      return (
                        <td
                          key={period.period_number}
                          onClick={() => openCellEditor(day, period)}
                          className={`p-2 border border-slate-200 align-top transition cursor-pointer hover:ring-2 hover:ring-blue-600 hover:z-10 ${
                            isBreak 
                              ? 'bg-amber-50/60 text-amber-900 text-center font-bold' 
                              : entry 
                              ? 'bg-white hover:bg-blue-50/40' 
                              : 'bg-slate-50/40 hover:bg-blue-50/20'
                          }`}
                        >
                          {isBreak ? (
                            <div className="py-3 text-[10px] text-amber-700 font-extrabold uppercase tracking-widest">
                              {entry?.period_name || period.period_name}
                            </div>
                          ) : entry ? (
                            <div className="space-y-1">
                              <p className="font-black text-blue-900 text-xs leading-tight">
                                {entry.subject?.name || 'Subject'}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{entry.teacher?.full_name || 'Unassigned'}</span>
                              </div>
                              {entry.room && (
                                <span className="inline-block text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                  {entry.room}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-12 flex items-center justify-center text-slate-300 hover:text-blue-700">
                              <Plus className="w-4 h-4 opacity-40 hover:opacity-100" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-500 print:hidden">
            <span>💡 Click on any cell in the grid to assign subject, allocate faculty, or configure break period.</span>
            <span className="font-bold text-blue-800">GHRA Conflict Shield: Active</span>
          </div>
        </div>
      ) : (
        /* ── Timetable Change Requests View ── */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase">Faculty Timetable Change Requests</h2>
              <p className="text-xs text-slate-400">Review teacher swap and schedule adjustment submissions</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold">
              {changeRequests.length} Total Submissions
            </span>
          </div>

          {changeRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No timetable change requests submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {changeRequests.map(req => (
                <div key={req.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{req.teacher?.full_name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        req.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      Requesting swap for <strong className="text-blue-900">{req.timetable?.subject?.name}</strong> ({req.timetable?.school_class?.name}) to{' '}
                      <strong>{req.requested_day} (Period {req.requested_period_number})</strong>
                    </p>

                    <p className="text-slate-400 italic">" {req.reason} "</p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        Approve & Update
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Slot Editor Modal ── */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Configure Slot: {editingCell.day_of_week} (Period {editingCell.period_number})
                </h3>
                <p className="text-[11px] text-slate-400">Set subject, faculty, or mark as break interval</p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveCell} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="is_break_check"
                  checked={cellForm.is_break}
                  onChange={(e) => setCellForm(p => ({ ...p, is_break: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_break_check" className="font-bold text-slate-800 cursor-pointer">
                  Mark as Break / Assembly Slot
                </label>
              </div>

              {!cellForm.is_break && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Subject *
                    </label>
                    <select
                      required={!cellForm.is_break}
                      value={cellForm.subject_id}
                      onChange={(e) => setCellForm(p => ({ ...p, subject_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assigned Faculty / Teacher
                    </label>
                    <select
                      value={cellForm.teacher_id}
                      onChange={(e) => setCellForm(p => ({ ...p, teacher_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.employee_id || 'Faculty'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Classroom / Laboratory (Optional)
                    </label>
                    <input
                      type="text"
                      value={cellForm.room}
                      onChange={(e) => setCellForm(p => ({ ...p, room: e.target.value }))}
                      placeholder="e.g. Science Lab 2, Room 104"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                {editingCell.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCell(editingCell.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Slot
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
