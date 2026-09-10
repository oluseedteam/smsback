import apiFetch from "./api";

export async function getMessages(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/messages?${query}`);
}

export async function sendMessage(data) {
  return apiFetch("/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Broadcast from admin to all teachers or a specific teacher
export async function broadcastMessageToTeachers(data) {
  return apiFetch("/admin/broadcast-message", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMessage(id, content) {
    return apiFetch(`/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
    });
}

export async function deleteMessage(id) {
    return apiFetch(`/messages/${id}`, {
        method: "DELETE",
    });
}

export async function clearChat(otherId, otherType) {
    return apiFetch("/messages/clear-chat", {
        method: "POST",
        body: JSON.stringify({ other_id: otherId, other_type: otherType }),
    });
}
