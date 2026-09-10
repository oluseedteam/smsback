import apiFetch from "./api";

export async function getClasses() {
  return apiFetch("/classes");
}

export async function getMyClasses() {
  return apiFetch("/my/classes");
}

export async function createClass(data) {
  return apiFetch("/classes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getClass(id) {
  return apiFetch(`/classes/${id}`);
}

export async function updateClass(id, data) {
  return apiFetch(`/classes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteClass(id) {
  return apiFetch(`/classes/${id}`, {
    method: "DELETE",
  });
}
