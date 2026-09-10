import apiFetch from './api';

export async function getTeacherClasses(params = {}) {
  return apiFetch('/teacher-classes?' + new URLSearchParams(params).toString());
}

export async function createTeacherClass(data) {
  return apiFetch('/teacher-classes', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTeacherClass(id, data) {
  return apiFetch('/teacher-classes/' + id, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteTeacherClass(id) {
  return apiFetch('/teacher-classes/' + id, { method: 'DELETE' });
}