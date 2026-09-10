import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, 
  ArrowLeft, Loader2, Users, Heart, ShieldAlert, CheckCircle, 
  AlertCircle, Trophy, BookOpen, Clock, Box, ClipboardList, DollarSign, FileText, CheckCircle2, Ban
} from 'lucide-react';
import { getUser } from '../../../services/userService';
import { getStudentFinanceProfile } from '../../../services/financeService';
import OfficialReceiptModal from '../../../components/OfficialReceiptModal';

const InfoCard = ({ title, icon, children, color = 'bg-white' }) => (
  <div className={`${color} rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col h-full`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">{icon}</div>
      <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">{title}</h3>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-gray-700 truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const UserDetailPage = () => {
  const { role, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student Finance Profile state
  const [financeData, setFinanceData] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUser(role, id);
        const userData = res.data || res.user || res;
        setData(userData);

        if (role === 'student' || userData.role === 'student') {
          setFinanceLoading(true);
          try {
            const finRes = await getStudentFinanceProfile(id);
            setFinanceData(finRes);
          } catch (err) {
            console.error('Failed to load finance profile:', err);
          } finally {
            setFinanceLoading(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [role, id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (error) return (
    <div className="flex flex-col h-screen items-center justify-center p-6 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-800">Error</h2>
      <p className="text-gray-500 mt-2">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>
    </div>
  );

  const isStudent = role === 'student' || data?.role === 'student';
  const isTeacher = role === 'teacher' || data?.role === 'teacher';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 text-gray-600 transition-all shadow-xs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">User Profile</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{role} Portfolio</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-xs border border-gray-100 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-3xl bg-linear-to-br from-blue-100 to-purple-100 p-1 shadow-inner border-2 border-blue-50">
                {data.profile_picture ? (
                  <img src={data.profile_picture} alt="" className="w-full h-full rounded-[20px] object-cover" />
                ) : (
                  <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center text-5xl">
                    {isTeacher ? '👨‍🏫' : '👧'}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{data.full_name}</h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mt-1">{data.institutional_role || role}</p>
            
            <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
              <DetailItem label="Email" value={data.email} icon={<Mail className="w-3.5 h-3.5" />} />
              <DetailItem label="Gender" value={data.gender} icon={<User className="w-3.5 h-3.5" />} />
              <DetailItem label={isStudent ? "Student ID" : "Employee ID"} value={data.student_id || data.employee_id} icon={<AlertCircle className="w-3.5 h-3.5" />} />
              {isStudent && <DetailItem label="Class" value={data.school_classes?.map(c => c.name).join(', ')} icon={<BookOpen className="w-3.5 h-3.5" />} />}
            </div>
          </div>

          <InfoCard title="Account Info" icon={<ShieldAlert className="w-4 h-4" />} color="bg-gray-50">
             <div className="space-y-4">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                  <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">Active</span>
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</p>
                  <p className="text-xs font-bold text-gray-700 mt-1">{new Date(data.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
               </div>
             </div>
          </InfoCard>
        </div>

        {/* Right Column: Detailed Info Sections */}
        <div className="lg:col-span-2 space-y-8">
           {/* Student Financial Profile Card */}
           {isStudent && (
             <InfoCard title="School Fees & Payment Profile" icon={<DollarSign className="w-4 h-4 text-emerald-600" />}>
               {financeLoading ? (
                 <div className="flex py-6 justify-center">
                   <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                 </div>
               ) : financeData ? (
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl">
                     <div>
                       <p className="text-[9px] uppercase font-bold text-gray-400">Total Fees</p>
                       <p className="font-black text-sm text-gray-900">
                         ₦{parseFloat(financeData.fee_breakdown?.total_fee || 0).toLocaleString('en-NG')}
                       </p>
                     </div>
                     <div>
                       <p className="text-[9px] uppercase font-bold text-emerald-700">Confirmed Paid</p>
                       <p className="font-black text-sm text-emerald-700">
                         ₦{parseFloat(financeData.fee_breakdown?.confirmed_paid || 0).toLocaleString('en-NG')}
                       </p>
                     </div>
                     <div>
                       <p className="text-[9px] uppercase font-bold text-amber-700">Pending Review</p>
                       <p className="font-black text-sm text-amber-700">
                         ₦{parseFloat(financeData.fee_breakdown?.pending_verification || 0).toLocaleString('en-NG')}
                       </p>
                     </div>
                     <div>
                       <p className="text-[9px] uppercase font-bold text-rose-700">Outstanding</p>
                       <p className="font-black text-sm text-rose-700">
                         ₦{parseFloat(financeData.fee_breakdown?.outstanding_balance || 0).toLocaleString('en-NG')}
                       </p>
                     </div>
                   </div>

                   {/* Payment Submissions List */}
                   <div>
                     <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">
                       Recent Bank Transfer Records
                     </p>
                     {(financeData.payment_history || []).length === 0 ? (
                       <p className="text-xs text-gray-400 italic">No payments submitted yet.</p>
                     ) : (
                       <div className="space-y-2">
                         {financeData.payment_history.map(p => (
                           <div key={p.id} className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                             <div>
                               <p className="font-black text-gray-900">
                                 ₦{parseFloat(p.amount).toLocaleString('en-NG')} • {p.bank_used}
                               </p>
                               <p className="text-[10px] text-gray-400 font-mono">Ref: {p.transaction_reference}</p>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                 p.status === 'CONFIRMED' || p.status === 'successful'
                                   ? 'bg-emerald-100 text-emerald-800'
                                   : p.status === 'PENDING_VERIFICATION' || p.status === 'pending'
                                   ? 'bg-amber-100 text-amber-800'
                                   : 'bg-rose-100 text-rose-800'
                               }`}>
                                 {p.status}
                               </span>
                               {(p.status === 'CONFIRMED' || p.status === 'successful') && (
                                 <button
                                   onClick={() => setSelectedReceiptPayment(p)}
                                   className="p-1 rounded-md bg-white border border-gray-200 text-emerald-700 hover:bg-emerald-50"
                                   title="View Official Receipt"
                                 >
                                   <FileText className="w-3.5 h-3.5" />
                                 </button>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               ) : (
                 <p className="text-xs text-gray-400 italic">Financial data unavailable.</p>
               )}
             </InfoCard>
           )}

           <div className="grid md:grid-cols-2 gap-6">
              {/* Health Information */}
              <InfoCard title="Health Records" icon={<Heart className="w-4 h-4 text-pink-500" />}>
                {(data.health_profile?.blood_group || data.health_profile?.genotype || data.health_profile?.allergies) && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 bg-pink-50 rounded-xl text-center border border-pink-100">
                      <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest">Blood</p>
                      <p className="text-[10px] font-black text-gray-800">{data.health_profile.blood_group || 'N/A'}</p>
                    </div>
                    <div className="p-2 bg-pink-50 rounded-xl text-center border border-pink-100">
                      <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest">Geno</p>
                      <p className="text-[10px] font-black text-gray-800">{data.health_profile.genotype || 'N/A'}</p>
                    </div>
                    <div className="p-2 bg-pink-50 rounded-xl text-center border border-pink-100">
                      <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest">Allergy</p>
                      <p className="text-[10px] font-black text-gray-800 truncate">{data.health_profile.allergies || 'None'}</p>
                    </div>
                  </div>
                )}
                {data.health_records?.length > 0 ? (
                  <div className="space-y-4">
                     {data.health_records.map((h, i) => (
                       <div key={i} className="p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                          <p className="text-xs font-bold text-gray-800">{h.condition || 'General Status'}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{h.notes}</p>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 italic text-xs font-medium">
                    No health records provided.
                  </div>
                )}
              </InfoCard>

              {/* Emergency Contact */}
              <InfoCard title="Emergency contact/Next of Kin" icon={<ShieldAlert className="w-4 h-4 text-red-500" />}>
                  {data.health_profile?.emergency_contact ? (
                     <div className="space-y-3">
                        <DetailItem label="Name" value={data.health_profile.emergency_contact.split(',')[0]} icon={<User className="w-3" />} />
                        <DetailItem label="Phone" value={data.health_profile.emergency_contact.split(',')[1]} icon={<Phone className="w-3" />} />
                        <DetailItem label="Relation/Notes" value={data.health_profile.emergency_contact.split(',')[2]} icon={<ShieldAlert className="w-3" />} />
                     </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 italic text-xs font-medium">
                      No emergency contact information.
                    </div>
                  )}
               </InfoCard>

               {/* Parent/Guardian Information */}
               <InfoCard title="Parent/Guardian Information" icon={<Users className="w-4 h-4 text-orange-500" />}>
                  {data.parent_name || data.parent_phone ? (
                     <div className="space-y-3">
                        <DetailItem label="Name" value={data.parent_name} icon={<User className="w-3" />} />
                        <DetailItem label="Phone" value={data.parent_phone} icon={<Phone className="w-3" />} />
                        <DetailItem label="Address" value={data.parent_address} icon={<MapPin className="w-3" />} />
                        <DetailItem label="Email" value={data.parent_email} icon={<Mail className="w-3" />} />
                     </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 italic text-xs font-medium">
                      No parent information.
                    </div>
                  )}
               </InfoCard>
           </div>

            {/* Academics/Work */}
            {!isStudent && (
              <div className="grid md:grid-cols-1 gap-6">
                <InfoCard title="Teaching Portfolio" icon={<Briefcase className="w-4 h-4 text-blue-500" />}>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assigned Subjects</p>
                        <div className="flex flex-wrap gap-2">
                           {data.subjects?.map(s => (
                             <span key={s.id} className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">{s.name}</span>
                           ))}
                           {(!data.subjects || data.subjects.length === 0) && <span className="text-gray-400 italic text-xs">None assigned</span>}
                        </div>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Class Teacher Roles</p>
                        {data.assigned_class ? (
                           <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-800">{data.assigned_class.name}</span>
                              <span className="text-[10px] font-black text-blue-500 uppercase">Primary Instructor</span>
                           </div>
                        ) : (
                           <span className="text-gray-400 italic text-xs">Not assigned as class teacher</span>
                        )}
                     </div>
                  </div>
                </InfoCard>
              </div>
            )}

            {/* Recent Activity/Timeline */}
            <InfoCard title="Recent Activity" icon={<Clock className="w-4 h-4 text-purple-500" />}>
               {data.activities?.length > 0 ? (
                 <div className="space-y-4">
                    {data.activities.map((act, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white transition-all group">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.type === 'cbt' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                            {act.type === 'cbt' ? <Box className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{act.title}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{act.time}</p>
                         </div>
                         {act.score && (
                           <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-xs">
                              <span className="text-xs font-black text-blue-600">{act.score}</span>
                           </div>
                         )}
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-sm font-medium">No recent activity logs found for this user.</p>
                 </div>
               )}
            </InfoCard>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {selectedReceiptPayment && (
        <OfficialReceiptModal
          payment={selectedReceiptPayment}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}
    </motion.div>
  );
};

export default UserDetailPage;
