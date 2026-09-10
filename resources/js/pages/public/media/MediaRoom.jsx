import React, { useState, useEffect } from 'react';
import rectangular from "../../../assets/images/rectangular_school_collage.png";
import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { FiChevronRight, FiDownload, FiFileText, FiCalendar, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getMediaArticles, subscribeToMediaUpdates, ARTICLE_CATEGORIES } from '../../../services/mediaService';

const downloads = [
  {
    title: '2025/2026 Comprehensive School Prospectus',
    size: 'PDF • 3.8 MB',
    desc: 'Detailed overview of academic curriculum, philosophy, tuition structures, and enrollment guidelines.',
  },
  {
    title: 'Official 2024/2025 Academic Year Calendar',
    size: 'PDF • 1.2 MB',
    desc: 'Complete termly itinerary with examination periods, mid-term breaks, and parent conference dates.',
  },
  {
    title: 'Student Uniform & Stationery Guidelines',
    size: 'PDF • 850 KB',
    desc: 'Dress code specifications and recommended textbook list across Nursery, Primary, and Secondary.',
  },
];

const MediaRoom = () => {
  const [articles, setArticles] = useState(() => getMediaArticles());
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const unsubscribe = subscribeToMediaUpdates(() => {
      setArticles(getMediaArticles());
    });
    return unsubscribe;
  }, []);


  const filteredArticles = activeTab === 'all'
    ? articles
    : articles.filter(item => item.category === activeTab);

  const handleDownload = (docTitle) => {
    toast.success(`Preparing "${docTitle}" for download...`);
  };

  return (
    <div className="bg-slate-50 font-Dm-sans">
      
      {/* Hero Section */}
      <section
        className="relative min-h-[50vh] lg:min-h-[58vh] flex items-center justify-center bg-cover bg-center pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `url(${rectangular})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/65 via-[#0C1B33]/55 to-[#070F20]/80" />

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md mb-6">
            <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <FiChevronRight className="text-sky-400 text-xs" />
            <span className="text-sky-300">Media Room & Press</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight"
          >
            News, Media & <br className="hidden sm:block" />
            <span className="text-sky-400">Institutional Announcements</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-2xl mx-auto text-slate-200 text-sm sm:text-base leading-relaxed"
          >
            Your central source for official school news, published gazettes, press releases, student spotlights, and downloadable institutional resources.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        {/* Category Filter Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-12 hide-scrollbar">
          {ARTICLE_CATEGORIES.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Media Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {filteredArticles.map((item, idx) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <div className="relative h-60 overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md">
                  {item.tag || item.category}
                </span>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <FiCalendar className="text-blue-500" />
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 font-heading leading-snug group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    <span>Read Full Release</span>
                    <FiArrowRight />
                  </span>
                  <button
                    onClick={() => toast.success('Link copied to clipboard!')}
                    className="text-xs text-slate-400 hover:text-slate-700 transition"
                  >
                    Share
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Downloadable Publications & Prospectus Section */}
        <div className="bg-gradient-to-br from-slate-900 via-[#0B1A33] to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/10">
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-400/20 text-sky-300 text-xs font-bold mb-3 border border-sky-400/30">
              <FiFileText />
              <span>Downloadable Resources</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Official School Publications & Documents
            </h2>
            <p className="text-slate-300 text-sm mt-2">
              Download our official curriculum syllabus, term calendars, and enrollment handbook in PDF format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {downloads.map((doc, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                      <FiFileText className="text-xl" />
                    </div>
                    <span className="text-[11px] font-bold text-sky-300 bg-sky-400/10 px-2.5 py-0.5 rounded-full">
                      {doc.size}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-heading mb-2">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {doc.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(doc.title)}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-white/10 group-hover:bg-blue-600 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  <FiDownload />
                  <span>Download Document</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MediaRoom;
