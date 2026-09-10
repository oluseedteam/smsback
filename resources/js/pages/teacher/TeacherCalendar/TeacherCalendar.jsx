import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, PlusCircle, Printer,
  Download, RefreshCw, Calendar, Clock, CheckCircle2, Loader2, X, Trash2
} from 'lucide-react';
import TeacherCalendarRight from './TeacherCalendarRight';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../../../services/calendarService';
import { getClasses } from '../../../services/classService';
import PopupModal from '../../../components/PopupModal';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TeacherCalendar = () => {
  const [events, setEvents] = useState([]);

  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', start_time: '', end_time: '', type: 'class', school_class_id: ''
  });
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchEvents = async () => {
    try {
      const [res, clsRes] = await Promise.all([getCalendarEvents(), getClasses()]);
      setEvents(res.data || res);
      setClassList(Array.isArray(clsRes) ? clsRes : (clsRes?.data || []));
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCalendarEvent({
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      });
      setIsModalOpen(false);
      fetchEvents();
      setPopup({ isOpen: true, type: 'success', title: 'Created!', message: 'Event scheduled successfully.' });
    } catch(err) {
      setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Failed to create event' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
    setPopup({ isOpen: true, type: 'confirm', title: 'Delete Event?', message: 'Are you sure you want to delete this event?' });
  };

  const handleDeleteConfirm = async () => {
    setPopup({ ...popup, isOpen: false });
    if (deleteTarget) {
      try {
        await deleteCalendarEvent(deleteTarget);
        fetchEvents();
        setPopup({ isOpen: true, type: 'success', title: 'Deleted!', message: 'Event deleted.' });
      } catch(err) {
        setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Error deleting' });
      }
      setDeleteTarget(null);
    }
  };

  const generateCalDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const calDays = generateCalDays();

  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter(e => {
      const eDate = new Date(e.start_time);
      return eDate.getDate() === day && eDate.getMonth() === currentDate.getMonth() && eDate.getFullYear() === currentDate.getFullYear();
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0 relative">
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Academic Calendar & Schedule</h1>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
            <PlusCircle className="w-4 h-4" /> + Add Class / Event
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-5">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-xl border border-gray-200 hover:border-blue-200 text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-xl border border-gray-200 hover:border-blue-200 text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-2">{d}</div>
            ))}
            {calDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="min-h-[80px]" />;
              const dayEvents = getEventsForDay(day);
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.02 }}
                  className={`min-h-[80px] rounded-2xl p-1.5 cursor-pointer border transition-all ${
                    isToday ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50 border-gray-100'
                  }`}
                >
                  <p className={`text-[11px] font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</p>
                  <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev, ei) => (
                      <div key={ei} onClick={(e) => { e.stopPropagation(); handleDeleteRequest(ev.id); }} className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-700 truncate hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer group flex justify-between items-center" title="Click to delete">
                        <span>{new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] text-gray-400 font-bold pl-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:w-72 w-full">
        <TeacherCalendarRight />
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold">Schedule Class</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Class Title (e.g. Mathematics)</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Target Audience (School Class)</label>
                  <select required value={formData.school_class_id} onChange={e => setFormData({...formData, school_class_id: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="">Select a Class</option>
                    {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Start Time</label>
                    <input required type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">End Time</label>
                    <input required type="datetime-local" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                </div>
                <button disabled={submitting} type="submit" className="w-full py-3 mt-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md">
                  {submitting ? 'Saving...' : 'Add Class'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
        onConfirm={popup.type === 'confirm' ? handleDeleteConfirm : undefined}
      />
    </div>
  );
};

export default TeacherCalendar;
