import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { resetPassword } from "../../services/authService";
import { 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowRight, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiShield, 
  FiAlertCircle,
  FiKey,
  FiCheck
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";

// ── Background Particle Glow & Matrix Grid ──────────────────────────────────
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
    <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px]" />
    <div className="absolute top-[30%] -right-[15%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
    <div className="absolute -bottom-[20%] left-[25%] w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-[130px]" />
    
    <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="school-grid-rp" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#school-grid-rp)" />
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
        <pattern id="hero-grid-rp" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid-rp)" />
    </svg>
  </div>
);

// ── Password strength evaluation ─────────────────────────────────────────────
const getStrength = (pw) => {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { label: "Too weak", color: "bg-rose-500", text: "text-rose-500" },
    { label: "Weak", color: "bg-amber-500", text: "text-amber-500" },
    { label: "Fair", color: "bg-yellow-500", text: "text-yellow-500" },
    { label: "Strong", color: "bg-blue-500", text: "text-blue-500" },
    { label: "Very strong", color: "bg-emerald-500", text: "text-emerald-500" },
  ];
  return { score: s, ...(levels[s] || levels[0]) };
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [password, setPassword]               = useState("");
  const [password_confirmation, setConfirm]   = useState("");
  const [showPw, setShowPw]                   = useState(false);
  const [showCpw, setShowCpw]                 = useState(false);
  const [fieldErrors, setFieldErrors]         = useState({});
  const [globalError, setGlobalError]         = useState("");
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);

  const invalidLink = !tokenFromUrl || !emailFromUrl;

  const validate = () => {
    const e = {};
    if (password.length < 8) e.password = "Password must contain at least 8 characters.";
    if (password !== password_confirmation) e.password_confirmation = "Password confirmations do not match.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setGlobalError("");
    setLoading(true);

    try {
      await resetPassword({
        token: tokenFromUrl,
        email: emailFromUrl,
        password,
        password_confirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const mapped = {};
        Object.entries(err.errors).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setFieldErrors(mapped);
      } else {
        setGlobalError(err.message || "Something went wrong. Please request a new recovery link.");
      }
    } finally {
      setLoading(false);
    }
  };

  const st = getStrength(password);

  const requirements = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#090f1d] px-4 py-8 sm:p-6 lg:p-8 font-Dm-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      <AmbientBackground />

      {/* Top Utility Header */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between mb-4 sm:mb-6 px-2">
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md group"
        >
          <FiArrowLeft className="text-blue-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-[11px] font-semibold text-blue-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Encrypted Password Update</span>
        </div>
      </div>

      {/* Main Unified Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-black/60 flex flex-col md:flex-row overflow-hidden border border-slate-700/30"
      >
        {/* ── LEFT HERO: INSTITUTIONAL BRAND ──────────────────────────────── */}
        <div className="relative w-full md:w-[48%] bg-gradient-to-br from-[#0c234a] via-[#12306b] to-[#0a1835] text-white flex flex-col justify-between p-7 sm:p-9 md:p-11 overflow-hidden min-h-[360px] md:min-h-[660px]">
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
                    Security
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 font-medium">Shaping Young Minds</p>
              </div>
            </Link>
          </div>

          {/* Left Description & Requirements */}
          <div className="relative z-10 my-8 md:my-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-4">
              <FiKey className="text-sky-400 text-xs" />
              <span className="text-[11px] font-bold tracking-widest text-blue-200 uppercase">
                CREDENTIAL SETUP
              </span>
            </div>

            <h1 
              className="text-3xl sm:text-4xl md:text-[2.65rem] font-bold leading-[1.12] text-white tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Create a <span className="bg-gradient-to-r from-sky-200 via-sky-300 to-blue-300 bg-clip-text text-transparent">New Password.</span>
            </h1>

            <p className="mt-4 text-blue-100/80 text-sm leading-relaxed max-w-[340px]">
              Set a strong, unique password to secure your personal dashboard and academic records.
            </p>

            {/* Live Security Checklist */}
            <div className="mt-6 space-y-2">
              <p className="text-xs font-bold text-blue-200/90 uppercase tracking-wider mb-2">Password Requirements</p>
              <div className="grid grid-cols-2 gap-2">
                {requirements.map(({ label, met }) => (
                  <div 
                    key={label}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all border ${
                      met 
                        ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300" 
                        : "bg-white/5 border-white/10 text-blue-200/60"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      met ? "bg-emerald-400 text-slate-900" : "bg-white/10 text-white/40"
                    }`}>
                      {met ? <FiCheck /> : "•"}
                    </div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Security Card */}
          <div className="relative z-10 mt-6 md:mt-0 bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-lg flex items-center justify-between">
            <span className="text-sky-300 font-semibold text-xs flex items-center gap-1.5">
              <FiShield className="text-sm" /> 256-Bit Cryptographic Salt
            </span>
            <span className="text-[10px] text-blue-200">GHRA Identity</span>
          </div>
        </div>

        {/* ── RIGHT: FORM PANEL ────────────────────────────────────────────── */}
        <div className="w-full md:w-[52%] bg-slate-50 flex flex-col justify-between p-7 sm:p-10 md:p-12 text-slate-800">
          <div>
            <AnimatePresence mode="wait">
              {invalidLink ? (
                /* Invalid Link State */
                <motion.div 
                  key="invalid"
                  initial={{ opacity: 0, y: 16 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                >
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 border border-rose-200">
                    <FiAlertCircle className="text-3xl" />
                  </div>

                  <h2 
                    className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Invalid or Expired Link
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-6 leading-relaxed">
                    This password reset token has expired or is invalid. Please generate a new request from the account recovery page.
                  </p>

                  <Link 
                    to="/forgot-password"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Request New Recovery Link</span>
                    <FiArrowRight />
                  </Link>
                </motion.div>
              ) : success ? (
                /* Success State */
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  className="text-center py-6"
                >
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-lg shadow-emerald-500/10">
                    <FiCheckCircle className="text-4xl" />
                  </div>

                  <h2 
                    className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Password Successfully Updated!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">
                    Your credentials have been securely stored. Redirecting to sign in portal…
                  </p>
                </motion.div>
              ) : (
                /* Active Reset Form */
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, y: 16 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                >
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-200">
                    <FiKey className="text-2xl" />
                  </div>

                  <h2 
                    className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Set New Password
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6">
                    Updating account for <span className="text-blue-600 font-bold">{emailFromUrl}</span>
                  </p>

                  <AnimatePresence>
                    {globalError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 mb-4 flex items-start gap-3 shadow-sm overflow-hidden"
                      >
                        <FiAlertCircle className="text-rose-600 text-lg flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-rose-700 leading-relaxed">{globalError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                          <FiLock className="text-base" />
                        </div>
                        <input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors((p) => ({ ...p, password: "" }));
                          }}
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-11 py-3.5 bg-white border border-slate-300/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {showPw ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                        </button>
                      </div>
                      
                      {/* Strength meter bar */}
                      {password && st && (
                        <div className="mt-2">
                          <div className="flex gap-1.5 mb-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                  i < st.score ? st.color : "bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-[10px] font-bold ${st.text}`}>Strength: {st.label}</p>
                        </div>
                      )}

                      {fieldErrors.password && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1 px-1">{fieldErrors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                          <FiLock className="text-base" />
                        </div>
                        <input
                          type={showCpw ? "text" : "password"}
                          value={password_confirmation}
                          onChange={(e) => {
                            setConfirm(e.target.value);
                            setFieldErrors((p) => ({ ...p, password_confirmation: "" }));
                          }}
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-11 py-3.5 bg-white border border-slate-300/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCpw(!showCpw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {showCpw ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                        </button>
                      </div>

                      {fieldErrors.password_confirmation && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1 px-1">{fieldErrors.password_confirmation}</p>
                      )}
                    </div>

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
                          <span>Updating Password…</span>
                        </>
                      ) : (
                        <>
                          <span>Save & Proceed to Login</span>
                          <FiArrowRight className="text-base" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              <FiArrowLeft className="text-sm" />
              <span>Back to Portal Sign In</span>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mt-6 text-center text-xs text-slate-400/80">
        <p>© {new Date().getFullYear()} GHRA • Secure Identity Portal</p>
      </div>
    </div>
  );
}

