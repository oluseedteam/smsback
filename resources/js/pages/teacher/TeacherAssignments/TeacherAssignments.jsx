import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter, Search, ChevronDown, Send, Eye, BookOpen,
  Clock, CheckCircle2, AlertCircle, PlusCircle, Download, Bell, Loader2, Trash2, Pencil, X
} from 'lucide-react';
import TeacherAssignmentsRight from './TeacherAssignmentsRight';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../../../services/assignmentService';
import { getClasses } from '../../../services/classService';
import { getSubjects } from '../../../services/subjectService';
import PopupModal from '../../../components/PopupModal';
import SubmissionsModal from './SubmissionsModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 110 } },
};

const filterTabs = ['All Assignments', 'Active', 'Grading Needed', 'Upcoming', 'Past'];

const TeacherAssignments = () => {
  const [activeTab, setActiveTab] = useState(filterTabs[0]);
  const [assignments, setAssignments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', attachment: '', school_class_id: '', subject_id: '',
    assigned_date: '', due_date: '', max_score: '100', status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsData, classesData, subjectsData] = await Promise.all([
        getAssignments(),
        getClasses(),
        getSubjects()
      ]);
      setAssignments(assignmentsData.data || assignmentsData);
      setClassesList(Array.isArray(classesData) ? classesData : (classesData?.data || []));
      setSubjectsList(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || []));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (assignment = null) => {
    if (assignment) {
      setEditingId(assignment.id);
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        attachment: assignment.attachment || '',
        school_class_id: assignment.school_class_id || '',
        subject_id: assignment.subject_id || '',
        assigned_date: assignment.assigned_date ? new Date(assignment.assigned_date).toISOString().split('T')[0] : '',
        due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '',
        max_score: assignment.max_score || '100',
        status: assignment.status || 'active'
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', description: '', attachment: '', school_class_id: '', subject_id: '',
        assigned_date: new Date().toISOString().split('T')[0], 
        due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
        max_score: '100', status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPopup({ isOpen: true, type: 'error', title: 'File too large', message: 'Attachment must be under 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, attachment: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateAssignment(editingId, formData);
      } else {
        await createAssignment(formData);
      }
      setIsModalOpen(false);
      fetchData();
      setPopup({ isOpen: true, type: 'success', title: 'Saved!', message: editingId ? 'Assignment updated successfully.' : 'Assignment created successfully.' });
    } catch (err) {
      setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Failed to save assignment' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
    setPopup({ isOpen: true, type: 'confirm', title: 'Delete Assignment?', message: 'Are you sure you want to delete this assignment? This cannot be undone.' });
  };

  const handleDeleteConfirm = async () => {
    setPopup({ ...popup, isOpen: false });
    if (deleteTarget) {
      try {
        await deleteAssignment(deleteTarget);
        fetchData();
        setPopup({ isOpen: true, type: 'success', title: 'Deleted!', message: 'Assignment deleted successfully.' });
      } catch (err) {
        setPopup({ isOpen: true, type: 'error', title: 'Error', message: err.message || 'Failed to delete assignment' });
      }
      setDeleteTarget(null);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'All Assignments') return true;
    if (activeTab === 'Active') return a.status === 'active';
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
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0">
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Assignment Management</h1>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all text-sm">
            <PlusCircle className="w-4 h-4" /> New Assignment
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
          {filterTabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === t
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Assignment cards */}
        <motion.div
          className="space-y-5 pb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredAssignments.map(a => (
            <motion.div
              key={a.id}
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative"
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                 <button onClick={() => handleOpenModal(a)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                 <button onClick={() => handleDeleteRequest(a.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700`}>
                  {a.subject?.name || 'General'}
                </span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700`}>
                  Class: {a.school_class?.name || 'Unknown'}
                </span>
                {new Date(a.due_date) < new Date(Date.now() + 86400000) && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Due Soon
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-1">{a.title}</h3>
              <p className="text-xs text-gray-500 mb-4">
                Assigned: {a.assigned_date} &nbsp;•&nbsp; 
                <span className="text-gray-500">Due: {a.due_date}</span>
              </p>

              <div className="flex flex-wrap gap-2">
                {a.attachment && (
                  <button onClick={() => {
                     const aTag = document.createElement('a');
                     aTag.href = a.attachment;
                     aTag.download = `${a.title}_attachment`;
                     aTag.click();
                  }} className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Attachment
                  </button>
                )}
                <button 
                  onClick={() => { setSelectedAssignment(a); setIsSubmissionsOpen(true); }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  View Submissions
                </button>
                <button 
                  onClick={() => { setSelectedAssignment(a); setIsSubmissionsOpen(true); }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">
                  Grade Now
                </button>
              </div>
            </motion.div>
          ))}
          {filteredAssignments.length === 0 && (
            <div className="text-center py-12 text-gray-400 italic">
              No assignments found for this filter.
            </div>
          )}
        </motion.div>
      </div>

      {selectedAssignment && (
        <SubmissionsModal 
          isOpen={isSubmissionsOpen}
          onClose={() => { setIsSubmissionsOpen(false); setSelectedAssignment(null); }}
          assignment={selectedAssignment}
        />
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">{editingId ? 'Edit Assignment' : 'New Assignment'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Assignment Title</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. Math Worksheet 1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                    <select required value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white">
                      <option value="">Select Subject</option>
                      {subjectsList.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Target Class</label>
                    <select required value={formData.school_class_id} onChange={e => setFormData({...formData, school_class_id: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white">
                      <option value="">Select Class</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[80px]" placeholder="Assignment details..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Attachment (PDF/Image)</label>
                  <input type="file" onChange={handleFileChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white" />
                  {formData.attachment && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> File attached</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Date</label>
                    <input required type="date" value={formData.assigned_date} onChange={e => setFormData({...formData, assigned_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date</label>
                    <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                  <button disabled={submitting} type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex justify-center items-center">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Assignment'}
                  </button>
                </div>
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

export default TeacherAssignments;
