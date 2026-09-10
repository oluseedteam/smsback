/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { saveSession, clearSession, updateProfile } from "../services/authService";
import { Loader2, Camera, X } from "lucide-react";

export const AuthContext = createContext();

const loadStoredUser = () => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    clearSession();
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser || typeof parsedUser !== "object" || !parsedUser.role) {
      clearSession();
      return null;
    }
    return parsedUser;
  } catch {
    clearSession();
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadStoredUser);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setUser(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  // Login
  const login = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error("The server returned an invalid login response.");
    }
    saveSession(data);
    setUser(data.user);
  };

  // Logout
  const logout = () => {
    clearSession();
    setUser(null);
  };

  const updateUser = (updatedProps) => {
    const newUser = { ...user, ...updatedProps };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
      {user?.is_first_login && <FirstLoginModal onComplete={updateUser} />}
    </AuthContext.Provider>
  );
};

const FirstLoginModal = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic size validation: 2MB limit
      if (file.size > 2 * 1024 * 1024) {
        setError("File is too large. Please select an image under 2MB.");
        return;
      }

      // Type validation
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setError(""); // Clear error on success
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setError("Please upload a profile picture to continue.");
    
    setLoading(true);
    setError("");
    try {
      const res = await updateProfile({ profile_picture: image });
      onComplete(res.user || { is_first_login: false, profile_picture: image });
    } catch (err) {
      setError(err.message || "Failed to upload. Please try a smaller image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300 relative border border-slate-100">
        {/* Close Button */}
        <button 
          onClick={() => onComplete({ is_first_login: false })}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-2xl"
          title="Skip setup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <Camera className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Aboard!</h2>
          <p className="text-sm text-slate-500 font-medium px-4">Let's start by setting up your profile picture so others can recognize you.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group mx-auto w-36 h-36">
            <div className="w-36 h-36 relative flex items-center justify-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 group-hover:border-blue-500 transition-all cursor-pointer overflow-hidden shadow-inner">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-300" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                   <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Photo</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              />
            </div>
            
            {image && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setImage(""); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-xl shadow-lg hover:bg-red-600 transition-colors z-20"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {error && (
              <div className="text-red-500 text-xs font-bold bg-red-50 border border-red-100 p-4 rounded-2xl mb-4 animate-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || !image} 
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:shadow-none text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex justify-center items-center gap-3 shadow-xl shadow-blue-500/25 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save and Continue"
              )}
            </button>
            
            <button 
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await updateProfile({ is_skipped: true });
                  onComplete(res.user || { is_first_login: false });
                } catch {
                  // If skip fails, we just complete locally to let them in
                  onComplete({ is_first_login: false });
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
