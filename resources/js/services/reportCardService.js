import apiFetch, { downloadApiFile } from "./api";

// ─── Admin Report Cards ─────────────────────────────────────
export async function getAdminReportCards(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/report-cards?${query}`);
}

export async function getReportCard(id) {
  return apiFetch(`/admin/report-cards/${id}`);
}

export async function generateBatchReportCards(data) {
  return apiFetch('/admin/report-cards/generate-batch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function approveReportCard(id) {
  return apiFetch(`/admin/report-cards/${id}/approve`, {
    method: 'POST',
  });
}

export async function reviewReportCard(id) {
  return apiFetch(`/admin/report-cards/${id}/review`, { method: 'POST' });
}

export async function returnReportCard(id, reason) {
  return apiFetch(`/admin/report-cards/${id}/return`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function rejectReportCard(id, reason) {
  return apiFetch(`/admin/report-cards/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function lockReportCard(id) {
  return apiFetch(`/admin/report-cards/${id}/lock`, { method: 'POST' });
}

export async function reopenReportCard(id) {
  return apiFetch(`/admin/report-cards/${id}/reopen`, { method: 'POST' });
}

export async function revokeReportCard(id, reason) {
  return apiFetch(`/admin/report-cards/${id}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function releaseReportCard(id) {
  return apiFetch(`/admin/report-cards/${id}/release`, {
    method: 'POST',
  });
}

export async function releaseBatchReportCards(data) {
  return apiFetch('/admin/report-cards/release-batch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function withholdReportCard(id, reason) {
  return apiFetch(`/admin/report-cards/${id}/withhold`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function resendReportCardEmail(id, recipient_type = 'both') {
  return apiFetch(`/admin/report-cards/${id}/resend-email`, {
    method: 'POST',
    body: JSON.stringify({ recipient_type }),
  });
}

export async function previewReportCardEmail(id, recipient_type = 'student') {
  return apiFetch(`/admin/report-cards/${id}/preview-email?recipient_type=${recipient_type}`, {
    showToast: false,
  });
}

export async function getAdminEmailLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/report-card-email-logs?${query}`);
}

export async function retryAdminEmailLog(id) {
  return apiFetch(`/admin/report-card-email-logs/${id}/retry`, {
    method: 'POST',
  });
}

// ─── Student Portal ──────────────────────────────────────────
export async function getStudentReportCards(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/student/report-cards?${query}`);
}

export async function getStudentReportCardHistory() {
  return apiFetch('/student/report-card-history');
}

export async function getStudentReportCardById(id) {
  return apiFetch(`/student/report-cards/${id}`);
}

export async function downloadStudentReportCardPdf(id) {
  return downloadApiFile(`/student/report-cards/${id}/pdf`);
}

export async function getStudentReportCardView(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/student/report-card/view?${query}`, { showToast: false });
}

export async function getStudentNotifications() {
  return apiFetch('/student/notifications', { showToast: false });
}

export async function markNotificationRead(id) {
  return apiFetch(`/student/notifications/${id}/read`, {
    method: 'PATCH',
    showToast: false,
  });
}

export async function markAllNotificationsRead() {
  return apiFetch('/student/notifications/read-all', {
    method: 'POST',
    showToast: false,
  });
}

// ─── Public / Parent View ────────────────────────────────────
export async function verifyPublicTokenReportCard(token) {
  return apiFetch(`/public/report-card/verify/${token}`, { showToast: false });
}

// ─── Teacher Marksheet ───────────────────────────────────────
export async function getScoreSheet(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/teacher/scoresheet?${query}`);
}

export async function saveScoreSheet(data) {
  return apiFetch('/teacher/scoresheet/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitScoreSheet(data) {
  return apiFetch('/teacher/scoresheet/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAffectiveAndPsychomotor(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/teacher/affective-psychomotor?${query}`);
}

export async function saveAffectiveAndPsychomotor(data) {
  return apiFetch('/teacher/affective-psychomotor/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTeacherReportCards(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/teacher/report-cards?${query}`);
}

export async function teacherReviewReportCard(id) {
  return apiFetch(`/teacher/report-cards/${id}/review`, { method: 'POST' });
}

// ─── Course Registration ─────────────────────────────────────
export async function getAvailableSubjects(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/student/course-registration/available?${query}`);
}

export async function registerCourses(data) {
  return apiFetch('/student/course-registration', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCourseRegistrations(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/student/course-registrations?${query}`);
}

// ─── Settings, Sessions, & Grading Scales ────────────────────
export async function getReportCardSettings() {
  return apiFetch('/report-card/settings');
}

export async function updateReportCardSettings(data) {
  return apiFetch('/admin/report-card/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAcademicSessions() {
  return apiFetch('/academic-sessions');
}

export async function createAcademicSession(data) {
  return apiFetch('/admin/academic-sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAcademicSession(id, data) {
  return apiFetch(`/admin/academic-sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAcademicSession(id) {
  return apiFetch(`/admin/academic-sessions/${id}`, {
    method: 'DELETE',
  });
}

export async function getGradingScales(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/grading-scales?${query}`);
}

export async function createGradingScale(data) {
  return apiFetch('/admin/grading-scales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGradingScale(id, data) {
  return apiFetch(`/admin/grading-scales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteGradingScale(id) {
  return apiFetch(`/admin/grading-scales/${id}`, {
    method: 'DELETE',
  });
}

export async function resetGradingScales(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/grading-scales/reset-defaults?${query}`, {
    method: 'POST',
  });
}

export async function saveAssessmentConfig(data) {
  return apiFetch('/admin/assessment-configurations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
