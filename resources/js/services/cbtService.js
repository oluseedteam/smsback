import apiFetch from './api';

// ─── CBT Tests (Teacher) ────────────────────────────────
export const getCbtTests = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/cbt-tests${query ? `?${query}` : ''}`);
};

export const createCbtTest = (data) => apiFetch('/cbt-tests', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getCbtTest = (id) => apiFetch(`/cbt-tests/${id}`);

export const updateCbtTest = (id, data) => apiFetch(`/cbt-tests/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const deleteCbtTest = (id) => apiFetch(`/cbt-tests/${id}`, {
  method: 'DELETE',
});

// ─── Questions ──────────────────────────────────────────
export const addQuestion = (testId, data) => apiFetch(`/cbt-tests/${testId}/questions`, {
  method: 'POST',
  body: JSON.stringify(data),
});

export const addBulkQuestions = (testId, questions) => apiFetch(`/cbt-tests/${testId}/questions/bulk`, {
  method: 'POST',
  body: JSON.stringify({ questions }),
});

export const updateQuestion = (questionId, data) => apiFetch(`/cbt-questions/${questionId}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const deleteQuestion = (questionId) => apiFetch(`/cbt-questions/${questionId}`, {
  method: 'DELETE',
});

// ─── Results (Teacher) ──────────────────────────────────
export const getTestResults = (testId) => apiFetch(`/cbt-tests/${testId}/results`);

// ─── Student CBT ────────────────────────────────────────
export const getStudentCbtTests = () => apiFetch('/student/cbt-tests');

export const startExam = (testId) => apiFetch(`/student/cbt-tests/${testId}/start`, {
  method: 'POST',
});

export const submitExam = (testId, data) => apiFetch(`/student/cbt-tests/${testId}/submit`, {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getMyResult = (testId) => apiFetch(`/student/cbt-tests/${testId}/result`);

export const saveCbtAnswer = (testId, data) => apiFetch(`/student/cbt-tests/${testId}/save-answer`, {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getCbtClassCounts = () => apiFetch('/student/cbt-counts');
