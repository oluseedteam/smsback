import React, { useState } from 'react';
import { Camera, Mail, User, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { updateProfile } from '../../../services/authService';

const AdminProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(user?.profile_picture || "");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image too large. Please use an image under 2MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Only image files are allowed.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setError("");
        handleUpload(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (base64Image) => {
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await updateProfile({ profile_picture: base64Image });
      updateUser(res.user || { profile_picture: base64Image });
      setSuccess("Profile picture updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile picture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Profile Picture Upload */}
          <div className="relative group">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[48px] bg-slate-50 border-4 border-white shadow-2xl shadow-blue-900/10 overflow-hidden relative transition-transform hover:scale-[1.02]">
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50">
                  <User className="w-16 h-16 text-blue-200" />
                </div>
              )}
              
              {loading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <label className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-600/30 cursor-pointer transition-all active:scale-95 whitespace-nowrap">
              <Camera className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Change Photo</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading} />
            </label>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Shield className="w-3 h-3" />
              {user?.role === 'admin' ? 'System Administrator' : user?.role || 'User'}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">{user?.full_name}</h1>
            <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mb-6">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl text-xs font-bold border border-green-100 animate-in slide-in-from-left-2">
                  <CheckCircle2 className="w-4 h-4" /> {success}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 animate-in slide-in-from-left-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Details / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Primary Email</p>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">{user?.email}</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Role</p>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-bold text-slate-700 uppercase">{user?.role}</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Status</p>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
