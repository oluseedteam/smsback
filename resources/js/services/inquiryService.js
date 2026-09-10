import apiFetch from './api';

/**
 * Public: Submit a contact inquiry or book a campus tour.
 */
export const submitInquiry = async (formData) => {
  return await apiFetch('/contact/submit', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};

/**
 * Admin: Get contact inquiries with optional filters (search, status, inquiry_type, page, per_page).
 */
export const getInquiries = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      query.append(key, val);
    }
  });

  const queryString = query.toString();
  const endpoint = `/admin/inquiries${queryString ? `?${queryString}` : ''}`;
  return await apiFetch(endpoint);
};

/**
 * Admin: Get a specific inquiry details and mark as read.
 */
export const getInquiry = async (id) => {
  return await apiFetch(`/admin/inquiries/${id}`);
};

/**
 * Admin: Update inquiry status or admin follow-up notes.
 */
export const updateInquiry = async (id, data) => {
  return await apiFetch(`/admin/inquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Admin: Delete an inquiry permanently.
 */
export const deleteInquiry = async (id) => {
  return await apiFetch(`/admin/inquiries/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Admin: Clear all inquiries or only resolved inquiries.
 */
export const clearAllInquiries = async (onlyResolved = false) => {
  const endpoint = `/admin/inquiries/clear-all${onlyResolved ? '?only_resolved=1' : ''}`;
  return await apiFetch(endpoint, {
    method: 'DELETE',
  });
};
