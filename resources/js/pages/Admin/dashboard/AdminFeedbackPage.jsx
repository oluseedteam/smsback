import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Star, 
  Trash2, 
  User, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Users,
  Check,
  X,
  RefreshCw,
  Edit3,
  Bookmark,
  Share2
} from 'lucide-react';
import apiFetch from '../../../services/api';
import { confirmDialog } from '../../../services/dialogService';
import toast from 'react-hot-toast';

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    parents: 0,
    alumni: 0,
    average_rating: 5,
    published_testimonials: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'reviewed', 'published', 'archived'
  const [filterRole, setFilterRole] = useState('all'); // 'all', 'parent', 'alumni', 'student', 'community'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/feedbacks', { showToast: false });
      // The backend returns { feedbacks: { data: [...], total: ... }, stats: { ... } } or raw array
      const list = Array.isArray(res)
        ? res
        : (Array.isArray(res?.feedbacks?.data)
            ? res.feedbacks.data
            : (Array.isArray(res?.feedbacks)
                ? res.feedbacks
                : (Array.isArray(res?.data) ? res.data : [])));

      setFeedbacks(list);

      if (res?.stats) {
        setStats(res.stats);
      } else {
        // Compute fallback stats if not provided
        setStats({
          total: list.length,
          parents: list.filter(f => (f.role_type || f.role) === 'parent').length,
          alumni: list.filter(f => (f.role_type || f.role) === 'alumni').length,
          average_rating: list.length > 0 
            ? (list.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0) / list.length).toFixed(1) 
            : 5.0,
          published_testimonials: list.filter(f => f.is_published || f.status === 'published').length,
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load feedback records');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus, isPublished = null, notes = null) => {
    setActionLoading(true);
    try {
      const payload = {};
      if (newStatus) payload.status = newStatus;
      if (isPublished !== null) payload.is_published = isPublished;
      if (notes !== null) payload.admin_notes = notes;

      await apiFetch(`/admin/feedbacks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        showToast: false
      });

      toast.success(
        newStatus === 'published' 
          ? 'Feedback approved & published as testimonial!' 
          : newStatus === 'archived'
          ? 'Feedback moved to archive.'
          : 'Feedback updated successfully.'
      );

      if (selectedFeedback && selectedFeedback.id === id) {
        setSelectedFeedback(prev => ({
          ...prev,
          ...payload,
          status: newStatus || prev.status,
          is_published: isPublished !== null ? isPublished : prev.is_published,
          admin_notes: notes !== null ? notes : prev.admin_notes
        }));
      }

      fetchFeedbacks();
    } catch (err) {
      toast.error(err.message || 'Failed to update feedback status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmDialog({
      title: 'Delete Feedback',
      message: 'Are you sure you want to permanently delete this feedback?',
      confirmText: 'Yes, Delete',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await apiFetch(`/admin/feedbacks/${id}`, { 
        method: 'DELETE',
        showToast: false
      });
      toast.success('Feedback record deleted.');
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
      fetchFeedbacks();
    } catch (err) {
      toast.error(err.message || 'Failed to delete feedback');
    }
  };

  const openDetailModal = (item) => {
    setSelectedFeedback(item);
    setAdminNotes(item.admin_notes || '');
  };

  // Safe filtering logic
  const filteredFeedbacks = useMemo(() => {
    if (!Array.isArray(feedbacks)) return [];

    return feedbacks.filter(f => {
      const status = f.status || 'pending';
      const role = f.role_type || f.role || '';
      const name = f.full_name || f.name || '';
      const message = f.message || '';
      const category = f.category || '';
      const subject = f.subject || '';

      const matchesStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'published' 
        ? (f.is_published || status === 'published')
        : status === filterStatus;

      const matchesRole = filterRole === 'all' || role.toLowerCase() === filterRole.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        name.toLowerCase().includes(q) ||
        message.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q) ||
        (f.email && f.email.toLowerCase().includes(q));

      return matchesStatus && matchesRole && matchesQuery;
    });
  }, [feedbacks, filterStatus, filterRole, searchQuery]);

  const getStatusBadge = (status, isPublished) => {
    if (isPublished || status === 'published') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Published
        </span>
      );
    }
    if (status === 'reviewed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
          <Check className="w-3 h-3" /> Reviewed
        </span>
      );
    }
    if (status === 'archived') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Archived
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  const getRoleBadge = (roleType) => {
    const role = (roleType || 'parent').toLowerCase();
    if (role === 'parent') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">Parent</span>;
    }
    if (role === 'alumni') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">Alumni</span>;
    }
    if (role === 'student') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">Student</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">Community</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      
      {/* ── Top Header & Overview ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-800 font-bold border border-blue-100 shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Public Testimonials & Feedback Moderation
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Review, moderate, and publish community feedback and website testimonials
            </p>
          </div>
        </div>

        <button 
          onClick={fetchFeedbacks} 
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Key Statistics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total || feedbacks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Published Testimonials</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.published_testimonials || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Parents</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.parents || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alumni</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats.alumni || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900">{stats.average_rating || '5.0'}</span>
            <div className="flex text-sky-400">
              <Star className="w-4 h-4 fill-sky-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'reviewed', label: 'Reviewed' },
            { id: 'published', label: 'Published' },
            { id: 'archived', label: 'Archived' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition cursor-pointer whitespace-nowrap ${
                filterStatus === tab.id 
                  ? 'bg-white text-blue-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Role & Search filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Roles</option>
              <option value="parent">Parents</option>
              <option value="alumni">Alumni</option>
              <option value="student">Students</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* ── Feedback List Grid ── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Loading submissions...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No feedback found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery || filterStatus !== 'all' || filterRole !== 'all'
              ? 'Try changing or clearing your search filters.'
              : 'Feedback submitted by parents and alumni will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFeedbacks.map(f => {
            const name = f.full_name || f.name || 'Anonymous User';
            const role = f.role_type || f.role || 'Parent';
            const isPub = Boolean(f.is_published || f.status === 'published');
            const rating = Number(f.rating) || 5;

            return (
              <div
                key={f.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Published / Testimonial Badge */}
                {isPub && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>Live Testimonial</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3 pr-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black text-sm border border-blue-100 shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm leading-snug">{name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getRoleBadge(role)}
                          {f.category && (
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                              {f.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-sky-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= rating ? 'fill-sky-400 text-sky-400' : 'text-slate-200'}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-1.5">{rating}.0</span>
                  </div>

                  {/* Subject if available */}
                  {f.subject && (
                    <p className="text-xs font-bold text-slate-800">
                      {f.subject}
                    </p>
                  )}

                  {/* Feedback Message */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 italic line-clamp-4">
                    "{f.message}"
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </span>
                    <div>
                      {getStatusBadge(f.status, f.is_published)}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Approve / Publish as testimonial button */}
                    {!isPub ? (
                      <button
                        onClick={() => handleUpdateStatus(f.id, 'published', true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1"
                        title="Publish on website as testimonial"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Publish</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(f.id, 'reviewed', false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Unpublish from website"
                      >
                        Unpublish
                      </button>
                    )}

                    {/* View Details Modal Button */}
                    <button
                      onClick={() => openDetailModal(f)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                      title="View Details & Notes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    title="Delete feedback"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail / Moderation Modal ── */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Feedback Detail</h3>
                  <p className="text-[11px] text-slate-400">ID #{selectedFeedback.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFeedback(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author Information */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">
                  {selectedFeedback.full_name || selectedFeedback.name}
                </span>
                {getRoleBadge(selectedFeedback.role_type || selectedFeedback.role)}
              </div>

              {selectedFeedback.email && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${selectedFeedback.email}`} className="text-blue-600 hover:underline">
                    {selectedFeedback.email}
                  </a>
                </div>
              )}

              {selectedFeedback.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedFeedback.phone}</span>
                </div>
              )}

              {/* Student or Alumni Context */}
              {selectedFeedback.student_name && (
                <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-bold text-slate-700">Child/Pupil:</span> {selectedFeedback.student_name}
                  {selectedFeedback.student_class && ` (${selectedFeedback.student_class})`}
                </div>
              )}

              {selectedFeedback.graduation_year && (
                <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-bold text-slate-700">Class of:</span> {selectedFeedback.graduation_year}
                  {selectedFeedback.current_occupation && ` • ${selectedFeedback.current_occupation}`}
                </div>
              )}
            </div>

            {/* Rating and Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sky-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= (Number(selectedFeedback.rating) || 5) ? 'fill-sky-400 text-sky-400' : 'text-slate-200'}`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-700 ml-1">
                  ({selectedFeedback.rating || 5}/5 Stars)
                </span>
              </div>

              {selectedFeedback.category && (
                <p className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
                  Category: {selectedFeedback.category}
                </p>
              )}

              {selectedFeedback.subject && (
                <p className="text-xs font-bold text-slate-900 mt-2">
                  {selectedFeedback.subject}
                </p>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                {selectedFeedback.message}
              </div>
            </div>

            {/* Admin Notes Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Internal Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add private administrative remarks or moderation notes..."
                rows={2}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'published', true, adminNotes)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Publish as Testimonial
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'reviewed', false, adminNotes)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Save as Reviewed
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'archived', false, adminNotes)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Archive
                </button>
              </div>

              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-3.5 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
