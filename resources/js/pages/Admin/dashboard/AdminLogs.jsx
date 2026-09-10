import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import apiFetch from '../../../services/api';
import PopupModal from '../../../components/PopupModal';

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  let s = String(dateStr).trim();
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

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [confirmClear, setConfirmClear] = useState(false);
  const [filter, setFilter] = useState('all'); // all, audit, error

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/logs');
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      const errMsg = err.message || 'Failed to fetch the system logs. Check server configuration.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearRequest = () => {
    setPopup({ isOpen: true, type: 'confirm', title: 'Clear All Logs?', message: 'Are you sure you want to clear all system logs? This cannot be undone.' });
    setConfirmClear(true);
  };

  const handleClearConfirm = async () => {
    setPopup({ ...popup, isOpen: false });
    setConfirmClear(false);
    setClearing(true);
    try {
      await apiFetch('/logs', { method: 'DELETE' });
      setLogs([]);
      setPopup({ isOpen: true, type: 'success', title: 'Cleared!', message: 'System logs have been cleared.' });
    } catch (err) {
      console.error('Failed to clear logs:', err);
      setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Failed to clear the logs.' });
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (filter === 'audit') return l.type === 'audit';
    if (filter === 'error') return l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'WARNING';
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            <Activity className="w-7 h-7 text-blue-600" /> System & Academic Audit Logs
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Authoritative trail of report card releases, promotions, fee confirmations, and system health.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={fetchLogs} 
            className="flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-bold border border-gray-200 flex items-center justify-center gap-2 shadow-xs transition-all text-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button 
            onClick={handleClearRequest} 
            disabled={clearing || logs.length === 0}
            className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold border border-red-100 flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-40 text-xs cursor-pointer"
          >
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Clear Logs
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: `All Logs (${logs.length})` },
          { id: 'audit', label: `Academic Audits (${logs.filter(l => l.type === 'audit').length})` },
          { id: 'error', label: `Notices & Warnings (${logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'WARNING').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === tab.id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <h3 className="text-red-900 font-bold mb-1 border-b border-red-100 pb-1">Log Access Error</h3>
            <p className="text-red-600 text-[11px] md:text-sm whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xs border border-gray-100 min-h-[50vh]">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Activity className="w-14 h-14 mb-3 opacity-25 text-blue-500" />
              <p className="font-bold text-sm text-gray-700">No logs found in this category.</p>
              <p className="text-xs text-gray-400 mt-0.5">Everything is operating smoothly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.25) }}
                  key={log.id || index}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    log.level === 'ERROR' || log.level === 'CRITICAL'
                      ? 'bg-rose-50/70 border-rose-100'
                      : log.level === 'WARNING'
                      ? 'bg-amber-50/70 border-amber-100'
                      : log.type === 'audit'
                      ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/60'
                      : 'bg-gray-50/70 border-gray-100 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm font-black text-gray-800">
                          {log.title || 'System Operation'}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          log.type === 'audit' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.type === 'audit' ? 'AUDIT' : 'SYSTEM'}
                        </span>

                        {log.level && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            log.level === 'ERROR' || log.level === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                            log.level === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-200/80 text-gray-600'
                          }`}>
                            {log.level}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 font-medium leading-relaxed">
                        {log.message}
                      </p>

                      {log.technical_details && (
                        <details className="mt-2.5 group/det">
                          <summary className="text-[11px] font-bold text-gray-500 hover:text-blue-600 cursor-pointer list-none flex items-center gap-1.5">
                            <span className="group-open/det:rotate-90 transition-transform">▸</span>
                            <span>Diagnostic Technical Data</span>
                          </summary>
                          <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] whitespace-pre-wrap overflow-x-auto max-h-44 border border-slate-800">
                            {log.technical_details}
                          </div>
                        </details>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-gray-200/50 text-[11px] font-medium text-gray-400">
                        <span>Actor: <strong className="text-gray-700">{log.user?.name || 'System'}</strong></span>
                        {log.details?.ip_address && (
                          <span>• IP: {log.details.ip_address}</span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp badge */}
                    <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0">
                      <span className="block text-xs font-black text-gray-700">
                        {timeAgo(log.timestamp || log.created_at)}
                      </span>
                      <span className="block text-[10px] font-medium text-gray-400 mt-0.5 whitespace-nowrap">
                        {formatExactTime(log.timestamp || log.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    <PopupModal
      isOpen={popup.isOpen}
      type={popup.type}
      title={popup.title}
      message={popup.message}
      onClose={() => { setPopup({ ...popup, isOpen: false }); setConfirmClear(false); }}
      onConfirm={confirmClear ? handleClearConfirm : undefined}
    />
    </>
  );
};

export default AdminLogs;
