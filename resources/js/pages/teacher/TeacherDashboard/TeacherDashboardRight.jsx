import React from 'react';
import { motion } from 'motion/react';
import { BarChart2, TrendingUp, Star } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const TeacherDashboardRight = ({ 
  quickActions = [], 
  performers = [], 
  performance = [] 
}) => {
  const navigate = useNavigate();

  const displayPerformers = performers || [];
  const displayPerformance = performance || [];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((a, i) => (
            <motion.button
              key={i}
                  onClick={() => a.path && navigate(a.path)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-colors"
            >
              <a.icon className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase text-center leading-tight tracking-tight">
                {a.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Class Performance */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <BarChart2 className="w-5 h-5 text-blue-600" /> Class Performance
        </h2>
        <div className="space-y-5">
          {displayPerformance.length > 0 ? displayPerformance.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-bold mb-1 text-gray-600">
                <span>{p.label}</span>
                <span className="text-blue-600">{p.display}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${p.color} rounded-full shadow-lg ${p.shadow}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.value}%` }}
                  transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                />
              </div>
            </div>
          )) : (
            <p className="text-xs text-gray-400 italic text-center py-4">No performance metrics available</p>
          )}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-blue-600" /> Top Performers This Week
        </h2>
        <div className="space-y-3">
          {displayPerformers.length > 0 ? displayPerformers.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                {s.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">{s.subject}</p>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{s.score}</span>
            </div>
          )) : (
            <p className="text-xs text-gray-400 italic text-center py-4">No performers recorded this week</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardRight;
