import React from "react";
import image_1 from "../../../assets/images/welcome_image_1.png";
import image_2 from "../../../assets/images/welcome_image_2.png";
import outdoor from "../../../assets/images/outdoor_play_and_writing.png";

import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { FaQuoteLeft, FaGraduationCap } from "react-icons/fa6";
import { useSchoolSettings } from "../../../context/SchoolSettingsContext";

const pillars = [
  "Integrated Cambridge & Nigerian Curriculum",
  "Dedicated & Certified Subject Specialists",
  "Technology-Driven Smart Classrooms & Labs",
  "Strong Focus on Character, Discipline & Faith",
];

const Welcome = () => {
  const { settings } = useSchoolSettings();
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Subtle decorative background shapes */}
      <div className="pointer-events-none absolute top-10 right-0 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-10 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Welcome Address & School Vision (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
              <FaGraduationCap className="text-blue-600 text-sm" />
              <span>Welcome to GHRA</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
              A Warm Welcome from <br className="hidden sm:block" />
              <span className="text-blue-600">The Head of School</span>
            </h2>

            {/* Quote Block */}
            <div className="relative pl-6 sm:pl-8 border-l-4 border-sky-400 py-1">
              <FaQuoteLeft className="absolute -top-3 -left-3 text-sky-400/30 text-2xl" />
              <p className="text-base sm:text-lg text-slate-700 font-medium italic leading-relaxed">
                "Every child is born with unique genius. Our calling is to ignite that spark, build unshakeable character, and prepare them for global distinction."
              </p>
            </div>

            {/* Message Body */}
            <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              <p>
                {settings?.about_us ? (
                  settings.about_us
                ) : (
                  <>At {settings?.school_name || "GHRA"}, we provide an intellectually vibrant and nurturing environment where learners thrive. Guided by our motto <em>"{settings?.motto || "Shaping Young Minds, Building Future Leaders"}"</em>, we harmonize national benchmarks with global standards, cultivating critical thinking, creativity, moral integrity, and technological fluency.</>
                )}
              </p>
              <p>
                From early childhood foundations through senior secondary graduation, we guide each learner through an enriching journey of personal discovery, academic rigor, and leadership cultivation.
              </p>
            </div>

            {/* Pillars Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {pillars.map((pillar, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800">
                  <FiCheckCircle className="text-blue-600 text-base shrink-0" />
                  <span>{pillar}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Visual Photo Composition & Experience Badge (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="grid grid-cols-2 gap-4">
              
              {/* Image 1: Main top */}
              <div className="col-span-2 rounded-3xl overflow-hidden shadow-xl border-4 border-white group">
                <img
                  src={image_1}
                  alt="Students in classroom learning"
                  className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Image 2: Bottom left */}
              <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white group">
                <img
                  src={image_2}
                  alt="Student activity"
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Image 3: Bottom right */}
              <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white group">
                <img
                  src={outdoor}
                  alt="Outdoor student development"
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Floating Experience Badge */}
            <div className="absolute -bottom-6 -left-4 sm:left-6 bg-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-100 flex items-center gap-4 max-w-[260px]">
              <div className="h-12 w-12 rounded-xl bg-sky-400/20 text-sky-600 flex items-center justify-center text-2xl font-black shrink-0">
                {settings?.years_of_experience || "15+"}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 font-heading">
                  {settings?.experience_subtitle || "Years of Excellence"}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">Inspiring generations of future leaders</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Welcome;

