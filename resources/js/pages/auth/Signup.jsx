import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { registerUser, saveSession } from "../../services/authService";
import PopupModal from "../../components/PopupModal";

// ── Icons ─────────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) =>
  open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

const SpinIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ── Background shapes for left panel ─────────────────────────────────────────
const Shapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
    <div className="absolute top-1/3 -right-10 w-36 h-36 rounded-full bg-yellow-400/10" />
    <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-white/5" />
    <div className="absolute bottom-28 right-12 w-16 h-16 rounded-full bg-yellow-400/20" />
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="signup-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#signup-grid)" />
    </svg>
  </div>
);

// ── Validation ────────────────────────────────────────────────────────────────
function validateForm(form, role) {
  const errors = {};
  if (!form.fullName.trim())
    errors.fullName = "Full name is required";
  if (role === "student" && !form.studentId.trim())
    errors.studentId = "Student ID is required";
  if (role === "teacher" && !form.employeeId.trim())
    errors.employeeId = "Employee ID is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address";
  if (form.password.length < 8)
    errors.password = "Password must be at least 8 characters";
  if (form.password !== form.password_confirmation)
    errors.password_confirmation = "Passwords do not match";
  return errors;
}

// ── Reusable field ────────────────────────────────────────────────────────────
const Field = ({ label, name, type = "text", placeholder, value, onChange, error, right }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
      {label}
    </label>
    <div className="relative">
      <input
        name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-sm text-slate-800
          placeholder-slate-300 focus:outline-none focus:ring-4 transition-all font-medium
          ${error ? "border-red-400 focus:ring-red-500/10 focus:border-red-400"
                  : "border-slate-200 focus:ring-blue-500/10 focus:border-blue-500/50"}
          ${right ? "pr-12" : ""}`}
      />
      {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          className="text-[10px] text-red-500 font-bold mt-1.5 px-1"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ── Initial form state ────────────────────────────────────────────────────────
const INITIAL_FORM = {
  fullName: "", studentId: "", employeeId: "",
  email: "", password: "", password_confirmation: "",
  department: "",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole]               = useState("student");
  const [showPw, setShowPw]           = useState(false);
  const [form, setForm]               = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [socialPopup, setSocialPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (globalError) setGlobalError("");
  };

  const handleRoleSwitch = (r) => {
    setRole(r);
    setForm((p) => ({ ...p, studentId: "", employeeId: "" }));
    setFieldErrors({});
    setGlobalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validateForm(form, role);
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      document.querySelector(`[name="${Object.keys(clientErrors)[0]}"]`)?.focus();
      return;
    }

    setLoading(true);
    setGlobalError("");
    setFieldErrors({});

    try {
      const data = await registerUser({ role, ...form });
      saveSession(data);
      setSuccess(true);
      setTimeout(() => navigate(data.user.role === "teacher" ? "/teacher" : "/student"), 1800);
    } catch (err) {
      if (err.status === 422 && Object.keys(err.errors).length) {
        const mapped = {};
        Object.entries(err.errors).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setFieldErrors(mapped);
      } else {
        setGlobalError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl shadow-slate-300/60 flex flex-col md:flex-row overflow-hidden"
      >

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="relative w-full md:w-5/12 bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-800 text-white flex flex-col justify-between p-8 md:p-12 overflow-hidden min-h-[280px] md:min-h-[720px]">
          <Shapes />

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1.5">
              <img src={logo} alt="GHRA" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-white/95 text-sm tracking-widest">GHRA</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="relative z-10 my-8 md:my-0">
            <p className="text-blue-200 text-[10px] font-black tracking-[0.3em] uppercase mb-4 opacity-80 italic">
              Join our community
            </p>
            <h1 className="text-4xl md:text-[3.5rem] font-black leading-[1] mb-2 font-serif italic tracking-tighter">
              Shaping Young Minds.<br />
              <span className="text-sky-300">Building Future Leaders.</span>
            </h1>
            <p className="mt-6 text-blue-100/70 text-sm leading-relaxed max-w-[300px] font-medium">
              Create your account to access your personalized educational portal and connect with teachers and peers.
            </p>

            <div className="mt-12 space-y-6">
              {[
                { n: "1", title: "Access Tools",  sub: "Homework, Grades & More" },
                { n: "2", title: "Stay Updated",  sub: "Real-time Announcements"  },
              ].map(({ n, title, sub }, i) => (
                <div key={n} className={`flex items-center gap-4 group ${i > 0 ? "border-t border-white/5 pt-6" : ""}`}>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-sky-400/20 transition-all border border-white/5">
                    <span className="text-sky-300 text-lg font-black italic">{n}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{title}</p>
                    <p className="text-[11px] text-blue-200 opacity-60">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative z-10 flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  className="w-8 h-8 rounded-full border-2 border-indigo-600 shadow-sm" alt="user" />
              ))}
            </div>
            <p className="text-[10px] font-bold text-blue-100 italic">Joining 2,400+ students & teachers</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div className="w-full md:w-7/12 bg-white flex items-center justify-center p-6 sm:p-10 md:p-14">
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full max-w-[480px]"
          >
            <AnimatePresence mode="wait">

              {/* Success */}
              {success ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center py-16">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
                    className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Welcome aboard! 🎉
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">Taking you to your dashboard...</p>
                </motion.div>

              ) : (

                /* Form */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  <div className="mb-8 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight italic"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      Create Account
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Fill in the details below to set up your{" "}
                      <span className="text-blue-600 font-bold">{role}</span> access
                    </p>
                  </div>

                  {/* Role toggle */}
                  <div className="relative flex bg-slate-100 rounded-2xl p-1.5 mb-8 shadow-inner">
                    <motion.div
                      className="absolute top-1.5 bottom-1.5 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm border border-slate-200"
                      animate={{ left: role === "student" ? "6px" : "calc(50% + 2px)" }}
                      transition={{ type: "spring", stiffness: 450, damping: 40 }}
                    />
                    {["student", "teacher"].map((r) => (
                      <button key={r} type="button" onClick={() => handleRoleSwitch(r)}
                        className={`relative z-10 flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all
                          ${role === r ? "text-blue-700" : "text-slate-400 hover:text-slate-600"}`}>
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Global error */}
                  <AnimatePresence>
                    {globalError && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="bg-red-50 border-l-4 border-red-500 rounded-xl px-4 py-3 mb-5">
                        <p className="text-xs text-red-600 font-bold">{globalError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} noValidate className="space-y-5">

                    {/* Full Name + ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Full Name" name="fullName" placeholder="Enter your name"
                        value={form.fullName} onChange={handleChange} error={fieldErrors.fullName} />

                      <AnimatePresence mode="wait">
                        {role === "student" ? (
                          <motion.div key="studentId" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                            <Field label="Student ID" name="studentId" placeholder="e.g. SCH-4092"
                              value={form.studentId} onChange={handleChange} error={fieldErrors.studentId} />
                          </motion.div>
                        ) : (
                          <motion.div key="employeeId" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                            <Field label="Employee ID" name="employeeId" placeholder="e.g. TCH-1023"
                              value={form.employeeId} onChange={handleChange} error={fieldErrors.employeeId} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Department (students only) */}
                    <AnimatePresence>
                      {role === "student" && (
                        <motion.div
                          key="department"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                            Department / Stream
                          </label>
                          <div className="flex gap-3">
                            {["science", "art", "commercial"].map((dept) => (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => {
                                  setForm((p) => ({ ...p, department: dept }));
                                  if (fieldErrors.department) setFieldErrors((p) => ({ ...p, department: "" }));
                                }}
                                className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all ${
                                  form.department === dept
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                                }`}
                              >
                                {dept === "science" ? "🔬" : dept === "art" ? "🎨" : "💼"} {dept}
                              </button>
                            ))}
                          </div>
                          <AnimatePresence>
                            {fieldErrors.department && (
                              <motion.p
                                initial={{ opacity: 0, y: -4, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -4, height: 0 }}
                                className="text-[10px] text-red-500 font-bold mt-1.5 px-1"
                              >
                                {fieldErrors.department}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email */}
                    <Field label="Email Address" name="email" type="email" placeholder="your@school.com"
                      value={form.email} onChange={handleChange} error={fieldErrors.email} />

                    {/* Password + Confirm */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Password" name="password" type={showPw ? "text" : "password"}
                        placeholder="••••••••" value={form.password} onChange={handleChange} error={fieldErrors.password}
                        right={
                          <button type="button" onClick={() => setShowPw((p) => !p)}
                            className="text-slate-400 hover:text-slate-600 transition-colors">
                            <EyeIcon open={showPw} />
                          </button>
                        }
                      />
                      <Field label="Confirm Password" name="password_confirmation" type="password"
                        placeholder="••••••••" value={form.password_confirmation}
                        onChange={handleChange} error={fieldErrors.password_confirmation} />
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-3 px-1">
                      <input type="checkbox" required
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer flex-shrink-0" />
                      <p className="text-[11px] text-slate-500 font-medium leading-normal">
                        I agree to the{" "}
                        <span className="text-blue-600 font-bold cursor-pointer hover:underline">Terms of Service</span>
                        {" "}and{" "}
                        <span className="text-blue-600 font-bold cursor-pointer hover:underline">Privacy Policy</span>.
                      </p>
                    </div>

                    {/* Submit */}
                    <motion.button whileHover={{ y: -1, boxShadow: "0 10px 40px -10px rgba(37,99,235,0.4)" }}
                      whileTap={{ y: 0, scale: 0.98 }} type="submit" disabled={loading}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-[20px] font-black tracking-widest text-[11px] uppercase transition-all shadow-xl shadow-blue-500/20 disabled:opacity-70 flex items-center justify-center gap-2 mt-2 italic">
                      {loading ? <><SpinIcon /> Creating Account...</> : "Complete Registration"}
                    </motion.button>
                  </form>

                  {/* Social */}
                  <div className="flex items-center gap-4 my-7">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Or register with</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <div className="flex gap-4">
                    {[
                      { label: "Google",    src: "https://www.svgrepo.com/show/475656/google-color.svg" },
                      { label: "Microsoft", src: "https://www.svgrepo.com/show/512513/microsoft.svg"    },
                    ].map(({ label, src }) => (
                      <button key={label}
                        onClick={() => setSocialPopup(true)}
                        className="flex-1 flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest uppercase text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                        <img src={src} className="w-4 h-4" alt={label} />
                        {label}
                      </button>
                    ))}
                  </div>

                  <p className="text-center text-sm text-slate-500 mt-8 font-medium">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-700 font-black hover:underline underline-offset-4 decoration-2 decoration-blue-500/20">
                      Sign In
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      <PopupModal
        isOpen={socialPopup}
        type="info"
        title="Coming Soon"
        message="Social login is currently unavailable. Please register with your email and password."
        onClose={() => setSocialPopup(false)}
      />
    </div>
  );
}
