import apiFetch from "./api";

export async function getUsers(role = "") {
  const query = role ? `?role=${role}` : "";
  return apiFetch(`/users${query}`);
}

export async function createUser(data) {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getUser(role, id) {
  return apiFetch(`/users/${role}/${id}`);
}

export async function updateUser(role, id, data) {
  return apiFetch(`/users/${role}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(role, id) {
  return apiFetch(`/users/${role}/${id}`, {
    method: "DELETE",
  });
}
