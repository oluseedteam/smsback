import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { useAuth } from "../../hooks/useAuth";
import { loginUser } from "../../services/authService";
import { 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowRight, 
  FiCheckCircle, 
  FiShield, 
  FiAlertCircle, 
  FiArrowLeft,
  FiClock,
  FiHelpCircle
} from "react-icons/fi";
import { FaIdCard } from "react-icons/fa";
import toast from "react-hot-toast";

// ── Background Particle Glow & Matrix Grid ──────────────────────────────────
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
    <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-emerald-600/15 blur-[120px]" />
    <div className="absolute top-[30%] -right-[15%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[140px]" />
    <div className="absolute -bottom-[20%] left-[25%] w-[600px] h-[600px] rounded-full bg-teal-400/10 blur-[130px]" />
    
    <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="cbt-grid-bg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cbt-grid-bg)" />
    </svg>
  </div>
);

export default function CbtLogin() {
  const { user, isAuthenticated, login: loginUserToContext } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated as student, route straight to CBT hall
  useEffect(() => {
    if (isAuthenticated && user?.role === "student") {
      navigate("/student/cbt", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleCbtSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setError("Please provide both your Student ID / Email and Examination Passcode.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Candidate login uses student role
      const data = await loginUser({
        login: loginId.trim(),
        password,
        role: "student",
      });

      loginUserToContext(data);
      toast.success("Candidate verified! Entering CBT Examination Hall...");
      navigate("/student/cbt", { replace: true });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError("Invalid Student ID or Examination Passcode. Please check your credentials or contact your invigilator.");
      } else if (err.status === 422 && err.errors) {
        const first = Object.values(err.errors).flat()[0];
        setError(first || "Please check your credentials and try again.");
      } else {
        setError(err.message || "Unable to reach the examination server. Please ensure you are connected to the network.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#090f1d] px-4 py-8 sm:p-6 lg:p-8 font-sans text-slate-100 selection:bg-emerald-600 selection:text-white">
      <AmbientBackground />

      {/* Top Navigation */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between mb-4 sm:mb-6 px-2">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md group"
        >
          <FiArrowLeft className="text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>School Homepage</span>
        </Link>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md"
        >
          <span>Staff / Admin Portal</span>
          <FiArrowRight className="text-blue-400" />
        </Link>
      </div>

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-4xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12"
      >
        {/* Left Side: Exam Instructions & Branding */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-950/60 via-[#0a2324]/50 to-[#091523]/80 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="School Logo" className="w-11 h-11 object-contain drop-shadow-md" />
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-emerald-400">GHRA CBT Portal</div>
                <div className="text-sm font-bold text-white leading-tight">Golden Heritage Royal Academy</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Candidate Examination Gateway
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-3">
              Computer-Based Testing (CBT) Center
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Sign in with your verified Student ID or school email to access your active test papers, timed quizzes, and terminal assessments.
            </p>

            {/* Candidate Rules Checklist */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <FiClock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Timer activates immediately upon clicking <strong>Start Exam</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Progress and answers are automatically synchronized and backed up.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <FiShield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Anti-malpractice logging is active throughout testing.</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Official Examination Session</span>
            <span className="text-emerald-400 font-mono font-bold">LIVE SYSTEM</span>
          </div>
        </div>

        {/* Right Side: Candidate Sign-In Form */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white mb-1">Candidate Sign In</h1>
            <p className="text-xs text-slate-400">
              Enter your student credentials to authenticate into the examination hall.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5"
            >
              <FiAlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </motion.div>
          )}

          <form onSubmit={handleCbtSubmit} className="space-y-4">
            {/* Student ID / Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Student ID or Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FaIdCard className="text-sm" />
                </div>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. GHRA-STU-101 or student@ghraschools.edu.ng"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 focus:border-emerald-500 focus:bg-white/[0.08] focus:outline-none text-sm text-white placeholder-slate-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Format: GHRA-STU-XXXX or registered school email</p>
            </div>

            {/* Password / Passcode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Exam Passcode / Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                >
                  Forgot passcode?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="text-sm" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential passcode"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/[0.05] border border-white/10 focus:border-emerald-500 focus:bg-white/[0.08] focus:outline-none text-sm text-white placeholder-slate-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Candidate Credentials...</span>
                </>
              ) : (
                <>
                  <span>Enter Examination Hall</span>
                  <FiArrowRight className="text-base" />
                </>
              )}
            </button>
          </form>

          {/* Assistance Note */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <FiHelpCircle className="text-emerald-400" />
              Need technical support?
            </span>
            <a href="tel:+2348144353033" className="text-emerald-400 hover:underline font-medium">
              Call Invigilator: 0814 435 3033
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
