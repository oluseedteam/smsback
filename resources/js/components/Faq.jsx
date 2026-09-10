import React, { useState } from 'react';
import { FiChevronDown, FiHelpCircle, FiArrowRight, FiPhone } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';
import { motion, AnimatePresence } from "motion/react";
import { Link } from 'react-router-dom';

const faqCategories = [
  { key: 'all', label: 'All FAQs' },
  { key: 'admissions', label: 'Admissions & Enrollment' },
  { key: 'academics', label: 'Curriculum & Exams' },
  { key: 'welfare', label: 'Transport & Campus Care' },
];

const faqs = [
  {
    category: 'academics',
    question: "What curriculum does GHRA follow?",
    answer:
      "We operate an enriched dual curriculum blending the Nigerian National Curriculum (NERDC) with the British / Cambridge International standard. This prepares our students seamlessly for both local entrance (WAEC, NECO, JAMB) and global examinations (IGCSE, SAT).",
  },
  {
    category: 'admissions',
    question: "How do I apply for admission for the current session?",
    answer:
      "You can submit an online inquiry through our Admissions page, or visit our Admissions Office on campus to pick up an application pack. Following application submission, candidates are scheduled for an age-appropriate diagnostic assessment.",
  },
  {
    category: 'admissions',
    question: "What age criteria applies for Early Years & Primary enrollment?",
    answer:
      "For Crèche, infants are accepted from 3 months old. Nursery pupils should be between 2 to 5 years old. For Primary 1, pupils must be at least 5 years old by September of the academic year of entry.",
  },
  {
    category: 'academics',
    question: "What co-curricular and leadership activities are offered?",
    answer:
      "We offer an extensive range of over 25 clubs including Robotics & Coding, Press & Public Speaking, STEM Olympiad Club, Music & Orchestra, Chess & Scrabble Club, Red Cross Society, Taekwondo, and competitive Inter-House Sports.",
  },
  {
    category: 'welfare',
    question: "Does the school provide safe daily bus transportation?",
    answer:
      "Yes, GHRA maintains a fleet of modern, air-conditioned school buses with designated pick-up and drop-off routes supervised by certified drivers and bus minders.",
  },
  {
    category: 'welfare',
    question: "What medical and health facilities are available on campus?",
    answer:
      "Our campus features a fully equipped Sick Bay staffed by registered healthcare nurses during all school hours. We maintain student medical files and immediate emergency response protocols with partner referral hospitals.",
  },
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Top badge & heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <FiHelpCircle className="text-blue-600 text-sm" />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
            Frequently Asked <span className="text-blue-600">Questions</span>
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Find immediate answers regarding our admissions process, curriculum benchmarks, school policies, and campus life.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-10 hide-scrollbar">
          {faqCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key);
                setOpenIndex(0);
              }}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Layout: Sidebar + FAQ Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Direct Support Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-5">
                💬
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading">
                Need more information?
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                Our admissions counselors are available Monday through Friday to answer your specific questions or guide you through campus visits.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <a
                  href="tel:+2348144353033"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-600 transition group text-sm font-bold"
                >
                  <FiPhone className="text-blue-600 text-lg shrink-0" />
                  <span>+234 814 435 3033</span>
                </a>

                <Link
                  to="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md transition"
                >
                  <span>Contact Admissions</span>
                  <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl sm:rounded-3xl border bg-white transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-blue-300 shadow-md ring-2 ring-blue-500/10'
                      : 'border-slate-200/80 hover:border-blue-200 shadow-xs'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <span className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className={`text-sm sm:text-base font-bold font-heading transition-colors ${
                        isOpen ? 'text-blue-600' : 'text-slate-900'
                      }`}>
                        {faq.question}
                      </h4>
                    </div>

                    <span className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${
                      isOpen ? 'bg-blue-50 text-blue-600 rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <FiChevronDown className="text-base" />
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 mt-1">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};

export default Faq;

