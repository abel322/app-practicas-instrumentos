'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { DrumExerciseData, DrumHit } from '@/types/drum';
import { getAudioEngine } from '@/lib/drumAudioEngine';
import { DrumStaffScore, DrumMeasureRenderer } from './DrumStaffScore';
import { TransportBar } from './TransportBar';
import { StickingLegend } from './StickingLegend';
import { getSubdivisionConfig, normalizeSubdivisionKey } from '@/lib/music-theory/rhythmSubdivisions';
import { ArrowLeft, Drum, Sparkles, Keyboard, Maximize2, Minimize2 } from 'lucide-react';

interface PracticePlayerProps {
  exercise: DrumExerciseData;
}

export const PracticePlayer: React.FC<PracticePlayerProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(exercise.bpmDefault);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Pantalla Completa con Orientación Forzada Apaisada
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscapeCSS, setIsForceLandscapeCSS] = useState<boolean>(false);
  const drumFullscreenRef = useRef<HTMLDivElement | null>(null);

  // Referencias para el scheduler de Web Audio API (Chris Wilson lookahead pattern)
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
  const totalMeasures = (exercise as any).measures?.length || Math.max(1, Math.ceil(exercise.totalSteps / stepsPerMeasure));
  const activeMeasureIndex = Math.min(totalMeasures - 1, Math.floor(activeStep / stepsPerMeasure));
  const stepInMeasure = activeStep % stepsPerMeasure;
  const scannerPercent = ((stepInMeasure + 0.5) / stepsPerMeasure) * 100;
  const subdivisionLabel = subConfig.name;
  const subdivisionLabels = subConfig.stepLabels.slice(0, stepsPerMeasure);

  // Pulsos por compás y pasos por pulso según métrica
  const beatsPerMeasure =
    exercise.timeSignature === '6/8' ? 2 : exercise.timeSignature === '3/4' ? 3 : 4;
  const stepsPerBeat = Math.max(1, Math.round(stepsPerMeasure / beatsPerMeasure));

  // Duración de un paso según BPM, subdivisión y métrica
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

  const getMeasureDuration = useCallback(
    (currentBpm: number) => {
      return getSecondsPerStep(currentBpm) * stepsPerMeasure;
    },
    [getSecondsPerStep, stepsPerMeasure]
  );

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
  const scheduleNote = useCallback(
    (stepNumber: number, time: number) => {
      const engine = getAudioEngine();

      // 1. Disparar los instrumentos en este paso
      const hits = hitsByStep.current.get(stepNumber) || [];
      hits.forEach((hit) => {
        engine.trigger(hit.instrument, time, hit.velocity ?? 0.8, !!hit.accent);
      });

      // 2. Metrónomo sincronizado en los tiempos fuertes
      if (metronomeEnabled && stepNumber % stepsPerBeat === 0) {
        const isDownbeat = stepNumber % stepsPerMeasure === 0;
        engine.playMetronome(time, isDownbeat);
      }
    },
    [metronomeEnabled, stepsPerBeat, stepsPerMeasure]
  );

  // Bucle lookahead de Web Audio
  const scheduler = useCallback(() => {
    const engine = getAudioEngine();
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

  // Bucle de animación visual a 60/120 FPS
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
      setActiveStep(currentStepRef.current % exercise.totalSteps);
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [exercise.totalSteps, getMeasureDuration]);

  // Play / Pause
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

  // Metrónomo
  const handleToggleMetronome = useCallback(() => {
    const nextState = !metronomeEnabled;
    setMetronomeEnabled(nextState);
    getAudioEngine().setMetronomeEnabled(nextState);
  }, [metronomeEnabled]);

  // Control Unificado de Pantalla Completa
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

  // Atajos de teclado para bateristas
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
      {/* 1. MODO PANTALLA COMPLETA: CABECERA, LIENZO FIJO Y FOOTER       */}
      {/* ============================================================== */}
      {isFullscreen ? (
        <>
          {/* Cabecera con Controles Flotantes Permanentes */}
          <header className="w-full h-12 px-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-cyan-400 truncate max-w-[200px] sm:max-w-md">
                {exercise.title}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Compás {activeMeasureIndex + 1} de {totalMeasures} • {subdivisionLabel}
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
              {/* Pentagrama Formal y Sticking del Compás Activo */}
              <div className="w-full flex-1 min-h-0 flex items-center justify-center relative">
                <DrumMeasureRenderer
                  timeSignature={exercise.timeSignature}
                  totalSteps={exercise.totalSteps}
                  hitsData={exercise.hitsData}
                  progress={progress}
                  activeStep={activeStep}
                  isPlaying={isPlaying}
                  activeMeasureIndex={activeMeasureIndex}
                  totalMeasures={totalMeasures}
                  stepsPerMeasure={stepsPerMeasure}
                  subdivision={subdivisionKey}
                  isFullscreen={true}
                />
              </div>
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
        /* 2. MODO NORMAL (ESTÁNDAR): VISTA COMPLETA CON BOTÓN FULLSCREEN  */
        /* ============================================================== */
        <>
          {/* Header Superior del Ejercicio */}
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
                  <span className="text-[11px] text-zinc-400 font-mono">{exercise.timeSignature}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Compás {activeMeasureIndex + 1} de {totalMeasures} ({subdivisionLabel})
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {exercise.title}
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
                {exercise.difficulty}
              </span>
            </div>
          </div>

          {/* Pentagrama Formal y Runway Cursor con Paginación Fija (Zero-Jerk Flip) */}
          <div className="w-full">
            <DrumStaffScore
              timeSignature={exercise.timeSignature}
              totalSteps={exercise.totalSteps}
              hitsData={exercise.hitsData}
              progress={progress}
              activeStep={activeStep}
              isPlaying={isPlaying}
              activeMeasureIndex={activeMeasureIndex}
              totalMeasures={totalMeasures}
              stepsPerMeasure={stepsPerMeasure}
              subdivision={subdivisionKey}
              isFullscreen={false}
            />
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
              onResetBpm={() => setBpm(exercise.bpmDefault)}
              defaultBpm={exercise.bpmDefault}
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
