import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Compass, 
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
  Users,
  Settings,
  Cpu,
  FileSpreadsheet,
  Clock,
  GraduationCap,
  FileText
} from 'lucide-react';
import apiFetch from '../services/api';
import { useAuth } from '../hooks/useAuth';

const TOUR_CONFIGS = {
  admin: [
    {
      title: 'Welcome to Administration Portal',
      description: 'Your command center for comprehensive academic management, grading, teacher allocations, and official report cards.',
      icon: Compass,
      target: 'Overview',
      tip: 'Use the sidebar to access full institution management anytime.',
    },
    {
      title: '1. Sessions, Terms & Classes',
      description: 'Set up active academic sessions (e.g., 2026/2027), define 1st/2nd/3rd terms, and configure class arms & sections.',
      icon: Calendar,
      target: 'Academic Management',
      tip: 'Go to Academic Management in the sidebar to activate the current term.',
    },
    {
      title: '2. Subjects & Teacher Allocation',
      description: 'Create curriculum subjects, designate compulsory vs elective courses, and assign qualified teachers to classes.',
      icon: BookOpen,
      target: 'Subjects & Allocations',
      tip: 'Assigned teachers can only manage marks for their designated subjects.',
    },
    {
      title: '3. Grading Scales & Assessment Setup',
      description: 'Define custom grade bands (A, B, C...) with gap/overlap validation, and configure continuous assessments, CBT, and written weighting.',
      icon: Settings,
      target: 'Settings',
      tip: 'Navigate to Report Card Settings to customize weights or reset to standards.',
    },
    {
      title: '4. CBT Portal Global Switch',
      description: 'Turn the Computer-Based Testing portal on or off dynamically. Student exams and navigation links update in real-time.',
      icon: Cpu,
      target: 'CBT Control',
      tip: 'Toggle CBT Portal in School Settings whenever exams are in session.',
    },
    {
      title: '5. Results Approval & Student Promotion',
      description: 'Review teacher score submissions, release report cards with dual student/parent email delivery, and promote cohorts into the next session.',
      icon: GraduationCap,
      target: 'Promotions & Reports',
      tip: 'Annual results automatically compute cumulative performance on 3rd term.',
    },
  ],

  teacher: [
    {
      title: 'Welcome to Teacher Workspace',
      description: 'Your dedicated portal to manage class attendance, enter scores, supervise CBT tests, and monitor student academic growth.',
      icon: Compass,
      target: 'Overview',
      tip: 'Everything is scoped strictly to your assigned classes and subjects.',
    },
    {
      title: '1. Class & Subject Assignments',
      description: 'View your designated classes and curriculum subjects assigned by the administration.',
      icon: Layers,
      target: 'My Classes',
      tip: 'Check My Classes in the sidebar to see your assigned arms and students.',
    },
    {
      title: '2. Daily & General Attendance',
      description: 'Mark attendance for your homeroom students. Attendance stats appear directly on official report cards.',
      icon: Clock,
      target: 'Attendance',
      tip: 'Designated class teachers have authoritative class attendance permissions.',
    },
    {
      title: '3. Digital Marksheet & Gradebook',
      description: 'Enter CA1, CA2, written scores, or view auto-imported CBT results without duplicate data entry.',
      icon: FileSpreadsheet,
      target: 'Gradebook',
      tip: 'Scores lock automatically once approved or released by administration.',
    },
    {
      title: '4. Computer-Based Testing (CBT)',
      description: 'Author multiple-choice questions, set exam windows and time limits, and publish tests directly to students.',
      icon: Cpu,
      target: 'CBT Hub',
      tip: 'Questions undergo administrative quality review before live deployment.',
    },
    {
      title: '5. Class Teacher Review Queue',
      description: 'Provide customized behavioral and psychomotor remarks on student report cards before final administrative release.',
      icon: FileText,
      target: 'Review Queue',
      tip: 'Submit finished marksheets to admin to queue cards for final release.',
    },
  ],

  student: [
    {
      title: 'Welcome to Your Student Portal',
      description: 'Your central hub for class materials, registered courses, computer-based testing, and term report cards.',
      icon: Compass,
      target: 'Overview',
      tip: 'Track your academic milestones in one secure place.',
    },
    {
      title: '1. Course Registration',
      description: 'Register for your term subjects before the session deadline. Compulsory subjects are automatically locked in.',
      icon: BookOpen,
      target: 'Course Registration',
      tip: 'Only registered courses appear on your examination papers and report cards.',
    },
    {
      title: '2. Live Timetable & Calendar',
      description: 'Access your daily class schedule, assigned teachers, and school calendar events.',
      icon: Calendar,
      target: 'Timetable',
      tip: 'Stay informed on upcoming mid-term breaks and examination windows.',
    },
    {
      title: '3. Online CBT Examinations',
      description: 'Take published tests with real-time autosaving and reload recovery. Your work is never lost if your connection drops.',
      icon: Cpu,
      target: 'CBT Hub',
      tip: 'Answer each question and click Submit when finished.',
    },
    {
      title: '4. Report Cards & Digital ID Card',
      description: 'View authenticated report cards, download stamped PDFs, and access your secure school QR identity card.',
      icon: GraduationCap,
      target: 'Report Cards',
      tip: 'Your parents also receive an instant copy and verification link via email.',
    },
  ],
};

export default function GuidedTourModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(true);

  const role = user?.role || 'student';
  const steps = TOUR_CONFIGS[role] || TOUR_CONFIGS.student;

  useEffect(() => {
    if (!user) return;

    // Check tour status from backend or user payload
    const checkStatus = async () => {
      try {
        const res = await apiFetch('/auth/onboarding-tour', { showToast: false });
        const isDone = res?.completed || res?.onboarding_tour?.completed || false;
        const isSkipped = res?.skipped || res?.onboarding_tour?.skipped || false;
        setTourCompleted(isDone || isSkipped);

        if (!isDone && !isSkipped) {
          // Open tour for first-time user
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('Tour status check warning:', err);
      }
    };

    checkStatus();
  }, [user]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      apiFetch('/auth/onboarding-tour', {
        method: 'POST',
        body: JSON.stringify({ current_step: next }),
        showToast: false,
      }).catch(() => {});
    } else {
      await handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = async () => {
    setIsOpen(false);
    try {
      await apiFetch('/auth/onboarding-tour', {
        method: 'POST',
        body: JSON.stringify({ skipped: true }),
        showToast: false,
      });
      setTourCompleted(true);
    } catch (err) {
      console.warn('Failed to save tour skip:', err);
    }
  };

  const handleComplete = async () => {
    setIsOpen(false);
    try {
      await apiFetch('/auth/onboarding-tour', {
        method: 'POST',
        body: JSON.stringify({ completed: true }),
        showToast: false,
      });
      setTourCompleted(true);
    } catch (err) {
      console.warn('Failed to complete tour:', err);
    }
  };

  const handleReplay = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const step = steps[currentStep] || steps[0];
  const Icon = step.icon || Compass;
  const isLast = currentStep === steps.length - 1;

  if (!user) return null;

  return (
    <>
      {/* Persistent "Quick Guide / Replay Tour" Trigger Button */}
      <button
        onClick={handleReplay}
        className="fixed bottom-6 right-6 z-40 bg-slate-900/90 hover:bg-blue-600 text-white p-3 rounded-full shadow-xl border border-white/20 backdrop-blur-md transition-all duration-200 group flex items-center gap-2 text-xs font-bold cursor-pointer"
        title="Quick Onboarding Guide"
      >
        <Sparkles className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Quick Guide
        </span>
      </button>

      {/* Onboarding Tour Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col space-y-6 relative overflow-hidden"
            >
              {/* Top Bar: Role badge, Step counter & Close button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {role} Guide
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>

                <button
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  title="Skip Tour (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Indicator Dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentStep 
                        ? 'w-8 bg-blue-600' 
                        : idx < currentStep 
                          ? 'w-3 bg-emerald-500' 
                          : 'w-3 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Card Main Content */}
              <div className="space-y-4 pt-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Icon className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {step.tip && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                    <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <span><strong>Tip:</strong> {step.tip}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSkip}
                    className="px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    Skip
                  </button>

                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wide rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <span>{isLast ? 'Complete Tour' : 'Next Step'}</span>
                    {isLast ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
