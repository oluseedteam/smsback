import apiFetch from "./api";

export async function getResources(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/resources?${query}`);
}

export async function createResource(data) {
  return apiFetch("/resources", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteResource(id) {
  return apiFetch(`/resources/${id}`, {
    method: "DELETE",
  });
}

export async function updateResource(id, data) {
  return apiFetch(`/resources/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
