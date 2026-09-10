import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Loader2, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import apiFetch from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function AiAssistantModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.full_name || 'there'}! I am your GHRA AI Assistant. How can I help you today?`
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const role = user?.role || 'student';
  const roleTitle = role === 'student' ? 'Student Study Assistant' : 
                    role === 'teacher' ? 'Faculty Academic Assistant' : 
                    'Executive Management Assistant';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    
    const updatedMessages = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await apiFetch('/ai/query', {
        method: 'POST',
        body: JSON.stringify({
          prompt: userText,
          conversation_history: updatedMessages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.reply || 'I am processing your request. Please ask any question about GHRA.'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Apologies, I encountered an issue: ${err.message || 'Could not connect to AI service'}.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = role === 'student' ? [
    'What is the school motto?',
    'How do I view my report card?',
    'Where is the digital library?'
  ] : role === 'teacher' ? [
    'How do I record score sheets?',
    'How do I request a timetable change?',
    'How do I author CBT questions?'
  ] : [
    'How do I approve teacher-created students?',
    'How do I release report cards in batch?',
    'How do I promote students to next session?'
  ];

  if (!user) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-600/40 border border-blue-400/30 transition-all duration-300 hover:scale-105 cursor-pointer"
        title="GHRA AI Assistant"
      >
        <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
        <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">GHRA AI</span>
      </button>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-lg h-[90vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4.5 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-sky-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight uppercase">GHRA AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-200 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span>{roleTitle}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-900/10'
                        : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/80 shadow-sm'
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 text-xs justify-start">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-bl-none border border-slate-200 text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="p-2.5 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto shrink-0">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(qp);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-900 text-slate-600 text-[11px] font-medium whitespace-nowrap transition cursor-pointer border border-slate-200"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask GHRA AI anything..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
