import apiFetch from "./api";

export async function getSubjects() {
  return apiFetch("/subjects");
}

export async function createSubject(data) {
  return apiFetch("/subjects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSubject(id) {
  return apiFetch(`/subjects/${id}`);
}

export async function updateSubject(id, data) {
  return apiFetch(`/subjects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSubject(id) {
  return apiFetch(`/subjects/${id}`, {
    method: "DELETE",
  });
}
