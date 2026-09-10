import { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  BookOpen,
  Loader2,
  Calendar,
  AlertCircle,
  FileText,
  Printer,
  History,
  Download,
  CheckCircle,
  Eye,
  Award,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import GradesRight from './GradesRight';
import ReportCardView from '../../../components/ReportCardView';
import {
  getStudentReportCardView,
  getAcademicSessions,
  getStudentReportCardHistory,
  downloadStudentReportCardPdf
} from '../../../services/reportCardService';
import toast from 'react-hot-toast';

export default function Grades() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');

  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // History state
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterSession, setHistoryFilterSession] = useState('all');
  const [historyFilterTerm, setHistoryFilterTerm] = useState('all');
  const [historyFilterSection, setHistoryFilterSection] = useState('all');
  const [historyFilterClass, setHistoryFilterClass] = useState('all');

  useEffect(() => {
    initSessions();
  }, []);

  useEffect(() => {
    if (selectedSession && selectedTerm && activeTab === 'current') {
      fetchReportCard();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, selectedTerm, activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const initSessions = async () => {
    try {
      const res = await getAcademicSessions();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSessions(list);
      const active = list.find(s => s.is_current) || list[0];
      if (active) {
        setSelectedSession(active.id);
        setSelectedTerm(active.current_term || '1st Term');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReportCard = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getStudentReportCardView({
        academic_session_id: selectedSession,
        term: selectedTerm,
      });
      setReportCard(data);
    } catch (e) {
      setReportCard(null);
      setErrorMsg(e.message || 'Report card not released yet.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getStudentReportCardHistory();
      setHistoryData(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredHistoryCards = (historyData?.report_cards || []).filter(rc => {
    if (historyFilterSession !== 'all' && rc.academic_session_id !== parseInt(historyFilterSession)) {
      return false;
    }
    if (historyFilterTerm !== 'all' && rc.term !== historyFilterTerm) return false;
    const sectionId = rc.academic_section_id || rc.school_class?.academic_section_id;
    if (historyFilterSection !== 'all' && String(sectionId) !== historyFilterSection) return false;
    if (historyFilterClass !== 'all' && String(rc.school_class_id) !== historyFilterClass) return false;
    return true;
  });

  const historyCards = historyData?.report_cards || [];
  const historySections = Array.from(new Map(historyCards
    .filter(card => card.school_class?.academic_section)
    .map(card => [String(card.school_class.academic_section.id), card.school_class.academic_section])).values());
  const historyClasses = Array.from(new Map(historyCards
    .filter(card => card.school_class)
    .map(card => [String(card.school_class.id), card.school_class])).values());

  const downloadPdf = async (cardId) => {
    try {
      await downloadStudentReportCardPdf(cardId);
    } catch (error) {
      toast.error(error.message || 'PDF download failed.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 print:hidden">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'current'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-gray-500 hover:text-slate-800 border border-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Academic Report Card
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-gray-500 hover:text-slate-800 border border-gray-100'
          }`}
        >
          <History className="w-4 h-4" /> All Academic History
          {historyData?.total_released > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full">
              {historyData.total_released}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'current' ? (
        <>
          {/* Session / Term Selector */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between print:hidden">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Academic Session</label>
                <select
                  value={selectedSession}
                  onChange={e => setSelectedSession(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={e => setSelectedTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term (Annual)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {reportCard && (
                <>
                  <button
                    onClick={() => downloadPdf(reportCard.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print View
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main View Area */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Retrieving official academic records...</p>
            </div>
          ) : reportCard ? (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 min-w-0">
                <ReportCardView reportCard={reportCard} showActions={false} />
              </div>
              <div className="lg:w-80 w-full shrink-0 print:hidden">
                <GradesRight reportCard={reportCard} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-800">Result Not Released</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {errorMsg || 'Your academic report card for this term has not been released yet by the administration. You will receive an email and notification once it is officially released.'}
              </p>
            </div>
          )}
        </>
      ) : (
        /* Academic History Portal */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Academic Report Card Archive</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Browse and download all your released term and annual report cards across all academic sessions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={historyFilterSession}
                onChange={e => setHistoryFilterSession(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">All Sessions</option>
                {(historyData?.sessions || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select
                value={historyFilterTerm}
                onChange={e => setHistoryFilterTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">All Terms</option>
                {['1st Term', '2nd Term', '3rd Term'].map(term => <option key={term}>{term}</option>)}
              </select>
              <select
                value={historyFilterSection}
                onChange={e => setHistoryFilterSection(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">All Sections</option>
                {historySections.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}
              </select>
              <select
                value={historyFilterClass}
                onChange={e => setHistoryFilterClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">All Classes</option>
                {historyClasses.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
              </select>
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading historical archives...</p>
            </div>
          ) : filteredHistoryCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHistoryCards.map(card => {
                const isThird = ['3rd Term', '3rd term', 'third_term', 'Third Term'].includes(card.term);
                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-800 text-[10px] font-black uppercase rounded-full border border-blue-200">
                          {card.academic_session?.name || 'Session'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isThird ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {card.term}
                        </span>
                      </div>

                      <h3 className="font-black text-slate-900 text-base mb-1">
                        {card.school_class?.name || 'Class'}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                        <Clock className="w-3.5 h-3.5" /> Released on {new Date(card.released_at).toLocaleDateString()}
                      </p>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 block uppercase">Average</span>
                          <span className="text-sm font-black text-blue-900">{card.average_score}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 block uppercase">Grade</span>
                          <span className="text-sm font-black text-amber-700">{card.overall_grade || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 block uppercase">Position</span>
                          <span className="text-sm font-black text-slate-800">
                            {card.position ? `${card.position}${['st','nd','rd'][(card.position % 10)-1] || 'th'}` : '-'}
                          </span>
                        </div>
                      </div>

                      {isThird && card.promotion_status && (
                        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-emerald-700" /> Promotion:
                          </span>
                          <span className="font-black">{card.promotion_status}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/student/report-cards/${card.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Report
                      </button>
                      <button
                        onClick={() => downloadPdf(card.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-800">No Historical Records Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No past released report cards found for your account. Released report cards from previous terms and sessions will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
