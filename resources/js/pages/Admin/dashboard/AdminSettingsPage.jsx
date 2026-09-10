import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Building2,
  Copy,
  ShieldCheck,
  School,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  Sparkles,
  Globe,
  Share2,
  Laptop,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import apiFetch from '../../../services/api';
import { getBankAccount, updateBankAccount } from '../../../services/financeService';
import { getAdminSchoolSettings, updateSchoolSettings } from '../../../services/schoolSettingsService';
import { useSchoolSettings } from '../../../context/SchoolSettingsContext';
import toast from 'react-hot-toast';

const AdminSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { updateSettingsLocally } = useSchoolSettings();
  const [activeTab, setActiveTab] = useState('school');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  // ─── CBT & Admissions Portal Visibility State ──────────────────
  const [featuresSaving, setFeaturesSaving] = useState(false);
  const [featuresForm, setFeaturesForm] = useState({
    cbt_enabled: true,
    admission_enabled: true,
  });

  // ─── School Profile & About State ──────────────────────────────
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    school_name: '',
    motto: '',
    years_of_experience: '15+',
    experience_subtitle: 'Years of Educational Excellence',
    about_us: '',
    vision: '',
    mission: '',
  });

  // ─── School Contact & Location State ────────────────────────────
  const [contactSaving, setContactSaving] = useState(false);
  const [contactForm, setContactForm] = useState({
    address: '',
    phone: '',
    admissions_phone: '',
    email: '',
    admissions_email: '',
    visiting_hours: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
    website: '',
  });

  // ─── Admin Personal Profile State ───────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const [profilePic, setProfilePic] = useState(user?.profile_picture || null);

  // ─── Bank Account State ─────────────────────────────────────────
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_name: '',
    routing_code: '',
    instructions: '',
    is_active: true,
  });
  const [bankMeta, setBankMeta] = useState(null);

  // Load School Settings on mount or tab switch
  useEffect(() => {
    fetchSchoolData();
  }, []);

  useEffect(() => {
    if (activeTab === 'bank') {
      fetchBankDetails();
    }
  }, [activeTab]);

  const fetchSchoolData = async () => {
    setSchoolLoading(true);
    try {
      const res = await getAdminSchoolSettings();
      if (res?.settings) {
        const s = res.settings;
        setFeaturesForm({
          cbt_enabled: s.cbt_enabled !== undefined ? Boolean(s.cbt_enabled) : true,
          admission_enabled: s.admission_enabled !== undefined ? Boolean(s.admission_enabled) : true,
        });

        setSchoolForm({
          school_name: s.school_name || 'GHRA',
          motto: s.motto || 'SHAPING YOUNG MINDS',
          years_of_experience: s.years_of_experience || '15+',
          experience_subtitle: s.experience_subtitle || 'Years of Educational Excellence',
          about_us: s.about_us || '',
          vision: s.vision || '',
          mission: s.mission || '',
        });

        setContactForm({
          address: s.address || '',
          phone: s.phone || '',
          admissions_phone: s.admissions_phone || '',
          email: s.email || '',
          admissions_email: s.admissions_email || '',
          visiting_hours: s.visiting_hours || 'Mon – Fri: 7:30 AM – 4:00 PM',
          facebook_url: s.facebook_url || '',
          instagram_url: s.instagram_url || '',
          twitter_url: s.twitter_url || '',
          youtube_url: s.youtube_url || '',
          website: s.website || '',
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch school settings');
    } finally {
      setSchoolLoading(false);
    }
  };

  const toggleFeature = async (key) => {
    const nextVal = !featuresForm[key];
    const updated = {
      ...featuresForm,
      [key]: nextVal
    };
    setFeaturesForm(updated);
    await handleFeaturesSave(updated);
  };

  const handleFeaturesSave = async (overrideForm = null) => {
    const payload = overrideForm || featuresForm;
    setFeaturesSaving(true);
    try {
      const res = await updateSchoolSettings({
        cbt_enabled: payload.cbt_enabled,
        admission_enabled: payload.admission_enabled,
      });
      updateSettingsLocally({
        cbt_enabled: payload.cbt_enabled,
        admission_enabled: payload.admission_enabled,
      });
      toast.success('Portal visibility settings saved successfully!');
      setAlert({
        type: 'success',
        message: `Visibility settings saved: CBT Portal is ${payload.cbt_enabled ? 'Active (Displayed)' : 'Inactive (Hidden)'} and Admissions is ${payload.admission_enabled ? 'Active (Displayed)' : 'Inactive (Hidden)'}.`,
      });
      if (res?.settings) {
        setFeaturesForm({
          cbt_enabled: Boolean(res.settings.cbt_enabled),
          admission_enabled: Boolean(res.settings.admission_enabled),
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save portal visibility');
      setAlert({ type: 'error', message: err.message || 'Failed to save portal visibility' });
    } finally {
      setFeaturesSaving(false);
    }
  };

  const handleSchoolSave = async (e) => {
    e.preventDefault();
    setSchoolSaving(true);
    try {
      const res = await updateSchoolSettings(schoolForm);
      updateSettingsLocally(schoolForm);
      setAlert({ type: 'success', message: 'School profile, about info, and experience updated successfully!' });
      if (res?.settings) {
        setSchoolForm(prev => ({
          ...prev,
          school_name: res.settings.school_name || prev.school_name,
          motto: res.settings.motto || prev.motto,
          years_of_experience: res.settings.years_of_experience || prev.years_of_experience,
          experience_subtitle: res.settings.experience_subtitle || prev.experience_subtitle,
          about_us: res.settings.about_us || prev.about_us,
          vision: res.settings.vision || prev.vision,
          mission: res.settings.mission || prev.mission,
        }));
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update school settings.' });
    } finally {
      setSchoolSaving(false);
    }
  };

  const handleContactSave = async (e) => {
    e.preventDefault();
    setContactSaving(true);
    try {
      const res = await updateSchoolSettings(contactForm);
      updateSettingsLocally(contactForm);
      setAlert({ type: 'success', message: 'School contact details and address updated successfully!' });
      if (res?.settings) {
        setContactForm(prev => ({
          ...prev,
          address: res.settings.address || prev.address,
          phone: res.settings.phone || prev.phone,
          admissions_phone: res.settings.admissions_phone || prev.admissions_phone,
          email: res.settings.email || prev.email,
          admissions_email: res.settings.admissions_email || prev.admissions_email,
          visiting_hours: res.settings.visiting_hours || prev.visiting_hours,
          facebook_url: res.settings.facebook_url || prev.facebook_url,
          instagram_url: res.settings.instagram_url || prev.instagram_url,
          twitter_url: res.settings.twitter_url || prev.twitter_url,
          youtube_url: res.settings.youtube_url || prev.youtube_url,
          website: res.settings.website || prev.website,
        }));
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update contact details.' });
    } finally {
      setContactSaving(false);
    }
  };

  const fetchBankDetails = async () => {
    setBankLoading(true);
    try {
      const res = await getBankAccount();
      if (res?.bank_account) {
        setBankForm({
          bank_name: res.bank_account.bank_name || '',
          account_name: res.bank_account.account_name || '',
          account_number: res.bank_account.account_number || '',
          branch_name: res.bank_account.branch_name || '',
          routing_code: res.bank_account.routing_code || '',
          instructions: res.bank_account.instructions || '',
          is_active: res.bank_account.is_active ?? true,
        });
        setBankMeta({
          lastUpdatedBy: res.bank_account.last_updated_by_admin?.full_name || 'Administrator',
          updatedAt: res.bank_account.updated_at,
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch bank account details');
    } finally {
      setBankLoading(false);
    }
  };

  const handleBankSave = async (e) => {
    e.preventDefault();
    setBankSaving(true);
    try {
      const res = await updateBankAccount(bankForm);
      setAlert({ type: 'success', message: 'School bank account details updated successfully!' });
      if (res?.bank_account) {
        setBankMeta({
          lastUpdatedBy: res.bank_account.last_updated_by_admin?.full_name || user?.full_name || 'Administrator',
          updatedAt: res.bank_account.updated_at || new Date().toISOString(),
        });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update bank account details' });
    } finally {
      setBankSaving(false);
    }
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setAlert({ type: 'error', message: 'Image must be under 2MB.' });
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...profileForm };
      if (profilePic && profilePic !== user?.profile_picture) {
        payload.profile_picture = profilePic;
      }
      const res = await apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) });
      updateUser(res.user || payload);
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally { setLoading(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      return setAlert({ type: 'error', message: 'New passwords do not match.' });
    }
    setLoading(true);
    try {
      await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ password: passwordForm.password }),
      });
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setAlert({ type: 'success', message: 'Password changed successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to change password.' });
    } finally { setLoading(false); }
  };

  const tabs = [
    { id: 'features', label: 'CBT & Admissions', icon: Sparkles },
    { id: 'school', label: 'School & About', icon: School },
    { id: 'contact', label: 'Contact & Location', icon: Phone },
    { id: 'bank', label: 'Bank Account', icon: Building2 },
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'password', label: 'Security', icon: Lock },
  ];

  const renderPortalFeaturesCard = () => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Public Portals & Module Controls</span>
          </div>
          <h2 className="text-lg font-black text-gray-800">CBT & Admissions Visibility</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Check or uncheck whether the CBT portal and Admissions module are active. When unchecked, buttons and homepage sections will not display.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleFeaturesSave()}
          disabled={featuresSaving}
          className="self-start sm:self-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {featuresSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Portal Settings</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* ── CBT Feature Card ── */}
        <div className={`p-5 rounded-2xl border transition-all duration-200 ${
          featuresForm.cbt_enabled ? 'bg-emerald-50/40 border-emerald-200/80 shadow-xs' : 'bg-gray-50/80 border-gray-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                featuresForm.cbt_enabled ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-gray-200 text-gray-500'
              }`}>
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800">CBT Examination Portal</h3>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                  featuresForm.cbt_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${featuresForm.cbt_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  {featuresForm.cbt_enabled ? 'Active • Displayed' : 'Inactive • Hidden'}
                </span>
              </div>
            </div>

            {/* Switch button */}
            <button
              type="button"
              onClick={() => toggleFeature('cbt_enabled')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                featuresForm.cbt_enabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={featuresForm.cbt_enabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  featuresForm.cbt_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-4 leading-relaxed">
            {featuresForm.cbt_enabled ? (
              <span className="text-emerald-900 font-medium">
                The <strong>CBT Portal</strong> button is currently visible in the navigation bar and on the landing page for students and candidates.
              </span>
            ) : (
              <span className="text-gray-500 font-medium">
                Unchecked: The <strong>CBT Portal</strong> button is hidden from the navigation bar and home page.
              </span>
            )}
          </p>

          <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500">Public CBT Portal Status</span>
            <button
              type="button"
              onClick={() => toggleFeature('cbt_enabled')}
              className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                featuresForm.cbt_enabled ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {featuresForm.cbt_enabled ? 'Uncheck to Hide' : 'Check to Activate'}
            </button>
          </div>
        </div>

        {/* ── Admissions Feature Card ── */}
        <div className={`p-5 rounded-2xl border transition-all duration-200 ${
          featuresForm.admission_enabled ? 'bg-sky-50/40 border-sky-200/80 shadow-xs' : 'bg-gray-50/80 border-gray-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                featuresForm.admission_enabled ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-gray-200 text-gray-500'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800">Admissions & Applications</h3>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                  featuresForm.admission_enabled ? 'bg-sky-100 text-sky-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${featuresForm.admission_enabled ? 'bg-sky-500 animate-pulse' : 'bg-gray-400'}`} />
                  {featuresForm.admission_enabled ? 'Active • Displayed' : 'Inactive • Hidden'}
                </span>
              </div>
            </div>

            {/* Switch button */}
            <button
              type="button"
              onClick={() => toggleFeature('admission_enabled')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                featuresForm.admission_enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={featuresForm.admission_enabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  featuresForm.admission_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-4 leading-relaxed">
            {featuresForm.admission_enabled ? (
              <span className="text-sky-950 font-medium">
                The <strong>Admissions</strong> link in the navigation bar and the <strong>Admissions showcase section</strong> on the homepage are visible.
              </span>
            ) : (
              <span className="text-gray-500 font-medium">
                Unchecked: The <strong>Admissions</strong> link in the navigation bar and the <strong>Admissions section</strong> on the homepage are hidden.
              </span>
            )}
          </p>

          <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500">Public Admissions Status</span>
            <button
              type="button"
              onClick={() => toggleFeature('admission_enabled')}
              className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                featuresForm.admission_enabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {featuresForm.admission_enabled ? 'Uncheck to Hide' : 'Check to Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-black text-gray-800">School & Admin Settings</h1>
            <p className="text-xs text-gray-400 font-medium">Configure school identity, contact information, about statements, experience badge, and account security.</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setAlert(null); }}
            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === tab.id ? 'bg-white shadow-sm text-blue-900' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: CBT & Admissions Visibility ─────────────────────────── */}
      {activeTab === 'features' && renderPortalFeaturesCard()}

      {/* ─── TAB 1: School Profile, About & Years of Experience ─────────────────────────── */}
      {activeTab === 'school' && (
        <div className="space-y-6">
          {renderPortalFeaturesCard()}
          <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                <School className="w-4 h-4" />
                <span>School Profile & Overview</span>
              </div>
              <h2 className="text-lg font-black text-gray-800">About the School & Experience</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                These details are displayed on the public landing page, about page, and footer.
              </p>
            </div>

            {schoolLoading ? (
              <div className="flex h-60 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <form onSubmit={handleSchoolSave} className="space-y-5">
                {/* School Name & Motto */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. GHRA"
                      value={schoolForm.school_name}
                      onChange={e => setSchoolForm({ ...schoolForm, school_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      School Motto
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SHAPING YOUNG MINDS"
                      value={schoolForm.motto}
                      onChange={e => setSchoolForm({ ...schoolForm, motto: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-blue-500 uppercase"
                    />
                  </div>
                </div>

                {/* Years of Experience & Subtitle */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100/80 space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Years of Experience Badge (Homepage & About)</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Badge Number / Text
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 15+"
                        value={schoolForm.years_of_experience}
                        onChange={e => setSchoolForm({ ...schoolForm, years_of_experience: e.target.value })}
                        className="w-full border border-blue-200 bg-white rounded-xl px-4 py-2 text-sm font-black text-blue-900 focus:outline-blue-500"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Displays inside the experience badge on the welcome and hero sections.</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Badge Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Years of Educational Excellence"
                        value={schoolForm.experience_subtitle}
                        onChange={e => setSchoolForm({ ...schoolForm, experience_subtitle: e.target.value })}
                        className="w-full border border-blue-200 bg-white rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-blue-500"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Descriptive badge label below the number.</span>
                    </div>
                  </div>
                </div>

                {/* About Us Story */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    About Us / Welcome Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your school's history, mission, environment, and educational standards..."
                    value={schoolForm.about_us}
                    onChange={e => setSchoolForm({ ...schoolForm, about_us: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-blue-500"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">
                    Shown in the Welcome section of the homepage and the main About Our School page.
                  </span>
                </div>

                {/* Vision Statement */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Vision Statement
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter the school's vision statement..."
                    value={schoolForm.vision}
                    onChange={e => setSchoolForm({ ...schoolForm, vision: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-blue-500"
                  />
                </div>

                {/* Mission Statement */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Mission Statement
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter the school's mission statement..."
                    value={schoolForm.mission}
                    onChange={e => setSchoolForm({ ...schoolForm, mission: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={schoolSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                  >
                    {schoolSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save School & About Info
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Live Interactive Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Live Website Preview</h3>
            
            {/* Experience Badge Card Preview */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Homepage Experience Badge</span>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sky-400/20 text-sky-600 flex items-center justify-center text-2xl font-black shrink-0">
                  {schoolForm.years_of_experience || '15+'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{schoolForm.experience_subtitle || 'Years of Excellence'}</p>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Inspiring generations of future leaders</p>
                </div>
              </div>
            </div>

            {/* School Identity Card Preview */}
            <div className="bg-gradient-to-br from-[#070F20] to-[#0A192F] text-white rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">School Branding</span>
                <h3 className="text-xl font-black">{schoolForm.school_name || 'GHRA'}</h3>
                <p className="text-xs text-sky-300 font-bold uppercase tracking-wider mt-0.5">{schoolForm.motto || 'SHAPING YOUNG MINDS'}</p>
              </div>

              {schoolForm.about_us && (
                <div className="pt-3 border-t border-white/10 text-xs text-slate-300 line-clamp-4 leading-relaxed">
                  {schoolForm.about_us}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ─── TAB 2: Contact & Location ─────────────────────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Phone className="w-4 h-4" />
                <span>Contact Channels & Campus Location</span>
              </div>
              <h2 className="text-lg font-black text-gray-800">Edit School Contact Information</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Update hotlines, admissions desk contact, campus visiting hours, and physical address.
              </p>
            </div>

            {schoolLoading ? (
              <div className="flex h-60 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <form onSubmit={handleContactSave} className="space-y-5">
                {/* Physical Campus Address */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Campus Physical Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Bolorunduro Area, Beside Tipper Association Office, Oba Road, Okinni, Osogbo, Osun State, Nigeria"
                    value={contactForm.address}
                    onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-blue-500 font-medium"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Displayed on the Contact page, Footer, and School Identity cards.</span>
                </div>

                {/* Hotlines */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Primary Phone / Direct Hotline <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. +234 814 435 3033"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Admissions Desk Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +234 814 435 3033"
                      value={contactForm.admissions_phone}
                      onChange={e => setContactForm({ ...contactForm, admissions_phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-blue-500"
                    />
                  </div>
                </div>

                {/* Email Addresses */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Official School Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. info@ghraschools.edu.ng"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Admissions Office Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. admissions@ghraschools.edu.ng"
                      value={contactForm.admissions_email}
                      onChange={e => setContactForm({ ...contactForm, admissions_email: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-blue-500"
                    />
                  </div>
                </div>

                {/* Visiting Hours */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Campus Visiting & Office Hours
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mon – Fri: 7:30 AM – 4:00 PM"
                    value={contactForm.visiting_hours}
                    onChange={e => setContactForm({ ...contactForm, visiting_hours: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-blue-500"
                  />
                </div>

                {/* Social Links */}
                <div className="pt-2">
                  <span className="block text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Social Media Channels (Footer Links)</span>
                  </span>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Facebook URL</label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/..."
                        value={contactForm.facebook_url}
                        onChange={e => setContactForm({ ...contactForm, facebook_url: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Instagram URL</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/..."
                        value={contactForm.instagram_url}
                        onChange={e => setContactForm({ ...contactForm, instagram_url: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Twitter / X URL</label>
                      <input
                        type="url"
                        placeholder="https://twitter.com/..."
                        value={contactForm.twitter_url}
                        onChange={e => setContactForm({ ...contactForm, twitter_url: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">YouTube Channel URL</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/..."
                        value={contactForm.youtube_url}
                        onChange={e => setContactForm({ ...contactForm, youtube_url: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={contactSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                  >
                    {contactSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Contact Details
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Contact Preview Card */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Public Contact Preview</h3>
            
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Address</h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">
                    {contactForm.address || 'Campus Address here...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hotline</h4>
                  <p className="text-xs font-bold text-slate-800">{contactForm.phone || '+234 000 000 0000'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email</h4>
                  <p className="text-xs font-bold text-blue-600 truncate">{contactForm.email || 'info@school.edu.ng'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visiting Hours</h4>
                  <p className="text-xs font-medium text-slate-700">{contactForm.visiting_hours || 'Mon – Fri: 7:30 AM – 4:00 PM'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: School Bank Account Tab ────────────────────────────────────────── */}
      {activeTab === 'bank' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-800">School Bank Transfer Details</h2>
              <p className="text-xs text-gray-400 mt-1 font-semibold">
                Configure the authoritative school bank account displayed to students for manual fee transfers. All modifications are audit logged.
              </p>
            </div>

            {bankLoading ? (
              <div className="flex h-60 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <form onSubmit={handleBankSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Zenith Bank Plc"
                      value={bankForm.bank_name}
                      onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={10}
                      placeholder="e.g. 1012345678 (10 digits)"
                      value={bankForm.account_number}
                      onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-blue-500 font-bold tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Early Years Model Academy"
                    value={bankForm.account_name}
                    onChange={e => setBankForm({ ...bankForm, account_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-500 font-semibold"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Branch Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Branch, Lagos"
                      value={bankForm.branch_name}
                      onChange={e => setBankForm({ ...bankForm, branch_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Sort / Routing Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 057150013"
                      value={bankForm.routing_code}
                      onChange={e => setBankForm({ ...bankForm, routing_code: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Student Transfer Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Please put your Student ID / Reg No in the transfer narration/remark. Upload the receipt immediately after payment."
                    value={bankForm.instructions}
                    onChange={e => setBankForm({ ...bankForm, instructions: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={bankForm.is_active}
                    onChange={e => setBankForm({ ...bankForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Enable this account for active student payments
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  {bankMeta && (
                    <div className="text-[11px] text-gray-400 font-semibold">
                      Last updated by <span className="text-gray-700 font-bold">{bankMeta.lastUpdatedBy}</span> on{' '}
                      {new Date(bankMeta.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={bankSaving}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
                  >
                    {bankSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Bank Details
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Student Live Preview Card */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Student Portal Preview</h3>
            <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-blue-200">School Bank Account</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${bankForm.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {bankForm.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Bank Name</p>
                  <p className="font-black text-sm text-white">{bankForm.bank_name || 'Bank Name Here'}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Account Name</p>
                  <p className="font-bold text-sm text-blue-100">{bankForm.account_name || 'School Account Name'}</p>
                </div>

                <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-blue-200 uppercase font-bold tracking-wider">Account Number</p>
                    <p className="font-mono font-black text-lg text-amber-300 tracking-wider">
                      {bankForm.account_number || '0000000000'}
                    </p>
                  </div>
                  <span className="p-2 rounded-xl bg-white/10 text-xs font-bold flex items-center gap-1 opacity-70">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </span>
                </div>

                {bankForm.instructions && (
                  <div className="pt-2 border-t border-white/10 text-[11px] text-gray-300 font-medium">
                    <p className="font-bold text-amber-200 mb-0.5">Instructions:</p>
                    <p>{bankForm.instructions}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Students will only see these bank details. They cannot pay automatically or mark themselves as paid without submitting a verified bank transfer receipt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Admin Profile Tab ──────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <form onSubmit={handleProfileSave} className="space-y-5">
            {/* Profile Picture */}
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-100 border-2 border-blue-50">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-400" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                  <input type="file" accept="image/*" onChange={handlePicChange} className="hidden" />
                  <User className="w-3 h-3" />
                </label>
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Super Admin</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
              <input required value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-400" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Email</label>
              <input required type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-400" />
            </div>

            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB 5: Password Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <form onSubmit={handlePasswordSave} className="space-y-5">
            {[
              { key: 'password', label: 'New Password', showKey: 'new' },
              { key: 'password_confirmation', label: 'Confirm New Password', showKey: 'confirm' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">{field.label}</label>
                <div className="relative">
                  <input required type={showPass[field.showKey] ? 'text' : 'password'} minLength={8}
                    value={passwordForm[field.key]} onChange={e => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-blue-400 pr-12" />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, [field.showKey]: !p[field.showKey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass[field.showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">Password must be at least 8 characters.</p>
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Change Password
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
};

export default AdminSettingsPage;
