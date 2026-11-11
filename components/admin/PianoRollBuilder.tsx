'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useWebMidi } from '@/lib/midi/useWebMidi';
import { getPianoAudioEngine } from '@/lib/audio/pianoAudioEngine';
import { pianoPreviewSynth } from '@/lib/audio/pianoPreviewSynth';
import { PianoGrandStaffView, NoteDuration } from './PianoGrandStaffView';
import { Radio, Music2, ChevronLeft, ChevronRight, Zap, Square } from 'lucide-react';

export interface PianoNoteStep {
  step?: number;
  stepIndex?: number;
  midiNumber?: number;
  velocity?: number;
  durationSteps?: number;
  duration?: NoteDuration;
  isRest?: boolean;
}

/**
 * Retorna la cantidad de pasos rítmicos que componen un pulso según la subdivisión.
 */
export function getStepsPerBeat(
  subdivision: string,
  timeSignature: string = '4/4',
  totalSteps: number = 16
): number {
  if (subdivision === '1/4') return 1;
  if (subdivision === '1/8') {
    if (timeSignature === '6/8') return 3; // En 6/8, el pulso es negra con puntillo (3 corcheas)
    return 2;
  }
  if (subdivision === '1/8T') return 3;
  if (subdivision === '1/16') return 4;
  if (subdivision === 'quintillo') return 5;
  if (subdivision === '1/16T') return 6;
  if (subdivision === 'septillo') return 7;
  if (subdivision === '1/32') return 8;

  const beats = parseInt(timeSignature.split('/')[0], 10) || 4;
  return Math.max(1, Math.round(totalSteps / beats));
}

/**
 * Función auxiliar de etiquetado rítmico dinámico para las cabeceras de columnas
 * del Piano Roll y secuenciadores basada en la métrica (Time Signature) y la subdivisión activa.
 */
export function getStepLabel(
  stepIndex: number,
  subdivision: string,
  beatsPerBar: number = 4
): string {
  // Manejo especial para métricas compuestas con subdivisión en corcheas
  if (beatsPerBar === 6 && subdivision === '1/8') {
    return (stepIndex + 1).toString();
  }
  if (beatsPerBar === 7 && subdivision === '1/8') {
    return (stepIndex + 1).toString();
  }

  // 1/16 (Semicorcheas): 4 pasos por pulso (1, e, &, a)
  if (subdivision === '1/16') {
    const beatNumber = Math.floor(stepIndex / 4) + 1;
    const sub = stepIndex % 4;
    const subLabels = [beatNumber.toString(), 'e', '&', 'a'];
    return subLabels[sub];
  }

  // 1/8 (Corcheas): 2 pasos por pulso (1, y)
  if (subdivision === '1/8') {
    const beatNumber = Math.floor(stepIndex / 2) + 1;
    const sub = stepIndex % 2;
    return sub === 0 ? beatNumber.toString() : 'y';
  }

  // 1/8T (Tresillos de corchea): 3 pasos por pulso (1, ti, ta)
  if (subdivision === '1/8T') {
    const beatNumber = Math.floor(stepIndex / 3) + 1;
    const sub = stepIndex % 3;
    const subLabels = [beatNumber.toString(), 'ti', 'ta'];
    return subLabels[sub];
  }

  // 1/4 (Negras): 1 paso por pulso (1, 2, 3, 4)
  if (subdivision === '1/4') {
    return (stepIndex + 1).toString();
  }

  // 1/16T (Tresillos de semicorchea): 6 pasos por pulso (1, t, e, &, t, a)
  if (subdivision === '1/16T') {
    const beatNumber = Math.floor(stepIndex / 6) + 1;
    const sub = stepIndex % 6;
    const subLabels = [beatNumber.toString(), 't', 'e', '&', 't', 'a'];
    return subLabels[sub];
  }

  // Quintillos: 5 pasos por pulso
  if (subdivision === 'quintillo') {
    const beatNumber = Math.floor(stepIndex / 5) + 1;
    const sub = stepIndex % 5;
    return sub === 0 ? beatNumber.toString() : (sub + 1).toString();
  }

  // Septillos: 7 pasos por pulso
  if (subdivision === 'septillo') {
    const beatNumber = Math.floor(stepIndex / 7) + 1;
    const sub = stepIndex % 7;
    return sub === 0 ? beatNumber.toString() : (sub + 1).toString();
  }

  // 1/32 (Fusas): 8 pasos por pulso
  if (subdivision === '1/32') {
    const beatNumber = Math.floor(stepIndex / 8) + 1;
    const sub = stepIndex % 8;
    if (sub === 0) return beatNumber.toString();
    if (sub === 4) return '&';
    if (sub === 2) return 'e';
    if (sub === 6) return 'a';
    return '·';
  }

  return (stepIndex + 1).toString();
}

/**
 * Determina si el paso corresponde al inicio de un pulso/tiempo (Downbeat).
 */
export function isStepMainBeat(
  stepIndex: number,
  subdivision: string,
  timeSignature: string = '4/4',
  totalSteps: number = 16
): boolean {
  if (timeSignature === '6/8' && subdivision === '1/8') {
    return stepIndex % 3 === 0;
  }
  const stepsPerBeat = getStepsPerBeat(subdivision, timeSignature, totalSteps);
  return stepIndex % stepsPerBeat === 0;
}

/**
 * Determina si el paso es el último de un pulso/tiempo (para ubicar la línea divisoria vertical).
 */
export function isStepBeatEnd(
  stepIndex: number,
  subdivision: string,
  timeSignature: string = '4/4',
  totalSteps: number = 16
): boolean {
  if (timeSignature === '6/8' && subdivision === '1/8') {
    return (stepIndex + 1) % 3 === 0;
  }
  const stepsPerBeat = getStepsPerBeat(subdivision, timeSignature, totalSteps);
  return (stepIndex + 1) % stepsPerBeat === 0;
}

export interface PianoRollBuilderProps {
  currentMeasure?: number;
  totalSteps: number; // Pasos en este compás (ej: 4, 8, 12, 16, 20, 24, 28, 32)
  activeSubdivision?: string;
  notes: PianoNoteStep[];
  onToggleNote?: (
    stepInMeasure: number,
    midiNumber: number,
    velocity?: number,
    duration?: NoteDuration
  ) => void;
  onToggleSingleNote?: (
    stepInMeasure: number,
    midiNumber: number,
    velocity?: number,
    duration?: NoteDuration
  ) => void;
  onAddNote?: (
    stepInMeasure: number,
    midiNumber: number,
    velocity?: number,
    duration?: NoteDuration
  ) => void;
  onToggleRest?: (stepInMeasure: number, duration: NoteDuration) => void;
  onAddChordToStep?: (stepInMeasure: number, midiNumbers: number[], velocity?: number) => void;
  isPlaying?: boolean;
  playbackActiveStep?: number;
  measureStartStep?: number;
  timeSignature?: string;
  editorViewMode?: 'pianoroll' | 'sheet';
  onViewModeChange?: (mode: 'pianoroll' | 'sheet') => void;
  tempo?: number;
  onTogglePlay?: () => void;
  onStartPlayback?: () => void;
  onStopPlayback?: () => void;
}

// Rango de concierto completo: C1 (24) a C8 (108) -> 85 teclas ordenadas de agudo a grave
const PIANO_KEYS = Array.from({ length: 85 }, (_, i) => 108 - i);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function PianoRollBuilder({
  currentMeasure = 0,
  totalSteps,
  activeSubdivision = '1/16',
  notes,
  onToggleNote,
  onToggleSingleNote,
  onAddNote,
  onToggleRest,
  onAddChordToStep,
  isPlaying = false,
  playbackActiveStep = 0,
  measureStartStep = 0,
  timeSignature = '4/4',
  editorViewMode: controlledViewMode,
  onViewModeChange,
  tempo = 120,
  onTogglePlay,
  onStartPlayback,
  onStopPlayback,
}: PianoRollBuilderProps) {
  const [internalViewMode, setInternalViewMode] = useState<'pianoroll' | 'sheet'>('pianoroll');
  const editorViewMode = controlledViewMode ?? internalViewMode;
  const setEditorViewMode = (mode: 'pianoroll' | 'sheet') => {
    setInternalViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  const [activeStepInput, setActiveStepInput] = useState<number>(0);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [countInBeat, setCountInBeat] = useState<number | null>(null); // 4, 3, 2, 1 o null

  const recordStartTimeRef = useRef<number>(0);
  const countIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const advanceDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Referencia viva para las notas del compás activo en tiempo de ejecución
  const activeNotesRef = useRef<PianoNoteStep[]>(notes);
  useEffect(() => {
    activeNotesRef.current = notes;
  }, [notes]);

  // Referencias actualizadas para evitar re-suscripciones innecesarias en el stream MIDI
  const activeStepInputRef = useRef(activeStepInput);
  activeStepInputRef.current = activeStepInput;

  const autoAdvanceRef = useRef(autoAdvance);
  autoAdvanceRef.current = autoAdvance;

  const totalStepsRef = useRef(totalSteps);
  totalStepsRef.current = totalSteps;

  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;

  const countInBeatRef = useRef(countInBeat);
  countInBeatRef.current = countInBeat;

  const tempoRef = useRef(tempo);
  tempoRef.current = tempo;

  const timeSignatureRef = useRef(timeSignature);
  timeSignatureRef.current = timeSignature;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const onAddNoteRef = useRef(onAddNote);
  onAddNoteRef.current = onAddNote;

  const onToggleNoteRef = useRef(onToggleSingleNote || onToggleNote);
  onToggleNoteRef.current = onToggleSingleNote || onToggleNote;

  // Si playback se detiene de forma externa, apagar grabación si estaba activa
  useEffect(() => {
    if (!isPlaying && isRecording && countInBeat === null) {
      setIsRecording(false);
    }
  }, [isPlaying, isRecording, countInBeat]);

  // Limpieza de intervalos y temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (countIntervalRef.current) {
        clearInterval(countIntervalRef.current);
      }
      if (advanceDebounceRef.current) {
        clearTimeout(advanceDebounceRef.current);
      }
    };
  }, []);

  // Función para agregar nota asegurando que no se duplique
  const addNoteToMeasure = useCallback(
    (
      stepInMeasure: number,
      midiNumber: number,
      duration: NoteDuration = 'quarter',
      velocity: number = 100
    ) => {
      if (onAddNoteRef.current) {
        onAddNoteRef.current(stepInMeasure, midiNumber, velocity, duration);
        return;
      }

      const globalStep = measureStartStep + stepInMeasure;
      const alreadyExists = (activeNotesRef.current || []).some((n: any) => {
        const stepNum = n.step !== undefined ? n.step : n.stepIndex;
        return stepNum === globalStep && n.midiNumber === midiNumber && !n.isRest;
      });

      if (!alreadyExists && onToggleNoteRef.current) {
        onToggleNoteRef.current(stepInMeasure, midiNumber, velocity, duration);
      }
    },
    [measureStartStep]
  );

  // Manejador centralizado de pulsaciones de notas MIDI
  const handleIncomingMidiNote = useCallback(
    (midiNumber: number, velocity: number) => {
      // Pre-escucha inmediata con el piano acústico
      pianoPreviewSynth.playNote(midiNumber, 0.8, velocity);

      // MODO 1: GRABACIÓN EN TIEMPO REAL (Durante 'isRecording' y tras la cuenta regresiva)
      if (isRecordingRef.current && countInBeatRef.current === null) {
        const elapsedSeconds = (performance.now() - recordStartTimeRef.current) / 1000;
        const beats = parseInt(timeSignatureRef.current.split('/')[0], 10) || 4;
        const secondsPerMeasure = (60 / Math.max(20, tempoRef.current)) * beats;
        const measureProgress = (elapsedSeconds % secondsPerMeasure) / secondsPerMeasure;
        const targetStep = Math.round(measureProgress * totalStepsRef.current) % totalStepsRef.current;

        addNoteToMeasure(targetStep, midiNumber, 'quarter', velocity);
        return;
      }

      // MODO 2: STEP RECORDING (Con el cursor de edición activo)
      const stepToInsert = activeStepInputRef.current;
      addNoteToMeasure(stepToInsert, midiNumber, 'quarter', velocity);

      // Si Auto-Avance está encendido, avanzar al siguiente paso con un debounce de 70ms para capturar acordes
      if (autoAdvanceRef.current) {
        if (advanceDebounceRef.current) {
          clearTimeout(advanceDebounceRef.current);
        }
        advanceDebounceRef.current = setTimeout(() => {
          setActiveStepInput((prev) => (prev + 1) % totalStepsRef.current);
          advanceDebounceRef.current = null;
        }, 70);
      }
    },
    [addNoteToMeasure]
  );

  // Hook Web MIDI API con Auto-Detección y Reconexión reactiva
  const { midiState, requestMidiAgain, activeNotes: pressedMidiKeys } = useWebMidi(
    handleIncomingMidiNote
  );

  // Función para Iniciar Grabación en Tiempo Real con Cuenta Regresiva
  const handleStartRealtimeRecord = useCallback(() => {
    if (isRecording) {
      // Detener grabación
      setIsRecording(false);
      setCountInBeat(null);
      if (countIntervalRef.current) {
        clearInterval(countIntervalRef.current);
        countIntervalRef.current = null;
      }
      if (isPlayingRef.current) {
        if (onStopPlayback) onStopPlayback();
        else if (onTogglePlay) onTogglePlay();
      }
      return;
    }

    setIsRecording(true);
    let currentCount = 4;
    setCountInBeat(currentCount);

    // Disparar beep/claqueta de metrónomo para la cuenta 4
    try {
      getPianoAudioEngine().playMetronome(0, true);
    } catch (e) {
      console.warn('Error al sonar metrónomo:', e);
    }

    const beatIntervalMs = (60 / Math.max(20, tempoRef.current)) * 1000;
    countIntervalRef.current = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountInBeat(currentCount);
        try {
          getPianoAudioEngine().playMetronome(0, false);
        } catch (e) {
          console.warn('Error al sonar metrónomo:', e);
        }
      } else {
        if (countIntervalRef.current) {
          clearInterval(countIntervalRef.current);
          countIntervalRef.current = null;
        }
        setCountInBeat(null);
        // Iniciar el reloj de tiempo real y claqueta en tiempo 1
        recordStartTimeRef.current = performance.now();
        try {
          getPianoAudioEngine().playMetronome(0, true);
        } catch (e) {
          console.warn('Error al sonar metrónomo:', e);
        }

        // Arrancar reproducción/grabación del compás
        if (onStartPlayback) {
          onStartPlayback();
        } else if (onTogglePlay && !isPlayingRef.current) {
          onTogglePlay();
        }
      }
    }, beatIntervalMs);
  }, [isRecording, onStopPlayback, onTogglePlay, onStartPlayback]);

  const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

  // Si cambia la cantidad de pasos, asegurarse que activeStepInput sea válido
  useEffect(() => {
    if (activeStepInput >= totalSteps) {
      setActiveStepInput(0);
    }
  }, [totalSteps, activeStepInput]);

  const timeSignatureNumerator = useMemo(() => {
    return parseInt(timeSignature.split('/')[0], 10) || 4;
  }, [timeSignature]);

  const playbackStepInMeasure = isPlaying ? playbackActiveStep - measureStartStep : -1;

  // Total de notas en el compás actual
  const currentMeasureNotesCount = useMemo(() => {
    return notes.filter((n: any) => {
      const stepNum = n.step !== undefined ? n.step : n.stepIndex;
      return (
        stepNum >= measureStartStep &&
        stepNum < measureStartStep + totalSteps &&
        n.midiNumber !== undefined
      );
    }).length;
  }, [notes, measureStartStep, totalSteps]);

  const toggleHandler = onToggleSingleNote || onToggleNote;

  return (
    <div className="w-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none relative">
      {/* Overlay de Cuenta Regresiva en Tiempo Real */}
      {countInBeat !== null && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm pointer-events-none transition-all">
          <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-slate-900 border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] scale-110 animate-pulse">
            <span className="text-7xl font-black text-amber-400 font-mono tracking-tighter drop-shadow-md">
              {countInBeat}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs uppercase font-black tracking-widest text-slate-200">
                ¡Prepárate para tocar!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Barra Superior de Vista, Estado MIDI y Asistente de Grabación Dual */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Conmutador de Modo de Visualización: Piano Roll vs Gran Pentagrama (Sol / Fa) */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setEditorViewMode('pianoroll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                editorViewMode === 'pianoroll'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎹 Piano Roll</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorViewMode('sheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                editorViewMode === 'sheet'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎼 Gran Pentagrama (Sol / Fa)</span>
            </button>
          </div>

          {/* Indicador de Conexión MIDI USB Dinámico */}
          <div className="flex items-center gap-2">
            {midiState.isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <span className="truncate max-w-[190px] sm:max-w-[240px]">
                  🟢 MIDI: {midiState.deviceName}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={requestMidiAgain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Haz clic para solicitar acceso Web MIDI y detectar teclados USB"
              >
                <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate max-w-[210px] sm:max-w-[280px]">
                  (•) MIDI no detectado (Conectar teclado)
                </span>
              </button>
            )}
          </div>

          {/* Botón de Grabación Dual: Real-Time REC y Step Recording */}
          {isRecording ? (
            countInBeat !== null ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg animate-pulse">
                <span className="w-2 h-2 rounded-full bg-slate-950" />
                <span>Cuenta: {countInBeat}...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartRealtimeRecord}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-950/60 ring-2 ring-red-400 animate-pulse transition-all active:scale-95"
                title="Detener grabación en tiempo real"
              >
                <Square className="w-3.5 h-3.5 fill-white text-white" />
                <span>Grabando (Detener)</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleStartRealtimeRecord}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-950/40 transition-all active:scale-95 border border-rose-500/50"
              title="Iniciar grabación en tiempo real con cuenta regresiva de 4 pulsos"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span>🔴 Grabar (REC)</span>
            </button>
          )}

          {/* Interruptor Auto-Avance Inteligente */}
          <button
            type="button"
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs border ${
              autoAdvance
                ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Al estar activo (ON), tocar un acorde o nota en el teclado MIDI avanzará automáticamente al siguiente paso al soltar las teclas"
          >
            <Zap
              className={`w-3.5 h-3.5 ${
                autoAdvance ? 'fill-slate-950 text-slate-950' : 'text-slate-400'
              }`}
            />
            <span>Auto-Avance {autoAdvance ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Navegación manual de Pasos */}
        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            onClick={() => setActiveStepInput((prev) => Math.max(0, prev - 1))}
            disabled={activeStepInput === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors border border-slate-700"
            title="Paso Anterior (⌫)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-sans font-medium text-[11px]">Anterior</span>
          </button>

          {/* Badge del Paso Activo de Grabación */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-900/50 text-cyan-300 font-mono text-xs">
            <span className="text-slate-400 font-sans text-[11px]">Paso:</span>
            <strong className="text-cyan-400 font-black">
              #{activeStepInput + 1}{' '}
              <span className="text-amber-400">
                ({getStepLabel(activeStepInput, activeSubdivision, timeSignatureNumerator)})
              </span>
            </strong>
            <span className="text-[10px] text-slate-500">/ {totalSteps}</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveStepInput((prev) => Math.min(totalSteps - 1, prev + 1))}
            disabled={activeStepInput >= totalSteps - 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors border border-slate-700"
            title="Paso Siguiente (⏭)"
          >
            <span className="hidden sm:inline font-sans font-medium text-[11px]">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-400 ml-2">
            <span>Compás {currentMeasure + 1}</span>
            <span className="text-amber-400 font-bold">({currentMeasureNotesCount} notas)</span>
          </span>
        </div>
      </div>

      {/* 2. Renderizado Condicional: Piano Roll vs Gran Pentagrama (Clave de Sol y Fa) */}
      {editorViewMode === 'sheet' ? (
        <div className="flex-1 h-full min-h-0 flex flex-col p-2 sm:p-4 bg-[#0a0c12]">
          <PianoGrandStaffView
            totalSteps={totalSteps}
            currentStep={isPlaying ? playbackStepInMeasure : activeStepInput}
            notes={notes}
            onToggleNote={(stepIdx, midiNum, velOrDur, dur) => {
              const vel = typeof velOrDur === 'number' ? velOrDur : 100;
              const resolvedDur = typeof velOrDur === 'string' ? velOrDur : dur;
              if (toggleHandler) toggleHandler(stepIdx, midiNum, vel, resolvedDur);
            }}
            onToggleRest={onToggleRest}
            activeStepInput={activeStepInput}
            onSelectStep={setActiveStepInput}
            activeSubdivision={activeSubdivision}
            timeSignature={timeSignature}
            measureStartStep={measureStartStep}
            isPlaying={isPlaying}
          />
        </div>
      ) : (
        /* Área del Piano Roll con scroll sincronizado (Horizontal & Vertical) */
        <div
          ref={containerRef}
          className="w-full max-h-[460px] overflow-y-auto overflow-x-auto flex flex-col no-scrollbar bg-[#0f1117]"
        >
          {/* Cabecera pegajosa con etiquetas rítmicas dinámicas */}
          <div className="flex sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 min-w-max shadow-md">
            {/* Esquina superior izquierda fija */}
            <div className="w-20 sm:w-24 shrink-0 bg-slate-950 p-2 text-[10px] font-bold text-slate-400 border-r border-slate-800 flex items-center justify-between">
              <span>Teclas</span>
              <Music2 className="w-3.5 h-3.5 text-cyan-500 opacity-70" />
            </div>

            {/* Fila de pasos */}
            <div className="flex flex-1">
              {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                const isSelectedForRecording = activeStepInput === stepIdx;
                const isCurrentlyPlaying = isPlaying && playbackStepInMeasure === stepIdx;
                const isMainBeat = isStepMainBeat(stepIdx, activeSubdivision, timeSignature, totalSteps);
                const isBeatEnd = isStepBeatEnd(stepIdx, activeSubdivision, timeSignature, totalSteps);
                const stepLabel = getStepLabel(stepIdx, activeSubdivision, timeSignatureNumerator);

                return (
                  <div
                    key={stepIdx}
                    onClick={() => setActiveStepInput(stepIdx)}
                    className={`w-8 sm:w-9 text-center py-1.5 text-[10px] font-mono cursor-pointer transition-all select-none relative ${
                      isBeatEnd ? 'border-r-2 border-r-slate-600/90' : 'border-r border-slate-800/80'
                    } ${
                      isCurrentlyPlaying
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-105 z-20'
                        : isSelectedForRecording
                        ? 'bg-cyan-950 text-cyan-300 ring-2 ring-cyan-400 font-black z-10'
                        : isMainBeat
                        ? 'font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                        : 'text-slate-400 hover:bg-slate-800/60'
                    }`}
                    title={`Paso ${stepIdx + 1} (${stepLabel}) - Clic para seleccionar como destino de grabación`}
                  >
                    <span className="block leading-tight">{stepLabel}</span>
                    {isMainBeat ? (
                      <span className="w-1 h-1 rounded-full bg-amber-400/80 mx-auto block mt-0.5" />
                    ) : (
                      <span className="w-1 h-1 mx-auto block mt-0.5 opacity-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Filas de Notas: Teclado Vertical a la izquierda + Cuadrícula Matricial */}
          <div className="flex flex-col min-w-max">
            {PIANO_KEYS.map((midi) => {
              const black = isBlackKey(midi);
              const isPressed = pressedMidiKeys.has(midi);
              const keyLabel = `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
              const isCKey = midi % 12 === 0;

              return (
                <div
                  key={midi}
                  className={`flex h-5 border-b border-slate-900/60 items-center ${
                    isCKey ? 'border-b-cyan-900/40' : ''
                  }`}
                >
                  {/* Tecla del Teclado Vertical Izquierdo */}
                  <div
                    onClick={() => {
                      pianoPreviewSynth.playNote(midi, 0.35, 95);
                      if (toggleHandler) toggleHandler(activeStepInput, midi, 100);
                    }}
                    className={`w-20 sm:w-24 shrink-0 px-2 h-full flex items-center justify-between text-[10px] font-mono border-r border-slate-800 cursor-pointer transition-all select-none ${
                      isPressed
                        ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(34,211,238,0.8)] z-10'
                        : black
                        ? 'bg-[#18181b] text-slate-400 hover:bg-slate-800 hover:text-white'
                        : 'bg-[#27272a] text-slate-200 hover:bg-zinc-700 hover:text-white'
                    }`}
                    title={`Tocar ${keyLabel} (MIDI ${midi})`}
                  >
                    <span className={`font-bold ${isCKey ? 'text-cyan-400 font-black' : ''}`}>
                      {keyLabel}
                    </span>
                    {isCKey && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm" />}
                  </div>

                  {/* Celdas del Paso de Tiempo Matricial */}
                  <div className="flex flex-1 h-full">
                    {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                      const globalStep = measureStartStep + stepIdx;
                      const hasNote = notes.some(
                        (n: any) =>
                          (n.step === globalStep ||
                            (n.stepIndex !== undefined && n.stepIndex === stepIdx)) &&
                          n.midiNumber === midi &&
                          !n.isRest
                      );
                      const isSelectedStep = activeStepInput === stepIdx;
                      const isPlayingStep = isPlaying && playbackStepInMeasure === stepIdx;
                      const isMainBeat = isStepMainBeat(stepIdx, activeSubdivision, timeSignature, totalSteps);
                      const isBeatEnd = isStepBeatEnd(stepIdx, activeSubdivision, timeSignature, totalSteps);

                      return (
                        <div
                          key={stepIdx}
                          onClick={() => {
                            setActiveStepInput(stepIdx);
                            pianoPreviewSynth.playNote(midi, 0.35, 95);
                            if (toggleHandler) toggleHandler(stepIdx, midi, 100);
                          }}
                          className={`w-8 sm:w-9 h-full cursor-pointer transition-all relative flex items-center justify-center ${
                            isBeatEnd ? 'border-r-2 border-r-slate-600/90' : 'border-r border-slate-900/40'
                          } ${
                            hasNote
                              ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)] z-10'
                              : isPlayingStep
                              ? 'bg-cyan-500/25 ring-1 ring-cyan-400/40'
                              : isSelectedStep
                              ? 'bg-cyan-950/30 hover:bg-cyan-900/40'
                              : isMainBeat
                              ? 'bg-slate-900/45 hover:bg-slate-800/60'
                              : black
                              ? 'bg-[#121319]/90 hover:bg-slate-800/40'
                              : 'bg-slate-900/20 hover:bg-slate-800/40'
                          }`}
                        >
                          {hasNote && (
                            <div className="w-full h-full bg-amber-400 rounded-sm border border-amber-200/80 shadow-sm flex items-center justify-center">
                              <span className="text-[7px] font-mono font-black text-slate-950 opacity-80">
                                {NOTE_NAMES[midi % 12]}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PianoRollBuilder;
