import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Copy, 
  Loader2, 
  Mail, 
  Phone, 
  BookOpen, 
  GraduationCap, 
  Briefcase,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  getAdminAdmissions, 
  updateAdmissionStatus, 
  deleteAdmission 
} from '../../../services/admissionService';
import { confirmDialog } from '../../../services/dialogService';
import toast from 'react-hot-toast';

const AdminAdmissionsPage = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, students: 0, teachers: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'teacher'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [search, setSearch] = useState('');

  // Modals
  const [selectedApp, setSelectedApp] = useState(null); // for viewing dossier
  const [actionModal, setActionModal] = useState(null); // { type: 'approve' | 'reject', app: object }
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);

  const fetchApplications = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const res = await getAdminAdmissions({
        type: roleFilter,
        status: statusFilter,
        search: search.trim(),
      });
      setApplications(res.applications || []);
      setStats(res.stats || { total: 0, pending: 0, approved: 0, rejected: 0, students: 0, teachers: 0 });
      if (showToast) toast.success('Admissions list updated.');
    } catch (err) {
      toast.error(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenAction = (app, type) => {
    setActionModal({ type, app });
    setAdminNotes(type === 'approve' ? 'Congratulations! Your application has been approved.' : '');
    setProvisionResult(null);
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setSubmittingAction(true);

    try {
      const res = await updateAdmissionStatus(actionModal.app.id, {
        status: actionModal.type === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes,
      });

      toast.success(res.message || `Application ${actionModal.type === 'approve' ? 'Approved' : 'Declined'}.`);
      
      if (res.provision_info) {
        setProvisionResult(res.provision_info);
      } else {
        setActionModal(null);
      }
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Failed to update application status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmDialog({
      title: 'Delete Application',
      message: 'Are you sure you want to delete this application record?',
      confirmText: 'Yes, Delete',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await deleteAdmission(id);
      toast.success('Application removed.');
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Failed to delete application.');
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1 border border-blue-200">
            <GraduationCap className="w-4 h-4" />
            <span>Admissions & Recruitment Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            Admissions & Career Applications
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review and accept or decline student admissions and teacher employment applications.
          </p>
        </div>

        <button
          onClick={() => fetchApplications(true)}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Inquiries</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Student Apps</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{stats.students}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Teacher Apps</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.teachers}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Declined</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{stats.rejected}</h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Inquiries' },
              { id: 'student', label: '🧑‍🎓 Students' },
              { id: 'teacher', label: '👩‍🏫 Teachers' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'pending', label: '⏳ Pending' },
              { id: 'approved', label: '✅ Approved' },
              { id: 'rejected', label: '❌ Rejected' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name, email, phone, reference ID, class, or specialization..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

      </div>

      {/* Applications Table / Cards */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              📂
            </div>
            <h3 className="text-base font-bold text-gray-800">No applications match your filter</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Try selecting a different status or clear your search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Applicant Info</th>
                  <th className="py-4 px-6">Type & Role</th>
                  <th className="py-4 px-6">Class / Specialization</th>
                  <th className="py-4 px-6">Contact & Parent</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-50/20 transition-colors group">
                    
                    {/* Applicant name + Reference */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          app.type === 'teacher' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {app.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-snug">{app.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {app.application_number}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Type */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.type === 'teacher'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {app.type === 'teacher' ? <Briefcase className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                        <span>{app.type === 'teacher' ? 'Teacher' : 'Student'}</span>
                      </span>
                    </td>

                    {/* Class or Specialization */}
                    <td className="py-4 px-6">
                      <div className="text-xs text-gray-700">
                        {app.type === 'teacher' ? (
                          <div>
                            <p className="font-bold text-gray-900">{app.subject_specialization || 'Not Specified'}</p>
                            <p className="text-gray-400 text-[11px] mt-0.5">{app.qualification || 'Educator'}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-gray-900">{app.target_class || 'Class Pending'}</p>
                            {app.department && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                {app.department}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Contact & Parent */}
                    <td className="py-4 px-6">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{app.email}</span>
                        </div>
                        {app.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{app.phone}</span>
                          </div>
                        )}
                        {app.parent_name && (
                          <p className="text-[11px] text-gray-400">
                            Parent: <span className="text-gray-700 font-medium">{app.parent_name}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.status === 'approved' ? 'Approved' : app.status === 'rejected' ? 'Declined' : 'Pending'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        
                        {/* View Dossier */}
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition cursor-pointer"
                          title="View Full Application Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve Button */}
                        {app.status !== 'approved' && (
                          <button
                            onClick={() => handleOpenAction(app, 'approve')}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition cursor-pointer font-bold flex items-center gap-1 text-xs px-2.5"
                            title="Accept / Approve Application"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Accept</span>
                          </button>
                        )}

                        {/* Reject Button */}
                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => handleOpenAction(app, 'reject')}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition cursor-pointer font-bold flex items-center gap-1 text-xs px-2.5"
                            title="Decline Application"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* VIEW DOSSIER MODAL */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${selectedApp.type === 'teacher' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedApp.type === 'teacher' ? <Briefcase className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{selectedApp.full_name}</h2>
                    <p className="text-xs text-gray-500 font-mono">Ref: {selectedApp.application_number}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
                
                {/* Status Box */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Review Status</p>
                    <p className="font-bold text-gray-900 mt-0.5 capitalize">{selectedApp.status}</p>
                  </div>
                  {selectedApp.provisioned_id_code && (
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-gray-400 uppercase">Assigned Portal ID</p>
                      <p className="font-mono font-bold text-blue-600 mt-0.5">{selectedApp.provisioned_id_code}</p>
                    </div>
                  )}
                </div>

                {/* Grid of Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedApp.email}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedApp.phone || 'N/A'}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gender & DOB</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {selectedApp.gender || 'N/A'} {selectedApp.date_of_birth ? `• DOB: ${selectedApp.date_of_birth}` : ''}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {selectedApp.type === 'teacher' ? 'Teaching Specialization' : 'Target Class'}
                    </span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {selectedApp.type === 'teacher' ? selectedApp.subject_specialization : selectedApp.target_class}
                    </p>
                  </div>
                </div>

                {/* Additional student details */}
                {selectedApp.type === 'student' && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Parent & Background Information</h4>
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
                      <p><span className="font-bold text-gray-700">Parent/Guardian:</span> {selectedApp.parent_name || 'N/A'}</p>
                      <p><span className="font-bold text-gray-700">Parent Phone:</span> {selectedApp.parent_phone || 'N/A'}</p>
                      <p><span className="font-bold text-gray-700">Parent Email:</span> {selectedApp.parent_email || 'N/A'}</p>
                      <p><span className="font-bold text-gray-700">Previous School:</span> {selectedApp.previous_school || 'N/A'}</p>
                      <p><span className="font-bold text-gray-700">Last Grade Passed:</span> {selectedApp.last_grade_completed || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {/* Additional teacher details */}
                {selectedApp.type === 'teacher' && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Professional Career Details</h4>
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2 text-xs">
                      <p><span className="font-bold text-gray-700">Qualification:</span> {selectedApp.qualification || 'N/A'}</p>
                      <p><span className="font-bold text-gray-700">Experience:</span> {selectedApp.experience_years || 'N/A'}</p>
                      <p><span className="font-bold text-gray-700">Previous School:</span> {selectedApp.previous_school || 'N/A'}</p>
                      {selectedApp.cover_letter && (
                        <div>
                          <span className="font-bold text-gray-700 block mb-1">Cover Note / Teaching Statement:</span>
                          <p className="text-gray-600 bg-white p-3 rounded-xl border border-gray-200/70 leading-relaxed">
                            {selectedApp.cover_letter}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedApp.address && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Residential Address</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedApp.address}</p>
                  </div>
                )}

                {selectedApp.admin_notes && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Admin Decision Note</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedApp.admin_notes}</p>
                  </div>
                )}
              </div>

              {/* Footer action buttons */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-slate-50/50">
                {selectedApp.status !== 'approved' && (
                  <button
                    onClick={() => {
                      const app = selectedApp;
                      setSelectedApp(null);
                      handleOpenAction(app, 'approve');
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept Application</span>
                  </button>
                )}

                {selectedApp.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      const app = selectedApp;
                      setSelectedApp(null);
                      handleOpenAction(app, 'reject');
                    }}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline Application</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPROVE / REJECT CONFIRMATION MODAL */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6"
            >
              {provisionResult ? (
                /* PROVISION CREDENTIALS SUCCESS DISPLAY */
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                    <CheckCircle />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Application Approved & Account Created!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      A new {provisionResult.account_type} has been provisioned.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Assigned Portal Login ID</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{provisionResult.login_id}</span>
                        <button onClick={() => copyText(provisionResult.login_id)} className="text-slate-400 hover:text-slate-700">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Email Address</span>
                      <span className="font-medium text-slate-800 text-xs">{provisionResult.email}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase">Temporary Password</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600">{provisionResult.temporary_password}</span>
                        <button onClick={() => copyText(provisionResult.temporary_password)} className="text-slate-400 hover:text-slate-700">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActionModal(null);
                      setProvisionResult(null);
                    }}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition text-xs cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                /* CONFIRM DECISION FORM */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${actionModal.type === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {actionModal.type === 'approve' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {actionModal.type === 'approve' ? 'Accept & Approve Application' : 'Decline Application'}
                        </h3>
                        <p className="text-xs text-slate-500">Applicant: {actionModal.app.full_name}</p>
                      </div>
                    </div>

                    <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {actionModal.type === 'approve'
                      ? 'Approving this application will mark the record as Approved and automatically generate their Portal Login ID and temporary credentials.'
                      : 'Declining this application will update the candidate status so they see the decision when tracking their application.'}
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Decision Note / Remarks (Optional)
                    </label>
                    <textarea
                      rows="3"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add an internal note or instructions for candidate..."
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActionModal(null)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={handleConfirmAction}
                      className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
                        actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {submittingAction ? (
                        <span>Processing...</span>
                      ) : (
                        <span>{actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminAdmissionsPage;
