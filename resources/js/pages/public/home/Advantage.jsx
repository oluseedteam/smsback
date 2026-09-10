import React from 'react';
import advantage_1 from '../../../assets/images/advantage_1.png';
import advantage_2 from '../../../assets/images/advantage_2.png';
import advantage_3 from '../../../assets/images/welcome_image_2.png';
import advantage_4 from '../../../assets/images/welcome_image_3.png';
import advantage_5 from '../../../assets/images/advantage_3.png';
import advantage_6 from '../../../assets/images/advantage_4.png';
import { motion } from "motion/react";
import { FiAward, FiUsers, FiShield, FiCpu, FiCompass, FiActivity } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';

const advantages = [
  {
    id: 1,
    image: advantage_1,
    icon: <FiAward className="text-blue-600 text-xl" />,
    badge: "Academics",
    title: 'Strong Academic Results & Rigorous Curriculum',
    desc: 'Consistently outstanding WAEC, BECE, and national exam achievements driven by a structured, learner-centered syllabus.',
  },
  {
    id: 2,
    image: advantage_2,
    icon: <FiUsers className="text-sky-600 text-xl" />,
    badge: "Faculty",
    title: 'Dedicated, Certified & Passionate Teachers',
    desc: 'Experienced educators committed to personalized mentoring, continuous professional development, and student success.',
  },
  {
    id: 3,
    image: advantage_3,
    icon: <FiShield className="text-emerald-600 text-xl" />,
    badge: "Environment",
    title: 'Safe, Disciplined & Inspiring Campus',
    desc: 'Secure learning environment with state-of-the-art surveillance, proactive student welfare policies, and a culture of respect.',
  },
  {
    id: 4,
    image: advantage_4,
    icon: <FiCpu className="text-purple-600 text-xl" />,
    badge: "Innovation",
    title: 'Modern Teaching Methods & Technology Labs',
    desc: 'Smart classrooms, coding & robotics clubs, computer labs, and digital learning tools that prepare learners for future careers.',
  },
  {
    id: 5,
    image: advantage_5,
    icon: <FiCompass className="text-indigo-600 text-xl" />,
    badge: "Character",
    title: 'Balanced Focus on Mind, Heart & Morals',
    desc: 'Nurturing sound moral grounding, leadership values, empathy, and practical life skills alongside academic excellence.',
  },
  {
    id: 6,
    image: advantage_6,
    icon: <FiActivity className="text-rose-600 text-xl" />,
    badge: "Co-Curricular",
    title: 'Rich Extracurricular & Sports Programs',
    desc: 'Comprehensive sports facilities, musical arts, press club, STEM competitions, and community service projects.',
  },
];

const Advantage = () => {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-blue-100/40 blur-3xl" />

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold mb-3">
            <FaGraduationCap className="text-blue-600 text-sm" />
            <span>Why Choose GHRA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
            The GHRA <br className="hidden sm:block" />
            <span className="text-blue-600">Educational Advantage</span>
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            We go beyond standard textbook learning to create a transformative educational experience where every learner blossoms intellectually and socially.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
            >
              {/* Card Image */}
              <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-800 shadow-sm">
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading leading-snug">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Advantage;

