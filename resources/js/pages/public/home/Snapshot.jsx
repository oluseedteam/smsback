import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { FiMaximize2, FiX, FiCamera } from 'react-icons/fi';
import { getMediaGallery, subscribeToMediaUpdates, GALLERY_CATEGORIES } from '../../../services/mediaService';

const Snapshot = () => {
  const [galleryItems, setGalleryItems] = useState(() => getMediaGallery());
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToMediaUpdates(() => {
      setGalleryItems(getMediaGallery());
    });
    return unsubscribe;
  }, []);


  const filteredItems = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden font-Dm-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <FiCamera className="text-blue-600 text-sm" />
            <span>Vibrant Student Life</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
            Campus Life in <span className="text-blue-600">Pictures</span>
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            A visual journey through classroom triumphs, athletic achievements, creative expressions, and everyday moments of joy at GHRA.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-10 hide-scrollbar">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          <AnimatePresence>
            {filteredItems.map((image) => (
              <motion.div
                layout
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedImage(image)}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl bg-slate-100 aspect-4/3 cursor-pointer border border-slate-200/80"
              >
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Dark gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                  <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                    {image.category}
                  </span>
                  <h4 className="text-sm font-bold font-heading leading-tight mt-1">
                    {image.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
                    <FiMaximize2 className="text-sm text-blue-400" />
                    <span>Click to expand</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
                  aria-label="Close image preview"
                >
                  <FiX className="text-xl" />
                </button>

                <div className="max-h-[70vh] overflow-hidden flex items-center justify-center bg-black">
                  <img
                    src={selectedImage.src}
                    alt={selectedImage.title}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                </div>

                <div className="p-6 text-white bg-slate-900 border-t border-white/10">
                  <h3 className="text-lg sm:text-xl font-bold font-heading">
                    {selectedImage.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {selectedImage.caption}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};

export default Snapshot;
