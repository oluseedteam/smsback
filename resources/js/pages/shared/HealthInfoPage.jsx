import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Plus, Trash2, ShieldAlert, CheckCircle, AlertCircle, 
  X, Loader2, ClipboardList, Activity, Thermometer, Pill
} from 'lucide-react';
import apiFetch from '../../services/api';
import PopupModal from '../../components/PopupModal';

const HealthInfoPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [formData, setFormData] = useState({
    condition: '',
    blood_group: '',
    genotype: '',
    allergies: '',
    notes: '',
    emergency_contact: ''
  });

  const fetchRecords = async () => {
    try {
      const res = await apiFetch('/health-records');
      setRecords(res.data || []);
      if (res.profile) {
          setFormData(prev => ({
              ...prev,
              blood_group: res.profile.blood_group || '',
              genotype: res.profile.genotype || '',
              allergies: res.profile.allergies || '',
              emergency_contact: res.profile.emergency_contact || ''
          }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiFetch('/health-records', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setAlert({ type: 'success', message: 'Health information updated successfully!' });
      setShowForm(false);
      fetchRecords();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save health info' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
    setPopup({ isOpen: true, type: 'confirm', title: 'Delete Record?', message: 'Are you sure you want to delete this health record? This cannot be undone.' });
  };

  const handleDeleteConfirm = async () => {
    setPopup({ ...popup, isOpen: false });
    if (!deleteTarget) return;
    try {
      await apiFetch(`/health-records/${deleteTarget}`, { method: 'DELETE' });
      setAlert({ type: 'success', message: 'Record deleted.' });
      fetchRecords();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      {/* Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <Heart className="w-7 h-7 text-pink-500" /> Health Information
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage your medical records and emergency contacts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-pink-500/20 text-sm">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Update Records'}
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
         {[
           { label: 'Blood Group', value: formData.blood_group || 'N/A', icon: <Thermometer className="w-4 h-4" />, color: 'bg-red-50 text-red-600' },
           { label: 'Genotype', value: formData.genotype || 'N/A', icon: <Activity className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600' },
           { label: 'Allergies', value: formData.allergies ? formData.allergies.split(',')[0].trim() : 'None', icon: <ShieldAlert className="w-4 h-4" />, color: 'bg-yellow-50 text-yellow-600' },
           { label: 'Status', value: records.length > 0 ? 'On File' : 'Healthy', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-50 text-green-600' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className={`w-8 h-8 rounded-lg ${stat.color} mx-auto mb-2 flex items-center justify-center`}>{stat.icon}</div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-sm font-black text-gray-800 mt-1">{stat.value}</p>
           </div>
         ))}
      </div>

      {/* Update Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-white rounded-4xl shadow-sm border border-gray-100 p-8">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-gray-400" /> Medical Profile Setup
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Blood Group</label>
                    <select value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}
                      className="w-full border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm focus:border-pink-500 outline-none transition-all">
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Genotype</label>
                    <select value={formData.genotype} onChange={e => setFormData({...formData, genotype: e.target.value})}
                      className="w-full border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm focus:border-pink-500 outline-none transition-all">
                      <option value="">Select</option>
                      {['AA', 'AS', 'SS', 'AC'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Allergies (If any)</label>
                    <input value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})}
                      placeholder="e.g. Peanuts, Penicillin, etc." className="w-full border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm focus:border-pink-500 outline-none" />
                  </div>
                   <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-gray-50">
                     <div className="sm:col-span-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contact Name</label>
                        <input 
                           type="text"
                           value={formData.emergency_contact?.split(',')[0]} 
                           onChange={e => {
                              const parts = formData.emergency_contact?.split(',') || ['','',''];
                              parts[0] = e.target.value;
                              setFormData({...formData, emergency_contact: parts.join(',')});
                           }}
                           placeholder="Full Name"
                           className="w-full border-2 border-gray-50 rounded-2xl px-4 py-2.5 text-xs font-bold focus:border-pink-500 outline-none transition-all"
                        />
                     </div>
                     <div className="sm:col-span-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contact Phone</label>
                        <input 
                           type="text"
                           value={formData.emergency_contact?.split(',')[1]} 
                           onChange={e => {
                              const parts = formData.emergency_contact?.split(',') || ['','',''];
                              parts[1] = e.target.value;
                              setFormData({...formData, emergency_contact: parts.join(',')});
                           }}
                           placeholder="Phone Number"
                           className="w-full border-2 border-gray-50 rounded-2xl px-4 py-2.5 text-xs font-bold focus:border-pink-500 outline-none transition-all"
                        />
                     </div>
                     <div className="sm:col-span-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Relationship</label>
                        <input 
                           type="text"
                           value={formData.emergency_contact?.split(',')[2]} 
                           onChange={e => {
                              const parts = formData.emergency_contact?.split(',') || ['','',''];
                              parts[2] = e.target.value;
                              setFormData({...formData, emergency_contact: parts.join(',')});
                           }}
                           placeholder="e.g. Sibling, Parent"
                           className="w-full border-2 border-gray-50 rounded-2xl px-4 py-2.5 text-xs font-bold focus:border-pink-500 outline-none transition-all"
                        />
                     </div>
                   </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="submit" disabled={formLoading}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 text-sm">
                    {formLoading ? 'Saving...' : 'Save Health Profile'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records History */}
      <div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100">
         <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Pill className="w-5 h-5 text-gray-400" /> Recorded Conditions / Checkups
         </h2>
         {records.length === 0 ? (
           <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-bold text-sm">No health records found.</p>
           </div>
         ) : (
           <div className="space-y-4">
              {records.map(record => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                   <div>
                      <p className="font-bold text-gray-800 text-sm uppercase">{record.condition}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{record.notes}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-bold">{new Date(record.created_at).toLocaleDateString()}</p>
                   </div>
                   <button onClick={() => handleDeleteRequest(record.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
           </div>
         )}
      </div>
    </motion.div>

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
        onConfirm={popup.type === 'confirm' ? handleDeleteConfirm : undefined}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default HealthInfoPage;
