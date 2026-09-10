import apiFetch from "./api";

export async function getCalendarEvents(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/calendar-events?${query}`);
}

export async function createCalendarEvent(data) {
  return apiFetch("/calendar-events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCalendarEvent(id) {
  return apiFetch(`/calendar-events/${id}`, {
    method: "DELETE",
  });
}
