import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  HardHat, 
  FileText, 
  Bell, 
  Settings, 
  MessageSquare, 
  LogOut, 
  BookOpen, 
  GraduationCap, 
  Camera, 
  Mail, 
  Calendar,
  Sparkles,
  QrCode,
  Layers,
  DollarSign
} from 'lucide-react';
import logo from '../assets/images/logo.png';
import { useAuth } from '../hooks/useAuth';

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { title: "Report Cards", icon: FileText, path: "/admin/report-cards" },
    { title: "Report Card Settings", icon: Settings, path: "/admin/report-card/settings" },
    { title: "Timetable Matrix", icon: Calendar, path: "/admin/timetable" },
    { title: "Student Promotions", icon: Layers, path: "/admin/promotions" },
    { title: "User Management", icon: Users, path: "/admin/users" },
    { title: "Student Directory", icon: Users, path: "/admin/student" },
    { title: "Worker Management", icon: HardHat, path: "/admin/worker" },
    { title: "Academics & Classes", icon: BookOpen, path: "/admin/academics" },
    { title: "CBT Results & Controls", icon: BookOpen, path: "/admin/cbt-results" },
    { title: "Inquiries & Tours", icon: Mail, path: "/admin/inquiries" },
    { title: "Public Feedback", icon: MessageSquare, path: "/admin/feedback" },
    { title: "Admissions & Apps", icon: GraduationCap, path: "/admin/admissions" },
    { title: "Media Room", icon: Camera, path: "/admin/media" },
    { title: "System & Audit Logs", icon: FileText, path: "/admin/logs" },
    { title: "Finance & Fee Verifications", icon: DollarSign, path: "/admin/finance" },
    { title: "Broadcast Messages", icon: MessageSquare, path: "/admin/messages" },
    { title: "Notification Center", icon: Bell, path: "/admin/notifications" },
    { title: "School Settings", icon: Settings, path: "/admin/settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 h-screen bg-white flex flex-col border-r border-gray-100
        transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 shrink-0">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2 shadow-sm border border-blue-100 shrink-0">
            <img src={logo} alt="GHRA Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base font-black text-blue-950 tracking-tight block uppercase">GHRA</span>
            <span className="text-[10px] font-black text-sky-400 tracking-widest block uppercase">SHAPING YOUNG MINDS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 pt-4 overflow-y-auto">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 font-medium'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-xs">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:text-red-700 font-bold text-xs w-full transition-all hover:bg-red-50 rounded-xl cursor-pointer"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
