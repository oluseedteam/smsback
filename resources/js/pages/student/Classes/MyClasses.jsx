import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Star, 
  BookOpen,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import MyClassRight from './MyClassRight';
import { getMyClasses } from '../../../services/classService';
import { getAssignments } from '../../../services/assignmentService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

// Color palette for subject cards
const COLORS = ['blue', 'purple', 'green', 'pink', 'orange', 'indigo', 'teal', 'rose'];
const getColor = (index) => COLORS[index % COLORS.length];

const colorMap = {
  blue:   { border: 'border-l-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-600',   btnBorder: 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white', progress: 'bg-blue-500',   topic: 'bg-blue-50/50 border-blue-200' },
  purple: { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', btnBorder: 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white', progress: 'bg-purple-500', topic: 'bg-purple-50/50 border-purple-200' },
  green:  { border: 'border-l-green-500',  bg: 'bg-green-50',  text: 'text-green-600',  btnBorder: 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white', progress: 'bg-green-500',  topic: 'bg-green-50/50 border-green-200' },
  pink:   { border: 'border-l-pink-500',   bg: 'bg-pink-50',   text: 'text-pink-600',   btnBorder: 'border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white', progress: 'bg-pink-500',   topic: 'bg-pink-50/50 border-pink-200' },
  orange: { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', btnBorder: 'border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white', progress: 'bg-orange-500', topic: 'bg-orange-50/50 border-orange-200' },
  indigo: { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', btnBorder: 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white', progress: 'bg-indigo-500', topic: 'bg-indigo-50/50 border-indigo-200' },
  teal:   { border: 'border-l-teal-500',   bg: 'bg-teal-50',   text: 'text-teal-600',   btnBorder: 'border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white', progress: 'bg-teal-500',   topic: 'bg-teal-50/50 border-teal-200' },
  rose:   { border: 'border-l-rose-500',   bg: 'bg-rose-50',   text: 'text-rose-600',   btnBorder: 'border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white', progress: 'bg-rose-500',   topic: 'bg-rose-50/50 border-rose-200' },
};

const MyClasses = () => {
  const [activeTab, setActiveTab] = useState('All Subjects');
  const [classes, setClasses] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [subjectScores, setSubjectScores] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classData, assignData] = await Promise.all([
          getMyClasses(),
          getAssignments()
        ]);
        setClasses(classData?.classes || []);
        setSchoolClasses(classData?.school_classes || []);
        setSubjectScores(classData?.subject_scores || []);
        const assignList = Array.isArray(assignData) ? assignData : (assignData?.data || []);
        setAssignments(assignList);
      } catch {
        console.error('Failed to fetch class data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Find the student's primary school class name
  const mySchoolClass = schoolClasses?.[0];
  const classLabel = mySchoolClass
    ? `${mySchoolClass.name} ${mySchoolClass.teacher ? '- ' + mySchoolClass.teacher.full_name : ''}`
    : 'My Class';

  // Get assignment count per subject for "homework" indicator
  const getAssignmentCount = (subjectTitle) => {
    return assignments.filter(a => 
      a.title?.toLowerCase().includes(subjectTitle.toLowerCase()) ||
      a.subject?.toLowerCase().includes(subjectTitle.toLowerCase())
    ).length;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0">
      {/* Main Content Area */}
      <div className="flex-1 space-y-8 min-w-0">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Classes 🍿</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm whitespace-nowrap">
                {classLabel} 👩‍🏫
              </span>
            </div>
          </div>
        </div>

        {/* Filters/Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {['All Subjects', 'My Favorites ⭐', "Today's Classes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-2 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 shadow-sm border whitespace-nowrap
                ${activeTab === tab 
                  ? 'bg-blue-600 text-white border-blue-600 sm:scale-105 shadow-blue-200' 
                  : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold text-lg">No classes yet</p>
            <p className="text-sm">Classes will appear here once your teacher assigns them.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 pb-8"
          >
            {classes.map((cls, index) => {
              const color = getColor(index);
              const c = colorMap[color];
              const stars = Math.min(10, Math.round((cls.avg_score || 0) / 10));
              const progress = Math.round(cls.avg_score || 0);
              const hwCount = getAssignmentCount(cls.title);

              return (
                <motion.div 
                  key={cls.id} 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 border-l-4 
                    ${c.border} hover:shadow-lg transition-all duration-300 group`}
                >
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`p-3 sm:p-4 rounded-xl ${c.bg} group-hover:scale-110 transition-transform`}>
                        <BookOpen className={`w-6 h-6 ${c.text}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">{cls.title}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">🧑‍🏫 {cls.teacher}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600 leading-none">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{cls.room || 'TBA'}</span>
                    </div>
                    {cls.schedule && (
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600 leading-none">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{cls.schedule}</span>
                      </div>
                    )}
                    
                    <div className={`p-2.5 sm:p-3 rounded-xl border border-dashed transition-colors duration-300 ${c.topic}`}>
                      <p className="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1 sm:mb-2">
                        {cls.school_class ? 'School Class' : 'Grade Level'}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">
                        {cls.school_class || cls.grade_level || cls.title}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 sm:mb-6">
                    <div className="flex justify-between text-[10px] items-center font-bold">
                      <span className="text-gray-500 uppercase">
                        {cls.total_assessments} Assessment{cls.total_assessments !== 1 ? 's' : ''}
                      </span>
                      <span className={c.text}>{progress}% Avg Score</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${c.progress}`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-6 sm:mb-8 overflow-x-auto no-scrollbar">
                    <span className="text-[9px] font-bold text-gray-400 mr-2 uppercase shrink-0">Stars:</span>
                    {[...Array(10)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-100'}`} 
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button className={`py-2 px-1 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold border-2 flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300 ${c.btnBorder}`}>
                      📚 <span className="hidden sm:inline">Materials</span>
                    </button>
                    <button className="py-2 px-1 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold bg-blue-900 border-2 border-transparent text-white hover:bg-black transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2">
                      📝 <span className="hidden sm:inline">Homework</span>
                      {hwCount > 0 && (
                        <span className="bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">{hwCount}</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Right Sidebar Component */}
      <div className="lg:w-80 w-full">
        <MyClassRight classes={classes} subjectScores={subjectScores} schoolClasses={schoolClasses} />
      </div>
    </div>
  );
};

export default MyClasses;
