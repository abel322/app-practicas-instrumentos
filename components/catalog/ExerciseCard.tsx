'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DrumExerciseData } from '@/types/drum';
import { Play, Activity, Clock, Zap } from 'lucide-react';

interface ExerciseCardProps {
  exercise: DrumExerciseData;
  index: number;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, index }) => {
  // Configuración de colores para nivel de dificultad
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30';
      case 'Intermedio':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-500/30';
      case 'Avanzado':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-500/30';
      default:
        return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-500/30';
    }
  };

  // Extraer secuencia visual de sticking simplificada para la vista previa
  const stickingSequence = exercise.hitsData
    .filter((h) => h.sticking)
    .slice(0, 16);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col justify-between rounded-2xl bg-[#f8fafc] dark:bg-slate-900/80 p-6 border border-slate-300/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden"
    >
      {/* Resplandor dinámico en esquina en hover */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-[#0891b2]/5 dark:bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-[#0891b2]/10 dark:group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Cabecera de la Card: Categoría y Dificultad */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs uppercase tracking-widest font-bold text-[#0891b2] dark:text-cyan-400">
            {exercise.category}
          </span>

          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(
              exercise.difficulty
            )}`}
          >
            {exercise.difficulty}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#0891b2] dark:group-hover:text-cyan-300 transition-colors mb-2">
          {exercise.title}
        </h3>

        {/* Descripción didáctica */}
        {exercise.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-5">
            {exercise.description}
          </p>
        )}

        {/* Secuencia miniatura de Sticking (R / L / K) */}
        {stickingSequence.length > 0 && (
          <div className="mb-5 p-2.5 rounded-xl bg-slate-200/80 dark:bg-zinc-900/60 border border-slate-300/70 dark:border-white/5">
            <div className="text-[10px] text-slate-600 dark:text-zinc-500 font-mono uppercase mb-1.5 flex items-center justify-between">
              <span>Secuencia de Manos / Pies</span>
              <span>{exercise.totalSteps} Pasos</span>
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              {stickingSequence.map((hit, i) => {
                const isRight = hit.sticking === 'R';
                const isLeft = hit.sticking === 'L';
                const isKick = hit.sticking === 'K';

                return (
                  <span
                    key={`seq-${i}`}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-bold ${
                      hit.accent ? 'ring-1 ring-slate-400 dark:ring-white/60 font-black' : ''
                    } ${
                      isRight
                        ? 'bg-[#0891b2]/15 text-[#0891b2] dark:bg-cyan-500/20 dark:text-cyan-300'
                        : isLeft
                        ? 'bg-fuchsia-600/15 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300'
                        : isKick
                        ? 'bg-emerald-600/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-300/70 text-slate-700 dark:bg-white/10 dark:text-zinc-400'
                    }`}
                  >
                    {hit.sticking}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pie de la Card: Metadatos y Botón de Inicio */}
      <div className="pt-4 border-t border-slate-300/70 dark:border-slate-800 flex items-center justify-between">
        {/* Metadatos musicales */}
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5" title="Tempo predeterminado">
            <Activity className="w-3.5 h-3.5 text-[#0891b2] dark:text-cyan-400" />
            <span>{exercise.bpmDefault} BPM</span>
          </div>

          <div className="flex items-center gap-1.5" title="Métrica del compás">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-500" />
            <span>{exercise.timeSignature}</span>
          </div>
        </div>

        {/* CTA Link hacia el Reproductor Runway */}
        <Link
          href={`/practice/${exercise.slug}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white shadow-sm dark:bg-cyan-500/10 dark:hover:bg-cyan-500 dark:border dark:border-cyan-500/30 dark:hover:border-cyan-500 dark:text-cyan-300 dark:hover:text-zinc-950 font-bold text-xs transition-all duration-200"
        >
          <span>Estudiar</span>
          <Play className="w-3 h-3 fill-current" />
        </Link>
      </div>
    </motion.div>
  );
};
