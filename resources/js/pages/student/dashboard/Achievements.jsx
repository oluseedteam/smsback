import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import apiFetch from '../../../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const Achievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [achievementPoints, setAchievementPoints] = useState(0);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await apiFetch('/dashboard/summary');
                const summary = res.summary;
                const earned = [];

                // Dynamic: Check grades
                if (summary?.average_score_percent >= 80) {
                    earned.push({ title: "Honor\nRoll", icon: "🏆", bg: "bg-yellow-100" });
                }

                // Dynamic: Check attendance
                if (summary?.attendance_rate >= 95) {
                    earned.push({ title: "Perfect\nAttendance", icon: "✅", bg: "bg-green-100" });
                }

                // Dynamic: Check subjects tracked
                if (summary?.subjects_tracked >= 5) {
                    earned.push({ title: "Subject\nExplorer", icon: "🔬", bg: "bg-blue-100" });
                }

                setAchievements(earned.slice(0, 3));
                setAchievementPoints(summary?.achievement_points || 0);
            } catch {
                setAchievements([]);
            }
        };
        fetch();
    }, []);

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-xl drop-shadow-sm">⭐</span>
                    <h3 className="font-black text-xl text-[#0b3a72] uppercase tracking-tight">My Achievements</h3>
                </div>
                {achievementPoints > 0 && (
                  <span className="text-xs font-bold bg-sky-100 text-sky-700 px-3 py-1 rounded-full">
                    {achievementPoints} pts
                  </span>
                )}
            </div>

            {achievements.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-5">No achievements have been earned yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((ach, i) => (
                    <motion.div 
                        key={i} 
                        variants={itemVariants}
                        whileHover={{ y: -5, scale: 1.05 }}
                        className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100"
                    >
                        <div className={`w-[46px] h-[46px] rounded-full ${ach.bg} flex items-center justify-center text-xl mb-3 shadow-inner group-hover:scale-110 transition-transform`}>
                            {ach.icon}
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-black text-[#0b3a72] text-center whitespace-pre-line leading-tight uppercase tracking-tight">
                            {ach.title}
                        </p>
                    </motion.div>
                ))}
              </div>
            )}
        </motion.div>
    )
}

export default Achievements;
