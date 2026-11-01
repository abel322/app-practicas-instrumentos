'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MasterySkillNode } from '@/types/mastery';
import { Flame, Play, CheckCircle2, Dumbbell, Sparkles } from 'lucide-react';

interface DailyWarmupBarProps {
  completedSkills: MasterySkillNode[];
  onLaunchWarmup: (skill: MasterySkillNode) => void;
}

export const DailyWarmupBar: React.FC<DailyWarmupBarProps> = ({
  completedSkills,
  onLaunchWarmup,
}) => {
  if (completedSkills.length === 0) {
    return (
      <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Flame className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              Mantenimiento Diario (2 min por técnica)
            </h3>
            <p className="text-xs text-slate-500">
              Al graduar tu primer nivel, sus micro-ejercicios se añadirán automáticamente aquí para tu rutina de calentamiento antes de cada sesión.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] font-mono text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>0 Técnicas Listas</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-amber-950/20 to-slate-900/95 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)] backdrop-blur-md flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-mono">
                Mantenimiento Diario &bull; Calentamiento (2 min)
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                {completedSkills.length} {completedSkills.length === 1 ? 'Técnica' : 'Técnicas'} Activas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ejecuta 2 minutos a tempo de calentamiento para consolidar la memoria muscular antes de abordar tu reto activo.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-amber-400/80">
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Fijación Biomecánica</span>
        </div>
      </div>

      {/* Lista Horizontal de Técnicas Superadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 pt-1">
        {completedSkills.map((skill) => (
          <motion.div
            key={skill.id}
            whileHover={{ scale: 1.02 }}
            className="group p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 hover:border-amber-400/60 transition-all flex flex-col justify-between gap-2 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Nivel {skill.level}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Graduado
                </span>
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                {skill.technique}
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Tempo Calentamiento: <span className="text-amber-400 font-bold">{skill.warmupBpm} BPM</span>
              </p>
            </div>

            <button
              onClick={() => onLaunchWarmup(skill)}
              className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Calentar (2 min)</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

