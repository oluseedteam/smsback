import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Play, Clock, CheckCircle, XCircle, AlertCircle, Loader2, X, ArrowRight, ArrowLeft, Flag } from 'lucide-react';
import { getStudentCbtTests, startExam, submitExam, getMyResult, saveCbtAnswer } from '../../../services/cbtService';
import { confirmDialog } from '../../../services/dialogService';

const StudentCbtPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);
  const [viewResult, setViewResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cbtDisabledMessage, setCbtDisabledMessage] = useState(null);
  const [alert, setAlert] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const answersRef = useRef({});

  // Sync answers to ref for stale-closure-free access in timer
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await getStudentCbtTests();
        if (res?.cbt_enabled === false) {
          setCbtDisabledMessage(res.message || 'CBT Examination Portal is currently closed by Administration.');
          setTests([]);
        } else {
          setTests(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Timer
  useEffect(() => {
    if (activeExam && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExam]);

  const handleStartExam = async (test) => {
    try {
      const res = await startExam(test.id);
      setActiveExam(res.test || test);
      setQuestions(res.questions || []);
      const remaining = typeof res.remaining_seconds === 'number'
        ? res.remaining_seconds
        : Math.max(0, (Number(res.duration_minutes || test.duration_minutes) * 60));
      setTimeLeft(remaining);
      setAnswers(res.saved_answers || {});
      setCurrentQ(0);
      startTimeRef.current = res.started_at ? new Date(res.started_at).getTime() : Date.now();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleSelectOption = (questionId, optionValue) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionValue }));
    if (activeExam) {
      saveCbtAnswer(activeExam.id, {
        question_id: questionId,
        selected_answer: optionValue,
        time_spent_seconds: Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000),
      }).catch(err => {
        console.warn('CBT Autosave warning:', err);
      });
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const ok = await confirmDialog({
        title: 'Submit Examination',
        message: 'Are you sure you want to submit? You cannot change your answers after submission.',
        confirmText: 'Yes, Submit Exam',
        type: 'warning',
      });
      if (!ok) return;
    }
    setSubmitting(true);
    clearInterval(timerRef.current);

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const formattedAnswers = Object.entries(answersRef.current).map(([qId, ans]) => ({
      question_id: parseInt(qId),
      selected_answer: ans,
    }));

    try {
      const res = await submitExam(activeExam.id, {
        answers: formattedAnswers,
        time_spent_seconds: timeSpent,
      });
      setExamResult(res);
      setActiveExam(null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewResult = async (test) => {
    try {
      const res = await getMyResult(test.id);
      setViewResult(res);
    } catch (err) {
      if (err.status === 404) {
        setAlert({ type: 'error', message: 'You have not taken this exam yet.' });
      } else {
        setAlert({ type: 'error', message: err.message });
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // ─── Active Exam View ─────────────────────────────────
  if (activeExam) {
    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6 pb-20">
        {/* Exam Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-10">
          <div>
            <h2 className="font-black text-blue-900 text-lg">{activeExam.title}</h2>
            <p className="text-xs text-gray-400 font-semibold">{activeExam.subject?.name} • {activeExam.school_class?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : timeLeft < 300 ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
              <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
            </div>
            <span className="text-xs font-bold text-gray-400">{answeredCount}/{questions.length}</span>
          </div>
        </div>

        {/* Question */}
        {q && (
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Question {currentQ + 1} of {questions.length}</span>
              <span className="text-xs font-bold text-gray-400">{q.points} point{q.points > 1 ? 's' : ''}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 leading-relaxed">{q.question}</h3>

            <div className="space-y-3">
              {(q.options || ['A', 'B', 'C', 'D'].map(value => ({ value, label: q[`option_${value.toLowerCase()}`] }))).map(option => {
                const selected = answers[q.id] === option.value;
                return (
                  <button key={option.value} onClick={() => handleSelectOption(q.id, option.value)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-colors ${selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                      {option.value}
                    </span>
                    <span className={`font-semibold text-sm ${selected ? 'text-blue-800' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 disabled:opacity-30 transition-all">
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentQ === questions.length - 1 ? (
            <button onClick={() => handleSubmit(false)} disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-md shadow-green-500/20">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          ) : (
            <button onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrentQ(i)}
                className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${currentQ === i ? 'bg-blue-600 text-white shadow-md' : answers[q.id] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Result Modal ─────────────────────────────────────
  if (examResult) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-12">
        <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${examResult.score >= 50 ? 'bg-green-100' : 'bg-red-100'}`}>
          {examResult.score >= 50 ? <CheckCircle className="w-12 h-12 text-green-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">Exam Completed!</h2>
        <p className="text-gray-500 mb-8">Here's how you performed</p>
        <div className={`text-6xl font-black mb-4 ${examResult.score >= 70 ? 'text-green-600' : examResult.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {examResult.score}%
        </div>
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-2xl font-black text-green-600">{examResult.correct}</p>
            <p className="text-xs text-gray-400 font-bold uppercase">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-600">{examResult.wrong}</p>
            <p className="text-xs text-gray-400 font-bold uppercase">Wrong</p>
          </div>
        </div>
        <button onClick={() => { setExamResult(null); window.location.reload(); }}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">
          Back to Tests
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-2xl font-black text-blue-900 flex items-center gap-3">
        <ClipboardList className="w-7 h-7 text-blue-500" /> CBT Assignments
      </h1>

      {cbtDisabledMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-base">CBT Portal Closed</h3>
          <p className="text-sm text-amber-700 mt-1">{cbtDisabledMessage}</p>
        </div>
      )}

      {/* View Result Modal */}
      <AnimatePresence>
        {viewResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h2 className="font-bold text-lg">Your Result - {viewResult.test?.title}</h2>
                <button onClick={() => setViewResult(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="text-center mb-6">
                  <p className={`text-4xl font-black ${viewResult.submission?.score >= 70 ? 'text-green-600' : viewResult.submission?.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {viewResult.submission?.score}%
                  </p>
                  <p className="text-sm text-gray-400 mt-1">✅ {viewResult.submission?.correct_answers} correct • ❌ {viewResult.submission?.wrong_answers} wrong</p>
                </div>
                <div className="space-y-3">
                  {viewResult.submission?.answers?.map((ans, i) => (
                    <div key={ans.id} className={`p-4 rounded-xl border ${ans.is_correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <p className="font-bold text-sm text-gray-800 mb-2">Q{i + 1}. {ans.question?.question}</p>
                      <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <span key={opt} className={`px-2 py-1 rounded ${ans.question?.correct_answer === opt ? 'bg-green-100 text-green-700 font-bold' : ans.selected_answer === opt && !ans.is_correct ? 'bg-red-100 text-red-700 font-bold' : 'text-gray-500'}`}>
                            {opt}. {ans.question?.[`option_${opt.toLowerCase()}`]}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">Your answer: <strong>{ans.selected_answer}</strong> {ans.is_correct ? '✅' : `❌ (Correct: ${ans.question?.correct_answer})`}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-bold">No CBT assignments available for your class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map(test => {
            const hasSubmitted = test.submissions_count > 0;
            return (
              <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-gray-800">{test.title}</h3>
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      {test.subject?.name} • {test.school_class?.name} • {test.term}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-50 text-blue-500">
                    {test.questions_count} Qs
                  </span>
                </div>

                {test.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{test.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold mb-4">
                  <Clock className="w-3.5 h-3.5" /> {test.duration_minutes} minutes
                </div>

                <div className="flex gap-2">
                  {hasSubmitted ? (
                    <button onClick={() => handleViewResult(test)}
                      className="flex-1 bg-green-50 text-green-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-all">
                      <CheckCircle className="w-4 h-4" /> View Result
                    </button>
                  ) : (
                    <button onClick={() => handleStartExam(test)}
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20">
                      <Play className="w-4 h-4" /> Start Exam
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default StudentCbtPage;
