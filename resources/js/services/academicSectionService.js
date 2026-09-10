import apiFetch from "./api";

export async function getAcademicSections() {
  return apiFetch("/academic-sections");
}

export async function getAcademicSection(id) {
  return apiFetch(`/academic-sections/${id}`);
}

export async function createAcademicSection(data) {
  return apiFetch("/academic-sections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAcademicSection(id, data) {
  return apiFetch(`/academic-sections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAcademicSection(id) {
  return apiFetch(`/academic-sections/${id}`, {
    method: "DELETE",
  });
}
