import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, BookOpen, FileText, Download, Eye, 
  ExternalLink, Clock, Star, Filter, LayoutGrid, 
  List, GraduationCap, Globe, Book, Video, Play, Loader2,
  X, Upload, Link as LinkIcon
} from 'lucide-react';
import { getResources, createResource } from '../../../services/resourceService';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

const StudentLibrary = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', type: 'pdf', url: '' });

  const fetchResources = async () => {
    try {
      const res = await getResources();
      setResources(res.data || res);
    } catch {
      toast.error("Failed to load library resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createResource(newResource);
      toast.success("Resource published!");
      setNewResource({ title: '', type: 'pdf', url: '' });
      setIsModalOpen(false);
      fetchResources();
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || r.type === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center space-y-4">
           <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Digital Library</h1>
          <p className="text-gray-500 font-medium max-w-lg">Access all your textbooks, video lessons, and academic resources in one place.</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Book className="w-6 h-6 text-blue-600"/>
               </div>
               <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">{resources.length}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Resources</p>
               </div>
            </div>
            <div className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600"/>
               </div>
               <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">24/7</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Access</p>
               </div>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-4xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, subject or author..."
            className="w-full pl-14 pr-6 py-4 rounded-[1.75rem] bg-gray-50 border-none focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-sm"
          />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {['all', 'pdf', 'link', 'video'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === type 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {type === 'all' ? 'All Materials' : type === 'pdf' ? 'E-Books & PDFs' : type === 'link' ? 'Web Links' : 'Video Lessons'}
            </button>
          ))}
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap">
            <Upload className="w-4 h-4" /> Upload Material
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white rounded-4xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all overflow-hidden p-6"
          >
            <div className="relative aspect-square rounded-4xl bg-gray-50 mb-6 flex items-center justify-center overflow-hidden">
               {item.type === 'pdf' && <FileText className="w-16 h-16 text-red-500/20 group-hover:scale-110 transition-transform duration-500" />}
               {item.type === 'link' && <Globe className="w-16 h-16 text-blue-500/20 group-hover:scale-110 transition-transform duration-500" />}
               {item.type === 'video' && <Play className="w-16 h-16 text-indigo-500/20 group-hover:scale-110 transition-transform duration-500" />}
               
               <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-500" />
               <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-gray-600 border border-gray-100">
                  {item.type}
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-1 h-1 rounded-full bg-blue-600" />
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.school_class?.name || 'Academic Material'}</span>
                  </div>
                  <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight uppercase tracking-tight">{item.title}</h3>
               </div>

               <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400">
                        {item.uploader?.full_name?.charAt(0)}
                     </div>
                     <span className="text-[10px] font-bold text-gray-400">{item.uploader?.full_name || 'Admin'}</span>
                  </div>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
               </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
           <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-4xl flex items-center justify-center mx-auto mb-6">
                 <Search className="w-10 h-10 text-gray-200"/>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No matching resources</h3>
              <p className="text-gray-400 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
           </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-4xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                   <h2 className="text-xl font-black uppercase tracking-tight">Admin Upload</h2>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleCreateResource} className="p-8 space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Title</label>
                      <input required placeholder="Document Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold bg-gray-50 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Type</label>
                      <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})} className="w-full border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold bg-gray-50 outline-none">
                         <option value="pdf">PDF File</option>
                         <option value="link">Web Link</option>
                         <option value="video">Video</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Access URL</label>
                      <div className="relative">
                         <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                         <input required placeholder="https://..." value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} className="w-full border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-medium bg-gray-50 focus:bg-white outline-none" />
                      </div>
                   </div>
                   <button disabled={submitting} type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all">
                      {submitting ? 'Uploading...' : 'Publish to Library'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentLibrary;
