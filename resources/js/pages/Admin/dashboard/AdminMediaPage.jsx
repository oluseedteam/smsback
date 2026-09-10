import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Camera,
  Layers,
  FileText,
  Calendar,
  X,
  CheckCircle2,
  RefreshCw,
  Clock,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PopupModal from '../../../components/PopupModal';
import {
  getMediaGallery,
  addMediaPicture,
  updateMediaPicture,
  deleteMediaPicture,
  resetMediaGallery,
  getMediaArticles,
  addMediaArticle,
  updateMediaArticle,
  deleteMediaArticle,
  subscribeToMediaUpdates,
  GALLERY_CATEGORIES,
  ARTICLE_CATEGORIES,
  DEFAULT_GALLERY_ITEMS
} from '../../../services/mediaService';

// Category color mappings
const CATEGORY_COLORS = {
  academics: 'bg-blue-50 text-blue-700 border-blue-200',
  'early-years': 'bg-pink-50 text-pink-700 border-pink-200',
  sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  events: 'bg-purple-50 text-purple-700 border-purple-200',
  faculty: 'bg-amber-50 text-amber-700 border-amber-200',
  facilities: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  general: 'bg-slate-50 text-slate-700 border-slate-200',
};

const ARTICLE_CATEGORY_COLORS = {
  press: 'bg-blue-50 text-blue-700 border-blue-200',
  newsletter: 'bg-amber-50 text-amber-700 border-amber-200',
  announcement: 'bg-rose-50 text-rose-700 border-rose-200',
  spotlight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function AdminMediaPage() {
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'articles'
  const [gallery, setGallery] = useState(() => getMediaGallery());
  const [articles, setArticles] = useState(() => getMediaArticles());

  
  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [isAddPictureModalOpen, setIsAddPictureModalOpen] = useState(false);
  const [isAddArticleModalOpen, setIsAddArticleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // picture or article being edited
  const [previewItem, setPreviewItem] = useState(null); // lightbox item

  // Popup confirmation modal
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null,
  });

  // Picture Form State
  const [pictureForm, setPictureForm] = useState({
    title: '',
    category: 'academics',
    caption: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    imageMode: 'upload', // 'upload' | 'url' | 'preset'
    imageSrc: '',
  });

  // Article Form State
  const [articleForm, setArticleForm] = useState({
    title: '',
    category: 'announcement',
    tag: 'Official Notice',
    readTime: '3 min read',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    desc: '',
    image: '',
    imageMode: 'upload',
  });

  const fileInputRef = useRef(null);
  const articleFileInputRef = useRef(null);


  useEffect(() => {
    const unsubscribe = subscribeToMediaUpdates(() => {
      setGallery(getMediaGallery());
      setArticles(getMediaArticles());
    });
    return unsubscribe;
  }, []);


  // Handle image file selection
  const handleImageFileChange = (e, target = 'picture') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      if (target === 'picture') {
        setPictureForm((prev) => ({ ...prev, imageSrc: result }));
      } else {
        setArticleForm((prev) => ({ ...prev, image: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset Picture Form
  const resetPictureForm = () => {
    setPictureForm({
      title: '',
      category: 'academics',
      caption: '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      imageMode: 'upload',
      imageSrc: '',
    });
    setEditingItem(null);
  };

  // Reset Article Form
  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      category: 'announcement',
      tag: 'Official Notice',
      readTime: '3 min read',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      desc: '',
      image: '',
      imageMode: 'upload',
    });
    setEditingItem(null);
  };

  // Open Edit for Picture
  const handleOpenEditPicture = (pic) => {
    setEditingItem(pic);
    setPictureForm({
      title: pic.title,
      category: pic.category,
      caption: pic.caption || '',
      date: pic.date || '',
      imageMode: 'url',
      imageSrc: pic.src,
    });
    setIsAddPictureModalOpen(true);
  };

  // Submit Picture (Create or Update)
  const handleSavePicture = (e) => {
    e.preventDefault();
    if (!pictureForm.imageSrc) {
      toast.error('Please upload or provide an image URL for the picture.');
      return;
    }
    if (!pictureForm.title.trim()) {
      toast.error('Please provide a picture title.');
      return;
    }

    if (editingItem) {
      updateMediaPicture(editingItem.id, {
        title: pictureForm.title,
        category: pictureForm.category,
        caption: pictureForm.caption,
        date: pictureForm.date,
        src: pictureForm.imageSrc,
      });
      toast.success('Picture updated successfully!');
    } else {
      addMediaPicture({
        title: pictureForm.title,
        category: pictureForm.category,
        caption: pictureForm.caption,
        date: pictureForm.date,
        src: pictureForm.imageSrc,
      });
      toast.success('New picture added to Media Room gallery!');
    }

    setIsAddPictureModalOpen(false);
    resetPictureForm();
  };

  // Open Edit for Article
  const handleOpenEditArticle = (art) => {
    setEditingItem(art);
    setArticleForm({
      title: art.title,
      category: art.category,
      tag: art.tag,
      readTime: art.readTime,
      date: art.date,
      desc: art.desc,
      image: art.image,
      imageMode: 'url',
    });
    setIsAddArticleModalOpen(true);
  };

  // Submit Article (Create or Update)
  const handleSaveArticle = (e) => {
    e.preventDefault();
    if (!articleForm.image) {
      toast.error('Please upload or provide a cover image for the article.');
      return;
    }
    if (!articleForm.title.trim()) {
      toast.error('Please enter an article title.');
      return;
    }

    if (editingItem) {
      updateMediaArticle(editingItem.id, {
        title: articleForm.title,
        category: articleForm.category,
        tag: articleForm.tag,
        readTime: articleForm.readTime,
        date: articleForm.date,
        desc: articleForm.desc,
        image: articleForm.image,
      });
      toast.success('Article updated successfully!');
    } else {
      addMediaArticle({
        title: articleForm.title,
        category: articleForm.category,
        tag: articleForm.tag,
        readTime: articleForm.readTime,
        date: articleForm.date,
        desc: articleForm.desc,
        image: articleForm.image,
      });
      toast.success('Article published to Media Room!');
    }

    setIsAddArticleModalOpen(false);
    resetArticleForm();
  };

  // Delete Handlers
  const confirmDeletePicture = (pic) => {
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Picture?',
      message: `Are you sure you want to remove "${pic.title}" from the Media Room? This action cannot be undone.`,
      onConfirm: () => {
        deleteMediaPicture(pic.id);
        toast.success('Picture removed from Media Room.');
        setPopup((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const confirmDeleteArticle = (art) => {
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Article?',
      message: `Are you sure you want to remove the article "${art.title}"?`,
      onConfirm: () => {
        deleteMediaArticle(art.id);
        toast.success('Article removed.');
        setPopup((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const confirmResetGallery = () => {
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Reset Media Gallery?',
      message: 'This will restore the original default school campus photos and clear custom additions.',
      onConfirm: () => {
        resetMediaGallery();
        toast.success('Gallery reset to default school photos.');
        setPopup((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Filtered lists
  const filteredGallery = gallery.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredArticles = articles.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-Dm-sans">
      
      {/* ── TOP HEADER & ACTIONS ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Camera className="w-6 h-6" />
            </span>
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
              Media Room Control
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-blue-950 tracking-tight">
            Media Room & Photo Gallery
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Upload new high-resolution photographs, manage campus moments, and publish news updates shown in the public Media Room.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
          <Link
            to="/media"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <span>Live Media Room</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>

          <button
            onClick={() => {
              resetPictureForm();
              setIsAddPictureModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Picture</span>
          </button>

          <button
            onClick={() => {
              resetArticleForm();
              setIsAddArticleModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pictures</p>
            <h3 className="text-3xl font-black text-blue-950 mt-1">{gallery.length}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Live in Media Gallery</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">News & Press</p>
            <h3 className="text-3xl font-black text-blue-950 mt-1">{articles.length}</h3>
            <p className="text-[11px] text-blue-600 font-bold mt-1">Published Releases</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</p>
            <h3 className="text-3xl font-black text-blue-950 mt-1">6</h3>
            <p className="text-[11px] text-purple-600 font-bold mt-1">Academics, Sports, Events...</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Uploads</p>
            <h3 className="text-3xl font-black text-blue-950 mt-1">
              {gallery.filter((g) => !g.isDefault).length}
            </h3>
            <p className="text-[11px] text-sky-600 font-bold mt-1">Added by Admin</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── SECTION TABS & CONTROLS ────────────────────────────────────────── */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
        
        {/* Main Tab Navigation & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl w-fit">
            <button
              onClick={() => {
                setActiveTab('gallery');
                setSelectedCategory('all');
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'gallery'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Campus Moments ({gallery.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('articles');
                setSelectedCategory('all');
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'articles'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Articles & Press ({articles.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'gallery' ? 'Search picture title or caption...' : 'Search articles...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'gallery' && (
              <button
                onClick={confirmResetGallery}
                title="Reset gallery to default school photos"
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-2xl transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(activeTab === 'gallery' ? GALLERY_CATEGORIES : ARTICLE_CATEGORIES).map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-sm scale-102'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: CAMPUS PHOTO GALLERY GRID ────────────────────────────────── */}
        {activeTab === 'gallery' && (
          <div>
            {filteredGallery.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Pictures Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No photos matched your search criteria. Try adjusting filters.'
                    : 'Your photo gallery is currently empty. Click "Add Picture" to upload pictures for the Media Room.'}
                </p>
                <button
                  onClick={() => {
                    resetPictureForm();
                    setIsAddPictureModalOpen(true);
                  }}
                  className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add First Picture
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredGallery.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                  >
                    {/* Picture Thumbnail */}
                    <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                      <img
                        src={item.src}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shadow-xs ${
                            CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general
                          }`}
                        >
                          {item.category}
                        </span>

                        {!item.isDefault && (
                          <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                            New
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay with Lightbox View */}
                      <div className="absolute inset-0 bg-blue-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-3 bg-white text-blue-900 rounded-full hover:scale-110 transition shadow-lg cursor-pointer"
                          title="Preview full size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditPicture(item)}
                          className="p-3 bg-blue-600 text-white rounded-full hover:scale-110 transition shadow-lg cursor-pointer"
                          title="Edit picture info"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDeletePicture(item)}
                          className="p-3 bg-rose-600 text-white rounded-full hover:scale-110 transition shadow-lg cursor-pointer"
                          title="Delete picture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Picture Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold mb-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span>{item.date || 'Campus Moment'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.caption || 'No caption provided.'}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditPicture(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => confirmDeletePicture(item)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ARTICLES & PRESS GRID ────────────────────────────────── */}
        {activeTab === 'articles' && (
          <div>
            {filteredArticles.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Articles Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Click "New Article" to create a press release or gazette update.
                </p>
                <button
                  onClick={() => {
                    resetArticleForm();
                    setIsAddArticleModalOpen(true);
                  }}
                  className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create First Article
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((art) => (
                  <motion.div
                    layout
                    key={art.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-5 flex flex-col sm:flex-row gap-5"
                  >
                    <div className="w-full sm:w-44 h-36 rounded-2xl overflow-hidden bg-gray-100 shrink-0 relative">
                      <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                      <span
                        className={`absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shadow-xs ${
                          ARTICLE_CATEGORY_COLORS[art.category] || 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {art.tag || art.category}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold mb-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span>{art.date}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{art.readTime}</span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                          {art.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                          {art.desc}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                          {art.tag}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditArticle(art)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteArticle(art)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: ADD / EDIT PICTURE ────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddPictureModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-sky-400">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading">
                      {editingItem ? 'Edit Picture Details' : 'Add Picture to Media Room'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Publish high-resolution photo moments to the school photo gallery.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsAddPictureModalOpen(false);
                    resetPictureForm();
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSavePicture} className="p-6 md:p-8 space-y-6">
                
                {/* Image Source Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                    Picture Source *
                  </label>

                  {/* Mode switcher */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setPictureForm((p) => ({ ...p, imageMode: 'upload' }))}
                      className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                        pictureForm.imageMode === 'upload'
                          ? 'bg-white text-blue-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File (Computer)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPictureForm((p) => ({ ...p, imageMode: 'url' }))}
                      className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                        pictureForm.imageMode === 'url'
                          ? 'bg-white text-blue-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Image URL / Web Link</span>
                    </button>
                  </div>

                  {/* Upload Dropzone */}
                  {pictureForm.imageMode === 'upload' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, 'picture')}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-3xl p-6 bg-blue-50/30 hover:bg-blue-50/60 transition cursor-pointer flex flex-col items-center justify-center text-center group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:scale-110 text-blue-600 flex items-center justify-center transition mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">Click to choose image file</p>
                        <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, WebP up to 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://example.com/school-event.jpg"
                          value={pictureForm.imageSrc}
                          onChange={(e) =>
                            setPictureForm((prev) => ({ ...prev, imageSrc: e.target.value }))
                          }
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {pictureForm.imageSrc && (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 aspect-16/9 max-h-48 flex items-center justify-center">
                      <img
                        src={pictureForm.imageSrc}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setPictureForm((prev) => ({ ...prev, imageSrc: '' }))}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-[10px] font-black bg-black/60 text-white px-2.5 py-1 rounded-lg backdrop-blur-md">
                        Live Preview
                      </span>
                    </div>
                  )}
                </div>

                {/* Title & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Picture Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Olympiad Champions 2025"
                      value={pictureForm.title}
                      onChange={(e) => setPictureForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Category *
                    </label>
                    <select
                      value={pictureForm.category}
                      onChange={(e) => setPictureForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition capitalize"
                    >
                      {GALLERY_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Row */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                    Event Date / Term
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. February 2025"
                    value={pictureForm.date}
                    onChange={(e) => setPictureForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>

                {/* Caption Description */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                    Caption / Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe this moment or activity (shown in the lightbox modal)..."
                    value={pictureForm.caption}
                    onChange={(e) => setPictureForm((p) => ({ ...p, caption: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddPictureModalOpen(false);
                      resetPictureForm();
                    }}
                    className="px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingItem ? 'Update Picture' : 'Publish Picture'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: ADD / EDIT ARTICLE ────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddArticleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-sky-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading">
                      {editingItem ? 'Edit Media Article' : 'Publish New Media Article'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Publish official gazettes, press releases and student spotlights.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsAddArticleModalOpen(false);
                    resetArticleForm();
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveArticle} className="p-6 md:p-8 space-y-5">
                
                {/* Article Cover Image */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                    Cover Image *
                  </label>

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setArticleForm((p) => ({ ...p, imageMode: 'upload' }))}
                      className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                        articleForm.imageMode === 'upload'
                          ? 'bg-white text-blue-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleForm((p) => ({ ...p, imageMode: 'url' }))}
                      className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                        articleForm.imageMode === 'url'
                          ? 'bg-white text-blue-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Image URL</span>
                    </button>
                  </div>

                  {articleForm.imageMode === 'upload' ? (
                    <div>
                      <input
                        type="file"
                        ref={articleFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, 'article')}
                        className="hidden"
                      />
                      <div
                        onClick={() => articleFileInputRef.current?.click()}
                        className="border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-3xl p-5 bg-blue-50/30 hover:bg-blue-50/60 transition cursor-pointer flex flex-col items-center justify-center text-center"
                      >
                        <Upload className="w-5 h-5 text-blue-600 mb-2" />
                        <p className="text-xs font-bold text-gray-800">Select cover image file</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="https://example.com/cover.jpg"
                      value={articleForm.image}
                      onChange={(e) => setArticleForm((p) => ({ ...p, image: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  )}

                  {articleForm.image && (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 aspect-16/9 max-h-36 flex items-center justify-center">
                      <img src={articleForm.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setArticleForm((p) => ({ ...p, image: '' }))}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GHRA Robotics Team Wins Regional Science Olympiad"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                {/* Category & Tag Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      value={articleForm.category}
                      onChange={(e) => setArticleForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none capitalize"
                    >
                      {ARTICLE_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Badge Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Press Release"
                      value={articleForm.tag}
                      onChange={(e) => setArticleForm((p) => ({ ...p, tag: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Read Time
                    </label>
                    <input
                      type="text"
                      placeholder="3 min read"
                      value={articleForm.readTime}
                      onChange={(e) => setArticleForm((p) => ({ ...p, readTime: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                    Summary / Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide a short synopsis of this news release or announcement..."
                    value={articleForm.desc}
                    onChange={(e) => setArticleForm((p) => ({ ...p, desc: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddArticleModalOpen(false);
                      resetArticleForm();
                    }}
                    className="px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer"
                  >
                    {editingItem ? 'Update Article' : 'Publish Article'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX PREVIEW MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {previewItem && (
          <div
            onClick={() => setPreviewItem(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            >
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-h-[70vh] overflow-hidden flex items-center justify-center bg-black">
                <img
                  src={previewItem.src || previewItem.image}
                  alt={previewItem.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>

              <div className="p-6 text-white bg-slate-900 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                    {previewItem.category}
                  </span>
                  <h3 className="text-lg font-bold font-heading mt-0.5">{previewItem.title}</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {previewItem.caption || previewItem.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const item = previewItem;
                      setPreviewItem(null);
                      handleOpenEditPicture(item);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── POPUP CONFIRMATION MODAL ────────────────────────────────────────── */}
      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={popup.onConfirm}
      />
    </div>
  );
}
