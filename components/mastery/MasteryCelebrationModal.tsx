'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MasterySkillNode } from '@/types/mastery';
import { Trophy, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';

interface MasteryCelebrationModalProps {
  skill: MasterySkillNode;
  isOpen: boolean;
  onClose: () => void;
  onContinueNextLevel?: () => void;
  hasNextLevel: boolean;
}

export const MasteryCelebrationModal: React.FC<MasteryCelebrationModalProps> = ({
  skill,
  isOpen,
  onClose,
  onContinueNextLevel,
  hasNextLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] p-6 sm:p-8 text-center flex flex-col items-center gap-6 overflow-hidden"
      >
        {/* Glow de fondo animado */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Emblema del Trofeo con Glow Dorado */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.6)]"
          >
            <Trophy className="w-12 h-12 stroke-[2.2]" />
          </motion.div>
          <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
            <CheckCircle2 className="w-5 h-5 stroke-[3]" />
          </div>
        </div>

        {/* Textos de Celebración */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>¡Nivel 0{skill.level} Conquistado!</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {skill.technique}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Has demostrado control métrico y fluidez anatómica al tempo meta de{' '}
            <strong className="text-amber-300 font-mono">{skill.targetBpm} BPM</strong> con{' '}
            <strong className="text-white">3 repeticiones limpias consecutivas</strong>.
          </p>
        </div>

        {/* Tarjeta de Reconocimiento & Beneficios */}
        <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Desbloqueos Automáticos:</span>
          </div>

          <ul className="text-xs text-slate-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&bull;</span>
              <span>
                <strong>Modo Calentamiento Activo:</strong> Esta técnica se ha incorporado a tu barra de{' '}
                <span className="text-amber-300">Mantenimiento Diario (2 min)</span>.
              </span>
            </li>
            {hasNextLevel && (
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span>
                  <strong>Nivel 0{skill.level + 1} Desbloqueado:</strong> Tu ruta continúa hacia el siguiente escalón de maestría técnica.
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 transition-colors"
          >
            Ver Ruta Completa
          </button>

          {hasNextLevel && onContinueNextLevel && (
            <button
              onClick={() => {
                onClose();
                onContinueNextLevel();
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Avanzar al Nivel 0{skill.level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

