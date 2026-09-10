import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ title = "Dashboard", onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.full_name || 'Admin';
  const displayRole = user?.role === 'admin' ? 'Super Admin' : (user?.role || 'Admin');
  const profilePic = user?.profile_picture;

  return (
    <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-10 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-xl lg:hidden text-gray-600 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate max-w-[150px] md:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {/* Search - Hidden on mobile, can be made into a toggleable input if needed */}
        <div className="relative group hidden xl:block">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search here for anything..." 
            className="w-80 bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl py-3.5 pl-12 pr-12 text-sm text-gray-700 transition-all outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 items-center bg-white border border-gray-200 rounded-lg px-2 py-0.5 shadow-sm">
             <span className="text-[9px] font-black text-gray-400 opacity-70">⌘ K</span>
          </div>
        </div>

        {/* Notifications */}
        <button onClick={() => navigate('/admin/notifications')} className="p-2.5 md:p-3 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all text-gray-400 hover:text-blue-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 md:top-2.5 right-2 md:right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 md:gap-4 bg-gray-50 border border-gray-100 p-1.5 md:pr-4 rounded-3xl hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group"
          >
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/10 border-2 border-white ring-2 ring-blue-50 ring-offset-2 transition-all group-hover:scale-105">
               {profilePic ? (
                 <img src={profilePic} alt="admin" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                   <User className="w-5 h-5 text-blue-600" />
                 </div>
               )}
             </div>
             <div className="hidden md:flex flex-col">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">{displayName}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{displayRole}</p>
             </div>
             <ChevronDown className={`w-4 h-4 text-gray-400 ml-0 md:ml-2 group-hover:text-blue-600 transition-all ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                <p className="text-sm font-bold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-400">{user?.role || 'Admin'}</p>
              </div>
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account</p>
                <p className="text-sm font-bold text-slate-900">{user?.email || ''}</p>
              </div>
              <div className="py-1">
                <button 
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/admin/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 font-bold transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;

