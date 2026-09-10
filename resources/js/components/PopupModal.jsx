import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, X, Info, Loader2 } from 'lucide-react';

const iconMap = {
  success: <CheckCircle2 className="w-10 h-10 text-green-500" />,
  error: <AlertTriangle className="w-10 h-10 text-red-500" />,
  info: <Info className="w-10 h-10 text-blue-500" />,
  warning: <AlertTriangle className="w-10 h-10 text-orange-500" />,
  confirm: <AlertTriangle className="w-10 h-10 text-orange-500" />,
  loading: <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />,
};

const bgMap = {
  success: 'bg-green-50',
  error: 'bg-red-50',
  info: 'bg-blue-50',
  warning: 'bg-orange-50',
  confirm: 'bg-orange-50',
  loading: 'bg-blue-50',
};

/**
 * PopupModal - Replaces all alert/confirm dialogs with a premium popup UI.
 *
 * Props:
 *  - isOpen: boolean
 *  - type: 'success' | 'error' | 'info' | 'warning' | 'confirm' | 'loading'
 *  - title: string
 *  - message: string
 *  - onClose: () => void (called on backdrop/X click, only if not loading)
 *  - onConfirm: () => void (for confirm type)
 *  - confirmText: string (default "Yes, Proceed")
 *  - cancelText: string (default "Cancel")
 */
export default function PopupModal({
  isOpen,
  type = 'info',
  title = '',
  message = '',
  onClose,
  onConfirm,
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={type !== 'loading' ? onClose : undefined}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {type !== 'loading' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            <div className="p-8 text-center">
              {/* Icon */}
              <div className={`w-20 h-20 ${bgMap[type]} rounded-full flex items-center justify-center mx-auto mb-5`}>
                {iconMap[type]}
              </div>

              {/* Title */}
              {title && (
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              )}

              {/* Message */}
              {message && (
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>
              )}

              {/* Buttons */}
              {type === 'confirm' ? (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md"
                  >
                    {confirmText}
                  </button>
                </div>
              ) : type !== 'loading' ? (
                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md"
                >
                  OK
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
