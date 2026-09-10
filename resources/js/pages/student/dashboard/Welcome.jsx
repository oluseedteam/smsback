import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from "../../../hooks/useAuth";
import apiFetch from "../../../services/api";
import { Link } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1, y: 0,
        transition: { staggerChildren: 0.1, duration: 0.6, ease: "easeOut" }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
};

const Welcome = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiFetch('/dashboard/summary');
        setSummary(res.summary);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSummary();
  }, []);

  const info = [
      { label: 'Average Score', value: summary ? `${summary.average_score_percent}%` : '...', icon: '⭐' }, 
      { label: 'Registered Subjects', value: summary ? summary.registered_subjects : '...', icon: '📚' },
      { label: 'Upcoming CBT', value: summary ? summary.upcoming_cbt_exams : '...', icon: '💻' },
      { label: 'Report Cards', value: summary ? summary.report_card_count : '...', icon: '📄' }
  ];

  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className='bg-[#0b4b8a] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-white/5 relative overflow-hidden'
    >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        
        <motion.div variants={itemVariants} className="relative">
            <h2 className='text-2xl sm:text-3xl font-black mb-2 uppercase tracking-tight'>
              Welcome back, {user?.full_name || "Student"}! 👋
            </h2>
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <p className='text-xs sm:text-[15px] opacity-90 font-bold'>
                {summary?.current_session ? `${summary.current_session} • ${summary.current_term || 'Current term'}` : 'Academic session information is not available yet.'}
              </p>
              <Link to="/student/report-card" className="inline-flex items-center rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-300">
                View Report Cards
              </Link>
            </div>
        </motion.div>

        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 relative'>
            {info.map((item, index) => {
                return (
                    <motion.div 
                        key={index} 
                        variants={itemVariants}
                        whileHover={{ y: -5, scale: 1.02, backgroundColor: "#3d7cc2" }}
                        className='bg-[#2c65a6] p-4 sm:p-5 rounded-2xl text-center flex flex-col items-center cursor-pointer shadow-md border border-white/10 transition-colors'
                    >
                        <div className="text-2xl sm:text-3xl mb-3 sm:mb-4 drop-shadow-lg">{item.icon}</div>
                        <span className='font-black text-xl sm:text-2xl mb-1'>
                            {item.value}
                        </span>
                        <span className='text-[10px] font-black uppercase text-blue-100/60 tracking-wider'>
                            {item.label}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    </motion.div>
  )
}

export default Welcome;
