import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShieldAlert, CheckCircle, School } from 'lucide-react';
import { verifyPublicTokenReportCard } from '../../services/reportCardService';
import ReportCardView from '../../components/ReportCardView';

export default function ReportCardVerifyPage() {
  const { token } = useParams();
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (token) {
      verify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verify = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await verifyPublicTokenReportCard(token);
      setReportCard(data);
    } catch (e) {
      setErrorMsg(e.message || 'Invalid or expired report card link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 animate-in fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Verification Status Banner */}
        {reportCard && (
          <div className="bg-emerald-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md print:hidden">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-sky-400" />
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">Official Verified Academic Record</h2>
                <p className="text-[11px] text-emerald-100">
                  Authenticated online report card for {reportCard.student?.full_name} ({reportCard.academic?.term} {reportCard.academic?.session_name})
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-sky-400 transition-colors cursor-pointer"
            >
              Print
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-3 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Verifying secure report card token...</p>
          </div>
        ) : reportCard ? (
          <ReportCardView reportCard={reportCard} showActions={false} />
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-800">Invalid or Expired Link</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {errorMsg || 'This report card access link is invalid, expired, or has been revoked by the school administration.'}
            </p>
            <div className="pt-2 text-[11px] text-gray-400">
              Please contact GHRA administration or request a new release email.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
