import toast from "react-hot-toast";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api";
const BASE_URL = RAW_BASE_URL.endsWith("/") ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const method = options.method?.toUpperCase() || "GET";
  
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = options.headers?.["Content-Type"] || "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      ...options,
      headers,
    });

    const responseText = await res.text();
    let data = null;

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
    }

    if (!res.ok) {
      const message =
        (typeof data === "object" && data?.message) ||
        (typeof data === "object" && data?.error) ||
        (typeof data === "object" && data?.errors
          ? Object.values(data.errors).flat().join(" ")
          : null) ||
        (res.status === 401
          ? "Your session has expired. Please sign in again."
          : res.status === 403
            ? "You do not have permission to perform this action."
            : `Request failed (${res.status}). Please try again.`);

      if (res.status === 401 && token) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      
      if (options.showToast !== false) {
        toast.error(message);
      }

      throw Object.assign(new Error(message), {
        status: res.status,
        errors: data?.errors ?? {},
      });
    }

    // Success notification for mutations (POST, PUT, PATCH, DELETE)
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && options.showToast !== false) {
      toast.success((typeof data === "object" && data?.message) || "Operation successful!");
    }

    return data;
  } catch (error) {
    if (error.status) throw error;

    const message = error instanceof TypeError
      ? "Network error. Please check your connection."
      : error.message || "Unable to complete the request. Please try again.";

    if (options.showToast !== false) {
      toast.error(message);
    }
    throw Object.assign(new Error(message), { cause: error });
  }
}

export async function downloadApiFile(endpoint) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Accept: 'application/pdf',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw Object.assign(new Error(errorPayload.message || 'Unable to download this file.'), { status: response.status });
  }

  const disposition = response.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'report-card.pdf';
  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

export default apiFetch;
