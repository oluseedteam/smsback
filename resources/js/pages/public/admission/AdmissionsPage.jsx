import React, { useState } from 'react';
import rectangular from "../../../assets/images/rectangular_school_collage.png";
import image_1 from "../../../assets/images/advantage_1.png";
import image_2 from "../../../assets/images/advantage_2.png";
import image_3 from "../../../assets/images/advantage_3.png";
import image_4 from "../../../assets/images/advantage_4.png";
import { motion, AnimatePresence } from "motion/react";
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFileText,
  FiCalendar,
  FiCheckSquare,
  FiAward,
  FiDownload,
  FiSearch,
  FiCheck,
  FiArrowRight,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiInfo,
  FiCopy,
  FiShield
} from 'react-icons/fi';
import { FaGraduationCap, FaSchool, FaBookOpen, FaUsers, FaPercent, FaChildReaching } from 'react-icons/fa6';
import { submitApplication, checkApplicationStatus } from '../../../services/admissionService';
import toast from 'react-hot-toast';

const academicDivisions = [
  {
    level: "Crèche & Early Years",
    ages: "Ages 3 months – 2 years",
    tag: "Foundation",
    desc: "A warm, nurturing, and safe sensory-rich environment providing personalized care, cognitive stimulation, and early motor skill development.",
    features: ["Dedicated Caregivers", "Sensory Play Zone", "CCTV Monitored", "Nutritious Meal Plans"],
    image: image_1,
  },
  {
    level: "Nursery School",
    ages: "Ages 2 – 5 years (Nursery 1 – 2)",
    tag: "Early Childhood",
    desc: "Blending Montessori principles with early literacy, phonics, numeracy, creative arts, and foundational socialization skills.",
    features: ["Jolly Phonics & Reading", "Early STEM Play", "Creative Arts & Music", "Character & Etiquette"],
    image: image_2,
  },
  {
    level: "Primary School",
    ages: "Ages 5 – 11 years (Grades 1 – 6)",
    tag: "Core Elementary",
    desc: "Rigorous holistic education developing analytical thinkers, eloquent speakers, and ethical young leaders with strong STEM and language foundations.",
    features: ["Dual Curriculum Integration", "Robotics & Coding", "French & Diction Labs", "Sports & Swimming"],
    image: image_3,
  },
  {
    level: "Secondary School",
    ages: "Ages 11 – 17 years (JSS 1 – SSS 3)",
    tag: "Junior & Senior Secondary",
    desc: "Comprehensive college-preparatory academics across Science, Commercial, and Arts pathways, preparing students for WASSCE, NECO, JAMB, and global university admissions.",
    features: ["Science & ICT Laboratories", "JAMB / CBT Training Center", "Leadership Mentorship", "Career Advisory"],
    image: image_4,
  },
];

const admissionSteps = [
  {
    step: "01",
    title: "Application Submission",
    desc: "Complete our seamless online application form below or obtain a registration package at the school admissions office.",
    badge: "Step 1",
  },
  {
    step: "02",
    title: "Diagnostic Assessment",
    desc: "Candidates participate in an age-appropriate cognitive and academic screening in English, Mathematics, and General Aptitude.",
    badge: "Step 2",
  },
  {
    step: "03",
    title: "Family Interactive Session",
    desc: "A brief, welcoming meeting with the School Principal and Section Heads to align on your child’s learning journey and school values.",
    badge: "Step 3",
  },
  {
    step: "04",
    title: "Offer & Orientation",
    desc: "Successful candidates receive a formal Offer Letter, complete enrollment fee payment, and receive welcome kits and uniforms.",
    badge: "Final Step",
  },
];

const checklistItems = [
  "Completed Online or Physical Admission Application Form",
  "Photocopy of Child's Official Birth Certificate or National ID Slip",
  "Previous Two (2) Academic Terms Report Cards / Transcripts (Primary & Secondary applicants)",
  "Four (4) Recent Passport-Sized Photographs (white background)",
  "Comprehensive Child Immunization / Medical Fitness Report",
  "Official Letter of Transfer / Recommendation from previous institution (if applicable)",
];

const faqs = [
  {
    q: "When are entrance assessments conducted?",
    a: "Entrance assessments for the main 2025/2026 academic session are held in batches every second and fourth Saturday of each month from February through August. Mid-term transfer assessments can be scheduled on weekdays upon request.",
  },
  {
    q: "Does GHRA offer school bus transportation?",
    a: "Yes. We operate safe, air-conditioned, and GPS-tracked school buses covering major routes across Osogbo, Okinni, and neighbouring residential areas with trained chaperones on board every trip.",
  },
  {
    q: "What curriculum does GHRA follow?",
    a: "We operate a rich blended curriculum combining the Nigerian National Basic Education Curriculum with Cambridge International standards, ensuring high performance in WASSCE, NECO, UTME, and international certifications.",
  },
  {
    q: "Are sibling discounts available for families with multiple children?",
    a: "Yes! GHRA provides a 5% tuition rebate for the second child and a 10% tuition rebate for third and subsequent siblings enrolled simultaneously.",
  },
  {
    q: "Can I transfer my child mid-term or mid-session?",
    a: "Yes, mid-term transfers are welcomed subject to space availability in the requested class and satisfactory completion of our placement diagnostic assessment.",
  },
];

const AdmissionsPage = () => {
  // Application Form State
  const [appType, setAppType] = useState('student');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: 'Male',
    date_of_birth: '',
    address: '',
    target_class: 'Primary 1',
    department: 'Science',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    previous_school: '',
    last_grade_completed: '',
    subject_specialization: '',
    qualification: '',
    experience_years: '1-3 years',
    cover_letter: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Status Tracker State
  const [trackIdentifier, setTrackIdentifier] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedApp, setTrackedApp] = useState(null);
  const [trackError, setTrackError] = useState('');

  // Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('Please enter the applicant’s full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please provide a valid applicant or parent email.');
      return;
    }
    if (appType === 'student' && !formData.parent_name.trim()) {
      toast.error('Please provide parent/guardian name.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      type: appType,
      ...formData,
    };

    try {
      if (typeof submitApplication === 'function') {
        const res = await submitApplication(payload);
        setSubmissionSuccess(res);
        toast.success('Application submitted successfully!');
      } else {
        throw new Error('Service unavailable');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit application. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackIdentifier.trim()) {
      toast.error('Please enter an application reference number or email.');
      return;
    }

    setIsTracking(true);
    setTrackError('');
    setTrackedApp(null);

    try {
      if (typeof checkApplicationStatus === 'function') {
        const data = await checkApplicationStatus(trackIdentifier.trim());
        if (data.application) {
          setTrackedApp(data.application);
          toast.success('Application record retrieved!');
        } else {
          throw new Error('Not found');
        }
      } else {
        throw new Error('Service fallback');
      }
    } catch {
      const savedApps = JSON.parse(localStorage.getItem('ghra_applications') || '[]');
      const match = savedApps.find(
        (a) =>
          a.application_number?.toLowerCase() === trackIdentifier.trim().toLowerCase() ||
          a.email?.toLowerCase() === trackIdentifier.trim().toLowerCase()
      );

      if (match) {
        setTrackedApp(match);
        toast.success('Application record retrieved!');
      } else {
        setTrackError(`No application record found for "${trackIdentifier}". Please verify your reference number or contact admissions.`);
        toast.error('Application not found.');
      }
    } finally {
      setIsTracking(false);
    }
  };

  const copyRefToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Application Reference Number copied!');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-Dm-sans overflow-hidden">
      
      {/* Hero Banner Section */}
      <section
        className="relative min-h-[55vh] lg:min-h-[62vh] flex items-center justify-center bg-cover bg-center pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `url(${rectangular})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/65 via-[#0C1B33]/55 to-[#070F20]/80" />

        <div className="relative z-10 max-w-5xl mx-auto text-center text-white flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md mb-6">
            <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <FiChevronRight className="text-sky-400 text-xs" />
            <span className="text-sky-300">Admissions & Enrollment</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-bold mb-4 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>2025/2026 Academic Session Enrollment Now Open</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight"
          >
            Invest in Exceptional <br className="hidden sm:block" />
            <span className="text-sky-300 drop-shadow-md">Academic & Moral Excellence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-3xl mx-auto text-slate-200 text-sm sm:text-base md:text-lg leading-relaxed"
          >
            Join a thriving educational community dedicated to nurturing disciplined leaders, innovative critical thinkers, and future global achievers.
          </motion.p>

          {/* Quick Jump Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="#apply-section"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-full shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <FiFileText />
              <span>Apply Online Now</span>
            </a>

            <a
              href="#track-section"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-full border border-white/20 backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
            >
              <FiSearch />
              <span>Track Application Status</span>
            </a>

            <a
              href="#checklist-section"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-full border border-white/20 backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
            >
              <FiCheckSquare />
              <span>Requirements Checklist</span>
            </a>
          </div>
        </div>
      </section>

      {/* Key Highlights Metrics Bar */}
      <section className="bg-slate-900 border-y border-white/10 py-8 px-4 sm:px-6 lg:px-8 text-white relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <div className="text-2xl sm:text-4xl font-extrabold text-sky-400 font-heading">100%</div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">Exam Pass Distinction Rate</div>
          </div>
          <div className="p-3 border-l border-white/10">
            <div className="text-2xl sm:text-4xl font-extrabold text-blue-400 font-heading">15:1</div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">Student-Teacher Class Ratio</div>
          </div>
          <div className="p-3 border-l-0 md:border-l border-white/10">
            <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400 font-heading">100+</div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">University Placements & Scholarships</div>
          </div>
          <div className="p-3 border-l border-white/10">
            <div className="text-2xl sm:text-4xl font-extrabold text-purple-400 font-heading">STEM & ICT</div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">Modern Laboratories & CBT Hub</div>
          </div>
        </div>
      </section>

      {/* Academic Divisions Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <FaSchool className="text-blue-600" />
            <span>Academic Pathways</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight">
            Comprehensive Education for Every Stage
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            From foundational early childhood sensory discovery to rigorous secondary college-preparatory curricula.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {academicDivisions.map((div, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row group"
            >
              <div className="sm:w-2/5 relative h-48 sm:h-auto overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={div.image}
                  alt={div.level}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-sky-300 text-[11px] font-bold">
                  {div.tag}
                </span>
              </div>

              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
                    {div.ages}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 font-heading mt-1 mb-2">
                    {div.level}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {div.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {div.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <FiCheck className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href="#apply-section"
                  onClick={() => {
                    setAppType('student');
                    setFormData((prev) => ({ ...prev, target_class: div.level }));
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 pt-3 border-t border-slate-100 group-hover:gap-2.5 transition-all"
                >
                  <span>Apply for this Section</span>
                  <FiArrowRight />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4-Step Admission Journey */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#0A192F] via-[#0D2247] to-[#08152B] text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-sky-300 text-xs font-semibold mb-3">
              <FaGraduationCap />
              <span>Step-by-Step Guide</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white">
              The 4-Step Admission Process
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              A transparent, supportive, and straightforward path to enrolling your child at GHRA.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {admissionSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 border border-blue-400/30">
                      {step.badge}
                    </span>
                    <span className="text-3xl font-black text-white/30 group-hover:text-sky-400 transition font-heading">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-heading mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admission Checklist & Requirements */}
      <section id="checklist-section" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <FiCheckSquare className="text-emerald-600" />
              <span>Required Documents</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              Admissions Checklist & Entry Criteria
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              To ensure a swift verification and enrollment process, prospective parents are advised to assemble the following documentation prior to the entrance evaluation:
            </p>

            <div className="space-y-3.5 pt-2">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
                >
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <FiCheck className="text-sm font-bold" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Card: Tuition & Fees Policy */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/20 text-sky-300 text-xs font-bold border border-sky-400/30">
              <FiAward />
              <span>Transparent Tuition & Support</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Affordable Excellence & Payment Flexibility
            </h3>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              We believe high-standard education should be transparent and structured. Our termly tuition covers full classroom instruction, laboratory access, ICT facilities, digital library, and sports training.
            </p>

            <div className="space-y-3 border-t border-white/10 pt-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-300">Flexible Installment Plan</span>
                <span className="text-emerald-400 font-bold">Available on Request</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-300">Sibling Discount (2nd & 3rd Child)</span>
                <span className="text-sky-400 font-bold">5% – 10% Off</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-300">Academic Merit Scholarships</span>
                <span className="text-blue-400 font-bold">Available for Top Candidates</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="mailto:admissions@ghraschools.edu.ng?subject=Request%20Fee%20Schedule"
                className="w-full inline-flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg transition"
              >
                <FiDownload />
                <span>Request Official Fee Schedule</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Application Form Section */}
      <section id="apply-section" className="py-16 lg:py-24 bg-slate-100 border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold mb-3 shadow-md shadow-blue-600/30">
              <FiFileText />
              <span>Online Portal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              Submit Your Online Application
            </h2>
            <p className="mt-2 text-slate-600 text-xs sm:text-sm">
              Please complete all required fields. You will receive an immediate application tracking number upon submission.
            </p>
          </div>

          {/* Success Receipt State */}
          {submissionSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 shadow-xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                <FiCheck />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Application Received</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-1">
                  Congratulations, {submissionSuccess.application?.full_name}!
                </h3>
                <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
                  Your admission application for <strong>{submissionSuccess.application?.target_class || 'GHRA'}</strong> has been registered in our academic database.
                </p>
              </div>

              {/* Reference Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Application Reference ID</span>
                  <div className="text-xl sm:text-2xl font-black text-blue-600 font-heading tracking-wider">
                    {submissionSuccess.application_number}
                  </div>
                </div>
                <button
                  onClick={() => copyRefToClipboard(submissionSuccess.application_number)}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FiCopy />
                  <span>Copy</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs text-left max-w-lg mx-auto space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <FiInfo />
                  <span>Next Steps:</span>
                </p>
                <p>1. Keep your reference number safe to track your review progress.</p>
                <p>2. Our admissions desk will contact you via email & phone to confirm assessment scheduling.</p>
                <p>3. Bring required physical documents on your evaluation date.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setFormData({
                      full_name: '',
                      email: '',
                      phone: '',
                      gender: 'Male',
                      date_of_birth: '',
                      address: '',
                      target_class: 'Primary 1',
                      department: 'Science',
                      parent_name: '',
                      parent_phone: '',
                      parent_email: '',
                      previous_school: '',
                      last_grade_completed: '',
                      subject_specialization: '',
                      qualification: '',
                      experience_years: '1-3 years',
                      cover_letter: '',
                    });
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Submit Another Application
                </button>
                <a
                  href="#track-section"
                  onClick={() => setTrackIdentifier(submissionSuccess.application_number)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Go to Status Tracker
                </a>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl">
              
              {/* Type Switcher */}
              <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-8 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setAppType('student')}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    appType === 'student'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student Admission
                </button>
                <button
                  type="button"
                  onClick={() => setAppType('teacher')}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    appType === 'teacher'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Teaching Faculty Career
                </button>
              </div>

              <form onSubmit={handleApplicationSubmit} className="space-y-6">
                
                {/* Section 1: Candidate Basic Information */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    <span>{appType === 'student' ? 'Student Personal Details' : 'Applicant Personal Details'}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={formData.full_name}
                        onChange={handleFormChange}
                        placeholder="e.g. Oluwaseun Adeleke"
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
                        onChange={handleFormChange}
                        placeholder="e.g. adeleke@example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="e.g. +234 814 000 0000"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      placeholder="e.g. Bolorunduro Area, Osogbo, Osun State"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Section 2: Student Academic Info OR Teacher Info */}
                {appType === 'student' ? (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <FaBookOpen className="text-blue-600" />
                      <span>Target Enrollment & Academic History</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Target Entry Class / Level *
                        </label>
                        <select
                          name="target_class"
                          value={formData.target_class}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          <option value="Crèche / Daycare">Crèche / Daycare (3mo - 2yr)</option>
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
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Department (For Secondary SSS)
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          <option value="Science">Science & Technology</option>
                          <option value="Commercial">Commercial & Business</option>
                          <option value="Arts">Arts & Humanities</option>
                          <option value="General">General (Junior / Primary)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Previous School Attended
                        </label>
                        <input
                          type="text"
                          name="previous_school"
                          value={formData.previous_school}
                          onChange={handleFormChange}
                          placeholder="e.g. St. Claire International Academy"
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Last Class Completed
                        </label>
                        <input
                          type="text"
                          name="last_grade_completed"
                          value={formData.last_grade_completed}
                          onChange={handleFormChange}
                          placeholder="e.g. Primary 5"
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    {/* Parent Details */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                        <FaUsers className="text-sky-500" />
                        <span>Parent / Guardian Information</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Parent Full Name *
                          </label>
                          <input
                            type="text"
                            name="parent_name"
                            required
                            value={formData.parent_name}
                            onChange={handleFormChange}
                            placeholder="e.g. Dr. & Mrs. Adeleke"
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Parent Phone *
                          </label>
                          <input
                            type="tel"
                            name="parent_phone"
                            required
                            value={formData.parent_phone}
                            onChange={handleFormChange}
                            placeholder="e.g. +234 803 000 0000"
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Parent Email
                          </label>
                          <input
                            type="email"
                            name="parent_email"
                            value={formData.parent_email}
                            onChange={handleFormChange}
                            placeholder="e.g. parent@example.com"
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <FaGraduationCap className="text-blue-600" />
                      <span>Academic Qualifications & Experience</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Teaching Subject Specialization *
                        </label>
                        <input
                          type="text"
                          name="subject_specialization"
                          required
                          value={formData.subject_specialization}
                          onChange={handleFormChange}
                          placeholder="e.g. Mathematics & Physics"
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Highest Qualification *
                        </label>
                        <input
                          type="text"
                          name="qualification"
                          required
                          value={formData.qualification}
                          onChange={handleFormChange}
                          placeholder="e.g. B.Ed, B.Sc, PGDE, M.Sc"
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Teaching Experience
                        </label>
                        <select
                          name="experience_years"
                          value={formData.experience_years}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          <option value="1-3 years">1 – 3 Years</option>
                          <option value="4-7 years">4 – 7 Years</option>
                          <option value="8+ years">8+ Years</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Brief Cover Statement / Teaching Philosophy
                      </label>
                      <textarea
                        rows="3"
                        name="cover_letter"
                        value={formData.cover_letter}
                        onChange={handleFormChange}
                        placeholder="Tell us about your pedagogical approach and why you want to teach at GHRA..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </section>

      {/* Application Status Tracker Section */}
      <section id="track-section" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl">
          
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-3">
              <FiSearch className="text-sky-600" />
              <span>Real-Time Status</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Track Your Admission Application
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Enter your Application Reference Number (e.g. <code>ADM-2025-XXXXX</code>) or registered email address.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-8">
            <input
              type="text"
              value={trackIdentifier}
              onChange={(e) => setTrackIdentifier(e.target.value)}
              placeholder="e.g. ADM-2025-78A3F or name@email.com"
              className="flex-1 px-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50 uppercase"
            />
            <button
              type="submit"
              disabled={isTracking}
              className="px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
            >
              {isTracking ? <span className="animate-spin">⏳</span> : <FiSearch />}
              <span>Track Status</span>
            </button>
          </form>

          {/* Track Error */}
          {trackError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm text-center max-w-lg mx-auto mb-6">
              {trackError}
            </div>
          )}

          {/* Track Result Display */}
          {trackedApp && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Candidate</span>
                  <h4 className="text-lg font-bold text-slate-900 font-heading">{trackedApp.full_name}</h4>
                  <p className="text-xs text-slate-500">
                    Applying for: <strong>{trackedApp.target_class || trackedApp.subject_specialization}</strong> • Ref: <strong>{trackedApp.application_number}</strong>
                  </p>
                </div>

                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    trackedApp.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : trackedApp.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-sky-100 text-sky-800 border border-sky-300'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      trackedApp.status === 'approved' ? 'bg-emerald-500' : trackedApp.status === 'rejected' ? 'bg-rose-500' : 'bg-sky-500 animate-pulse'
                    }`} />
                    <span>Status: {trackedApp.status}</span>
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-emerald-600 mb-1 flex items-center justify-center gap-1">
                    <FiCheck /> <span>Submitted</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Record Created</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-blue-600 mb-1 flex items-center justify-center gap-1">
                    <FiCheck /> <span>In Review</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Admissions Desk</div>
                </div>

                <div className={`p-3 bg-white rounded-xl border ${
                  trackedApp.status === 'approved' ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'
                }`}>
                  <div className={`text-xs font-bold mb-1 ${trackedApp.status === 'approved' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {trackedApp.status === 'approved' ? 'Assessment Cleared' : 'Assessment'}
                  </div>
                  <div className="text-[11px] text-slate-500">Diagnostic Eval</div>
                </div>

                <div className={`p-3 bg-white rounded-xl border ${
                  trackedApp.status === 'approved' ? 'border-emerald-500 bg-emerald-100/60' : 'border-slate-200'
                }`}>
                  <div className={`text-xs font-bold mb-1 ${trackedApp.status === 'approved' ? 'text-emerald-800' : 'text-slate-400'}`}>
                    {trackedApp.status === 'approved' ? 'Offer Extended' : 'Decision'}
                  </div>
                  <div className="text-[11px] text-slate-500">Final Enrollment</div>
                </div>
              </div>

              {trackedApp.admin_notes && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700">
                  <span className="font-bold text-blue-800">Admissions Note:</span> {trackedApp.admin_notes}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 lg:py-24 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
            <FiHelpCircle className="text-blue-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            Frequently Asked Admissions Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left bg-white hover:bg-slate-50 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base font-heading cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <FiChevronUp className="text-blue-600 shrink-0" /> : <FiChevronDown className="text-slate-400 shrink-0" />}
              </button>

              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Book a Tour & Contact Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <span className="text-sky-400 text-xs font-bold uppercase tracking-wider">Experience Our Campus</span>
            <h3 className="text-2xl sm:text-4xl font-extrabold font-heading mt-1">
              Schedule a Guided Campus Tour
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-xl">
              Witness our passionate teachers, state-of-the-art STEM labs, interactive classrooms, and sports facilities in person.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-lg transition"
            >
              <FiCalendar />
              <span>Book Guided Tour</span>
            </Link>

            <a
              href="tel:+2348144353033"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full border border-white/20 transition"
            >
              <FiPhone />
              <span>Call Admissions</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdmissionsPage;
