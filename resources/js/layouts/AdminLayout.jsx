import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AdminLogin from '../pages/auth/AdminLogin';
import { useAuth } from '../hooks/useAuth';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed on mobile
  const location = useLocation();
  const { user } = useAuth();

  // Helper to get title from path (can be expanded)
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/inquiries')) return "Contact & Tour Inquiries 📬";
    if (path.includes('/admin/admissions')) return "Admissions & Applications 📋";
    if (path.includes('/admin/student')) return "Students 🧑‍🎓";
    if (path.includes('/admin/worker')) return "Staff & Workers 👷";
    if (path.includes('/admin/financial') || path.includes('/admin/finance')) return "Financial Reports 📈";
    if (path.includes('/admin/notifications')) return "Notifications 🔔";
    if (path.includes('/admin/settings')) return "Global Settings ⚙️";
    if (path.includes('/admin/feedback')) return "Public Feedback & Testimonials 💬";
    if (path.includes('/admin/dispute')) return "Feedback & Disputes 💬";
    if (path.includes('/admin/profile')) return "My Profile 👤";
    return "Dashboard OVERVIEW 📊";

  };

  if (!user || user.role !== 'admin') {
    return <AdminLogin />;
  }

  return (
    <div className="flex h-screen bg-[#F7F9FB] overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader 
          title={getPageTitle()} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 font-Dm-sans">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
