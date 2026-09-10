import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FB] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-xl border border-gray-100"
      >
        <h1 className="text-9xl font-black text-blue-900 mb-4 opacity-10">404</h1>
        <div className="relative -mt-20 mb-8">
          <span className="text-6xl">🔭</span>
        </div>
        <h2 className="text-2xl font-black text-blue-900 italic tracking-tight mb-4">Page Not Found</h2>
        <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed uppercase tracking-wider">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
