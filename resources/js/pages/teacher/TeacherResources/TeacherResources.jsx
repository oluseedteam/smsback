import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, List, Upload, Filter, SortAsc, Search,
  Download, Eye, Star, Clock, FileText, BookOpen,
  Image, Monitor, ClipboardList, Layers, ChevronDown,
  ChevronRight, PlusCircle, X, ChevronUp, Loader2, Globe, Users, Link as LinkIcon, Trash2
} from 'lucide-react';
import TeacherResourcesRight from './TeacherResourcesRight';
import { getResources, createResource, deleteResource, updateResource } from '../../../services/resourceService';
import { getTeacherClasses } from '../../../services/teacherClassService';
import toast from 'react-hot-toast';
import PopupModal from '../../../components/PopupModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } },
};

const TeacherResources = () => {
  const [viewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [resources, setResources] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [newResource, setNewResource] = useState({
    title: '',
    type: 'pdf',
    url: '',
    school_class_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, clsRes] = await Promise.all([
        getResources(),
        getTeacherClasses()
      ]);
      setResources(resRes.data || resRes);
      setClasses(clsRes.data || clsRes);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingResource) {
        await updateResource(editingResource.id, newResource);
        toast.success("Resource updated!");
      } else {
        await createResource(newResource);
        toast.success("Resource uploaded!");
      }
      setNewResource({ title: '', type: 'pdf', url: '', school_class_id: '' });
      setIsModalOpen(false);
      setEditingResource(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to save resource");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (r) => {
    setEditingResource(r);
    setNewResource({
      title: r.title,
      type: r.type,
      url: r.url,
      school_class_id: r.school_class_id || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
    setPopup({ 
      isOpen: true, 
      type: 'confirm', 
      title: 'Delete Resource?', 
      message: 'Are you sure you want to delete this teaching material?' 
    });
  };

  const handleDeleteConfirm = async () => {
    setPopup({ ...popup, isOpen: false });
    if (!deleteTarget) return;
    try {
      await deleteResource(deleteTarget);
      toast.success("Resource deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete resource");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Teaching Resources & Materials</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search resources…"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm bg-white shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Resource
            </button>
          </div>

          <motion.div
            className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'} pb-8`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map(r => (
              <motion.div
                key={r.id}
                variants={itemVariants}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group p-5 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-800 truncate w-32">{r.title}</h3>
                      <p className="text-[10px] text-gray-400 uppercase font-black">{r.type}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-gray-400"/>
                    <span className="text-[10px] font-bold text-gray-500">{r.school_class?.name || 'All Classes'}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-1 italic">
                    By {r.teacher?.full_name || r.admin?.full_name || 'System'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all text-center">
                    View
                  </a>
                  <button onClick={() => handleEdit(r)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteRequest(r.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 italic">
                No resources found.
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:w-64 w-full shrink-0">
          <TeacherResourcesRight />
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8 bg-linear-to-br from-blue-600 to-indigo-700 text-white relative">
                 <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                    <X className="w-5 h-5"/>
                 </button>
                 <h2 className="text-xl font-black uppercase tracking-widest mb-2">Resource Upload</h2>
                 <p className="text-blue-100 text-sm font-medium opacity-80">Share academic materials with your students.</p>
              </div>

              <form onSubmit={handleCreateResource} className="p-8 space-y-5">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                    <input required placeholder="e.g. Algebra 101 Notes" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                       <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})} className="w-full border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold bg-gray-50 outline-none">
                          <option value="pdf">PDF File</option>
                          <option value="link">URL / Web Link</option>
                          <option value="video">Video Lesson</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Assign to Class</label>
                       <select value={newResource.school_class_id} onChange={e => setNewResource({...newResource, school_class_id: e.target.value})} className="w-full border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold bg-gray-50 outline-none">
                          <option value="">All Classes</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Document URL / File Link</label>
                    <div className="relative">
                       <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                       <input required placeholder="https://..." value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} className="w-full border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-medium bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                       Cancel
                    </button>
                    <button disabled={submitting} type="submit" className="flex-2 py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                       {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                       {submitting ? 'Uploading...' : 'Publish Material'}
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

export default TeacherResources;
