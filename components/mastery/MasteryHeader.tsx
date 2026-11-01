'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MasteryInstrument } from '@/types/mastery';
import { Target, Trophy, Clock, RotateCcw, Guitar, Drum, Music } from 'lucide-react';

interface MasteryHeaderProps {
  currentInstrument: MasteryInstrument;
  onSelectInstrument: (inst: MasteryInstrument) => void;
  completedCount: number;
  totalLevels: number;
  totalMinutes: number;
  onResetProgress: () => void;
}

export const MasteryHeader: React.FC<MasteryHeaderProps> = ({
  currentInstrument,
  onSelectInstrument,
  completedCount,
  totalLevels,
  totalMinutes,
  onResetProgress,
}) => {
  const percentComplete = Math.round((completedCount / totalLevels) * 100);

  const instruments: { id: MasteryInstrument; label: string; icon: React.ElementType }[] = [
    { id: 'guitar', label: '🎸 Guitarra', icon: Guitar },
    { id: 'piano', label: '🎹 Piano', icon: Music },
    { id: 'bass', label: '🎸 Bajo (4C)', icon: Guitar },
    { id: 'drums', label: '🥁 Batería', icon: Drum },
  ];

  return (
    <header className="w-full flex flex-col gap-6 select-none transition-colors">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            <span>Mastery Path &bull; Sesiones Acotadas (15 - 20 min)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Ruta Técnica por Niveles
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-mono font-bold">
              10 NIVELES
            </span>
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Árbol de maestría secuencial de 10 niveles para el desarrollo riguroso de velocidad, articulación y sincronización.
            Cada nivel exige dominar un micro-ejercicio con criterio de pase medible antes de desbloquear el siguiente.
          </p>
        </div>

        {/* Progress Card / KPI */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl backdrop-blur-sm self-start md:self-auto transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">Progreso Global</span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{percentComplete}%</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {completedCount} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">de</span> {totalLevels} Niveles
            </div>
            {/* Barra de progreso */}
            <div className="w-36 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentComplete}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Navegación por Instrumento & Estadísticas Rápidas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 transition-colors">
        {/* Selector de Instrumentos */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {instruments.map((item) => {
            const isActive = currentInstrument === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectInstrument(item.id)}
                className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'text-slate-950 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeInstrumentMasteryPill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Indicadores complementarios & Botón de reinicio */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 justify-end">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{totalMinutes} min entrenados</span>
          </div>

          <button
            onClick={() => {
              if (
                window.confirm(
                  `¿Deseas reiniciar el progreso de ${currentInstrument.toUpperCase()} para recomenzar desde el Nivel 1?`
                )
              ) {
                onResetProgress();
              }
            }}
            title="Reiniciar progreso de este instrumento"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
