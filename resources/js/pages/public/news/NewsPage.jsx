import React, { useState, useMemo } from 'react';
import rectangular from "../../../assets/images/rectangular_school_collage.png";
import image_1 from "../../../assets/images/advantage_1.png";
import image_2 from "../../../assets/images/advantage_2.png";
import image_3 from "../../../assets/images/advantage_3.png";
import image_4 from "../../../assets/images/advantage_4.png";
import hero_img from "../../../assets/images/hero_section_1.png";
import { motion, AnimatePresence } from "motion/react";
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiSearch,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiArrowRight,
  FiBookmark,
  FiShare2,
  FiX,
  FiCheck,
  FiDownload,
  FiFileText,
  FiTag,
  FiUser
} from 'react-icons/fi';
import { FaGraduationCap, FaTrophy, FaFlask, FaVolleyball, FaBullhorn, FaCalendarDays } from 'react-icons/fa6';
import toast from 'react-hot-toast';

const allArticles = [
  {
    id: 1,
    title: 'Outstanding Distinction in National & International Senior Examinations',
    category: 'Academics',
    tag: 'Academic Distinction',
    date: 'February 20, 2025',
    readTime: '4 min read',
    author: 'Academic Directorate',
    image: image_1,
    desc: 'Our graduating secondary class recorded a historic 98.4% distinction rate across STEM, Commercial, and Arts subjects in WAEC, NECO, and Cambridge evaluations.',
    content: `GHRA is thrilled to announce the extraordinary achievements of our Class of 2025/2026 in recent national and international examinations. 

Over 98.4% of our candidates achieved minimum 5 credits including Mathematics and English in a single sitting, with numerous pupils earning straight A1s in Further Mathematics, Physics, Chemistry, Economics, and Literature in English.

Furthermore, several of our students scored above 320 in the Unified Tertiary Matriculation Examination (UTME), gaining immediate merit admissions and scholarship offers into top universities across Nigeria, the United Kingdom, Canada, and the United States.

"This milestone is a testimony to the unwavering dedication of our teaching faculty, the diligence of our students, and the profound partnership of our parents," remarked the Principal during the academic assembly.`,
  },
  {
    id: 2,
    title: 'Annual Science, AI & Robotics Innovation Fair Announced for Term 2',
    category: 'STEM & Tech',
    tag: 'STEM & Robotics',
    date: 'February 12, 2026',
    readTime: '3 min read',
    author: 'Department of Science & Innovation',
    image: image_2,
    desc: 'Students across Primary and Secondary divisions prepare automated solar prototypes, IoT agricultural sensors, and Python coding models.',
    content: `Innovation and practical experimentation form the backbone of science education at GHRA. This year's Science, AI & Robotics Innovation Fair will take place on March 20, 2026 at the Multipurpose Technology Center.

Students from Primary 4 through SSS 3 will showcase creative working prototypes including:
- Automated solar tracking power systems for clean energy
- Soil moisture IoT sensors for smart crop farming
- Python-powered automated attendance and school library software
- Eco-friendly water filtration systems built from recycled local materials

Parents, alumni engineers, and tech industry judges are warmly invited to witness our young innovators defend their discoveries and compete for the Annual Young Scientist Trophy.`,
  },
  {
    id: 3,
    title: 'State-of-the-Art Digital E-Library & Virtual Learning Hub Commissioned',
    category: 'Campus Life',
    tag: 'Campus Infrastructure',
    date: 'January 28, 2026',
    readTime: '3 min read',
    author: 'Library & ICT Board',
    image: image_3,
    desc: 'Expanding student access to over 60,000 digital textbooks, international academic journals, and interactive multimedia research stations.',
    content: `As part of our commitment to 21st-century educational technology, GHRA has officially opened its expanded Digital E-Library and Research Hub.

The new facility features:
- 40 high-speed multimedia desktop workstations with filtered high-speed internet
- Seamless subscription access to global research databases (JSTOR, EBSCO, and Britannica School)
- Interactive touch-screen smart boards for collaborative group research and debate preparations
- Dedicated silent study carrels for senior examination candidates

The digital hub enables students to research complex scientific hypotheses, practice computer-based test (CBT) simulations, and read classic literature in an ergonomic, inspiring learning environment.`,
  },
  {
    id: 4,
    title: 'GHRA Athletic Squad Sweeps Inter-School Sports Invitational Championship',
    category: 'Sports & Arts',
    tag: 'Athletics & Sports',
    date: 'January 18, 2026',
    readTime: '3 min read',
    author: 'Sports & Physical Education Dept',
    image: image_4,
    desc: 'Our track and field stars secured 14 Gold, 9 Silver, and 6 Bronze medals, emerging overall champions at the State Private Schools Invitational.',
    content: `Demonstrating exemplary teamwork, grit, and athletic prowess, GHRA emerged victorious at the 2026 State Private Schools Sports Festival.

Highlights of the championship:
- 100m and 200m Senior Boys Gold (Master D. Alabi, SSS 2)
- 4x100m Senior Girls Relay Gold in record-breaking time
- Junior Table Tennis and Badminton Double Championship trophies
- Best Behaved and Most Disciplined School Contingent Award

Sports at GHRA are integral to our philosophy of developing healthy, resilient, and well-rounded leaders who embody sportsmanship both on and off the field.`,
  },
  {
    id: 5,
    title: 'Official Circular: 2025/2026 Diagnostic Entrance Assessment Dates',
    category: 'Official Notices',
    tag: 'Admissions Notice',
    date: 'January 08, 2025',
    readTime: '2 min read',
    author: 'Admissions Office',
    image: hero_img,
    desc: 'Schedule of screening evaluations for prospective Crèche, Nursery, Primary, and Secondary applicants for the upcoming academic session.',
    content: `The Admissions Office hereby notifies the general public that entrance diagnostic evaluations for the 2025/2026 Academic Session have commenced.

Assessments will be conducted in designated batches on:
- Batch A: Saturday, March 08, 2025 (9:00 AM)
- Batch B: Saturday, April 12, 2025 (9:00 AM)
- Batch C: Saturday, May 10, 2025 (9:00 AM)
- Batch D: Saturday, June 14, 2025 (9:00 AM)

Prospective parents may submit applications online via our admissions portal or visit the school administrative office for on-site registration.`,
  },
];

const upcomingEvents = [
  {
    id: 1,
    day: '08',
    month: 'MAR',
    year: '2025',
    title: '2025/2026 First Round Entrance Diagnostic Assessment',
    category: 'Admissions',
    time: '9:00 AM – 1:00 PM',
    location: 'Academic Block A & ICT Lab',
    target: 'Prospective Students & Parents',
    desc: 'Entrance screening in Mathematics, English, and General Aptitude for Nursery, Primary, and Secondary candidates.',
  },
  {
    id: 2,
    day: '15',
    month: 'MAR',
    year: '2025',
    title: 'Annual Inter-House Sports & Athletic Championship',
    category: 'Sports',
    time: '8:30 AM – 3:30 PM',
    location: 'School Main Sports Arena',
    target: 'All Students, Parents & Alumni',
    desc: 'A vibrant day of track, field, marching drills, and friendly house competitions with food stalls and awards.',
  },
  {
    id: 3,
    day: '20',
    month: 'MAR',
    year: '2025',
    title: 'Annual STEM, AI & Robotics Innovation Exhibition',
    category: 'Academics',
    time: '10:00 AM – 2:00 PM',
    location: 'Multipurpose Science Hall',
    target: 'Students, Parents & Tech Guests',
    desc: 'Student teams demonstrate working technology prototypes, solar energy systems, and robotics programming.',
  },
  {
    id: 4,
    day: '28',
    month: 'MAR',
    year: '2025',
    title: 'Term 2 Parent-Teacher Consultative Conference (PTC)',
    category: 'Parent Relations',
    time: '9:00 AM – 3:00 PM',
    location: 'Classrooms & Admin Block',
    target: 'Parents & Guardians',
    desc: 'One-on-one reviews between parents and subject teachers to evaluate academic trajectory and personal growth.',
  },
  {
    id: 5,
    day: '18',
    month: 'APR',
    year: '2026',
    title: 'GHRA Alumni Homecoming & Career Mentorship Day',
    category: 'Alumni',
    time: '11:00 AM – 4:00 PM',
    location: 'Main Auditorium',
    target: 'Alumni, Senior Students & Faculty',
    desc: 'Distinguished alumni share professional insights in Medicine, Law, Engineering, Tech, and Entrepreneurship.',
  },
];

const termDates = [
  {
    term: 'First Term (2024/2025)',
    resumption: 'September 16, 2024',
    midterm: 'October 28 – Nov 01, 2024',
    exams: 'December 02 – 11, 2024',
    vacation: 'December 13, 2024',
  },
  {
    term: 'Second Term (2024/2025)',
    resumption: 'January 06, 2025',
    midterm: 'February 17 – 21, 2025',
    exams: 'March 24 – April 02, 2025',
    vacation: 'April 04, 2025',
  },
  {
    term: 'Third Term (2024/2025)',
    resumption: 'April 28, 2025',
    midterm: 'June 09 – 13, 2025',
    exams: 'July 07 – 16, 2025',
    vacation: 'July 18, 2025',
  },
];

const categories = [
  { key: 'all', label: 'All News' },
  { key: 'Academics', label: 'Academics', icon: <FaGraduationCap /> },
  { key: 'STEM & Tech', label: 'STEM & Tech', icon: <FaFlask /> },
  { key: 'Sports & Arts', label: 'Sports & Arts', icon: <FaVolleyball /> },
  { key: 'Campus Life', label: 'Campus Life', icon: <FaTrophy /> },
  { key: 'Official Notices', label: 'Official Notices', icon: <FaBullhorn /> },
];

const NewsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleModal, setActiveArticleModal] = useState(null);
  const [activeTab, setActiveTab] = useState('news'); // 'news' or 'events'
  const [rsvpedEvents, setRsvpedEvents] = useState({});
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchCat = selectedCategory === 'all' || article.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleRsvp = (eventId, eventTitle) => {
    setRsvpedEvents((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
    if (!rsvpedEvents[eventId]) {
      toast.success(`You have RSVP'd for "${eventTitle}"! A calendar reminder has been logged.`);
    } else {
      toast('RSVP updated.', { icon: 'ℹ️' });
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Thank you for subscribing to the GHRA Gazette!');
    setNewsletterEmail('');
  };

  const handleShare = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.desc,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/news#article-${article.id}`);
      toast.success('Article link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-Dm-sans overflow-hidden">
      
      {/* Hero Banner */}
      <section
        className="relative min-h-[50vh] lg:min-h-[58vh] flex items-center justify-center bg-cover bg-center pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `url(${rectangular})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/65 via-[#0C1B33]/55 to-[#070F20]/80" />

        <div className="relative z-10 max-w-5xl mx-auto text-center text-white flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md mb-6">
            <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <FiChevronRight className="text-sky-400 text-xs" />
            <span className="text-sky-300">News & Events Hub</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs sm:text-sm font-bold mb-4 backdrop-blur-md">
            <FaBullhorn />
            <span>Official Institutional Bulletins & Campus Life</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight"
          >
            News, Milestones & <br className="hidden sm:block" />
            <span className="text-sky-400">Campus Events</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-2xl mx-auto text-slate-200 text-sm sm:text-base leading-relaxed"
          >
            Stay up to date with student triumphs, academic milestones, termly calendars, leadership gazettes, and community events at GHRA.
          </motion.p>

          {/* Section Switcher Tabs */}
          <div className="mt-8 flex rounded-full bg-white/10 p-1.5 border border-white/20 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'news'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FiFileText />
              <span>Latest News & Press</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'events'
                  ? 'bg-sky-400 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FaCalendarDays />
              <span>Upcoming School Events</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        {activeTab === 'news' ? (
          <>
            {/* Search & Category Filter Toolbar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-12">
              
              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.key
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.icon && <span className="text-xs">{cat.icon}</span>}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full lg:w-72 shrink-0">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles & press..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <FiX className="text-sm" />
                  </button>
                )}
              </div>
            </div>

            {/* Featured Highlight Article (only if 'all' category and no search) */}
            {selectedCategory === 'all' && !searchQuery && allArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16 bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-12 group cursor-pointer"
                onClick={() => setActiveArticleModal(allArticles[0])}
              >
                <div className="lg:col-span-7 relative h-72 lg:h-auto overflow-hidden bg-slate-100">
                  <img
                    src={allArticles[0].image}
                    alt={allArticles[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md">
                      Featured Headline
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-sky-300 text-xs font-bold">
                      {allArticles[0].category}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="font-semibold text-slate-600">{allArticles[0].author}</span>
                      <span>•</span>
                      <span>{allArticles[0].date}</span>
                      <span>•</span>
                      <span>{allArticles[0].readTime}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-tight group-hover:text-blue-600 transition-colors">
                      {allArticles[0].title}
                    </h2>

                    <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {allArticles[0].desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 group-hover:gap-3 transition-all">
                      <span>Read Complete Story</span>
                      <FiArrowRight />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(allArticles[0]);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      aria-label="Share article"
                    >
                      <FiShare2 />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Articles Grid */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto">
                <FiSearch className="text-4xl text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 font-heading">No articles found</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  We couldn't find any articles matching "{searchQuery}". Try searching with different keywords.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {filteredArticles.map((article, idx) => (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                    onClick={() => setActiveArticleModal(article)}
                  >
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-md">
                        {article.tag}
                      </span>
                    </div>

                    <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <FiCalendar className="text-blue-500" />
                          <span>{article.date}</span>
                          <span>•</span>
                          <span>{article.readTime}</span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading leading-snug group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>

                        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {article.desc}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                          <span>Read Full Story</span>
                          <FiArrowRight className="text-xs" />
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(article);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          aria-label="Share article"
                        >
                          <FiShare2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Events Calendar Tab */
          <div>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-3">
                <FaCalendarDays className="text-sky-600" />
                <span>Termly Schedule & Gatherings</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading">
                Upcoming School Events & Milestones
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base">
                Join our academic fairs, sporting championships, parent consultations, and cultural festivals.
              </p>
            </div>

            {/* Events List */}
            <div className="space-y-6 max-w-4xl mx-auto mb-20">
              {upcomingEvents.map((evt, idx) => {
                const isRsvped = rsvpedEvents[evt.id];
                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group"
                  >
                    {/* Left: Date Badge + Details */}
                    <div className="flex items-start gap-5">
                      <div className="flex flex-col items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shrink-0 text-center shadow-md">
                        <span className="text-xl sm:text-2xl font-black font-heading leading-none">{evt.day}</span>
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-0.5">{evt.month}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                            {evt.category}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Target: {evt.target}</span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading group-hover:text-blue-600 transition-colors">
                          {evt.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-xl">
                          {evt.desc}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <FiClock className="text-blue-500" />
                            <span>{evt.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FiMapPin className="text-sky-500" />
                            <span>{evt.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right RSVP button */}
                    <button
                      onClick={() => handleRsvp(evt.id, evt.title)}
                      className={`w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                        isRsvped
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-900 hover:bg-blue-600 text-white shadow-md'
                      }`}
                    >
                      {isRsvped ? (
                        <>
                          <FiCheck className="text-emerald-600" />
                          <span>RSVP Confirmed</span>
                        </>
                      ) : (
                        <>
                          <FiCalendar />
                          <span>RSVP / Save Date</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Academic Term Dates Table */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl max-w-5xl mx-auto mb-16">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                <FaCalendarDays />
                <span>Academic Itinerary</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-heading mb-6">
                2024/2025 Academic Calendar Schedule
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4">Academic Term</th>
                      <th className="py-3 px-4">Resumption</th>
                      <th className="py-3 px-4">Mid-Term Break</th>
                      <th className="py-3 px-4">Term Exams</th>
                      <th className="py-3 px-4">Vacation Begins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {termDates.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-4 font-bold text-slate-900">{item.term}</td>
                        <td className="py-4 px-4 text-slate-600">{item.resumption}</td>
                        <td className="py-4 px-4 text-sky-600 font-medium">{item.midterm}</td>
                        <td className="py-4 px-4 text-blue-600 font-medium">{item.exams}</td>
                        <td className="py-4 px-4 text-emerald-600 font-bold">{item.vacation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Downloadable Gazette Banner */}
        <div className="bg-gradient-to-br from-[#0A192F] via-[#0E254E] to-[#070F20] text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-400/20 text-sky-300 text-xs font-bold mb-3 border border-sky-400/30">
              <FiDownload />
              <span>Official Publications</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Download the Latest School Gazette
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Read comprehensive termly reviews, student poetry, photographic retrospectives, and academic milestones in PDF format.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex-1 max-w-md">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg transition shrink-0 cursor-pointer"
              >
                Subscribe
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center lg:text-left">
              Get termly newsletters and emergency academic announcements directly.
            </p>
          </form>
        </div>

      </div>

      {/* Interactive Article Modal Reader */}
      <AnimatePresence>
        {activeArticleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveArticleModal(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Header Image with close button */}
              <div className="relative h-64 sm:h-72 shrink-0 bg-slate-900">
                <img
                  src={activeArticleModal.image}
                  alt={activeArticleModal.title}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <button
                  onClick={() => setActiveArticleModal(null)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition cursor-pointer"
                  aria-label="Close article"
                >
                  <FiX className="text-lg" />
                </button>

                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                    {activeArticleModal.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-2">
                    <span>{activeArticleModal.date}</span>
                    <span>•</span>
                    <span>{activeArticleModal.readTime}</span>
                    <span>•</span>
                    <span>By {activeArticleModal.author}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Article Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-tight">
                  {activeArticleModal.title}
                </h2>

                <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
                  {activeArticleModal.content}
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={() => handleShare(activeArticleModal)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    <FiShare2 />
                    <span>Share This Release</span>
                  </button>

                  <button
                    onClick={() => setActiveArticleModal(null)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Close Story
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default NewsPage;
