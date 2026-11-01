'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MasterySkillNode } from '@/types/mastery';
import {
  Lock,
  CheckCircle2,
  Play,
  Zap,
  ArrowRight,
  Gauge,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface SkillTreePathProps {
  skills: MasterySkillNode[];
  activeLevel: number;
  completedLevels: number[];
  onOpenPractice: (skill: MasterySkillNode) => void;
}

export const SkillTreePath: React.FC<SkillTreePathProps> = ({
  skills,
  activeLevel,
  completedLevels,
  onOpenPractice,
}) => {
  return (
    <div className="relative w-full flex flex-col gap-8 py-4 select-none">
      {/* Indicador de Título del Árbol */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 font-mono">
            Árbol de Progresión Técnica (Nivel 1 &rarr; 5)
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
          Desbloqueo secuencial por criterio de pase
        </span>
      </div>

      {/* Contenedor de Nodos con Línea Conectora Vertical */}
      <div className="relative flex flex-col gap-6">
        {skills.map((skill, index) => {
          const isCompleted = completedLevels.includes(skill.level);
          const isCurrent = skill.level === activeLevel && !isCompleted;
          const isUnlocked = skill.level === 1 || completedLevels.includes(skill.level - 1);
          const isLocked = !isUnlocked;

          const isLast = index === skills.length - 1;

          return (
            <div key={skill.id} className="relative flex flex-col items-center">
              {/* Tarjeta del Nivel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className={`relative w-full rounded-2xl border transition-all overflow-hidden ${
                  isCompleted
                    ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                    : isCurrent
                    ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-cyan-950/30 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-65 backdrop-blur-xs'
                }`}
              >
                {/* Glow decorativo de esquina para nivel activo */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                )}
                {isCompleted && (
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                  {/* Bloque Izquierdo: Insignia de Nivel & Título de Técnica */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Badge Circular de Nivel */}
                    <div
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-mono font-black text-lg transition-transform shadow-lg ${
                        isCompleted
                          ? 'bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : isCurrent
                          ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.4)] scale-105'
                          : 'bg-slate-900 border border-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-slate-500" />
                      ) : (
                        <span>0{skill.level}</span>
                      )}

                      {/* Pulso de actividad si es el nivel en curso */}
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>

                    {/* Textos y Etiquetas */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Estado */}
                        {isCompleted && (
                          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Completado &bull; Graduado
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Nivel Activo &bull; En Curso
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                            Bloqueado (Supera Nivel {skill.level - 1})
                          </span>
                        )}

                        {/* Dificultad */}
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                          {skill.difficultyLabel}
                        </span>

                        {/* Categoría */}
                        <span className="text-[10px] font-mono text-slate-400">
                          &bull; {skill.category}
                        </span>
                      </div>

                      {/* Nombre Principal de la Técnica */}
                      <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                        {skill.title}
                      </h3>

                      {/* Micro-ejercicio descriptivo */}
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-slate-300">Micro-ejercicio:</span>{' '}
                        {skill.microExercise.title} — {skill.microExercise.description}
                      </p>

                      {/* Notación previa o tablatura compacta */}
                      <div className="mt-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-[11px] text-cyan-300/90 overflow-x-auto whitespace-pre no-scrollbar">
                        {skill.microExercise.tabOrNotation}
                      </div>
                    </div>
                  </div>

                  {/* Bloque Central: Comparativa de Velocidad (BPM Inicial vs Meta) */}
                  <div className="flex flex-col sm:flex-row lg:flex-col justify-between lg:justify-center gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 shrink-0 lg:w-64">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        Tempo Inicial:
                      </span>
                      <span className="font-bold text-slate-200">{skill.initialBpm} BPM</span>
                    </div>

                    {/* Medidor visual de velocidad */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-cyan-400 font-bold">Meta: {skill.targetBpm} BPM</span>
                        <span className="text-slate-400">{skill.subdivisionNote}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCompleted
                              ? 'bg-emerald-400 w-full'
                              : isCurrent
                              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 w-2/3'
                              : 'bg-slate-700 w-1/4'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Criterio de Pase */}
                    <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-start gap-1.5 leading-snug">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{skill.passCriterion}</span>
                    </div>
                  </div>

                  {/* Bloque Derecho: Botón de Lanzamiento */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 shrink-0">
                    <button
                      onClick={() => !isLocked && onOpenPractice(skill)}
                      disabled={isLocked}
                      className={`w-full sm:w-auto lg:w-44 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md select-none ${
                        isLocked
                          ? 'bg-slate-800/60 border border-slate-700/50 text-slate-500 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white hover:scale-[1.02]'
                          : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Bloqueado</span>
                        </>
                      ) : isCompleted ? (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Perfeccionar Nivel</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Iniciar Rutina (15m)</span>
                        </>
                      )}
                    </button>

                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400/80" />
                      <span>Sesión acotada 15-20 min</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Conector Vertical entre niveles */}
              {!isLast && (
                <div className="w-0.5 h-6 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-700 my-0.5 relative flex items-center justify-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-400 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                        : isCurrent
                        ? 'bg-cyan-400 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

