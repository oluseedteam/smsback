import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReportCardView from '../../../components/ReportCardView';
import { downloadStudentReportCardPdf, getStudentReportCardById } from '../../../services/reportCardService';

export default function StudentReportCardDetailsPage() {
  const { reportCardId } = useParams();
  const navigate = useNavigate();
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getStudentReportCardById(reportCardId)
      .then(card => {
        if (active) setReportCard(card);
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'This report card is unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reportCardId]);

  const downloadPdf = async () => {
    try {
      await downloadStudentReportCardPdf(reportCardId);
    } catch (requestError) {
      toast.error(requestError.message || 'PDF download failed.');
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (error || !reportCard) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
        <p className="font-bold text-slate-800">{error || 'This report card is unavailable.'}</p>
        <button onClick={() => navigate('/student/report-card')} className="mt-4 text-sm font-bold text-blue-600">Back to Report Cards</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button onClick={() => navigate('/student/report-card')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Report Card History
        </button>
        <div className="flex gap-2">
          <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>
      <ReportCardView reportCard={reportCard} showActions={false} />
    </div>
  );
}
