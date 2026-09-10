import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  School, 
  QrCode, 
  Phone, 
  UserCheck, 
  AlertCircle,
  Maximize2,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import apiFetch from '../services/api';
import logo from '../assets/images/logo.png';

export default function IdCardModal({ isOpen, onClose, userRole, userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnlargedQr, setShowEnlargedQr] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && userRole && userId) {
      fetchIdCardData();
    }
  // The fetch function intentionally follows only identity/open-state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userRole, userId]);

  const fetchIdCardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/users/${userRole}/${userId}/id-card`);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load ID card data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyQrData = () => {
    const textToCopy = data?.user?.qr_data_string || data?.user?.qr_code_identifier || '';
    if (textToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrPayload = data?.user?.qr_data_string || data?.user?.qr_code_identifier || 'GHRA';

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:p-0 print:bg-white print:static">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden print:shadow-none print:border-none print:max-w-none animate-in fade-in zoom-in-95">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Official Identity Card</h3>
                <p className="text-[11px] text-slate-400">GHRA verified scannable identity credential</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEnlargedQr(true)}
                disabled={loading || error || !data}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                title="View enlarged scannable QR"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-700" />
                <span className="hidden sm:inline">Enlarge QR</span>
              </button>
              <button
                onClick={handlePrint}
                disabled={loading || error || !data}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body / ID Card Canvas */}
          <div className="p-6 flex flex-col items-center justify-center bg-slate-50 print:bg-white print:p-0">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold">Generating Identity Card...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-rose-600 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            ) : data ? (
              <div className="id-card-element w-full max-w-sm bg-white rounded-2xl shadow-xl border-2 border-blue-900 overflow-hidden relative print:shadow-none print:border-2">
                
                {/* Header Gradient Stripe */}
                <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 text-center relative overflow-hidden">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 shadow-sm">
                      <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-black tracking-tight uppercase leading-none">
                        {data.school?.name || 'GHRA'}
                      </h2>
                      <p className="text-[9px] font-bold text-amber-300 tracking-widest uppercase mt-1">
                        {data.school?.motto || 'SHAPING YOUNG MINDS, BUILDING FUTURE LEADERS'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 bg-amber-400 text-blue-950 font-black text-[9px] py-0.5 rounded-full uppercase tracking-widest text-center">
                    {data.user.role === 'student' ? 'Student Identity Card' : 
                     data.user.role === 'teacher' ? 'Faculty Identity Card' : 
                     data.user.role === 'admin' ? 'Executive Administration' : 'Staff Credential'}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="flex gap-4 items-center">
                    {/* Photo Frame */}
                    <div className="w-24 h-28 rounded-xl bg-slate-100 border-2 border-blue-900/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {data.user.profile_picture ? (
                        <img src={data.user.profile_picture} alt={data.user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center">
                          <UserCheck className="w-8 h-8 text-slate-400" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Profile Details */}
                    <div className="space-y-1.5 flex-1 min-w-0 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Full Name</span>
                        <span className="font-black text-slate-900 text-sm block truncate">{data.user.full_name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
                          {data.user.role === 'student' ? 'Student ID' : 'Employee ID'}
                        </span>
                        <span className="font-mono font-black text-blue-900 text-xs block">{data.user.identifier}</span>
                      </div>
                      {data.user.class_name && (
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Class</span>
                          <span className="font-bold text-slate-800 text-xs block">{data.user.class_name} {data.user.section ? `(${data.user.section})` : ''}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Status</span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {data.user.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact & Genuine Scannable QR Code Barcode Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="text-[10px] space-y-0.5 flex-1">
                      <span className="font-bold text-slate-400 uppercase block text-[8px] tracking-wider">Emergency Contact</span>
                      <p className="font-bold text-slate-800 truncate">
                        {data.user.emergency_contact_name || 'School Front Desk'}
                      </p>
                      <p className="text-slate-500 font-mono text-[9px]">
                        {data.user.emergency_contact_phone || data.school?.phone || '+234 814 435 3033'}
                      </p>
                    </div>

                    {/* QR Identifier Stamp - Real Scannable QR Code */}
                    <div className="text-center p-1.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowEnlargedQr(true)}
                        title="Click to enlarge scannable QR Code"
                        className="w-16 h-16 bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm border border-slate-100 cursor-pointer hover:border-blue-500 transition group relative"
                      >
                        <QRCodeSVG
                          value={qrPayload}
                          size={56}
                          level="M"
                          includeMargin={false}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-blue-900/10 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center print:hidden">
                          <Maximize2 className="w-3.5 h-3.5 text-blue-900 bg-white/95 rounded p-0.5 shadow-sm" />
                        </div>
                      </button>
                      <span 
                        className="text-[7px] font-mono text-slate-600 font-bold block mt-0.5 truncate max-w-[64px]"
                        title={data.user.qr_code_identifier || 'VERIFIED'}
                      >
                        {data.user.qr_code_identifier?.slice(-10) || 'VERIFIED'}
                      </span>
                    </div>
                  </div>

                  {/* Footer Stamp */}
                  <div className="bg-blue-50 rounded-xl p-2 text-center text-[8px] text-blue-900 font-medium">
                    This card is official property of {data.school?.name || 'GHRA'}. If found, please return to the school front desk or call {data.school?.phone || '+234 814 435 3033'}.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Enlarged QR Code Modal for Easy On-Screen Phone Scanning */}
      {showEnlargedQr && data && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Scannable QR Verification</h4>
                  <p className="text-[10px] text-slate-400">Official GHRA Credential Token</p>
                </div>
              </div>
              <button
                onClick={() => setShowEnlargedQr(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Resolution Scannable QR Code */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <QRCodeSVG
                  value={qrPayload}
                  size={200}
                  level="M"
                  includeMargin={true}
                  className="mx-auto"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900">{data.user.full_name}</p>
              <p className="text-[11px] font-mono text-blue-700 font-bold">
                {data.user.identifier} &bull; {data.user.role.toUpperCase()}
              </p>
              <p className="text-[10px] font-mono text-slate-500 bg-slate-100 rounded-lg py-1 px-2 inline-block">
                Token: {data.user.qr_code_identifier || 'VERIFIED'}
              </p>
              <p className="text-[10px] text-slate-400 pt-1">
                Point any smartphone camera or school barcode scanner at this QR code to verify.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopyQrData}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowEnlargedQr(false)}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-600/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
