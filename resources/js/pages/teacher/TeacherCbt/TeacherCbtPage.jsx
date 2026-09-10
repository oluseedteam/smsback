import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Plus, Trash2, Pencil, Eye, X, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { getCbtTests, createCbtTest, updateCbtTest, deleteCbtTest, addQuestion, updateQuestion, deleteQuestion, getTestResults } from '../../../services/cbtService';
import { getClasses } from '../../../services/classService';
import { getSubjects } from '../../../services/subjectService';
import { confirmDialog } from '../../../services/dialogService';

const TeacherCbtPage = () => {
  const [tests, setTests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [expandedTest, setExpandedTest] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [viewResults, setViewResults] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [testForm, setTestForm] = useState({
    title: '', description: '', school_class_id: '', subject_id: '',
    term: '1st Term', duration_minutes: 30, is_published: false
  });

  const [questionForm, setQuestionForm] = useState({
    question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', points: 1
  });

  const fetchAll = async () => {
    try {
      const [testsRes, clsRes, subRes] = await Promise.all([getCbtTests(), getClasses(), getSubjects()]);
      setTests(Array.isArray(testsRes) ? testsRes : []);
      setClasses(Array.isArray(clsRes) ? clsRes : (clsRes?.data || []));
      setSubjects(Array.isArray(subRes) ? subRes : (subRes?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingTest) {
        await updateCbtTest(editingTest.id, testForm);
        setAlert({ type: 'success', message: 'Test updated!' });
      } else {
        await createCbtTest(testForm);
        setAlert({ type: 'success', message: 'Test created!' });
      }
      setShowTestForm(false);
      setEditingTest(null);
      setTestForm({ title: '', description: '', school_class_id: '', subject_id: '', term: '1st Term', duration_minutes: 30, is_published: false });
      fetchAll();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTest = async (id) => {
    const ok = await confirmDialog({
      title: 'Delete CBT Test',
      message: 'Delete this test and all its questions?',
      confirmText: 'Yes, Delete',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCbtTest(id);
      setAlert({ type: 'success', message: 'Test deleted!' });
      fetchAll();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleQuestionSubmit = async (e, testId) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionForm);
        setAlert({ type: 'success', message: 'Question updated!' });
      } else {
        await addQuestion(testId, questionForm);
        setAlert({ type: 'success', message: 'Question added!' });
      }
      setShowQuestionForm(null);
      setEditingQuestion(null);
      setQuestionForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', points: 1 });
      fetchAll();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    const ok = await confirmDialog({
      title: 'Delete Question',
      message: 'Delete this question?',
      confirmText: 'Yes, Delete',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await deleteQuestion(qId);
      fetchAll();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleViewResults = async (test) => {
    try {
      const res = await getTestResults(test.id);
      setResultsData(res);
      setViewResults(test.id);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-blue-900 flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-blue-500" /> CBT Exam Management
        </h1>
        <button onClick={() => { setShowTestForm(true); setEditingTest(null); setTestForm({ title: '', description: '', school_class_id: '', subject_id: '', term: '1st Term', duration_minutes: 30, is_published: false }); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 text-sm">
          <Plus className="w-4 h-4" /> Create CBT Test
        </button>
      </div>

      {/* Test Form Modal */}
      <AnimatePresence>
        {showTestForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">{editingTest ? 'Edit Test' : 'Create CBT Test'}</h2>
                <button onClick={() => { setShowTestForm(false); setEditingTest(null); }} className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleTestSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                  <input required value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                  <textarea value={testForm.description} onChange={e => setTestForm({...testForm, description: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
                    <select required value={testForm.school_class_id} onChange={e => setTestForm({...testForm, school_class_id: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm">
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                    <select required value={testForm.subject_id} onChange={e => setTestForm({...testForm, subject_id: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm">
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Term</label>
                    <select value={testForm.term} onChange={e => setTestForm({...testForm, term: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm">
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (mins)</label>
                    <input type="number" min="5" max="180" value={testForm.duration_minutes}
                      onChange={e => setTestForm({...testForm, duration_minutes: parseInt(e.target.value)})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={testForm.is_published}
                    onChange={e => setTestForm({...testForm, is_published: e.target.checked})} className="w-4 h-4 rounded" />
                  Publish to students
                </label>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button type="button" onClick={() => { setShowTestForm(false); setEditingTest(null); }} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl text-sm">Cancel</button>
                  <button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm">
                    {formLoading ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {viewResults && resultsData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> Student Results - {resultsData.test?.title}
                </h2>
                <button onClick={() => { setViewResults(null); setResultsData(null); }} className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {resultsData.submissions?.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No submissions yet.</p>
                ) : (
                  <div className="space-y-4">
                    {resultsData.submissions?.map(sub => (
                      <ResultCard key={sub.id} submission={sub} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-bold">No CBT tests yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map(test => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Test Header */}
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-800">{test.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${test.is_published ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {test.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 font-bold flex-wrap">
                    <span>{test.subject?.name}</span>
                    <span>•</span>
                    <span>{test.school_class?.name}</span>
                    <span>•</span>
                    <span>{test.term}</span>
                    <span>•</span>
                    <span>{test.questions_count || 0} questions</span>
                    <span>•</span>
                    <span>{test.submissions_count || 0} submissions</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleViewResults(test)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View Results">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingTest(test); setTestForm({ title: test.title, description: test.description || '', school_class_id: test.school_class_id, subject_id: test.subject_id, term: test.term, duration_minutes: test.duration_minutes, is_published: test.is_published }); setShowTestForm(true); }}
                    className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteTest(test.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                    className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                    {expandedTest === test.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Questions */}
              <AnimatePresence>
                {expandedTest === test.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="p-5 pt-0 border-t border-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-sm text-gray-600">Questions</h4>
                        <button onClick={() => { setShowQuestionForm(test.id); setEditingQuestion(null); setQuestionForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', points: 1 }); }}
                          className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                          <Plus className="w-3 h-3" /> Add Question
                        </button>
                      </div>

                      {/* Question Form */}
                      {showQuestionForm === test.id && (
                        <form onSubmit={(e) => handleQuestionSubmit(e, test.id)} className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question</label>
                            <textarea required value={questionForm.question} onChange={e => setQuestionForm({...questionForm, question: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" rows={2} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <div key={opt}>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Option {opt}</label>
                                <input required value={questionForm[`option_${opt.toLowerCase()}`]}
                                  onChange={e => setQuestionForm({...questionForm, [`option_${opt.toLowerCase()}`]: e.target.value})}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-blue-500 text-sm" />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Correct Answer</label>
                              <select value={questionForm.correct_answer} onChange={e => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-blue-500 text-sm">
                                {['A', 'B', 'C', 'D'].map(a => <option key={a} value={a}>Option {a}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Points</label>
                              <input type="number" min="1" value={questionForm.points}
                                onChange={e => setQuestionForm({...questionForm, points: parseInt(e.target.value)})}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-blue-500 text-sm" />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => { setShowQuestionForm(null); setEditingQuestion(null); }} className="px-4 py-2 text-gray-500 text-sm font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                            <button type="submit" disabled={formLoading} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
                              {formLoading ? 'Saving...' : editingQuestion ? 'Update' : 'Add Question'}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Questions list */}
                      <div className="space-y-2">
                        {test.questions?.map((q, i) => (
                          <div key={q.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-800"><span className="text-blue-500 mr-1">Q{i + 1}.</span> {q.question}</p>
                                <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-500">
                                  {['A', 'B', 'C', 'D'].map(opt => (
                                    <div key={opt} className={`px-2 py-1 rounded-lg ${q.correct_answer === opt ? 'bg-green-50 text-green-700 font-bold' : ''}`}>
                                      {opt}. {q[`option_${opt.toLowerCase()}`]}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={() => { setEditingQuestion(q); setShowQuestionForm(test.id); setQuestionForm({ question: q.question, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer, points: q.points }); }}
                                  className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!test.questions || test.questions.length === 0) && (
                          <p className="text-center text-gray-400 text-sm py-6">No questions yet. Click "Add Question" above.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Result Card Component ──────────────────────────────
const ResultCard = ({ submission }) => {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = submission.score >= 70 ? 'text-green-600' : submission.score >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
            {submission.student?.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">{submission.student?.full_name}</p>
            <p className="text-xs text-gray-400">{submission.student?.student_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-lg font-black ${scoreColor}`}>{submission.score}%</p>
            <p className="text-[10px] text-gray-400 font-bold">
              ✅ {submission.correct_answers} • ❌ {submission.wrong_answers}
            </p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 space-y-2 overflow-hidden">
            {submission.answers?.map((ans, i) => (
              <div key={ans.id} className={`text-xs p-3 rounded-xl ${ans.is_correct ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                <p className="font-bold text-gray-700 mb-1">Q{i + 1}. {ans.question?.question}</p>
                <div className="flex items-center gap-3 text-gray-500">
                  <span>Selected: <strong>{ans.selected_answer}</strong></span>
                  <span>•</span>
                  <span>Correct: <strong className="text-green-600">{ans.question?.correct_answer}</strong></span>
                  <span>{ans.is_correct ? '✅' : '❌'}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherCbtPage;
