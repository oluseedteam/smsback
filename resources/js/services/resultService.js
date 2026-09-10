import apiFetch from "./api";

export async function getResults(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/results?${query}`);
}

export async function createResult(data) {
  return apiFetch("/results", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateResult(id, data) {
  return apiFetch(`/results/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteResult(id) {
  return apiFetch(`/results/${id}`, {
    method: "DELETE",
  });
}

export async function getMyResults() {
  return apiFetch("/my/results");
}
