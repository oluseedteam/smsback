import apiFetch from './api';

export const getDisputes = () => apiFetch('/disputes');

export const submitDispute = (data) => apiFetch('/disputes', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const replyDispute = (id, data) => apiFetch(`/disputes/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(data),
});

export const deleteDispute = (id) => apiFetch(`/disputes/${id}`, {
  method: 'DELETE',
});

export const clearAllDisputes = () => apiFetch('/disputes/clear-all', {
  method: 'DELETE',
});
