import apiFetch from './api';

export const submitApplication = async (data) => {
  return await apiFetch('/admissions/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const checkApplicationStatus = async (identifier) => {
  return await apiFetch(`/admissions/track/${encodeURIComponent(identifier)}`);
};

export const getAdminAdmissions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.type && params.type !== 'all') query.append('type', params.type);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.search) query.append('search', params.search);

  const qs = query.toString();
  return await apiFetch(`/admin/admissions${qs ? `?${qs}` : ''}`);
};

export const getAdmissionDetail = async (id) => {
  return await apiFetch(`/admin/admissions/${id}`);
};

export const updateAdmissionStatus = async (id, payload) => {
  return await apiFetch(`/admin/admissions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteAdmission = async (id) => {
  return await apiFetch(`/admin/admissions/${id}`, {
    method: 'DELETE',
  });
};
