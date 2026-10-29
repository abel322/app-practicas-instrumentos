'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { StringExerciseData } from '@/types/strings';
import { Play, Activity, Clock, Music, Sliders } from 'lucide-react';

interface StringExerciseCardProps {
  exercise: StringExerciseData;
  index: number;
}

export const StringExerciseCard: React.FC<StringExerciseCardProps> = ({ exercise, index }) => {
  const isBass = exercise.instrument === 'bass_4';

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

  // Extraer las primeras notas para una vista previa de la tablatura
  const tabPreview = exercise.tabData.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col justify-between rounded-2xl bg-[#f8fafc] dark:bg-slate-900/80 p-6 border border-slate-300/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden"
    >
      {/* Resplandor decorativo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-[#0891b2]/5 dark:bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-[#0891b2]/10 dark:group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Cabecera: Instrumento y Dificultad */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isBass
                  ? 'bg-[#0891b2]/15 border-[#0891b2]/30 text-[#0891b2] dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-300'
                  : 'bg-fuchsia-600/15 border-fuchsia-600/30 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:border-fuchsia-500/30 dark:text-fuchsia-300'
              }`}
            >
              {isBass ? 'Bajo (4 Cuerdas)' : 'Guitarra (6 Cuerdas)'}
            </span>
          </div>

          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getDifficultyBadge(
              exercise.difficulty
            )}`}
          >
            {exercise.difficulty}
          </span>
        </div>

        {/* Categoría */}
        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-zinc-400 mb-1">
          {exercise.category}
        </div>

        {/* Título */}
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#0891b2] dark:group-hover:text-cyan-300 transition-colors mb-2">
          {exercise.title}
        </h3>

        {/* Descripción */}
        {exercise.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">
            {exercise.description}
          </p>
        )}

        {/* Mini Preview de Tablatura */}
        {tabPreview.length > 0 && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-200/80 dark:bg-zinc-900/60 border border-slate-300/70 dark:border-white/5 font-mono">
            <div className="text-[10px] text-slate-600 dark:text-zinc-500 uppercase mb-1.5 flex items-center justify-between">
              <span>Fraseo &amp; Trastes</span>
              <span>Afinación: {exercise.tuning}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {tabPreview.map((note, i) => (
                <span
                  key={`preview-${i}`}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-[10px] text-slate-700 dark:text-zinc-300"
                >
                  <span className="text-slate-500 dark:text-zinc-500 text-[9px]">c{note.string}:</span>
                  <span className="text-[#0891b2] dark:text-cyan-400 font-bold">{note.technique === 'ghost' ? 'X' : note.fret}</span>
                  {note.technique && note.technique !== 'normal' && note.technique !== 'ghost' && (
                    <span className="text-[9px] text-fuchsia-600 dark:text-fuchsia-400 uppercase font-extrabold ml-0.5">
                      ({note.technique[0]})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pie de la Tarjeta */}
      <div className="pt-4 border-t border-slate-300/70 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5" title="Tempo sugerido">
            <Activity className="w-3.5 h-3.5 text-[#0891b2] dark:text-cyan-400" />
            <span>{exercise.bpmDefault} BPM</span>
          </div>
          <div className="flex items-center gap-1.5" title="Métrica">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-500" />
            <span>{exercise.timeSignature}</span>
          </div>
        </div>

        <Link
          href={`/strings/practice/${exercise.slug}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white shadow-sm dark:bg-cyan-500/10 dark:hover:bg-cyan-500 dark:border dark:border-cyan-500/30 dark:hover:border-cyan-500 dark:text-cyan-300 dark:hover:text-zinc-950 font-bold text-xs transition-all duration-200"
        >
          <span>Estudiar Tab</span>
          <Play className="w-3 h-3 fill-current" />
        </Link>
      </div>
    </motion.div>
  );
};
