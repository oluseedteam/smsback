import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Megaphone, User, Users, Loader2, X, CheckCircle, AlertCircle, Trash2, Smile, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { broadcastMessageToTeachers, getMessages, deleteMessage } from '../../../services/messageService';
import apiFetch from '../../../services/api';
import toast from 'react-hot-toast';

const AdminMessagesPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Broadcast form
  const [broadcastContent, setBroadcastContent] = useState('');
  const [targetType, setTargetType] = useState('all_teachers'); // 'all_teachers' | 'all_students' | 'everyone' | 'teacher' | 'student'
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, studentsRes, msgsRes] = await Promise.all([
        apiFetch('/users?role=teacher'),
        apiFetch('/users?role=student'),
        getMessages(),
      ]);
      setTeachers(teachersRes?.data || teachersRes?.teachers || []);
      setStudents(studentsRes?.data || studentsRes?.students || []);
      setMessages(msgsRes?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;
    
    if ((targetType === 'teacher' || targetType === 'student') && !selectedRecipientId) {
      setAlert({ type: 'error', message: 'Please select a recipient.' });
      return;
    }

    setBroadcastSending(true);
    try {
      const payload = {
        content: broadcastContent,
        target_type: targetType,
        teacher_id: targetType === 'teacher' ? parseInt(selectedRecipientId) : undefined,
        student_id: targetType === 'student' ? parseInt(selectedRecipientId) : undefined,
      };
      
      const res = await broadcastMessageToTeachers(payload);
      setAlert({ type: 'success', message: res.message || 'Message sent successfully.' });
      setBroadcastContent('');
      setSelectedRecipientId('');
      await fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to send.' });
    } finally {
      setBroadcastSending(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMessage(confirmDeleteId);
      toast.success('Message record deleted permanently');
      setConfirmDeleteId(null);
      fetchData();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleClearHistory = async () => {
    try {
        await apiFetch('/admin/messages/wipe-all', { method: 'DELETE' });
        toast.success('All communication records cleared');
        setMessages([]);
        setConfirmClear(false);
    } catch {
        toast.error('Failed to clear logs');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      {/* Alert Banner */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-lg ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto hover:bg-black/5 p-1 rounded-full"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <Megaphone className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Admin Center</h1>
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest leading-none mt-1 opacity-60">Control all school communications</p>
          </div>
        </div>

        <Link
          to="/admin/inquiries"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-black uppercase tracking-wider transition shadow-sm self-start sm:self-auto"
        >
          <Mail className="w-4 h-4" />
          <span>Public Inquiries</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Broadcast Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100 sticky top-4">
            <h2 className="font-black text-gray-800 flex items-center gap-2 mb-8 text-sm uppercase tracking-widest">
              <Megaphone className="w-4 h-4 text-orange-500" /> post announcement
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Broadcast Target Group</label>
                <select value={targetType} onChange={e => { setTargetType(e.target.value); setSelectedRecipientId(''); }}
                  className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-tight bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all appearance-none cursor-pointer">
                  <option value="all_teachers">📢 All Teachers</option>
                  <option value="all_students">🎓 All Students</option>
                  <option value="everyone">🌎 Everyone</option>
                  <option value="teacher">👤 Specific Teacher</option>
                  <option value="student">🎓 Specific Student</option>
                </select>
              </div>

              {(targetType === 'teacher' || targetType === 'student') && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target {targetType}</label>
                  <select value={selectedRecipientId} onChange={e => setSelectedRecipientId(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-tight bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all appearance-none cursor-pointer">
                    <option value="">-- select recipient --</option>
                    {(targetType === 'teacher' ? teachers : students).map(item => (
                      <option key={item.id} value={item.id}>{item.full_name}</option>
                    ))}
                  </select>
                </motion.div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Broadcast Content</label>
                <textarea
                  required
                  value={broadcastContent}
                  onChange={e => setBroadcastContent(e.target.value)}
                  placeholder="What would you like to announce?"
                  className="w-full border-2 border-gray-100 rounded-3xl px-6 py-5 text-gray-800 text-sm font-medium min-h-[220px] bg-gray-50/30 focus:bg-white focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner"
                />
              </div>

              <button type="submit" disabled={broadcastSending || !broadcastContent.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                {broadcastSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Post Now
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-black text-gray-800 flex items-center gap-2 text-sm uppercase tracking-widest">
                <Users className="w-4 h-4 text-blue-500" /> Communication Logs
                </h2>
                <button onClick={() => setConfirmClear(true)} className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-all">
                    Clear Logs
                </button>
            </div>
            {messages.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed border-gray-50 rounded-4xl bg-gray-50/20">
                <Smile className="w-16 h-16 text-gray-200 mx-auto mb-6 opacity-20" />
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest">No communication records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.slice(0, 20).map(m => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={m.id} className="flex items-start gap-5 p-6 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 rounded-3xl border border-gray-100 transition-all group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.receiver?.role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                      {m.receiver?.role === 'teacher' ? <User className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                            <p className="text-xs font-black text-gray-800 uppercase tracking-tight truncate leading-none mb-1">
                            {m.receiver?.full_name || m.target_type?.replace('_', ' ') || 'Global Recipient'}
                            </p>
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">{new Date(m.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <button 
                            onClick={() => setConfirmDeleteId(m.id)}
                            className="p-2.5 bg-white rounded-xl border border-gray-100 text-gray-300 hover:text-red-500 transition-all shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">{m.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmClear && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-4xl p-10 max-w-sm w-full shadow-2xl border border-gray-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Wipe Logs?</h3>
                    <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">This will erase all communication history from the database. This is a destructive action.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleClearHistory} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95">Yes, Wipe Everything</button>
                        <button onClick={() => setConfirmClear(false)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Cancel Operation</button>
                    </div>
                </motion.div>
            </div>
        )}

        {confirmDeleteId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-4xl p-10 max-w-sm w-full shadow-2xl border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                        <Trash2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Delete Record?</h3>
                    <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">Are you sure you want to remove this specific communication record?</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleDeleteMessage} className="w-full py-4 bg-gray-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Permanent Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Keep Record</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminMessagesPage;
