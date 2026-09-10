import React from 'react';
import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { FiArrowRight, FiFileText, FiCalendar, FiCheckSquare, FiAward, FiDownload } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';

const steps = [
  {
    step: '01',
    icon: <FiFileText className="text-xl text-sky-400" />,
    title: 'Submit Application',
    desc: 'Fill out our online inquiry form or collect the application package from the admissions office.',
  },
  {
    step: '02',
    icon: <FiCalendar className="text-xl text-blue-400" />,
    title: 'Entrance Assessment',
    desc: 'Candidate takes a diagnostic evaluation in Mathematics, English, and general aptitude.',
  },
  {
    step: '03',
    icon: <FiCheckSquare className="text-xl text-emerald-400" />,
    title: 'Family Interview',
  },
  {
    step: "04",
    title: "Enrollment & Welcome",
    desc: "Complete documentation, receive school kit, uniforms, and join the GHRA family!",
    icon: <FaGraduationCap className="text-xl text-purple-400" />,
  },
];

const Admission = () => {
  return (
    <section className="relative py-20 lg:py-28 bg-[#0B1528] px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorators */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Banner Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md mb-4 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-300">
              Enrollment Open 2025/2026 Academic Session
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white font-heading tracking-tight leading-tight">
            Admissions <span className="text-sky-400">Now Open</span>
          </h2>

          <p className="mt-4 text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
            Give your child the distinct advantage of a world-class academic foundation and exemplary moral character.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 hover:border-blue-400/40 rounded-3xl p-6 sm:p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white/10 border border-white/10 group-hover:bg-blue-600 transition-colors">
                  {item.icon}
                </div>
                <span className="text-2xl font-black text-white/30 group-hover:text-sky-400 transition-colors font-heading">
                  {item.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
          <Link
            to="/admissions"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base px-8 py-4 rounded-full shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Begin Online Application</span>
            <FiArrowRight className="text-lg" />
          </Link>

          <Link
            to="/admissions#checklist-section"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-full border border-white/20 backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
          >
            <FiDownload className="text-sky-400" />
            <span>Admission Requirements</span>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default Admission;
