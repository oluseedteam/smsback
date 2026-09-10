import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Users, Loader2, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { getTeacherStudents, createStudentAsTeacher } from '../../../services/teacherStudentService';
import { getClasses } from '../../../services/classService';
import { useAuth } from '../../../hooks/useAuth';

const TeacherCreateStudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState([]);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', student_id: '', gender: '', department: '', class_id: ''
  });

  const fetchStudents = async () => {
    try {
      const [res, classesRes] = await Promise.all([
         getTeacherStudents(),
         getClasses()
      ]);
      setStudents(res.students || []);
      setClassInfo(res.class || null);
      setClasses(Array.isArray(classesRes) ? classesRes : classesRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await createStudentAsTeacher(formData);
      setAlert({ type: 'success', message: 'Student created successfully!' });
      setFormData({ full_name: '', email: '', password: '', student_id: '', gender: '', department: '' });
      setShowForm(false);
      fetchStudents();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to create student' });
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user?.can_create_students) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-black text-gray-400">Permission Required</h2>
        <p className="text-gray-400 mt-2 text-sm max-w-md">You don't have permission to create student accounts. Please contact your admin to enable this feature.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-500" /> Manage Students
          </h1>
          {classInfo && (
            <p className="text-sm text-gray-500 mt-1 font-semibold">
              Class: <span className="text-blue-600">{classInfo.name}</span> • {students.length} students
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 text-sm">
          <UserPlus className="w-4 h-4" /> Create Student
        </button>
      </div>

      {/* Create Student Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" /> New Student
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                  <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" placeholder="student@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student ID</label>
                  <input required value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" placeholder="e.g. STU001" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm" placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                  <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
                  <select required value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-blue-500 text-sm">
                    <option value="">None</option>
                    <option value="Science">Science</option>
                    <option value="Art">Art</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl text-sm">Cancel</button>
                  <button type="submit" disabled={formLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm flex items-center gap-2">
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {formLoading ? 'Creating...' : 'Create Student'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-blue-500" />
      </div>

      {/* Students List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-12 text-sm">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-100 uppercase">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Student ID</th>
                  <th className="py-3 px-4 font-semibold hidden sm:table-cell">Email</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Gender</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-800 text-sm flex items-center gap-3">
                      {s.profile_picture ? (
                        <img src={s.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs font-black">
                          {s.full_name?.charAt(0)}
                        </div>
                      )}
                      {s.full_name}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{s.student_id}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm hidden sm:table-cell">{s.email}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm capitalize hidden md:table-cell">{s.gender || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm hidden md:table-cell">{s.department || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TeacherCreateStudentsPage;
