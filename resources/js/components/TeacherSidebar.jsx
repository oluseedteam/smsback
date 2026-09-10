import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/images/logo.png';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  BookMarked,
  CalendarCheck,
  Mail,
  Calendar,
  Library,
  User,
  X,
  UserPlus,
  Laptop,
  MessageSquare,
  LogOut,
  GraduationCap
} from "lucide-react";

import { useSchoolSettings } from '../context/SchoolSettingsContext';

const TeacherSidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { settings } = useSchoolSettings();
  const isCbtActive = Boolean(settings?.cbt_enabled ?? true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { title: "Dashboard",    icon: LayoutDashboard, path: "/teacher",                 always: true },
    { title: "My Classes",   icon: BookOpen,        path: "/teacher/my-classes",      always: true },
    { title: "Students",     icon: Users,           path: "/teacher/students",         always: true },
    { title: "Add Students", icon: UserPlus,        path: "/teacher/create-students",  perm: "can_create_students" },
    { title: "Assignments",  icon: ClipboardList,   path: "/teacher/assignments",      always: true },
    { title: "CBT Exams",    icon: Laptop,          path: "/teacher/cbt",              always: true, condition: isCbtActive },
    { title: "Gradebook",    icon: BookMarked,      path: "/teacher/gradebook",        always: true },
    { title: "Attendance",   icon: CalendarCheck,   path: "/teacher/attendance",       always: true },
    { title: "Messages",     icon: Mail,            path: "/teacher/messages",         always: true },
    { title: "Timetable / Calendar", icon: Calendar, path: "/teacher/calendar",        always: true },
    { title: "Library Resources", icon: Library,    path: "/teacher/resources",        always: true },
    { title: "Dispute & Feedback", icon: MessageSquare, path: "/teacher/dispute",        always: true },
    { title: "Profile & ID Card", icon: User,        path: "/teacher/profile",          always: true },
  ];

  // Filter based on permissions and feature flags
  const navItems = allNavItems.filter(item => {
    if (item.condition === false) return false;
    return item.always || (item.perm && user?.[item.perm]);
  });

  return (
    <div className='w-64 h-full bg-white shadow-md p-5 flex flex-col overflow-y-auto'>
      {/* Logo Section */}
      <div className='w-full flex flex-col items-center mb-6 shrink-0 relative'>
        {onClose && (
          <button onClick={onClose} className="absolute -right-1 -top-1 md:hidden text-gray-500 hover:text-gray-700 bg-gray-100 p-1.5 rounded-xl z-10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className='w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center p-2 mb-2 shadow-sm border border-blue-100'>
          <img src={logo} alt="GHRA Logo" className='w-full h-full object-contain' />
        </div>
        <h1 className="text-sm font-black text-blue-950 uppercase tracking-tight text-center leading-tight">
          GHRA
        </h1>
        <p className="text-[10px] font-black text-sky-400 tracking-widest uppercase mt-0.5">
          SHAPING YOUNG MINDS
        </p>
        <div className="w-12 h-0.5 bg-blue-100 mt-3 rounded-full" />
      </div>

      <nav className='space-y-1 flex-1'>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              end={item.path === '/teacher'}
              onClick={() => { if (onClose) onClose(); }}
              className={({ isActive }) =>
                `block p-2 rounded-lg cursor-pointer transition-all duration-200 border-blue-600 ` +
                (isActive
                  ? 'bg-blue-50 border-l-4 text-blue-600'
                  : 'hover:bg-blue-50/50 hover:border-l-4 border-l-transparent text-gray-500')
              }
            >
              {({ isActive }) => (
                <div className={`flex items-center gap-3 px-2 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                    {item.title}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className='pt-4 border-t border-gray-100 shrink-0 mt-auto'>
        <button
          onClick={handleLogout}
          className='w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm'
        >
          <LogOut className='w-4 h-4' />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default TeacherSidebar;