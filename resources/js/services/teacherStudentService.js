import apiFetch from './api';

export const getTeacherStudents = () => apiFetch('/teacher/my-students');

export const createStudentAsTeacher = (data) => apiFetch('/teacher/create-student', {
  method: 'POST',
  body: JSON.stringify(data),
});
