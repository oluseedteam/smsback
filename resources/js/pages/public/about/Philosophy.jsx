import React from 'react';
import rectangular from "../../../assets/images/rectangular_school_collage.png";
import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { FiChevronRight, FiCompass } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';

const Philosophy = () => {
  return (
    <section
      className="relative min-h-[60vh] lg:min-h-[70vh] flex items-center justify-center bg-cover bg-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ backgroundImage: `url(${rectangular})` }}
    >
      {/* Dark modern gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/65 via-[#0C1B33]/55 to-[#070F20]/80"></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center text-white flex flex-col items-center">
        
        {/* Breadcrumb */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md mb-6">
          <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
          <FiChevronRight className="text-sky-400 text-xs" />
          <span className="text-sky-300">About Our School</span>
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight drop-shadow-md"
        >
          Our Vision, Philosophy & <br className="hidden sm:block" />
          <span className="text-sky-400">Heritage of Excellence</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-2xl mx-auto text-slate-200 text-sm sm:text-base md:text-lg leading-relaxed"
        >
          Every child can learn, grow, and excel when given the right environment, inspirational mentorship, and boundless encouragement.
        </motion.p>

      </div>
    </section>
  );
};

export default Philosophy;

