import React from 'react';
import logo from '../assets/images/logo.png';
import { BsTwitterX, BsFacebook, BsInstagram, BsYoutube } from 'react-icons/bs';
import { FaLocationDot, FaEnvelope, FaPhone, FaShieldHalved } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { useSchoolSettings } from '../context/SchoolSettingsContext';

const quickLinks = [
  { name: 'Home', path: '/' },
  { name: 'About Our School', path: '/about' },
  { name: 'Admissions & Enrollment', path: '/admissions' },
  { name: 'News & Events Hub', path: '/news' },
  { name: 'Parent & Alumni Feedback', path: '/feedback' },
  { name: 'Media & Press Room', path: '/media' },
  { name: 'Contact & Campus Visit', path: '/contact' },
  { name: 'Portal Sign In', path: '/login' },
];

const academicDivisions = [
  { name: 'Early Years (Crèche & Nursery)', path: '/admissions' },
  { name: 'Primary School (Grades 1-6)', path: '/admissions' },
  { name: 'Junior Secondary (JSS 1-3)', path: '/admissions' },
  { name: 'Senior Secondary (SSS 1-3)', path: '/admissions' },
];

const Footer = () => {
  const { settings } = useSchoolSettings();

  const socialLinks = [
    { icon: <BsFacebook />, href: settings?.facebook_url || 'https://facebook.com', label: 'Facebook' },
    { icon: <BsInstagram />, href: settings?.instagram_url || 'https://instagram.com', label: 'Instagram' },
    { icon: <BsTwitterX />, href: settings?.twitter_url || 'https://twitter.com', label: 'Twitter/X' },
    { icon: <BsYoutube />, href: settings?.youtube_url || 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className="bg-[#070F20] text-white font-Dm-sans mt-16 relative overflow-hidden border-t border-slate-800">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[250px] rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 w-[400px] h-[200px] rounded-full bg-amber-500/5 blur-3xl" />

      {/* Main Footer Links */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          {/* Column 1: School Identity */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
                <img src={logo} alt="GHRA logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-heading text-white">{settings?.school_name || "GHRA"}</h4>
                <p className="text-xs text-sky-400 font-bold uppercase tracking-wider">{settings?.motto || "SHAPING YOUNG MINDS"}</p>
              </div>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Providing holistic, world-class education rooted in academic distinction, strong moral values, leadership skills, and 21st-century technological literacy.
            </p>

            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
              <FaShieldHalved className="text-emerald-400 text-sm shrink-0" />
              <span>Fully Approved & Accredited Ministry of Education Standard</span>
            </div>

            {/* Social Links */}
            <div className="flex gap-2.5 pt-2">
              {socialLinks.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-200 text-sm"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-sky-400 font-heading">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Academic Divisions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-sky-400 font-heading">
              Academic Divisions
            </h4>
            <ul className="space-y-2.5">
              {academicDivisions.map((div) => (
                <li key={div.name}>
                  <Link
                    to={div.path}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>{div.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-sky-400 font-heading">
              Contact & Visit
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-300">
                <FaLocationDot className="text-blue-400 mt-1 shrink-0" />
                <span className="leading-snug">
                  {settings?.address || 'Bolorunduro Area, Beside Tipper Association Office, Oba Road, Okinni, Osogbo, Osun State, Nigeria'}
                </span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <FaPhone className="text-blue-400 shrink-0" />
                <a href={`tel:${(settings?.phone || '+234 814 435 3033').replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                  {settings?.phone || '+234 814 435 3033'}
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <FaEnvelope className="text-blue-400 shrink-0" />
                <a href={`mailto:${settings?.email || 'info@ghraschools.edu.ng'}`} className="hover:text-white transition-colors">
                  {settings?.email || 'info@ghraschools.edu.ng'}
                </a>
              </li>
              <li className="pt-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Visiting Hours:</span> {settings?.visiting_hours || 'Mon – Fri: 7:30 AM – 4:00 PM'}
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GHRA. All rights reserved.</p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link to="/about" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Child Safeguarding</Link>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Portal Sign In</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

