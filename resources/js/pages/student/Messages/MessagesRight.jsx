import React, { useState, useEffect } from 'react';
import { Zap, Bell, Users, ShieldCheck, ChevronRight, MessageCircle } from 'lucide-react';
import apiFetch from '../../../services/api';
import { motion } from 'framer-motion';

const MessagesRight = ({ teachers = [], onMessage }) => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await apiFetch('/messages?sender_type=admin');
        setAnnouncements((res.data || res).slice(0, 3));
      } catch (e) {
        console.error(e);
      }
    };
    fetchAnnouncements();
  }, []);

  const safetyTips = [
    'Always be respectfull to teachers',
    'Report any issues to the school admin',
    'Stay helpful to fellow students',
  ];

  return (
    <div className="space-y-6">
      {/* Quick Status */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-4xl p-8 text-white shadow-xl shadow-blue-500/10">
        <h3 className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">Message Portal</h3>
        <p className="text-xl font-black mb-6">Stay connected with your Academic Mentors</p>
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Response</p>
              <p className="text-lg font-black tracking-tight">Fast</p>
           </div>
           <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Encrypted</p>
              <p className="text-lg font-black tracking-tight">AES-256</p>
           </div>
        </div>
      </div>

      {/* My Teachers */}
      <div className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-200/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">My Teachers</h3>
          </div>
          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">{teachers.length} Active</span>
        </div>
        <div className="space-y-2.5">
          {teachers.map((teacher) => (
            <motion.div 
              key={teacher.id}
              whileHover={{ x: 4 }}
              onClick={() => onMessage?.(teacher.id)}
              className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-indigo-600 text-xs border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                  {teacher.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{teacher.full_name}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Now</p>
                </div>
              </div>
              <MessageCircle className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </motion.div>
          ))}
          {teachers.length === 0 && (
             <div className="p-8 text-center text-gray-400">
                <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">No teachers found</p>
             </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-200/40">
        <div className="flex items-center gap-2.5 mb-6">
          <Bell className="w-5 h-5 text-orange-500" />
          <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">Broadcasts</h3>
        </div>
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item.id} className="relative pl-6 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-orange-100 before:rounded-full">
              <p className="text-[11px] font-black text-gray-800 uppercase tracking-tight mb-1">From Admin</p>
              <p className="text-[10px] font-medium text-gray-400 leading-normal mb-2 line-clamp-3">{item.content}</p>
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))}
          {announcements.length === 0 && (
             <p className="text-[10px] font-bold text-gray-400 italic text-center py-4">No recent broadcasts</p>
          )}
        </div>
      </div>

      {/* Safety Reminder */}
      <div className="bg-blue-50 rounded-4xl p-6 border border-blue-100 group overflow-hidden relative">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-100 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
        <div className="flex items-center gap-3 mb-4 relative">
          <div className="p-2 bg-blue-600 rounded-xl">
             <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-blue-900 uppercase tracking-widest text-[11px]">Etiquette</h3>
        </div>
        <div className="space-y-3 relative">
          {safetyTips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-tight leading-normal">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessagesRight;
