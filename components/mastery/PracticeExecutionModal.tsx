'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterySkillNode } from '@/types/mastery';
import { getMasteryAudioEngine } from '@/lib/audio/masteryAudioService';
import { InteractiveExerciseViewer } from './InteractiveExerciseViewer';
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
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Flame,
  HelpCircle,
  Flag,
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
  const [activeStepCounter, setActiveStepCounter] = useState<number>(0);

  // Modo Validación Activa (3 repeticiones)
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationRep, setValidationRep] = useState<number>(0); // 1, 2, 3
  const [validationComplete, setValidationComplete] = useState<boolean>(false);

  // Contador de repeticiones limpias manual
  const [cleanReps, setCleanReps] = useState<number>(0);

  const audioService = useRef(getMasteryAudioEngine());
  const beatsInRepRef = useRef<number>(0);

  // Sincronizar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setBpm(skill.initialBpm);
      setCleanReps(0);
      setRemainingSec(15 * 60);
      setIsTimerRunning(false);
      setIsMetronomeActive(false);
      setIsValidating(false);
      setValidationRep(0);
      setValidationComplete(false);
      setActiveStepCounter(0);
      beatsInRepRef.current = 0;
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
        setActiveStepCounter((prev) => prev + 1);

        // Si está en modo de validación, contar compases de la repetición
        if (isValidating && !validationComplete) {
          beatsInRepRef.current += 1;
          // Cada 16 pulsos (ej. 4 compases de 4/4) se considera 1 repetición
          const totalBeatsPerRep = 8;
          if (beatsInRepRef.current >= totalBeatsPerRep) {
            beatsInRepRef.current = 0;
            audioService.current.playRepetitionTick();
            setValidationRep((prevRep) => {
              const next = prevRep + 1;
              if (next >= 3) {
                setValidationComplete(true);
                audioService.current.stopMetronome();
                setIsMetronomeActive(false);
              }
              return Math.min(3, next);
            });
          }
        }
      });
    } else {
      audioService.current.stopMetronome();
    }
    return () => {
      audioService.current.stopMetronome();
    };
  }, [isMetronomeActive, bpm, isValidating, validationComplete]);

  // Cerrar y detener audio
  const handleClose = () => {
    audioService.current.stopMetronome();
    setIsMetronomeActive(false);
    setIsTimerRunning(false);
    onClose();
  };

  // Toggle Metrónomo manual
  const toggleMetronome = () => {
    if (!isMetronomeActive) {
      audioService.current.init();
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

  // Comenzar Intento de Validación Oficial
  const handleStartValidation = () => {
    audioService.current.init();
    setBpm(skill.targetBpm);
    audioService.current.setBpm(skill.targetBpm);
    setValidationRep(1);
    setValidationComplete(false);
    beatsInRepRef.current = 0;
    setIsValidating(true);
    setIsMetronomeActive(true);
    if (!isTimerRunning && remainingSec > 0) {
      setIsTimerRunning(true);
    }
  };

  // Incrementar repetición limpia manual
  const handleAddCleanRep = () => {
    audioService.current.playRepetitionTick();
    setCleanReps((prev) => Math.min(skill.targetReps, prev + 1));
  };

  const handleResetReps = () => {
    setCleanReps(0);
    setValidationRep(0);
    setValidationComplete(false);
    setIsValidating(false);
  };

  // Confirmar y graduar
  const handleConfirmGraduation = () => {
    audioService.current.stopMetronome();
    setIsMetronomeActive(false);
    setIsTimerRunning(false);
    audioService.current.playVictoryChime();
    onGraduate(skill);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isTargetBpmReached = bpm >= skill.targetBpm;
  const isRepsComplete = cleanReps >= skill.targetReps || (isValidating && validationComplete);
  const canGraduate = isRepsComplete && isTargetBpmReached;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 dark:bg-black/85 backdrop-blur-md overflow-y-auto select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] transition-colors"
      >
        {/* Cabecera del Entorno de Ejecución */}
        <header className="px-5 py-4 bg-slate-100 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-mono font-black text-sm shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              {skill.level < 10 ? `0${skill.level}` : skill.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                  {skill.difficultyLabel}
                </span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  {skill.instrument.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {skill.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors"
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
            <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Temporizador de Sesión</span>
                </div>
                {/* Selector 15 vs 20 min */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => {
                      setSessionDurationSec(15 * 60);
                      setRemainingSec(15 * 60);
                      setIsTimerRunning(false);
                    }}
                    className={`px-2 py-0.5 rounded ${
                      sessionDurationSec === 15 * 60
                        ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                        ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    20 min
                  </button>
                </div>
              </div>

              {/* Display del Tiempo */}
              <div className="flex items-baseline justify-center gap-2 py-1">
                <span className="font-mono text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatTime(remainingSec)}
                </span>
                <span className="text-xs font-mono text-slate-500">restantes</span>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 dark:bg-cyan-400 transition-all duration-1000"
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
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
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
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Panel 2: Web Audio Metrónomo de Alta Precisión */}
            <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                  <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
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
                            ? 'bg-cyan-500 dark:bg-cyan-400 scale-125 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                            : 'bg-teal-500 dark:bg-teal-400 scale-110 shadow-[0_0_6px_rgba(45,212,191,0.7)]'
                          : 'bg-slate-300 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Display del Tempo & Ajustes Rápidos */}
              <div className="flex items-center justify-center gap-4 py-1">
                <button
                  onClick={() => adjustBpm(-5)}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <span className="font-mono text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {bpm}
                  </span>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 ml-1">BPM</span>
                </div>

                <button
                  onClick={() => adjustBpm(5)}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800"
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
                className="w-full accent-cyan-500 dark:accent-cyan-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />

              {/* Atajos Rápidos */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => {
                    setBpm(skill.initialBpm);
                    if (isMetronomeActive) audioService.current.setBpm(skill.initialBpm);
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Inicial: {skill.initialBpm}
                </button>

                <button
                  onClick={toggleMetronome}
                  className={`py-1.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm ${
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
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-800 text-cyan-600 dark:text-cyan-400'
                  }`}
                >
                  Meta: {skill.targetBpm} ★
                </button>
              </div>
            </div>
          </div>

          {/* Visor Interactivo Integrado (Runway / Tablatura) */}
          <InteractiveExerciseViewer
            skill={skill}
            activeStepIndex={activeStepCounter}
            isPlaying={isMetronomeActive}
          />

          {/* Banner de Intento de Validación Oficial */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-amber-500/10 to-teal-500/10 border-2 border-amber-500/40 dark:border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase">
                <Flag className="w-4 h-4 text-amber-500" />
                <span>Intento de Validación Oficial (3 Repeticiones)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-lg leading-relaxed">
                Ejecuta el micro-ejercicio con metrónomo a <strong className="text-slate-900 dark:text-white font-bold">{skill.targetBpm} BPM</strong>.
                {isValidating ? (
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold block mt-1">
                    Validación en curso: Repetición {validationRep} de 3...
                  </span>
                ) : (
                  <span> Haz clic para sincronizar el metrónomo y correr el ciclo de prueba.</span>
                )}
              </p>
            </div>

            {/* Botón de Inicio de Validación */}
            <div className="flex items-center gap-3">
              {!isValidating ? (
                <button
                  onClick={handleStartValidation}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Comenzar Intento de Validación</span>
                </button>
              ) : validationComplete ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡3 Repeticiones Ejecutadas!</span>
                  </div>
                  <button
                    onClick={handleStartValidation}
                    className="text-[11px] font-mono text-slate-500 underline hover:text-slate-900 dark:hover:text-white"
                  >
                    Reintentar Validación
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Rep {validationRep} / 3 en curso</span>
                </div>
              )}
            </div>
          </div>

          {/* Contador Manual Alternativo & Criterio de Pase */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">Criterio Oficial:</span>{' '}
              {skill.passCriterion}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetReps}
                title="Reiniciar repeticiones"
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono font-black text-sm text-amber-700 dark:text-amber-300">
                {cleanReps} / {skill.targetReps} Reps
              </div>
              <button
                onClick={handleAddCleanRep}
                className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+1 Limpia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Validar y Graduar Nivel */}
        <footer className="px-5 py-4 bg-slate-100 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 transition-colors">
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 text-center sm:text-left">
            {canGraduate ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                ¡Criterio alcanzado! Haz clic en "Confirmar y Graduar Nivel" para desbloquear el Nivel {skill.level + 1}.
              </span>
            ) : (
              <span>
                Para validar: Alcanza <strong className="text-slate-900 dark:text-white">{skill.targetBpm} BPM</strong> y completa{' '}
                <strong className="text-slate-900 dark:text-white">3 repeticiones limpias</strong> consecutivas.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Salir
            </button>

            <button
              onClick={handleConfirmGraduation}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all select-none ${
                canGraduate
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>
                {isAlreadyCompleted ? 'Confirmar Repetición Exitosa' : 'Confirmar y Graduar Nivel'}
              </span>
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};
