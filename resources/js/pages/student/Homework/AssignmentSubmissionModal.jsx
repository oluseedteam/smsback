import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Send, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { submitAssignment } from '../../../services/assignmentService';

const AssignmentSubmissionModal = ({ isOpen, onClose, assignment, onSubmitted }) => {
    const [submissionText, setSubmissionText] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFile(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await submitAssignment(assignment.id, {
                submission_text: submissionText,
                submission_file: file
            });
            onSubmitted();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to submit assignment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Submit Assignment</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase">{assignment.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Your Answer / Solution</label>
                        <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            className="w-full border border-gray-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[150px]"
                            placeholder="Type your solution here..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Upload File (Optional)</label>
                        <div className="relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                                <Upload className="w-8 h-8 text-gray-300 group-hover:text-blue-500 mb-2 transition-colors" />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-blue-700">
                                    {file ? 'File selected (Click to change)' : 'Click to upload document or image'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 rounded-2xl text-red-600 text-xs font-bold border border-red-100 flex items-center gap-2">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {loading ? 'Submitting...' : 'Submit Now'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AssignmentSubmissionModal;
