import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Calendar, 
  Layers, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Sliders, 
  FileSpreadsheet, 
  Cpu, 
  ShieldCheck, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiFetch from '../services/api';

const ICON_MAP = {
  academic_session: Calendar,
  sections_classes: Layers,
  subjects: BookOpen,
  teacher_assignments: Users,
  course_registration: GraduationCap,
  grading_scales: Sliders,
  assessment_configs: FileSpreadsheet,
  cbt_toggle: Cpu,
  school_identity: ShieldCheck,
  promotion_classes: TrendingUp,
};

export default function AcademicSetupChecklist() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChecklist = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await apiFetch('/admin/setup-checklist');
      setData(res);
    } catch (err) {
      console.error('Failed to load setup checklist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded-md w-1/3" />
        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-20 bg-slate-50 rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.checklist) {
    return null;
  }

  const { checklist, completed_count, total_count, progress_percent, is_fully_ready } = data;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
      {/* Header & Overall Readiness */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-800">
              Academic Setup Readiness Checklist
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete all 10 prerequisite milestones for seamless academic operations and report generation.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchChecklist(true)}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
            title="Refresh checklist"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${is_fully_ready ? 'text-emerald-600' : 'text-blue-600'}`}>
                {progress_percent}%
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                ({completed_count}/{total_count} Complete)
              </span>
            </div>
            <div className="w-36 sm:w-44 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress_percent}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${is_fully_ready ? 'bg-emerald-500' : 'bg-blue-600'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Checklist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {checklist.map((item) => {
          const Icon = ICON_MAP[item.id] || CheckCircle2;
          const isDone = item.completed;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                isDone 
                  ? 'bg-slate-50/50 border-slate-100' 
                  : 'bg-amber-50/40 border-amber-200/60 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  isDone 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {item.title}
                    </h4>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" /> Action Needed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <Link
                to={item.link}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 inline-flex items-center gap-1 transition shadow-xs ${
                  isDone
                    ? 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span>{item.action_label}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
