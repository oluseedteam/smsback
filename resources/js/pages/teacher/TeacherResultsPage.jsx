import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FileCheck2, Loader2, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAcademicSessions, getTeacherReportCards, teacherReviewReportCard } from '../../services/reportCardService';

export default function TeacherResultsPage() {
  const [cards, setCards] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [term, setTerm] = useState('1st Term');
  const [status, setStatus] = useState('submitted');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTeacherReportCards({
        ...(sessionId ? { academic_session_id: sessionId } : {}),
        ...(term ? { term } : {}),
        ...(status ? { status } : {}),
      });
      setCards(response?.data || response || []);
    } catch (error) {
      toast.error(error.message || 'Could not load the class-teacher review queue.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, status, term]);

  useEffect(() => {
    getAcademicSessions().then(response => {
      const items = Array.isArray(response) ? response : (response?.data || []);
      setSessions(items);
      const current = items.find(item => item.is_current) || items[0];
      if (current) {
        setSessionId(String(current.id));
        setTerm(current.current_term || '1st Term');
      }
    }).catch(() => toast.error('Could not load academic sessions.'));
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const review = async (card) => {
    try {
      const response = await teacherReviewReportCard(card.id);
      toast.success(response.message || 'Result reviewed.');
      loadCards();
    } catch (error) {
      toast.error(error.message || 'Review failed.');
    }
  };

  const visibleCards = cards.filter(card => {
    const query = search.toLowerCase();
    return !query || card.student?.full_name?.toLowerCase().includes(query) || card.student?.student_id?.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-black text-slate-900"><FileCheck2 className="text-blue-600" /> Result Review Queue</h1>
        <p className="mt-1 text-xs text-slate-500">Review complete, teacher-submitted results for classes where you are the assigned class teacher.</p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <select value={sessionId} onChange={event => setSessionId(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">
          <option value="">All sessions</option>
          {sessions.map(session => <option key={session.id} value={session.id}>{session.name}</option>)}
        </select>
        <select value={term} onChange={event => setTerm(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">
          {['1st Term', '2nd Term', '3rd Term'].map(item => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={event => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">
          <option value="">All workflow states</option>
          <option value="submitted">Awaiting review</option>
          <option value="class_teacher_reviewed">Reviewed</option>
          <option value="returned">Returned</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search student" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading review queue…</div>
        ) : visibleCards.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-500">No results match this queue.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleCards.map(card => (
              <div key={card.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-slate-900">{card.student?.full_name}</p>
                  <p className="text-xs text-slate-500">{card.student?.student_id} · {card.school_class?.name} · {card.academic_session?.name} · {card.term}</p>
                  <p className={`mt-1 text-[11px] font-bold ${card.is_complete ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {card.is_complete ? 'Completeness checks passed' : `Incomplete: ${(card.validation_errors || []).join('; ')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">{card.status}</span>
                  {card.status === 'submitted' && (
                    <button disabled={!card.is_complete} onClick={() => review(card)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                      <CheckCircle2 className="h-4 w-4" /> Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={loadCards} className="m-4 flex items-center gap-2 text-xs font-bold text-blue-700"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
    </div>
  );
}
