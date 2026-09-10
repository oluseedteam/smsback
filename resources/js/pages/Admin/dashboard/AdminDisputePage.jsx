import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Loader2, CheckCircle, AlertCircle, X, Send, Filter } from 'lucide-react';
import { getDisputes, replyDispute, clearAllDisputes } from '../../../services/disputeService';
import { confirmDialog } from '../../../services/dialogService';

const StatusBadge = ({ status }) => {
  const map = {
    open: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] || map.open}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const AdminDisputePage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeDispute, setActiveDispute] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [replying, setReplying] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await getDisputes();
      setDisputes(res?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleReply = async (e) => {
    e.preventDefault();
    setReplying(true);
    try {
      await replyDispute(activeDispute.id, { admin_reply: replyText, status: replyStatus });
      setAlert({ type: 'success', message: 'Reply sent successfully.' });
      setActiveDispute(null);
      setReplyText('');
      fetchDisputes();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to reply.' });
    } finally { setReplying(false); }
  };

  const handleClearAll = async () => {
    const ok = await confirmDialog({
      title: 'Clear All Feedback & Disputes',
      message: 'Delete all feedback and dispute records permanently?',
      confirmText: 'Yes, Clear All',
      type: 'danger',
    });
    if (!ok) return;
    try {
        await clearAllDisputes();
        setAlert({ type: 'success', message: 'All records cleared.' });
        fetchDisputes();
    } catch {
        setAlert({ type: 'error', message: 'Failed to clear records.' });
    }
  };

  const filtered = filter === 'all' ? disputes : disputes.filter(d => d.status === filter);

  const senderName = (d) => d.sender?.full_name || 'Unknown';
  const senderType = (d) => d.sender_type?.includes('Teacher') ? 'Teacher' : 'Student';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <MessageSquare className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-black text-gray-800">Disputes & Feedback</h1>
        <div className="ml-auto flex items-center gap-3">
            <button onClick={handleClearAll} className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-all">
                Clear All
            </button>
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            {disputes.filter(d => d.status === 'open').length} Open
            </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.replace('_', ' ')} {f !== 'all' && `(${disputes.filter(d => d.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-bold text-sm">No disputes found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${d.sender_type?.includes('Teacher') ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {senderName(d)?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{senderName(d)}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{senderType(d)} • {new Date(d.created_at).toLocaleDateString('en-NG')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.category}</span>
                  <StatusBadge status={d.status} />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{d.subject}</h3>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">{d.message}</p>
              {d.admin_reply && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Your Reply</p>
                  <p className="text-xs text-blue-800">{d.admin_reply}</p>
                </div>
              )}
              <button onClick={() => { setActiveDispute(d); setReplyStatus(d.status === 'open' ? 'in_progress' : d.status); setReplyText(d.admin_reply || ''); }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                <Send className="w-3.5 h-3.5" /> {d.admin_reply ? 'Edit Reply' : 'Reply'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {activeDispute && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Reply to: {activeDispute.subject}</h2>
              <button onClick={() => setActiveDispute(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleReply} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Update Status</label>
                <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Reply Message</label>
                <textarea required value={replyText} onChange={e => setReplyText(e.target.value)}
                  rows={5} placeholder="Write your reply..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-blue-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setActiveDispute(null)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={replying}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2">
                  {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Reply
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminDisputePage;
