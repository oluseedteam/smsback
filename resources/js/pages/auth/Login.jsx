import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { useAuth } from "../../hooks/useAuth";
import { loginUser } from "../../services/authService";
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowRight, 
  FiCheckCircle, 
  FiShield, 
  FiHelpCircle, 
  FiUser, 
  FiAlertCircle, 
  FiArrowLeft,
  FiBookOpen,
  FiAward
} from "react-icons/fi";
import { 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaUserTie, 
  FaUserShield,
  FaIdCard
} from "react-icons/fa";

// ── Role Configurations ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  student: {
    label: "Student",
    icon: FaGraduationCap,
    tag: "STUDENT LEARNING PORTAL",
    headlineFirst: "Shaping",
    headlineSecond: "Young Minds.",
    highlightText: "Building Future Leaders.",
    description: "Access your personalized learning space, inspect terminal grades, submit assignments, and take CBT assessments.",
    features: [
      { text: "Live Gradebook & Transcripts", icon: FiAward },
      { text: "Interactive CBT & Quizzes", icon: FiBookOpen },
      { text: "Class Timetable & Attendance", icon: FiCheckCircle },
    ],
    idLabel: "Email or Student ID",
    idPlaceholder: "e.g. GHRA-STU-101 or student@ghraschools.edu.ng",
    idHint: "Format: GHRA-STU-XXXX or email",
    submitText: "Sign In as Student",
  },
  teacher: {
    label: "Teacher",
    icon: FaChalkboardTeacher,
    tag: "FACULTY & ACADEMIC PORTAL",
    headlineFirst: "Inspiring",
    headlineSecond: "Excellence.",
    highlightText: "Guiding Tomorrow.",
    description: "Manage class curricula, grade students, track attendance, and administer computer-based tests seamlessly.",
    features: [
      { text: "Automated Gradebook & Scores", icon: FiAward },
      { text: "Live Class Attendance System", icon: FiCheckCircle },
      { text: "CBT Test Authoring & Review", icon: FiBookOpen },
    ],
    idLabel: "Email or Employee ID",
    idPlaceholder: "e.g. GHRA-TCH-001 or teacher@ghraschools.edu.ng",
    idHint: "Format: EMP-XXXX or email",
    submitText: "Sign In as Teacher",
  },
  worker: {
    label: "Staff",
    icon: FaUserTie,
    tag: "STAFF & OPERATIONS PORTAL",
    headlineFirst: "Empowering",
    headlineSecond: "Daily Operations.",
    highlightText: "Serving Our School.",
    description: "Access administrative schedules, facility maintenance requests, duty rosters, and internal staff tools.",
    features: [
      { text: "Facility & Operations Workflows", icon: FiCheckCircle },
      { text: "Staff Roster & Duty Logs", icon: FiAward },
      { text: "Administrative Support Tools", icon: FiBookOpen },
    ],
    idLabel: "Email or Employee ID",
    idPlaceholder: "e.g. EMP-2045 or staff@ghraschools.edu.ng",
    idHint: "Format: EMP-XXXX or email",
    submitText: "Sign In as Staff",
  },
  admin: {
    label: "Admin",
    icon: FaUserShield,
    tag: "GOVERNANCE & ADMIN CONSOLE",
    headlineFirst: "Institutional",
    headlineSecond: "Governance.",
    highlightText: "Strategic Control.",
    description: "Oversee institution-wide analytics, financial audits, user access permissions, and academic records.",
    features: [
      { text: "Global System & User Management", icon: FiShield },
      { text: "School Finance & Fee Auditing", icon: FiAward },
      { text: "Examination Approval & Logs", icon: FiCheckCircle },
    ],
    idLabel: "Administrator Email",
    idPlaceholder: "admin@ghraschools.edu.ng",
    idHint: "Registered administrator email only",
    submitText: "Sign In as Admin",
  },
};

// ── Background Particle Glow & Matrix Grid ──────────────────────────────────
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
    {/* Radial glowing lights */}
    <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px]" />
    <div className="absolute top-[30%] -right-[15%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
    <div className="absolute -bottom-[20%] left-[25%] w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-[130px]" />
    
    {/* Geometric dot matrix */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="school-grid-bg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#school-grid-bg)" />
    </svg>
  </div>
);

// ── Hero Section Decorative Geometry ─────────────────────────────────────────
const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Glowing decorative circles */}
    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute top-1/2 -right-20 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-2xl" />
    
    {/* Delicate fine grid overlay */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hero-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid)" />
    </svg>
    
    {/* Subtle diagonal light beam */}
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
  </div>
);

// ── Main Login Component ──────────────────────────────────────────────────────
export default function Login() {
  const { login: loginUserToContext } = useAuth();
  const navigate = useNavigate();
  const [role, setRole]                 = useState("student");
  const [login, setLogin]               = useState("");
  const [password, setPassword]         = useState("");
  const [rememberMe, setRememberMe]     = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const activeConfig = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  const handleRoleSwitch = (r) => {
    setRole(r);
    setLogin("");
    setPassword("");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password) {
      setError("Please enter both your login ID/email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // API expects: { login, password, role }
      const data = await loginUser({ login, password, role });

      // Persist user context
      loginUserToContext(data);

      // Route according to the authenticated user's role from server
      const userRole = data?.user?.role || role;
      if (userRole === "admin") navigate("/admin");
      else if (userRole === "worker") navigate("/worker");
      else if (userRole === "teacher") navigate("/teacher");
      else navigate("/student");

    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError("Invalid credentials. Please verify your ID/email and password.");
      } else if (err.status === 422 && err.errors) {
        const first = Object.values(err.errors).flat()[0];
        setError(first || "Please check your input fields and try again.");
      } else {
        setError(err.message || "Unable to connect to the authentication server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#090f1d] px-4 py-8 sm:p-6 lg:p-8 font-Dm-sans text-slate-100 selection:bg-blue-600 selection:text-white"
    >
      <AmbientBackground />

      {/* Top Utility Header */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between mb-4 sm:mb-6 px-2">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md group"
        >
          <FiArrowLeft className="text-blue-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to School Website</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-[11px] font-semibold text-blue-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>2025/2026 Academic Session • Portal Online</span>
        </div>
      </div>

      {/* Main Unified Portal Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-black/60 flex flex-col md:flex-row overflow-hidden border border-slate-700/30"
      >

        {/* ── LEFT HERO: INSTITUTIONAL BRAND & DYNAMIC ROLE SHOWCASE ─────── */}
        <div className="relative w-full md:w-[48%] bg-gradient-to-br from-[#0c234a] via-[#12306b] to-[#0a1835] text-white flex flex-col justify-between p-7 sm:p-9 md:p-11 overflow-hidden min-h-[380px] md:min-h-[660px]">
          <HeroBackground />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl shadow-black/20 border border-white/20 group-hover:scale-105 transition-transform">
                <img src={logo} alt="GHRA Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg tracking-tight font-heading">GHRA</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-400/20 border border-sky-300/30 text-[10px] font-extrabold text-sky-300 uppercase tracking-wider">
                    Portal
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 font-medium">Shaping Young Minds</p>
              </div>
            </Link>
          </div>

          {/* Dynamic Role Showcase Content */}
          <div className="relative z-10 my-8 md:my-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {/* Role Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-4">
                  <activeConfig.icon className="text-sky-400 text-xs" />
                  <span className="text-[11px] font-bold tracking-widest text-blue-200 uppercase">
                    {activeConfig.tag}
                  </span>
                </div>

                {/* Editorial Typography */}
                <h1 
                  className="text-3xl sm:text-4xl md:text-[2.65rem] font-bold leading-[1.12] text-white tracking-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {activeConfig.headlineFirst}{" "}
                  <span className="text-slate-100">{activeConfig.headlineSecond}</span>
                </h1>
                
                <h2 
                  className="text-3xl sm:text-4xl md:text-[2.65rem] font-bold leading-[1.12] mt-1 bg-gradient-to-r from-sky-200 via-sky-300 to-blue-300 bg-clip-text text-transparent tracking-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {activeConfig.highlightText}
                </h2>

                <p className="mt-4 text-blue-100/80 text-sm leading-relaxed max-w-[340px]">
                  {activeConfig.description}
                </p>

                {/* Live Feature Highlights */}
                <div className="mt-6 space-y-2.5">
                  {activeConfig.features.map((feat, idx) => (
                    <motion.div
                      key={feat.text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.08 }}
                      className="flex items-center gap-2.5 text-xs text-blue-100 font-medium"
                    >
                      <div className="w-5 h-5 rounded-md bg-sky-400/20 border border-sky-400/30 flex items-center justify-center text-sky-300 flex-shrink-0">
                        <feat.icon className="text-[11px]" />
                      </div>
                      <span>{feat.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Security & Help Glass Card */}
          <div className="relative z-10 mt-6 md:mt-0 bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sky-300 font-semibold text-xs">
                <FaIdCard className="text-sm" />
                <span>Credential Guidelines</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                <FiShield className="text-[10px]" /> 256-Bit SSL
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[11px] text-blue-100/90">
              <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                <span className="text-white font-semibold block">Students</span>
                <span className="text-blue-300 text-[10px]">Email or SCH-XXXX</span>
              </div>
              <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                <span className="text-white font-semibold block">Staff & Faculty</span>
                <span className="text-blue-300 text-[10px]">Email or EMP-XXXX</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM: AUTHENTICATION & INTERACTIVE CONTROLS ─────────── */}
        <div className="w-full md:w-[52%] bg-slate-50 flex flex-col justify-between p-7 sm:p-10 md:p-12 text-slate-800">
          <div>
            {/* Top Micro Header: Role Segmented Control */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select User Role
                </label>
                <span className="text-[11px] text-blue-600 font-semibold">
                  {activeConfig.label} Access
                </span>
              </div>

              {/* Segmented Switcher Pill */}
              <div className="relative flex bg-slate-200/90 p-1.5 rounded-2xl border border-slate-300/50 shadow-inner">
                {/* Active Slider Pill */}
                <motion.div
                  className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-md shadow-slate-400/20 border border-slate-200/70"
                  style={{ width: "calc(25% - 3px)" }}
                  animate={{
                    left:
                      role === "student"
                        ? "6px"
                        : role === "teacher"
                        ? "calc(25% + 2px)"
                        : role === "worker"
                        ? "calc(50% - 1px)"
                        : "calc(75% - 4px)",
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />

                {[
                  { id: "student", label: "Student", icon: FaGraduationCap },
                  { id: "teacher", label: "Teacher", icon: FaChalkboardTeacher },
                  { id: "worker",  label: "Staff",   icon: FaUserTie },
                  { id: "admin",   label: "Admin",   icon: FaUserShield },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRoleSwitch(item.id)}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                        isActive
                          ? "text-blue-700 font-extrabold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon className={`text-xs ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Form Header */}
            <div className="mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 
                    className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {activeConfig.label} Sign In
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Enter your authorized school credentials to continue
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              
              {/* Login ID / Email Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {activeConfig.idLabel}
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {activeConfig.idHint}
                  </span>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    {role === "admin" ? <FiMail className="text-base" /> : <FiUser className="text-base" />}
                  </div>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => {
                      setLogin(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={activeConfig.idPlaceholder}
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-300/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <FiLock className="text-base" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3.5 bg-white border border-slate-300/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                  </button>
                </div>
              </div>

              {/* Remember ID & Security Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                  />
                  <span className="text-xs text-slate-600 font-medium">Keep me signed in on this device</span>
                </label>
              </div>

              {/* Error Message Toast */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-sm overflow-hidden"
                  >
                    <FiAlertCircle className="text-rose-600 text-lg flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-rose-700 leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit CTA Button */}
              <motion.button
                whileHover={{ scale: 1.01, translateY: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 sm:py-4 px-6 rounded-2xl text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2 cursor-pointer group"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Authenticating Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>{activeConfig.submitText}</span>
                    <FiArrowRight className="text-base group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Bottom Help Desk & Institutional Notice */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              New student or employee? Account provisioning is managed by the administration.
            </p>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold">
              <Link to="/contact" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                <FiHelpCircle className="text-sm" />
                <span>Contact Front Desk</span>
              </Link>
              <span className="text-slate-300">•</span>
              <a href="tel:+2348144353033" className="text-slate-600 hover:text-blue-600 transition-colors">
                Support: +234 814 435 3033
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 mt-6 text-center text-xs text-slate-400/80">
        <p>© {new Date().getFullYear()} GHRA. All rights reserved. • Secure Portal v2.4</p>
      </div>
    </div>
  );
}

