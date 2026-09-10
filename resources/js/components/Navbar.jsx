import React, { useState, useEffect } from "react";
import logo from "../assets/images/logo.png";
import { FiMenu, FiX, FiPhone, FiMail, FiArrowRight, FiLock } from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa6";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useSchoolSettings } from "../context/SchoolSettingsContext";

const Navbar = () => {
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }


  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const allNavLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Admissions", path: "/admissions" },
    { name: "News & Events", path: "/news" },
    { name: "Feedback", path: "/feedback" },
    { name: "Media Room", path: "/media" },
    { name: "Contact & Visit", path: "/contact" },
  ];

  const isAdmissionActive = Boolean(settings?.admission_enabled ?? true);
  const isCbtActive = Boolean(settings?.cbt_enabled ?? true);

  const navLinks = allNavLinks.filter(
    (link) => link.path !== "/admissions" || isAdmissionActive
  );

  const isLinkActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/admissions") return location.pathname.startsWith("/admission") || location.pathname === "/apply";
    if (path === "/news") return location.pathname.startsWith("/news");
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 font-Dm-sans transition-all duration-300">
        
        {/* ── Top Utility Announcement Bar ────────────────────────────────────────── */}
        <div
          className={`bg-[#060D1A] text-slate-300 text-xs border-b border-white/10 transition-all duration-300 overflow-hidden ${
            scrolled ? "max-h-0 py-0 opacity-0 -translate-y-2" : "max-h-12 py-1.5 px-4 sm:px-8 opacity-100 translate-y-0"
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
              {isAdmissionActive ? (
                <Link
                  to="/admissions"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold tracking-wide transition-colors text-xs whitespace-nowrap"
                >
                  <FaGraduationCap className="text-sm shrink-0" />
                  <span>Admissions Open 2025/2026 Session →</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sky-400 font-semibold tracking-wide text-xs whitespace-nowrap">
                  <FaGraduationCap className="text-sm shrink-0" />
                  <span>Welcome to {settings?.school_name || 'GHRA'} • Shaping Young Minds</span>
                </span>
              )}

              <span className="hidden md:inline-block text-white/20">•</span>
              <a
                href={`tel:${(settings?.phone || '+234 814 435 3033').replace(/\s+/g, '')}`}
                className="hidden md:inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors text-xs whitespace-nowrap"
              >
                <FiPhone className="text-blue-400 text-xs shrink-0" />
                <span>{settings?.phone || '+234 814 435 3033'}</span>
              </a>
              <span className="hidden lg:inline-block text-white/20">•</span>
              <a
                href={`mailto:${settings?.email || 'info@ghraschools.edu.ng'}`}
                className="hidden lg:inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors text-xs whitespace-nowrap"
              >
                <FiMail className="text-blue-400 text-xs shrink-0" />
                <span>{settings?.email || 'info@ghraschools.edu.ng'}</span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-sky-300 font-medium transition-colors text-xs whitespace-nowrap"
              >
                <FiLock className="text-xs text-blue-400 shrink-0" />
                <span>Portal Sign In</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Floating Pill Navbar Container ────────────────────────────────────────── */}
        <div className={`max-w-7xl 2xl:max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 transition-all duration-300 ${
          scrolled ? "pt-2 pb-1 sm:pt-2.5 sm:pb-1.5" : "pt-2.5 sm:pt-3.5 pb-2"
        }`}>
          <nav className="relative flex items-center justify-between px-3 sm:px-4 lg:px-5 xl:px-6 py-2 sm:py-2.5 rounded-full bg-[#0B1528]/95 border border-blue-500/20 backdrop-blur-xl shadow-2xl shadow-black/40 text-white transition-all duration-300">
            
            {/* ── Brand Logo & Title ────────────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 pl-0.5">
              <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 xl:h-10 xl:w-10 rounded-xl bg-white p-1 shadow-md border border-white/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <img src={logo} alt="GHRA Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm xl:text-base font-extrabold tracking-tight leading-none text-white font-heading group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  GHRA
                </span>
                <span className="text-[8px] sm:text-[9px] xl:text-[9.5px] font-bold tracking-[0.14em] uppercase text-sky-400 leading-tight mt-0.5 whitespace-nowrap">
                  SHAPING YOUNG MINDS
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav Links (Single line, strictly no wrapping) ──────── */}
            <ul className="hidden lg:flex items-center gap-2.5 xl:gap-5 2xl:gap-7 text-[12px] xl:text-[13px] 2xl:text-sm font-semibold tracking-normal mx-2">
              {navLinks.map((link) => {
                const active = isLinkActive(link.path);
                return (
                  <li key={link.path} className="shrink-0">
                    <NavLink
                      to={link.path}
                      className={`relative py-1.5 px-1 xl:px-1.5 transition-all duration-200 inline-block whitespace-nowrap ${
                        active
                          ? "text-blue-500 font-bold"
                          : "text-slate-200 hover:text-white hover:scale-102"
                      }`}
                    >
                      <span className="whitespace-nowrap">{link.name}</span>
                      {active && (
                        <motion.span
                          layoutId="activeNavPillUnderline"
                          className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-blue-500 rounded-full shadow-sm shadow-blue-500/50"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            {/* ── Right Action Buttons (Desktop) ───────────────────────────── */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0 pr-0.5">
              {/* CBT Portal Link (if enabled) */}
              {isCbtActive && (
                <Link
                  to="/cbt/login"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] xl:text-xs font-bold px-3 xl:px-4 py-1.5 xl:py-2 rounded-full border border-emerald-400/30 transition-all duration-200 active:scale-95 shadow-md shadow-emerald-600/20 whitespace-nowrap shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="whitespace-nowrap">CBT Portal</span>
                </Link>
              )}

              {/* Portal Login Button */}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] xl:text-xs font-bold px-3.5 xl:px-4.5 py-1.5 xl:py-2 rounded-full shadow-lg shadow-blue-600/40 hover:shadow-blue-500/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <span className="whitespace-nowrap">Portal Login</span>
                <FiArrowRight className="text-xs xl:text-sm shrink-0" />
              </Link>
            </div>

            {/* ── Mobile/Tablet Controls (< 1024px) ────────────────────────── */}
            <div className="flex items-center gap-2 lg:hidden pr-0.5 shrink-0">
              {isCbtActive && (
                <Link
                  to="/cbt/login"
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>CBT</span>
                </Link>
              )}

              {/* Quick Portal Login Pill on Mobile/Tablet */}
              <Link
                to="/login"
                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md shadow-blue-600/30 transition-all whitespace-nowrap shrink-0"
              >
                <span>Portal</span>
                <FiArrowRight className="text-xs shrink-0" />
              </Link>

              {/* Hamburger Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition cursor-pointer flex items-center justify-center shrink-0"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
              </button>
            </div>

          </nav>
        </div>
      </header>

      {/* ── Mobile & Tablet Drawer Menu ────────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden font-Dm-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute top-0 right-0 w-[88%] max-w-sm h-full bg-[#0B1528] border-l border-white/10 text-white p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              <div>
                {/* Header inside drawer */}
                <div className="flex items-center justify-between pb-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-white p-1 rounded-xl flex items-center justify-center shadow-md shrink-0">
                      <img src={logo} alt="GHRA Logo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white font-heading whitespace-nowrap">GHRA</h3>
                      <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider whitespace-nowrap">
                        SHAPING YOUNG MINDS
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
                    aria-label="Close menu"
                  >
                    <FiX className="text-lg" />
                  </button>
                </div>

                {/* Nav links */}
                <nav className="mt-6 flex flex-col gap-1.5">
                  {navLinks.map((link) => {
                    const active = isLinkActive(link.path);
                    return (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                          active
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="whitespace-nowrap">{link.name}</span>
                        <FiArrowRight className={`text-xs shrink-0 ${active ? "opacity-100" : "opacity-40"}`} />
                      </NavLink>
                    );
                  })}
                </nav>

                {/* Quick Info Box (Admissions) */}
                {isAdmissionActive && (
                  <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-sky-400 font-bold">
                      <FaGraduationCap className="text-sm shrink-0" />
                      <span className="whitespace-nowrap">2025/2026 Admissions Open</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Crèche, Nursery, Primary, and Secondary placements currently open.
                    </p>
                    <Link
                      to="/admissions"
                      onClick={() => setIsMenuOpen(false)}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold transition whitespace-nowrap"
                    >
                      <span>Begin Online Application</span>
                      <FiArrowRight className="text-xs shrink-0" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                {isCbtActive && (
                  <Link
                    to="/cbt/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl border border-emerald-500/30 flex items-center justify-center gap-2 text-xs transition-all whitespace-nowrap shadow-md shadow-emerald-900/20"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Access CBT Examination Portal</span>
                  </Link>
                )}

                {isAdmissionActive && (
                  <Link
                    to="/admissions"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-3 px-4 bg-[#14223A] hover:bg-[#1C2E4C] text-white font-bold rounded-2xl border border-white/15 flex items-center justify-center gap-2 text-xs transition-all whitespace-nowrap"
                  >
                    <FaGraduationCap className="text-sm text-sky-400 shrink-0" />
                    <span>Apply for Admission</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <FiLock className="text-sm shrink-0" />
                  <span>Sign In to School Portal</span>
                </button>

                <div className="text-center pt-1">
                  <a
                    href="tel:+2348144353033"
                    className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <FiPhone className="text-blue-400 text-xs shrink-0" />
                    <span>+234 814 435 3033</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
