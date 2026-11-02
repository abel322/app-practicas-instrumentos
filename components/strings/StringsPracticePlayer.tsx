'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { StringExerciseData, StringTabNote } from '@/types/strings';
import { getStringsAudioEngine } from '@/lib/stringsAudioEngine';
import { TablatureRunway } from './TablatureRunway';
import { TransportBar } from '@/components/practice/TransportBar';
import { StringsLegend } from './StringsLegend';
import { ArrowLeft, Keyboard, Maximize2, Minimize2 } from 'lucide-react';

interface StringsPracticePlayerProps {
  exercise: StringExerciseData;
}

export const StringsPracticePlayer: React.FC<StringsPracticePlayerProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(exercise.bpmDefault);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Estado de Pantalla Completa y Orientación Horizontal Forzada (Aislamiento Total z-[9999])
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscapeCSS, setIsForceLandscapeCSS] = useState<boolean>(false);
  const tabScrollContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Funciones de Pantalla Completa y Bloqueo de Orientación Horizontal
  const enterFullscreenLandscape = useCallback(async () => {
    const elem = document.documentElement as any;

    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen no disponible o bloqueado:', err);
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
      console.warn('Orientación nativa bloqueada por el sistema:', err);
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    setIsForceLandscapeCSS(!orientationLocked && isPortrait);
    setIsFullscreen(true);
  }, []);

  const exitFullscreenLandscape = useCallback(async () => {
    try {
      const orientation =
        ((screen as any)?.orientation ||
          (screen as any)?.mozOrientation ||
          (screen as any)?.msOrientation) as any;
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
      }
    } catch (err) {}

    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (err) {}

    setIsForceLandscapeCSS(false);
    setIsFullscreen(false);
  }, []);

  // Monitoreo de eventos de pantalla y giros físicos
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        setIsForceLandscapeCSS(window.innerHeight > window.innerWidth);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        setIsFullscreen(false);
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

  // Auto-Centrado Suave del Escáner (Auto-Scroll) sincronizado con activeStep
  useEffect(() => {
    if (isPlaying && tabScrollContainerRef.current) {
      const container = tabScrollContainerRef.current;
      const activeElement = (container.querySelector(
        `[data-step="${activeStep}"]`
      ) ||
        container.querySelector(
          `[data-step-index="${activeStep}"]`
        )) as HTMLElement | null;

      if (activeElement) {
        const containerWidth = container.clientWidth;
        const targetScroll =
          activeElement.offsetLeft - containerWidth / 2 + activeElement.clientWidth / 2;

        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    } else if (!isPlaying && activeStep === 0 && tabScrollContainerRef.current) {
      tabScrollContainerRef.current.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
  }, [activeStep, isPlaying]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isFullscreen) {
          exitFullscreenLandscape();
        } else {
          handleStop();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMetronome();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setBpm((prev) => Math.min(200, prev + 5));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setBpm((prev) => Math.max(40, prev - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleStop, handleToggleMetronome, isFullscreen, exitFullscreenLandscape]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const stepsPerMeasure = exercise.timeSignature === '6/8' ? 12 : 16;
  const currentMeasureNumber = Math.floor(activeStep / stepsPerMeasure) + 1;
  const totalMeasures = Math.max(1, Math.ceil(exercise.totalSteps / stepsPerMeasure));

  return (
    <div
      className={`transition-colors duration-200 ${
        isFullscreen
          ? isForceLandscapeCSS
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] h-[100vw] rotate-90 z-[9999] bg-[#0c0e14] flex flex-col justify-between p-3 sm:p-5 overflow-hidden select-none'
            : 'fixed inset-0 z-[9999] bg-[#0c0e14] flex flex-col justify-between p-3 sm:p-5 w-screen h-screen overflow-hidden select-none'
          : 'relative w-full max-w-6xl mx-auto flex flex-col gap-6'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. CABECERA EN PANTALLA COMPLETA PURA (Z-[9999])               */}
      {/* ============================================================== */}
      {isFullscreen ? (
        <header className="w-full h-12 px-3 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-xl z-30">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-sm font-black text-cyan-400 truncate max-w-[140px] sm:max-w-xs">
              {exercise.title}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono shrink-0">
              {isBass ? 'Bajo' : 'Guitarra'} • {exercise.difficulty}
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold ml-1 shrink-0">
              Paso {activeStep + 1} / {exercise.totalSteps}
            </span>
            <span className="text-xs font-mono text-slate-400 shrink-0 hidden md:inline">
              (c.{currentMeasureNumber} de {totalMeasures})
            </span>
          </div>

          {/* Controles de Reproducción, Tempo, Metrónomo y Salida */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Play / Pausa */}
            <button
              type="button"
              onClick={handlePlayPause}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950 font-black animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{isPlaying ? '⏸ Pausar' : '▶ Iniciar'}</span>
            </button>

            {/* Slider de BPM */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-amber-400 font-bold min-w-[50px]">{bpm} BPM</span>
              <input
                type="range"
                min={40}
                max={200}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-16 sm:w-24 h-1 bg-slate-800 accent-amber-400 rounded cursor-pointer"
                title="Ajustar tempo"
              />
            </div>

            {/* Botón Metrónomo */}
            <button
              type="button"
              onClick={handleToggleMetronome}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 ${
                metronomeEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
              title="Alternar Metrónomo"
            >
              🔔 {metronomeEnabled ? 'ON' : 'OFF'}
            </button>

            {/* Botón Salir */}
            <button
              type="button"
              onClick={exitFullscreenLandscape}
              className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/70 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
              title="Salir de Pantalla Completa"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>✕ Salir</span>
            </button>
          </div>
        </header>
      ) : (
        /* Header en Modo Normal */
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
            <button
              type="button"
              onClick={enterFullscreenLandscape}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              title="Práctica en Pantalla Completa Horizontal"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px]">Pantalla Completa</span>
            </button>
            <span className="text-xs px-3 py-1 rounded-full font-semibold border bg-white/5 border-white/10 text-zinc-300">
              {exercise.difficulty}
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ÁREA CENTRAL DE TABLATURA CON COLUMNA STICKY DE AFINACIÓN   */}
      {/* ============================================================== */}
      <main className={`w-full flex items-center justify-center ${isFullscreen ? 'flex-1 min-h-0 py-2' : ''}`}>
        <TablatureRunway
          instrument={exercise.instrument}
          tuning={exercise.tuning}
          totalSteps={exercise.totalSteps}
          timeSignature={exercise.timeSignature}
          tabData={exercise.tabData}
          progress={progress}
          activeStep={activeStep}
          isPlaying={isPlaying}
          isFullscreen={isFullscreen}
          scrollContainerRef={tabScrollContainerRef}
        />
      </main>

      {/* ============================================================== */}
      {/* 3. BARRA INFERIOR DE ESTADO (EN FULLSCREEN)                    */}
      {/* ============================================================== */}
      {isFullscreen ? (
        <footer className="w-full h-6 px-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/90 border border-slate-900 rounded-xl shrink-0 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Auto-Scroll: Sincronizado
          </span>
          <span>Afinación: {exercise.tuning}</span>
          <span className="text-zinc-400 font-semibold">
            {isPlaying ? `${Math.round(progress * 100)}%` : '0%'}
          </span>
        </footer>
      ) : (
        /* Barra de Transporte en Modo Estándar */
        <>
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

          <div className="w-full">
            <StringsLegend />
          </div>

          <div className="mt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 px-2">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
              <span>Atajos:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Espacio</kbd>
              <span>Play/Pausa</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Esc</kbd>
              <span>Stop / Salir</span>
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
        </>
      )}
    </div>
  );
};
