'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro de eliminar este elemento?',
  itemName,
  description = 'Esta acción eliminará el elemento de forma permanente y actualizará la lista en tiempo real.',
  confirmText = 'Eliminar Definitivamente',
  cancelText = 'Cancelar',
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Fondo difuminado (Backdrop Blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isDeleting && onClose()}
          className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md transition-all"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Acento rojo sutil en esquina */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Botón cerrar */}
          <button
            onClick={() => !isDeleting && onClose()}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icono de advertencia */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                Operación irreversible
              </p>
            </div>
          </div>

          {/* Nombre del elemento destacado */}
          {itemName && (
            <div className="p-3 mb-4 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 break-words">
              {itemName}
            </div>
          )}

          {/* Descripción */}
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            {description}
          </p>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

