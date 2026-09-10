import React from 'react';
import playground from "../../../assets/images/welcome_image_1.png";
import classroom from "../../../assets/images/advantage_3.png";
import { motion } from "motion/react";

import { FiTarget, FiCompass, FiAward, FiShield, FiHeart, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { FaGraduationCap, FaHandsHoldingChild } from 'react-icons/fa6';
import { useSchoolSettings } from '../../../context/SchoolSettingsContext';

const coreValues = [
  { icon: <FiAward className="text-sky-400 text-xl" />, title: 'Excellence', desc: 'Uncompromising pursuit of mastery in academic, artistic, and athletic endeavors.' },
  { icon: <FiShield className="text-blue-500 text-xl" />, title: 'Integrity', desc: 'Instilling truthfulness, transparency, and personal accountability in all actions.' },
  { icon: <FiTarget className="text-emerald-500 text-xl" />, title: 'Discipline', desc: 'Cultivating self-control, punctuality, and focused dedication to daily goals.' },
  { icon: <FiHeart className="text-rose-500 text-xl" />, title: 'Respect', desc: 'Valuing every individual learner, teacher, family, and diverse perspectives.' },
  { icon: <FiTrendingUp className="text-purple-500 text-xl" />, title: 'Continuous Growth', desc: 'Fostering an adaptive growth mindset and resilience in the face of challenges.' },
  { icon: <FaHandsHoldingChild className="text-cyan-500 text-xl" />, title: 'Community Service', desc: 'Encouraging social empathy and meaningful contributions to society.' },
];

const approaches = [
  'Structured dual curriculum delivery (National & British Cambridge)',
  'Interactive, learner-centered classroom engagement',
  'Practical STEM laboratory experiments and coding workshops',
  'Continuous diagnostic assessment and detailed feedback',
  'Small class sizes ensuring individualized teacher mentorship',
  'Holistic extracurricular leadership and debate coaching',
];

const Vision = () => {
  const { settings } = useSchoolSettings();
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-800 font-Dm-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <FiCompass className="text-blue-600 text-sm" />
            <span>Guiding Principles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
            Our Vision, Mission & <span className="text-blue-600">Core Values</span>
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            The foundational pillars and philosophical beliefs that guide every lesson, activity, and interaction at GHRA.
          </p>
        </div>

        {/* Top Section: Vision & Mission Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          
          {/* Vision Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl min-h-[340px] bg-[#0A192F] text-white p-8 sm:p-10 flex flex-col justify-between border border-white/10 shadow-xl group"
          >
            <img
              src={playground}
              alt="GHRA Playground"
              className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A192F] via-[#0C2247]/90 to-[#0A192F]/95" />

            <div className="relative z-10 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-400/20 text-sky-400 flex items-center justify-center text-2xl border border-sky-400/30">
                <FiCompass />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Our Vision
              </h3>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {settings?.vision || "To be a premier, benchmark educational institution recognized nationally and globally for academic brilliance, unshakeable character, and the continuous nurturing of confident, visionary leaders."}
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-widest">
                Inspiring Excellence • Igniting Potential
              </span>
            </div>
          </motion.div>

          {/* Mission Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl min-h-[340px] bg-[#0C1E3C] text-white p-8 sm:p-10 flex flex-col justify-between border border-white/10 shadow-xl group"
          >
            <img
              src={classroom}
              alt="GHRA Classroom learning"
              className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C1E3C] via-[#0F2A56]/90 to-[#0C1E3C]/95" />

            <div className="relative z-10 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl border border-blue-400/30">
                <FiTarget />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Our Mission
              </h3>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {settings?.mission || "To deliver a balanced, world-class curriculum through modern pedagogy, instilling critical thinking, ethical integrity, digital literacy, and leadership skills in every child."}
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                Nurturing Tomorrow's Changemakers
              </span>
            </div>
          </motion.div>

        </div>

        {/* 6 Core Values Grid */}
        <div className="mb-20">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading text-center mb-10">
            Our Six Core Values
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreValues.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-200"
              >
                <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  {val.icon}
                </div>
                <h4 className="text-lg font-bold text-slate-900 font-heading mb-2">
                  {val.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Educational Approach Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-md"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold">
                <FaGraduationCap />
                <span>Pedagogy & Methodology</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                Our Educational Methodology
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                We combine academic rigor with inquiry-based learning. Our classrooms encourage collaborative problem-solving, continuous assessment, and hands-on application.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {approaches.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
                  <FiCheckCircle className="text-blue-600 text-base shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Vision;

