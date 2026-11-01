'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PianoNoteData } from '@/types/piano';
import { getPianoAudioEngine } from '@/lib/audio/pianoAudioEngine';

interface KeysRunwayMatrixProps {
  totalSteps: number;
  activeStep: number;
  notes: PianoNoteData[];
  timeSignature?: string;
  onNoteClick?: (note: PianoNoteData) => void;
}

export const KeysRunwayMatrix: React.FC<KeysRunwayMatrixProps> = ({
  totalSteps,
  activeStep,
  notes,
  timeSignature = '4/4',
  onNoteClick,
}) => {
  const stepsPerMeasure = 16;
  const totalMeasures = Math.max(1, Math.ceil(totalSteps / stepsPerMeasure));

  // Separar notas por manos para dos pistas visuales claras (Clave de Sol y Clave de Fa)
  const { rightHandNotes, leftHandNotes } = useMemo(() => {
    const rh: PianoNoteData[] = [];
    const lh: PianoNoteData[] = [];

    notes.forEach((n) => {
      // Si la mano está explícita, usarla; si no, separar en C4 (MIDI 60)
      const isLeft = n.hand === 'left' || (!n.hand && n.midiNumber < 60);
      if (isLeft) {
        lh.push(n);
      } else {
        rh.push(n);
      }
    });

    return { rightHandNotes: rh, leftHandNotes: lh };
  }, [notes]);

  // Indexar notas por paso para renderizado directo
  const rhByStep = useMemo(() => {
    const map = new Map<number, PianoNoteData[]>();
    rightHandNotes.forEach((n) => {
      const arr = map.get(n.step) || [];
      arr.push(n);
      map.set(n.step, arr);
    });
    return map;
  }, [rightHandNotes]);

  const lhByStep = useMemo(() => {
    const map = new Map<number, PianoNoteData[]>();
    leftHandNotes.forEach((n) => {
      const arr = map.get(n.step) || [];
      arr.push(n);
      map.set(n.step, arr);
    });
    return map;
  }, [leftHandNotes]);

  const handlePlaySingle = (note: PianoNoteData) => {
    const engine = getPianoAudioEngine();
    engine.triggerNote(note.midiNumber, undefined, 0.8, 0.85);
    if (onNoteClick) onNoteClick(note);
  };

  return (
    <div className="w-full flex flex-col gap-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm overflow-hidden select-none">
      {/* Cabecera del Runway con Leyenda de Manos y Métrica */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Keys Lab Runway &bull; Matriz Temporal de Pasos
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {totalMeasures} {totalMeasures === 1 ? 'Compás' : 'Compases'} ({totalSteps} Pasos)
          </span>
        </div>

        {/* Leyenda de Manos con Clave de Sol y Clave de Fa */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="font-bold">MD &bull; Clave de Sol</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="font-bold">MI &bull; Clave de Fa</span>
          </div>
        </div>
      </div>

      {/* Runway Timeline con Scroll Horizontal */}
      <div className="relative w-full overflow-x-auto no-scrollbar pt-2 pb-2">
        <div
          className="relative min-w-[760px] flex flex-col gap-2 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 p-3 border border-slate-200 dark:border-slate-800/80"
          style={{ width: `${Math.max(100, (totalSteps / 16) * 100)}%` }}
        >
          {/* Regla Temporal Superior con Números de Compás y Tiempos */}
          <div className="relative w-full h-7 flex items-center border-b border-slate-300 dark:border-slate-800 pb-1">
            {Array.from({ length: totalSteps }).map((_, stepIdx) => {
              const isFirstStepOfMeasure = stepIdx % stepsPerMeasure === 0;
              const measureNumber = Math.floor(stepIdx / stepsPerMeasure) + 1;
              const isQuarterBeat = stepIdx % 4 === 0;
              const beatNumber = ((stepIdx % stepsPerMeasure) / 4) + 1;

              return (
                <div
                  key={`ruler-${stepIdx}`}
                  className="flex-1 flex flex-col items-center justify-end relative h-full"
                >
                  {isFirstStepOfMeasure && (
                    <span className="absolute -top-1 left-0 text-[10px] font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded">
                      c.{measureNumber}
                    </span>
                  )}
                  {isQuarterBeat && !isFirstStepOfMeasure && (
                    <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      t.{beatNumber}
                    </span>
                  )}
                  <div
                    className={`w-px ${
                      isFirstStepOfMeasure
                        ? 'h-3 bg-amber-500/60 dark:bg-amber-400/60'
                        : isQuarterBeat
                        ? 'h-2 bg-slate-400 dark:bg-slate-600'
                        : 'h-1 bg-slate-300 dark:bg-slate-800'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Carril 1: Mano Derecha (Clave de Sol) */}
          <div className="relative w-full h-18 flex items-center bg-cyan-950/5 dark:bg-cyan-950/20 rounded-xl border border-cyan-500/20 px-1">
            <span className="absolute -left-1 sm:left-2 top-2 text-[10px] font-mono font-black text-cyan-600 dark:text-cyan-400/70 select-none z-10 pointer-events-none">
              𝄞 MD
            </span>
            <div className="relative w-full h-full flex">
              {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                const notesAtStep = rhByStep.get(stepIdx) || [];
                const isStepActive = activeStep === stepIdx;
                const isQuarterBeat = stepIdx % 4 === 0;

                return (
                  <div
                    key={`rh-${stepIdx}`}
                    className={`flex-1 h-full border-r relative flex flex-col items-center justify-center p-0.5 gap-1 transition-colors ${
                      isStepActive
                        ? 'bg-cyan-400/25 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)] z-10'
                        : isQuarterBeat
                        ? 'border-slate-300 dark:border-slate-800/80 bg-white/40 dark:bg-white/5'
                        : 'border-slate-200 dark:border-white/5'
                    }`}
                  >
                    {notesAtStep.map((n, i) => (
                      <button
                        key={`rh-note-${stepIdx}-${i}`}
                        type="button"
                        onClick={() => handlePlaySingle(n)}
                        className={`w-full py-1 px-1 rounded-md font-mono text-[10px] font-extrabold flex items-center justify-between shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                          isStepActive
                            ? 'bg-cyan-400 text-zinc-950 shadow-[0_0_10px_rgba(34,211,238,0.9)] ring-1 ring-white'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-900 dark:text-cyan-200 border border-cyan-500/40'
                        }`}
                        title={`${n.noteName} (d${n.finger || 1}) - Clic para escuchar`}
                      >
                        <span className="truncate">{n.noteName}</span>
                        {n.finger && (
                          <span className="text-[9px] opacity-80 font-black ml-0.5">d{n.finger}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carril 2: Mano Izquierda (Clave de Fa) */}
          <div className="relative w-full h-18 flex items-center bg-blue-950/5 dark:bg-blue-950/20 rounded-xl border border-blue-500/20 px-1">
            <span className="absolute -left-1 sm:left-2 top-2 text-[10px] font-mono font-black text-blue-600 dark:text-blue-400/70 select-none z-10 pointer-events-none">
              𝄢 MI
            </span>
            <div className="relative w-full h-full flex">
              {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                const notesAtStep = lhByStep.get(stepIdx) || [];
                const isStepActive = activeStep === stepIdx;
                const isQuarterBeat = stepIdx % 4 === 0;

                return (
                  <div
                    key={`lh-${stepIdx}`}
                    className={`flex-1 h-full border-r relative flex flex-col items-center justify-center p-0.5 gap-1 transition-colors ${
                      isStepActive
                        ? 'bg-blue-500/25 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)] z-10'
                        : isQuarterBeat
                        ? 'border-slate-300 dark:border-slate-800/80 bg-white/40 dark:bg-white/5'
                        : 'border-slate-200 dark:border-white/5'
                    }`}
                  >
                    {notesAtStep.map((n, i) => (
                      <button
                        key={`lh-note-${stepIdx}-${i}`}
                        type="button"
                        onClick={() => handlePlaySingle(n)}
                        className={`w-full py-1 px-1 rounded-md font-mono text-[10px] font-extrabold flex items-center justify-between shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                          isStepActive
                            ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.9)] ring-1 ring-white'
                            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-900 dark:text-blue-200 border border-blue-500/40'
                        }`}
                        title={`${n.noteName} (d${n.finger || 5}) - Clic para escuchar`}
                      >
                        <span className="truncate">{n.noteName}</span>
                        {n.finger && (
                          <span className="text-[9px] opacity-80 font-black ml-0.5">d{n.finger}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cursor Playhead Sincronizado en Tiempo Real */}
          <div
            className="absolute top-2 bottom-2 w-1 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] pointer-events-none rounded-full transition-all duration-75 z-30"
            style={{
              left: `${(activeStep / totalSteps) * 100}%`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 -ml-[3px] -mt-1 shadow-md shadow-amber-400/80" />
          </div>
        </div>
      </div>
    </div>
  );
};

