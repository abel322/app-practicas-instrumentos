'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MasterySkillNode, InteractiveNoteStep } from '@/types/mastery';
import { Eye, Code2, Music, Guitar, Play, Sparkles, KeyboardMusic } from 'lucide-react';

interface InteractiveExerciseViewerProps {
  skill: MasterySkillNode;
  activeStepIndex: number;
  isPlaying: boolean;
}

export const InteractiveExerciseViewer: React.FC<InteractiveExerciseViewerProps> = ({
  skill,
  activeStepIndex,
  isPlaying,
}) => {
  const [viewMode, setViewMode] = useState<'interactive' | 'tab'>('interactive');
  const steps: InteractiveNoteStep[] = skill.microExercise.interactiveSteps || [];

  return (
    <div className="w-full flex flex-col gap-3 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-4 transition-colors select-none shadow-sm">
      {/* Selector de Modo de Vista */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Visor Interactivo del Ejercicio
          </h4>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => setViewMode('interactive')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'interactive'
                ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Secuencia Runway</span>
          </button>
          <button
            onClick={() => setViewMode('tab')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'tab'
                ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Notación Tab/Texto</span>
          </button>
        </div>
      </div>

      {/* Contenido según Modo */}
      {viewMode === 'interactive' && steps.length > 0 ? (
        <div className="space-y-3 py-1">
          {/* Fila Horizontal de Pasos Interactivos */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {steps.map((step, idx) => {
              const isActive = isPlaying && activeStepIndex % steps.length === idx;
              return (
                <motion.div
                  key={idx}
                  animate={isActive ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.1 }}
                  className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-between gap-1.5 text-center transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-900 dark:text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400 dark:ring-cyan-400'
                      : step.accent
                      ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {/* Número de paso / Cuerda o Mano */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-400">
                    <span>#{idx + 1}</span>
                    {step.stringOrHand && (
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {step.stringOrHand}
                      </span>
                    )}
                  </div>

                  {/* Nota / Traste Principal */}
                  <div className="text-sm sm:text-base font-black font-mono tracking-tight text-slate-900 dark:text-white">
                    {step.label}
                  </div>

                  {/* Digitación y Dirección de púa (para cuerdas) o Dedo (para piano) */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    {step.finger && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {skill.instrument === 'piano' ? `d${step.finger}` : step.finger}
                      </span>
                    )}
                    {skill.instrument !== 'piano' && step.pickDirection && (
                      <span
                        className={`font-black ${
                          step.pickDirection === 'down'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                        title={
                          step.pickDirection === 'down'
                            ? 'Púa abajo'
                            : step.pickDirection === 'up'
                            ? 'Púa arriba'
                            : 'Ligado'
                        }
                      >
                        {step.pickDirection === 'down' ? '↓' : step.pickDirection === 'up' ? '↑' : '⌒'}
                      </span>
                    )}
                  </div>

                  {/* Barra de progreso de lectura activa */}
                  {isActive && (
                    <motion.div
                      layoutId="stepActiveBar"
                      className="absolute -bottom-1 left-2 right-2 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 text-center sm:text-left">
              El cursor visual se desplaza en sincronía con el metrónomo en cada tiempo de subdivisión.
            </p>

            {skill.instrument === 'piano' && (
              <Link
                href="/piano"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-bold hover:bg-amber-500/25 transition-colors"
              >
                <KeyboardMusic className="w-3.5 h-3.5" />
                <span>Abrir en Keys Lab Runway &rarr;</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Modo Tablatura / Partitura Clásica */
        <div className="space-y-2">
          <div className="p-4 rounded-xl bg-slate-900 dark:bg-black/80 border border-slate-300 dark:border-slate-800 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-text shadow-inner">
            {skill.microExercise.tabOrNotation}
          </div>
          {skill.microExercise.fingering && (
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">Fórmula de Digitación:</span>
              <span>{skill.microExercise.fingering}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

