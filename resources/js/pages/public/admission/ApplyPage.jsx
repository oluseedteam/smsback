import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  FiUserCheck, 
  FiSend, 
  FiCheckCircle, 
  FiCopy, 
  FiSearch, 
  FiClock, 
  FiAlertCircle, 
  FiChevronRight,
  FiFileText,
  FiBookOpen,
  FiAward,
  FiMapPin,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { FaGraduationCap, FaChalkboardUser, FaChildReaching } from 'react-icons/fa6';
import rectangular from '../../../assets/images/rectangular_school_collage.png';
import { submitApplication, checkApplicationStatus } from '../../../services/admissionService';
import toast from 'react-hot-toast';

const classOptions = [
  'Crèche / Playgroup (3 mos - 2 yrs)',
  'Nursery 1 (Ages 2 - 3)',
  'Nursery 2 (Ages 3 - 4)',
  'Kindergarten (Ages 4 - 5)',
  'Primary 1 (Grade 1)',
  'Primary 2 (Grade 2)',
  'Primary 3 (Grade 3)',
  'Primary 4 (Grade 4)',
  'Primary 5 (Grade 5)',
  'Primary 6 (Grade 6)',
  'Junior Secondary 1 (JSS 1)',
  'Junior Secondary 2 (JSS 2)',
  'Junior Secondary 3 (JSS 3)',
  'Senior Secondary 1 (SSS 1)',
  'Senior Secondary 2 (SSS 2)',
  'Senior Secondary 3 (SSS 3)',
];

const qualifications = [
  'B.Ed (Bachelor of Education)',
  'B.Sc / B.A + PGDE (Post Graduate Diploma)',
  'B.Sc / B.A Degree',
  'NCE (Nigeria Certificate in Education)',
  'M.Ed / M.Sc / Master\'s Degree',
  'Ph.D. in Education / Relevant Field',
  'HND + PGDE',
  'Montessori Early Childhood Certification',
];

const subjectSpecializations = [
  'Mathematics & Further Mathematics',
  'English Language & Literature',
  'Physics & Basic Technology',
  'Chemistry & Basic Science',
  'Biology & Agricultural Science',
  'Economics, Commerce & Accounting',
  'Government & Civic Education',
  'Computer Studies / Coding & Robotics',
  'Primary General Class Teacher',
  'Early Years / Montessori Specialist',
  'Music, Creative & Cultural Arts',
  'French Language',
  'Physical & Health Education (PHE)',
];

const INITIAL_STUDENT_FORM = {
  type: 'student',
  full_name: '',
  gender: 'Male',
  date_of_birth: '',
  target_class: 'Junior Secondary 1 (JSS 1)',
  department: '',
  previous_school: '',
  last_grade_completed: '',
  parent_name: '',
  parent_phone: '',
  parent_email: '',
  email: '',
  phone: '',
  address: '',
};

const INITIAL_TEACHER_FORM = {
  type: 'teacher',
  full_name: '',
  gender: 'Male',
  date_of_birth: '',
  email: '',
  phone: '',
  address: '',
  qualification: 'B.Ed (Bachelor of Education)',
  subject_specialization: 'Mathematics & Further Mathematics',
  experience_years: '2 - 4 years',
  previous_school: '',
  cover_letter: '',
};

const ApplyPage = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'teacher' | 'tracker'
  const [studentForm, setStudentForm] = useState(INITIAL_STUDENT_FORM);
  const [teacherForm, setTeacherForm] = useState(INITIAL_TEACHER_FORM);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Status tracking state
  const [trackQuery, setTrackQuery] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedApp, setTrackedApp] = useState(null);
  const [trackError, setTrackError] = useState('');

  const isSeniorSecondary = studentForm.target_class.includes('Senior Secondary');

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeacherChange = (e) => {
    const { name, value } = e.target;
    setTeacherForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = activeTab === 'student' ? { ...studentForm } : { ...teacherForm };
      
      // Basic check
      if (!payload.full_name.trim()) {
        toast.error('Please enter the full name.');
        setLoading(false);
        return;
      }
      if (!payload.email.trim() || !payload.email.includes('@')) {
        toast.error('Please provide a valid contact email.');
        setLoading(false);
        return;
      }

      if (activeTab === 'student' && !payload.parent_phone.trim()) {
        toast.error('Parent / Guardian phone number is required.');
        setLoading(false);
        return;
      }

      const res = await submitApplication(payload);
      setSubmittedData({
        ...res.application,
        reference: res.application_number,
      });
      toast.success(res.message || 'Application submitted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSearch = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) {
      toast.error('Please enter an Application Reference Number or Email.');
      return;
    }

    setTrackingLoading(true);
    setTrackError('');
    setTrackedApp(null);

    try {
      const res = await checkApplicationStatus(trackQuery.trim());
      setTrackedApp(res.application);
      toast.success('Application record retrieved.');
    } catch (err) {
      setTrackError(err.message || 'No application record found with that reference number or email.');
      toast.error('Application not found.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Reference number copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-Dm-sans">
      
      {/* Hero Banner with Breadcrumb */}
      <section
        className="relative min-h-[45vh] lg:min-h-[50vh] flex items-center justify-center bg-cover bg-center pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `url(${rectangular})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/65 via-[#0C1B33]/55 to-[#070F20]/80" />

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white flex flex-col items-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md mb-6">
            <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <FiChevronRight className="text-sky-400 text-xs" />
            <span className="text-sky-300">Admissions & Career Application</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight"
          >
            Join Our Vibrant <br className="hidden sm:block" />
            <span className="text-sky-300 drop-shadow-md">Academic Community</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 max-w-2xl mx-auto text-slate-200 text-sm sm:text-base leading-relaxed"
          >
            Apply for student admission for the 2025/2026 academic session, or submit an employment application to join our dedicated faculty.
          </motion.p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 -mt-8 relative z-20">
        
        {/* Navigation Selector Pill */}
        <div className="bg-white rounded-3xl p-2 shadow-xl border border-slate-200/80 flex flex-wrap sm:flex-nowrap gap-2 mb-10">
          <button
            onClick={() => { setActiveTab('student'); setSubmittedData(null); }}
            className={`flex-1 py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FaGraduationCap className="text-lg shrink-0" />
            <span>Student Admission Application</span>
          </button>

          <button
            onClick={() => { setActiveTab('teacher'); setSubmittedData(null); }}
            className={`flex-1 py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FaChalkboardUser className="text-lg shrink-0" />
            <span>Teacher & Staff Application</span>
          </button>

          <button
            onClick={() => { setActiveTab('tracker'); setSubmittedData(null); }}
            className={`py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FiSearch className="text-base shrink-0" />
            <span>Track Application Status</span>
          </button>
        </div>

        {/* Content Views */}
        <AnimatePresence mode="wait">
          
          {/* SUCCESS VIEW */}
          {submittedData ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
                <FiCheckCircle />
              </div>

              <div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  Application Received
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-3">
                  Thank You, {submittedData.full_name}!
                </h2>
                <p className="text-slate-600 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
                  Your {submittedData.type === 'teacher' ? 'teacher employment application' : 'student admission application'} has been officially logged in our administrative portal.
                </p>
              </div>

              {/* Reference Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Application Reference Number</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-black font-heading text-blue-600 tracking-wider">
                    {submittedData.application_number}
                  </span>
                  <button
                    onClick={() => copyToClipboard(submittedData.application_number)}
                    className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                    title="Copy Reference"
                  >
                    <FiCopy />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Please keep this reference code safe. You can use it to track your review and decision status.
                </p>
              </div>

              {/* Next steps instruction card */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 max-w-lg mx-auto text-left text-xs sm:text-sm text-slate-700 space-y-2">
                <p className="font-bold text-blue-900 font-heading">What Happens Next?</p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  <li>Our Admissions Board will review your submitted credentials.</li>
                  <li>You will receive an SMS / email regarding entrance evaluation or interview dates.</li>
                  <li>Upon approval by the School Admin, your portal credentials will be provisioned.</li>
                </ul>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setTrackQuery(submittedData.application_number);
                    setActiveTab('tracker');
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
                >
                  Track Application Status
                </button>
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setStudentForm(INITIAL_STUDENT_FORM);
                    setTeacherForm(INITIAL_TEACHER_FORM);
                  }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition"
                >
                  Submit Another Application
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'tracker' ? (
            
            /* TRACKER VIEW */
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl space-y-8"
            >
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
                  <FiSearch className="text-blue-600" />
                  <span>Real-Time Status Inquiry</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Track Application Status
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  Enter your Application Reference Number (e.g. <span className="font-mono font-bold text-blue-600">ADM-2025-XXXXX</span> or <span className="font-mono font-bold text-blue-600">TCH-2025-XXXXX</span>) or the email address used during submission.
                </p>
              </div>

              {/* Search input */}
              <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter Reference Number or Email..."
                  className="flex-1 px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-900 bg-slate-50/50"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
                >
                  {trackingLoading ? <span>Searching...</span> : <><span>Check Status</span> <FiSearch /></>}
                </button>
              </form>

              {/* Track Error */}
              {trackError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700">
                  <FiAlertCircle className="text-lg shrink-0" />
                  <span>{trackError}</span>
                </div>
              )}

              {/* Track Result Card */}
              {trackedApp && (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Application Dossier</span>
                      <h3 className="text-xl font-extrabold text-slate-900 font-heading mt-0.5">
                        {trackedApp.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {trackedApp.type === 'teacher' ? 'Teacher Career Application' : `Student Admission (${trackedApp.target_class || 'General'})`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        trackedApp.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : trackedApp.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-sky-100 text-sky-800 border border-sky-300'
                      }`}>
                        {trackedApp.status === 'approved' ? '✅ Accepted & Approved' : trackedApp.status === 'rejected' ? '❌ Application Declined' : '⏳ Under Review'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Reference ID</span>
                      <p className="font-mono font-bold text-blue-600 mt-0.5">{trackedApp.application_number}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Date Submitted</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {new Date(trackedApp.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Portal ID Code</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {trackedApp.provisioned_id_code || 'Pending approval'}
                      </p>
                    </div>
                  </div>

                  {trackedApp.admin_notes && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm">
                      <span className="font-bold text-slate-900 block mb-1">Administrative Note / Instructions:</span>
                      <p className="text-slate-600 leading-relaxed">{trackedApp.admin_notes}</p>
                    </div>
                  )}

                  {trackedApp.status === 'approved' && (
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm space-y-2">
                      <p className="font-bold font-heading text-emerald-950">Congratulations on your Admission!</p>
                      <p>
                        Your application has been accepted. You can now log into the GHRA Portal using your ID Code: <span className="font-mono font-bold">{trackedApp.provisioned_id_code}</span> or your registered email address.
                      </p>
                      <Link
                        to="/login"
                        className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                      >
                        Proceed to Portal Login
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'student' ? (

            /* STUDENT FORM */
            <motion.div
              key="student-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl"
            >
              <div className="mb-8 pb-6 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
                  <FaChildReaching className="text-blue-600" />
                  <span>Student Admission Form • 2025/2026 Session</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Student Enrollment Application
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Please provide accurate pupil bio-data and parent contact information below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* SECTION 1: PUPIL BIO DATA */}
                <div>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                    <span>Pupil / Student Bio Data</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Child's Full Name (Surname First) *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={studentForm.full_name}
                        onChange={handleStudentChange}
                        placeholder="e.g. Adeleke Daniel Babatunde"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={studentForm.gender}
                        onChange={handleStudentChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={studentForm.date_of_birth}
                        onChange={handleStudentChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Target Entry Class *
                      </label>
                      <select
                        name="target_class"
                        value={studentForm.target_class}
                        onChange={handleStudentChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 cursor-pointer"
                      >
                        {classOptions.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isSeniorSecondary && (
                    <div className="mt-4 p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
                      <label className="block text-xs font-bold text-sky-900 uppercase tracking-wider mb-1.5">
                        Senior Secondary Academic Stream / Department *
                      </label>
                      <select
                        name="department"
                        value={studentForm.department}
                        onChange={handleStudentChange}
                        className="w-full px-4 py-3 border border-sky-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
                      >
                        <option value="">Select Stream</option>
                        <option value="science">Science Department (Pure & Applied Sciences)</option>
                        <option value="art">Arts & Humanities Department</option>
                        <option value="commercial">Commercial & Business Studies Department</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* SECTION 2: ACADEMIC BACKGROUND */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                    <span>Academic History (If Transferring)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Previous School Attended
                      </label>
                      <input
                        type="text"
                        name="previous_school"
                        value={studentForm.previous_school}
                        onChange={handleStudentChange}
                        placeholder="e.g. Divine Grace Model Academy"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Last Grade / Class Passed
                      </label>
                      <input
                        type="text"
                        name="last_grade_completed"
                        value={studentForm.last_grade_completed}
                        onChange={handleStudentChange}
                        placeholder="e.g. Primary 5 with Distinction"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PARENT / GUARDIAN INFORMATION */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
                    <span>Parent / Guardian Contact Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Parent / Guardian Name *
                      </label>
                      <input
                        type="text"
                        name="parent_name"
                        required
                        value={studentForm.parent_name}
                        onChange={handleStudentChange}
                        placeholder="e.g. Mr. & Mrs. Adeleke"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Primary Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="parent_phone"
                        required
                        value={studentForm.parent_phone}
                        onChange={handleStudentChange}
                        placeholder="e.g. 0814 000 0000"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Parent Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={studentForm.email}
                        onChange={handleStudentChange}
                        placeholder="e.g. parent@example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Residential Home Address
                    </label>
                    <textarea
                      rows="2"
                      name="address"
                      value={studentForm.address}
                      onChange={handleStudentChange}
                      placeholder="e.g. Plot 12, Oba Road, Okinni, Osogbo, Osun State"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? <span>Submitting Application...</span> : <><span>Submit Student Admission Application</span> <FiSend /></>}
                </button>
              </form>
            </motion.div>
          ) : (

            /* TEACHER FORM */
            <motion.div
              key="teacher-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl"
            >
              <div className="mb-8 pb-6 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
                  <FaChalkboardUser className="text-emerald-600" />
                  <span>Academic Faculty Careers • Apply to Teach</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Teacher Employment Application
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Join our faculty of passionate educators shaping the future leaders of tomorrow.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* SECTION 1: PERSONAL & CONTACT */}
                <div>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                    <span>Educator Personal Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name (With Title, e.g. Mr. / Mrs. / Dr.) *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={teacherForm.full_name}
                        onChange={handleTeacherChange}
                        placeholder="e.g. Mr. Olawale Johnson"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={teacherForm.gender}
                        onChange={handleTeacherChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={teacherForm.email}
                        onChange={handleTeacherChange}
                        placeholder="e.g. teacher.johnson@example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={teacherForm.phone}
                        onChange={handleTeacherChange}
                        placeholder="e.g. +234 803 000 0000"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: QUALIFICATIONS & SPECIALIZATION */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                    <span>Professional Qualifications & Subject Mastery</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Highest Qualification *
                      </label>
                      <select
                        name="qualification"
                        value={teacherForm.qualification}
                        onChange={handleTeacherChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 cursor-pointer"
                      >
                        {qualifications.map((q, i) => (
                          <option key={i} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Primary Teaching Specialization *
                      </label>
                      <select
                        name="subject_specialization"
                        value={teacherForm.subject_specialization}
                        onChange={handleTeacherChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 cursor-pointer"
                      >
                        {subjectSpecializations.map((s, i) => (
                          <option key={i} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Years of Teaching Experience
                      </label>
                      <select
                        name="experience_years"
                        value={teacherForm.experience_years}
                        onChange={handleTeacherChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 cursor-pointer"
                      >
                        <option value="0 - 1 year (Entry Level)">0 - 1 year (Entry Level)</option>
                        <option value="2 - 4 years">2 - 4 years</option>
                        <option value="5 - 9 years">5 - 9 years</option>
                        <option value="10+ years (Senior Educator)">10+ years (Senior Educator)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Previous School / Institution
                      </label>
                      <input
                        type="text"
                        name="previous_school"
                        value={teacherForm.previous_school}
                        onChange={handleTeacherChange}
                        placeholder="e.g. St. Gregory College"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Teaching Philosophy / Cover Statement
                    </label>
                    <textarea
                      rows="3"
                      name="cover_letter"
                      value={teacherForm.cover_letter}
                      onChange={handleTeacherChange}
                      placeholder="Briefly state your teaching strengths, classroom management approach, or why you wish to teach at GHRA..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? <span>Submitting Application...</span> : <><span>Submit Teacher Employment Application</span> <FiSend /></>}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};

export default ApplyPage;
