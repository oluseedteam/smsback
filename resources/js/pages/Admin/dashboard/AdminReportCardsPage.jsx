import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CheckCircle,
  Send,
  AlertTriangle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  Mail,
  X,
  Printer,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Play,
  Inbox
} from 'lucide-react';
import {
  getAdminReportCards,
  getReportCard,
  generateBatchReportCards,
  approveReportCard,
  reviewReportCard,
  returnReportCard,
  rejectReportCard,
  lockReportCard,
  reopenReportCard,
  revokeReportCard,
  releaseReportCard,
  releaseBatchReportCards,
  withholdReportCard,
  resendReportCardEmail,
  previewReportCardEmail,
  getAcademicSessions,
  getAdminEmailLogs,
  retryAdminEmailLog,
} from '../../../services/reportCardService';
import { getClasses } from '../../../services/classService';
import { getAcademicSections } from '../../../services/academicSectionService';
import { getSubjects } from '../../../services/subjectService';
import { getUsers } from '../../../services/userService';
import { confirmDialog, promptDialog } from '../../../services/dialogService';
import ReportCardView from '../../../components/ReportCardView';
import toast from 'react-hot-toast';

export default function AdminReportCardsPage() {
  const [activeAdminTab, setActiveAdminTab] = useState('report_cards'); // 'report_cards' | 'email_logs'
  const [reportCards, setReportCards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewCard, setPreviewCard] = useState(null);
  const [, setLoadingPreview] = useState(false);
  const [withholdTarget, setWithholdTarget] = useState(null);
  const [withholdReason, setWithholdReason] = useState('');
  const [emailPreview, setEmailPreview] = useState(null);
  const [, setLoadingEmailPreview] = useState(false);
  const [batchOperating, setBatchOperating] = useState(false);

  // Confirmation modal for release
  const [releaseConfirmCard, setReleaseConfirmCard] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [releaseResult, setReleaseResult] = useState(null);

  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      fetchReportCards();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, selectedTerm, selectedClass, selectedSection, selectedSubject, selectedTeacher, selectedStatus, selectedPaymentStatus]);

  const fetchInitData = async () => {
    try {
      const [sessionsRes, classesRes, sectionsRes, subjectsRes, teachersRes] = await Promise.all([
        getAcademicSessions(),
        getClasses(),
        getAcademicSections(),
        getSubjects(),
        getUsers('teacher'),
      ]);
      const sessionList = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.data || []);
      const classList = Array.isArray(classesRes) ? classesRes : (classesRes?.data || []);

      setSessions(sessionList);
      setClasses(classList);
      setSections(Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.data || []));
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []));
      setTeachers(Array.isArray(teachersRes) ? teachersRes : (teachersRes?.data || []));

      const activeSession = sessionList.find(s => s.is_current) || sessionList[0];
      if (activeSession) {
        setSelectedSession(activeSession.id);
        setSelectedTerm(activeSession.current_term || '1st Term');
      }
    } catch (e) {
      console.error('Failed to init report cards page:', e);
    }
  };

  const fetchReportCards = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSession) params.academic_session_id = selectedSession;
      if (selectedTerm) params.term = selectedTerm;
      if (selectedClass) params.school_class_id = selectedClass;
      if (selectedSection) params.academic_section_id = selectedSection;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedTeacher) params.teacher_id = selectedTeacher;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPaymentStatus) params.payment_status = selectedPaymentStatus;

      const res = await getAdminReportCards(params);
      setReportCards(res.data || res || []);
    } catch (e) {
      console.error('Failed to fetch report cards:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (!selectedClass) {
      return toast.error('Please select a specific Class to generate report cards.');
    }
    setBatchOperating(true);
    try {
      const res = await generateBatchReportCards({
        school_class_id: selectedClass,
        academic_session_id: selectedSession,
        term: selectedTerm,
      });
      toast.success(res.message || 'Report cards generated successfully.');
      fetchReportCards();
    } catch (e) {
      toast.error(e.message || 'Batch generation failed.');
    } finally {
      setBatchOperating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveReportCard(id);
      toast.success('Report card approved!');
      fetchReportCards();
    } catch (e) {
      toast.error(e.message || 'Approval failed.');
    }
  };

  const handleTransition = async (card, action) => {
    const reasonActions = ['return', 'reject', 'revoke'];
    let reason = null;
    if (reasonActions.includes(action)) {
      reason = await promptDialog({
        title: `Reason to ${action} Result`,
        message: `Please enter the reason to ${action} this report card:`,
        placeholder: 'Enter official reason...',
        confirmText: `Confirm ${action}`,
        type: 'warning',
      });
      if (!reason?.trim()) return;
    }

    const operations = {
      review: () => reviewReportCard(card.id),
      return: () => returnReportCard(card.id, reason),
      reject: () => rejectReportCard(card.id, reason),
      lock: () => lockReportCard(card.id),
      reopen: () => reopenReportCard(card.id),
      revoke: () => revokeReportCard(card.id, reason),
    };

    try {
      const response = await operations[action]();
      toast.success(response.message || `Result ${action} completed.`);
      fetchReportCards();
    } catch (error) {
      toast.error(error.message || `Could not ${action} result.`);
    }
  };

  const handleOpenReleaseConfirm = (card) => {
    setReleaseConfirmCard(card);
    setReleaseResult(null);
  };

  const handleExecuteRelease = async () => {
    if (!releaseConfirmCard) return;
    setReleasing(true);
    try {
      const res = await releaseReportCard(releaseConfirmCard.id);
      setReleaseResult(res);
      toast.success(res.message || 'Report card released successfully!');
      fetchReportCards();
    } catch (e) {
      toast.error(e.message || 'Release failed.');
    } finally {
      setReleasing(false);
    }
  };

  const handleReleaseBatch = async () => {
    if (!selectedClass) {
      return toast.error('Please select a Class to batch release.');
    }
    const ok = await confirmDialog({
      title: 'Batch Release Report Cards',
      message: 'Release all approved report cards in this class and dispatch student/parent emails?',
      confirmText: 'Yes, Release All',
      type: 'primary',
    });
    if (!ok) return;
    setBatchOperating(true);
    try {
      const res = await releaseBatchReportCards({
        school_class_id: selectedClass,
        academic_session_id: selectedSession,
        term: selectedTerm,
      });
      toast.success(res.message || 'Batch release complete.');
      fetchReportCards();
    } catch (e) {
      toast.error(e.message || 'Batch release failed.');
    } finally {
      setBatchOperating(false);
    }
  };

  const handleWithhold = async () => {
    if (!withholdTarget || !withholdReason) return;
    try {
      await withholdReportCard(withholdTarget.id, withholdReason);
      toast.success('Report card withheld.');
      setWithholdTarget(null);
      setWithholdReason('');
      fetchReportCards();
    } catch (e) {
      toast.error(e.message || 'Withhold failed.');
    }
  };

  const handleResend = async (id, recipientType = 'both') => {
    try {
      await resendReportCardEmail(id, recipientType);
      toast.success('Email dispatch attempted.');
      fetchReportCards();
    } catch (e) {
      toast.error(e.message || 'Resend failed.');
    }
  };

  const handlePreviewReportCard = async (id) => {
    setLoadingPreview(true);
    try {
      const data = await getReportCard(id);
      setPreviewCard(data);
    } catch (e) {
      toast.error(e.message || 'Failed to load report card.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePreviewEmail = async (id, recipientType = 'student') => {
    setLoadingEmailPreview(true);
    try {
      const preview = await previewReportCardEmail(id, recipientType);
      setEmailPreview(preview);
    } catch (e) {
      toast.error(e.message || 'Failed to load email preview.');
    } finally {
      setLoadingEmailPreview(false);
    }
  };

  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);
  const [emailLogFilterStatus, setEmailLogFilterStatus] = useState('');

  useEffect(() => {
    if (activeAdminTab === 'email_logs') {
      fetchEmailLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAdminTab, selectedSession, selectedTerm, emailLogFilterStatus]);

  const fetchEmailLogs = async () => {
    setLoadingEmailLogs(true);
    try {
      const params = {};
      if (selectedSession) params.academic_session_id = selectedSession;
      if (selectedTerm) params.term = selectedTerm;
      if (emailLogFilterStatus) params.status = emailLogFilterStatus;

      const res = await getAdminEmailLogs(params);
      setEmailLogs(res.data || res || []);
    } catch (e) {
      console.error('Failed to load email logs:', e);
    } finally {
      setLoadingEmailLogs(false);
    }
  };

  const handleRetryEmail = async (logId) => {
    try {
      const res = await retryAdminEmailLog(logId);
      toast.success(res.message || 'Retry attempted.');
      fetchEmailLogs();
    } catch (e) {
      toast.error(e.message || 'Retry failed.');
    }
  };

  const filteredCards = reportCards.filter(c => {
    if (!searchQuery) return true;
    const name = c.student?.full_name?.toLowerCase() || '';
    const id = c.student?.student_id?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const deliveryLabel = (status) => ({
    delivered: 'Delivered ✓',
    queued: 'Queued',
    sending: 'Sending',
    failed: 'Failed ✗',
    missing_recipient: 'Missing address',
    not_available: 'Not available',
    not_sent: 'Not sent',
  }[status] || status || 'Not sent');

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" /> Report Card Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review, approve, and officially release student report cards with automated student and parent email delivery.
          </p>
        </div>

        {activeAdminTab === 'report_cards' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateBatch}
              disabled={batchOperating || !selectedClass}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {batchOperating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Generate / Sync Class
            </button>
            <button
              onClick={handleReleaseBatch}
              disabled={batchOperating || !selectedClass}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {batchOperating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Batch Release Class
            </button>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveAdminTab('report_cards')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'report_cards'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-gray-500 hover:text-slate-800 border border-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Report Cards & Approval
        </button>
        <button
          onClick={() => setActiveAdminTab('email_logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'email_logs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-gray-500 hover:text-slate-800 border border-gray-100'
          }`}
        >
          <Mail className="w-4 h-4" /> Email Delivery Logs & Audits
        </button>
      </div>

      {activeAdminTab === 'report_cards' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Academic Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Sections</option>
                  {sections.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Teacher</label>
                <select
                  value={selectedTeacher}
                  onChange={e => setSelectedTeacher(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Teachers</option>
                  {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
                </select>
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Result Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="class_teacher_reviewed">Class Teacher Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="released">Released</option>
                  <option value="withheld">Withheld</option>
                  <option value="returned">Returned</option>
                  <option value="rejected">Rejected</option>
                  <option value="locked">Locked</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">School Fee Status</label>
                <select
                  value={selectedPaymentStatus}
                  onChange={e => setSelectedPaymentStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Fee Statuses</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name or student ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading report cards...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-slate-50 text-gray-500 uppercase text-[10px] font-black tracking-wider">
                      <th className="p-4">Student</th>
                      <th className="p-4">Class</th>
                      <th className="p-4 text-center">Score / Avg</th>
                      <th className="p-4 text-center">Position</th>
                      <th className="p-4 text-center">Fee Status</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Email Delivery</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCards.map((card) => (
                      <tr key={card.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Student */}
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-sm">{card.student?.full_name}</div>
                          <div className="text-[11px] font-mono text-blue-900 font-semibold">{card.student?.student_id}</div>
                        </td>

                        {/* Class */}
                        <td className="p-4 font-semibold text-slate-700">
                          {card.school_class?.name}
                        </td>

                        {/* Score / Avg */}
                        <td className="p-4 text-center">
                          <div className="font-black text-slate-900">{card.total_score} pts</div>
                          <div className="text-[11px] font-bold text-blue-700">{card.average_score}% ({card.overall_grade || '-'})</div>
                        </td>

                        {/* Position */}
                        <td className="p-4 text-center font-black text-blue-800">
                          {card.position ? `${card.position}${['st','nd','rd'][(card.position % 10)-1] || 'th'}` : '-'}
                        </td>

                        {/* Fee Status */}
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            card.payment_status === 'PAID' ? 'bg-green-50 text-green-700 border border-green-200' :
                            card.payment_status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {card.payment_status || 'PAID'}
                          </span>
                        </td>

                        {/* Result Status */}
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            card.status === 'released' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            card.status === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            card.status === 'withheld' ? 'bg-red-50 text-red-700 border border-red-200' :
                            card.status === 'returned' || card.status === 'rejected' || card.status === 'revoked' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            card.status === 'class_teacher_reviewed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            card.status === 'locked' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {card.status}
                          </span>
                          {!card.is_complete && (
                            <div className="mt-1 text-[9px] font-bold text-rose-600" title={(card.validation_errors || []).join('\n')}>
                              Incomplete ({card.validation_errors?.length || 0})
                            </div>
                          )}
                        </td>

                        {/* Email Delivery */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-gray-400 font-bold">Student:</span>
                              <span className={`font-black ${
                                card.student_email_status === 'delivered' ? 'text-emerald-600' :
                                card.student_email_status === 'failed' ? 'text-red-500' : 'text-gray-400'
                              }`}>
                                {deliveryLabel(card.student_email_status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-gray-400 font-bold">Parent:</span>
                              <span className={`font-black ${
                                card.parent_email_status === 'delivered' ? 'text-emerald-600' :
                                card.parent_email_status === 'failed' ? 'text-red-500' : 'text-gray-400'
                              }`}>
                                {deliveryLabel(card.parent_email_status)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handlePreviewReportCard(card.id)}
                              title="Preview Report Card"
                              className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {card.status === 'submitted' && (
                              <button
                                onClick={() => handleTransition(card, 'review')}
                                title="Record Class Teacher Review"
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            {['submitted', 'class_teacher_reviewed'].includes(card.status) ? (
                              <button
                                onClick={() => handleApprove(card.id)}
                                title="Approve Report Card"
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : null}

                            {card.status === 'approved' && (
                              <button
                                onClick={() => handleOpenReleaseConfirm(card)}
                                title="Release & Send Emails"
                                className="p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {card.status === 'released' && (
                              <>
                                <button
                                  onClick={() => handleResend(card.id, 'both')}
                                  title="Resend Emails"
                                  className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleTransition(card, 'revoke')}
                                  title="Revoke Released Result"
                                  className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {['draft', 'submitted', 'class_teacher_reviewed', 'approved'].includes(card.status) && (
                              <>
                                <button onClick={() => handleTransition(card, 'return')} title="Return to Teacher" className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg">
                                  <Inbox className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleTransition(card, 'reject')} title="Reject Result" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleTransition(card, 'lock')} title="Lock Result" className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg">
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {['withheld', 'returned', 'rejected', 'locked', 'revoked'].includes(card.status) && (
                              <button onClick={() => handleTransition(card, 'reopen')} title="Reopen for Editing" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handlePreviewEmail(card.id, 'student')}
                              title="Preview Email HTML"
                              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Mail className="w-4 h-4" />
                            </button>

                            {!['withheld', 'released', 'revoked'].includes(card.status) ? (
                              <button
                                onClick={() => setWithholdTarget(card)}
                                title="Withhold"
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredCards.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                          No report cards found matching the criteria. Click "Generate / Sync Class" to build draft records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Email Delivery Logs View */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Status Filter</label>
                <select
                  value={emailLogFilterStatus}
                  onChange={e => setEmailLogFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">All Delivery Statuses</option>
                  <option value="delivered">Delivered</option>
                  <option value="queued">Queued</option>
                  <option value="sending">Sending</option>
                  <option value="failed">Failed Delivery</option>
                  <option value="missing_recipient">Missing Email Profile</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchEmailLogs}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Logs
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingEmailLogs ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading email events...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-slate-50 text-gray-500 uppercase text-[10px] font-black tracking-wider">
                      <th className="p-4">Student</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4">Timestamp / Error</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{log.student?.full_name || 'N/A'}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{log.student?.student_id}</div>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-700">
                          {log.recipient}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            log.recipient_type === 'student' ? 'bg-blue-50 text-blue-800' : 'bg-purple-50 text-purple-800'
                          }`}>
                            {log.recipient_type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 font-medium max-w-xs truncate">
                          {log.email_subject || 'Report Card Release'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            log.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-200' :
                            log.status === 'missing_recipient' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          <div>{log.sent_at ? new Date(log.sent_at).toLocaleString() : (log.failed_at ? new Date(log.failed_at).toLocaleString() : new Date(log.created_at).toLocaleString())}</div>
                          {log.failure_reason && (
                            <div className="text-[10px] text-red-500 italic mt-0.5 max-w-xs truncate" title={log.failure_reason}>
                              {log.failure_reason}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {log.status === 'failed' && (
                            <button
                              onClick={() => handleRetryEmail(log.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer"
                            >
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {emailLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400 italic">
                          No email delivery logs found matching the filter.
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

      {/* ─── FULL REPORT CARD PREVIEW MODAL ─── */}
      <AnimatePresence>
        {previewCard && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-100 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <h3 className="text-lg font-black text-slate-800">Report Card Preview</h3>
                <button
                  onClick={() => setPreviewCard(null)}
                  className="p-2 text-gray-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ReportCardView reportCard={previewCard} showActions={true} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── RELEASE CONFIRMATION & EMAIL STATUS MODAL ─── */}
      <AnimatePresence>
        {releaseConfirmCard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Release Report Card</h3>
                  <p className="text-xs text-gray-500">{releaseConfirmCard.student?.full_name}</p>
                </div>
              </div>

              {!releaseResult ? (
                <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p>Releasing will perform the following actions:</p>
                  <ul className="list-disc list-inside space-y-1 font-medium text-slate-700">
                    <li>Mark report card as officially released</li>
                    <li>Create student in-app portal notification</li>
                    <li>Dispatch official HTML report card email to Student ({releaseConfirmCard.student?.email || 'N/A'})</li>
                    <li>Dispatch official HTML report card email with secure token link to Parent ({releaseConfirmCard.student?.parent_email || 'N/A'})</li>
                    <li>Record email delivery audit events</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3 text-xs bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 font-black">
                    <CheckCircle className="w-4 h-4" /> Released Successfully!
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <strong>Student Notification:</strong> Created
                    </div>
                    <div>
                      <strong>Student Email:</strong> {releaseResult.email_delivery?.student?.status} ({releaseResult.email_delivery?.student?.message})
                    </div>
                    <div>
                      <strong>Parent Email:</strong> {releaseResult.email_delivery?.parent?.status} ({releaseResult.email_delivery?.parent?.message})
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => { setReleaseConfirmCard(null); setReleaseResult(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Close
                </button>
                {!releaseResult && (
                  <button
                    onClick={handleExecuteRelease}
                    disabled={releasing}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    {releasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Confirm Release
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── EMAIL PREVIEW MODAL ─── */}
      <AnimatePresence>
        {emailPreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-black text-slate-800 text-base">Email Template Preview</h3>
                  <p className="text-xs text-gray-500">Subject: {emailPreview.subject}</p>
                  <p className="text-[11px] text-gray-400">Recipient ({emailPreview.recipient_type}): {emailPreview.recipient}</p>
                </div>
                <button
                  onClick={() => setEmailPreview(null)}
                  className="p-2 text-gray-400 hover:text-slate-800 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className="border border-slate-200 rounded-2xl overflow-hidden p-2 bg-slate-100"
                dangerouslySetInnerHTML={{ __html: emailPreview.html }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── WITHHOLD MODAL ─── */}
      <AnimatePresence>
        {withholdTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-black text-slate-800">Withhold Report Card</h3>
              <p className="text-xs text-gray-500">
                Specify the reason for withholding {withholdTarget.student?.full_name}'s report card.
              </p>

              <textarea
                rows={3}
                required
                placeholder="e.g. Pending tuition clearance / disciplinary review..."
                value={withholdReason}
                onChange={e => setWithholdReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setWithholdTarget(null); setWithholdReason(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithhold}
                  disabled={!withholdReason}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 shadow-md"
                >
                  Withhold Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
