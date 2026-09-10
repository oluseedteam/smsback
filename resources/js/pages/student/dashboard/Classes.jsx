import React, { useState, useEffect } from 'react';
import { getCalendarEvents } from '../../../services/calendarService';
import { Loader2 } from 'lucide-react';

const Classes = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await getCalendarEvents();
                // We only want today's classes
                const today = new Date().toISOString().split('T')[0];
                const todayEvents = (res.data || res || []).filter(ev => 
                  ev.start_time && ev.start_time.startsWith(today)
                );
                
                // Map to required structure
                const mapped = todayEvents.map((ev, i) => {
                  const s = new Date(ev.start_time);
                  const e = new Date(ev.end_time);
                  const time = `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  const colors = [
                    "bg-yellow-100 border-yellow-500",
                    "bg-purple-100 border-purple-500",
                    "bg-blue-100 border-blue-500",
                    "bg-green-100 border-green-500",
                    "bg-pink-100 border-pink-500"
                  ];
                  return { title: ev.title, time, color: colors[i % colors.length] };
                });
                
                setClasses(mapped);
            } catch (err) {
                console.error("Failed to fetch classes", err);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

  return (
    <div className="bg-white p-5 rounded-xl shadow min-h-[250px]">
          <h3 className="font-semibold mb-4 text-[#1e3a8a] text-xl">Today's Classes</h3>
          
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : classes.length === 0 ? (
             <div className="text-gray-400 text-center italic mt-10">No classes scheduled for today!</div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 transition-transform hover:scale-[1.02] cursor-pointer ${cls.color}`}
                >
                  <p className="text-sm text-gray-600">{cls.time}</p>
                  <h4 className="font-semibold">{cls.title}</h4>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}

export default Classes