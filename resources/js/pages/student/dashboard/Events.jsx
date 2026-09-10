import { Calendar, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import apiFetch from '../../../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const eventIcons = ['🦁', '📚', '🏃', '🎵', '🎨', '⚽', '🏫', '🎭'];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiFetch('/dashboard/summary');
        const upcoming = res.summary?.upcoming_events || [];
        const mapped = upcoming.map((ev, i) => ({
          title: ev.title,
          date: new Date(ev.start_time).toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' }),
          icon: eventIcons[i % eventIcons.length],
        }));
        setEvents(mapped);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const fallbackEvents = [
    { title: "No upcoming events", date: "Check back later", icon: "📅" },
  ];

  const displayEvents = events.length > 0 ? events : (loading ? [] : fallbackEvents);
  
  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
        <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-[#85a6cf]" strokeWidth={2.5}/>
            <h3 className="font-black text-xl text-[#0b3a72] uppercase tracking-tight">Upcoming Events</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-3.5">
              {displayEvents.map((ev, i) => (
                  <motion.div 
                      key={i} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100"
                  >
                      <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-2xl drop-shadow-sm">
                          {ev.icon}
                      </div>
                      <div>
                          <h4 className="font-black text-[14px] text-[#0b3a72] mb-0.5 uppercase tracking-tight">{ev.title}</h4>
                          <p className="text-[11.5px] font-bold text-gray-400">{ev.date}</p>
                      </div>
                  </motion.div>
              ))}
          </div>
        )}
    </motion.div>
  )
}

export default Events;
