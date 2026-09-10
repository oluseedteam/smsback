import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
  Calendar,
  X,
  Loader2,
  RefreshCw,
  Eye,
  User,
  MapPin,
  Send,
  Check,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { getInquiries, updateInquiry, deleteInquiry, clearAllInquiries } from '../../../services/inquiryService';
import { confirmDialog } from '../../../services/dialogService';
import toast from 'react-hot-toast';

const AdminInquiriesPage = () => {

  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    contacted: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInquiries({
        search: searchTerm,
        status: statusFilter,
        inquiry_type: typeFilter,
      });

      setInquiries(res.data || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch {
      console.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const openInquiryModal = (inq) => {
    setSelectedInquiry(inq);
    setAdminNotes(inq.admin_notes || '');
    setModalOpen(true);

    // Mark as read locally and on server
    if (!inq.is_read) {
      updateInquiry(inq.id, { is_read: true }).catch(() => {});
      setInquiries((prev) =>
        prev.map((item) => (item.id === inq.id ? { ...item, is_read: true } : item))
      );
      setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedInquiry) return;
    setUpdatingStatus(true);
    try {
      const res = await updateInquiry(selectedInquiry.id, { status: newStatus });
      toast.success(`Inquiry marked as ${newStatus}`);
      const updated = res.data || { ...selectedInquiry, status: newStatus };
      setSelectedInquiry(updated);
      setInquiries((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      fetchInquiries();
    } catch {
      toast.error('Failed to update inquiry status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    try {
      const res = await updateInquiry(selectedInquiry.id, { admin_notes: adminNotes });
      toast.success('Admin notes saved successfully');
      const updated = res.data || { ...selectedInquiry, admin_notes: adminNotes };
      setSelectedInquiry(updated);
      setInquiries((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInquiry(id);
      toast.success('Inquiry removed');
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      if (selectedInquiry?.id === id) {
        setModalOpen(false);
        setSelectedInquiry(null);
      }
      setConfirmDeleteId(null);
      fetchInquiries();
    } catch {
      toast.error('Failed to delete inquiry');
    }
  };

  const handleClearResolved = async () => {
    const ok = await confirmDialog({
      title: 'Clear Resolved Inquiries',
      message: 'Are you sure you want to clear all resolved inquiries?',
      confirmText: 'Yes, Clear Resolved',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await clearAllInquiries(true);
      toast.success('Resolved inquiries cleared');
      fetchInquiries();
    } catch {
      toast.error('Failed to clear resolved inquiries');
    }
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            <Send className="w-3.5 h-3.5" />
            Contacted
          </span>
        );
      case 'spam':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/60">
            <AlertCircle className="w-3.5 h-3.5" />
            Spam
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    const isTour = type?.toLowerCase().includes('tour') || type?.toLowerCase().includes('visit');
    const isAdmission = type?.toLowerCase().includes('admissions') || type?.toLowerCase().includes('enrollment');
    
    if (isTour) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
          <MapPin className="w-3 h-3 text-purple-500" />
          Campus Tour
        </span>
      );
    }
    if (isAdmission) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          <BookOpen className="w-3 h-3 text-blue-500" />
          Admissions
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
        <MessageSquare className="w-3 h-3 text-slate-500" />
        {type || 'General Inquiry'}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-900/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 tracking-tight">
                Contact Inquiries & Tour Bookings
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Incoming public inquiries from prospective parents and visitors
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInquiries()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {stats.resolved > 0 && (
            <button
              onClick={handleClearResolved}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Resolved
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Received</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-500">All submissions</span>
          </div>
        </div>

        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Action</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-black text-amber-800">{stats.pending}</span>
            <span className="text-xs font-semibold text-amber-600">Awaiting review</span>
          </div>
        </div>

        <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Contacted</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-black text-blue-800">{stats.contacted}</span>
            <span className="text-xs font-semibold text-blue-600">In communication</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolved</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-black text-emerald-800">{stats.resolved}</span>
            <span className="text-xs font-semibold text-emerald-600">Completed</span>
          </div>
        </div>

        <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Tour Bookings</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-black text-purple-800">{stats.tours}</span>
            <span className="text-xs font-semibold text-purple-600">Campus visits</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </form>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="spam">Spam</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Admissions & Enrollment">Admissions & Enrollment</option>
              <option value="Book a Campus Tour">Book a Campus Tour</option>
              <option value="Academic Curriculum Inquiry">Academic Curriculum</option>
              <option value="Fee Schedule Request">Fee Schedule Request</option>
              <option value="General Question / Feedback">General Question</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inquiries Content List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Loading contact inquiries...
            </p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-heading">No Inquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no inquiries matching your selected search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                onClick={() => openInquiryModal(inq)}
                className={`p-5 sm:p-6 transition-all hover:bg-slate-50/80 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  !inq.is_read ? 'bg-blue-50/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar Initial */}
                  <div className="w-11 h-11 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {inq.name ? inq.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{inq.name}</span>
                        {!inq.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </h4>
                      {getTypeBadge(inq.inquiry_type)}
                      {getStatusBadge(inq.status)}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {inq.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {inq.email}
                      </span>
                      {inq.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {inq.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(inq.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right quick actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInquiryModal(inq);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review & Reply
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(inq.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inquiry Detail & Reply Modal */}
      <AnimatePresence>
        {modalOpen && selectedInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">
                      Inquiry Details
                    </h3>
                    <p className="text-xs text-slate-400">
                      Received {formatDate(selectedInquiry.created_at)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sender info pill box */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-900">
                      {selectedInquiry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(selectedInquiry.inquiry_type)}
                    {getStatusBadge(selectedInquiry.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {selectedInquiry.email}
                    </a>
                  </div>
                  {selectedInquiry.phone ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        className="font-semibold text-emerald-600 hover:underline"
                      >
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">No phone number provided</div>
                  )}
                </div>
              </div>

              {/* Message box */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Message / Question Content
                </label>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Quick Communication Actions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Direct Response Actions
                </label>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: Inquiry with GHRA`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Send Email Response
                  </a>

                  {selectedInquiry.phone && (
                    <>
                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Phone
                      </a>

                      <a
                        href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold shadow-md shadow-green-500/20 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Status Selector & Admin Follow-up Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Update Inquiry Status
                  </label>
                  <select
                    value={selectedInquiry.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="contacted">Contacted / In Progress</option>
                    <option value="resolved">Resolved / Completed</option>
                    <option value="spam">Mark as Spam</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => handleDelete(selectedInquiry.id)}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Inquiry
                  </button>
                </div>
              </div>

              {/* Admin Internal Notes Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Internal Admin & Admissions Notes
                  </label>
                  {savingNotes && (
                    <span className="text-[11px] text-blue-600 flex items-center gap-1 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                    </span>
                  )}
                </div>
                <textarea
                  rows="3"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record internal remarks, campus tour schedules, or follow-up details..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-sm"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Delete Inquiry?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This action will permanently delete this inquiry from the database.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInquiriesPage;
