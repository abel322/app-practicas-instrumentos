'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { StringExerciseData, StringTabNote } from '@/types/strings';
import { getStringsAudioEngine } from '@/lib/stringsAudioEngine';
import { bassPreviewSynth, getBassMidiFromString, BassTechnique } from '@/lib/audio/bassPreviewSynth';
import { guitarPreviewSynth, getGuitarMidiFromString, GuitarTechnique } from '@/lib/audio/guitarPreviewSynth';
import { getSubdivisionConfig } from '@/lib/music-theory/rhythmSubdivisions';
import { TablatureRunway } from './TablatureRunway';
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

  // Pantalla Completa con Contenedor Maestro Integral (Aislamiento z-[9999])
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscapeCSS, setIsForceLandscapeCSS] = useState<boolean>(false);
  const fullscreenWrapperRef = useRef<HTMLDivElement | null>(null);

  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(exercise.bpmDefault);
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const anchorStepRef = useRef<number>(0);
  const anchorAudioTimeRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const isBass = exercise.instrument === 'bass_4';

  useEffect(() => {
    guitarPreviewSynth.preloadSamples();
    if (isBass) {
      bassPreviewSynth.initContext();
      bassPreviewSynth.preloadSamples?.();
    } else {
      guitarPreviewSynth.init();
    }
  }, [isBass]);

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

  const subConfig = getSubdivisionConfig(subdivisionKey, exercise.timeSignature, exercise.stepsPerMeasure);
  const stepsPerMeasure = subConfig.stepsPerMeasure;
  const totalMeasures = Math.max(1, Math.ceil(exercise.totalSteps / stepsPerMeasure));
  const activeMeasureIndex = Math.min(
    totalMeasures - 1,
    Math.floor(activeStep / stepsPerMeasure)
  );
  const stepInCurrentMeasure = activeStep % stepsPerMeasure;

  // Pulsos por compás y pasos por pulso
  const beatsPerMeasure =
    exercise.timeSignature === '6/8' ? 2 : exercise.timeSignature === '3/4' ? 3 : 4;
  const stepsPerBeat = Math.max(1, Math.round(stepsPerMeasure / beatsPerMeasure));

  // Duración de un paso según subdivisión y métrica
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
      return getSecondsPerStep(currentBpm) * exercise.totalSteps;
    },
    [exercise.totalSteps, getSecondsPerStep]
  );

  // Sincronizar BPM en vivo y ajustar la siguiente nota si se acelera para respuesta inmediata
  useEffect(() => {
    const prevBpm = bpmRef.current;
    bpmRef.current = bpm;

    if (isPlaying && bpm > prevBpm) {
      const engine = getStringsAudioEngine();
      const ctx = engine.getAudioContext();
      if (ctx) {
        const newSecondsPerStep = getSecondsPerStep(bpm);
        if (nextNoteTimeRef.current > ctx.currentTime + newSecondsPerStep) {
          nextNoteTimeRef.current = ctx.currentTime + newSecondsPerStep;
        }
      }
    }
  }, [bpm, isPlaying, getSecondsPerStep]);

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

  // Planificador (Scheduler) de notas de cuerdas con agendado exacto en Web Audio API
  const scheduleNote = useCallback(
    (stepNumber: number, time: number) => {
      const engine = getStringsAudioEngine();

      // 1. Disparar notas en este paso
      const notes = notesByStep.current.get(stepNumber) || [];
      notes.forEach((note) => {
        if (exercise.instrument === 'bass_4') {
          const calculatedMidi = getBassMidiFromString(note.string, note.fret || 0);
          const resolvedStringIndex = Math.max(0, (note.string || 4) - 1); // 0 = G, 1 = D, 2 = A, 3 = E
          const tech = ((note.technique || 'normal').toLowerCase()) as BassTechnique;
          const vel =
            tech === 'pop' || tech === 'slap'
              ? 120
              : Math.round((note.velocity ?? 0.85) * 120);
          const dur = getSecondsPerStep(bpmRef.current) * 3.8;

          bassPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: tech,
            slideDirection: note.slideDirection,
            stringIndex: resolvedStringIndex,
            duration: dur,
            velocity: vel,
            scheduleTime: time,
          });
        } else if (exercise.instrument === 'guitar_6') {
          const calculatedMidi = getGuitarMidiFromString(note.string, note.fret || 0);
          const rawTech = (note.technique || 'normal').toLowerCase();
          const tech = (rawTech === 'pull' ? 'pulloff' : rawTech) as GuitarTechnique;
          const vel =
            tech === 'natural_harmonic' || tech === 'pinch_harmonic'
              ? 115
              : Math.round((note.velocity ?? 0.85) * 115);
          const dur = getSecondsPerStep(bpmRef.current) * 3.5;

          guitarPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: tech,
            slideDirection: note.slideDirection,
            bendType: note.bendType,
            bendAmount: note.bendAmount,
            duration: dur,
            velocity: vel,
            time,
            scheduleTime: time,
          });
        } else {
          engine.triggerNote(
            exercise.instrument,
            note.string,
            note.fret,
            time,
            note.technique || 'normal',
            note.velocity ?? 0.8
          );
        }
      });

      // 2. Metrónomo en tiempos fuertes según subdivisión
      if (stepNumber % stepsPerBeat === 0) {
        const isDownbeat = stepNumber % stepsPerMeasure === 0;
        engine.playMetronome(time, isDownbeat);
      }
    },
    [exercise.instrument, getSecondsPerStep, stepsPerBeat, stepsPerMeasure]
  );

  // Lookahead loop con ventana de agendado de 80ms y anclaje continuo de fase
  const scheduler = useCallback(() => {
    const engine = getStringsAudioEngine();
    const ctx = engine.getAudioContext();
    if (!ctx) return;

    const scheduleAheadTime = 0.08;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const stepToSchedule = currentStepRef.current;
      const hitTime = nextNoteTimeRef.current;

      anchorStepRef.current = stepToSchedule;
      anchorAudioTimeRef.current = hitTime;

      scheduleNote(stepToSchedule, hitTime);

      const stepDuration = getSecondsPerStep(bpmRef.current);
      nextNoteTimeRef.current += stepDuration;

      currentStepRef.current = (currentStepRef.current + 1) % exercise.totalSteps;
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(scheduler, 20);
    }
  }, [exercise.totalSteps, getSecondsPerStep, scheduleNote]);

  // Animación del Runway Cursor anclada al último pulso de audio (sin desfase al mover BPM)
  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;

    const engine = getStringsAudioEngine();
    const ctx = engine.getAudioContext();

    if (ctx && anchorAudioTimeRef.current > 0) {
      const stepDuration = getSecondsPerStep(bpmRef.current);
      const deltaFromAnchor = ctx.currentTime - anchorAudioTimeRef.current;
      const exactStep = anchorStepRef.current + deltaFromAnchor / stepDuration;
      const totalSteps = exercise.totalSteps;

      const normalizedStep =
        ((Math.floor(exactStep) % totalSteps) + totalSteps) % totalSteps;

      const continuousProgress = Math.max(0, Math.min(1, exactStep / totalSteps));

      setProgress(continuousProgress);
      setActiveStep(normalizedStep);
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [exercise.totalSteps, getSecondsPerStep]);

  // Play / Pausa
  const handlePlayPause = useCallback(() => {
    const engine = getStringsAudioEngine();
    engine.init();
    engine.resume();
    if (isBass) {
      bassPreviewSynth.getAudioContext();
    } else {
      guitarPreviewSynth.getContext();
    }

    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      const ctx = engine.getAudioContext();
      const startTime = (ctx ? ctx.currentTime : 0) + 0.03;
      nextNoteTimeRef.current = startTime;
      currentStepRef.current = 0;
      anchorStepRef.current = 0;
      anchorAudioTimeRef.current = startTime;

      scheduler();
      rafIdRef.current = requestAnimationFrame(updateVisualProgress);
    }
  }, [isPlaying, isBass, scheduler, updateVisualProgress]);

  // Stop
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    currentStepRef.current = 0;
    anchorStepRef.current = 0;
    anchorAudioTimeRef.current = 0;
    setActiveStep(0);
    setProgress(0);
  }, []);

  // Metrónomo
  const handleToggleMetronome = useCallback(() => {
    const nextState = !metronomeEnabled;
    setMetronomeEnabled(nextState);
    getStringsAudioEngine().setMetronomeEnabled(nextState);
  }, [metronomeEnabled]);

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
          console.warn('Fullscreen bloqueado o no disponible en este dispositivo:', err);
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

  // Monitoreo de eventos de pantalla y giros físicos
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

  // ==============================================================
  // ZERO-JERK MEASURE FLIP (PAGINACIÓN FIJA SIN SCROLL)
  // El contenedor permanece completamente inmóvil en pantalla.
  // No se realizan llamadas a scrollTo, scrollIntoView ni scrollLeft.
  // La tablatura conmuta instantáneamente al compás activo.
  // ==============================================================

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
          handleToggleFullscreen();
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
      ref={fullscreenWrapperRef}
      className={`transition-all duration-200 ${
        isFullscreen
          ? isForceLandscapeCSS
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] h-[100vw] rotate-90 z-[9999] bg-[#0b0d13] flex flex-col justify-between p-3 sm:p-4 overflow-hidden select-none shadow-2xl'
            : 'fixed inset-0 z-[9999] bg-[#0b0d13] flex flex-col justify-between p-3 sm:p-4 w-screen h-screen overflow-hidden select-none shadow-2xl'
          : 'relative w-full max-w-6xl mx-auto flex flex-col gap-3'
      }`}
    >
      {/* ============================================================== */}
      {/* CABECERA SUPERIOR: VISIBLE EN TODO MOMENTO (NORMAL Y FULLSCREEN) */}
      {/* ============================================================== */}
      <header className="w-full h-12 px-3 sm:px-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {!isFullscreen && (
            <Link
              href="/strings"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors mr-1 shrink-0"
              title="Volver al catálogo de cuerdas"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <span className="text-xs sm:text-sm font-black text-cyan-400 truncate max-w-[150px] sm:max-w-xs">
            {exercise.title}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono shrink-0">
            Compás {activeMeasureIndex + 1} de {totalMeasures} • {activeStep + 1}/{exercise.totalSteps}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 font-mono font-bold shrink-0">
            {subConfig.id} ({subConfig.name})
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-mono hidden md:inline shrink-0">
            {isBass ? 'Bajo (4C)' : 'Guitarra (6C)'} • {exercise.difficulty}
          </span>
        </div>

        {/* Botón de alternancia de Pantalla Completa */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
              isFullscreen
                ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/70'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
                <span>✕ Salir</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>⛶ Pantalla Completa</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* ÁREA CENTRAL DE TABLATURA ESTÁTICA (ZERO-JERK PAGE FLIP)       */}
      {/* ============================================================== */}
      <main className="w-full flex-1 min-h-0 flex items-stretch bg-[#10131c] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl my-1">
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
          activeMeasureIndex={activeMeasureIndex}
          stepInCurrentMeasure={stepInCurrentMeasure}
          totalMeasures={totalMeasures}
          stepsPerMeasure={stepsPerMeasure}
          subdivision={subConfig.id}
        />
      </main>

      {/* ============================================================== */}
      {/* BARRA INFERIOR DE REPRODUCCIÓN: SIEMPRE VISIBLE Y OPERATIVA    */}
      {/* ============================================================== */}
      <footer className="w-full h-14 px-3 sm:px-4 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 sm:gap-3 shrink-0 shadow-lg z-20">
        {/* Play / Pausa */}
        <button
          type="button"
          onClick={handlePlayPause}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all shadow-md active:scale-95 shrink-0 ${
            isPlaying
              ? 'bg-amber-400 text-slate-950 animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.6)]'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <span>{isPlaying ? '⏸ Pausar' : '▶ Iniciar Práctica'}</span>
        </button>

        {/* BPM Slider */}
        <div className="flex items-center gap-2 bg-slate-950 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-amber-400 font-black min-w-[55px] text-center">{bpm} BPM</span>
          <input
            type="range"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-16 sm:w-28 md:w-36 h-1.5 bg-slate-800 accent-amber-400 rounded cursor-pointer"
            title="Ajustar Tempo (BPM)"
          />
        </div>

        {/* Metrónomo */}
        <button
          type="button"
          onClick={handleToggleMetronome}
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 shrink-0 ${
            metronomeEnabled
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
          title="Alternar Metrónomo"
        >
          🔔 <span className="hidden sm:inline">Metrónomo </span>{metronomeEnabled ? 'ON' : 'OFF'}
        </button>
      </footer>

      {/* En modo normal: Leyenda y Atajos debajo del reproductor */}
      {!isFullscreen && (
        <>
          <div className="w-full mt-1">
            <StringsLegend />
          </div>

          <div className="mt-1 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 px-2">
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
