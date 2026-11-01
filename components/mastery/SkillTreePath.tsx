'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MasterySkillNode } from '@/types/mastery';
import {
  Lock,
  CheckCircle2,
  Play,
  Zap,
  Gauge,
  Clock,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface SkillTreePathProps {
  skills: MasterySkillNode[];
  activeLevel: number;
  completedLevels: number[];
  onOpenPractice: (skill: MasterySkillNode) => void;
  onAddNewLevel?: () => void;
  onEditSkill?: (skill: MasterySkillNode) => void;
  onDeleteSkill?: (skillId: string) => void;
}

export const SkillTreePath: React.FC<SkillTreePathProps> = ({
  skills,
  activeLevel,
  completedLevels,
  onOpenPractice,
  onAddNewLevel,
  onEditSkill,
  onDeleteSkill,
}) => {
  const nextLevelNumber = skills.length > 0 ? Math.max(...skills.map((s) => s.level)) + 1 : 1;

  return (
    <div className="relative w-full flex flex-col gap-6 py-4 select-none">
      {/* Indicador de Título del Árbol & Botón "+ Agregar Nivel" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
            Árbol de Progresión Técnica ({skills.length} Niveles Disponibles)
          </h2>
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline-block">
            Desbloqueo progresivo
          </span>

          {onAddNewLevel && (
            <button
              onClick={onAddNewLevel}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Agregar Nivel</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenedor de Nodos */}
      <div className="relative flex flex-col gap-5">
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(0.4, index * 0.04) }}
                className={`relative w-full rounded-2xl border transition-all overflow-hidden ${
                  isCompleted
                    ? 'bg-emerald-50/90 dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-900/80 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 shadow-xs dark:shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                    : isCurrent
                    ? 'bg-cyan-50/90 dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-900/90 dark:to-cyan-950/30 border-cyan-400 dark:border-cyan-500/50 shadow-sm dark:shadow-[0_0_25px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/40'
                    : 'bg-white/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/60 opacity-60 backdrop-blur-xs'
                }`}
              >
                {/* Glow decorativo para nivel activo */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                )}
                {isCompleted && (
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
                  {/* Bloque Izquierdo: Insignia de Nivel & Título de Técnica */}
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Badge Circular de Nivel */}
                    <div
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 font-mono font-black text-base sm:text-lg transition-transform shadow-xs ${
                        isCompleted
                          ? 'bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                          : isCurrent
                          ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-700 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-105'
                          : 'bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <span>{skill.level < 10 ? `0${skill.level}` : skill.level}</span>
                      )}

                      {/* Pulso de actividad si es el nivel en curso */}
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>

                    {/* Textos y Etiquetas */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Estado */}
                        {isCompleted && (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                            Completado &bull; Graduado
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
                            Nivel Activo
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                            Bloqueado (Nivel {skill.level - 1})
                          </span>
                        )}

                        {/* Distinción de Nivel Personalizado */}
                        {skill.isCustom && (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Personalizado
                          </span>
                        )}

                        {/* Dificultad */}
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          {skill.difficultyLabel}
                        </span>

                        {/* Categoría */}
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          &bull; {skill.category}
                        </span>
                      </div>

                      {/* Nombre Principal de la Técnica */}
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        {skill.title}
                      </h3>

                      {/* Micro-ejercicio descriptivo */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 leading-normal">
                        <span className="font-semibold text-slate-800 dark:text-slate-300">Micro-ejercicio:</span>{' '}
                        {skill.microExercise.title} — {skill.microExercise.description}
                      </p>

                      {/* Notación previa compacta */}
                      <div className="mt-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-cyan-700 dark:text-cyan-300/90 overflow-x-auto whitespace-pre no-scrollbar">
                        {skill.microExercise.tabOrNotation.split('\n')[0]}
                      </div>
                    </div>
                  </div>

                  {/* Bloque Central: Comparativa de Velocidad */}
                  <div className="flex flex-col sm:flex-row lg:flex-col justify-between lg:justify-center gap-2.5 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/70 shrink-0 lg:w-60">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5" />
                        Tempo Inicial:
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{skill.initialBpm} BPM</span>
                    </div>

                    {/* Medidor visual */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">Meta: {skill.targetBpm} BPM</span>
                        <span className="text-slate-500 dark:text-slate-400">{skill.subdivision}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 w-full'
                              : isCurrent
                              ? 'bg-cyan-500 w-2/3'
                              : 'bg-slate-400 dark:bg-slate-700 w-1/4'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Criterio de Pase */}
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-1.5 leading-snug">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{skill.passCriterion}</span>
                    </div>
                  </div>

                  {/* Bloque Derecho: Botón de Lanzamiento & Acciones de Edición/Eliminación */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 shrink-0">
                    <button
                      onClick={() => !isLocked && onOpenPractice(skill)}
                      disabled={isLocked}
                      className={`w-full sm:w-auto lg:w-40 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm select-none ${
                        isLocked
                          ? 'bg-slate-200 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:scale-[1.02]'
                          : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black hover:brightness-110 shadow-[0_0_18px_rgba(6,182,212,0.4)] hover:scale-[1.02]'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bloqueado</span>
                        </>
                      ) : isCompleted ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Perfeccionar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Iniciar Práctica</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                        <span>Sesión 15m</span>
                      </div>

                      {/* Acciones para Niveles Personalizados del Usuario */}
                      {skill.isCustom && (
                        <div className="flex items-center gap-1.5 ml-2">
                          {onEditSkill && (
                            <button
                              onClick={() => onEditSkill(skill)}
                              title="Editar nivel personalizado"
                              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteSkill && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Seguro que deseas eliminar el nivel personalizado "${skill.title}"?`
                                  )
                                ) {
                                  onDeleteSkill(skill.id);
                                }
                              }}
                              title="Eliminar nivel personalizado"
                              className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Conector Vertical entre niveles */}
              {!isLast && (
                <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-800 my-0.5 relative flex items-center justify-center">
                  <div
                    className={`w-2 h-2 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                        : isCurrent
                        ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                        : 'bg-slate-300 dark:bg-slate-800 border-slate-400 dark:border-slate-700'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Tarjeta Dashed al Final de la Lista: + Añadir Nivel Siguiente */}
        {onAddNewLevel && (
          <div className="relative flex flex-col items-center pt-1">
            <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-800 my-0.5" />
            <motion.button
              whileHover={{ scale: 1.01 }}
              onClick={onAddNewLevel}
              className="w-full p-5 sm:p-6 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer text-center sm:text-left shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    + Añadir Nivel Siguiente (Nivel {nextLevelNumber})
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Diseña un ejercicio en Studio Builder o crea un nivel rápido con tablatura y BPM meta personalizados.
                  </p>
                </div>
              </div>

              <span className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow-xs">
                Añadir Nivel {nextLevelNumber}
              </span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
