import React, { useState, useEffect, useCallback } from 'react';

import { ClipboardCheck, Search, CheckCircle, Clock, Loader2, AlertCircle, Eye, RefreshCw, X } from 'lucide-react';
import apiFetch from '../../../services/api';
import PopupModal from '../../../components/PopupModal';
import { confirmDialog } from '../../../services/dialogService';

const CbtResultApprovalPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'all', 'pending', 'released'
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const data = await apiFetch(`/cbt-submissions${statusParam}`);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Failed to load CBT submissions' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleReleaseResult = async (id) => {
    setActionLoading(true);
    try {
      await apiFetch(`/cbt-submissions/${id}/release`, { method: 'PATCH' });
      setPopup({ isOpen: true, type: 'success', title: 'Released!', message: 'Result released successfully.' });
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (err) {
      setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Failed to release result' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseAll = async () => {
    const ok = await confirmDialog({
      title: 'Release All CBT Results',
      message: 'Are you sure you want to release ALL pending CBT results?',
      confirmText: 'Yes, Release All',
      type: 'primary',
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await apiFetch('/cbt-submissions/release-all', { method: 'PATCH' });
      setPopup({ isOpen: true, type: 'success', title: 'Success', message: 'All pending results have been released.' });
      fetchSubmissions();
    } catch (err) {
      setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Failed to release all results' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const studentName = sub.student?.full_name?.toLowerCase() || '';
    const studentId = sub.student?.student_id?.toLowerCase() || '';
    const testTitle = sub.test?.title?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return studentName.includes(query) || studentId.includes(query) || testTitle.includes(query);
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-blue-900 flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-blue-500" /> CBT Results Approval
        </h1>
        <div className="flex items-center gap-3">
          {submissions.some(s => !s.result_released) && (
            <button onClick={handleReleaseAll} disabled={actionLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm transition-colors flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Release All Pending
            </button>
          )}
          <button onClick={fetchSubmissions} disabled={loading} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 text-gray-500 disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center bg-gray-50/50">
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full sm:w-auto">
             {['all', 'pending', 'released'].map(s => (
               <button key={s} onClick={() => setFilterStatus(s)}
                 className={`px-5 py-2 font-bold text-sm uppercase tracking-wider transition-colors ${
                   filterStatus === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                 }`}>
                 {s}
               </button>
             ))}
          </div>

          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search by student name, ID, or test title..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-500 text-sm font-medium" />
          </div>
        </div>

        {/* Submissions List */}
        <div className="p-0 overflow-x-auto w-full">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-bold">No submissions found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead>
                <tr className="text-gray-400 bg-gray-50 text-xs uppercase tracking-widest border-b border-gray-100">
                  <th className="py-4 px-6 font-bold">Student</th>
                  <th className="py-4 px-6 font-bold">Test Info</th>
                  <th className="py-4 px-6 font-bold text-center">Score</th>
                  <th className="py-4 px-6 font-bold text-center">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6">
                       <p className="font-black text-gray-800">{sub.student?.full_name}</p>
                       <p className="text-[10px] uppercase font-bold text-gray-400">{sub.student?.student_id}</p>
                    </td>
                    <td className="py-4 px-6">
                       <p className="font-bold text-gray-700">{sub.test?.title}</p>
                       <p className="text-xs text-blue-600 font-semibold">{sub.test?.subject?.name} • {sub.test?.schoolClass?.name}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className={`font-black text-lg ${sub.score >= 70 ? 'text-green-600' : sub.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                         {sub.score}%
                       </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                       {sub.result_released ? (
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full uppercase">
                           <CheckCircle className="w-3 h-3" /> Released
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 text-[10px] font-black rounded-full uppercase">
                           <Clock className="w-3 h-3" /> Pending
                         </span>
                       )}
                    </td>
                    <td className="py-4 px-6 text-right">
                       <button onClick={() => setSelectedSubmission(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-2 ml-auto">
                         <Eye className="w-4 h-4" /> View Match
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden shadow-blue-900/20 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                   <h2 className="text-xl font-black text-blue-900 flex items-center gap-2">
                     <AlertCircle className="w-5 h-5 text-blue-500" /> Review CBT Result
                   </h2>
                   <button onClick={() => setSelectedSubmission(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                   {/* Grid info */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student</p>
                         <p className="font-bold text-gray-800 text-sm">{selectedSubmission.student?.full_name}</p>
                         <p className="text-xs text-gray-500">{selectedSubmission.student?.student_id}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Test Title</p>
                         <p className="font-bold text-gray-800 text-sm truncate">{selectedSubmission.test?.title}</p>
                         <p className="text-xs text-blue-600 font-bold">{selectedSubmission.test?.subject?.name}</p>
                      </div>
                   </div>

                   <div className="py-6 border-y border-gray-50 flex items-center justify-center gap-12">
                      <div className="text-center">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Final Score</p>
                         <span className={`text-4xl font-black ${selectedSubmission.score >= 70 ? 'text-green-500' : selectedSubmission.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                           {selectedSubmission.score}%
                         </span>
                      </div>
                      <div className="text-center space-y-2">
                         <div className="flex gap-4 text-xs font-bold font-mono">
                            <span className="text-green-600 bg-green-50 px-3 py-1 rounded-lg">✅ {selectedSubmission.correct_answers} Correct</span>
                            <span className="text-red-600 bg-red-50 px-3 py-1 rounded-lg">❌ {selectedSubmission.wrong_answers} Wrong</span>
                         </div>
                         <p className="text-[10px] text-gray-400 font-black uppercase">Out of {selectedSubmission.total_questions} Questions</p>
                      </div>
                   </div>

                   {selectedSubmission.result_released ? (
                      <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 text-center font-bold text-sm">
                         This result has already been released to the student.
                      </div>
                   ) : (
                      <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 text-sm font-medium">
                         The result is currently pending. The student cannot view their exact score and breakdown until it is released by an admin.
                      </div>
                   )}
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                   <button onClick={() => setSelectedSubmission(null)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">Close</button>
                   {!selectedSubmission.result_released && (
                     <button onClick={() => handleReleaseResult(selectedSubmission.id)} disabled={actionLoading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm flex items-center gap-2">
                       {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                       Approve & Release Result
                     </button>
                   )}
                </div>
           </div>
        </div>
      )}

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
      />
    </div>
  );
};

export default CbtResultApprovalPage;
