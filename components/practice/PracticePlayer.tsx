'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { DrumExerciseData, DrumHit } from '@/types/drum';
import { getAudioEngine } from '@/lib/drumAudioEngine';
import { drumSampler } from '@/lib/audio/drumSynth';
import { DrumScoreRenderer } from './DrumScoreSVG';
import { TransportBar } from './TransportBar';
import { StickingLegend } from './StickingLegend';
import { getLocalExercises } from '@/lib/exercises/customExercisesStorage';
import {
  normalizeSubdivisionKey,
  getStepsForSubdivision,
  getSubdivisionConfig,
} from '@/lib/music-theory/rhythmSubdivisions';
import { ArrowLeft, Drum, Sparkles, Keyboard, Maximize2, Minimize2 } from 'lucide-react';

interface PracticePlayerProps {
  exercise: DrumExerciseData;
}

export const PracticePlayer: React.FC<PracticePlayerProps> = ({ exercise }) => {
  // Estado local del ejercicio con hidratación reactiva si existe una versión actualizada en localStorage
  const [activeExercise, setActiveExercise] = useState<DrumExerciseData>(exercise);

  useEffect(() => {
    try {
      // 1. Revisar si hay datos en sessionStorage de una sesión reciente de edición
      const sessionRaw = sessionStorage.getItem('soundlab_editing_exercise');
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        if (parsed.slug === exercise.slug) {
          setActiveExercise((prev) => ({ ...prev, ...parsed }));
          return;
        }
      }

      // 2. Revisar si el ejercicio fue guardado en localStorage
      const localList = getLocalExercises();
      const found = localList.find((e: any) => e.slug === exercise.slug);
      if (found) {
        setActiveExercise((prev) => ({ ...prev, ...found }));
      }
    } catch (e) {
      console.warn('Error sincronizando ejercicio local en PracticePlayer:', e);
    }
  }, [exercise.slug]);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(activeExercise.bpmDefault || 100);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Pantalla Completa con Orientación Forzada Apaisada
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscapeCSS, setIsForceLandscapeCSS] = useState<boolean>(false);
  const drumFullscreenRef = useRef<HTMLDivElement | null>(null);

  // Referencias para el scheduler de Web Audio API (Chris Wilson lookahead pattern con anclaje de fase continua)
  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(activeExercise.bpmDefault || 100);
  const audioStartTimeRef = useRef<number>(0);
  const nextNoteTimeRef = useRef<number>(0);
  const schedulerStepRef = useRef<number>(0);
  const anchorStepRef = useRef<number>(0);
  const anchorAudioTimeRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastStickingByInstrumentRef = useRef<Record<string, { sticking: string; step: number; accent: boolean }>>({});

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Precarga de muestras de batería acústica real
  useEffect(() => {
    drumSampler.preloadSamples();
  }, []);

  // ==============================================================
  // 1. LECTURA DINÁMICA DE SUBDIVISIÓN Y PASOS POR COMPÁS
  // ==============================================================
  const rawSubdivision =
    activeExercise?.subdivision ||
    (activeExercise?.totalSteps === 8
      ? '1/8'
      : activeExercise?.totalSteps === 4
      ? '1/4'
      : activeExercise?.totalSteps === 12 && activeExercise?.timeSignature === '4/4'
      ? '1/8T'
      : '1/16');

  const normalizedSub = normalizeSubdivisionKey(rawSubdivision);
  const stepsPerMeasure =
    activeExercise?.stepsPerMeasure ||
    getStepsForSubdivision(normalizedSub, activeExercise?.timeSignature); // 8 para 1/8, 16 para 1/16

  const subConfig = useMemo(() => {
    return getSubdivisionConfig(normalizedSub, activeExercise?.timeSignature, stepsPerMeasure);
  }, [normalizedSub, activeExercise?.timeSignature, stepsPerMeasure]);

  const totalMeasures =
    (activeExercise as any).measures?.length ||
    Math.max(1, Math.ceil((activeExercise?.totalSteps || stepsPerMeasure) / stepsPerMeasure));
  const totalSteps = totalMeasures * stepsPerMeasure;

  const activeMeasureIndex = Math.min(totalMeasures - 1, Math.floor(activeStep / stepsPerMeasure));
  const stepInMeasure = activeStep % stepsPerMeasure;

  // Pulsos por compás y pasos por pulso según métrica
  const beatsPerMeasure =
    activeExercise.timeSignature === '6/8' ? 2 : activeExercise.timeSignature === '3/4' ? 3 : 4;
  const stepsPerBeat = Math.max(1, Math.round(stepsPerMeasure / beatsPerMeasure));

  // ==============================================================
  // 2. SINCRONIZACIÓN DE TIEMPO DEL SECUENCIADOR WEB AUDIO
  // ==============================================================
  const getSecondsPerStep = useCallback(
    (currentBpm: number) => {
      if (activeExercise.timeSignature === '6/8') {
        const beatDuration = (60 / currentBpm) * 1.5;
        const stepsInBeat = stepsPerMeasure === 6 ? 3 : 6;
        return beatDuration / stepsInBeat;
      }
      // En 1/8 (Corcheas): cada paso dura (60 / BPM) / 2 segundos
      // En 1/16 (Semicorcheas): cada paso dura (60 / BPM) / 4 segundos
      // En 1/4 (Negras): cada paso dura (60 / BPM) / 1 segundos
      const beatDuration = 60 / currentBpm;
      return beatDuration / stepsPerBeat;
    },
    [activeExercise.timeSignature, stepsPerMeasure, stepsPerBeat]
  );

  const getMeasureDuration = useCallback(
    (currentBpm: number) => {
      return getSecondsPerStep(currentBpm) * stepsPerMeasure;
    },
    [getSecondsPerStep, stepsPerMeasure]
  );

  // Sincronizar BPM en caliente sin reiniciar el scheduler
  useEffect(() => {
    const prevBpm = bpmRef.current;
    bpmRef.current = bpm;

    // Si el usuario acelera los BPM en vivo y el próximo golpe estaba agendado muy lejos (tempo lento),
    // acercar el próximo golpe al intervalo del nuevo tempo para respuesta acústica inmediata
    if (isPlaying && bpm > prevBpm) {
      const engine = getAudioEngine();
      const ctx = engine.getAudioContext();
      if (ctx) {
        const newSecondsPerStep = getSecondsPerStep(bpm);
        if (nextNoteTimeRef.current > ctx.currentTime + newSecondsPerStep) {
          nextNoteTimeRef.current = ctx.currentTime + newSecondsPerStep;
        }
      }
    }
  }, [bpm, isPlaying, getSecondsPerStep]);

  // Indexar hits por paso temporal para acceso instantáneo O(1)
  const hitsByStep = useRef<Map<number, DrumHit[]>>(new Map());
  useEffect(() => {
    const map = new Map<number, DrumHit[]>();
    for (let i = 0; i < totalSteps; i++) {
      map.set(i, []);
    }
    const hits = activeExercise.hitsData || (activeExercise as any).data || [];
    hits.forEach((hit: any) => {
      const step = hit.step !== undefined ? hit.step : hit.stepIndex !== undefined ? hit.stepIndex : 0;
      if (step >= 0 && step < totalSteps) {
        map.get(step)?.push({
          step,
          instrument: hit.instrument || hit.drumType || hit.instrumentKey || 'snare',
          accent: !!hit.accent,
          sticking: hit.sticking || 'R',
          velocity: hit.velocity ?? 0.8,
        });
      }
    });
    hitsByStep.current = map;
  }, [activeExercise, totalSteps]);

  // Planificador (Scheduler) de notas de Web Audio API con detección de rebote doble y sticking estéreo
  const scheduleNote = useCallback(
    (stepNumber: number, time: number) => {
      const engine = getAudioEngine();

      // 1. Disparar los instrumentos en este paso
      const hits = hitsByStep.current.get(stepNumber) || [];
      hits.forEach((hit) => {
        const isFoot = hit.instrument === 'kick' || (hit.instrument as string) === 'bombo';
        const lastInfo = lastStickingByInstrumentRef.current[hit.instrument];
        const stepDiff = lastInfo ? (stepNumber - lastInfo.step + totalSteps) % totalSteps : 999;
        const isDoubleRebound =
          !isFoot &&
          Boolean(hit.sticking) &&
          lastInfo?.sticking === hit.sticking &&
          !hit.accent &&
          stepDiff <= 2;

        lastStickingByInstrumentRef.current[hit.instrument] = {
          sticking: hit.sticking || 'R',
          step: stepNumber,
          accent: !!hit.accent,
        };

        engine.trigger({
          instrument: hit.instrument,
          time,
          velocity: hit.velocity ?? 0.8,
          accent: !!hit.accent,
          sticking: isFoot ? null : (hit.sticking as 'R' | 'L') || 'R',
          isDoubleRebound,
        });
      });

      // 2. Metrónomo sincronizado en los tiempos de negra/pulso fuerte
      if (metronomeEnabled && stepNumber % stepsPerBeat === 0) {
        const isDownbeat = stepNumber % stepsPerMeasure === 0;
        engine.playMetronome(time, isDownbeat);
      }
    },
    [metronomeEnabled, stepsPerBeat, stepsPerMeasure, totalSteps]
  );

  // Bucle lookahead de Web Audio con ventana de agendado de 80ms y anclaje de fase continua
  const scheduler = useCallback(() => {
    const engine = getAudioEngine();
    const ctx = engine.getAudioContext();
    if (!ctx) return;

    const scheduleAheadTime = 0.08;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const globalStep = schedulerStepRef.current;
      const hitTime = nextNoteTimeRef.current;

      // Actualizar anclaje de fase para el escáner visual
      anchorStepRef.current = globalStep;
      anchorAudioTimeRef.current = hitTime;

      scheduleNote(globalStep, hitTime);

      const stepDuration = getSecondsPerStep(bpmRef.current);
      nextNoteTimeRef.current += stepDuration;

      schedulerStepRef.current = (schedulerStepRef.current + 1) % totalSteps;
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(scheduler, 20);
    }
  }, [totalSteps, getSecondsPerStep, scheduleNote]);

  // Bucle visual a 60/120 FPS anclado al último golpe de hardware (fase continua sin desfase al cambiar BPM)
  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;

    const engine = getAudioEngine();
    const ctx = engine.getAudioContext();

    if (ctx && anchorAudioTimeRef.current > 0) {
      const currentBpm = bpmRef.current;
      const stepDuration = getSecondsPerStep(currentBpm);

      // Diferencia de tiempo respecto al golpe de referencia más reciente agendado (< 80ms)
      const deltaFromAnchor = ctx.currentTime - anchorAudioTimeRef.current;
      const exactStep = anchorStepRef.current + deltaFromAnchor / stepDuration;

      const normalizedStep =
        ((Math.floor(exactStep) % totalSteps) + totalSteps) % totalSteps;

      // Progreso continuo dentro del compás para la animación del cabezal
      const stepInMeas = exactStep >= 0 ? exactStep % stepsPerMeasure : 0;
      const normalizedProgress = Math.max(0, Math.min(1, stepInMeas / stepsPerMeasure));

      setProgress(normalizedProgress);
      setActiveStep(normalizedStep);
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [totalSteps, stepsPerMeasure, getSecondsPerStep]);

  // Play / Pause con sincronización estricta AudioContext + 30ms lead-in
  const handlePlayPause = useCallback(() => {
    const engine = getAudioEngine();
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
      // Lookahead lead-in de 30ms para que Web Audio tenga tiempo de programar
      const startTime = (ctx ? ctx.currentTime : 0) + 0.03;
      audioStartTimeRef.current = startTime;
      nextNoteTimeRef.current = startTime;
      schedulerStepRef.current = 0;
      anchorStepRef.current = 0;
      anchorAudioTimeRef.current = startTime;
      lastStickingByInstrumentRef.current = {};

      setActiveStep(0);
      setProgress(0);

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

    schedulerStepRef.current = 0;
    anchorStepRef.current = 0;
    anchorAudioTimeRef.current = 0;
    audioStartTimeRef.current = 0;
    lastStickingByInstrumentRef.current = {};
    setActiveStep(0);
    setProgress(0);
  }, []);

  // Metrónomo
  const handleToggleMetronome = useCallback(() => {
    const nextState = !metronomeEnabled;
    setMetronomeEnabled(nextState);
    getAudioEngine().setMetronomeEnabled(nextState);
  }, [metronomeEnabled]);

  // Control de Pantalla Completa
  const handleToggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      const elem = drumFullscreenRef.current;
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

  // Monitoreo de eventos de pantalla completa y redimensionado
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        setIsForceLandscapeCSS(window.innerHeight > window.innerWidth);
      }
    };

    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
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

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isFullscreen) {
          handleToggleFullscreen();
        } else {
          handleStop();
        }
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
  }, [handlePlayPause, handleStop, handleToggleMetronome, isFullscreen, handleToggleFullscreen]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Hits filtrados y normalizados para el compás activo (0 a stepsPerMeasure - 1)
  const activeMeasureHits = useMemo(() => {
    const start = activeMeasureIndex * stepsPerMeasure;
    const end = start + stepsPerMeasure;
    const hits = activeExercise.hitsData || (activeExercise as any).data || [];
    return hits
      .map((h: any) => ({
        step: h.step !== undefined ? h.step : h.stepIndex !== undefined ? h.stepIndex : 0,
        instrument: h.instrument || h.drumType || h.instrumentKey || 'snare',
        accent: !!h.accent,
        sticking: h.sticking || 'R',
        velocity: h.velocity ?? 0.8,
      }))
      .filter((h: any) => h.step >= start && h.step < end)
      .map((h: any) => ({
        ...h,
        step: h.step - start,
        stepIndex: h.step - start,
      }));
  }, [activeExercise, activeMeasureIndex, stepsPerMeasure]);

  return (
    <div
      ref={drumFullscreenRef}
      className={`transition-all duration-200 ${
        isFullscreen
          ? isForceLandscapeCSS
            ? 'fixed inset-0 z-[9999] bg-[#0c0e14] w-[100vh] h-[100vw] origin-top-left rotate-90 translate-x-[100vw] flex flex-col justify-between p-3 sm:p-4 overflow-hidden select-none'
            : 'fixed inset-0 z-[9999] bg-[#0c0e14] flex flex-col justify-between p-3 sm:p-4 w-screen h-screen overflow-hidden select-none'
          : 'relative w-full max-w-6xl mx-auto flex flex-col gap-4'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. MODO PANTALLA COMPLETA                                       */}
      {/* ============================================================== */}
      {isFullscreen ? (
        <>
          {/* Cabecera con Controles Flotantes Permanentes */}
          <header className="w-full h-12 px-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-cyan-400 truncate max-w-[200px] sm:max-w-md">
                {activeExercise.title}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Compás {activeMeasureIndex + 1} de {totalMeasures} • {subConfig.name} ({stepsPerMeasure} pasos)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>✕ Salir</span>
              </button>
            </div>
          </header>

          {/* Lienzo del Compás de Batería Fijo (Sin scroll, 100% visible) */}
          <main className="w-full flex-1 min-h-0 flex flex-col justify-center items-stretch bg-[#10131c] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl my-2 p-2 sm:p-4 relative">
            <div className="w-full h-full relative flex flex-col justify-center">
              <DrumScoreRenderer
                hits={activeMeasureHits}
                stepsPerMeasure={stepsPerMeasure}
                currentStepInMeasure={stepInMeasure}
                timeSignature={activeExercise.timeSignature}
                isPlaying={isPlaying}
              />
            </div>
          </main>

          {/* Barra Inferior Unificada (Play, Tempo, Metrónomo) */}
          <footer className="w-full h-14 px-4 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg select-none">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{isPlaying ? '⏸ Pausar' : '▶ Iniciar Práctica'}</span>
            </button>

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
              onClick={handleToggleMetronome}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                metronomeEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              🔔 Metrónomo {metronomeEnabled ? 'ON' : 'OFF'}
            </button>
          </footer>
        </>
      ) : (
        /* ============================================================== */
        /* 2. MODO NORMAL (ESTÁNDAR)                                       */
        /* ============================================================== */
        <>
          {/* Header Superior del Ejercicio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Link
                href="/drums"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Volver al catálogo"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
                    {activeExercise.category}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{activeExercise.timeSignature}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Compás {activeMeasureIndex + 1} de {totalMeasures} • {subConfig.name} ({stepsPerMeasure} pasos)
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeExercise.title}
                </h1>
              </div>
            </div>

            {/* Acciones y Dificultad */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Activar Pantalla Completa Apaisada"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pantalla Completa</span>
              </button>

              <span className="text-xs px-3 py-1 rounded-full font-semibold border bg-white/5 border-white/10 text-zinc-300">
                {activeExercise.difficulty}
              </span>
            </div>
          </div>

          {/* Pentagrama SVG de Batería con Paginación Fija (Zero-Jerk Flip) */}
          <div className="w-full relative overflow-hidden rounded-2xl glass-panel p-3 sm:p-5 border border-white/10 shadow-2xl">
            <DrumScoreRenderer
              hits={activeMeasureHits}
              stepsPerMeasure={stepsPerMeasure}
              currentStepInMeasure={stepInMeasure}
              timeSignature={activeExercise.timeSignature}
              isPlaying={isPlaying}
            />

            {/* Indicador de posición visual y estado del compás */}
            <div className="w-full mt-3 flex items-center justify-between px-2 text-xs text-zinc-500 font-mono border-t border-white/5 pt-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>RUNWAY SCANNER:</span>
                <span className="text-zinc-300 font-medium">
                  {isPlaying
                    ? `Paso ${stepInMeasure + 1} / ${stepsPerMeasure} (Compás ${activeMeasureIndex + 1}/${totalMeasures})`
                    : 'En pausa'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span>SUBDIVISIÓN: {subConfig.name}</span>
                <span className="text-zinc-400 font-semibold">{bpm} BPM</span>
              </div>
            </div>
          </div>

          {/* Barra de Transporte (Play, Stop, BPM, Metrónomo) */}
          <div className="w-full">
            <TransportBar
              isPlaying={isPlaying}
              bpm={bpm}
              metronomeEnabled={metronomeEnabled}
              onPlayPause={handlePlayPause}
              onStop={handleStop}
              onBpmChange={setBpm}
              onToggleMetronome={handleToggleMetronome}
              onResetBpm={() => setBpm(activeExercise.bpmDefault || 100)}
              defaultBpm={activeExercise.bpmDefault || 100}
            />
          </div>

          {/* Leyenda de Sticking y Notación Musical */}
          <div className="w-full">
            <StickingLegend />
          </div>

          {/* Atajos de Teclado y Descripción */}
          <div className="mt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 px-2">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
              <span>Atajos:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Espacio</kbd>
              <span>Play/Pausa</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Esc</kbd>
              <span>Stop/Salir</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">M</kbd>
              <span>Metrónomo</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">↑/↓</kbd>
              <span>BPM</span>
            </div>

            {activeExercise.description && (
              <p className="text-zinc-400 text-center sm:text-right italic max-w-md">
                "{activeExercise.description}"
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
