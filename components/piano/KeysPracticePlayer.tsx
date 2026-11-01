'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PianoExerciseData, PianoNoteData } from '@/types/piano';
import { getPianoAudioEngine } from '@/lib/audio/pianoAudioEngine';
import { InteractivePianoKeyboard } from './InteractivePianoKeyboard';
import { KeysRunwayMatrix } from './KeysRunwayMatrix';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Activity,
  Clock,
  Sparkles,
  KeyboardMusic,
  Plus,
  Minus,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface KeysPracticePlayerProps {
  exercise: PianoExerciseData;
}

export const KeysPracticePlayer: React.FC<KeysPracticePlayerProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(exercise.bpmDefault || 90);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);

  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(exercise.bpmDefault || 90);
  const metronomeRef = useRef<boolean>(true);
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    metronomeRef.current = metronomeEnabled;
  }, [metronomeEnabled]);

  // Indexar notas por paso temporal para acceso instantáneo
  const notesByStep = useMemo(() => {
    const map = new Map<number, PianoNoteData[]>();
    for (let i = 0; i < exercise.totalSteps; i++) {
      map.set(i, []);
    }
    (exercise.notesData || []).forEach((note) => {
      if (note.step >= 0 && note.step < exercise.totalSteps) {
        map.get(note.step)?.push(note);
      }
    });
    return map;
  }, [exercise]);

  // Notas activas en el paso actual
  const currentlyPlayingNotes = useMemo(() => {
    return notesByStep.get(activeStep) || [];
  }, [notesByStep, activeStep]);

  // Duración de un paso (semicorchea: 1/4 de un pulso de negra)
  const getSecondsPerStep = useCallback((currentBpm: number) => {
    return (60 / currentBpm) / 4;
  }, []);

  // Programador de notas (Lookahead Web Audio Scheduler)
  const scheduleNote = useCallback((stepNumber: number, time: number) => {
    const engine = getPianoAudioEngine();
    const notesInStep = notesByStep.get(stepNumber) || [];

    // 1. Disparar cada nota polifónica en este paso
    notesInStep.forEach((note) => {
      const vel = typeof note.velocity === 'number' ? note.velocity / 127 : 0.85;
      const durationSec = (note.durationSteps || 1) * getSecondsPerStep(bpmRef.current);
      engine.triggerNote(note.midiNumber, time, durationSec, vel);
    });

    // 2. Metrónomo en tiempos de negra (cada 4 pasos)
    if (metronomeRef.current && stepNumber % 4 === 0) {
      const isDownbeat = stepNumber === 0;
      engine.playMetronome(time, isDownbeat);
    }
  }, [notesByStep, getSecondsPerStep]);

  const schedulerLoop = useCallback(() => {
    const engine = getPianoAudioEngine();
    const ctx = engine.getAudioContext();
    if (!ctx) return;

    const scheduleAheadTime = 0.12;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);

      const stepDuration = getSecondsPerStep(bpmRef.current);
      nextNoteTimeRef.current += stepDuration;

      currentStepRef.current = (currentStepRef.current + 1) % exercise.totalSteps;
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(schedulerLoop, 25);
    }
  }, [exercise.totalSteps, getSecondsPerStep, scheduleNote]);

  // Sincronizador visual de alta fidelidad vía requestAnimationFrame
  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;
    setActiveStep(currentStepRef.current);
    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, []);

  // Iniciar / Pausar
  const handleTogglePlay = useCallback(() => {
    const engine = getPianoAudioEngine();
    engine.resume();
    const ctx = engine.getAudioContext();

    if (!isPlaying) {
      if (ctx) {
        nextNoteTimeRef.current = ctx.currentTime + 0.05;
      }
      setIsPlaying(true);
      isPlayingRef.current = true;
      schedulerLoop();
      rafIdRef.current = requestAnimationFrame(updateVisualProgress);
    } else {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    }
  }, [isPlaying, schedulerLoop, updateVisualProgress]);

  // Reiniciar a paso 0
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    currentStepRef.current = 0;
    setActiveStep(0);
  }, []);

  // Atajos de teclado (Space: Play/Pause, R: Reset, M: Metronome)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMetronomeEnabled((prev) => !prev);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setBpm((prev) => Math.min(240, prev + 5));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setBpm((prev) => Math.max(40, prev - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleReset]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 select-none">
      {/* 1. Header del Reproductor: Navegación & Metadatos */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/piano"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-300 transition-colors"
            title="Volver a la Biblioteca de Piano"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                Piano Lab &bull; Keys Runway
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                {exercise.category} &bull; {exercise.difficulty}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {exercise.title}
            </h1>
          </div>
        </div>

        {/* Metadatos rápidos */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">{bpm} BPM</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">{exercise.timeSignature}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <KeyboardMusic className="w-3.5 h-3.5 text-cyan-400" />
            <span>{exercise.totalSteps} Pasos</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Transporte (Transport Controls) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Controles de Reproducción y Reinicio */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
          <button
            onClick={handleTogglePlay}
            className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400'
                : 'bg-[#0891b2] hover:bg-[#0e7490] text-white shadow-cyan-600/25 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-cyan-400 dark:text-zinc-950 dark:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar (Space)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Práctica</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-300 transition-colors"
            title="Reiniciar al compás 1 (Tecla R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Metrónomo */}
          <button
            onClick={() => setMetronomeEnabled((prev) => !prev)}
            className={`px-3.5 py-3 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              metronomeEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
            }`}
            title="Alternar Metrónomo (Tecla M)"
          >
            {metronomeEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
            <span>Metrónomo</span>
          </button>
        </div>

        {/* Control de Tempo BPM */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center bg-slate-100/90 dark:bg-slate-950/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">Tempo:</span>

          <button
            onClick={() => setBpm((prev) => Math.max(40, prev - 5))}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-700"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1">
            <input
              type="range"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-24 sm:w-32 accent-[#0891b2] dark:accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white w-14 text-center">
              {bpm} BPM
            </span>
          </div>

          <button
            onClick={() => setBpm((prev) => Math.min(240, prev + 5))}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicador de Paso Activo */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-zinc-400 justify-center">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
            Paso {activeStep + 1} / {exercise.totalSteps}
          </span>
          <span className="text-[11px] text-slate-500">
            Compás {Math.floor(activeStep / 16) + 1}
          </span>
        </div>
      </div>

      {/* 3. Resumen de Notas en Tiempo Real */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-zinc-400">Sonando ahora:</span>
          {currentlyPlayingNotes.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {currentlyPlayingNotes.map((n, i) => {
                const isLeft = n.hand === 'left' || (!n.hand && n.midiNumber < 60);
                return (
                  <span
                    key={`cur-${i}`}
                    className={`px-2 py-0.5 rounded-md font-bold text-xs shadow-xs ${
                      isLeft
                        ? 'bg-blue-500 text-white shadow-blue-500/40'
                        : 'bg-cyan-400 text-zinc-950 shadow-cyan-400/40'
                    }`}
                  >
                    {n.noteName} ({isLeft ? 'MI' : 'MD'}
                    {n.finger ? ` - d${n.finger}` : ''})
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-zinc-600 italic">Silencio en este paso</span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Atajos: [Espacio] Play/Pausa &bull; [R] Reiniciar &bull; [M] Metrónomo</span>
        </div>
      </div>

      {/* 4. Teclado Virtual Horizontal con Iluminación Reactiva */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <KeyboardMusic className="w-4 h-4 text-cyan-500" />
            Teclado Interactivo (C2 a C6 &bull; Pulsa las teclas o deja que Runway guíe)
          </h2>
          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            49 Teclas Acústicas Sintetizadas
          </span>
        </div>

        <InteractivePianoKeyboard
          activeNotes={currentlyPlayingNotes}
          startMidi={36} // C2
          endMidi={84}   // C6
          showLabels={true}
        />
      </section>

      {/* 5. Matriz Runway con Playhead Cursor */}
      <section className="space-y-2">
        <KeysRunwayMatrix
          totalSteps={exercise.totalSteps}
          activeStep={activeStep}
          notes={exercise.notesData || []}
          timeSignature={exercise.timeSignature}
        />
      </section>
    </div>
  );
};

