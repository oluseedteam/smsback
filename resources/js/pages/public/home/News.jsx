import React from 'react';
import { FiArrowRight, FiCalendar, FiClock, FiMapPin, FiBookmark } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';
import image_1 from '../../../assets/images/advantage_1.png';
import image_2 from '../../../assets/images/advantage_2.png';
import image_3 from '../../../assets/images/advantage_3.png';
import { motion } from "motion/react";
import { Link } from 'react-router-dom';

const newsArticles = [
  {
    id: 1,
    image: image_1,
    category: 'Academics',
    title: 'Outstanding Performance in National & International Examinations',
    date: 'February 18, 2025',
    readTime: '3 min read',
    desc: 'Our graduating secondary class achieved a remarkable 98% distinction rate across science, commerce, and arts subjects.',
  },
  {
    id: 2,
    image: image_2,
    category: 'STEM & Tech',
    title: 'Annual Science & Robotics Innovation Fair Announced',
    date: 'January 28, 2025',
    readTime: '4 min read',
    desc: 'Students prepare to showcase automated solar prototypes, coding algorithms, and interactive physics models.',
  },
  {
    id: 3,
    image: image_3,
    category: 'Campus Life',
    title: 'New Digital Library and E-Learning Hub Commissioned',
    date: 'January 10, 2025',
    readTime: '2 min read',
    desc: 'Expanding our students’ access to over 50,000 digital textbooks, academic research journals, and online tutoring.',
  },
];

const upcomingEvents = [
  {
    id: 1,
    day: '12',
    month: 'MAR',
    title: 'Annual Inter-House Sports & Athletic Championship',
    time: '8:30 AM – 3:00 PM',
    location: 'Main School Sports Complex',
  },
  {
    id: 2,
    day: '26',
    month: 'MAR',
    title: 'Termly Parent-Teacher Consultative Conference (PTC)',
    time: '10:00 AM – 2:00 PM',
    location: 'School Multipurpose Hall',
  },
  {
    id: 3,
    day: '08',
    month: 'APR',
    title: '2025/2026 First Round Entrance Diagnostic Assessment',
    time: '9:00 AM – 1:00 PM',
    location: 'Academic Block A',
  },
];

const News = () => {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
              <FaGraduationCap className="text-blue-600 text-sm" />
              <span>Campus Happenings & Updates</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
              News & <span className="text-blue-600">Upcoming Events</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Keep up to date with the latest achievements, notices, and scheduled academic activities at GHRA.
            </p>
          </div>

          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition self-start md:self-auto"
          >
            <span>View All News & Events</span>
            <FiArrowRight />
          </Link>
        </div>

        {/* 2-Column Split: News Cards (Left 7 cols) & Events Calendar (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* News Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <FiBookmark className="text-blue-600" />
              <span>Latest News Releases</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {newsArticles.slice(0, 2).map((article) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-md">
                      {article.category}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 font-heading leading-snug group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h4>
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {article.desc}
                      </p>
                    </div>

                    <Link
                      to="/news"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 pt-2 border-t border-slate-100"
                    >
                      <span>Read Full Story</span>
                      <FiArrowRight className="text-xs" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Events Calendar (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <FiCalendar className="text-sky-500" />
              <span>Upcoming School Calendar</span>
            </h3>

            <div className="space-y-4">
              {upcomingEvents.map((evt) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                >
                  {/* Date Badge */}
                  <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 shrink-0 text-center">
                    <span className="text-lg font-black font-heading leading-none">{evt.day}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{evt.month}</span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 font-heading leading-snug">
                      {evt.title}
                    </h4>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <FiClock className="text-blue-500" />
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiMapPin className="text-sky-500" />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick action card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white flex items-center justify-between gap-4 shadow-lg">
              <div>
                <h4 className="text-sm font-bold font-heading">Need the full Term Calendar?</h4>
                <p className="text-xs text-slate-300 mt-0.5">Download our complete academic itinerary.</p>
              </div>
              <Link
                to="/news"
                className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs shrink-0 transition"
              >
                View Calendar
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default News;

