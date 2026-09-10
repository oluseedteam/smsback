import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Search, 
  X, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  Printer, 
  Phone,
  Camera,
  Upload,
  RefreshCw,
  VideoOff,
  Sparkles
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import apiFetch from '../services/api';
import IdCardModal from './IdCardModal';

export default function AdminQrScannerModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual' | 'upload'
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idCardTarget, setIdCardTarget] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef(null);

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setResult(null);
      setError('');
    }
  }, [isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore clean-up errors
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setError('');
    await stopCamera();

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-stream');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          // Success callback
          stopCamera();
          setQuery(decodedText);
          executeLookup(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      setIsCameraActive(false);
      setError(
        err.message?.includes('Permission') 
          ? 'Camera permission was denied. Please allow camera access in your browser or use Manual Search.'
          : 'Unable to start camera scanner. Please use manual ID search or upload a QR image.'
      );
    }
  };

  const executeLookup = async (lookupQuery) => {
    const textToSearch = (lookupQuery || query).trim();
    if (!textToSearch) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiFetch('/admin/qr/lookup', {
        method: 'POST',
        body: JSON.stringify({ query: textToSearch }),
      });

      if (res.found) {
        setResult(res);
      } else {
        setError('No user matches the scanned QR code or ID.');
      }
    } catch (err) {
      setError(err.message || 'Lookup failed. Please verify the QR identifier or ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    executeLookup(query);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const html5QrCode = new Html5Qrcode('qr-file-scanner-dummy');
      const decodedText = await html5QrCode.scanFile(file, true);
      setQuery(decodedText);
      await executeLookup(decodedText);
    } catch {
      setError('No valid QR Code was detected in this image. Please ensure the QR code is clearly visible and well lit.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleTabSwitch = async (tab) => {
    if (activeTab === 'camera' && tab !== 'camera') {
      await stopCamera();
    }
    setActiveTab(tab);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">GHRA QR Verification & Scanner</h3>
                <p className="text-[11px] text-slate-400">Scan ID card badge or search by identifier</p>
              </div>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scanner Mode Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabSwitch('camera')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'camera' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scan</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('manual')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'manual' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Manual / USB</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('upload')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upload' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
          </div>

          {/* Mode 1: Live Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-square max-h-64 mx-auto flex items-center justify-center">
                <div id="qr-reader-stream" className="w-full h-full" />

                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-900/90 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Live Camera QR Scanner</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                        Point camera at a GHRA ID Card QR Code for automatic instant recognition.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" /> Start Camera
                    </button>
                  </div>
                )}
              </div>

              {isCameraActive && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <VideoOff className="w-3.5 h-3.5" /> Stop Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Manual / USB Scanner Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Scan with barcode gun or type ID (e.g. GHRA-STU-101)..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying Profile...' : 'Verify & Lookup Profile'}
              </button>
            </form>
          )}

          {/* Mode 3: Upload Image File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50 hover:bg-blue-50/50 transition cursor-pointer text-center group">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2 transition" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">
                  Upload ID Card Photo or QR Image
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, or screenshot containing the QR code
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div id="qr-file-scanner-dummy" className="hidden" />
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-700 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Verifying QR credential against GHRA registry...</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  {result.user.profile_picture ? (
                    <img src={result.user.profile_picture} alt={result.user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm truncate">{result.user.full_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800 shrink-0">
                      {result.role}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-blue-800 font-bold">
                    {result.user.student_id || result.user.employee_id || result.user.email}
                  </p>

                  {result.user.class && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Class: <strong>{result.user.class}</strong> {result.user.section ? `(${result.user.section})` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-3 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Status:</span>
                  <span className="font-black text-emerald-700 uppercase flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {result.user.status || 'Active'}
                  </span>
                </div>
                {result.user.emergency_contact && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Emergency Contact:</span>
                    <span className="font-bold text-slate-700">{result.user.emergency_contact}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">QR Identifier:</span>
                  <span className="font-mono text-slate-700 font-bold">{result.user.qr_code_identifier || 'VERIFIED'}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setIdCardTarget({ role: result.role, id: result.user.id })}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Generate ID Card</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ID Card Modal If Triggered */}
      {idCardTarget && (
        <IdCardModal
          isOpen={true}
          onClose={() => setIdCardTarget(null)}
          userRole={idCardTarget.role}
          userId={idCardTarget.id}
        />
      )}
    </>
  );
}
