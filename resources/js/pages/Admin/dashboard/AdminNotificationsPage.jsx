import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Loader2, 
  BookOpen, 
  DollarSign, 
  MessageSquare, 
  ClipboardList, 
  UserPlus, 
  Trash2, 
  AlertCircle, 
  Smile, 
  Mail,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import apiFetch from '../../../services/api';
import { getMessages, deleteMessage } from '../../../services/messageService';
import { getDisputes, deleteDispute } from '../../../services/disputeService';
import { getInquiries, deleteInquiry } from '../../../services/inquiryService';
import toast from 'react-hot-toast';

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  let s = String(dateStr).trim();
  // Normalize "YYYY-MM-DD HH:mm:ss" or naked ISO without timezone to UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s + 'Z';
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const timeAgo = (dateStr) => {
  const d = parseUtcDate(dateStr);
  if (!d) return 'Just now';
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatExactTime = (dateStr) => {
  const d = parseUtcDate(dateStr);
  if (!d) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getIcon = (item) => {
  const action = (item.action || '').toUpperCase();
  const text = `${item.title || ''} ${item.message || ''} ${item.event || ''}`.toLowerCase();

  if (action.includes('REPORT_CARD') || text.includes('report card')) return FileText;
  if (action.includes('PROMOT') || text.includes('promot')) return Layers;
  if (action.includes('PAYMENT') || action.includes('FEE') || text.includes('fee') || text.includes('payment')) return DollarSign;
  if (action.includes('CBT') || text.includes('cbt')) return ClipboardList;
  if (action.includes('USER') || action.includes('STUDENT') || text.includes('student') || text.includes('user')) return UserPlus;
  if (item.type === 'inquiry' || text.includes('inquiry') || text.includes('tour') || text.includes('contact')) return Mail;
  if (item.type === 'message' || text.includes('message')) return MessageSquare;
  if (item.type === 'dispute' || text.includes('dispute') || text.includes('feedback')) return MessageSquare;
  if (item.level === 'ERROR' || text.includes('error') || text.includes('fail')) return AlertCircle;
  return Bell;
};

const getColor = (item) => {
  const level = (item.level || '').toUpperCase();
  const action = (item.action || '').toUpperCase();
  const text = `${item.title || ''} ${item.message || ''}`.toLowerCase();

  if (level === 'ERROR' || text.includes('error') || text.includes('fail')) {
    return 'bg-rose-50 text-rose-600 border-rose-100';
  }
  if (action.includes('REPORT_CARD') || action.includes('PROMOT') || text.includes('promot')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (action.includes('PAYMENT') || text.includes('payment') || text.includes('fee')) {
    return 'bg-green-50 text-green-700 border-green-100';
  }
  if (item.type === 'inquiry' || text.includes('inquiry')) {
    return 'bg-sky-50 text-sky-700 border-sky-100';
  }
  if (item.type === 'message' || item.type === 'dispute') {
    return 'bg-purple-50 text-purple-700 border-purple-100';
  }
  return 'bg-blue-50 text-blue-700 border-blue-100';
};

const AdminNotificationsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedTech, setExpandedTech] = useState({});
  const [filter, setFilter] = useState('all'); // all, audit, messages, inquiries
  
  // Custom dialog state
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, msgsRes, disputesRes, inqRes] = await Promise.all([
        apiFetch('/logs').catch(() => ({ logs: [] })),
        getMessages().catch(() => ({ data: [] })),
        getDisputes().catch(() => ({ data: [] })),
        getInquiries().catch(() => ({ data: [] })),
      ]);
      
      const combined = [
        ...(Array.isArray(logsRes) ? logsRes : logsRes?.logs || []).map(l => ({ 
          ...l, 
          type: l.type || 'audit', 
          id: l.id || `log-${l.timestamp}` 
        })),
        ...(msgsRes?.data || []).map(m => ({ 
           id: `msg-${m.id}`, 
           dbId: m.id,
           title: `Message from ${m.sender?.full_name || 'User'}`,
           message: m.content || 'New broadcast message received.', 
           created_at: m.created_at,
           type: 'message',
           user: m.sender ? { name: m.sender.full_name, role: m.sender.role } : null
        })),
        ...(disputesRes?.data || []).map(d => ({ 
           id: `disp-${d.id}`, 
           dbId: d.id,
           title: d.subject || 'Parent/Student Feedback',
           message: d.message || d.description || 'Feedback/dispute ticket submitted.', 
           created_at: d.created_at,
           type: 'dispute'
        })),
        ...(inqRes?.data || []).map(inq => ({
           id: `inq-${inq.id}`,
           dbId: inq.id,
           title: `Public Inquiry: ${inq.inquiry_type || 'General'}`,
           message: `From ${inq.name} (${inq.email}${inq.phone ? ' • ' + inq.phone : ''}): "${inq.message || ''}"`,
           created_at: inq.created_at,
           type: 'inquiry'
        }))
      ].sort((a, b) => {
        const timeA = parseUtcDate(a.created_at || a.timestamp)?.getTime() || 0;
        const timeB = parseUtcDate(b.created_at || b.timestamp)?.getTime() || 0;
        return timeB - timeA;
      });

      setLogs(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const toggleTech = (id) => {
    setExpandedTech(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'audit') return log.type === 'audit' || log.type === 'system';
    if (filter === 'messages') return log.type === 'message' || log.type === 'dispute';
    if (filter === 'inquiries') return log.type === 'inquiry';
    return true;
  });

  const handleClearAll = async () => {
      setClearing(true);
      try {
          // Clear multiple sources to ensure nothing "comes back" on refresh
          await Promise.all([
              apiFetch('/logs', { method: 'DELETE' }),
              apiFetch('/admin/messages/wipe-all', { method: 'DELETE' }),
              apiFetch('/disputes/clear-all', { method: 'DELETE' })
          ]);
          
          toast.success('System logs, messages, and feedback cleared permanently');
          setConfirmClear(false);
          fetchLogs();
      } catch {
          toast.error('Failed to clear some communication sources');
      } finally {
          setClearing(false);
      }
  };

  const handleDeleteItem = async () => {
      if (!deleteTarget) return;
      try {
          if (deleteTarget.type === 'message') {
              await deleteMessage(deleteTarget.dbId);
          } else if (deleteTarget.type === 'dispute') {
              await deleteDispute(deleteTarget.dbId);
          } else if (deleteTarget.type === 'inquiry') {
              await deleteInquiry(deleteTarget.dbId);
          } else {
              toast.error('Log entry removal not supported via individual delete');
              return;
          }
          toast.success('Notification removed');
          setDeleteTarget(null);
          fetchLogs();
      } catch {
          toast.error('Failed to remove item');
      }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <Bell className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Audit & Notifications</h1>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">
              Live audit trails, user actions, system notices, and incoming inquiries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setConfirmClear(true)}
            disabled={clearing || logs.length === 0}
            className="text-xs font-black text-red-600 uppercase tracking-wider px-5 py-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-all flex items-center gap-2 border border-red-100 disabled:opacity-40 cursor-pointer active:scale-95"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clear Logs
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Events (${logs.length})` },
          { id: 'audit', label: `Academic Audits (${logs.filter(l => l.type === 'audit' || l.type === 'system').length})` },
          { id: 'messages', label: `Messages & Feedback (${logs.filter(l => l.type === 'message' || l.type === 'dispute').length})` },
          { id: 'inquiries', label: `Inquiries (${logs.filter(l => l.type === 'inquiry').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === tab.id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center text-gray-400 overflow-hidden relative">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
            <Smile className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="font-black text-sm text-gray-700 uppercase tracking-wider">No Activity Logged</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">No actions match the selected filter category.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {filteredLogs.map((log, i) => {
            const Icon = getIcon(log);
            const colorClass = getColor(log);
            const isTechOpen = expandedTech[log.id];

            return (
              <motion.div key={log.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-start gap-4 p-5 sm:p-6 hover:bg-gray-50/60 transition-all group">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-black text-gray-800">
                      {log.title || 'System Activity'}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      log.type === 'audit' ? 'bg-emerald-100 text-emerald-800' :
                      log.type === 'system' ? 'bg-blue-100 text-blue-800' :
                      log.type === 'inquiry' ? 'bg-sky-100 text-sky-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {log.type}
                    </span>
                    {log.level && log.level !== 'INFO' && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        log.level === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {log.level}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {log.message || log.event || 'Activity recorded successfully.'}
                  </p>

                  {/* Expandable technical details for system developers/admins */}
                  {log.technical_details && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => toggleTech(log.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {isTechOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isTechOpen ? 'Hide diagnostic details' : 'View diagnostic details'}</span>
                      </button>

                      {isTechOpen && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                          {log.technical_details}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attribution info */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-gray-100 text-[11px] font-semibold text-gray-400">
                    <span>
                      Actor: <strong className="text-gray-700">{log.user?.name || log.user?.full_name || log.causer_name || 'System'}</strong>
                      {log.user?.role && <span className="text-gray-400 font-normal"> ({log.user.role})</span>}
                    </span>
                    {log.details?.ip_address && (
                      <span>• IP: {log.details.ip_address}</span>
                    )}
                  </div>
                </div>

                {/* Right: Timestamps & Individual Delete */}
                <div className="flex flex-col items-end gap-2 shrink-0 self-start">
                  <div className="text-right">
                    <span className="block text-xs font-black text-gray-700">
                      {timeAgo(log.created_at || log.timestamp)}
                    </span>
                    <span className="block text-[10px] font-medium text-gray-400 mt-0.5 whitespace-nowrap">
                      {formatExactTime(log.created_at || log.timestamp)}
                    </span>
                  </div>

                  {log.type !== 'audit' && log.type !== 'system' && (
                    <button 
                      onClick={() => setDeleteTarget(log)}
                      title="Delete item"
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialogs */}
      <AnimatePresence>
        {confirmClear && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2.5rem] p-12 max-w-sm w-full shadow-2xl border border-gray-100">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-3">WIPE ALL LOGS?</h3>
                    <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed italic">This will erase all activity records permanently. This cannot be undone.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleClearAll} className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95">Yes, clear system logs</button>
                        <button onClick={() => setConfirmClear(false)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Keep records</button>
                    </div>
                </motion.div>
            </div>
        )}

        {deleteTarget && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2.5rem] p-12 max-w-sm w-full shadow-2xl border border-gray-100">
                     <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-400">
                        <Trash2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-3">DELETE ITEM?</h3>
                    <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed italic">Remove this specific notification from your view permanently?</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleDeleteItem} className="w-full py-5 bg-gray-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">confirm deletion</button>
                        <button onClick={() => setDeleteTarget(null)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">go back</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminNotificationsPage;
