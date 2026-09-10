import apiFetch from "./api";

export async function getAttendance(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/attendance?${query}`);
}

export async function saveBulkAttendance(data) {
  return apiFetch("/attendance/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAttendance(id, data) {
  return apiFetch(`/attendance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getMyAttendance() {
  return apiFetch("/my/attendance");
}
