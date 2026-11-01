'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { midiInputService } from '@/lib/audio/midiInputService';
import { getPianoAudioEngine } from '@/lib/audio/pianoAudioEngine';
import { Radio, Music2, Info, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export interface PianoNoteStep {
  step?: number;
  stepIndex?: number;
  midiNumber?: number;
  velocity?: number;
  durationSteps?: number;
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
 *
 * Convenciones:
 * - 1/16 (Semicorcheas, 4/4): 4 pasos por pulso -> '1', 'e', '&', 'a', '2', 'e', '&', 'a'...
 * - 1/8 (Corcheas): 2 pasos por pulso -> '1', '&', '2', '&', '3', '&', '4', '&'
 * - 1/8T (Tresillos de corchea): 3 pasos por pulso -> '1', 't', 'a', '2', 't', 'a'...
 * - 1/4 (Negras): 1 paso por pulso -> '1', '2', '3', '4'
 * - 1/16T (Tresillos de semicorchea): 6 pasos por pulso -> '1', 't', 'e', '&', 't', 'a'
 * - Quintillos: 5 pasos por pulso -> '1', '2', '3', '4', '5'
 * - Septillos: 7 pasos por pulso -> '1', '2', '3', '4', '5', '6', '7'
 * - 1/32 (Fusas): 8 pasos por pulso -> '1', '·', 'e', '·', '&', '·', 'a', '·'
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

  // 1/8 (Corcheas): 2 pasos por pulso (1, &)
  if (subdivision === '1/8') {
    const beatNumber = Math.floor(stepIndex / 2) + 1;
    const sub = stepIndex % 2;
    return sub === 0 ? beatNumber.toString() : '&';
  }

  // 1/8T (Tresillos de corchea): 3 pasos por pulso (1, t, a)
  if (subdivision === '1/8T') {
    const beatNumber = Math.floor(stepIndex / 3) + 1;
    const sub = stepIndex % 3;
    const subLabels = [beatNumber.toString(), 't', 'a'];
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
  onToggleNote?: (stepInMeasure: number, midiNumber: number, velocity?: number) => void;
  onToggleSingleNote?: (stepInMeasure: number, midiNumber: number, velocity?: number) => void;
  onAddChordToStep?: (stepInMeasure: number, midiNumbers: number[], velocity?: number) => void;
  isPlaying?: boolean;
  playbackActiveStep?: number;
  measureStartStep?: number;
  timeSignature?: string;
}

// Rango de 4 octavas útiles: C2 (36) a C6 (84) -> 49 teclas ordenadas de agudo a grave
const PIANO_KEYS = Array.from({ length: 49 }, (_, i) => 84 - i);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function PianoRollBuilder({
  currentMeasure = 0,
  totalSteps,
  activeSubdivision = '1/16',
  notes,
  onToggleNote,
  onToggleSingleNote,
  onAddChordToStep,
  isPlaying = false,
  playbackActiveStep = 0,
  measureStartStep = 0,
  timeSignature = '4/4',
}: PianoRollBuilderProps) {
  const [activeMidiDevice, setActiveMidiDevice] = useState<string | null>(null);
  const [activeStepInput, setActiveStepInput] = useState<number>(0);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [pressedMidiKeys, setPressedMidiKeys] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Buffer para capturar acordes antes de avanzar el paso
  const chordBufferRef = useRef<Set<number>>(new Set());
  const releaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Referencias actualizadas para evitar re-suscripciones innecesarias en el stream MIDI
  const activeStepInputRef = useRef(activeStepInput);
  activeStepInputRef.current = activeStepInput;

  const autoAdvanceRef = useRef(autoAdvance);
  autoAdvanceRef.current = autoAdvance;

  const onAddChordRef = useRef(onAddChordToStep);
  onAddChordRef.current = onAddChordToStep;

  const onToggleNoteRef = useRef(onToggleSingleNote || onToggleNote);
  onToggleNoteRef.current = onToggleSingleNote || onToggleNote;

  const totalStepsRef = useRef(totalSteps);
  totalStepsRef.current = totalSteps;

  // Función para registrar notas acumuladas (acorde o nota individual) en el paso activo
  const commitChord = useCallback(() => {
    if (chordBufferRef.current.size > 0) {
      const notesToRecord = Array.from(chordBufferRef.current);
      chordBufferRef.current.clear();
      const currentStep = activeStepInputRef.current;

      if (onAddChordRef.current) {
        onAddChordRef.current(currentStep, notesToRecord, 100);
      } else if (onToggleNoteRef.current) {
        notesToRecord.forEach((m) => onToggleNoteRef.current!(currentStep, m, 100));
      }

      if (autoAdvanceRef.current) {
        setActiveStepInput((prev) => (prev + 1 < totalStepsRef.current ? prev + 1 : prev));
      }
    }
  }, []);

  // Inicialización de Web MIDI API y detección reactiva de teclado USB
  useEffect(() => {
    midiInputService.initialize().then(() => {
      setActiveMidiDevice(midiInputService.connectedDeviceName);
    });

    const unsubDevice = midiInputService.onDeviceChange((deviceName) => {
      setActiveMidiDevice(deviceName);
    });

    const unsubNotes = midiInputService.subscribe((heldKeys, lastNote) => {
      setPressedMidiKeys(new Set(heldKeys));

      if (lastNote.isNoteOn) {
        // Si había notas pendientes del acorde anterior listas para comitear, comitearlas primero
        if (releaseTimerRef.current) {
          clearTimeout(releaseTimerRef.current);
          releaseTimerRef.current = null;
          commitChord();
        }

        // Reproducir sonido inmediato con el motor polifónico
        getPianoAudioEngine().triggerNote(
          lastNote.noteNumber,
          0,
          0.8,
          (lastNote.velocity || 100) / 127
        );

        // Acumular la tecla en el buffer del acorde
        chordBufferRef.current.add(lastNote.noteNumber);
      } else {
        // Al soltar teclas (Note OFF)
        if (releaseTimerRef.current) {
          clearTimeout(releaseTimerRef.current);
          releaseTimerRef.current = null;
        }

        // Si se han liberado todas las teclas físicas del teclado controlador
        if (heldKeys.size === 0 && chordBufferRef.current.size > 0) {
          releaseTimerRef.current = setTimeout(() => {
            commitChord();
            releaseTimerRef.current = null;
          }, 50); // Debounce de 50ms para capturar acordes completos con liberación natural
        }
      }
    });

    return () => {
      unsubDevice();
      unsubNotes();
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    };
  }, [commitChord]);

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
    return notes.filter(
      (n: any) => {
        const stepNum = n.step !== undefined ? n.step : n.stepIndex;
        return stepNum >= measureStartStep && stepNum < measureStartStep + totalSteps && n.midiNumber !== undefined;
      }
    ).length;
  }, [notes, measureStartStep, totalSteps]);

  const toggleHandler = onToggleSingleNote || onToggleNote;

  return (
    <div className="w-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      {/* 1. Barra Superior de Estado MIDI y Asistente de Grabación Paso a Paso */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indicador de Conexión MIDI USB */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              activeMidiDevice
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Radio
              className={`w-4 h-4 shrink-0 ${
                activeMidiDevice ? 'text-emerald-400 animate-pulse' : 'text-slate-600'
              }`}
            />
            <span className="font-mono text-xs font-bold truncate max-w-[190px] sm:max-w-[260px]">
              {activeMidiDevice ? `🟢 MIDI: ${activeMidiDevice}` : 'MIDI no detectado (Conecta tu teclado USB)'}
            </span>
          </div>

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
            <Zap className={`w-3.5 h-3.5 ${autoAdvance ? 'fill-slate-950 text-slate-950' : 'text-slate-400'}`} />
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
              <span className="text-amber-400">({getStepLabel(activeStepInput, activeSubdivision, timeSignatureNumerator)})</span>
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

      {/* 2. Área del Piano Roll con scroll sincronizado (Horizontal & Vertical) */}
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
                    getPianoAudioEngine().triggerNote(midi, 0, 0.8, 0.85);
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
                        (n.step === globalStep || (n.stepIndex !== undefined && n.stepIndex === stepIdx)) &&
                        n.midiNumber === midi
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
                          if (!hasNote) {
                            getPianoAudioEngine().triggerNote(midi, 0, 0.8, 0.85);
                          }
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
    </div>
  );
}

export default PianoRollBuilder;
