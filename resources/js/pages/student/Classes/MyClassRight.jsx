import React from 'react';
import { Star, Trophy, Calendar } from 'lucide-react';

const REWARD_COLORS = [
  'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 
  'bg-blue-400', 'bg-green-400', 'bg-purple-400',
  'bg-pink-400', 'bg-teal-400'
];

const SUBJECT_PILL_COLORS = [
  'bg-orange-100 text-orange-600',
  'bg-purple-100 text-purple-600',
  'bg-green-100 text-green-600',
  'bg-blue-100 text-blue-600',
  'bg-pink-100 text-pink-600',
  'bg-teal-100 text-teal-600',
  'bg-indigo-100 text-indigo-600',
  'bg-rose-100 text-rose-600',
];

const MyClassRight = ({ classes = [] }) => {

  // Find favorite subject (highest avg score)
  const bestSubject = classes.length > 0
    ? [...classes].sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0))[0]
    : null;

  // Build schedule from classes (group by day of week if schedule exists)
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const schedule = DAYS.map(day => ({
    day,
    classes: classes
      .filter(c => c.schedule?.toLowerCase().includes(day.toLowerCase().substring(0, 3)))
      .map((c, i) => ({
        name: c.title?.split(' ')[0] || c.title, // Abbreviated name
        color: SUBJECT_PILL_COLORS[i % SUBJECT_PILL_COLORS.length]
      }))
  })).filter(d => d.classes.length > 0);

  // If no schedule data, auto-distribute subjects across days
  const fallbackSchedule = schedule.length === 0 && classes.length > 0;
  const displaySchedule = fallbackSchedule
    ? DAYS.map((day, dayIdx) => ({
        day,
        classes: classes
          .filter((_, i) => (i + dayIdx) % 2 === 0 || classes.length <= 3)
          .slice(0, 4)
          .map((c, i) => ({
            name: c.title?.length > 10 ? c.title.substring(0, 8) + '..' : c.title,
            color: SUBJECT_PILL_COLORS[i % SUBJECT_PILL_COLORS.length]
          }))
      }))
    : schedule;

  // Build rewards from subject scores or class data
  const rewards = classes
    .filter(c => c.avg_score > 0)
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, 6)
    .map((c, i) => ({
      subject: c.title,
      score: Math.round(c.avg_score / 10), // Convert to star-like scale
      color: REWARD_COLORS[i % REWARD_COLORS.length],
    }));

  return (
    <div className="space-y-6">
      {/* My Favorite Subject */}
      <div className="bg-green-500 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        <h3 className="text-sm font-semibold mb-4 flex items-center justify-center gap-2">
          ⭐ My Favorite Subject ⭐
        </h3>
        <div className="bg-white/20 p-4 rounded-xl inline-block mb-4 backdrop-blur-sm">
           <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-1">
          {bestSubject?.title || 'No Data Yet'}
        </h2>
        <p className="text-xs text-green-100">
          {bestSubject ? `${bestSubject.avg_score}% Average Score` : 'Complete assignments to see your top subject!'}
        </p>
      </div>

      {/* My Class Schedule */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-gray-800">My Class Schedule</h3>
        </div>
        
        {displaySchedule.length > 0 ? (
          <div className="space-y-4">
            {displaySchedule.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-xs font-bold text-gray-500">{item.day}</span>
                <div className="flex flex-wrap gap-2">
                  {item.classes.map((cls, cIdx) => (
                    <span key={cIdx} className={`${cls.color} text-[10px] px-2 py-1 rounded-md font-bold`}>
                      {cls.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No schedule data available yet.</p>
        )}
      </div>

      {/* Class Rewards */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-gray-800">Class Rewards</h3>
        </div>
        
        {rewards.length > 0 ? (
          <div className="space-y-4">
            {rewards.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700">{item.subject}</span>
                  <span className="text-gray-900 border-b border-gray-200">⭐ {item.score}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full`} 
                    style={{ width: `${(item.score / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Complete assessments to earn rewards!</p>
        )}
      </div>
    </div>
  );
};

export default MyClassRight;
