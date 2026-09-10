import React, { useState } from 'react';
import { FaLocationDot, FaEnvelope, FaPhone, FaGraduationCap, FaClock } from 'react-icons/fa6';
import { FiChevronRight, FiSend, FiCheck, FiInfo } from 'react-icons/fi';
import rectangular from "../../../assets/images/rectangular_school_collage.png";
import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitInquiry } from '../../../services/inquiryService';
import { useSchoolSettings } from '../../../context/SchoolSettingsContext';

const Contact = () => {
  const { settings } = useSchoolSettings();

  const contactChannels = [
    {
      icon: <FaGraduationCap className="text-sky-400 text-xl" />,
      title: 'Admissions Office',
      desc: 'For new pupil enrollment, entrance assessment dates, fee structure & prospectus.',
      contact: settings?.admissions_phone || settings?.phone || '+234 814 435 3033',
      email: settings?.admissions_email || settings?.email || 'admissions@ghraschools.edu.ng',
    },
    {
      icon: <FaEnvelope className="text-blue-500 text-xl" />,
      title: 'General Inquiries',
      desc: 'For academic inquiries, student verification, general feedback & administration.',
      contact: settings?.phone || '+234 814 435 3033',
      email: settings?.email || 'info@ghraschools.edu.ng',
    },
    {
      icon: <FaClock className="text-emerald-500 text-xl" />,
      title: 'Campus Visiting Hours',
      desc: 'Administrative offices and admissions desk open during official school hours.',
      contact: settings?.visiting_hours || 'Mon – Fri: 7:30 AM – 4:00 PM',
      email: 'Closed on Public Holidays',
    },
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'Admissions & Enrollment',
    message: '',
    agreePrivacy: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please provide a valid email address.');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please write a brief message or question.');
      return;
    }
    if (!formData.agreePrivacy) {
      toast.error('Please accept the privacy terms to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        inquiry_type: formData.inquiryType,
        message: formData.message.trim(),
      });

      toast.success('Your message has been received! Our admissions team will contact you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiryType: 'Admissions & Enrollment',
        message: '',
        agreePrivacy: true,
      });
    } catch (err) {
      console.error('Inquiry submission error:', err);
      // apiFetch will already toast the error unless suppressed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-Dm-sans overflow-hidden">
      
      {/* Hero Banner with Breadcrumb */}
      <section
        className="relative min-h-[50vh] lg:min-h-[58vh] flex items-center justify-center bg-cover bg-center pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `url(${rectangular})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/65 via-[#0C1B33]/55 to-[#070F20]/80" />

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md mb-6">
            <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <FiChevronRight className="text-sky-400 text-xs" />
            <span className="text-sky-300">Contact & Campus Visit</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight"
          >
            Get in Touch with <br className="hidden sm:block" />
            <span className="text-sky-400">GHRA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-2xl mx-auto text-slate-200 text-sm sm:text-base leading-relaxed"
          >
            Whether you are inquiring about admissions, scheduling a private campus tour, or seeking academic guidance, our dedicated admissions team is ready to assist you.
          </motion.p>
        </div>
      </section>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        {/* Contact Department Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {contactChannels.map((chan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  {chan.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
                  {chan.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  {chan.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs sm:text-sm">
                <p className="font-bold text-slate-900">{chan.contact}</p>
                <p className="text-blue-600 font-medium">{chan.email}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 2-Column Section: Campus Address & Interactive Inquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Campus Physical Info (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
                <FaLocationDot className="text-blue-600 text-sm" />
                <span>Visit Our Campus</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-heading leading-tight">
                Our Campus Location & Directions
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Located in a serene, secure, and conducive educational environment in Osogbo, Osun State.
              </p>
            </div>

            {/* Address Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
                  <FaLocationDot className="text-xl" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-heading">Campus Address</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                    {settings?.address || 'Bolorunduro Area, Beside Tipper Association Office, Oba Road, Okinni, Osogbo, Osun State, Nigeria'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 shrink-0">
                  <FaPhone className="text-lg" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Hotline</h4>
                  <a href={`tel:${(settings?.phone || '+234 814 435 3033').replace(/\s+/g, '')}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition">
                    {settings?.phone || '+234 814 435 3033'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                  <FaEnvelope className="text-lg" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Email</h4>
                  <a href={`mailto:${settings?.email || 'info@ghraschools.edu.ng'}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition">
                    {settings?.email || 'info@ghraschools.edu.ng'}
                  </a>
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="p-5 rounded-2xl bg-blue-900 text-white flex items-start gap-3.5 shadow-lg">
              <FiInfo className="text-sky-400 text-xl shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <p className="font-bold font-heading">Scheduled Guided Tours</p>
                <p className="text-slate-300 mt-0.5">We welcome prospective parents for personalized classroom & lab walk-throughs Tuesdays & Thursdays from 10:00 AM.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl">
            <div className="mb-8">
              <h3 className="text-2xl font-extrabold font-heading text-slate-900">
                Send an Inquiry or Schedule a Tour
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Fill out the form below and our admissions team will respond within 24 business hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. / Mrs. Adewale Adebayo"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. adewale@example.com"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +234 803 123 4567"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nature of Inquiry *
                  </label>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="Admissions & Enrollment">Admissions & New Pupil Enrollment</option>
                    <option value="Campus Tour Booking">Book a Physical Campus Tour</option>
                    <option value="Fee Structure & Scholarships">Fee Structure & Scholarship Inquiries</option>
                    <option value="Curriculum & Academics">Curriculum & Cambridge Standards</option>
                    <option value="Careers / Employment">Careers / Teaching Vacancies</option>
                    <option value="General Support">General Support / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Message / Details of Inquiry *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Provide specific details regarding your child's age, desired entry class, or specific questions..."
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="agreePrivacy"
                  name="agreePrivacy"
                  checked={formData.agreePrivacy}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="agreePrivacy" className="text-xs text-slate-500 cursor-pointer select-none">
                  I agree to GHRA's privacy policy and consent to receiving school communication.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Sending inquiry...</span>
                ) : (
                  <>
                    <span>Submit Inquiry</span>
                    <FiSend />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;

