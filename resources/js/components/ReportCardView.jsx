import React from 'react';
import { Printer, Download, Award, Star, CheckCircle, School, ShieldCheck } from 'lucide-react';

export default function ReportCardView({ reportCard, showActions = true }) {
  if (!reportCard) {
    return (
      <div className="p-8 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
        No report card data available.
      </div>
    );
  }

  const {
    school,
    student,
    academic,
    summary,
    cumulative,
    results = [],
    grading_scale = [],
    affective = { traits: [], ratings: {} },
    psychomotor = { traits: [], ratings: {} },
    comments = {},
    status,
    released_at,
  } = reportCard;

  const isThirdTerm = ['3rd Term', '3rd term', 'third_term', 'Third Term'].includes(academic?.term);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              status === 'released' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              status === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              status === 'withheld' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              Status: {status}
            </span>
            {released_at && (
              <span className="text-xs text-gray-500">
                Released on {new Date(released_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE OFFICIAL REPORT CARD CONTAINER ─── */}
      <div className="report-card-print-container bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-gray-100 max-w-4xl mx-auto text-slate-800 relative overflow-hidden">
        
        {/* Top Header Watermark / Border */}
        <div className="h-3 bg-gradient-to-r from-blue-900 via-blue-600 to-amber-500 -mt-6 sm:-mt-10 -mx-6 sm:-mx-10 mb-6 rounded-t-3xl" />

        {/* ─── 1. OFFICIAL SCHOOL HEADER ─── */}
        <div className="border-b-2 border-blue-900 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-700 flex items-center justify-center p-2 shadow-sm shrink-0">
                {school?.logo_url ? (
                  <img src={school.logo_url} alt="GHRA Logo" className="w-full h-full object-contain" />
                ) : (
                  <School className="w-12 h-12 text-blue-900" />
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-950 uppercase">
                  {school?.name || 'GHRA'}
                </h1>
                <p className="text-xs sm:text-sm font-black text-amber-600 uppercase tracking-widest mt-0.5">
                  {school?.motto || 'SHAPING YOUNG MINDS, BUILDING FUTURE LEADERS'}
                </p>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                  {school?.address || 'Bolorunduro Area, Beside Tipper Association Office, Oba Road, Okinni, Osogbo, Osun State, Nigeria'}
                </p>
                <div className="text-[10px] text-gray-400 font-medium flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span>Phone: {school?.phone || '+234 814 435 3033'}</span>
                  <span>Email: {school?.email || 'info@ghraschools.edu.ng'}</span>
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right shrink-0 bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-widest block">Official Report Card</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">{academic?.term}</span>
              <span className="text-xs font-bold text-gray-500 block">{academic?.session_name} Session</span>
            </div>
          </div>
        </div>

        {/* ─── 2. STUDENT INFORMATION CARD ─── */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Student Name</span>
              <span className="font-black text-slate-900 text-sm">{student?.full_name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Student ID</span>
              <span className="font-black text-blue-900 text-sm font-mono">{student?.student_id}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Class & Section</span>
              <span className="font-bold text-slate-800">{academic?.class_name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gender</span>
              <span className="font-bold text-slate-800 capitalize">{student?.gender || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* ─── 3. ACADEMIC RESULTS TABLE ─── */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              {isThirdTerm ? (
                <tr className="bg-blue-900 text-white font-bold uppercase text-[11px] tracking-wider text-center">
                  <th className="p-2.5 text-left border border-blue-800">Subject</th>
                  <th className="p-2.5 w-16 border border-blue-800">1st Term</th>
                  <th className="p-2.5 w-16 border border-blue-800">2nd Term</th>
                  <th className="p-2.5 w-16 border border-blue-800">3rd Term</th>
                  <th className="p-2.5 w-20 border border-blue-800">Annual Avg</th>
                  <th className="p-2.5 w-14 border border-blue-800">Grade</th>
                  <th className="p-2.5 w-28 border border-blue-800">Remark</th>
                </tr>
              ) : (
                <tr className="bg-blue-900 text-white font-bold uppercase text-[11px] tracking-wider text-center">
                  <th className="p-2.5 text-left border border-blue-800">Subject</th>
                  <th className="p-2.5 w-16 border border-blue-800">1st CA</th>
                  <th className="p-2.5 w-16 border border-blue-800">2nd CA</th>
                  <th className="p-2.5 w-20 border border-blue-800">Exam</th>
                  <th className="p-2.5 w-16 border border-blue-800">Total</th>
                  <th className="p-2.5 w-14 border border-blue-800">Grade</th>
                  <th className="p-2.5 w-28 border border-blue-800">Remark</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isThirdTerm ? (
                results.map((r, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-2.5 font-bold text-slate-800 border border-slate-200">
                      {r.subject_name}
                      {r.is_cbt && <span className="ml-1.5 text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-black border border-purple-200">CBT</span>}
                    </td>
                    <td className="p-2.5 text-center font-medium text-slate-700 border border-slate-200">
                      {r.term1_score !== null && r.term1_score !== undefined ? r.term1_score : '-'}
                    </td>
                    <td className="p-2.5 text-center font-medium text-slate-700 border border-slate-200">
                      {r.term2_score !== null && r.term2_score !== undefined ? r.term2_score : '-'}
                    </td>
                    <td className="p-2.5 text-center font-medium text-slate-700 border border-slate-200">
                      {r.term3_score !== null && r.term3_score !== undefined ? r.term3_score : '-'}
                    </td>
                    <td className="p-2.5 text-center font-black text-emerald-800 border border-slate-200">
                      {r.annual_average !== null && r.annual_average !== undefined ? `${r.annual_average}%` : '-'}
                    </td>
                    <td className="p-2.5 text-center font-black border border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                        (r.annual_grade || r.grade) === 'A' ? 'text-emerald-700 bg-emerald-50' :
                        (r.annual_grade || r.grade) === 'B' ? 'text-blue-700 bg-blue-50' :
                        (r.annual_grade || r.grade) === 'C' ? 'text-yellow-700 bg-yellow-50' :
                        (r.annual_grade || r.grade) === 'D' || (r.annual_grade || r.grade) === 'E' ? 'text-orange-700 bg-orange-50' :
                        'text-red-700 bg-red-50'
                      }`}>
                        {r.annual_grade || r.grade || '-'}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-700 border border-slate-200 text-center">
                      {r.annual_remark || r.remark || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                results.map((r, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-2.5 font-bold text-slate-800 border border-slate-200">
                      {r.subject_name}
                      {r.is_cbt && <span className="ml-1.5 text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-black border border-purple-200">CBT</span>}
                    </td>
                    <td className="p-2.5 text-center font-medium text-slate-700 border border-slate-200">
                      {r.ca1_score !== null ? r.ca1_score : '-'}
                    </td>
                    <td className="p-2.5 text-center font-medium text-slate-700 border border-slate-200">
                      {r.ca2_score !== null ? r.ca2_score : '-'}
                    </td>
                    <td className="p-2.5 text-center font-medium text-slate-700 border border-slate-200">
                      {r.cbt_pending ? (
                        <span className="text-[10px] font-bold text-amber-600 italic">CBT Pending</span>
                      ) : r.exam_score !== null ? (
                        r.exam_score
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2.5 text-center font-black text-slate-900 border border-slate-200">
                      {r.total_score}
                    </td>
                    <td className="p-2.5 text-center font-black border border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                        r.grade === 'A' ? 'text-emerald-700 bg-emerald-50' :
                        r.grade === 'B' ? 'text-blue-700 bg-blue-50' :
                        r.grade === 'C' ? 'text-yellow-700 bg-yellow-50' :
                        r.grade === 'D' || r.grade === 'E' ? 'text-orange-700 bg-orange-50' :
                        'text-red-700 bg-red-50'
                      }`}>
                        {r.grade || '-'}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-700 border border-slate-200 text-center">
                      {r.remark || '-'}
                    </td>
                  </tr>
                ))
              )}
              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400 italic border border-slate-200">
                    No subject results recorded for this term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── 4. PERFORMANCE SUMMARY ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase text-blue-800 block">Total Score</span>
            <span className="text-xl font-black text-blue-950 mt-1 block">{summary?.total_score || 0}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase text-blue-800 block">
              {isThirdTerm ? '3rd Term Avg' : 'Average'}
            </span>
            <span className="text-xl font-black text-blue-950 mt-1 block">{summary?.average_score || 0}%</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase text-amber-800 block">Overall Grade</span>
            <span className="text-xl font-black text-amber-900 mt-1 block">{summary?.overall_grade || 'N/A'}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase text-blue-800 block">Position</span>
            <span className="text-xl font-black text-blue-900 mt-1 block">
              {summary?.position ? `${summary.position}${['st','nd','rd'][(summary.position % 10)-1] || 'th'}` : 'N/A'}
              {summary?.total_students_in_class && (
                <span className="text-xs font-normal text-blue-700 ml-1">/{summary.total_students_in_class}</span>
              )}
            </span>
          </div>

          <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
            <span className="text-[9px] font-black uppercase text-slate-700 block">Subjects</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{summary?.total_subjects || 0}</span>
          </div>
        </div>

        {/* ─── 5. THIRD TERM CUMULATIVE & PROMOTION BREAKDOWN ─── */}
        {isThirdTerm && cumulative && (
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-amber-200/80 pb-2">
              <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" /> Annual Cumulative Performance & Promotion Decision
              </h3>
              {cumulative.destination_class && (
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300">
                  Next Class: {cumulative.destination_class}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                <span className="text-[9px] font-bold text-gray-400 block">1st Term Avg</span>
                <span className="font-black text-slate-800 text-sm mt-0.5 block">{cumulative.term1_average !== null ? `${cumulative.term1_average}%` : 'N/A'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                <span className="text-[9px] font-bold text-gray-400 block">2nd Term Avg</span>
                <span className="font-black text-slate-800 text-sm mt-0.5 block">{cumulative.term2_average !== null ? `${cumulative.term2_average}%` : 'N/A'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                <span className="text-[9px] font-bold text-gray-400 block">3rd Term Avg</span>
                <span className="font-black text-slate-800 text-sm mt-0.5 block">{cumulative.term3_average !== null ? `${cumulative.term3_average}%` : `${summary?.average_score || 0}%`}</span>
              </div>
              <div className="bg-blue-100/70 p-2.5 rounded-xl border border-blue-300">
                <span className="text-[9px] font-black text-blue-900 block">Annual Cumulative Avg</span>
                <span className="font-black text-blue-950 text-sm mt-0.5 block">{cumulative.cumulative_average !== null ? `${cumulative.cumulative_average}%` : 'N/A'}</span>
              </div>
              <div className="bg-amber-100/80 p-2.5 rounded-xl border border-amber-300 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-black text-amber-900 block">Promotion Decision</span>
                <span className="font-black text-amber-950 text-sm mt-0.5 block">{cumulative.promotion_status || 'Promoted'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── 6. DOMAIN ASSESSMENTS & GRADING SCALE ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-xs">
          {/* Affective Domain */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
            <h4 className="font-black text-blue-950 uppercase text-[10px] tracking-wider mb-2">Affective Domain (1-5)</h4>
            <div className="space-y-1.5">
              {(affective?.traits || []).map((trait, i) => (
                <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-200/50 last:border-0">
                  <span className="text-gray-600 font-medium">{trait}</span>
                  <span className="font-black text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {affective?.ratings?.[trait] || 5}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Psychomotor Domain */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
            <h4 className="font-black text-blue-950 uppercase text-[10px] tracking-wider mb-2">Psychomotor Domain (1-5)</h4>
            <div className="space-y-1.5">
              {(psychomotor?.traits || []).map((trait, i) => (
                <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-200/50 last:border-0">
                  <span className="text-gray-600 font-medium">{trait}</span>
                  <span className="font-black text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {psychomotor?.ratings?.[trait] || 5}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Class-Specific Grading Scale Legend */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
            <h4 className="font-black text-blue-950 uppercase text-[10px] tracking-wider mb-2">Class Grading Scale</h4>
            <div className="space-y-1">
              {(grading_scale || []).map((scale, i) => (
                <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-slate-200/50 last:border-0">
                  <span className="font-black text-blue-900">{scale.grade}</span>
                  <span className="text-gray-500 font-medium">{scale.min_score}% - {scale.max_score}%</span>
                  <span className="font-bold text-slate-700">{scale.remark}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 7. COMMENTS & SIGNATURES ─── */}
        <div className="space-y-4 border-t border-slate-200 pt-5 mb-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-black text-blue-950 uppercase text-[10px] tracking-wider block mb-1">
              Class Teacher's Comment:
            </span>
            <p className="font-medium text-slate-800 italic">
              "{comments?.class_teacher_comment || 'A diligent and dedicated student with remarkable academic consistency.'}"
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-black text-blue-950 uppercase text-[10px] tracking-wider block mb-1">
              Principal's Comment:
            </span>
            <p className="font-medium text-slate-800 italic">
              "{comments?.principal_comment || 'Excellent performance. Keep up the high standard and strive for higher heights.'}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6">
            <div className="text-center border-t border-slate-400 pt-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Class Teacher Signature</span>
            </div>
            <div className="text-center border-t border-slate-400 pt-2 relative">
              {school?.principal_signature_url && (
                <img src={school.principal_signature_url} alt="Principal Signature" className="h-8 mx-auto -mt-10 mb-2 object-contain" />
              )}
              <span className="text-[10px] font-bold text-gray-500 uppercase block">
                {school?.principal_name || "Principal's Signature & Stamp"}
              </span>
            </div>
          </div>
        </div>

        {/* Report Card Verification Footer */}
        <div className="text-center text-[10px] text-gray-400 pt-4 border-t border-dashed border-slate-200">
          Official GHRA Academic Record • Shaping Young Minds, Building Future Leaders
        </div>
      </div>

      {/* ─── PRINT CSS STYLES ─── */}
      <style>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, aside, header, .print\\:hidden {
            display: none !important;
          }
          .report-card-print-container {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            max-width: 100% !important;
            padding: 20px !important;
            margin: 0 auto !important;
            page-break-inside: avoid;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
