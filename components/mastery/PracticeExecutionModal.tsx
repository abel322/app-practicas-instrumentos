'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterySkillNode } from '@/types/mastery';
import { getMasteryAudioEngine } from '@/lib/audio/masteryAudioService';
import {
  X,
  Play,
  Square,
  RotateCcw,
  Clock,
  Gauge,
  Trophy,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface PracticeExecutionModalProps {
  skill: MasterySkillNode;
  isOpen: boolean;
  onClose: () => void;
  onGraduate: (skill: MasterySkillNode) => void;
  isAlreadyCompleted: boolean;
}

export const PracticeExecutionModal: React.FC<PracticeExecutionModalProps> = ({
  skill,
  isOpen,
  onClose,
  onGraduate,
  isAlreadyCompleted,
}) => {
  // Configuración de Temporizador (15 min = 900s)
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(15 * 60);
  const [remainingSec, setRemainingSec] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Metrónomo
  const [bpm, setBpm] = useState<number>(skill.initialBpm);
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [activeBeat, setActiveBeat] = useState<number>(0);

  // Contador de repeticiones limpias
  const [cleanReps, setCleanReps] = useState<number>(0);
  const [showGraduationConfirm, setShowGraduationConfirm] = useState<boolean>(false);

  const audioService = useRef(getMasteryAudioEngine());

  // Sincronizar BPM al cambiar de nivel
  useEffect(() => {
    if (isOpen) {
      setBpm(skill.initialBpm);
      setCleanReps(0);
      setRemainingSec(15 * 60);
      setIsTimerRunning(false);
      setIsMetronomeActive(false);
      setShowGraduationConfirm(false);
    }
  }, [isOpen, skill]);

  // Manejo del Temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && remainingSec > 0) {
      interval = setInterval(() => {
        setRemainingSec((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, remainingSec]);

  // Manejo del Metrónomo con Web Audio API
  useEffect(() => {
    if (isMetronomeActive) {
      audioService.current.startMetronome(bpm, (beat) => {
        setActiveBeat(beat);
      });
    } else {
      audioService.current.stopMetronome();
    }
    return () => {
      audioService.current.stopMetronome();
    };
  }, [isMetronomeActive, bpm]);

  // Parar audio al cerrar modal
  const handleClose = () => {
    audioService.current.stopMetronome();
    setIsMetronomeActive(false);
    setIsTimerRunning(false);
    onClose();
  };

  // Toggle Metrónomo
  const toggleMetronome = () => {
    if (!isMetronomeActive) {
      audioService.current.init();
      // Si el temporizador no está corriendo, iniciarlo al encender el metrónomo
      if (!isTimerRunning && remainingSec > 0) {
        setIsTimerRunning(true);
      }
    }
    setIsMetronomeActive(!isMetronomeActive);
  };

  // Ajustar BPM
  const adjustBpm = (delta: number) => {
    const nextBpm = Math.max(40, Math.min(260, bpm + delta));
    setBpm(nextBpm);
    if (isMetronomeActive) {
      audioService.current.setBpm(nextBpm);
    }
  };

  // Incrementar repetición limpia
  const handleAddCleanRep = () => {
    audioService.current.playRepetitionTick();
    setCleanReps((prev) => {
      const next = Math.min(skill.targetReps, prev + 1);
      return next;
    });
  };

  // Resetear repeticiones
  const handleResetReps = () => {
    setCleanReps(0);
  };

  // Formato mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validar y graduar nivel
  const handleConfirmGraduation = () => {
    audioService.current.stopMetronome();
    setIsMetronomeActive(false);
    setIsTimerRunning(false);
    audioService.current.playVictoryChime();
    onGraduate(skill);
  };

  if (!isOpen) return null;

  const isTargetBpmReached = bpm >= skill.targetBpm;
  const isRepsComplete = cleanReps >= skill.targetReps;
  const canGraduate = isRepsComplete && isTargetBpmReached;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Cabecera del Entorno de Ejecución */}
        <header className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-black text-sm shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              0{skill.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {skill.difficultyLabel}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {skill.instrument.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                {skill.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Cerrar sesión"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Cuerpo con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Fila Superior: Temporizador de 15 min & Metrónomo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel 1: Temporizador de Sesión Acotada */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Temporizador de Sesión</span>
                </div>
                {/* Selector 15 vs 20 min */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => {
                      setSessionDurationSec(15 * 60);
                      setRemainingSec(15 * 60);
                      setIsTimerRunning(false);
                    }}
                    className={`px-2 py-0.5 rounded ${
                      sessionDurationSec === 15 * 60
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    15 min
                  </button>
                  <button
                    onClick={() => {
                      setSessionDurationSec(20 * 60);
                      setRemainingSec(20 * 60);
                      setIsTimerRunning(false);
                    }}
                    className={`px-2 py-0.5 rounded ${
                      sessionDurationSec === 20 * 60
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    20 min
                  </button>
                </div>
              </div>

              {/* Display Gigante del Tiempo */}
              <div className="flex items-baseline justify-center gap-2 py-1">
                <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {formatTime(remainingSec)}
                </span>
                <span className="text-xs font-mono text-slate-500">restantes</span>
              </div>

              {/* Barra de Progreso del Tiempo */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-1000"
                  style={{
                    width: `${((sessionDurationSec - remainingSec) / sessionDurationSec) * 100}%`,
                  }}
                />
              </div>

              {/* Controles de Temporizador */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isTimerRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar Reloj</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setRemainingSec(sessionDurationSec);
                    setIsTimerRunning(false);
                  }}
                  title="Reiniciar temporizador"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Panel 2: Web Audio Metrónomo de Alta Precisión */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Metrónomo Web Audio</span>
                </div>
                {/* 4 Indicadores visuales de compás */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((b) => (
                    <div
                      key={b}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        isMetronomeActive && activeBeat === b
                          ? b === 0
                            ? 'bg-cyan-400 scale-125 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                            : 'bg-teal-400 scale-110 shadow-[0_0_6px_rgba(45,212,191,0.7)]'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Display del Tempo & Ajustes Rápidos */}
              <div className="flex items-center justify-center gap-4 py-1">
                <button
                  onClick={() => adjustBpm(-5)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {bpm}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 ml-1">BPM</span>
                </div>

                <button
                  onClick={() => adjustBpm(5)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Slider de BPM */}
              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBpm(val);
                  if (isMetronomeActive) audioService.current.setBpm(val);
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />

              {/* Atajos Rápidos: Inicial vs Meta */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => {
                    setBpm(skill.initialBpm);
                    if (isMetronomeActive) audioService.current.setBpm(skill.initialBpm);
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white"
                >
                  Inicial: {skill.initialBpm} BPM
                </button>

                <button
                  onClick={toggleMetronome}
                  className={`py-1.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    isMetronomeActive
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {isMetronomeActive ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Silenciar</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Activar Click</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setBpm(skill.targetBpm);
                    if (isMetronomeActive) audioService.current.setBpm(skill.targetBpm);
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg border text-[11px] font-mono font-bold transition-colors ${
                    isTargetBpmReached
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400'
                  }`}
                >
                  Meta: {skill.targetBpm} BPM ★
                </button>
              </div>
            </div>
          </div>

          {/* Micro-Ejercicio Detallado & Tablatura / Partitura */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Micro-ejercicio Técnico
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {skill.microExercise.title}
                </h3>
              </div>
              {skill.microExercise.fingering && (
                <div className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-slate-500">Digitación:</span> {skill.microExercise.fingering}
                </div>
              )}
            </div>

            {/* Bloque de Tablatura o Notación */}
            <div className="p-3.5 rounded-xl bg-black/70 border border-slate-800/90 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-text shadow-inner">
              {skill.microExercise.tabOrNotation}
            </div>

            {/* Instrucciones Paso a Paso */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">
                Instrucciones de Ejecución:
              </h4>
              <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                {skill.microExercise.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>

            {/* Foco Anatómico & Pro Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Foco Biomecánico & Ergonómico:
                </span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {skill.anatomicalFocus}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Consejo de Maestría:
                </span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {skill.proTips[0]}
                </p>
              </div>
            </div>
          </div>

          {/* Criterio de Pase & Contador de Repeticiones Limpias */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Criterio de Aprobación Oficial</span>
              </div>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                {skill.passCriterion}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <span>Velocidad actual:</span>
                <span className={`font-bold ${isTargetBpmReached ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {bpm} / {skill.targetBpm} BPM
                </span>
                {isTargetBpmReached && (
                  <span className="text-emerald-400 font-bold">&bull; ¡Tempo Meta Alcanzado!</span>
                )}
              </div>
            </div>

            {/* Contador Interactivo de Repeticiones */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Repeticiones Limpias Consecutivas
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetReps}
                  title="Reiniciar repeticiones"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Display 0 / 3 */}
                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-lg font-mono font-black text-amber-300 tracking-wider shadow-inner">
                  {cleanReps} / {skill.targetReps}
                </div>

                <button
                  onClick={handleAddCleanRep}
                  className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono font-black text-sm flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+1 Limpia</span>
                </button>
              </div>

              {isRepsComplete && (
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  3 repeticiones registradas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Botón de Validar y Graduar Nivel */}
        <footer className="px-5 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-slate-400 text-center sm:text-left">
            {canGraduate ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                ¡Criterio cumplido! Haz clic en "Validar y Graduar" para desbloquear el Nivel {skill.level + 1}.
              </span>
            ) : (
              <span>
                Para validar: Alcanza <strong className="text-white">{skill.targetBpm} BPM</strong> y completa{' '}
                <strong className="text-white">3 repeticiones limpias</strong> consecutivas.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              Salir
            </button>

            <button
              onClick={handleConfirmGraduation}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all select-none ${
                canGraduate
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>
                {isAlreadyCompleted ? 'Confirmar Repetición Exitosa' : 'Validar y Graduar Nivel'}
              </span>
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

