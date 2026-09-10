import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import apiFetch from '../../../services/api';

const StarStudent = () => {
    const [star, setStar] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStarStudent = async () => {
            try {
                const res = await apiFetch('/dashboard/summary');
                if (res.summary?.star_student) {
                    setStar(res.summary.star_student);
                }
            } catch (err) {
                console.log('Star student not found', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStarStudent();
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-[#ffc107] to-[#ff9800] p-6 rounded-3xl shadow-lg text-white text-center flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    const name = star?.full_name || 'No Star Yet';
    const picture = star?.profile_picture || 'https://i.pravatar.cc/150?img=11';
    const avgScore = star?.avg_score ? `${star.avg_score}% Avg` : 'Top Performer';

    return (
        <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-[#ffc107] to-[#ff9800] p-6 rounded-3xl shadow-lg text-white text-center flex flex-col items-center justify-center relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <motion.p 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-black mb-5 flex items-center gap-2 tracking-widest drop-shadow-md uppercase"
            >
                ⭐ Star Student ⭐
            </motion.p>
            
            <div className="relative mb-6">
                <motion.div 
                  initial={{ rotate: -10 }}
                  whileHover={{ rotate: 0, scale: 1.1 }}
                  className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm shadow-xl border border-white/30"
                >
                    <img
                        src={picture}
                        alt="Star Student"
                        className="w-[84px] h-[84px] object-cover rounded-xl shadow-inner"
                    />
                </motion.div>
                
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -left-6 top-0 text-sky-200 text-2xl drop-shadow-lg"
                >
                  ★
                </motion.div>
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="absolute -right-6 bottom-4 text-orange-100 text-xl drop-shadow-lg"
                >
                  ★
                </motion.div>
            </div>
            
            <motion.h4 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-black text-xl drop-shadow-lg uppercase tracking-tight"
            >
              {name}
            </motion.h4>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1 italic">{avgScore}</p>
        </motion.div>
    )
}

export default StarStudent;
