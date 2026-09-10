import { useState, useEffect, useCallback, useRef } from 'react';
import { Edit, Send, Loader2, X, ChevronRight, Trash2, AlertCircle, Paperclip, Megaphone, Users, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MessagesRight from './MessagesRight';
import { getMessages, sendMessage, clearChat, deleteMessage, updateMessage } from '../../../services/messageService';
import { useAuth } from '../../../hooks/useAuth';
import apiFetch from '../../../services/api';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // New message modal
  const [showCompose, setShowCompose] = useState(false);
  const [composeTarget, setComposeTarget] = useState('teacher'); // 'teacher' | 'classmate'
  const [myTeachers, setMyTeachers] = useState([]);
  const [myClassmates, setMyClassmates] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  // Confirm/Edit dialog states
  const [confirmClear, setConfirmClear] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editContent, setEditContent] = useState('');

  const chatEndRef = useRef(null);

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

  const fetchData = useCallback(async () => {
    try {
      const [msgRes, teacherRes, classmateRes] = await Promise.all([
        getMessages(),
        apiFetch('/all-teachers'),
        apiFetch('/my/classmates')
      ]);
      const msgs = msgRes.data || msgRes || [];
      setMessages(msgs);
      setMyTeachers(teacherRes?.teachers || []);
      setMyClassmates(classmateRes?.classmates || []);
      
      const threads = buildThreads(msgs);
      if (threads.length > 0 && !activeThread) {
        setActiveThread(threads[0]);
      } else if (activeThread) {
        const freshActive = threads.find(t => t.key === activeThread.key);
        if (freshActive) setActiveThread(freshActive);
      }
    } catch (_error) {
      console.error(_error);
    } finally {
      setLoading(false);
    }
  }, [buildThreads, activeThread]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThread]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeThread) return;
    setSending(true);
    try {
      const other = activeThread.other;
      const typeStr = activeThread.key.split('-')[0];
      const receiverType = typeStr.toLowerCase().includes('teacher') ? 'teacher' : (typeStr.toLowerCase().includes('admin') ? 'admin' : 'student');
      await sendMessage({ receiver_id: other.id, receiver_type: receiverType, content: messageText });
      setMessageText('');
      const msgRes = await getMessages();
      setMessages(msgRes.data || msgRes || []);
    } catch (_error) {
      console.error(_error);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!activeThread) return;
    try {
      const parts = activeThread.key.split('-');
      const type = parts[0].toLowerCase().includes('teacher') ? 'teacher' : (parts[0].toLowerCase().includes('admin') ? 'admin' : 'student');
      await clearChat(activeThread.other?.id, type);
      toast.success('Conversation history wiped');
      setConfirmClear(false);
      setActiveThread(null);
      const msgRes = await getMessages();
      setMessages(msgRes.data || msgRes || []);
    } catch {
      toast.error('Failed to clear chat');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteMessage(msgId);
      toast.success('Message deleted');
      const msgRes = await getMessages();
      setMessages(msgRes.data || msgRes || []);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleEditMessage = async () => {
    if (!editTarget || !editContent.trim() || editContent === editTarget.content) return;
    try {
      await updateMessage(editTarget.id, editContent);
      toast.success('Message updated');
      setEditTarget(null);
      const msgRes = await getMessages();
      setMessages(msgRes.data || msgRes || []);
    } catch {
      toast.error('Failed to update message');
    }
  };

  const handleComposeSend = async () => {
    if (!composeContent.trim() || !selectedRecipientId) return;
    setComposeSending(true);
    try {
      await sendMessage({ 
        receiver_id: parseInt(selectedRecipientId), 
        receiver_type: composeTarget === 'teacher' ? 'teacher' : 'student', 
        content: composeContent 
      });
      setComposeContent('');
      setSelectedRecipientId('');
      setShowCompose(false);
      const msgRes = await getMessages();
      setMessages(msgRes.data || msgRes || []);
      toast.success('Message dispatched successfully');
    } catch (_error) {
      console.error(_error);
      toast.error('Failed to send message');
    } finally {
      setComposeSending(false);
    }
  };

  const threadsList = buildThreads(messages);
  const activeMessages = activeThread
    ? messages.filter(m => getThreadKey(m) === activeThread.key)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col xl:flex-row gap-8 px-0 sm:px-0 lg:px-0 max-w-full overflow-hidden">
      <div className="flex-1 min-w-0 w-full">
        <div className="bg-white rounded-4xl border border-gray-100 shadow-xl flex flex-col md:flex-row h-[calc(100vh-160px)] overflow-hidden relative">
          
          {/* Thread List */}
          <div className="md:w-96 w-full border-r border-gray-50 flex flex-col shrink-0 bg-gray-50/20">
            <div className={`p-8 border-b border-gray-50 flex items-center justify-between ${activeThread ? 'hidden md:flex' : 'flex'}`}>
               <h3 className="font-black text-gray-800 text-sm uppercase tracking-tight leading-none">Inbox</h3>
               <button onClick={() => setShowCompose(true)} className="p-2.5 bg-blue-600 text-white rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95">
                 <Edit className="w-4 h-4" />
               </button>
            </div>
            <div className={`flex-1 overflow-y-auto divide-y divide-gray-50/50 ${activeThread ? 'hidden md:block' : 'block'}`}>
              {threadsList.map((thread) => (
                <button
                  key={thread.key}
                  onClick={() => setActiveThread(thread)}
                  className={`w-full text-left p-6 hover:bg-white transition-all relative group ${activeThread?.key === thread.key ? 'bg-white shadow-sm' : ''}`}
                >
                  {activeThread?.key === thread.key && (
                    <motion.div layoutId="activeInd" className="absolute left-0 top-6 bottom-6 w-1.5 bg-blue-600 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-linear-to-tr from-blue-100 to-indigo-100 flex items-center justify-center font-black text-blue-600 text-sm shadow-inner group-hover:scale-105 transition-transform shrink-0 border border-white">
                      {thread.other?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight truncate leading-none">
                          {thread.other?.full_name || 'System'}
                        </p>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">
                          {new Date(thread.lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 truncate leading-none italic opacity-80">{thread.lastMsg.content}</p>
                      <div className="mt-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${thread.key.toLowerCase().includes('teacher') ? 'bg-indigo-50 text-indigo-500' : 'bg-green-50 text-green-500'}`}>
                          {thread.key.split('-')[0].split('\\').pop()?.replace('AppModels', '')}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Chat View */}
          <div className={`${activeThread ? 'flex' : 'hidden'} md:flex flex-1 flex flex-col bg-white relative`}>
             {activeThread && (
                <div className="md:hidden p-5 bg-white border-b border-gray-100">
                   <button onClick={() => setActiveThread(null)} className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                      <ChevronRight className="w-4 h-4 rotate-180" /> return to inbox
                   </button>
                </div>
             )}
            {activeThread ? (
              <>
                <div className="p-6 border-b bg-white border-gray-100 flex items-center justify-between shadow-xs z-10 sticky top-0">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-xl shadow-blue-500/20">
                       {activeThread.other?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 text-base uppercase tracking-tight leading-none mb-1.5">
                         {activeThread.other?.full_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[9px] font-black text-green-500 uppercase tracking-widest leading-none">
                           {activeThread.key.split('-')[0].split('\\').pop()?.replace('AppModels', '')} • Online
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setConfirmClear(true)} className="text-[9px] font-black text-red-500 uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-all active:scale-95">Clear History</button>
                    <div className="w-px h-6 bg-gray-100 mx-1" />
                    <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 shadow-xs">
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-8 space-y-8 overflow-y-auto scrollbar-hide bg-gray-50/30">
                    {activeMessages.map(m => {
                      const isMine = m.sender_id === user?.id && m.sender_type?.toLowerCase().includes(user?.role?.toLowerCase());
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'} group animate-in fade-in slide-in-from-bottom-3 duration-500`}>
                           <div className="flex flex-col max-w-[80%]">
                             <div className={`shadow-sm relative transition-all duration-300 ${isMine 
                               ? 'bg-slate-800 text-white rounded-3xl rounded-tl-none border-l-4 border-blue-500' 
                               : 'bg-white text-gray-800 border-indigo-500 rounded-3xl rounded-tr-none border-r-4'} p-4`}>
                                
                                <div className={`absolute top-2 ${isMine ? 'right-2' : 'left-2'} flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity p-2`}>
                                    {isMine && (
                                        <button onClick={() => { setEditTarget(m); setEditContent(m.content); }} className="hover:text-blue-400 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                    )}
                                    <button onClick={() => handleDeleteMessage(m.id)} className="hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>

                                <p className="text-sm font-medium leading-relaxed mt-1 wrap-break-word">{m.content}</p>
                                <div className={`flex items-center gap-2 ${isMine ? 'justify-start' : 'justify-end'}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isMine ? 'opacity-60 text-blue-200' : 'text-gray-300'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                             </div>
                           </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-8 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-4 bg-gray-50 border-2 border-gray-100 rounded-4xl p-2.5 pl-8 focus-within:bg-white focus-within:border-blue-500/40 transition-all shadow-inner relative overflow-visible">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent border-none text-sm font-bold text-gray-700 placeholder:text-gray-400 focus:ring-0 outline-none py-3"
                    />
                    <button 
                      onClick={handleSendMessage} 
                      disabled={sending || !messageText.trim()} 
                      className="w-14 h-14 bg-blue-600 text-white rounded-3xl hover:bg-black transition-all shadow-xl shadow-blue-500/30 active:scale-90 disabled:opacity-30 disabled:scale-100 shrink-0 flex items-center justify-center overflow-hidden"
                    >
                      {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-16 gap-10 bg-linear-to-b from-white to-gray-50/50">
                 <div className="w-28 h-28 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center border border-gray-50 animate-bounce-slow">
                    <Megaphone className="w-12 h-12 text-blue-500 opacity-30" />
                 </div>
                 <h3 className="font-black text-gray-800 text-2xl uppercase tracking-tighter mb-3">Academic Dispatch</h3>
                 <button onClick={() => setShowCompose(true)} className="px-12 py-5 bg-blue-800 text-white rounded-4xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-black transition-all active:scale-95 group">
                    start composition
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div className="xl:w-96 w-full shrink-0 xl:block hidden">
        <MessagesRight teachers={myTeachers} onMessage={(tId) => { setSelectedRecipientId(tId); setComposeTarget('teacher'); setShowCompose(true); }} />
      </div>

      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-500 p-4 text-left">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
                <div className="flex items-center justify-between p-10 border-b border-gray-50 bg-gray-50/30">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-1">New Message</h2>
                        <div className="flex gap-2 mt-4">
                           <button onClick={() => setComposeTarget('teacher')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${composeTarget === 'teacher' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                              <BookOpen className="w-3 h-3" /> Teacher
                           </button>
                           <button onClick={() => setComposeTarget('classmate')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${composeTarget === 'classmate' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                              <Users className="w-3 h-3" /> Classmate
                           </button>
                        </div>
                    </div>
                    <button onClick={() => setShowCompose(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all active:scale-90">
                       <X className="w-6 h-6 text-gray-300" />
                    </button>
                </div>
                <div className="p-10 space-y-8">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 pr-2">
                       Choose {composeTarget === 'teacher' ? 'Academic Mentor' : 'Class Peer'}
                    </label>
                    <select value={selectedRecipientId} onChange={e => setSelectedRecipientId(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-6 py-5 text-sm font-black uppercase tracking-tight bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                        <option value="">-- select recipient --</option>
                        {composeTarget === 'teacher' ? (
                          myTeachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)
                        ) : (
                          myClassmates.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)
                        )}
                    </select>
                  </div>
                  <textarea 
                      value={composeContent} 
                      onChange={e => setComposeContent(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full border-2 border-gray-100 rounded-3xl px-6 py-6 text-gray-800 text-sm font-medium min-h-[180px] bg-gray-50/20 focus:bg-white focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner"
                  />
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                    <button onClick={() => setShowCompose(false)} className="px-8 py-5 font-black text-[11px] text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">cancel</button>
                    <button 
                        onClick={handleComposeSend} 
                        disabled={composeSending || !selectedRecipientId}
                        className="px-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3 disabled:opacity-30 transition-all"
                    >
                        dispatch message
                    </button>
                  </div>
                </div>
            </motion.div>
          </div>
        )}

        {confirmClear && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-500 p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl border border-gray-50">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-3">Wipe History?</h3>
                    <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed italic opacity-80">Permanently erase communication history.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleClearChat} className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95">Yes, Wipe Everything</button>
                        <button onClick={() => setConfirmClear(false)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Cancel</button>
                    </div>
                </motion.div>
            </div>
        )}

        {editTarget && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-500 p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl border border-gray-50">
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-6">Modify Dispatch</h3>
                    <textarea 
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-3xl px-6 py-6 text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500/30 outline-none transition-all resize-none min-h-[160px] mb-8 shadow-inner"
                    />
                    <div className="flex flex-col gap-3">
                        <button onClick={handleEditMessage} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Save Changes</button>
                        <button onClick={() => setEditTarget(null)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Dismiss</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Messages;
