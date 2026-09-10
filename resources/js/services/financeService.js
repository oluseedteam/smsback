import apiFetch, { downloadApiFile } from './api';

// ─── School Bank Account Settings ─────────────────────────
export const getBankAccount = () => apiFetch('/payment-settings/bank-account');

export const updateBankAccount = (data) => apiFetch('/payment-settings/bank-account', {
  method: 'PUT',
  body: JSON.stringify(data),
});

// ─── Fee Types ──────────────────────────────────────────
export const getFeeTypes = () => apiFetch('/fee-types');

export const createFeeType = (data) => apiFetch('/fee-types', {
  method: 'POST',
  body: JSON.stringify(data),
});

// ─── Fee Structures (Admin & Teacher) ────────────────────
export const getFees = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/fees${query ? `?${query}` : ''}`);
};

export const createFee = (data) => apiFetch('/fees', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateFee = (id, data) => apiFetch(`/fees/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const deleteFee = (id) => apiFetch(`/fees/${id}`, {
  method: 'DELETE',
});

// ─── Student Finance (Manual Bank Transfer) ───────────────
export const getStudentFinance = () => apiFetch('/student/finance');

export const submitStudentPayment = (formData) => apiFetch('/student/payments', {
  method: 'POST',
  body: formData,
});

// ─── Admin Payment Verification Hub ───────────────────────
export const getAdminPayments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/payments${query ? `?${query}` : ''}`);
};

export const getAdminPayment = (id) => apiFetch(`/admin/payments/${id}`);

export const confirmPayment = (id, data = {}) => apiFetch(`/admin/payments/${id}/confirm`, {
  method: 'POST',
  body: JSON.stringify(data),
});

export const rejectPayment = (id, data) => apiFetch(`/admin/payments/${id}/reject`, {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getFinanceOverview = () => apiFetch('/admin/finance/overview');

export const getStudentFinanceProfile = (studentId) => apiFetch(`/admin/students/${studentId}/finance`);

// ─── Receipts ───────────────────────────────────────────
export const getOfficialReceipt = (paymentId) => apiFetch(`/payments/${paymentId}/official-receipt`);

export const downloadOfficialReceiptPdf = (paymentId) => downloadApiFile(`/payments/${paymentId}/official-receipt/pdf`);

// ─── Backward Compatibility & Helpers ───────────────────
export const getAllPayments = (params = {}) => getAdminPayments(params);

export const broadcastMessage = (data) => apiFetch('/admin/broadcast-message', {
  method: 'POST',
  body: JSON.stringify(data),
});
