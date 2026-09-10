import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen, FiAward, FiCheck, FiCompass } from 'react-icons/fi';
import { FaGraduationCap, FaChildReaching, FaBookOpenReader, FaUserTie } from 'react-icons/fa6';

import advantage_1 from '../../../assets/images/advantage_1.png';
import advantage_2 from '../../../assets/images/advantage_2.png';
import advantage_3 from '../../../assets/images/advantage_3.png';
import advantage_4 from '../../../assets/images/advantage_4.png';

const divisions = [
  {
    id: 'early-years',
    title: 'Early Years (Crèche & Nursery)',
    age: 'Ages 1 - 5 Years',
    icon: <FaChildReaching className="text-sky-500 text-2xl" />,
    tag: 'Foundation & Discovery',
    image: advantage_4,
    description:
      'A warm, playful, and stimulating environment designed to build early cognitive, emotional, social, and fine motor skills.',
    highlights: [
      'Montessori & Play-Based Learning',
      'Early Phonics & Numeracy Foundation',
      'Sensory & Creative Discovery Play',
      'Safe, Nurturing & Certified Caregivers',
    ],
  },
  {
    id: 'primary',
    title: 'Primary School (Grades 1 - 6)',
    age: 'Ages 6 - 11 Years',
    icon: <FaBookOpenReader className="text-blue-500 text-2xl" />,
    tag: 'Academic Mastery & STEM',

    image: advantage_1,
    description:
      'A rich hybrid curriculum blending Nigerian and Cambridge primary benchmarks to foster strong academic foundations and curiosity.',
    highlights: [
      'Core Literacy, Mathematics & Science',
      'ICT & Robotics Introduction',
      'French & Diction Programs',
      'Rich Athletics & Music Education',
    ],
  },
  {
    id: 'junior-secondary',
    title: 'Junior Secondary (JSS 1 - 3)',
    age: 'Ages 11 - 14 Years',
    icon: <FiBookOpen className="text-emerald-500 text-2xl" />,
    tag: 'Critical Thinking & Exploration',
    image: advantage_2,
    description:
      'Transitioning learners into critical thinkers with specialized subject delivery, practical lab work, and leadership mentorship.',
    highlights: [
      'National BECE & Checkpoint Prep',
      'Applied Science & Tech Workshops',
      'Debate, Drama & Creative Arts',
      'Personal Guidance & Study Skills',
    ],
  },
  {
    id: 'senior-secondary',
    title: 'Senior Secondary (SSS 1 - 3)',
    age: 'Ages 14 - 17 Years',
    icon: <FaUserTie className="text-purple-500 text-2xl" />,
    tag: 'University Readiness & Leadership',
    image: advantage_3,
    description:
      'Intensive academic rigor preparing students for WAEC, NECO, JAMB, and international university entrance examinations.',
    highlights: [
      'Science, Arts & Commercial Streams',
      'Dedicated Exam Success Coaching',
      'Career Counseling & Mentorship',
      'Student Governance & Prefect Leadership',
    ],
  },
];

const AcademicPathways = () => {
  const [activeTab, setActiveTab] = useState('early-years');
  const activeDivision = divisions.find((d) => d.id === activeTab) || divisions[0];

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <FaGraduationCap className="text-blue-600 text-sm" />
            <span>Academic Excellence & Pathways</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
            Tailored Learning for <br className="hidden sm:block" />
            <span className="text-blue-600">Every Stage of Growth</span>
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Our comprehensive academic roadmap is intentionally structured to nurture confidence, inspire intellect, and prepare students for world-class achievements.
          </p>
        </div>

        {/* Division Selector Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-10 hide-scrollbar">
          {divisions.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span>{item.title.split('(')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Active Division Feature Showcase Card */}
        <motion.div
          key={activeDivision.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-slate-900 via-[#0B1A33] to-slate-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl border border-white/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Info Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1 rounded-full bg-sky-400/20 border border-sky-400/30 text-sky-300 text-xs font-bold">
                  {activeDivision.age}
                </span>
                <span className="px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                  {activeDivision.tag}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-heading">
                {activeDivision.title}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {activeDivision.description}
              </p>

              {/* Highlights */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Key Curriculum Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeDivision.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                        <FiCheck className="text-xs" />
                      </div>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-blue-600/30 transition-all"
                >
                  <span>Apply for {activeDivision.title.split('(')[0].trim()}</span>
                  <FiArrowRight />
                </Link>

                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-6 py-3 rounded-full border border-white/20 transition-all"
                >
                  <FiCompass className="text-sky-400" />
                  <span>Curriculum Details</span>
                </Link>
              </div>
            </div>

            {/* Right Photo Column (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
                <img
                  src={activeDivision.image}
                  alt={activeDivision.title}
                  className="w-full h-72 sm:h-84 lg:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AcademicPathways;
