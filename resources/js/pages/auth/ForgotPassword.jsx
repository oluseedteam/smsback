import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { forgotPassword } from "../../services/authService";
import { 
  FiMail, 
  FiArrowRight, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiShield, 
  FiHelpCircle, 
  FiAlertCircle,
  FiSend
} from "react-icons/fi";
import { FaGraduationCap, FaKey } from "react-icons/fa";

// ── Background Particle Glow & Matrix Grid ──────────────────────────────────
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
    <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px]" />
    <div className="absolute top-[30%] -right-[15%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
    <div className="absolute -bottom-[20%] left-[25%] w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-[130px]" />
    
    <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="school-grid-fp" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#school-grid-fp)" />
    </svg>
  </div>
);

const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute top-1/2 -right-20 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-2xl" />
    
    <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hero-grid-fp" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid-fp)" />
    </svg>
  </div>
);

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid school email address."); return; }

    setError("");
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setError(Object.values(err.errors).flat()[0] || "Please check your email address.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#090f1d] px-4 py-8 sm:p-6 lg:p-8 font-Dm-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      <AmbientBackground />

      {/* Top Utility Nav */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between mb-4 sm:mb-6 px-2">
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md group"
        >
          <FiArrowLeft className="text-blue-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-[11px] font-semibold text-blue-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Account Recovery Service</span>
        </div>
      </div>

      {/* Main Unified Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-black/60 flex flex-col md:flex-row overflow-hidden border border-slate-700/30"
      >
        {/* ── LEFT HERO: INSTITUTIONAL BRAND & HELP ───────────────────────── */}
        <div className="relative w-full md:w-[48%] bg-gradient-to-br from-[#0c234a] via-[#12306b] to-[#0a1835] text-white flex flex-col justify-between p-7 sm:p-9 md:p-11 overflow-hidden min-h-[360px] md:min-h-[620px]">
          <HeroBackground />

          {/* School Brand */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl shadow-black/20 border border-white/20 group-hover:scale-105 transition-transform">
                <img src={logo} alt="GHRA Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg tracking-tight font-heading">GHRA</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-400/20 border border-sky-300/30 text-[10px] font-extrabold text-sky-300 uppercase tracking-wider">
                    Recovery
                  </span>
                </div>
                <p className="text-xs text-sky-300/90 font-black uppercase tracking-wider">SHAPING YOUNG MINDS</p>
              </div>
            </Link>
          </div>

          {/* Dynamic Left Copy */}
          <div className="relative z-10 my-8 md:my-0">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent-copy"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md mb-4">
                    <FiCheckCircle className="text-emerald-400 text-xs" />
                    <span className="text-[11px] font-bold tracking-widest text-emerald-200 uppercase">
                      LINK DISPATCHED
                    </span>
                  </div>

                  <h1 
                    className="text-3xl sm:text-4xl md:text-[2.65rem] font-bold leading-[1.12] text-white tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Check Your <span className="bg-gradient-to-r from-sky-200 via-sky-300 to-blue-300 bg-clip-text text-transparent">Email Inbox.</span>
                  </h1>

                  <p className="mt-4 text-blue-100/80 text-sm leading-relaxed max-w-[340px]">
                    A secure password reset link has been issued. Please follow the instructions in the email to restore your portal access.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="default-copy"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-4">
                    <FaKey className="text-sky-400 text-xs" />
                    <span className="text-[11px] font-bold tracking-widest text-blue-200 uppercase">
                      SECURE PASSWORD RESET
                    </span>
                  </div>

                  <h1 
                    className="text-3xl sm:text-4xl md:text-[2.65rem] font-bold leading-[1.12] text-white tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Lost Your <span className="bg-gradient-to-r from-sky-200 via-sky-300 to-blue-300 bg-clip-text text-transparent">Password?</span>
                  </h1>

                  <p className="mt-4 text-blue-100/80 text-sm leading-relaxed max-w-[340px]">
                    No worries. Enter your registered school email address below and we'll dispatch a safe, one-time recovery link immediately.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Security & Guidance Pill Box */}
          <div className="relative z-10 mt-6 md:mt-0 bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sky-300 font-semibold text-xs flex items-center gap-1.5">
                <FiShield className="text-sm" /> Important Safety Rules
              </span>
              <span className="text-[10px] text-blue-300 font-medium">Auto-expires in 60 mins</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-blue-100/90">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Always check your Junk or Spam inbox folder</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Contact school admin if your email has changed</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── RIGHT: INTERACTIVE FORM ──────────────────────────────────────── */}
        <div className="w-full md:w-[52%] bg-slate-50 flex flex-col justify-between p-7 sm:p-10 md:p-12 text-slate-800">
          <div>
            <AnimatePresence mode="wait">
              {sent ? (
                /* Success State */
                <motion.div 
                  key="sent"
                  initial={{ opacity: 0, y: 16 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
                    <FiCheckCircle className="text-3xl" />
                  </div>

                  <h2 
                    className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Reset link dispatched!
                  </h2>
                  
                  <p className="text-sm text-slate-600 mt-2 mb-6 leading-relaxed">
                    If <span className="text-blue-600 font-bold break-all">{email}</span> matches an active portal account, you will receive an email shortly.
                  </p>

                  <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 mb-6 space-y-2.5">
                    {[
                      { n: "1", text: "Open your email inbox" },
                      { n: "2", text: "Click the secure reset link inside" },
                      { n: "3", text: "Set a strong new password" },
                    ].map(({ n, text }) => (
                      <div key={n} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                          {n}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-700 font-semibold">{text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => { setSent(false); setEmail(""); }}
                      className="w-full py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      Try another email address
                    </button>

                    <Link 
                      to="/login"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Return to Portal Sign In</span>
                      <FiArrowRight />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                /* Form State */
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, y: 16 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-200">
                    <FiSend className="text-2xl" />
                  </div>

                  <h2 
                    className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Reset Password
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6">
                    Enter your registered school email to receive a recovery link
                  </p>

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        School Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                          <FiMail className="text-base" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          placeholder="e.g. user@ghraschools.edu.ng"
                          autoComplete="email"
                          className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-300/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all"
                        />
                      </div>
                    </div>

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

                    <motion.button
                      whileHover={{ scale: 1.01, translateY: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 sm:py-4 px-6 rounded-2xl text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span>Sending Recovery Link…</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reset Link</span>
                          <FiArrowRight className="text-base" />
                        </>
                      )}
                    </motion.button>
                  </form>

                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <Link 
                    to="/login"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
                  >
                    <FiArrowLeft className="text-sm text-slate-400" />
                    <span>Back to Portal Sign In</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
            <p className="text-xs text-slate-500">
              Need direct assistance with your account?{" "}
              <Link to="/contact" className="text-blue-600 font-bold hover:underline">
                Contact Front Desk
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mt-6 text-center text-xs text-slate-400/80">
        <p>© {new Date().getFullYear()} GHRA • Account Security & Protection</p>
      </div>
    </div>
  );
}

