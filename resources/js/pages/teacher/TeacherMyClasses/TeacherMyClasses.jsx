import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Loader2, MapPin, School, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { getClasses } from '../../../services/classService';
import TeacherMyClassesRight from './TeacherMyClassesRight';

export default function TeacherMyClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getClasses()
      .then(response => setClasses(Array.isArray(response) ? response : (response?.data || [])))
      .catch(requestError => setError(requestError.message || 'Could not load assigned classes.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-8 px-2 sm:px-4 lg:flex-row lg:px-0">
      <div className="min-w-0 flex-1 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">My Assigned Classes</h1>
          <p className="mt-1 text-sm text-gray-500">Classes and subjects are controlled by the academic assignment directory.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-16"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-bold text-rose-700">{error}</div>
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">No classes or subjects are assigned to this account.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-8 sm:grid-cols-2">
            {classes.map((schoolClass, index) => (
              <motion.div
                key={schoolClass.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-3xl border border-gray-100 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><School className="h-6 w-6" /></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">{schoolClass.status || 'active'}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900">{schoolClass.name}</h2>
                <p className="mt-0.5 text-xs font-bold text-slate-500">{schoolClass.grade_level}{schoolClass.arm ? ` · ${schoolClass.arm}` : ''}</p>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {schoolClass.room || 'No room recorded'}</p>
                  <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-slate-400" /> {schoolClass.students_count || 0} enrolled students</p>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Assigned Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {(schoolClass.subjects || []).map(subject => (
                      <span key={subject.id} className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-blue-700 shadow-sm">{subject.name}</span>
                    ))}
                    {(schoolClass.subjects || []).length === 0 && <span className="text-xs text-slate-500">No subject assignments.</span>}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button onClick={() => navigate('/teacher/attendance')} className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 py-2.5 text-[10px] font-black text-white"><CheckCircle2 className="h-3.5 w-3.5" /> Attendance</button>
                  <button onClick={() => navigate('/teacher/gradebook')} className="flex items-center justify-center gap-1 rounded-xl border border-blue-100 px-2 py-2.5 text-[10px] font-black text-blue-700"><BookOpen className="h-3.5 w-3.5" /> Gradebook</button>
                  <button onClick={() => navigate('/teacher/students')} className="flex items-center justify-center gap-1 rounded-xl border border-blue-100 px-2 py-2.5 text-[10px] font-black text-blue-700"><Users className="h-3.5 w-3.5" /> Students</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80">
        <TeacherMyClassesRight classes={classes} />
      </div>
    </div>
  );
}
