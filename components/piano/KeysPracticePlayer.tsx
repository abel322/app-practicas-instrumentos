'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PianoExerciseData, PianoNoteData } from '@/types/piano';
import { getPianoAudioEngine } from '@/lib/audio/pianoAudioEngine';
import { pianoPreviewSynth } from '@/lib/audio/pianoPreviewSynth';
import { ExtendedScoreView, ScoreMeasure } from '@/components/studio/ExtendedScoreView';
import { InteractivePianoKeyboard } from './InteractivePianoKeyboard';
import { getSubdivisionConfig } from '@/lib/music-theory/rhythmSubdivisions';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Clock,
  KeyboardMusic,
  Plus,
  Minus,
  Maximize2,
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

  // Pantalla Completa con Orientación Forzada Apaisada
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscapeCSS, setIsForceLandscapeCSS] = useState<boolean>(false);
  const fullscreenWrapperRef = useRef<HTMLDivElement | null>(null);

  // Referencias para el Scheduler Web Audio con fase continua y cero flicker
  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(exercise.bpmDefault || 90);
  const metronomeRef = useRef<boolean>(true);
  const measuresRef = useRef<ScoreMeasure[]>([]);
  const stepsPerMeasureRef = useRef<number>(16);
  const isLoopRef = useRef<boolean>(true);

  const nextNoteTimeRef = useRef<number>(0);
  const scheduledStepCountRef = useRef<number>(0);
  const anchorStepRef = useRef<number>(0);
  const anchorAudioTimeRef = useRef<number>(0);
  const lastVisualStepRef = useRef<number>(-1);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Precarga instantánea del motor acústico de piano muestreado
  useEffect(() => {
    pianoPreviewSynth.initContext();
    pianoPreviewSynth.preloadSamples();
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    metronomeRef.current = metronomeEnabled;
  }, [metronomeEnabled]);

  // Subdivisión rítmica dinámica (ej. 1/8 Corcheas, 1/16 Semicorcheas, 1/8T Tresillos)
  const subdivisionKey =
    exercise.subdivision ||
    (exercise.totalSteps === 8
      ? '1/8'
      : exercise.totalSteps === 4
      ? '1/4'
      : exercise.totalSteps === 12 && exercise.timeSignature === '4/4'
      ? '1/8T'
      : '1/16');

  const subConfig = useMemo(() => {
    return getSubdivisionConfig(subdivisionKey, exercise.timeSignature, exercise.stepsPerMeasure);
  }, [subdivisionKey, exercise.timeSignature, exercise.stepsPerMeasure]);

  const stepsPerMeasure = exercise.stepsPerMeasure || subConfig.stepsPerMeasure;
  const totalMeasures = Math.max(1, Math.ceil(exercise.totalSteps / stepsPerMeasure));
  const activeMeasureIndex = Math.min(totalMeasures - 1, Math.floor(activeStep / stepsPerMeasure));
  const stepInMeasure = activeStep % stepsPerMeasure;

  // Pulsos por compás y pasos por pulso
  const beatsPerMeasure =
    exercise.timeSignature === '6/8' ? 2 : exercise.timeSignature === '3/4' ? 3 : 4;
  const stepsPerBeat = Math.max(1, Math.round(stepsPerMeasure / beatsPerMeasure));

  // Duración de un paso según métrica y subdivisión
  const getSecondsPerStep = useCallback(
    (currentBpm: number) => {
      if (exercise.timeSignature === '6/8') {
        const beatDuration = (60 / currentBpm) * 1.5;
        const stepsInBeat = stepsPerMeasure === 6 ? 3 : 6;
        return beatDuration / stepsInBeat;
      }
      const beatDuration = 60 / currentBpm;
      return beatDuration / stepsPerBeat;
    },
    [exercise.timeSignature, stepsPerMeasure, stepsPerBeat]
  );

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

  // Mapear ejercicio de piano al formato de partitura multi-compás (ExtendedScoreView)
  const scoreMeasures: ScoreMeasure[] = useMemo(() => {
    const spm = stepsPerMeasure || 16;
    return Array.from({ length: totalMeasures }).map((_, mIdx) => {
      const mStart = mIdx * spm;
      const mEnd = mStart + spm;
      const mNotes = (exercise.notesData || [])
        .filter((n) => n.step >= mStart && n.step < mEnd)
        .map((n) => ({
          id: n.id,
          stepIndex: n.step - mStart,
          midiNumber: n.midiNumber,
          velocity: typeof n.velocity === 'number' ? n.velocity : 95,
          duration: n.durationSteps ? `${n.durationSteps} steps` : undefined,
          isRest: false,
        }));
      return {
        measureIndex: mIdx,
        notes: mNotes,
      };
    });
  }, [totalMeasures, stepsPerMeasure, exercise.notesData]);

  // Sincronizar referencias para el bucle de scheduler
  useEffect(() => {
    measuresRef.current = scoreMeasures;
    stepsPerMeasureRef.current = stepsPerMeasure;
  }, [scoreMeasures, stepsPerMeasure]);

  // Sincronización en vivo de BPM sin reiniciar el scheduler y aproximando notas al acelerar
  useEffect(() => {
    const prevBpm = bpmRef.current;
    bpmRef.current = bpm;

    if (isPlaying && bpm > prevBpm) {
      const ctx = pianoPreviewSynth.getAudioContext();
      if (ctx) {
        const spm = stepsPerMeasureRef.current || 16;
        const newStepSec = (60 / bpm) * (4 / spm);
        if (nextNoteTimeRef.current > ctx.currentTime + newStepSec) {
          nextNoteTimeRef.current = ctx.currentTime + newStepSec;
        }
      }
    }
  }, [bpm, isPlaying]);

  // Programador de notas (Lookahead Web Audio Scheduler con pianoPreviewSynth)
  const runPianoScheduler = useCallback(() => {
    const allMeasures = measuresRef.current;
    if (!allMeasures || allMeasures.length === 0) return;

    const ctx = pianoPreviewSynth.getAudioContext();
    if (!ctx) return;

    const currentSpm = stepsPerMeasureRef.current || 16;
    const totalSteps = allMeasures.length * currentSpm;
    const stepDurationSec = (60 / bpmRef.current) * (4 / currentSpm);
    const scheduleAheadTime = 0.08;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const globalStep = scheduledStepCountRef.current;

      if (!isLoopRef.current && globalStep >= totalSteps) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setActiveStep(0);
        return;
      }

      const wrappedStep = globalStep % totalSteps;
      const measureIdx = Math.floor(wrappedStep / currentSpm);
      const stepInMeasureIdx = wrappedStep % currentSpm;
      const hitTime = nextNoteTimeRef.current;

      anchorStepRef.current = wrappedStep;
      anchorAudioTimeRef.current = hitTime;

      const currentMeasure = allMeasures[measureIdx];
      const stepNotes = (currentMeasure?.notes || []).filter(
        (n) => n.stepIndex === stepInMeasureIdx && !n.isRest
      );

      if (stepNotes.length > 0) {
        const delayMs = Math.max(0, (hitTime - ctx.currentTime) * 1000);
        const midis = stepNotes.map((n) => n.midiNumber);
        if (delayMs <= 10) {
          pianoPreviewSynth.playChord(midis, Math.max(0.45, stepDurationSec * 1.6), 95);
        } else {
          window.setTimeout(() => {
            if (isPlayingRef.current) {
              pianoPreviewSynth.playChord(midis, Math.max(0.45, stepDurationSec * 1.6), 95);
            }
          }, delayMs);
        }
      }

      if (metronomeRef.current && stepInMeasureIdx % stepsPerBeat === 0) {
        const isDownbeat = stepInMeasureIdx === 0;
        getPianoAudioEngine().playMetronome(hitTime, isDownbeat);
      }

      nextNoteTimeRef.current += stepDurationSec;
      scheduledStepCountRef.current += 1;
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(runPianoScheduler, 20);
    }
  }, [stepsPerBeat]);

  // Sincronizador visual de alta fidelidad vía requestAnimationFrame (Cero parpadeo)
  const updateVisualState = useCallback(() => {
    if (!isPlayingRef.current) return;
    const ctx = pianoPreviewSynth.getAudioContext();
    const allMeasures = measuresRef.current;

    if (ctx && allMeasures && allMeasures.length > 0 && anchorAudioTimeRef.current > 0) {
      const currentSpm = stepsPerMeasureRef.current || 16;
      const totalSteps = allMeasures.length * currentSpm;
      const stepDurationSec = (60 / bpmRef.current) * (4 / currentSpm);

      const delta = ctx.currentTime - anchorAudioTimeRef.current;
      const exactStep = anchorStepRef.current + delta / stepDurationSec;
      const normalized = ((Math.floor(exactStep) % totalSteps) + totalSteps) % totalSteps;

      // Solo actualizar estado de React cuando cambia el paso rítmico entero
      if (normalized !== lastVisualStepRef.current) {
        lastVisualStepRef.current = normalized;
        setActiveStep(normalized);
      }
    }
    rafIdRef.current = requestAnimationFrame(updateVisualState);
  }, []);

  // Iniciar / Pausar
  const handleTogglePlay = useCallback(() => {
    pianoPreviewSynth.initContext();
    const ctx = pianoPreviewSynth.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!isPlaying) {
      const startTime = (ctx ? ctx.currentTime : 0) + 0.03;
      nextNoteTimeRef.current = startTime;
      scheduledStepCountRef.current = activeStep;
      anchorStepRef.current = activeStep;
      anchorAudioTimeRef.current = startTime;
      lastVisualStepRef.current = -1;

      setIsPlaying(true);
      isPlayingRef.current = true;
      runPianoScheduler();
      rafIdRef.current = requestAnimationFrame(updateVisualState);
    } else {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    }
  }, [isPlaying, activeStep, runPianoScheduler, updateVisualState]);

  // Reiniciar a paso 0
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    scheduledStepCountRef.current = 0;
    anchorStepRef.current = 0;
    anchorAudioTimeRef.current = 0;
    lastVisualStepRef.current = -1;
    setActiveStep(0);
  }, []);

  // Control Unificado de Pantalla Completa
  const handleToggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      const elem = fullscreenWrapperRef.current;
      if (elem) {
        try {
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen no disponible o bloqueado:', err);
        }
      }

      let orientationLocked = false;
      try {
        const orientation =
          ((screen as any)?.orientation ||
            (screen as any)?.mozOrientation ||
            (screen as any)?.msOrientation) as any;
        if (orientation && typeof orientation.lock === 'function') {
          await orientation.lock('landscape');
          orientationLocked = true;
        }
      } catch (err) {
        console.warn('Orientación nativa no admitida o bloqueada:', err);
      }

      const isPortrait = window.innerHeight > window.innerWidth;
      setIsForceLandscapeCSS(!orientationLocked && isPortrait);
      setIsFullscreen(true);
    } else {
      try {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {}

      try {
        const orientation =
          ((screen as any)?.orientation ||
            (screen as any)?.mozOrientation ||
            (screen as any)?.msOrientation) as any;
        if (orientation && typeof orientation.unlock === 'function') {
          orientation.unlock();
        }
      } catch (err) {}

      setIsForceLandscapeCSS(false);
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Monitoreo de rotación y eventos de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        setIsForceLandscapeCSS(window.innerHeight > window.innerWidth);
      }
    };

    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsForceLandscapeCSS(false);
        const orientation =
          ((screen as any)?.orientation ||
            (screen as any)?.mozOrientation ||
            (screen as any)?.msOrientation) as any;
        if (orientation && typeof orientation.unlock === 'function') {
          try {
            orientation.unlock();
          } catch (e) {}
        }
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Atajos de teclado (Space: Play/Pause, R: Reset, M: Metronome, Esc: Exit Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isFullscreen) {
          handleToggleFullscreen();
        } else {
          handleReset();
        }
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
  }, [handleTogglePlay, handleReset, isFullscreen, handleToggleFullscreen]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div
      ref={fullscreenWrapperRef}
      className={`transition-colors duration-150 ${
        isFullscreen
          ? isForceLandscapeCSS
            ? 'fixed inset-0 z-[9999] bg-[#0c0e14] w-[100vh] h-[100vw] origin-top-left rotate-90 translate-x-[100vw] flex flex-col justify-between p-3 sm:p-4 overflow-hidden select-none'
            : 'fixed inset-0 z-[9999] bg-[#0c0e14] flex flex-col justify-between p-3 sm:p-4 w-screen h-screen overflow-hidden select-none'
          : 'w-full flex flex-col gap-6 max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 select-none'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. MODO PANTALLA COMPLETA                                       */}
      {/* ============================================================== */}
      {isFullscreen ? (
        <>
          {/* Header Superior Fullscreen */}
          <header className="w-full h-12 px-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-amber-400 truncate max-w-[200px] sm:max-w-md">
                {exercise.title}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Compás {activeMeasureIndex + 1} de {totalMeasures} • {subConfig.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>✕ Salir</span>
              </button>
            </div>
          </header>

          {/* Lienzo Principal con Partitura Superior y Teclado Inferior */}
          <main className="w-full flex-1 min-h-0 flex flex-col justify-between gap-2 bg-[#10131c] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl my-2 p-2 sm:p-3 relative">
            {/* Partitura Superior (ExtendedScoreView con Gran Pentagrama) */}
            <div className="w-full flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <ExtendedScoreView
                measures={scoreMeasures}
                activeMeasureIndex={activeMeasureIndex}
                currentStep={stepInMeasure}
                isPlaying={isPlaying}
                stepsPerMeasure={stepsPerMeasure}
                onSelectMeasureAndStep={(mIdx, sIdx) => {
                  setActiveStep(mIdx * stepsPerMeasure + sIdx);
                }}
                onNoteClick={(_mIdx, midi) => {
                  pianoPreviewSynth.playNote(midi, 1.4, 95);
                }}
              />
            </div>

            {/* Teclado Inferior Interactivo (C2 a C6) */}
            <div className="w-full shrink-0">
              <InteractivePianoKeyboard
                activeNotes={currentlyPlayingNotes}
                startMidi={36} // C2
                endMidi={84}   // C6
                showLabels={true}
                compact={true}
                onKeyPress={(midi) => {
                  pianoPreviewSynth.playNote(midi, 1.4, 95);
                }}
              />
            </div>
          </main>

          {/* Barra Inferior Unificada (Play, Reset, Tempo, Metrónomo) */}
          <footer className="w-full h-14 px-4 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg select-none">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-colors shadow-md cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pausar' : 'Iniciar Práctica'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Reiniciar a paso 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-amber-400 font-black">{bpm} BPM</span>
              <input
                type="range"
                min={40}
                max={220}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-20 sm:w-32 h-1 bg-slate-800 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setMetronomeEnabled(!metronomeEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                metronomeEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              {metronomeEnabled ? <Volume2 className="w-3.5 h-3.5 inline mr-1 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 inline mr-1" />}
              Metrónomo {metronomeEnabled ? 'ON' : 'OFF'}
            </button>
          </footer>
        </>
      ) : (
        /* ============================================================== */
        /* 2. MODO NORMAL (ESTÁNDAR)                                       */
        /* ============================================================== */
        <>
          {/* Header del Reproductor */}
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
                    Piano Lab &bull; Gran Pentagrama
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

            {/* Acciones y Metadatos */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="Activar Pantalla Completa Apaisada"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pantalla Completa</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">{exercise.timeSignature}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <KeyboardMusic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Compás {activeMeasureIndex + 1}/{totalMeasures}</span>
              </div>
            </div>
          </div>

          {/* Barra de Transporte (Transport Controls) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Controles de Reproducción y Reinicio */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-center">
              <button
                onClick={handleTogglePlay}
                className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-colors active:scale-95 cursor-pointer ${
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
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Reiniciar al compás 1 (Tecla R)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Toggle Metrónomo */}
              <button
                onClick={() => setMetronomeEnabled((prev) => !prev)}
                className={`px-3.5 py-3 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
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
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
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
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Indicador de Paso y Compás Activo */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-zinc-400 justify-center">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                Paso {stepInMeasure + 1} / {stepsPerMeasure}
              </span>
              <span className="text-[11px] text-slate-500">
                Compás {activeMeasureIndex + 1} de {totalMeasures}
              </span>
            </div>
          </div>

          {/* Resumen de Notas en Tiempo Real */}
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
              <span>Atajos: [Espacio] Play/Pausa &bull; [R] Reiniciar &bull; [M] Metrónomo &bull; [Esc] Salir</span>
            </div>
          </div>

          {/* 1. Partitura Multi-Compás (Gran Pentagrama con Clave de Sol y Clave de Fa) */}
          <section className="w-full rounded-2xl overflow-hidden shadow-xl border border-slate-800">
            <ExtendedScoreView
              measures={scoreMeasures}
              activeMeasureIndex={activeMeasureIndex}
              currentStep={stepInMeasure}
              isPlaying={isPlaying}
              stepsPerMeasure={stepsPerMeasure}
              onSelectMeasureAndStep={(mIdx, sIdx) => {
                setActiveStep(mIdx * stepsPerMeasure + sIdx);
              }}
              onNoteClick={(_mIdx, midi) => {
                pianoPreviewSynth.playNote(midi, 1.4, 95);
              }}
            />
          </section>

          {/* 2. Teclado Virtual Horizontal con Iluminación Reactiva */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <KeyboardMusic className="w-4 h-4 text-cyan-500" />
                Teclado Interactivo (C2 a C6 &bull; Pulsa las teclas o deja que la partitura guíe)
              </h2>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                49 Teclas Acústicas Reales
              </span>
            </div>

            <InteractivePianoKeyboard
              activeNotes={currentlyPlayingNotes}
              startMidi={36} // C2
              endMidi={84}   // C6
              showLabels={true}
              compact={false}
              onKeyPress={(midi) => {
                pianoPreviewSynth.playNote(midi, 1.4, 95);
              }}
            />
          </section>
        </>
      )}
    </div>
  );
};
