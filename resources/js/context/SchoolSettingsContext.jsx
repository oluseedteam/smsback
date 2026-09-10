import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getPublicSchoolSettings } from "../services/schoolSettingsService";

const DEFAULT_SETTINGS = {
  school_name: "GHRA",
  motto: "SHAPING YOUNG MINDS, BUILDING FUTURE LEADERS",
  address: "Bolorunduro Area, Beside Tipper Association Office, Oba Road, Okinni, Osogbo, Osun State, Nigeria",
  phone: "+234 814 435 3033",
  admissions_phone: "+234 814 435 3033",
  email: "info@ghraschools.edu.ng",
  admissions_email: "admissions@ghraschools.edu.ng",
  visiting_hours: "Mon – Fri: 7:30 AM – 4:00 PM",
  about_us: "At GHRA, we provide an intellectually vibrant and nurturing environment where learners thrive. Guided by our motto \"Shaping Young Minds, Building Future Leaders\", we harmonize national benchmarks with global standards, cultivating critical thinking, creativity, moral integrity, and technological fluency.",
  vision: "To be a premier, benchmark educational institution recognized nationally and globally for academic brilliance, unshakeable character, and the continuous nurturing of confident, visionary leaders.",
  mission: "To deliver a balanced, world-class curriculum through modern pedagogy, instilling critical thinking, ethical integrity, digital literacy, and leadership skills in every child.",
  years_of_experience: "15+",
  experience_subtitle: "Years of Educational Excellence",
  facebook_url: "https://facebook.com",
  instagram_url: "https://instagram.com",
  twitter_url: "https://twitter.com",
  youtube_url: "https://youtube.com",
  logo_url: null,
  website: null,
  cbt_enabled: true,
  admission_enabled: true,
};

const SchoolSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  updateSettingsLocally: () => {},
  refetch: async () => {},
});

export const SchoolSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getPublicSchoolSettings();
      if (data && typeof data === "object") {
        setSettings((prev) => ({
          ...prev,
          ...data,
          years_of_experience: data.years_of_experience || prev.years_of_experience || "15+",
          experience_subtitle: data.experience_subtitle || prev.experience_subtitle || "Years of Educational Excellence",
        }));
      }
    } catch {
      // Fall back to default settings without crashing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettingsLocally = useCallback((newSettings) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  return (
    <SchoolSettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettingsLocally,
        refetch: fetchSettings,
      }}
    >
      {children}
    </SchoolSettingsContext.Provider>
  );
};

export const useSchoolSettings = () => {
  const context = useContext(SchoolSettingsContext);
  if (!context) {
    throw new Error("useSchoolSettings must be used within a SchoolSettingsProvider");
  }
  return context;
};

export default SchoolSettingsContext;
