'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { StringExerciseData, StringTabNote } from '@/types/strings';
import { getStringsAudioEngine } from '@/lib/stringsAudioEngine';
import { TablatureRunway } from './TablatureRunway';
import { TransportBar } from '@/components/practice/TransportBar';
import { StringsLegend } from './StringsLegend';
import { ArrowLeft, Keyboard, Music } from 'lucide-react';

interface StringsPracticePlayerProps {
  exercise: StringExerciseData;
}

export const StringsPracticePlayer: React.FC<StringsPracticePlayerProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(exercise.bpmDefault);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(exercise.bpmDefault);
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const measureStartTimeRef = useRef<number>(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const isBass = exercise.instrument === 'bass_4';

  // Duración de un paso (semicorchea en 4/4)
  const getSecondsPerStep = useCallback((currentBpm: number) => {
    return (60 / currentBpm) / 4;
  }, []);

  const getMeasureDuration = useCallback((currentBpm: number) => {
    return getSecondsPerStep(currentBpm) * exercise.totalSteps;
  }, [exercise.totalSteps, getSecondsPerStep]);

  // Indexar notas por paso
  const notesByStep = useRef<Map<number, StringTabNote[]>>(new Map());
  useEffect(() => {
    const map = new Map<number, StringTabNote[]>();
    for (let i = 0; i < exercise.totalSteps; i++) {
      map.set(i, []);
    }
    exercise.tabData.forEach((note) => {
      if (note.step >= 0 && note.step < exercise.totalSteps) {
        map.get(note.step)?.push(note);
      }
    });
    notesByStep.current = map;
  }, [exercise]);

  // Planificador (Scheduler) de notas de cuerdas
  const scheduleNote = useCallback((stepNumber: number, time: number) => {
    const engine = getStringsAudioEngine();

    // 1. Disparar notas en este paso
    const notes = notesByStep.current.get(stepNumber) || [];
    notes.forEach((note) => {
      engine.triggerNote(
        exercise.instrument,
        note.string,
        note.fret,
        time,
        note.technique || 'normal',
        note.velocity ?? 0.8
      );
    });

    // 2. Metrónomo en tiempos fuertes (cada 4 semicorcheas = 1 tiempo de negra)
    if (stepNumber % 4 === 0) {
      const isDownbeat = stepNumber === 0;
      engine.playMetronome(time, isDownbeat);
    }
  }, [exercise.instrument]);

  // Lookahead loop
  const scheduler = useCallback(() => {
    const engine = getStringsAudioEngine();
    const ctx = engine.getAudioContext();
    if (!ctx) return;

    const scheduleAheadTime = 0.12;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);

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

  // Animación suave del Runway Cursor
  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;

    const engine = getStringsAudioEngine();
    const ctx = engine.getAudioContext();

    if (ctx) {
      const now = ctx.currentTime;
      const measureDuration = getMeasureDuration(bpmRef.current);
      const elapsed = (now - measureStartTimeRef.current) % measureDuration;
      const normalized = Math.max(0, Math.min(1, elapsed / measureDuration));

      setProgress(normalized);
      const computedStep = Math.floor(normalized * exercise.totalSteps);
      setActiveStep(computedStep % exercise.totalSteps);
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [exercise.totalSteps, getMeasureDuration]);

  // Play / Pausa
  const handlePlayPause = useCallback(() => {
    const engine = getStringsAudioEngine();
    engine.init();
    engine.resume();

    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
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

  // Stop
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    currentStepRef.current = 0;
    setActiveStep(0);
    setProgress(0);
  }, []);

  // Metrónomo
  const handleToggleMetronome = useCallback(() => {
    const nextState = !metronomeEnabled;
    setMetronomeEnabled(nextState);
    getStringsAudioEngine().setMetronomeEnabled(nextState);
  }, [metronomeEnabled]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      {/* 1. Header del Ejercicio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/strings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Volver al catálogo de cuerdas"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isBass
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                    : 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300'
                }`}
              >
                {isBass ? 'Bajo (4 Cuerdas)' : 'Guitarra (6 Cuerdas)'}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-cyan-400 uppercase font-semibold">
                {exercise.category}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Afinación: {exercise.tuning}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {exercise.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs px-3 py-1 rounded-full font-semibold border bg-white/5 border-white/10 text-zinc-300">
            {exercise.difficulty}
          </span>
        </div>
      </div>

      {/* 2. Visualizador de Tablatura Profesional con Runway */}
      <div className="w-full">
        <TablatureRunway
          instrument={exercise.instrument}
          tuning={exercise.tuning}
          totalSteps={exercise.totalSteps}
          timeSignature={exercise.timeSignature}
          tabData={exercise.tabData}
          progress={progress}
          activeStep={activeStep}
          isPlaying={isPlaying}
        />
      </div>

      {/* 3. Barra de Transporte */}
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
          backHref="/strings"
          backLabel="Catálogo Cuerdas"
        />
      </div>

      {/* 4. Leyenda de Técnicas */}
      <div className="w-full">
        <StringsLegend />
      </div>

      {/* 5. Atajos y Notas Didácticas */}
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
