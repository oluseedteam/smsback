import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, Info, X } from 'lucide-react';
import { registerDialogHandler } from '../services/dialogService';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [promptInput, setPromptInput] = useState('');
  const inputRef = useRef(null);

  const closeDialog = useCallback((result) => {
    if (dialog?.resolve) {
      dialog.resolve(result);
    }
    setDialog(null);
    setPromptInput('');
  }, [dialog]);

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    return new Promise((resolve) => {
      setDialog({
        mode: 'confirm',
        title: opts.title || (opts.type === 'danger' || opts.message?.toLowerCase().includes('delete') ? 'Confirm Action' : 'Please Confirm'),
        message: opts.message || '',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        type: opts.type || (opts.message?.toLowerCase().includes('delete') ? 'danger' : 'primary'),
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    return new Promise((resolve) => {
      setDialog({
        mode: 'alert',
        title: opts.title || 'Notice',
        message: opts.message || '',
        confirmText: opts.confirmText || 'OK',
        type: opts.type || 'info',
        resolve: () => resolve(),
      });
    });
  }, []);

  const prompt = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    setPromptInput(opts.defaultValue || '');
    return new Promise((resolve) => {
      setDialog({
        mode: 'prompt',
        title: opts.title || 'Input Required',
        message: opts.message || '',
        placeholder: opts.placeholder || 'Enter value...',
        confirmText: opts.confirmText || 'Submit',
        cancelText: opts.cancelText || 'Cancel',
        type: opts.type || 'primary',
        resolve,
      });
    });
  }, []);

  // Register with singleton service
  useEffect(() => {
    registerDialogHandler({ confirm, alert, prompt });

    // Override native window.alert as a safety net
    const originalAlert = window.alert;
    window.alert = (msg) => {
      alert(typeof msg === 'string' ? msg : String(msg));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [confirm, alert, prompt]);

  // Focus input when prompt dialog opens
  useEffect(() => {
    if (dialog?.mode === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [dialog?.mode]);

  // Handle keyboard shortcuts (Escape and Enter)
  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog(dialog.mode === 'prompt' ? null : false);
      } else if (e.key === 'Enter' && dialog.mode === 'prompt') {
        e.preventDefault();
        closeDialog(promptInput);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, promptInput, closeDialog]);

  // Icon and badge styling based on type
  const getTypeDetails = (type = 'primary') => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          badgeBg: 'bg-rose-50 text-rose-600 border border-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          badgeBg: 'bg-amber-50 text-amber-600 border border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          badgeBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25',
        };
      case 'info':
        return {
          icon: Info,
          badgeBg: 'bg-blue-50 text-blue-600 border border-blue-200',
          btnBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
        };
      default:
        return {
          icon: HelpCircle,
          badgeBg: 'bg-blue-50 text-blue-700 border border-blue-200',
          btnBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
        };
    }
  };

  const typeDetails = dialog ? getTypeDetails(dialog.type) : null;
  const IconComponent = typeDetails?.icon || HelpCircle;

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}

      {dialog && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => closeDialog(dialog.mode === 'prompt' ? null : false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close icon button in top right */}
            <button
              onClick={() => closeDialog(dialog.mode === 'prompt' ? null : false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Icon and Title */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${typeDetails?.badgeBg}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="pr-6">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {dialog.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {dialog.message}
                </p>
              </div>
            </div>

            {/* Prompt text input field if mode === 'prompt' */}
            {dialog.mode === 'prompt' && (
              <div className="pt-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={dialog.placeholder}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              {dialog.mode !== 'alert' && (
                <button
                  type="button"
                  onClick={() => closeDialog(dialog.mode === 'prompt' ? null : false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  {dialog.cancelText || 'Cancel'}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (dialog.mode === 'prompt') {
                    closeDialog(promptInput);
                  } else {
                    closeDialog(true);
                  }
                }}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition cursor-pointer ${typeDetails?.btnBg}`}
              >
                {dialog.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
