import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/images/logo.png';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  CalendarCheck,
  Mail,
  Library,
  User,
  X,
  Laptop,
  DollarSign,
  MessageSquare,
  LogOut,
  Calendar
} from "lucide-react";
import apiFetch from '../services/api';
import { useSchoolSettings } from '../context/SchoolSettingsContext';

const Sidebar = ({ onClose }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { settings } = useSchoolSettings();
    const isCbtActive = Boolean(settings?.cbt_enabled ?? true);
    const [achievementPoints, setAchievementPoints] = useState(0);

    const handleLogout = () => {
      logout();
      navigate('/login');
    };

    useEffect(() => {
      const fetchPoints = async () => {
        try {
          const res = await apiFetch('/dashboard/summary');
          if (res.summary?.achievement_points !== undefined) {
            setAchievementPoints(res.summary.achievement_points);
          }
        } catch {
          console.log('Could not fetch achievement points');
        }
      };
      fetchPoints();
    }, []);

    const dashboardOptions = [
        {
            title: "Dashboard",
            icon: LayoutDashboard,
            path: "/student"
        },
        {
            title: "My Classes & Timetable",
            icon: BookOpen,
            path: "/student/my-classes"
        },
        {
            title: "Course Registration",
            icon: ClipboardList,
            path: "/student/course-registration"
        },
        {
            title: "Assignments",
            icon: ClipboardList,
            path: "/student/homework"
        },
        {
            title: "Report Card & Grades",
            icon: BarChart3,
            path: "/student/grade"
        },
        {
            title: "Attendance",
            icon: CalendarCheck,
            path: "/student/attendance"
        },
        {
            title: "Messages",
            icon: Mail,
            path: "/student/messages"
        },
        {
            title: "Digital Library",
            icon: Library,
            path: "/student/library"
        },
        {
            title: "CBT Exams",
            icon: Laptop,
            path: "/student/cbt"
        },
        {
            title: "Finance & Fees",
            icon: DollarSign,
            path: "/student/finance"
        },
        {
            title: "Dispute & Feedback",
            icon: MessageSquare,
            path: "/student/dispute"
        },
        {
            title: "My Profile & ID Card",
            icon: User,
            path: "/student/profile"
        }
    ].filter(item => item.path !== '/student/cbt' || isCbtActive);

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
            {dashboardOptions.map((item, index) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={index}
                        to={item.path}
                        end={item.path === '/student'}
                        onClick={() => { if(onClose) onClose() }}
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

        {/* Quick Points Box */}
        {achievementPoints > 0 && (
          <div className="bg-sky-50/80 border border-sky-200 p-3 rounded-xl mb-4 shrink-0">
            <p className="text-[11px] font-bold text-sky-900 uppercase">Achievement Points</p>
            <p className="text-lg font-black text-sky-700">{achievementPoints} pts</p>
          </div>
        )}

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

export default Sidebar;
