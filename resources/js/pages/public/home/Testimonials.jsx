import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FaQuoteLeft, FaStar } from 'react-icons/fa6';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const testimonials = [
  {
    id: 1,
    name: 'Mrs. Folashade Adeleke',
    role: 'Parent of Grade 5 & JSS 2 Students',
    quote:
      'Enrolling our two children at GHRA has been our best parenting decision. The balance between academic discipline and moral grounding is truly exceptional. Their confidence and diction improved tremendously within a single term!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    stars: 5,
  },
  {
    id: 2,
    name: 'Engr. Babatunde Oladipo',
    role: 'Parent of SSS 3 Graduate (Now University Scholar)',
    quote:
      'The STEM facilities, coding classes, and intensive exam preparation gave my son an edge in his WAEC and SAT exams. The teachers don’t just teach; they actively mentor and follow up on each child’s individual learning curve.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    stars: 5,
  },
  {
    id: 3,
    name: 'Dr. (Mrs.) Chioma Okonkwo',
    role: 'Parent of Nursery 2 & Primary 3 Students',
    quote:
      'The early childhood care and security on campus give me complete peace of mind while at work. The school’s digital communication portal also keeps us updated on daily attendance, homework, and termly health reviews seamlessly.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    stars: 5,
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[activeIndex];

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute -top-24 left-1/4 w-[600px] h-[300px] rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-[400px] h-[250px] rounded-full bg-sky-400/10 blur-3xl" />

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-3">
            <FaStar className="text-sky-400 text-xs" />
            <span>Parent & Community Voices</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight leading-tight">
            Trusted by Parents, <br className="hidden sm:block" />
            <span className="text-blue-400">Loved by Students</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            Read real stories and experiences from families who have chosen GHRA for their children’s educational journey.
          </p>
        </div>

        {/* Featured Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-white/10 rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl backdrop-blur-xl relative"
          >
            <FaQuoteLeft className="text-blue-500/20 text-5xl sm:text-7xl absolute top-6 right-8 pointer-events-none" />

            {/* Stars */}
            <div className="flex items-center gap-1.5 mb-6 text-sky-400">
              {[...Array(current.stars)].map((_, i) => (
                <FaStar key={i} className="text-base" />
              ))}
            </div>

            {/* Quote text */}
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed italic">
              "{current.quote}"
            </p>

            {/* Author Profile */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={current.avatar}
                  alt={current.name}
                  className="h-14 w-14 rounded-2xl object-cover border-2 border-sky-400/40 shadow-md"
                />
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white font-heading">
                    {current.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {current.role}
                  </p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevTestimonial}
                  className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-blue-600 text-white transition cursor-pointer"
                  aria-label="Previous testimonial"
                >
                  <FiChevronLeft className="text-lg" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-blue-600 text-white transition cursor-pointer"
                  aria-label="Next testimonial"
                >
                  <FiChevronRight className="text-lg" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === idx ? 'w-8 bg-sky-400' : 'w-2.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
