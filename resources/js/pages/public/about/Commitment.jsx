import React from 'react';
import studentinclass from "../../../assets/images/advantage_3.png";
import classroom from "../../../assets/images/advantage_1.png";
import outdor from "../../../assets/images/outdoor_play_and_writing.png";
import { motion } from "motion/react";
import { FiUsers, FiHeart, FiCheck, FiArrowRight } from 'react-icons/fi';
import { FaGraduationCap, FaHandsHoldingChild } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

const parentCommitments = [
  "Continuous real-time grade & attendance updates via the portal",
  "Scheduled termly Parent-Teacher Consultative Conferences (PTC)",
  "Open-door communication policy with principal & counselors",
  "Transparent, supportive guidance for university & career choices",
];

const studentCommitments = [
  "Express curiosity and ask probing questions freely",
  "Cultivate leadership, sportsmanship, and creative expression",
  "Develop self-discipline, respect, and academic accountability",
  "Learn in a zero-tolerance environment for bullying and harassment",
];

const Commitment = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 font-Dm-sans relative overflow-hidden">
      
      {/* Section Title */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
          <FaHandsHoldingChild className="text-blue-600 text-sm" />
          <span>Our Sacred Trust</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
          Our Dual Commitment to <br className="hidden sm:block" />
          <span className="text-blue-600">Parents & Students</span>
        </h2>
        <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
          Education is at its best when teachers, parents, and students work together with mutual respect, clear expectations, and unyielding support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

        {/* LEFT: Image Collage (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 space-y-4"
        >
          <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-slate-100 group">
            <img
              src={studentinclass}
              alt="Students learning in class"
              className="w-full h-64 sm:h-72 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 group">
              <img
                src={outdor}
                alt="Children in outdoor recreation"
                className="w-full h-40 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 group">
              <img
                src={classroom}
                alt="Student engaged in reading"
                className="w-full h-40 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Dual Commitment Cards (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-7 space-y-8"
        >
          {/* Commitment to Parents */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                <FiUsers className="text-xl" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Commitment to Parents
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              We view parents as essential co-educators. We keep families intimately informed through transparent portal updates, scheduled engagement conferences, and proactive feedback.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {parentCommitments.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                  <FiCheck className="text-blue-600 text-sm mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commitment to Students */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600">
                <FiHeart className="text-xl" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Commitment to Students
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              We cultivate a vibrant, emotionally safe space where each student feels seen, heard, challenged, and celebrated for their authentic strengths and talents.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {studentCommitments.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                  <FiCheck className="text-sky-600 text-sm mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-md transition-all"
            >
              <span>Join the GHRA Family Today</span>
              <FiArrowRight />
            </Link>
          </div>

        </motion.div>

      </div>
    </section>
  );
};

export default Commitment;

