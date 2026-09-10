import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Edit, Send, Smile, Loader2, X, ChevronDown, Megaphone, CheckCircle, AlertCircle, Trash2, Users, BookOpen
} from 'lucide-react';
import TeacherMessagesRight from './TeacherMessagesRight';
import { getMessages, sendMessage, clearChat, deleteMessage, updateMessage } from '../../../services/messageService';
import { getClasses, getClass } from '../../../services/classService';
import { useAuth } from '../../../hooks/useAuth';
import apiFetch from '../../../services/api';
import toast from 'react-hot-toast';

const TeacherMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [composeTarget, setComposeTarget] = useState('student'); // 'student' | 'class' | 'colleague'
  const [classes, setClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState('');

  // Edit/Clear dialog states
  const [confirmClear, setConfirmClear] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editContent, setEditContent] = useState('');

  const chatEndRef = useRef(null);

  // Group messages into threads by the other person
  const getThreadKey = useCallback((m) => {
    if (!m) return '';
    const isMine = m.sender_id === user?.id && m.sender_type?.toLowerCase().includes(user?.role?.toLowerCase());
    return isMine ? `${m.receiver_type}-${m.receiver_id}` : `${m.sender_type}-${m.sender_id}`;
  }, [user]);

  const buildThreads = useCallback((msgs) => {
    if (!Array.isArray(msgs)) return [];
    const threadMap = {};
    msgs.forEach(m => {
      const key = getThreadKey(m);
      if (!key) return;
      if (!threadMap[key]) threadMap[key] = { key, messages: [], other: null, lastMsg: m };
      threadMap[key].messages.push(m);
      if (new Date(m.created_at) > new Date(threadMap[key].lastMsg.created_at)) {
        threadMap[key].lastMsg = m;
      }
      const isMine = m.sender_id === user?.id && m.sender_type?.toLowerCase().includes(user?.role?.toLowerCase());
      threadMap[key].other = isMine ? m.receiver : m.sender;
    });
    return Object.values(threadMap)
        .filter(t => t.other?.id !== user?.id || !t.key.toLowerCase().includes(user?.role?.toLowerCase()))
        .sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at));
  }, [user, getThreadKey]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getMessages();
      setMessages(res.data || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await getClasses();
      setClasses(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await apiFetch('/all-teachers');
      setAllTeachers(res.teachers?.filter(t => t.id !== user?.id) || []);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const handleClassSelect = async (classId) => {
    setSelectedClassId(classId);
    setSelectedStudent(null);
    if (!classId) { setStudentsInClass([]); return; }
    try {
      const detail = await getClass(classId);
      setStudentsInClass(detail.students || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchClasses();
    fetchTeachers();
  }, [fetchMessages, fetchClasses, fetchTeachers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, messages]);

  const threads = buildThreads(messages);
  const activeMessages = activeThread
    ? messages.filter(m => getThreadKey(m) === activeThread.key)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const handleSend = async () => {
    if (!newMessage.trim() || !activeThread) return;
    setSending(true);
    try {
      const other = activeThread.other;
      const typeStr = activeThread.key.split('-')[0].toLowerCase();
      const receiverType = typeStr.includes('student') ? 'student' : (typeStr.includes('admin') ? 'admin' : 'teacher');
      await sendMessage({ receiver_id: other?.id, receiver_type: receiverType, content: newMessage });
      setNewMessage('');
      await fetchMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!activeThread) return;
    try {
      const parts = activeThread.key.split('-');
      const type = parts[0].toLowerCase().includes('student') ? 'student' : (parts[0].toLowerCase().includes('admin') ? 'admin' : 'teacher');
      await clearChat(activeThread.other?.id, type);
      toast.success('Chat history cleared permanently');
      setActiveThread(null);
      await fetchMessages();
      setConfirmClear(false);
    } catch (e) {
      toast.error(e.message || 'Failed to clear chat');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteMessage(msgId);
      toast.success('Message deleted');
      await fetchMessages();
    } catch (e) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleEditMessage = async () => {
    if (!editTarget || !editContent.trim() || editContent === editTarget.content) return;
    try {
      await updateMessage(editTarget.id, editContent);
      toast.success('Message updated');
      setEditTarget(null);
      await fetchMessages();
    } catch (e) {
      toast.error(e.message || 'Failed to update');
    }
  };

  const handleAction = (label) => {
    if (label === 'New Message' || label === 'Message Student') {
      setComposeTarget('student');
      setShowCompose(true);
    } else if (label === 'Send Class Announcement') {
      setComposeTarget('class');
      setShowCompose(true);
    }
  };

  const handleTemplate = (label) => {
    const tpl = {
      'Homework reminder': 'Hello! This is a reminder to complete your homework for this week. Please submit it by the deadline.',
      'Absence follow-up': 'We missed you in class today. Please let me know if everything is okay and if you need help catching up.',
      'Positive behavior note': 'I wanted to share that you did an excellent job in class today. Keep up the great work!',
      'Progress concern': 'I have some concerns about your recent progress. Let\'s find some time to discuss how we can improve.',
      'Meeting invitation': 'I would like to invite you (and your parents) to a brief meeting to discuss your academic performance.',
      'Weekly update': 'Here is the weekly update for our class. We covered several key topics this week...',
    };
    setComposeContent(tpl[label] || '');
    if (!showCompose) {
      setComposeTarget('student');
      setShowCompose(true);
    }
  };

  const handleComposeSend = async () => {
    if (!composeContent.trim()) return setComposeError('Message content is required.');
    
    if (composeTarget === 'class') {
        if (!selectedClassId) return setComposeError('Please select a class.');
    } else if (composeTarget === 'student') {
        if (!selectedClassId) return setComposeError('Please select a class.');
        if (!selectedStudent) return setComposeError('Please select a student.');
    } else if (composeTarget === 'colleague') {
        if (!selectedTeacherId) return setComposeError('Please select a colleague.');
    }
    
    setComposeSending(true);
    setComposeError('');
    try {
      let rType = 'student';
      let rId = null;
      let tType = 'single';

      if (composeTarget === 'class') {
          tType = 'class';
          rId = undefined;
      } else if (composeTarget === 'student') {
          rId = selectedStudent.id;
      } else if (composeTarget === 'colleague') {
          rId = parseInt(selectedTeacherId);
          rType = 'teacher';
      }

      const payload = {
        content: composeContent,
        target_type: tType,
        school_class_id: (composeTarget === 'class' || composeTarget === 'student') ? parseInt(selectedClassId) : undefined,
        receiver_id: rId,
        receiver_type: rType,
      };
      
      await sendMessage(payload);
      toast.success('Message dispatched successfully');
      setShowCompose(false);
      setComposeContent('');
      setSelectedStudent(null);
      setSelectedTeacherId('');
      await fetchMessages();
    } catch (e) {
      setComposeError(e.message || 'Failed to send.');
    } finally {
      setComposeSending(false);
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col xl:flex-row gap-8 px-0 sm:px-0 lg:px-0">
      <div className="flex-1 min-w-0 w-full">
        <div className="bg-white rounded-4xl border border-gray-100 shadow-sm flex flex-col md:flex-row h-[calc(100vh-160px)] overflow-hidden">

          {/* Thread List */}
          <div className={`w-full md:w-85 border-r border-gray-100 flex flex-col shrink-0 ${activeThread ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Messages</h2>
                <button onClick={() => { setComposeTarget('student'); setShowCompose(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                  <Edit className="w-5 h-5 font-bold" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input placeholder="Search conversations..." className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {threads.map(thread => (
                <div
                  key={thread.key}
                  onClick={() => setActiveThread(thread)}
                  className={`p-5 flex items-center gap-4 cursor-pointer transition-all ${activeThread?.key === thread.key ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-lg font-black text-white shadow-lg shadow-blue-500/20">
                    {thread.other?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-black text-gray-800 uppercase tracking-tight truncate">{thread.other?.full_name || thread.other?.name || 'Unknown'}</p>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{new Date(thread.lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold truncate leading-none italic">{thread.lastMsg.content}</p>
                    <div className="mt-1">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${thread.key.toLowerCase().includes('teacher') ? 'bg-indigo-50 text-indigo-500' : (thread.key.toLowerCase().includes('admin') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500')}`}>
                          {thread.key.split('-')[0].split('\\').pop()?.replace('AppModels', '')}
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat View */}
          <div className={`flex-1 flex-col min-w-0 bg-gray-50/20 ${activeThread ? 'flex' : 'hidden md:flex'}`}>
            {activeThread ? (
              <>
                <div className="md:hidden p-4 bg-white border-b border-gray-100">
                  <button onClick={() => setActiveThread(null)} className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 rotate-90" /> back to list
                  </button>
                </div>
                <div className="p-5 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center text-sm font-black text-blue-600">
                      {activeThread.other?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{activeThread.other?.full_name || activeThread.other?.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">{activeThread.key.split('-')[0].split('\\').pop()?.replace('AppModels', '')} • Online</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setConfirmClear(true)} className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-all">
                      Clear Chat
                    </button>
                    <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {activeMessages.map(m => {
                    const isMine = m.sender_id === user?.id && m.sender_type?.toLowerCase().includes(user?.role?.toLowerCase());
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'} group animate-in fade-in slide-in-from-bottom-2`}>
                        <div className="flex flex-col max-w-[75%]">
                          <div className={`shadow-sm relative transition-all duration-300 ${isMine 
                            ? 'bg-slate-800 text-white rounded-3xl rounded-tl-none border-l-4 border-blue-500' 
                            : 'bg-white text-gray-800 border-indigo-500 rounded-3xl rounded-tr-none border-r-4'} p-4`}>
                            
                            <div className={`absolute top-2 ${isMine ? 'right-2' : 'left-2'} flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                {isMine && <button onClick={() => { setEditTarget(m); setEditContent(m.content); }} className="hover:text-blue-400 transition-all"><Edit className="w-3.5 h-3.5" /></button>}
                                <button onClick={() => handleDeleteMessage(m.id)} className="hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            <p className="text-sm font-medium leading-relaxed mt-1 wrap-break-word">{m.content}</p>
                            <div className={`flex items-center gap-1.5 mt-2 ${isMine ? 'justify-start' : 'justify-end'}`}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isMine ? 'opacity-60 text-blue-200' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {!isMine && <CheckCircle className="w-3 h-3 text-indigo-500" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-8 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-4 bg-gray-50 border-2 border-gray-100 rounded-4xl p-2.5 pl-8 focus-within:bg-white focus-within:border-blue-500/40 transition-all shadow-inner relative overflow-visible">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent border-none text-sm font-bold text-gray-700 placeholder:text-gray-400 focus:ring-0 outline-none py-3"
                    />
                    <button 
                      onClick={handleSend} 
                      disabled={sending || !newMessage.trim()} 
                      className="w-14 h-14 bg-blue-600 text-white rounded-3xl hover:bg-black transition-all shadow-xl shadow-blue-500/30 active:scale-90 disabled:opacity-30 disabled:scale-100 shrink-0 flex items-center justify-center overflow-hidden"
                    >
                      {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-6 p-12 text-center bg-linear-to-b from-white to-gray-50/30">
                <div className="w-24 h-24 bg-white rounded-4xl shadow-xl shadow-blue-500/10 flex items-center justify-center border border-gray-50 animate-bounce-slow">
                  <Smile className="w-12 h-12 text-blue-500 opacity-40" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tight">Your Inbox</h3>
                <button onClick={() => { setComposeTarget('student'); setShowCompose(true); }} className="flex items-center gap-3 px-8 py-4 bg-blue-800 text-white rounded-4xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                  compose message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="xl:w-85 w-full xl:block hidden">
        <TeacherMessagesRight onAction={handleAction} onTemplate={handleTemplate} />
      </div>

      <AnimatePresence>
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-500 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/50">
                <div>
                   <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                     {composeTarget === 'class' ? 'Class Announcement' : (composeTarget === 'colleague' ? 'Colleague Message' : 'Student Message')}
                   </h2>
                   <div className="flex gap-2 mt-4">
                      <button onClick={() => setComposeTarget('student')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${composeTarget === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                         <Users className="w-3 h-3 inline mr-1" /> Student
                      </button>
                      <button onClick={() => setComposeTarget('class')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${composeTarget === 'class' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                         <Megaphone className="w-3 h-3 inline mr-1" /> Class
                      </button>
                      <button onClick={() => setComposeTarget('colleague')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${composeTarget === 'colleague' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                         <BookOpen className="w-3 h-3 inline mr-1" /> Colleague
                      </button>
                   </div>
                </div>
              <button onClick={() => { setShowCompose(false); setComposeError(''); setComposeContent(''); setSelectedStudent(null); setSelectedTeacherId(''); }} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {composeError && (
                 <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-xs font-black uppercase tracking-tight flex items-center gap-3">
                   <AlertCircle className="w-5 h-5" /> {composeError}
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(composeTarget === 'student' || composeTarget === 'class') && (
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Select Class</label>
                    <select value={selectedClassId} onChange={e => handleClassSelect(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-semibold bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                      <option value="">-- Class --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {composeTarget === 'student' && studentsInClass.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Select Student</label>
                    <select value={selectedStudent?.id || ''} onChange={e => setSelectedStudent(studentsInClass.find(s => s.id === parseInt(e.target.value)))} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-semibold bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                      <option value="">-- Student --</option>
                      {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                )}

                {composeTarget === 'colleague' && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Select Instructor</label>
                    <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-semibold bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                      <option value="">-- Colleague --</option>
                      {allTeachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <textarea
                value={composeContent}
                onChange={e => setComposeContent(e.target.value)}
                placeholder="Write your message here..."
                className="w-full border-2 border-gray-100 rounded-2xl px-5 py-5 text-gray-800 text-sm font-medium min-h-[160px] bg-gray-50/30 focus:bg-white focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner"
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-50">
                <button onClick={() => setShowCompose(false)} className="px-8 py-4 text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 transition-all">Cancel</button>
                <button onClick={handleComposeSend} disabled={composeSending} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">
                   dispatch message
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmClear && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-500 p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-gray-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Clear History?</h3>
                    <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed italic">This will erase all communication permanently.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleClearChat} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95">Yes, wipe it</button>
                        <button onClick={() => setConfirmClear(false)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Cancel</button>
                    </div>
                </motion.div>
            </div>
        )}

        {editTarget && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-500 p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-gray-100">
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-4">Edit message</h3>
                    <textarea 
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500/30 outline-none transition-all resize-none min-h-[120px] mb-6 shadow-inner"
                    />
                    <div className="flex flex-col gap-3">
                        <button onClick={handleEditMessage} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95">Save changes</button>
                        <button onClick={() => setEditTarget(null)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Dismiss</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeacherMessages;
