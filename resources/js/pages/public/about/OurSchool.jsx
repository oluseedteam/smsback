import React from 'react';
import pathtoschool from "../../../assets/images/welcome_image_3.png";
import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiAward, FiShield, FiArrowRight } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';
import { useSchoolSettings } from '../../../context/SchoolSettingsContext';

const OurSchool = () => {
  const { settings } = useSchoolSettings();

  const facts = [
    { label: 'Accreditation', val: 'Ministry of Education & WAEC/NECO Certified' },
    { label: 'Curriculum', val: 'Blended Nigerian & Cambridge International' },
    { label: 'Avg. Class Size', val: '15 - 20 Students for Maximum Attention' },
    { label: 'Location', val: settings?.address || 'Secure, Serene Campus in Osogbo, Osun State' },
  ];
  return (
    <section className="bg-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8 font-Dm-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Side: Image with Floating Stats Card (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative group rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100">
              <img
                src={pathtoschool}
                alt="GHRA campus and student learning"
                className="w-full h-80 sm:h-96 lg:h-[460px] object-cover transform transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="px-3 py-1 rounded-full bg-blue-600 text-xs font-bold uppercase tracking-wider mb-2 inline-block shadow-md">
                  Institutional Heritage
                </span>
                <p className="text-sm sm:text-base font-bold font-heading">
                  Dedicated to Holistic Child Development
                </p>
              </div>
            </div>

            {/* Accent badge */}
            <div className="hidden sm:flex absolute -top-5 -right-5 bg-sky-400 text-slate-950 p-4 rounded-2xl shadow-xl items-center gap-3 font-bold text-xs">
              <FiAward className="text-2xl" />
              <div>
                <p className="leading-tight">Premier Standard</p>
                <p className="text-[10px] opacity-80 font-normal">Approved Learning Center</p>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Text Content & Key Institutional Facts (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
              <FaGraduationCap className="text-blue-600 text-sm" />
              <span>Who We Are</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
              A Forward-Thinking Community of <span className="text-blue-600">Scholars & Achievers</span>
            </h2>

            <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              <p>
                {settings?.about_us || 'GHRA was founded with a distinct educational mandate: to offer uncompromising academic quality, moral uprightness, and modern vocational exposure in a secure and inspiring environment.'}
              </p>
              <p>
                We believe true education addresses the mind, the heart, and the hands. We challenge learners to develop independent curiosity, disciplined study habits, empathetic leadership skills, and global outlooks.
              </p>
            </div>

            {/* Quick Facts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {facts.map((f, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 font-heading mt-0.5">{f.val}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>Schedule a Campus Tour</span>
                <FiArrowRight />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default OurSchool;

