import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Copy, Check, UploadCloud, Clock, CheckCircle2, 
  AlertCircle, FileText, Ban, Loader2, ArrowRight, DollarSign, 
  Info, ShieldCheck, Eye, ExternalLink, Calendar, Plus
} from 'lucide-react';
import { getStudentFinance, submitStudentPayment } from '../../../services/financeService';
import OfficialReceiptModal from '../../../components/OfficialReceiptModal';
import toast from 'react-hot-toast';

const StudentFinancePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Upload Payment Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    bank_used: '',
    sender_account_name: '',
    sender_account_last4: '',
    transaction_reference: '',
    fee_structure_id: '',
    student_note: '',
  });

  // Official Receipt Modal
  const [selectedOfficialPayment, setSelectedOfficialPayment] = useState(null);

  const fetchFinance = async () => {
    try {
      const res = await getStudentFinance();
      setData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleCopyAccount = (accountNumber) => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success('Account number copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file format. Only JPG, PNG, and PDF receipts are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setReceiptFile(file);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!receiptFile) {
      toast.error('Please attach your transfer receipt or proof of payment.');
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid transfer amount.');
      return;
    }

    if (!form.bank_used.trim() || !form.sender_account_name.trim() || !form.transaction_reference.trim()) {
      toast.error('Please complete all required payment fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', form.amount);
      formData.append('payment_date', form.payment_date);
      formData.append('bank_used', form.bank_used.trim());
      formData.append('sender_account_name', form.sender_account_name.trim());
      if (form.sender_account_last4) formData.append('sender_account_last4', form.sender_account_last4.trim());
      formData.append('transaction_reference', form.transaction_reference.trim());
      if (form.fee_structure_id) formData.append('fee_structure_id', form.fee_structure_id);
      if (form.student_note) formData.append('student_note', form.student_note.trim());
      formData.append('receipt', receiptFile);

      const res = await submitStudentPayment(formData);
      toast.success(res?.message || 'Payment receipt submitted! It is now pending administrator verification.');
      
      setShowUploadModal(false);
      setReceiptFile(null);
      setForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        bank_used: '',
        sender_account_name: '',
        sender_account_last4: '',
        transaction_reference: '',
        fee_structure_id: '',
        student_note: '',
      });

      await fetchFinance();
    } catch (err) {
      toast.error(err.message || 'Failed to submit payment receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const breakdown = data?.fee_breakdown || {};
  const bank = data?.bank_account;
  const history = data?.payment_history || [];
  const feeItems = breakdown.items || [];

  const totalFee = parseFloat(breakdown.total_fee || 0);
  const confirmedPaid = parseFloat(breakdown.confirmed_paid || 0);
  const pendingVerification = parseFloat(breakdown.pending_verification || 0);
  const outstandingBalance = parseFloat(breakdown.outstanding_balance || 0);
  const paymentStatus = breakdown.payment_status || 'UNPAID';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 flex items-center gap-3 tracking-tight">
            <DollarSign className="w-7 h-7 text-blue-600" /> School Fees & Payment Portal
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {data?.class?.name || 'Class'} • {data?.term || '1st Term'} ({data?.session?.name || 'Current Session'})
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-102"
        >
          <UploadCloud className="w-4 h-4" /> Upload Bank Transfer Receipt
        </button>
      </div>

      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assessed Fees */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
          <p className="text-gray-400 text-xs font-black uppercase tracking-wider">Total School Fees</p>
          <h2 className="text-2xl font-black text-gray-900 mt-2">
            ₦{totalFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-semibold">Assessed for {data?.term}</p>
        </div>

        {/* Card 2: Confirmed Paid */}
        <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-emerald-700 text-xs font-black uppercase tracking-wider">Confirmed Paid</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-800 mt-2">
            ₦{confirmedPaid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Verified by Admin</p>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="bg-amber-50/60 rounded-3xl p-6 border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-amber-700 text-xs font-black uppercase tracking-wider">Pending Review</p>
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-amber-800 mt-2">
            ₦{pendingVerification.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] text-amber-600 mt-1 font-semibold">Awaiting Verification</p>
        </div>

        {/* Card 4: Outstanding Balance */}
        <div className={`rounded-3xl p-6 border shadow-xs ${
          outstandingBalance <= 0 
            ? 'bg-emerald-50/40 border-emerald-100' 
            : 'bg-rose-50/60 border-rose-100'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-black uppercase tracking-wider ${
              outstandingBalance <= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              Outstanding Balance
            </p>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              paymentStatus === 'PAID'
                ? 'bg-emerald-200 text-emerald-800'
                : paymentStatus === 'PARTIALLY_PAID'
                ? 'bg-amber-200 text-amber-900'
                : 'bg-rose-200 text-rose-900'
            }`}>
              {paymentStatus.replace('_', ' ')}
            </span>
          </div>
          <h2 className={`text-2xl font-black mt-2 ${
            outstandingBalance <= 0 ? 'text-emerald-800' : 'text-rose-800'
          }`}>
            ₦{outstandingBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] text-gray-500 mt-1 font-semibold">
            {outstandingBalance <= 0 ? 'All fees settled!' : 'Remaining to be paid'}
          </p>
        </div>
      </div>

      {/* School Bank Account Transfer Banner */}
      <div className="bg-linear-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-400/20 text-sky-300 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Official School Bank Account</h3>
                <p className="text-xs text-blue-200 font-semibold">Transfer your fees directly to this account</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 bg-white/10 text-blue-200 text-xs font-bold px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authorized Account
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 items-center">
            <div>
              <p className="text-[10px] text-blue-300 uppercase font-black tracking-wider">Bank Name</p>
              <p className="text-lg font-black text-white mt-0.5">{bank?.bank_name || 'School Bank'}</p>
              {bank?.branch_name && (
                <p className="text-xs text-blue-200/80 mt-0.5">{bank.branch_name}</p>
              )}
            </div>

            <div>
              <p className="text-[10px] text-blue-300 uppercase font-black tracking-wider">Account Name</p>
              <p className="text-base font-bold text-white mt-0.5">{bank?.account_name || 'School Name'}</p>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-sky-300 uppercase font-black tracking-wider">Account Number</p>
                <p className="font-mono text-2xl font-black text-sky-300 tracking-wider">
                  {bank?.account_number || '0000000000'}
                </p>
              </div>
              <button
                onClick={() => handleCopyAccount(bank?.account_number)}
                className={`p-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-blue-950 hover:bg-blue-50'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {bank?.instructions && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-blue-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sky-300 uppercase text-[10px] tracking-wider mb-0.5">
                  Payment Narration & Instructions
                </p>
                <p>{bank.instructions}</p>
                <p className="mt-1 text-[11px] text-blue-200">
                  Student Reg ID: <span className="font-mono font-bold text-white">{data?.student?.student_id || data?.student?.email}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fee Items Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">Current Term Fee Breakdown</h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Itemized components of your assessed school fees</p>
          </div>
          <span className="text-sm font-black text-blue-900">
            Total: ₦{totalFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {feeItems.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center font-semibold">No fee items configured for this term.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5">Fee Item</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Term</th>
                  <th className="py-2.5">Due Date</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {feeItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-bold text-gray-900">
                      {item.title || item.fee_type}
                      {item.description && <p className="text-[10px] text-gray-400 font-normal">{item.description}</p>}
                    </td>
                    <td className="py-3 text-gray-500">{item.fee_type}</td>
                    <td className="py-3 text-gray-500">{item.term}</td>
                    <td className="py-3 text-gray-500">{item.due_date ? new Date(item.due_date).toLocaleDateString('en-NG') : 'Before Term Exam'}</td>
                    <td className="py-3 text-right font-black text-sm text-gray-900">
                      ₦{parseFloat(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History & Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-black text-gray-900">Your Bank Transfer Submissions</h3>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            Track verification status and access your official receipts
          </p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-600" />
            <p className="font-bold text-xs">No bank transfer payments submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(p => {
              const isPending = p.status === 'PENDING_VERIFICATION' || p.status === 'pending';
              const isConfirmed = p.status === 'CONFIRMED' || p.status === 'successful';
              const isRejected = p.status === 'REJECTED' || p.status === 'failed';

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isConfirmed 
                      ? 'border-emerald-100 bg-emerald-50/20' 
                      : isPending 
                      ? 'border-amber-100 bg-amber-50/20' 
                      : 'border-rose-100 bg-rose-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-base">
                          ₦{parseFloat(p.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">• {p.bank_used}</span>
                      </div>

                      <p className="text-xs text-gray-500 font-mono">
                        Ref: <span className="font-bold text-gray-700">{p.transaction_reference}</span>
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>Date: {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-NG') : new Date(p.created_at).toLocaleDateString('en-NG')}</span>
                        {p.sender_account_name && <span>• Sender: {p.sender_account_name}</span>}
                      </div>

                      {/* Rejection notice */}
                      {isRejected && p.rejection_reason && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-rose-900">Rejection Reason:</p>
                          <p className="mt-0.5">{p.rejection_reason}</p>
                          <p className="mt-1 text-[11px] text-rose-600 font-semibold">
                            Please re-transfer or re-upload a clear receipt resolving the issue above.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      {isPending && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Pending Verification
                        </span>
                      )}

                      {isConfirmed && (
                        <div className="flex flex-col items-start sm:items-end gap-1.5">
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed & Credited
                          </span>
                          <button
                            onClick={() => setSelectedOfficialPayment(p)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Official Receipt
                          </button>
                        </div>
                      )}

                      {isRejected && (
                        <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5 text-rose-600" /> Rejected
                        </span>
                      )}

                      {/* View attached proof */}
                      {p.receipt_path && (
                        <a
                          href={`/api/payments/${p.id}/receipt`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View Submitted Proof
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL: UPLOAD PAYMENT RECEIPT ───────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">Submit Bank Transfer Proof</h3>
                    <p className="text-xs text-gray-400 font-semibold">Verify receipt against school account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informational Policy Alert */}
              <div className="bg-amber-50 p-4 text-xs text-amber-800 border-b border-amber-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <span className="font-black uppercase tracking-wide">Important:</span> Submitting a receipt places your payment in <span className="font-bold">Pending Verification</span>. Your balance updates only after administrator approval.
                </p>
              </div>

              <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Amount Transferred (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="100"
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-black text-blue-900 focus:outline-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Date of Transfer <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={form.payment_date}
                      onChange={e => setForm({ ...form, payment_date: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Bank Used <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. GTBank, Kuda, Access"
                      value={form.bank_used}
                      onChange={e => setForm({ ...form, bank_used: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Sender Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Name on debit account"
                      value={form.sender_account_name}
                      onChange={e => setForm({ ...form, sender_account_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Last 4 Digits (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4821"
                      value={form.sender_account_last4}
                      onChange={e => setForm({ ...form, sender_account_last4: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs font-mono focus:outline-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Transaction Reference / Session ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Found on your transfer receipt"
                    value={form.transaction_reference}
                    onChange={e => setForm({ ...form, transaction_reference: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs font-mono focus:outline-blue-500 font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Must be unique per transfer.</p>
                </div>

                {feeItems.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Specific Fee Item (Optional)
                    </label>
                    <select
                      value={form.fee_structure_id}
                      onChange={e => setForm({ ...form, fee_structure_id: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    >
                      <option value="">General Term Fees (Tuition & Levies)</option>
                      {feeItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title || item.fee_type} (₦{parseFloat(item.amount).toLocaleString('en-NG')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Upload Transfer Receipt Proof <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-gray-50 transition-colors">
                    <input
                      required
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      id="receipt_file_input"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="receipt_file_input" className="cursor-pointer block space-y-1">
                      <UploadCloud className="w-8 h-8 text-blue-500 mx-auto" />
                      {receiptFile ? (
                        <p className="font-black text-gray-800 text-xs">{receiptFile.name}</p>
                      ) : (
                        <>
                          <p className="font-bold text-gray-700 text-xs">Click to browse file</p>
                          <p className="text-[10px] text-gray-400">JPG, PNG, or PDF (Max 5MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Note for Bursary / Administrator (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid by uncle Mr. Oladipo"
                    value={form.student_note}
                    onChange={e => setForm({ ...form, student_note: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    {submitting ? 'Uploading...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: OFFICIAL RECEIPT ───────────────────────────── */}
      {selectedOfficialPayment && (
        <OfficialReceiptModal
          payment={selectedOfficialPayment}
          onClose={() => setSelectedOfficialPayment(null)}
        />
      )}
    </motion.div>
  );
};

export default StudentFinancePage;
