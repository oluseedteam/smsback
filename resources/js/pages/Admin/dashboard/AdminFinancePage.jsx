import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, Plus, Trash2, Pencil, X, Loader2, CheckCircle, 
  AlertCircle, History, CreditCard, Search, Filter, Eye, FileText, 
  Check, Ban, ShieldAlert, ArrowUpRight, TrendingUp, Clock, AlertTriangle, ExternalLink
} from 'lucide-react';
import { 
  getFees, createFee, updateFee, deleteFee, 
  getFeeTypes, createFeeType,
  getAdminPayments, confirmPayment, rejectPayment, getFinanceOverview 
} from '../../../services/financeService';
import { getClasses } from '../../../services/classService';
import { confirmDialog } from '../../../services/dialogService';
import OfficialReceiptModal from '../../../components/OfficialReceiptModal';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminFinancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'verifications';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Data States
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [fees, setFees] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [classes, setClasses] = useState([]);

  // Verification Hub Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedOfficialPayment, setSelectedOfficialPayment] = useState(null);
  const [actionPayment, setActionPayment] = useState(null);
  const [actionType, setActionType] = useState(null); // 'confirm' | 'reject'
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fee Form Modal
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeFormLoading, setFeeFormLoading] = useState(false);
  const [feeFormData, setFeeFormData] = useState({
    class_name: '',
    department: '',
    fee_type: 'Tuition Fee',
    title: '',
    term: '1st Term',
    academic_year: '2026/2027',
    amount: '',
    due_date: '',
    description: '',
    is_active: true,
  });
  const [newFeeTypeName, setNewFeeTypeName] = useState('');
  const [showNewFeeTypeInput, setShowNewFeeTypeInput] = useState(false);

  const departmentOptions = ['', 'Science', 'Art', 'Commercial'];

  const fetchOverview = async () => {
    try {
      const res = await getFinanceOverview();
      setOverview(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      if (classFilter) params.class_id = classFilter;
      const res = await getAdminPayments(params);
      setPayments(res?.payments?.data || res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFees = async () => {
    try {
      const [feesRes, feeTypesRes, classesRes] = await Promise.all([
        getFees(),
        getFeeTypes(),
        getClasses(),
      ]);
      setFees(Array.isArray(feesRes) ? feesRes : []);
      setFeeTypes(Array.isArray(feeTypesRes) ? feeTypesRes : []);
      setClasses(Array.isArray(classesRes) ? classesRes : classesRes?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchPayments(), fetchFees()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, searchQuery, classFilter]);

  const handleConfirmPayment = async () => {
    if (!actionPayment) return;
    setActionLoading(true);
    try {
      await confirmPayment(actionPayment.id, { admin_note: adminNote });
      toast.success('Payment confirmed and student balance updated!');
      setActionPayment(null);
      setActionType(null);
      setAdminNote('');
      if (selectedReceipt) setSelectedReceipt(null);
      await Promise.all([fetchPayments(), fetchOverview()]);
    } catch (err) {
      toast.error(err.message || 'Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!actionPayment) return;
    if (!rejectionReason.trim()) {
      toast.error('A rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      await rejectPayment(actionPayment.id, {
        rejection_reason: rejectionReason,
        admin_note: adminNote,
      });
      toast.success('Payment rejected. Student has been notified.');
      setActionPayment(null);
      setActionType(null);
      setRejectionReason('');
      setAdminNote('');
      if (selectedReceipt) setSelectedReceipt(null);
      await Promise.all([fetchPayments(), fetchOverview()]);
    } catch (err) {
      toast.error(err.message || 'Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFeeType = async () => {
    if (!newFeeTypeName.trim()) return;
    try {
      const res = await createFeeType({ name: newFeeTypeName.trim() });
      if (res?.fee_type) {
        setFeeTypes([...feeTypes, res.fee_type]);
        setFeeFormData({ ...feeFormData, fee_type: res.fee_type.name });
      }
      setNewFeeTypeName('');
      setShowNewFeeTypeInput(false);
      toast.success('Fee type created!');
    } catch (err) {
      toast.error(err.message || 'Failed to create fee type');
    }
  };

  const handleSaveFee = async (e) => {
    e.preventDefault();
    setFeeFormLoading(true);
    try {
      const payload = {
        ...feeFormData,
        amount: parseFloat(feeFormData.amount),
      };
      if (!payload.department) delete payload.department;
      if (!payload.due_date) delete payload.due_date;

      if (editingFee) {
        await updateFee(editingFee.id, payload);
        toast.success('Fee structure updated!');
      } else {
        await createFee(payload);
        toast.success('Fee structure created!');
      }
      setShowFeeModal(false);
      setEditingFee(null);
      fetchFees();
      fetchOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to save fee structure');
    } finally {
      setFeeFormLoading(false);
    }
  };

  const handleDeleteFee = async (id) => {
    const ok = await confirmDialog({
      title: 'Delete Fee Structure',
      message: 'Are you sure you want to delete this fee item? This cannot be undone.',
      confirmText: 'Yes, Delete',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await deleteFee(id);
      toast.success('Fee structure deleted!');
      fetchFees();
      fetchOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to delete fee structure');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingCount = overview?.overview?.pending_count ?? payments.filter(p => p.status === 'PENDING_VERIFICATION').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      {/* Alert Header */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 flex items-center gap-3 tracking-tight">
            <DollarSign className="w-7 h-7 text-blue-600" /> Financial Management & Verifications
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Review manual bank transfer receipts, confirm student payments, and manage fee structures.
          </p>
        </div>

        {activeTab === 'fees' && (
          <button
            onClick={() => {
              setEditingFee(null);
              setFeeFormData({
                class_name: '',
                department: '',
                fee_type: feeTypes[0]?.name || 'Tuition Fee',
                title: '',
                term: '1st Term',
                academic_year: '2026/2027',
                amount: '',
                due_date: '',
                description: '',
                is_active: true,
              });
              setShowFeeModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Fee Item
          </button>
        )}
      </div>

      {/* Top Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {[
          { id: 'verifications', label: 'Payment Verifications', icon: ShieldAlert, badge: pendingCount > 0 ? pendingCount : null },
          { id: 'overview', label: 'Financial Overview', icon: TrendingUp },
          { id: 'fees', label: 'Fee Structures', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchParams({ tab: tab.id });
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-blue-950'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: PAYMENT VERIFICATION HUB ───────────────────── */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1 rounded-xl">
              {[
                { id: 'pending', label: 'Pending Verification', badge: pendingCount },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'all', label: 'All Payments' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    statusFilter === st.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{st.label}</span>
                  {st.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === st.id ? 'bg-white text-blue-600 font-black' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {st.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search & Class Dropdown */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, ref, bank..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-blue-500 font-semibold"
                />
              </div>

              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500 font-semibold"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payments Table / Cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {payments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600" />
                <p className="font-bold text-sm">No payment records found matching your filters.</p>
                {statusFilter === 'pending' && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    All submitted bank transfers have been processed!
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Class & Term</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Bank & Reference</th>
                      <th className="py-3 px-4">Date Paid</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map(p => {
                      const isPending = p.status === 'PENDING_VERIFICATION' || p.status === 'pending';
                      const isConfirmed = p.status === 'CONFIRMED' || p.status === 'successful';
                      const isRejected = p.status === 'REJECTED' || p.status === 'failed';

                      return (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-800">
                            <p className="font-black text-gray-900">{p.student?.full_name || 'N/A'}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{p.student?.student_id || p.student?.email || 'N/A'}</p>
                          </td>

                          <td className="py-3.5 px-4 text-gray-600">
                            <p className="font-bold text-gray-800">{p.school_class?.name || p.student?.classes?.[0]?.name || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{p.term || '1st Term'}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-black text-blue-950 text-sm">
                              ₦{parseFloat(p.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-800">{p.bank_used || 'Bank Transfer'}</p>
                            <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                              Ref: {p.transaction_reference}
                            </p>
                            {p.sender_account_name && (
                              <p className="text-[10px] text-gray-400">By: {p.sender_account_name}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-gray-600 font-medium">
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-NG') : new Date(p.created_at).toLocaleDateString('en-NG')}
                          </td>

                          <td className="py-3.5 px-4">
                            {isPending && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" /> Pending Verification
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Confirmed
                              </span>
                            )}
                            {isRejected && (
                              <span
                                title={p.rejection_reason || 'Rejected by administrator'}
                                className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 cursor-help"
                              >
                                <Ban className="w-3 h-3 text-rose-500" /> Rejected
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              {/* View Receipt Proof */}
                              {p.receipt_path && (
                                <button
                                  onClick={() => setSelectedReceipt(p)}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold transition-all"
                                  title="View Uploaded Receipt Proof"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}

                              {/* Official Receipt Modal Button */}
                              {isConfirmed && (
                                <button
                                  onClick={() => setSelectedOfficialPayment(p)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-all"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Receipt
                                </button>
                              )}

                              {/* Pending Action Buttons */}
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => {
                                      setActionPayment(p);
                                      setActionType('confirm');
                                      setAdminNote('');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Confirm
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActionPayment(p);
                                      setActionType('reject');
                                      setRejectionReason('');
                                      setAdminNote('');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all border border-rose-200"
                                  >
                                    <Ban className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: FINANCIAL OVERVIEW ─────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
              <p className="text-gray-400 text-xs font-black uppercase tracking-wider">Total Expected Revenue</p>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                ₦{parseFloat(overview?.overview?.total_expected || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-[11px] text-gray-400 mt-1 font-semibold">Active configured fees across classes</p>
            </div>

            <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 shadow-xs">
              <p className="text-emerald-700 text-xs font-black uppercase tracking-wider">Confirmed Received</p>
              <h2 className="text-2xl font-black text-emerald-800 mt-2">
                ₦{parseFloat(overview?.overview?.total_confirmed || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Credited to school bank accounts</p>
            </div>

            <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-amber-700 text-xs font-black uppercase tracking-wider">Pending Verification</p>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {overview?.overview?.pending_count || 0} Awaiting
                </span>
              </div>
              <h2 className="text-2xl font-black text-amber-800 mt-2">
                ₦{parseFloat(overview?.overview?.total_pending || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-[11px] text-amber-600 mt-1 font-semibold">Unverified bank transfer uploads</p>
            </div>

            <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 shadow-xs">
              <p className="text-rose-700 text-xs font-black uppercase tracking-wider">Outstanding Balance</p>
              <h2 className="text-2xl font-black text-rose-800 mt-2">
                ₦{parseFloat(overview?.overview?.total_outstanding || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-[11px] text-rose-600 mt-1 font-semibold">Uncollected student fee balances</p>
            </div>
          </div>

          {/* Breakdown by Class */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-black text-gray-900 text-base">Class Financial Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-bold">
                    <th className="py-3">Class Name</th>
                    <th className="py-3">Expected Fee</th>
                    <th className="py-3">Confirmed Received</th>
                    <th className="py-3">Pending Review</th>
                    <th className="py-3">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {(overview?.class_breakdown || []).map(cls => (
                    <tr key={cls.class_id}>
                      <td className="py-3 font-bold text-gray-800">{cls.class_name}</td>
                      <td className="py-3 text-gray-700">₦{parseFloat(cls.expected_amount || 0).toLocaleString('en-NG')}</td>
                      <td className="py-3 text-emerald-600 font-bold">₦{parseFloat(cls.confirmed_amount || 0).toLocaleString('en-NG')}</td>
                      <td className="py-3 text-amber-600 font-bold">₦{parseFloat(cls.pending_amount || 0).toLocaleString('en-NG')}</td>
                      <td className="py-3 text-rose-600 font-bold">₦{parseFloat(cls.outstanding_amount || 0).toLocaleString('en-NG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: FEE STRUCTURES CONFIGURATION ────────────────── */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          {fees.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600" />
              <p className="font-bold text-sm">No fee structures configured yet.</p>
              <button
                onClick={() => setShowFeeModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add First Fee Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Class & Department</th>
                    <th className="py-3 px-4">Fee Item / Type</th>
                    <th className="py-3 px-4">Term & Year</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fees.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800">
                        <p>{f.class_name}</p>
                        {f.department && <p className="text-[10px] text-gray-400 font-semibold">{f.department}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{f.title || f.fee_type}</p>
                        <p className="text-[10px] text-gray-400">{f.fee_type}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <p>{f.term}</p>
                        <p className="text-[10px] text-gray-400">{f.academic_year || 'Current'}</p>
                      </td>
                      <td className="py-3 px-4 font-black text-blue-950 text-sm">
                        ₦{parseFloat(f.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium">
                        {f.due_date ? new Date(f.due_date).toLocaleDateString('en-NG') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          f.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {f.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditingFee(f);
                              setFeeFormData({
                                class_name: f.class_name,
                                department: f.department || '',
                                fee_type: f.fee_type || 'Tuition Fee',
                                title: f.title || '',
                                term: f.term,
                                academic_year: f.academic_year || '2026/2027',
                                amount: f.amount,
                                due_date: f.due_date || '',
                                description: f.description || '',
                                is_active: f.is_active ?? true,
                              });
                              setShowFeeModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFee(f.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: RECEIPT PREVIEW (IMAGE / PDF) ───────────────── */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-8"
            >
              <div className="p-4 px-6 bg-gray-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold">Transfer Proof / Receipt Inspection</h3>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl text-xs">
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Student</p>
                    <p className="font-black text-gray-900">{selectedReceipt.student?.full_name}</p>
                    <p className="text-[11px] text-gray-500">{selectedReceipt.student?.student_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Submitted Amount</p>
                    <p className="font-black text-blue-900 text-base">
                      ₦{parseFloat(selectedReceipt.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Bank & Reference</p>
                    <p className="font-bold text-gray-800">{selectedReceipt.bank_used}</p>
                    <p className="font-mono text-[11px] text-gray-500">{selectedReceipt.transaction_reference}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Sender Account</p>
                    <p className="font-bold text-gray-800">{selectedReceipt.sender_account_name || 'N/A'}</p>
                    {selectedReceipt.sender_account_last4 && (
                      <p className="text-[11px] text-gray-500">Last 4: {selectedReceipt.sender_account_last4}</p>
                    )}
                  </div>
                </div>

                {/* Student Submission Note */}
                {selectedReceipt.student_note && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-900">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700">Student Note:</p>
                    <p className="mt-0.5">{selectedReceipt.student_note}</p>
                  </div>
                )}

                {/* Receipt Preview Canvas */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center min-h-64 max-h-96">
                  {selectedReceipt.receipt_file_type === 'application/pdf' || selectedReceipt.receipt_path?.endsWith('.pdf') ? (
                    <div className="p-8 text-center space-y-3">
                      <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                      <p className="font-bold text-sm text-gray-700">PDF Document Proof</p>
                      <a
                        href={`/api/payments/${selectedReceipt.id}/receipt`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open / Download PDF Receipt
                      </a>
                    </div>
                  ) : (
                    <img
                      src={`/api/payments/${selectedReceipt.id}/receipt`}
                      alt="Payment Receipt"
                      className="max-h-96 w-auto object-contain rounded-xl"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = selectedReceipt.receipt_url || '';
                      }}
                    />
                  )}
                </div>

                {/* Direct Action Bar inside Receipt modal if pending */}
                {selectedReceipt.status === 'PENDING_VERIFICATION' && (
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setActionPayment(selectedReceipt);
                        setActionType('reject');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5"
                    >
                      <Ban className="w-4 h-4" /> Reject Payment
                    </button>
                    <button
                      onClick={() => {
                        setActionPayment(selectedReceipt);
                        setActionType('confirm');
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4" /> Confirm & Issue Receipt
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: CONFIRM PAYMENT ────────────────────────────── */}
      <AnimatePresence>
        {actionType === 'confirm' && actionPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900">Confirm Payment</h3>
                  <p className="text-xs text-gray-400 font-semibold">Update balance & generate official receipt</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl text-xs space-y-1">
                <p><span className="text-gray-400 font-bold">Student:</span> <span className="font-black text-gray-800">{actionPayment.student?.full_name}</span></p>
                <p><span className="text-gray-400 font-bold">Amount:</span> <span className="font-black text-emerald-700 text-sm">₦{parseFloat(actionPayment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></p>
                <p><span className="text-gray-400 font-bold">Ref:</span> <span className="font-mono text-gray-700">{actionPayment.transaction_reference}</span></p>
                <p><span className="text-gray-400 font-bold">Bank:</span> <span className="text-gray-700">{actionPayment.bank_used}</span></p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Optional Admin Verification Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified against Zenith Bank statement on 04/09/2026."
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionPayment(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm & Update Balance
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: REJECT PAYMENT ─────────────────────────────── */}
      <AnimatePresence>
        {actionType === 'reject' && actionPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900">Reject Payment Submission</h3>
                  <p className="text-xs text-gray-400 font-semibold">Student balance will not be credited</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl text-xs space-y-1">
                <p><span className="text-gray-400 font-bold">Student:</span> <span className="font-black text-gray-800">{actionPayment.student?.full_name}</span></p>
                <p><span className="text-gray-400 font-bold">Amount:</span> <span className="font-black text-rose-700 text-sm">₦{parseFloat(actionPayment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></p>
                <p><span className="text-gray-400 font-bold">Ref:</span> <span className="font-mono text-gray-700">{actionPayment.transaction_reference}</span></p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-rose-500 font-semibold mb-2"
                >
                  <option value="">Select a common reason...</option>
                  <option value="Receipt image is blurry or illegible. Please re-upload a clear copy.">Receipt image is blurry or illegible.</option>
                  <option value="Transaction reference not found on school bank statement.">Transaction reference not found on bank statement.</option>
                  <option value="Amount on uploaded receipt does not match entered submission amount.">Amount does not match uploaded receipt.</option>
                  <option value="Transfer was made to an incorrect bank account number.">Transfer made to wrong bank account.</option>
                  <option value="Duplicate submission: This payment has already been accounted for.">Duplicate submission.</option>
                </select>

                <textarea
                  rows={2}
                  placeholder="Or enter specific explanation here..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Internal Admin Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Checked with bursar Mr. Adeleke"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionPayment(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !rejectionReason.trim()}
                  onClick={handleRejectPayment}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Reject Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: FEE STRUCTURE ADD / EDIT ───────────────────── */}
      <AnimatePresence>
        {showFeeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-base">
                  {editingFee ? 'Edit Fee Item' : 'Add School Fee Item'}
                </h3>
                <button onClick={() => setShowFeeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFee} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={feeFormData.class_name}
                      onChange={e => setFeeFormData({ ...feeFormData, class_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Department (SS only)
                    </label>
                    <select
                      value={feeFormData.department}
                      onChange={e => setFeeFormData({ ...feeFormData, department: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    >
                      {departmentOptions.map(d => <option key={d} value={d}>{d || 'None (General)'}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">
                      Fee Type <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewFeeTypeInput(!showNewFeeTypeInput)}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      {showNewFeeTypeInput ? 'Cancel' : '+ New Fee Type'}
                    </button>
                  </div>

                  {showNewFeeTypeInput ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Science Laboratory Levy"
                        value={newFeeTypeName}
                        onChange={e => setNewFeeTypeName(e.target.value)}
                        className="flex-1 border border-blue-300 rounded-xl px-3 py-1.5 text-xs focus:outline-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateFeeType}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      value={feeFormData.fee_type}
                      onChange={e => setFeeFormData({ ...feeFormData, fee_type: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    >
                      {feeTypes.map(ft => (
                        <option key={ft.id} value={ft.name}>{ft.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Fee Item Title (Optional Description)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Term Standard Tuition"
                    value={feeFormData.title}
                    onChange={e => setFeeFormData({ ...feeFormData, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Term <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={feeFormData.term}
                      onChange={e => setFeeFormData({ ...feeFormData, term: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-semibold"
                    >
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2026/2027"
                      value={feeFormData.academic_year}
                      onChange={e => setFeeFormData({ ...feeFormData, academic_year: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Amount (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="e.g. 50000"
                      value={feeFormData.amount}
                      onChange={e => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500 font-black text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={feeFormData.due_date}
                      onChange={e => setFeeFormData({ ...feeFormData, due_date: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="fee_is_active"
                    checked={feeFormData.is_active}
                    onChange={e => setFeeFormData({ ...feeFormData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="fee_is_active" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Active (Include in student payable balance)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowFeeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={feeFormLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50"
                  >
                    {feeFormLoading ? 'Saving...' : editingFee ? 'Update Fee' : 'Create Fee'}
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

export default AdminFinancePage;
