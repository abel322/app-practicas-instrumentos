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
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 'Intermedio':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'Avanzado':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      default:
        return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400';
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
      className="group relative flex flex-col justify-between rounded-2xl glass-panel p-6 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden"
    >
      {/* Resplandor decorativo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Cabecera: Instrumento y Dificultad */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isBass
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                  : 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300'
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
        <div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          {exercise.category}
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
          {exercise.title}
        </h3>

        {/* Descripción */}
        {exercise.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
            {exercise.description}
          </p>
        )}

        {/* Mini Preview de Tablatura */}
        {tabPreview.length > 0 && (
          <div className="mb-4 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 font-mono">
            <div className="text-[10px] text-zinc-500 uppercase mb-1.5 flex items-center justify-between">
              <span>Fraseo &amp; Trastes</span>
              <span>Afinación: {exercise.tuning}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {tabPreview.map((note, i) => (
                <span
                  key={`preview-${i}`}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-300"
                >
                  <span className="text-zinc-500 text-[9px]">c{note.string}:</span>
                  <span className="text-cyan-400 font-bold">{note.technique === 'ghost' ? 'X' : note.fret}</span>
                  {note.technique && note.technique !== 'normal' && note.technique !== 'ghost' && (
                    <span className="text-[9px] text-fuchsia-400 uppercase font-extrabold ml-0.5">
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
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5" title="Tempo sugerido">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{exercise.bpmDefault} BPM</span>
          </div>
          <div className="flex items-center gap-1.5" title="Métrica">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{exercise.timeSignature}</span>
          </div>
        </div>

        <Link
          href={`/strings/practice/${exercise.slug}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-zinc-950 font-semibold text-xs transition-all duration-200 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
        >
          <span>Estudiar Tab</span>
          <Play className="w-3 h-3 fill-current" />
        </Link>
      </div>
    </motion.div>
  );
};
