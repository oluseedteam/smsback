import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, FileText, Download, Loader2, Award, MessageSquare } from 'lucide-react';
import { getSubmissions, gradeSubmission } from '../../../services/assignmentService';
import { alertDialog } from '../../../services/dialogService';

const SubmissionsModal = ({ isOpen, onClose, assignment }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradingTarget, setGradingTarget] = useState(null);
    const [gradeData, setGradeData] = useState({ score: '', feedback: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchSubmissions = useCallback(async () => {
        if (!isOpen || !assignment) return;
        setLoading(true);
        try {
            const res = await getSubmissions(assignment.id);
            setSubmissions(res || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [isOpen, assignment]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);



    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await gradeSubmission(gradingTarget.id, gradeData);
            setGradingTarget(null);
            setGradeData({ score: '', feedback: '' });
            fetchSubmissions();
        } catch (err) {
            await alertDialog({
                title: 'Grading Error',
                message: err.message || 'Failed to grade submission.',
                type: 'danger',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Assignment Submissions</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase">{assignment.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 italic">No submissions yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map(s => (
                                <div key={s.id} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:bg-white transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                                                    {s.student?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-800 text-sm uppercase">{s.student?.full_name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.student?.student_id}</p>
                                                </div>
                                                <span className={`ml-auto md:ml-0 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {s.status} {s.status === 'graded' && `(${s.score})`}
                                                </span>
                                            </div>

                                            {s.submission_text && (
                                                <div className="text-xs text-gray-600 bg-white p-4 rounded-xl border border-gray-100 italic leading-relaxed">
                                                    "{s.submission_text}"
                                                </div>
                                            )}

                                            {s.submission_file && (
                                                <button 
                                                    onClick={() => window.open(s.submission_file)}
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Download Attached File
                                                </button>
                                            )}
                                        </div>

                                        <div className="md:w-48 space-y-3">
                                            <button 
                                                onClick={() => {
                                                    setGradingTarget(s);
                                                    setGradeData({ score: s.score || '', feedback: s.feedback || '' });
                                                }}
                                                className="w-full bg-white border border-gray-200 hover:border-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                            >
                                                {s.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {gradingTarget && (
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-100 shadow-2xl p-8 z-10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-600" /> Grading: {gradingTarget.student?.full_name}
                                </h3>
                                <button onClick={() => setGradingTarget(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={handleGradeSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Score (out of {assignment.max_score || 100})</label>
                                        <input 
                                            required
                                            type="number" 
                                            value={gradeData.score}
                                            onChange={e => setGradeData({...gradeData, score: e.target.value})}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100" 
                                            placeholder="Score"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Feedback to Student</label>
                                        <div className="flex gap-4">
                                            <input 
                                                value={gradeData.feedback}
                                                onChange={e => setGradeData({...gradeData, feedback: e.target.value})}
                                                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100" 
                                                placeholder="Excellent work muiz!"
                                            />
                                            <button 
                                                disabled={submitting}
                                                type="submit" 
                                                className="px-8 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                                            >
                                                {submitting ? '...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default SubmissionsModal;
