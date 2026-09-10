import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Printer, Download, CheckCircle, Building2, Calendar, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { downloadOfficialReceiptPdf } from '../services/financeService';
import toast from 'react-hot-toast';

const OfficialReceiptModal = ({ payment, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  if (!payment) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadOfficialReceiptPdf(payment.id);
      toast.success('Official Receipt PDF downloaded successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to download receipt PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const receiptNumber = payment.official_receipt_number || `EYS-${payment.id}`;
  const issuedAt = payment.official_receipt_issued_at 
    ? new Date(payment.official_receipt_issued_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-NG');

  const studentName = payment.student?.full_name || payment.student_name || 'Student';
  const studentId = payment.student?.student_id || payment.student_reg_id || 'N/A';
  const className = payment.school_class?.name || payment.class_name || 'N/A';
  const sessionName = payment.academic_session?.name || payment.session_name || 'Current Session';
  const termName = payment.term || '1st Term';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 print:m-0 print:p-0 print:shadow-none print:w-full"
      >
        {/* Modal Top Bar - Hidden in Print */}
        <div className="bg-gray-900 text-white p-4 px-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-black text-sm tracking-wide uppercase">Official School Fee Receipt</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-all text-white"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-all text-white disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 sm:p-10 space-y-6 text-gray-800" id="official-receipt-print-area">
          {/* Header Banner */}
          <div className="border-b-2 border-dashed border-gray-200 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-900 text-white font-black text-2xl mb-3 shadow-md">
              EYS
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-950 uppercase">
              Early Years School Management
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
              Official Electronic Fee Receipt & Proof of Payment
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Payment Confirmed & Verified
            </div>
          </div>

          {/* Receipt Meta & Identifier */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
            <div>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Receipt Number</p>
              <p className="font-mono font-black text-gray-900 text-sm mt-0.5">{receiptNumber}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Date Issued</p>
              <p className="font-bold text-gray-800 mt-0.5">{issuedAt}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Academic Term</p>
              <p className="font-bold text-gray-800 mt-0.5">{termName} • {sessionName}</p>
            </div>
          </div>

          {/* Student & Class Info */}
          <div className="grid sm:grid-cols-2 gap-4 border border-gray-100 rounded-2xl p-4">
            <div>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Student Name</p>
              <p className="font-black text-gray-900 text-base">{studentName}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">ID: {studentId}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Enrolled Class</p>
              <p className="font-black text-gray-900 text-base">{className}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Method: Manual Bank Transfer</p>
            </div>
          </div>

          {/* Transfer & Bank Transaction Details */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-400">Transaction Particulars</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5">Transfer Details</th>
                    <th className="py-2.5 text-right">Confirmed Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  <tr>
                    <td className="py-3.5">
                      <p className="font-black text-gray-900">
                        {payment.fee_structure?.title || payment.fee_structure?.fee_type || payment.description || 'School Tuition & Levies'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Ref: {payment.transaction_reference}</p>
                    </td>
                    <td className="py-3.5 text-gray-600">
                      <p>Bank: <span className="font-bold text-gray-800">{payment.bank_used || 'N/A'}</span></p>
                      <p>Sender: <span className="font-bold text-gray-800">{payment.sender_account_name || 'N/A'}</span></p>
                    </td>
                    <td className="py-3.5 text-right font-black text-sm text-gray-900">
                      ₦{parseFloat(payment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-900">
                    <td colSpan="2" className="pt-4 font-black uppercase text-xs text-gray-700">
                      Total Amount Received & Credited
                    </td>
                    <td className="pt-4 text-right font-black text-xl text-emerald-700">
                      ₦{parseFloat(payment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Admin Verification Signoff */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              <p className="font-bold text-gray-700">Verified By:</p>
              <p className="font-semibold text-gray-600">
                {payment.verified_by_admin?.full_name || 'Authorized School Bursary'}
              </p>
              {payment.admin_note && (
                <p className="text-[11px] italic text-gray-400 mt-0.5">Note: {payment.admin_note}</p>
              )}
            </div>
            <div className="text-right font-mono text-[11px] text-gray-400">
              <p>Status: CONFIRMED</p>
              <p>Early Years Electronic Seal</p>
            </div>
          </div>
        </div>

        {/* Footer Close Button - Hidden in Print */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OfficialReceiptModal;
