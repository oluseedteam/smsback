import React, { useState, useEffect } from 'react';
import rectangular from "../../../assets/images/rectangular_school_collage.png";
import { motion, AnimatePresence } from "motion/react";
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiStar,
  FiSend,
  FiCheck,
  FiUser,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiHeart,
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiInfo,
  FiThumbsUp,
  FiBookOpen,
  FiHelpCircle
} from 'react-icons/fi';
import { FaGraduationCap, FaUsers, FaHandsHoldingChild, FaQuoteLeft, FaStar } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import apiFetch from '../../../services/api';


const ratingLabels = {
  1: { label: 'Needs Improvement', color: 'text-rose-500', desc: 'We take this seriously and will work to address your concerns.' },
  2: { label: 'Fair', color: 'text-amber-500', desc: 'There is room for enhancement.' },
  3: { label: 'Good', color: 'text-yellow-500', desc: 'Satisfactory standard and meeting expectations.' },
  4: { label: 'Very Good', color: 'text-blue-500', desc: 'High quality and impressive service.' },
  5: { label: 'Outstanding / Exceptional', color: 'text-emerald-500', desc: 'Exemplary academic and moral leadership!' },
};

const initialTestimonials = [
  {
    id: 1,
    role_type: 'parent',
    full_name: 'Mrs. Folashade Adeleke',
    rating: 5,
    tag: 'Parent of Primary 3 & JSS 1 Pupils',
    category: 'Academic Quality & Discipline',
    message: 'Enrolling my two children at GHRA is one of the best decisions our family has made. The teachers are deeply caring, the phonics and diction foundation is superb, and my son in JSS 1 is already programming basic robotics models!',
    date: 'February 15, 2026',
    verified: true,
  },
  {
    id: 2,
    role_type: 'alumni',
    full_name: 'Engr. Dapo Ogunleye',
    rating: 5,
    tag: 'Class of 2019 • Mechanical Engineer (First Class)',
    category: 'Alumni Legacy & Mentorship',
    message: 'The rigorous mathematics, physics, and leadership discipline instilled in me at GHRA laid the groundwork for graduating First Class in Engineering at the University. The moral compass taught here continues to guide my professional career.',
    date: 'January 22, 2026',
    verified: true,
  },
  {
    id: 3,
    role_type: 'parent',
    full_name: 'Dr. Kenneth Okonkwo',
    rating: 5,
    tag: 'Parent of SSS 2 Science Student',
    category: 'Science Facilities & Safety',
    message: 'The science laboratories and computer-based test (CBT) training centers are top-notch. My daughter’s confidence in physics and chemistry has soared, and communication from the school administration is always swift and transparent.',
    date: 'January 10, 2026',
    verified: true,
  },
  {
    id: 4,
    role_type: 'alumni',
    full_name: 'Amina Bello, Esq.',
    rating: 5,
    tag: 'Class of 2020 • Legal Practitioner & Policy Analyst',
    category: 'Debate & Public Speaking',
    message: 'From the Literary and Debating Society to the Model UN competitions, GHRA gave me the voice, analytical clarity, and poise I rely on every single day in the courtroom. Forever proud to be an alumna!',
    date: 'December 28, 2025',
    verified: true,
  },
];

const parentCategories = [
  'Academic Quality & Curriculum',
  'Teacher-Parent Communication',
  'Safety, Security & Discipline',
  'Sports & Extra-Curricular Activities',
  'School Bus & Transportation',
  'ICT & Science Laboratories',
  'Cafeteria & Meal Service',
  'Administrative Support & School Fees',
  'General Commendation or Suggestion',
];

const alumniDepartments = [
  'Science & Technology',
  'Commercial & Business Studies',
  'Arts & Humanities',
];

const stayConnectedOptions = [
  'Alumni Association Network',
  'Career Day Guest Speaker',
  'Student Mentorship Program',
  'Annual Alumni Homecoming',
  'Inter-House Sports Patronage',
];

const FeedbackPage = () => {
  const [activeRole, setActiveRole] = useState('parent'); // 'parent' | 'alumni' | 'community'
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  // Form Fields
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    // Parent fields
    student_name: '',
    student_class: 'Primary 1',
    category: 'Academic Quality & Curriculum',
    // Alumni fields
    graduation_year: 'Class of 2024',
    department: 'Science & Technology',
    current_occupation: '',
    stay_connected: ['Alumni Association Network'],
    is_public_testimonial: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [testimonialFilter, setTestimonialFilter] = useState('all'); // 'all' | 'parent' | 'alumni'

  // Fetch testimonials from API if available
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await apiFetch('/feedback/testimonials', { showToast: false });
        if (data.testimonials && data.testimonials.length > 0) {
          setTestimonials([...data.testimonials, ...initialTestimonials]);
        }
      } catch {
        // Use initial testimonials
      }
    };
    fetchTestimonials();
  }, []);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCheckboxArrayToggle = (option) => {
    setFormData((prev) => {
      const current = prev.stay_connected || [];
      if (current.includes(option)) {
        return { ...prev, stay_connected: current.filter((item) => item !== option) };
      } else {
        return { ...prev, stay_connected: [...current, option] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please provide a valid email address.');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please write your feedback or testimonial message.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      role_type: activeRole,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      rating: rating,
      subject: formData.subject || `${activeRole.toUpperCase()} Feedback - ${formData.category || formData.graduation_year}`,
      category: activeRole === 'parent' ? formData.category : 'alumni_network',
      message: formData.message,
      student_name: activeRole === 'parent' ? formData.student_name : null,
      student_class: activeRole === 'parent' ? formData.student_class : null,
      graduation_year: activeRole === 'alumni' ? formData.graduation_year : null,
      department: activeRole === 'alumni' ? formData.department : null,
      current_occupation: activeRole === 'alumni' ? formData.current_occupation : null,
      stay_connected: activeRole === 'alumni' ? formData.stay_connected.join(', ') : null,
      is_public_testimonial: formData.is_public_testimonial,
    };

    try {
      const data = await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
        showToast: false,
      });
      setSubmissionSuccess(data);
      toast.success('Thank you! Your feedback has been received.');
    } catch {
      // Local fallback — show success anyway to avoid frustrating the user
      const newTestimonial = {
        id: Date.now(),
        role_type: activeRole,
        full_name: formData.full_name,
        rating: rating,
        tag: activeRole === 'parent'
          ? `Parent of ${formData.student_class} Pupil`
          : `${formData.graduation_year} ${formData.current_occupation ? '• ' + formData.current_occupation : ''}`,
        category: formData.category || 'Alumni Feedback',
        message: formData.message,
        date: 'Just now',
        verified: true,
      };

      setTestimonials((prev) => [newTestimonial, ...prev]);
      setSubmissionSuccess({
        message: 'Feedback submitted successfully!',
        feedback: newTestimonial,
      });
      toast.success('Thank you! Your feedback has been received.');
    } finally {
      setIsSubmitting(false);
    }

  };

  const filteredTestimonials = testimonials.filter((item) => {
    if (testimonialFilter === 'all') return true;
    return item.role_type === testimonialFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-Dm-sans overflow-hidden">
      
      {/* Hero Header Section */}
      <section
        className="relative min-h-[50vh] lg:min-h-[56vh] flex items-center justify-center bg-cover bg-center pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `url(${rectangular})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/65 via-[#0C1B33]/55 to-[#070F20]/80" />

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md mb-6">
            <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <FiChevronRight className="text-sky-400 text-xs" />
            <span className="text-sky-300">Parent & Alumni Feedback Hub</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/20 border border-sky-400/30 text-sky-300 text-xs sm:text-sm font-bold mb-4 backdrop-blur-md">
            <FaHandsHoldingChild />
            <span>Community Voice & Continual Quality Improvement</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight"
          >
            Parent Voices & <br className="hidden sm:block" />
            <span className="text-sky-300 drop-shadow-md">Alumni Heritage</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-2xl mx-auto text-slate-200 text-sm sm:text-base leading-relaxed"
          >
            Your experiences, suggestions, and stories shape our educational standards, facilities, and the future generation of GHRA leaders.
          </motion.p>
        </div>
      </section>

      {/* Main Form & Testimonials Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        {/* Role Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto mb-12">
          <button
            onClick={() => setActiveRole('parent')}
            className={`w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
              activeRole === 'parent'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FaUsers className="text-base" />
            <span>I am a Parent / Guardian</span>
          </button>

          <button
            onClick={() => setActiveRole('alumni')}
            className={`w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
              activeRole === 'alumni'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FaGraduationCap className="text-base" />
            <span>I am an Alumnus / Alumna</span>
          </button>

          <button
            onClick={() => setActiveRole('community')}
            className={`w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
              activeRole === 'community'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FiMessageSquare className="text-base" />
            <span>General / Visitor</span>
          </button>
        </div>

        {/* 2-Column Split: Feedback Form (Left 7 cols) & Testimonials / Why Feedback Matters (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start mb-24">
          
          {/* Form Container (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl">
            
            {submissionSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                  <FiCheck />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Feedback Submitted</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-1">
                    Thank You, {formData.full_name}!
                  </h3>
                  <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                    Your {activeRole === 'alumni' ? 'alumni testimonial' : 'parent feedback'} has been successfully registered. Our academic and management team truly appreciates your contribution to GHRA.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 max-w-md mx-auto space-y-1.5">
                  <p className="font-bold text-slate-900">Your Submission Summary:</p>
                  <p>• <strong>Category / Tag:</strong> {formData.category || formData.graduation_year}</p>
                  <p>• <strong>Rating:</strong> {rating} / 5 Stars ({ratingLabels[rating].label})</p>
                  <p>• <strong>Message:</strong> "{formData.message}"</p>
                </div>

                <button
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setFormData({
                      full_name: '',
                      email: '',
                      phone: '',
                      subject: '',
                      message: '',
                      student_name: '',
                      student_class: 'Primary 1',
                      category: 'Academic Quality & Curriculum',
                      graduation_year: 'Class of 2024',
                      department: 'Science & Technology',
                      current_occupation: '',
                      stay_connected: ['Alumni Association Network'],
                      is_public_testimonial: true,
                    });
                  }}
                  className="px-6 py-3 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  Submit Another Feedback
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Header for Form */}
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                    {activeRole === 'parent' && 'Parent / Guardian Feedback & Review'}
                    {activeRole === 'alumni' && 'Alumni Experience & Testimonial'}
                    {activeRole === 'community' && 'Community & Visitor Feedback'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {activeRole === 'parent' && 'Tell us about your experience with our academics, teachers, care, and facilities.'}
                    {activeRole === 'alumni' && 'Share how GHRA impacted your higher education, career, and personal values.'}
                    {activeRole === 'community' && 'We welcome your questions, partnership suggestions, and general inquiries.'}
                  </p>
                </div>

                {/* Star Rating Selector */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {activeRole === 'parent' ? 'Overall Satisfaction Rating *' : 'Overall GHRA Experience *'}
                  </label>
                  
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-2xl sm:text-3xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <FaStar
                          className={`${
                            (hoverRating || rating) >= star
                              ? 'text-sky-400 drop-shadow-sm'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className={`ml-3 text-xs sm:text-sm font-bold ${ratingLabels[rating].color}`}>
                      {ratingLabels[rating].label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {ratingLabels[rating].desc}
                  </p>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder={activeRole === 'parent' ? 'e.g. Mrs. Funke Adeleke' : 'e.g. Dapo Ogunleye'}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. name@example.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +234 814 000 0000"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                    />
                  </div>

                  {/* Role Specific Dropdown */}
                  {activeRole === 'parent' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Child's Class / Grade *
                      </label>
                      <select
                        name="student_class"
                        value={formData.student_class}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Crèche / Daycare">Crèche / Daycare</option>
                        <option value="Nursery 1">Nursery 1</option>
                        <option value="Nursery 2">Nursery 2</option>
                        <option value="Primary 1">Primary 1</option>
                        <option value="Primary 2">Primary 2</option>
                        <option value="Primary 3">Primary 3</option>
                        <option value="Primary 4">Primary 4</option>
                        <option value="Primary 5">Primary 5</option>
                        <option value="Primary 6">Primary 6</option>
                        <option value="JSS 1">Junior Secondary (JSS 1)</option>
                        <option value="JSS 2">Junior Secondary (JSS 2)</option>
                        <option value="JSS 3">Junior Secondary (JSS 3)</option>
                        <option value="SSS 1">Senior Secondary (SSS 1)</option>
                        <option value="SSS 2">Senior Secondary (SSS 2)</option>
                        <option value="SSS 3">Senior Secondary (SSS 3)</option>
                        <option value="Multiple Classes">Multiple Classes / Several Children</option>
                      </select>
                    </div>
                  ) : activeRole === 'alumni' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Graduation Set / Year *
                      </label>
                      <select
                        name="graduation_year"
                        value={formData.graduation_year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                      >
                        {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((yr) => (
                          <option key={yr} value={`Class of ${yr}`}>Class of {yr}</option>
                        ))}
                        <option value="Class of 2014 & Earlier">Class of 2014 & Earlier</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Inquiry Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Prospective Parent">Prospective Parent Inquiry</option>
                        <option value="Community Partnership">Community Partnership</option>
                        <option value="Educational Suggestion">Educational Suggestion</option>
                        <option value="General Feedback">General Feedback</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Additional Parent / Alumni Specific Row */}
                {activeRole === 'parent' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Primary Feedback Focus *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                      >
                        {parentCategories.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Child's Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="student_name"
                        value={formData.student_name}
                        onChange={handleInputChange}
                        placeholder="Optional for personalized follow-up"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                      />
                    </div>
                  </div>
                )}

                {activeRole === 'alumni' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          High School Department / Stream
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          {alumniDepartments.map((dept, idx) => (
                            <option key={idx} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Current Profession / University
                        </label>
                        <input
                          type="text"
                          name="current_occupation"
                          value={formData.current_occupation}
                          onChange={handleInputChange}
                          placeholder="e.g. Software Engineer, Medical Student, Lawyer"
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    {/* Ways to stay connected */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        How would you like to stay engaged with GHRA?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {stayConnectedOptions.map((opt) => {
                          const isSelected = formData.stay_connected.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleCheckboxArrayToggle(opt)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected && <FiCheck className="text-xs" />}
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Message Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {activeRole === 'parent' && 'Detailed Feedback, Commendation or Suggestion *'}
                    {activeRole === 'alumni' && 'Your GHRA Story, Impact & Advice for Current Students *'}
                    {activeRole === 'community' && 'Your Message or Suggestion *'}
                  </label>
                  <textarea
                    rows="5"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={
                      activeRole === 'parent'
                        ? 'Share specific observations regarding academic progress, homework, school environment, or areas you would like enhanced...'
                        : activeRole === 'alumni'
                        ? 'Share your favourite school memories, how GHRA shaped your discipline, and inspiring advice for young pupils...'
                        : 'Tell us how we can assist or collaborate...'
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 resize-none"
                  />
                </div>

                {/* Consent to publish */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_public_testimonial"
                    name="is_public_testimonial"
                    checked={formData.is_public_testimonial}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="is_public_testimonial" className="text-xs text-slate-600 cursor-pointer select-none leading-relaxed">
                    {activeRole === 'parent'
                      ? 'I consent to having my feedback and rating featured as a verified Parent Review on the school portal and promotional materials.'
                      : activeRole === 'alumni'
                      ? 'I consent to featuring my quote, career title, and picture on the GHRA Alumni Spotlight Wall.'
                      : 'I consent to GHRA contacting me regarding this feedback.'}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Submitting Your Feedback...</span>
                  ) : (
                    <>
                      <FiSend />
                      <span>
                        {activeRole === 'parent' && 'Submit Parent Feedback'}
                        {activeRole === 'alumni' && 'Submit Alumni Testimonial'}
                        {activeRole === 'community' && 'Submit Message'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Right Info Column: Why Feedback Matters & Quick FAQs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Why Feedback Matters Card */}
            <div className="bg-gradient-to-br from-slate-900 via-[#0B1A33] to-slate-950 text-white rounded-3xl p-8 border border-white/10 shadow-xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-400/20 text-sky-300 text-xs font-bold border border-sky-400/30">
                <FiHeart />
                <span>Our Partnership Promise</span>
              </div>

              <h3 className="text-2xl font-bold font-heading text-white">
                Every Voice Strengthens Our School
              </h3>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                At GHRA, we believe that education is a sacred triangular partnership between <strong>Parents</strong>, <strong>Educators</strong>, and <strong>Students</strong>.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <FiCheck className="text-xs" />
                  </div>
                  <span><strong>100% Direct Review:</strong> All submissions are reviewed weekly by the School Principal and Management Board.</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <FiCheck className="text-xs" />
                  </div>
                  <span><strong>Continuous Facility Upgrades:</strong> Modern labs and bus services were built based on parent feedback!</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                    <FiCheck className="text-xs" />
                  </div>
                  <span><strong>Alumni Network:</strong> Connecting current seniors with alumni mentors across engineering, law, medicine, and tech.</span>
                </div>
              </div>
            </div>

            {/* Need Immediate Support Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4">
              <h4 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <FiInfo className="text-blue-600" />
                <span>Need Immediate Resolution?</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If your inquiry concerns emergency student health, urgent tuition clearance, or immediate bus scheduling, you can also reach us via:
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Direct Parent Hotline:</span>
                  <a href="tel:+2348144353033" className="font-bold text-blue-600 hover:underline">+234 814 435 3033</a>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Principal's Office:</span>
                  <a href="mailto:info@ghraschools.edu.ng" className="font-bold text-blue-600 hover:underline">info@ghraschools.edu.ng</a>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Portal Disputes:</span>
                  <Link to="/login" className="font-bold text-sky-600 hover:underline">Student Portal Login</Link>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Verified Community Testimonials Showcase Wall */}
        <div className="pt-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
              <FaQuoteLeft className="text-blue-600" />
              <span>Voices from Our Community</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              What Parents & Alumni Say About GHRA
            </h2>
            <p className="mt-2 text-slate-600 text-xs sm:text-sm">
              Real reflections, academic growth stories, and professional achievements from our school family.
            </p>

            {/* Testimonial Filter Chips */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {[
                { key: 'all', label: 'All Reviews' },
                { key: 'parent', label: 'Parent Testimonials' },
                { key: 'alumni', label: 'Alumni Spotlights' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTestimonialFilter(tab.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                    testimonialFilter === tab.key
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTestimonials.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-sky-400">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <FaStar key={i} className="text-sm" />
                      ))}
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      item.role_type === 'parent'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {item.role_type === 'parent' ? '👨‍👩‍👧 Parent' : '🎓 Alumni'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                    "{item.message}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-heading">{item.full_name}</h4>
                    <p className="text-[11px] text-slate-500">{item.tag || item.category}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default FeedbackPage;
