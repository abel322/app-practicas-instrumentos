'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Canal de eventos global para invocar toasts desde cualquier parte sin requerir contexto directo
const TOAST_EVENT = 'soundlab_toast_event';

export function emitToast(message: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
  }
}

export const toast = {
  success: (msg: string) => emitToast(msg, 'success'),
  error: (msg: string) => emitToast(msg, 'error'),
  info: (msg: string) => emitToast(msg, 'info'),
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 3800);
  }, [removeToast]);

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastType }>;
      if (customEvent.detail && customEvent.detail.message) {
        addToast(customEvent.detail.message, customEvent.detail.type || 'success');
      }
    };

    window.addEventListener(TOAST_EVENT, handleCustomToast);
    return () => window.removeEventListener(TOAST_EVENT, handleCustomToast);
  }, [addToast]);

  const value: ToastContextValue = {
    showToast: addToast,
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-colors ${
                item.type === 'success'
                  ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/10'
                  : item.type === 'error'
                  ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/40 text-rose-950 dark:text-rose-100 shadow-rose-500/10'
                  : 'bg-white/95 dark:bg-slate-900/95 border-cyan-500/40 text-cyan-950 dark:text-cyan-100 shadow-cyan-500/10'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {item.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                {item.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                {item.type === 'info' && (
                  <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                )}
                <p className="text-xs font-semibold leading-relaxed break-words text-slate-800 dark:text-slate-100">
                  {item.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(item.id)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Retornar fallback seguro usando el emitter global
    return {
      showToast: (msg: string, type?: ToastType) => emitToast(msg, type),
      success: (msg: string) => emitToast(msg, 'success'),
      error: (msg: string) => emitToast(msg, 'error'),
      info: (msg: string) => emitToast(msg, 'info'),
    };
  }
  return context;
}

