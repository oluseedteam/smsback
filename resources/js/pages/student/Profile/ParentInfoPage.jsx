import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, User, Phone, MapPin, Mail, Home, ShieldCheck, 
  CheckCircle, AlertCircle, X, Loader2, Save
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import apiFetch from '../../../services/api';

const ParentInfoPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    parent_name: user?.parent_name || '',
    parent_phone: user?.parent_phone || '',
    parent_email: user?.parent_email || '',
    parent_address: user?.parent_address || '',
    home_address: user?.home_address || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      updateUser(res.user);
      setAlert({ type: 'success', message: 'Parent information updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save parent info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      {/* Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-lg ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-500" /> Parent / Guardian Information
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Please provide accurate contact details for your parents or guardians.</p>
      </div>

      <div className="bg-white rounded-4xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Parent Info */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
               <User className="w-4 h-4 text-gray-400" />
               <h2 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Primary Guardian Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Name</label>
                <div className="relative">
                   <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                   <input required value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})}
                     placeholder="Full Name" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-sm focus:border-indigo-500/50 outline-none transition-all font-bold" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                <div className="relative">
                   <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                   <input required value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})}
                     placeholder="+234..." className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-sm focus:border-indigo-500/50 outline-none transition-all font-bold" />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Email (Optional)</label>
                <div className="relative">
                   <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                   <input type="email" value={formData.parent_email} onChange={e => setFormData({...formData, parent_email: e.target.value})}
                     placeholder="parent@email.com" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-sm focus:border-indigo-500/50 outline-none transition-all font-bold" />
                </div>
              </div>
            </div>
          </section>

          {/* Address Info */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
               <Home className="w-4 h-4 text-gray-400" />
               <h2 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Residence Information</h2>
            </div>
            <div className="space-y-6">
               <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Parent's Home/Office Address</label>
                <div className="relative">
                   <MapPin className="w-4 h-4 absolute left-4 top-4 text-gray-300" />
                   <textarea value={formData.parent_address} onChange={e => setFormData({...formData, parent_address: e.target.value})}
                     placeholder="Residential address of guardian" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-sm focus:border-indigo-500/50 outline-none transition-all font-bold min-h-[100px]" />
                </div>
              </div>
               <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Student's Current Home Address</label>
                <div className="relative">
                   <Home className="w-4 h-4 absolute left-4 top-4 text-gray-300" />
                   <textarea value={formData.home_address} onChange={e => setFormData({...formData, home_address: e.target.value})}
                     placeholder="Where do you live currently?" className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-sm focus:border-indigo-500/50 outline-none transition-all font-bold min-h-[100px]" />
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Info */}
          <section className="space-y-6 p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-indigo-500" />
               <h2 className="font-black text-indigo-900 uppercase tracking-tight text-sm">Emergency Back-up</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input value={formData.emergency_contact_name} onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})}
                 placeholder="Back-up Name" className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none" />
               <input value={formData.emergency_contact_phone} onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})}
                 placeholder="Back-up Phone" className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none" />
            </div>
          </section>

          <div className="flex justify-end pt-4">
             <button type="submit" disabled={loading}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-sm disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-indigo-600/20 transform transition-all active:scale-95">
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
               Save Parent Information
             </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ParentInfoPage;
