import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Loader2, CheckCircle, AlertCircle, X, ChevronDown } from 'lucide-react';
import { submitDispute, getDisputes } from '../../../services/disputeService';
import { useEffect } from 'react';

const CATEGORIES = ['general', 'complaint', 'suggestion', 'query'];

const StatusBadge = ({ status }) => {
  const map = {
    open: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
    resolved: 'bg-green-50 text-green-600 border-green-100',
    closed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] || map.open}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const TeacherDisputePage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'general' });

  const fetchDisputes = async () => {
    try {
      const res = await getDisputes();
      setDisputes(res?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitDispute(form);
      setAlert({ type: 'success', message: 'Your message has been sent to the admin.' });
      setShowForm(false);
      setForm({ subject: '', message: '', category: 'general' });
      fetchDisputes();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to submit.' });
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      {/* Alert */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-black text-gray-800">Disputes & Feedback</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-md shadow-blue-500/20 transition-all">
          <Send className="w-4 h-4" /> New Message
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Send Message to Admin</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-blue-400 capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Subject</label>
                  <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief subject..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Message</label>
                <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5} placeholder="Describe your issue, suggestion, or feedback..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-blue-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disputes list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">No disputes or feedback yet.</p>
            <p className="text-xs mt-1">Use the button above to send a message to the admin.</p>
          </div>
        ) : disputes.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800 text-sm">{d.subject}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">{new Date(d.created_at).toLocaleDateString('en-NG')}</span>
                <StatusBadge status={d.status} />
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">{d.message}</p>
            {d.admin_reply && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Admin Reply</p>
                <p className="text-xs text-blue-800">{d.admin_reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TeacherDisputePage;
