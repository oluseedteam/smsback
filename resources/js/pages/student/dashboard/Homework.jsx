import React, { useState, useEffect } from 'react';
import { CalendarDays, ListTodo, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getAssignments } from '../../../services/assignmentService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const Homework = () => {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const res = await getAssignments();
        const data = res.data || res || [];
        
        const mapped = data.map((hw, idx) => {
          const isUrgent = new Date(hw.due_date) < new Date(Date.now() + 86400000);
          const colors = [
            { border: "border-orange-400", bg: "bg-orange-400", statusBg: "bg-orange-50", text: "text-orange-500", dot: "bg-orange-500" },
            { border: "border-purple-600", bg: "bg-purple-600", statusBg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-600" },
            { border: "border-green-500", bg: "bg-green-500", statusBg: "bg-orange-50", text: "text-orange-500", dot: "bg-orange-500" }
          ];
          const theme = colors[idx % colors.length];

          return {
            id: hw.id,
            head: hw.subject?.name || 'General',
            title: hw.title,
            btn: hw.status === 'active' ? 'Start' : 'View',
            info: `Due ${new Date(hw.due_date).toLocaleDateString()}`,
            theme: { border: theme.border, badgeBg: theme.bg },
            urgent: isUrgent,
            status: hw.status === 'active' ? "To Do" : hw.status,
            statusTheme: { bg: theme.statusBg, text: theme.text, dot: theme.dot }
          };
        }).slice(0, 5); // display top 5

        setHomework(mapped);
      } catch (err) {
        console.error("Failed to fetch homework", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomework();
  }, []);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[300px]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-xl">
          <ListTodo className="w-5 h-5 text-blue-800" strokeWidth={2.5} />
        </div>
        <h3 className="font-black text-xl text-[#1e3a8a] uppercase tracking-tight">My Homework</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : homework.length === 0 ? (
        <div className="text-gray-400 text-center italic py-10 font-medium">No homework assigned!</div>
      ) : (
        <div className="space-y-4">
          {homework.map((hw) => (
            <motion.div
              key={hw.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, x: -5 }}
              className={`flex justify-between items-center p-5 rounded-2xl bg-slate-50 border-l-4 transition-all cursor-pointer hover:shadow-md hover:bg-white ${hw.theme.border}`}
            >
              <div className="flex flex-col items-start gap-2.5">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-widest ${hw.theme.badgeBg}`}>
                  {hw.head}
                </span>
                <h4 className="font-black text-base text-[#1e3a8a] uppercase tracking-tight leading-tight">
                  {hw.title}
                </h4>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold ${hw.urgent ? 'text-red-500' : 'text-gray-400'}`}>
                    <CalendarDays className="w-3.5 h-3.5 opacity-60" strokeWidth={2.5} />
                    {hw.info}
                  </span>
                  <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${hw.statusTheme.bg} ${hw.statusTheme.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${hw.statusTheme.dot}`}></span>
                    {hw.status}
                  </span>
                </div>
              </div>
              <button className="bg-[#0a5c9a] hover:bg-black transition-all text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-md active:scale-95">
                {hw.btn}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Homework;
