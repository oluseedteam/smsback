import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../../services/userService';
import { getClasses } from '../../../services/classService';
import { getSubjects } from '../../../services/subjectService';
import { 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  UserPlus, 
  Users, 
  QrCode, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PopupModal from '../../../components/PopupModal';
import IdCardModal from '../../../components/IdCardModal';
import AdminQrScannerModal from '../../../components/AdminQrScannerModal';
import apiFetch from '../../../services/api';
import { promptDialog, alertDialog } from '../../../services/dialogService';

export default function UserManagementPage({ defaultRole = 'student' }) {
  const [role, setRole] = useState(defaultRole);
  const navigate = useNavigate();

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'pending_approval', 'suspended'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);

  // Modals for ID Card & QR Scanner
  const [idCardTarget, setIdCardTarget] = useState(null); // { role, id }
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    student_id: '',
    employee_id: '',
    is_prefect: false,
    prefect_title: '',
    institutional_role: '',
    gender: '',
    class_id: '',
    section: '',
    subject_ids: [],
    can_create_students: false,
    class_teacher_of: '',
    teaching_assignments: [],
    department: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    status: 'active'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignmentDraft, setAssignmentDraft] = useState({ school_class_id: '', subject_id: '' });

  useEffect(() => {
    Promise.all([getClasses(), getSubjects()]).then(([clsData, subData]) => {
      setClassesData(Array.isArray(clsData) ? clsData : (clsData?.data || []));
      setSubjectsData(Array.isArray(subData) ? subData : (subData?.data || []));
    }).catch(err => console.error(err));
  }, []);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(role);
      setUsers(data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        password: '',
        student_id: user.student_id || '',
        employee_id: user.employee_id || '',
        is_prefect: user.is_prefect || false,
        prefect_title: user.prefect_title || '',
        institutional_role: user.institutional_role || '',
        gender: user.gender || '',
        class_id: user.school_classes?.[0]?.id || '',
        section: user.section || '',
        subject_ids: user.subjects?.map(s => s.id) || [],
        can_create_students: user.can_create_students || false,
        class_teacher_of: user.class_teacher_of || '',
        teaching_assignments: user.subjects?.map(subject => ({
          school_class_id: String(subject.pivot?.school_class_id || ''),
          subject_id: String(subject.id)
        })).filter(assignment => assignment.school_class_id) || [],
        department: user.department || '',
        parent_name: user.parent_name || '',
        parent_phone: user.parent_phone || '',
        parent_email: user.parent_email || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        emergency_contact_relationship: user.emergency_contact_relationship || '',
        status: user.status || 'active'
      });
    } else {
      setFormData({ 
        full_name: '', 
        email: '', 
        password: '', 
        student_id: '', 
        employee_id: '', 
        is_prefect: false, 
        prefect_title: '', 
        institutional_role: '', 
        gender: '', 
        class_id: '', 
        section: '',
        subject_ids: [], 
        can_create_students: false, 
        class_teacher_of: '', 
        teaching_assignments: [],
        department: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        status: 'active'
      });
    }
    setFormError('');
    setAssignmentDraft({ school_class_id: '', subject_id: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const payload = { ...formData, role };
      if (!payload.password) delete payload.password;
      if (!payload.gender) delete payload.gender;
      
      if (role !== 'student') {
        delete payload.student_id;
        delete payload.is_prefect;
        delete payload.prefect_title;
        delete payload.class_id;
        if (role !== 'teacher') delete payload.department;
      } else {
        if (!payload.is_prefect) delete payload.prefect_title;
        if (!payload.class_id) delete payload.class_id;
      }

      if (role !== 'teacher') {
        delete payload.can_create_students;
        delete payload.class_teacher_of;
        delete payload.subject_ids;
        delete payload.teaching_assignments;
      } else {
        delete payload.subject_ids;
      }

      if (editingUser) {
        await updateUser(role, editingUser.id, payload);
        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Account Updated',
          message: `${formData.full_name}'s record has been updated successfully.`
        });
      } else {
        await createUser(payload);
        setPopup({
          isOpen: true,
          type: 'success',
          title: 'User Created',
          message: `${formData.full_name} has been enrolled successfully.`
        });
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const addTeachingAssignment = () => {
    if (!assignmentDraft.school_class_id || !assignmentDraft.subject_id) return;
    const duplicate = formData.teaching_assignments.some(assignment =>
      String(assignment.school_class_id) === String(assignmentDraft.school_class_id)
      && String(assignment.subject_id) === String(assignmentDraft.subject_id)
    );
    if (!duplicate) {
      setFormData(current => ({
        ...current,
        teaching_assignments: [...current.teaching_assignments, assignmentDraft]
      }));
    }
    setAssignmentDraft({ school_class_id: '', subject_id: '' });
  };

  const removeTeachingAssignment = (index) => {
    setFormData(current => ({
      ...current,
      teaching_assignments: current.teaching_assignments.filter((_, assignmentIndex) => assignmentIndex !== index)
    }));
  };

  const handleApproveStudent = async (studentId) => {
    try {
      await apiFetch(`/users/students/${studentId}/approve`, { method: 'PATCH' });
      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Student Approved',
        message: 'Student registration has been approved and activated.'
      });
      fetchUsers();
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Approval Failed',
        message: err.message || 'Could not approve student.'
      });
    }
  };

  const handleRejectStudent = async (studentId) => {
    const reason = await promptDialog({
      title: 'Decline Registration',
      message: 'Reason for declining registration:',
      defaultValue: 'Incomplete documentation',
      confirmText: 'Decline Student',
      type: 'warning',
    });
    if (reason === null) return;
    try {
      await apiFetch(`/users/students/${studentId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      fetchUsers();
    } catch (err) {
      await alertDialog({
        title: 'Rejection Failed',
        message: err.message || 'Could not reject student.',
        type: 'danger',
      });
    }
  };

  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
    setPopup({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to permanently remove this user account? This cannot be undone.'
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(role, deleteTarget);
      setDeleteTarget(null);
      setPopup({
        isOpen: true,
        type: 'success',
        title: 'User Removed',
        message: 'Account has been deleted from the directory.'
      });
      fetchUsers();
    } catch (err) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.message || 'Could not delete user'
      });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-800 font-bold border border-blue-100 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              User Directory & Account Controls
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage students, teachers, staff credentials, ID cards & teacher enrollment approvals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-800" />
            <span>Scan QR / Lookup</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll {role}</span>
          </button>
        </div>
      </div>

      {/* ── Role & Status Tabs Bar ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Role Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full lg:w-auto overflow-x-auto">
          {['student', 'teacher', 'worker', 'admin'].map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setStatusFilter('all'); }}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-black capitalize transition cursor-pointer whitespace-nowrap ${
                role === r ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r === 'worker' ? 'Staff' : r + 's'}
            </button>
          ))}
        </div>

        {/* Status Filters & Search */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {['all', 'active', 'pending_approval', 'suspended'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'pending_approval' ? 'Pending Approval' : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search directory..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* ── User Directory Table ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold">Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No accounts found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 w-12 text-center">#</th>
                  <th className="pb-3 font-bold">User Profile</th>
                  <th className="pb-3 font-bold">School Identifier</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-center">ID Card</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center font-black text-sm overflow-hidden shrink-0">
                          {u.profile_picture ? (
                            <img src={u.profile_picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.full_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm leading-tight">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-blue-900 text-xs block">
                          {u.student_id || u.employee_id || `ADM-${u.id}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {u.school_classes?.[0]?.name || u.institutional_role || (u.is_prefect ? u.prefect_title : role)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        (u.status || 'active') === 'active' ? 'bg-blue-100 text-blue-800' :
                        u.status === 'pending_approval' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        u.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </td>

                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => setIdCardTarget({ role, id: u.id })}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-800 text-slate-700 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer border border-slate-200"
                        title="Print Identity Card"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>ID Card</span>
                      </button>
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Approval workflow buttons */}
                        {role === 'student' && u.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleApproveStudent(u.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectStudent(u.id)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        <button 
                          onClick={() => navigate(`/admin/users/view/${role}/${u.id}`)} 
                          className="p-1.5 text-slate-400 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleOpenModal(u)} 
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteRequest(u.id)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit User Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 uppercase">
                {editingUser ? `Edit ${role} Account` : `Enroll New ${role}`}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl border border-rose-200 font-bold">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                  <input 
                    required 
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})} 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600" 
                    placeholder="e.g. Adebayo Ogunlesi"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600" 
                    placeholder="user@ghraschools.edu.ng"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {editingUser ? 'New Password (Optional)' : 'Password *'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingUser} 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600" 
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                  <select 
                    value={formData.gender} 
                    onChange={e => setFormData({...formData, gender: e.target.value})} 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Account Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Role Specific Fields */}
                {role === 'student' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Student ID *</label>
                      <input 
                        required={!editingUser} 
                        value={formData.student_id} 
                        onChange={e => setFormData({...formData, student_id: e.target.value})} 
                        className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-mono font-bold focus:outline-none focus:border-blue-600" 
                        placeholder="GHRA-STU-101"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Assigned Class</label>
                      <select 
                        value={formData.class_id} 
                        onChange={e => setFormData({...formData, class_id: e.target.value})} 
                        className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600"
                      >
                        <option value="">Select Class</option>
                        {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Arm / Section</label>
                      <input 
                        value={formData.section} 
                        onChange={e => setFormData({...formData, section: e.target.value})} 
                        className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600" 
                        placeholder="e.g. Gold, A"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Department (SS Level)</label>
                      <select 
                        value={formData.department} 
                        onChange={e => setFormData({...formData, department: e.target.value})} 
                        className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600"
                      >
                        <option value="">General / Junior</option>
                        <option value="Science">Science</option>
                        <option value="Art">Art</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="font-black text-slate-400 uppercase text-[10px] block mb-2 tracking-wider">Emergency Contact</span>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          placeholder="Contact Name" 
                          value={formData.emergency_contact_name} 
                          onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})} 
                          className="border border-slate-200 rounded-2xl px-4 py-2 font-medium"
                        />
                        <input 
                          placeholder="Contact Phone" 
                          value={formData.emergency_contact_phone} 
                          onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})} 
                          className="border border-slate-200 rounded-2xl px-4 py-2 font-medium"
                        />
                      </div>
                    </div>
                  </>
                )}

                {(role === 'teacher' || role === 'worker') && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Employee ID *</label>
                      <input 
                        required={!editingUser} 
                        value={formData.employee_id} 
                        onChange={e => setFormData({...formData, employee_id: e.target.value})} 
                        className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-mono font-bold focus:outline-none focus:border-blue-600" 
                        placeholder="GHRA-TCH-001"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Job Post / Title</label>
                      <input 
                        value={formData.institutional_role} 
                        onChange={e => setFormData({...formData, institutional_role: e.target.value})} 
                        placeholder={role === 'teacher' ? 'e.g. Senior Math Master' : 'e.g. Facilities Lead'} 
                        className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600" 
                      />
                    </div>

                    {role === 'teacher' && (
                      <>
                        <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                          <input 
                            type="checkbox" 
                            id="can_create_students_check"
                            checked={formData.can_create_students} 
                            onChange={e => setFormData({...formData, can_create_students: e.target.checked})} 
                            className="rounded text-blue-600" 
                          />
                          <label htmlFor="can_create_students_check" className="font-bold text-slate-800 cursor-pointer">
                            Grant Student Enrollment Privilege
                          </label>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Class Teacher Assignment</label>
                          <select 
                            value={formData.class_teacher_of} 
                            onChange={e => setFormData({...formData, class_teacher_of: e.target.value})} 
                            className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-blue-600"
                          >
                            <option value="">None</option>
                            {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="sm:col-span-2 rounded-2xl border border-slate-200 p-4 space-y-3">
                          <div>
                            <p className="text-[11px] font-black text-slate-700 uppercase">Subject Teaching Assignments</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Each subject is assigned within a specific class.</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                            <select
                              value={assignmentDraft.school_class_id}
                              onChange={event => setAssignmentDraft(current => ({ ...current, school_class_id: event.target.value }))}
                              className="border border-slate-200 rounded-xl px-3 py-2 font-bold"
                            >
                              <option value="">Select class</option>
                              {classesData.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                            </select>
                            <select
                              value={assignmentDraft.subject_id}
                              onChange={event => setAssignmentDraft(current => ({ ...current, subject_id: event.target.value }))}
                              className="border border-slate-200 rounded-xl px-3 py-2 font-bold"
                            >
                              <option value="">Select subject</option>
                              {subjectsData.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                            </select>
                            <button type="button" onClick={addTeachingAssignment} className="rounded-xl bg-blue-50 px-4 py-2 font-black text-blue-700">
                              Add
                            </button>
                          </div>
                          {formData.teaching_assignments.length === 0 ? (
                            <p className="text-[10px] text-amber-700">No class-subject assignments selected.</p>
                          ) : (
                            <div className="space-y-2">
                              {formData.teaching_assignments.map((assignment, index) => {
                                const schoolClass = classesData.find(item => String(item.id) === String(assignment.school_class_id));
                                const subject = subjectsData.find(item => String(item.id) === String(assignment.subject_id));
                                return (
                                  <div key={`${assignment.school_class_id}-${assignment.subject_id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                    <span className="font-bold text-slate-700">{schoolClass?.name || 'Class'} · {subject?.name || 'Subject'}</span>
                                    <button type="button" onClick={() => removeTeachingAssignment(index)} className="text-rose-600 font-black">Remove</button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-2xl shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingUser ? 'Update Account' : 'Complete Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ID Card Modal ── */}
      {idCardTarget && (
        <IdCardModal
          isOpen={true}
          onClose={() => setIdCardTarget(null)}
          userRole={idCardTarget.role}
          userId={idCardTarget.id}
        />
      )}

      {/* ── QR Scanner Modal ── */}
      <AdminQrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* ── Popup Modal ── */}
      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
        onConfirm={popup.type === 'warning' ? handleConfirmDelete : undefined}
      />
    </div>
  );
}
