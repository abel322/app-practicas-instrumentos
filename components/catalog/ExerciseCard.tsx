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
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 'Intermedio':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'Avanzado':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      default:
        return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400';
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
      className="group relative flex flex-col justify-between rounded-2xl glass-panel p-6 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden"
    >
      {/* Resplandor dinámico en esquina en hover */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Cabecera de la Card: Categoría y Dificultad */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs uppercase tracking-widest font-semibold text-cyan-400">
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
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
          {exercise.title}
        </h3>

        {/* Descripción didáctica */}
        {exercise.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-5">
            {exercise.description}
          </p>
        )}

        {/* Secuencia miniatura de Sticking (R / L / K) */}
        {stickingSequence.length > 0 && (
          <div className="mb-5 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1.5 flex items-center justify-between">
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
                      hit.accent ? 'ring-1 ring-white/60 font-black' : ''
                    } ${
                      isRight
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : isLeft
                        ? 'bg-fuchsia-500/20 text-fuchsia-300'
                        : isKick
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-zinc-400'
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
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        {/* Metadatos musicales */}
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5" title="Tempo predeterminado">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{exercise.bpmDefault} BPM</span>
          </div>

          <div className="flex items-center gap-1.5" title="Métrica del compás">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{exercise.timeSignature}</span>
          </div>
        </div>

        {/* CTA Link hacia el Reproductor Runway */}
        <Link
          href={`/practice/${exercise.slug}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-zinc-950 font-semibold text-xs transition-all duration-200 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
        >
          <span>Estudiar</span>
          <Play className="w-3 h-3 fill-current" />
        </Link>
      </div>
    </motion.div>
  );
};
