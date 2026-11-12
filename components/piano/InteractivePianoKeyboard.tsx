'use client';

import React, { useMemo } from 'react';
import { pianoPreviewSynth } from '@/lib/audio/pianoPreviewSynth';
import { PianoHand } from '@/types/piano';

export interface ActiveKeyInfo {
  midiNumber: number;
  noteName: string;
  hand?: PianoHand;
  finger?: number;
}

export interface InteractivePianoKeyboardProps {
  activeNotes?: ActiveKeyInfo[];
  activeMidis?: number[];
  startMidi?: number; // default 36 (C2)
  endMidi?: number;   // default 84 (C6)
  onKeyClick?: (midi: number) => void;
  onKeyPress?: (midi: number) => void;
  showLabels?: boolean;
  compact?: boolean;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface KeyDefinition {
  midi: number;
  noteName: string;
  isBlack: boolean;
  octave: number;
  whiteIndex: number; // Índice entre las teclas blancas para calcular posición
}

export const InteractivePianoKeyboard: React.FC<InteractivePianoKeyboardProps> = ({
  activeNotes = [],
  activeMidis,
  startMidi = 36, // C2
  endMidi = 84,   // C6
  onKeyClick,
  onKeyPress,
  showLabels = true,
  compact = false,
}) => {
  // Mapa de notas activas en tiempo real para búsqueda O(1)
  const activeMap = useMemo(() => {
    const map = new Map<number, ActiveKeyInfo>();
    activeNotes.forEach((n) => {
      map.set(n.midiNumber, n);
    });
    if (activeMidis) {
      activeMidis.forEach((midi) => {
        if (!map.has(midi)) {
          const pitchIndex = midi % 12;
          const octave = Math.floor(midi / 12) - 1;
          map.set(midi, {
            midiNumber: midi,
            noteName: `${NOTE_NAMES[pitchIndex]}${octave}`,
            hand: midi < 60 ? 'left' : 'right',
          });
        }
      });
    }
    return map;
  }, [activeNotes, activeMidis]);

  // Generar lista de teclas
  const { whiteKeys, blackKeys, totalWhiteKeys } = useMemo(() => {
    const whites: KeyDefinition[] = [];
    const blacks: KeyDefinition[] = [];
    let currentWhiteIndex = 0;

    for (let midi = startMidi; midi <= endMidi; midi++) {
      const pitchIndex = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const noteName = `${NOTE_NAMES[pitchIndex]}${octave}`;
      const isBlack = [1, 3, 6, 8, 10].includes(pitchIndex);

      if (isBlack) {
        // La tecla negra se sitúa en el whiteIndex actual (entre la blanca anterior y la actual)
        blacks.push({
          midi,
          noteName,
          isBlack: true,
          octave,
          whiteIndex: currentWhiteIndex,
        });
      } else {
        whites.push({
          midi,
          noteName,
          isBlack: false,
          octave,
          whiteIndex: currentWhiteIndex,
        });
        currentWhiteIndex++;
      }
    }

    return { whiteKeys: whites, blackKeys: blacks, totalWhiteKeys: currentWhiteIndex };
  }, [startMidi, endMidi]);

  const handleKeyPress = (midi: number) => {
    pianoPreviewSynth.playNote(midi, 1.4, 95);
    if (onKeyPress) {
      onKeyPress(midi);
    }
    if (onKeyClick) {
      onKeyClick(midi);
    }
  };

  return (
    <div className="w-full select-none flex flex-col gap-1 sm:gap-2">
      {/* Contenedor del Teclado con Scroll Horizontal adaptativo */}
      <div className={`w-full ${compact ? 'overflow-hidden px-0.5' : 'overflow-x-auto no-scrollbar pb-2 pt-1 px-1'}`}>
        <div
          className={`relative mx-auto rounded-2xl bg-slate-900/90 dark:bg-black/95 border border-slate-700/80 dark:border-slate-800 shadow-2xl shadow-cyan-950/20 ${
            compact ? 'p-2 pt-2.5 pb-2 w-full' : 'p-3.5 pt-4 pb-3'
          }`}
          style={{ minWidth: compact ? '100%' : '780px', height: compact ? '125px' : '190px' }}
        >
          {/* Fieltro rojo superior característico de pianos acústicos */}
          <div className="absolute top-0 left-3 right-3 h-1.5 bg-gradient-to-r from-red-800 via-rose-600 to-red-800 rounded-t-sm shadow-xs" />

          {/* Rejilla de Teclas Blancas */}
          <div className="relative w-full h-full flex">
            {whiteKeys.map((k) => {
              const activeInfo = activeMap.get(k.midi);
              const isActive = !!activeInfo;
              const isLeftHand = activeInfo?.hand === 'left' || (!activeInfo?.hand && k.midi < 60);

              return (
                <button
                  key={k.midi}
                  type="button"
                  onClick={() => handleKeyPress(k.midi)}
                  className={`group relative flex-1 h-full rounded-b-md border border-slate-300 dark:border-slate-800 flex flex-col justify-end items-center cursor-pointer shadow-xs ${
                    compact ? 'pb-1' : 'pb-2'
                  } ${
                    isActive
                      ? isLeftHand
                        ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_18px_rgba(59,130,246,0.85)] z-10 translate-y-0.5'
                        : 'bg-cyan-400 border-cyan-300 text-zinc-950 shadow-[0_0_18px_rgba(34,211,238,0.9)] z-10 translate-y-0.5'
                      : 'bg-white hover:bg-slate-100 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-slate-800 active:translate-y-0.5'
                  }`}
                  title={`${k.noteName} (MIDI ${k.midi})`}
                >
                  {/* Iluminación activa sin flicker */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 rounded-b-md opacity-30 ${
                        isLeftHand ? 'bg-blue-300' : 'bg-cyan-200'
                      }`}
                    />
                  )}

                  {/* Indicador de Mano o Dedo si está activa */}
                  {isActive && (
                    <div className="relative z-10 mb-0.5 flex flex-col items-center gap-0.5">
                      <span
                        className={`font-black uppercase leading-none rounded-full ${
                          compact ? 'text-[7px] px-1 py-0.2' : 'text-[9px] px-1.5 py-0.5'
                        } ${
                          isLeftHand
                            ? 'bg-blue-900/80 text-blue-100'
                            : 'bg-cyan-950/80 text-cyan-200'
                        }`}
                      >
                        {isLeftHand ? 'MI' : 'MD'}
                      </span>
                      {activeInfo?.finger && (
                        <span className={`font-mono font-black leading-none ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
                          d{activeInfo.finger}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Etiqueta de Nota */}
                  {showLabels && (
                    <span
                      className={`relative z-10 font-mono font-bold tracking-tighter ${
                        compact ? 'text-[7.5px]' : 'text-[9px]'
                      } ${
                        isActive
                          ? isLeftHand
                            ? 'text-white'
                            : 'text-zinc-950'
                          : k.noteName.startsWith('C')
                          ? 'text-[#0891b2] dark:text-cyan-700 font-extrabold'
                          : 'text-slate-400 dark:text-zinc-500'
                      }`}
                    >
                      {k.noteName}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Teclas Negras (Superpuestas de forma absoluta por posición proporcional) */}
            {blackKeys.map((k) => {
              const activeInfo = activeMap.get(k.midi);
              const isActive = !!activeInfo;
              const isLeftHand = activeInfo?.hand === 'left' || (!activeInfo?.hand && k.midi < 60);

              const whiteKeyWidthPercent = 100 / totalWhiteKeys;
              const leftPercent = k.whiteIndex * whiteKeyWidthPercent;

              return (
                <button
                  key={k.midi}
                  type="button"
                  onClick={() => handleKeyPress(k.midi)}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${whiteKeyWidthPercent * 0.65}%`,
                    transform: 'translateX(-50%)',
                  }}
                  className={`absolute top-0 h-[62%] rounded-b-md border flex flex-col justify-end items-center cursor-pointer z-20 shadow-md ${
                    compact ? 'pb-1' : 'pb-2'
                  } ${
                    isActive
                      ? isLeftHand
                        ? 'bg-blue-500 border-blue-300 text-white shadow-[0_0_20px_rgba(59,130,246,0.9)] translate-y-0.5'
                        : 'bg-cyan-400 border-cyan-200 text-zinc-950 shadow-[0_0_20px_rgba(34,211,238,0.95)] translate-y-0.5'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-950 text-zinc-400 active:translate-y-0.5'
                  }`}
                  title={`${k.noteName} (MIDI ${k.midi})`}
                >
                  {/* Badge de Mano / Dedo en tecla negra */}
                  {isActive && (
                    <div className="mb-0.5 flex flex-col items-center gap-0.5">
                      <span
                        className={`font-black uppercase leading-none rounded-sm ${
                          compact ? 'text-[7px] px-0.5' : 'text-[8px] px-1'
                        } ${
                          isLeftHand ? 'bg-blue-950 text-blue-200' : 'bg-cyan-950 text-cyan-200'
                        }`}
                      >
                        {isLeftHand ? 'MI' : 'MD'}
                      </span>
                      {activeInfo?.finger && (
                        <span className={`font-mono font-black leading-none ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                          d{activeInfo.finger}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Nombre de la tecla negra */}
                  {showLabels && (
                    <span
                      className={`font-mono font-bold leading-none ${compact ? 'text-[7px]' : 'text-[8px]'} ${
                        isActive
                          ? isLeftHand
                            ? 'text-white'
                            : 'text-zinc-950'
                          : 'text-slate-400 dark:text-zinc-500'
                      }`}
                    >
                      {k.noteName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
