import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  ChevronRight, 
  FileText, 
  BookOpen, 
  FlaskConical, 
  Calculator, 
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  Star,
  Info,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import HomeworkRight from './HomeworkRight';
import { getAssignments } from '../../../services/assignmentService';
import AssignmentSubmissionModal from './AssignmentSubmissionModal';
import PopupModal from '../../../components/PopupModal';

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

const Homework = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const fetchHomework = async () => {
    try {
      const res = await getAssignments();
      setAssignments(res.data || res);
    } catch (error) {
      console.error("Failed to fetch homework:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, []);

  const handleOpenAssignment = (item) => {
    setSelectedAssignment(item);
    setIsSubmitModalOpen(true);
  };

  const getStatusColor = (status, score) => {
    if (score !== null && score !== undefined) return 'bg-green-100 text-green-700 border-green-200';
    switch (status) {
      case 'active': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'completed': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 sm:px-4 lg:px-0 scroll-smooth">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 space-y-6 sm:space-y-8 min-w-0"
      >
        <div className="space-y-6 pb-20">
          {assignments.map((item) => (
            <motion.div 
              key={item.id} 
              variants={itemVariants}
              className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group relative overflow-hidden`}
            >
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(item.status, item.submission?.score)}`}>
                  {item.submission?.score !== null && item.submission?.score !== undefined ? `Graded: ${item.submission.score}/${item.max_score || 100}` : item.status}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
                <div className="p-4 rounded-xl h-fit w-fit bg-blue-50">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-xl font-black text-gray-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-500 text-white">
                      {item.subject?.name || 'General'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500 font-bold flex items-center gap-1">
                      🧑‍🏫 {item.teacher?.full_name || 'Teacher'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-bold">Assigned: <span className="text-gray-400 font-medium">{new Date(item.assigned_date).toLocaleDateString()}</span></span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600">
                   <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                   <span className="font-bold">Due: <span className="text-red-500">{new Date(item.due_date).toLocaleDateString()}</span></span>
                </div>
              </div>

              {item.description && (
                <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed bg-blue-50/30 p-4 rounded-xl border-l-4 border-blue-200">
                  {item.description}
                </p>
              )}

              {item.submission?.feedback && (
                  <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 italic text-xs text-green-800">
                      <strong>Teacher Feedback:</strong> {item.submission.feedback}
                  </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                 <button 
                  onClick={() => handleOpenAssignment(item)}
                  className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                 >
                    {item.submission ? 'Resubmit Assignment' : 'Open Assignment'}
                 </button>
              </div>
            </motion.div>
          ))}
          {assignments.length === 0 && (
            <div className="text-center py-12 text-gray-400 italic">
              No homework assigned yet.
            </div>
          )}
        </div>
      </motion.div>

      <div className="lg:w-80 w-full">
        <HomeworkRight assignments={assignments} />
      </div>

      {selectedAssignment && (
        <AssignmentSubmissionModal 
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            assignment={selectedAssignment}
            onSubmitted={() => {
                setPopup({ isOpen: true, type: 'success', title: 'Submitted!', message: 'Your assignment has been submitted successfully.' });
                fetchHomework();
            }}
        />
      )}

      <PopupModal 
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({...popup, isOpen: false})}
      />
    </div>
  );
};

export default Homework;
