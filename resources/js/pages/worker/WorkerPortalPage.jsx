import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Building2, Home, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSchoolSettings } from '../../context/SchoolSettingsContext';
import logo from '../../assets/images/logo.png';

const WorkerPortalPage = () => {
  const { user, logout } = useAuth();
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="GHRA logo" className="h-11 w-11 rounded-xl object-contain" />
            <div>
              <p className="font-heading text-base font-black">{settings?.school_name || 'GHRA'}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Staff portal</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-7 text-white shadow-xl sm:p-10">
          <div className="flex max-w-3xl flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-sky-200">
              <ShieldCheck className="h-4 w-4" /> Authenticated staff access
            </span>
            <h1 className="font-heading text-3xl font-black sm:text-4xl">
              Welcome, {user?.full_name || 'Staff Member'}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Your GHRA staff identity and shared school resources are available here. Administrative controls remain restricted to authorized administrators.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-lg font-black">Staff profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Employee ID</dt><dd className="font-bold">{user?.employee_id || 'Not assigned'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Role</dt><dd className="font-bold">{user?.institutional_role || 'Staff'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Email</dt><dd className="truncate font-bold">{user?.email}</dd></div>
            </dl>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-lg font-black">Quick access</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link to="/" className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold hover:bg-slate-100"><Home className="h-4 w-4" /> Website</Link>
              <Link to="/library" className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold hover:bg-slate-100"><BookOpen className="h-4 w-4" /> Library</Link>
              <Link to="/contact" className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold hover:bg-slate-100"><Mail className="h-4 w-4" /> Contact</Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default WorkerPortalPage;
