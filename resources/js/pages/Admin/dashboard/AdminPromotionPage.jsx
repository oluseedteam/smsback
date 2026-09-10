import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  History, 
  Users, 
  Award, 
  Calendar, 
  BookOpen, 
  Filter,
  Search,
  RotateCcw
} from 'lucide-react';
import apiFetch from '../../../services/api';
import { confirmDialog, alertDialog } from '../../../services/dialogService';

export default function AdminPromotionPage() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);

  // Source selections
  const [fromSessionId, setFromSessionId] = useState('');
  const [fromClassId, setFromClassId] = useState('');
  const [fromSection, setFromSection] = useState('');

  // Destination selections
  const [toSessionId, setToSessionId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [toSection, setToSection] = useState('');
  const [promotionStatus, setPromotionStatus] = useState('promoted');
  const [adminNotes, setAdminNotes] = useState('');

  // Data states
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('promote'); // 'promote' | 'history'
  const [searchQuery, setSearchQuery] = useState('');

  // Execution states
  const [promoting, setPromoting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSessionsAndClasses();
  }, []);

  useEffect(() => {
    if (fromSessionId && fromClassId) {
      fetchEligibleStudents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromSessionId, fromClassId, fromSection]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPromotionHistory();
    }
  }, [activeTab]);

  const loadSessionsAndClasses = async () => {
    try {
      const [sessRes, classRes] = await Promise.all([
        apiFetch('/academic-sessions'),
        apiFetch('/classes'),
      ]);

      const sessionList = sessRes.sessions || sessRes || [];
      setSessions(sessionList);

      const classList = classRes.classes || classRes || [];
      setClasses(classList);

      const current = sessionList.find(s => s.is_current) || sessionList[0];
      if (current) {
        setFromSessionId(current.id);
        setToSessionId(current.id);
      }
      if (classList[0]) {
        setFromClassId(classList[0].id);
        setToClassId(classList[1]?.id || classList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions/classes', err);
    }
  };

  const fetchEligibleStudents = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch(`/admin/promotions/eligible-students?academic_session_id=${fromSessionId}&school_class_id=${fromClassId}&section=${fromSection}`);
      setStudents(res.students || []);
      setSelectedStudentIds((res.students || []).map(s => s.id)); // Default select all
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch('/admin/promotions/history');
      setHistoryRecords(res.data || []);
    } catch (err) {
      console.error('Failed to load promotion history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePromote = async () => {
    if (selectedStudentIds.length === 0) {
      await alertDialog({
        title: 'Selection Required',
        message: 'Please select at least one student to promote.',
        type: 'warning',
      });
      return;
    }

    if (!toSessionId || !toClassId) {
      await alertDialog({
        title: 'Destination Required',
        message: 'Please select destination session and destination class.',
        type: 'warning',
      });
      return;
    }

    const destClassObj = classes.find(c => c.id == toClassId);
    const destSessionObj = sessions.find(s => s.id == toSessionId);

    const confirmMsg = `Are you sure you want to promote ${selectedStudentIds.length} student(s) into ${destClassObj?.name} for the ${destSessionObj?.name} session?`;
    const ok = await confirmDialog({
      title: 'Confirm Student Promotion',
      message: confirmMsg,
      confirmText: 'Yes, Promote Student(s)',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    setPromoting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await apiFetch('/admin/promotions/promote', {
        method: 'POST',
        body: JSON.stringify({
          from_session_id: fromSessionId,
          from_class_id: fromClassId,
          from_section: fromSection || null,
          to_session_id: toSessionId,
          to_class_id: toClassId,
          to_section: toSection || null,
          student_ids: selectedStudentIds,
          promotion_status: promotionStatus,
          notes: adminNotes || undefined,
        }),
      });

      setSuccessMessage(res.message || 'Students promoted successfully.');
      fetchEligibleStudents();
    } catch (err) {
      setErrorMessage(err.message || 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-800 font-bold border border-blue-100 shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Student Promotion & Academic Class Advancement
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Advance student cohorts across academic sessions while preserving complete academic history
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('promote')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'promote' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Promote Students
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Promotion History</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {activeTab === 'promote' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ── Left 2 Columns: Source & Eligible Students ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Source Selection Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                1. Select Source Class & Session
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Current Session
                  </label>
                  <select
                    value={fromSessionId}
                    onChange={(e) => setFromSessionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Current Class
                  </label>
                  <select
                    value={fromClassId}
                    onChange={(e) => setFromClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Section (Optional)
                  </label>
                  <input
                    type="text"
                    value={fromSection}
                    onChange={(e) => setFromSection(e.target.value)}
                    placeholder="All Sections"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Students Table Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    2. Select Students ({selectedStudentIds.length} of {filteredStudents.length} selected)
                  </h2>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 w-full sm:w-48"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Loading class students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No students found in this class/session.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="pb-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="pb-3 font-bold">Student Name</th>
                        <th className="pb-3 font-bold">Student ID</th>
                        <th className="pb-3 font-bold text-center">3rd Term Avg</th>
                        <th className="pb-3 font-bold text-center">Cumulative</th>
                        <th className="pb-3 font-bold text-right">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map(student => (
                        <tr 
                          key={student.id} 
                          onClick={() => toggleSelectStudent(student.id)}
                          className={`hover:bg-slate-50 cursor-pointer transition ${
                            selectedStudentIds.includes(student.id) ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => toggleSelectStudent(student.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 font-black text-slate-900">{student.full_name}</td>
                          <td className="py-3 font-mono font-bold text-blue-900 text-[11px]">{student.student_id}</td>
                          <td className="py-3 text-center font-bold text-slate-700">
                            {student.third_term_average ? `${student.third_term_average}%` : '—'}
                          </td>
                          <td className="py-3 text-center font-bold text-slate-700">
                            {student.cumulative_average ? `${student.cumulative_average}%` : '—'}
                          </td>
                          <td className="py-3 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              student.promotion_status === 'Promoted' ? 'bg-blue-100 text-blue-800' :
                              student.promotion_status === 'Retained' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {student.promotion_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Destination Class & Promotion Execution ── */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 sticky top-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                3. Destination Class & Status
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Destination Session *
                  </label>
                  <select
                    value={toSessionId}
                    onChange={(e) => setToSessionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Destination Class *
                  </label>
                  <select
                    value={toClassId}
                    onChange={(e) => setToClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Destination Arm / Section (Optional)
                  </label>
                  <input
                    type="text"
                    value={toSection}
                    onChange={(e) => setToSection(e.target.value)}
                    placeholder="e.g. A, Gold, Science"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Promotion Status Outcome
                  </label>
                  <select
                    value={promotionStatus}
                    onChange={(e) => setPromotionStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="promoted">Promoted</option>
                    <option value="promoted_on_trial">Promoted on Trial</option>
                    <option value="retained">Retained in Class</option>
                    <option value="graduated">Graduated / Alumnus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Administrative Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Promoted based on terminal cumulative cut-off"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={handlePromote}
                    disabled={promoting || selectedStudentIds.length === 0}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {promoting ? 'Promoting...' : `Promote ${selectedStudentIds.length} Student(s)`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center">
                  Past results and registered courses remain preserved in permanent academic archives.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Promotion History Tab ── */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase">Student Promotion History Log</h2>
              <p className="text-xs text-slate-400">Complete archive of historical promotions and class transitions</p>
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading promotion history...
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No historical promotion records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">Date</th>
                    <th className="pb-3 font-bold">Student</th>
                    <th className="pb-3 font-bold">From</th>
                    <th className="pb-3 font-bold">To</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(rec.promoted_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {rec.student?.full_name} ({rec.student?.student_id})
                      </td>
                      <td className="py-3 text-slate-700">
                        {rec.from_class?.name} <span className="text-slate-400">({rec.from_session?.name})</span>
                      </td>
                      <td className="py-3 text-blue-900 font-bold">
                        {rec.to_class?.name} <span className="text-slate-400 font-normal">({rec.to_session?.name})</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                          {rec.promotion_status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{rec.promoted_by?.full_name || 'Admin'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
