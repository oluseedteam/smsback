import React from 'react';
import { CalendarCheck, Info, User, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const ProfileRight = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Dynamic Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Info className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-gray-800 uppercase tracking-tight text-sm">Overview</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-0.5">Role</p>
              <p className="text-sm font-black text-blue-600 capitalize">{user?.role || 'Student'}</p>
            </div>
            <User className="w-6 h-6 text-blue-300" />
          </div>

          <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-green-500 uppercase tracking-wider mb-0.5">Account Status</p>
              <p className="text-sm font-black text-green-600">Active</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-300" />
          </div>

          {user?.is_prefect && (
            <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-0.5">Prefect Title</p>
                <p className="text-sm font-black text-sky-700">{user?.prefect_title}</p>
              </div>
              <span className="text-2xl">⭐</span>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'student' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <CalendarCheck className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-gray-800 uppercase tracking-tight text-sm">Class Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-tight text-[10px]">Department</span>
              <span className="font-black text-gray-800 text-[11px]">{user?.department || 'General'}</span>
            </div>
            <div className="h-px bg-gray-100 w-full my-2"></div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-tight text-[10px]">Current Classes</span>
              <span className="font-black text-gray-800 text-[11px]">
                {user?.school_classes?.map(c => c.name).join(', ') || 'Not Assigned'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security Tip */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
        <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-[10px] font-bold text-gray-500 uppercase">Security Check</p>
        <p className="text-xs text-gray-400 mt-1">Make sure you keep your password secure and never share it with anyone.</p>
      </div>
    </div>
  );
};

export default ProfileRight;
