import apiFetch from "./api";

/**
 * Fetch public school settings (accessible without authentication).
 */
export const getPublicSchoolSettings = async () => {
  return apiFetch("/public/school-settings", { showToast: false });
};

/**
 * Fetch school settings for admin management.
 */
export const getAdminSchoolSettings = async () => {
  return apiFetch("/admin/school-settings", { showToast: false });
};

/**
 * Update school settings (contact, about, experience, identity).
 */
export const updateSchoolSettings = async (payload) => {
  return apiFetch("/admin/school-settings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
