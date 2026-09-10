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
  FiArrowLeft, 
  FiShield, 
  FiAlertCircle 
} from "react-icons/fi";
import { FaUserShield } from "react-icons/fa";

export default function AdminLogin() {
  const { login: loginUserToContext } = useAuth();
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await loginUser({ login: login, password, role: "admin" });
      loginUserToContext(data);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#090f1d] p-4 font-Dm-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mb-4 flex justify-between items-center px-1">
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md"
        >
          <FiArrowLeft className="text-blue-400" />
          <span>Regular Login</span>
        </Link>
        <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
          <FiShield /> Restricted Access
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl shadow-black/60 p-8 sm:p-9 text-slate-900 border border-slate-700/30"
      >
        <div className="flex flex-col items-center text-center mb-7">
          <Link to="/" className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center p-2 mb-4 border border-slate-200 shadow-md hover:scale-105 transition-transform">
            <img src={logo} alt="GHRA Logo" className="w-full h-full object-contain" />
          </Link>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <FaUserShield className="text-xs" />
            <span>Administrator Console</span>
          </div>

          <h1 
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Admin Portal Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Authorized personnel and executive staff only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <FiMail className="text-base" />
              </div>
              <input
                type="text"
                value={login}
                onChange={(e) => { setLogin(e.target.value); setError(""); }}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-300/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all"
                placeholder="admin@ghraschools.edu.ng"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline">
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
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full pl-10 pr-11 py-3.5 bg-slate-50 border border-slate-300/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
              </button>
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
            className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 sm:py-4 px-6 rounded-2xl text-sm shadow-xl shadow-blue-600/25 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Verifying Access…</span>
              </>
            ) : (
              <>
                <span>Sign In as Admin</span>
                <FiArrowRight className="text-base" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-7 pt-5 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Lost access credentials? Contact the Chief Technology Officer or System Admin.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

