'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { DrumExerciseData, DrumHit } from '@/types/drum';
import { getAudioEngine } from '@/lib/drumAudioEngine';
import { DrumStaffScore } from './DrumStaffScore';
import { TransportBar } from './TransportBar';
import { StickingLegend } from './StickingLegend';
import { ArrowLeft, Drum, Sparkles, Keyboard } from 'lucide-react';

interface PracticePlayerProps {
  exercise: DrumExerciseData;
}

export const PracticePlayer: React.FC<PracticePlayerProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(exercise.bpmDefault);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Referencias para el scheduler de Web Audio API (Chris Wilson lookahead pattern)
  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(exercise.bpmDefault);
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const measureStartTimeRef = useRef<number>(0);

  // Mantener refs sincronizadas con estado
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Duración de un compás completo en segundos según BPM y métrica
  // En 4/4 con 16 semicorcheas: 4 tiempos de negra = 4 * (60 / bpm) segundos
  // En 6/8 con 12 semicorcheas: 2 pulsos de negra con puntillo = 2 * (60 / (bpm * 2/3))
  const getSecondsPerStep = useCallback((currentBpm: number) => {
    if (exercise.timeSignature === '6/8') {
      // En 6/8 a BPM marcado por corchea o negra con puntillo
      // 12 semicorcheas por compás -> 6 corcheas -> tiempo por semicorchea = (60 / currentBpm) / 4
      return (60 / currentBpm) / 2;
    }
    // En 4/4: 1 tiempo de negra = 4 semicorcheas -> tiempo por semicorchea = (60 / currentBpm) / 4
    return (60 / currentBpm) / 4;
  }, [exercise.timeSignature]);

  const getMeasureDuration = useCallback((currentBpm: number) => {
    return getSecondsPerStep(currentBpm) * exercise.totalSteps;
  }, [exercise.totalSteps, getSecondsPerStep]);

  // Indexar hits por paso para acceso instantáneo O(1)
  const hitsByStep = useRef<Map<number, DrumHit[]>>(new Map());
  useEffect(() => {
    const map = new Map<number, DrumHit[]>();
    for (let i = 0; i < exercise.totalSteps; i++) {
      map.set(i, []);
    }
    exercise.hitsData.forEach((hit) => {
      if (hit.step >= 0 && hit.step < exercise.totalSteps) {
        map.get(hit.step)?.push(hit);
      }
    });
    hitsByStep.current = map;
  }, [exercise]);

  // Planificador (Scheduler) de notas de Web Audio API
  const scheduleNote = useCallback((stepNumber: number, time: number) => {
    const engine = getAudioEngine();

    // 1. Disparar los instrumentos en este paso
    const hits = hitsByStep.current.get(stepNumber) || [];
    hits.forEach((hit) => {
      engine.trigger(hit.instrument, time, hit.velocity ?? 0.8, !!hit.accent);
    });

    // 2. Metrónomo sincronizado en los tiempos fuertes
    let isMetronomeBeat = false;
    let isDownbeat = false;

    if (exercise.timeSignature === '4/4') {
      // Clic cada 4 semicorcheas (en los tiempos 1, 2, 3, 4)
      if (stepNumber % 4 === 0) {
        isMetronomeBeat = true;
        isDownbeat = stepNumber === 0;
      }
    } else if (exercise.timeSignature === '6/8') {
      // Clic cada 6 semicorcheas (2 pulsos de compás) o cada 2
      if (stepNumber % 6 === 0) {
        isMetronomeBeat = true;
        isDownbeat = stepNumber === 0;
      }
    } else {
      if (stepNumber % 4 === 0) {
        isMetronomeBeat = true;
        isDownbeat = stepNumber === 0;
      }
    }

    if (isMetronomeBeat) {
      engine.playMetronome(time, isDownbeat);
    }
  }, [exercise.timeSignature]);

  // Bucle lookahead de Web Audio
  const scheduler = useCallback(() => {
    const engine = getAudioEngine();
    const ctx = engine.getAudioContext();
    if (!ctx) return;

    const scheduleAheadTime = 0.12; // Ventana de previsión de 120ms

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);

      // Avanzar al siguiente paso
      const stepDuration = getSecondsPerStep(bpmRef.current);
      nextNoteTimeRef.current += stepDuration;

      currentStepRef.current += 1;
      if (currentStepRef.current >= exercise.totalSteps) {
        currentStepRef.current = 0;
        measureStartTimeRef.current = nextNoteTimeRef.current;
      }
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(scheduler, 25);
    }
  }, [exercise.totalSteps, getSecondsPerStep, scheduleNote]);

  // Bucle de animación visual a 60/120 FPS para el cabezal Runway
  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;

    const engine = getAudioEngine();
    const ctx = engine.getAudioContext();

    if (ctx) {
      const now = ctx.currentTime;
      const measureDuration = getMeasureDuration(bpmRef.current);
      const elapsedInMeasure = (now - measureStartTimeRef.current) % measureDuration;
      const normalizedProgress = Math.max(0, Math.min(1, elapsedInMeasure / measureDuration));

      setProgress(normalizedProgress);
      const computedStep = Math.floor(normalizedProgress * exercise.totalSteps);
      setActiveStep(computedStep % exercise.totalSteps);
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [exercise.totalSteps, getMeasureDuration]);

  // Manejo de Play / Pause
  const handlePlayPause = useCallback(() => {
    const engine = getAudioEngine();
    engine.init();
    engine.resume();

    if (isPlaying) {
      // Pausar
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
      // Iniciar
      setIsPlaying(true);
      isPlayingRef.current = true;
      const ctx = engine.getAudioContext();
      const startTime = (ctx ? ctx.currentTime : 0) + 0.05;
      nextNoteTimeRef.current = startTime;
      measureStartTimeRef.current = startTime;
      currentStepRef.current = 0;

      scheduler();
      rafIdRef.current = requestAnimationFrame(updateVisualProgress);
    }
  }, [isPlaying, scheduler, updateVisualProgress]);

  // Detener y reiniciar compás
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    currentStepRef.current = 0;
    setActiveStep(0);
    setProgress(0);
  }, []);

  // Alternar Metrónomo
  const handleToggleMetronome = useCallback(() => {
    const nextState = !metronomeEnabled;
    setMetronomeEnabled(nextState);
    getAudioEngine().setMetronomeEnabled(nextState);
  }, [metronomeEnabled]);

  // Control de atajos de teclado para bateristas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleStop();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMetronome();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setBpm((prev) => Math.min(240, prev + 5));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setBpm((prev) => Math.max(40, prev - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, handleStop, handleToggleMetronome]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      {/* 1. Header Superior del Ejercicio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Volver al catálogo"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
                {exercise.category}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {exercise.timeSignature}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {exercise.totalSteps} Pasos
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {exercise.title}
            </h1>
          </div>
        </div>

        {/* Nivel de Dificultad Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs px-3 py-1 rounded-full font-semibold border bg-white/5 border-white/10 text-zinc-300">
            {exercise.difficulty}
          </span>
        </div>
      </div>

      {/* 2. Pentagrama Formal y Runway Cursor */}
      <div className="w-full">
        <DrumStaffScore
          timeSignature={exercise.timeSignature}
          totalSteps={exercise.totalSteps}
          hitsData={exercise.hitsData}
          progress={progress}
          activeStep={activeStep}
          isPlaying={isPlaying}
        />
      </div>

      {/* 3. Barra de Transporte (Play, Stop, BPM, Metrónomo) */}
      <div className="w-full">
        <TransportBar
          isPlaying={isPlaying}
          bpm={bpm}
          metronomeEnabled={metronomeEnabled}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onBpmChange={setBpm}
          onToggleMetronome={handleToggleMetronome}
          onResetBpm={() => setBpm(exercise.bpmDefault)}
          defaultBpm={exercise.bpmDefault}
        />
      </div>

      {/* 4. Leyenda de Sticking y Notación Musical */}
      <div className="w-full">
        <StickingLegend />
      </div>

      {/* 5. Atajos de Teclado y Descripción */}
      <div className="mt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 px-2">
        <div className="flex items-center gap-2">
          <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
          <span>Atajos:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Espacio</kbd>
          <span>Play/Pausa</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Esc</kbd>
          <span>Stop</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">M</kbd>
          <span>Metrónomo</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">↑/↓</kbd>
          <span>BPM</span>
        </div>

        {exercise.description && (
          <p className="text-zinc-400 text-center sm:text-right italic max-w-md">
            "{exercise.description}"
          </p>
        )}
      </div>
    </div>
  );
};
