'use client';

import React, { useMemo, useState, useRef } from 'react';
import { pianoPreviewSynth } from '@/lib/audio/pianoPreviewSynth';
import { getStepLabel } from './PianoRollBuilder';

export interface PianoGrandStaffNote {
  stepIndex?: number;
  step?: number;
  midiNumber?: number;
  velocity?: number;
}

export interface PianoGrandStaffProps {
  totalSteps: number;
  currentStep: number;
  notes: PianoGrandStaffNote[];
  onToggleNote: (stepIndex: number, midiNumber: number, velocity?: number) => void;
  activeStepInput: number;
  onSelectStep: (stepIndex: number) => void;
  activeSubdivision?: string;
  timeSignature?: string;
  measureStartStep?: number;
  isPlaying?: boolean;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);

const OCTAVE_NOTES = [
  { name: 'Do', midiOffset: 0 },
  { name: 'Do#', midiOffset: 1, isBlack: true },
  { name: 'Re', midiOffset: 2 },
  { name: 'Re#', midiOffset: 3, isBlack: true },
  { name: 'Mi', midiOffset: 4 },
  { name: 'Fa', midiOffset: 5 },
  { name: 'Fa#', midiOffset: 6, isBlack: true },
  { name: 'Sol', midiOffset: 7 },
  { name: 'Sol#', midiOffset: 8, isBlack: true },
  { name: 'La', midiOffset: 9 },
  { name: 'La#', midiOffset: 10, isBlack: true },
  { name: 'Si', midiOffset: 11 },
];

export function PianoGrandStaffView({
  totalSteps,
  currentStep,
  notes,
  onToggleNote,
  activeStepInput,
  onSelectStep,
  activeSubdivision = '1/16',
  timeSignature = '4/4',
  measureStartStep = 0,
  isPlaying = false,
}: PianoGrandStaffProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileOctaveRange, setMobileOctaveRange] = useState<'bass' | 'treble'>('treble');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dimensiones del lienzo SVG optimizadas para llenar la pantalla
  const width = 960;
  const height = 410;
  const leftMargin = 100; // Espacio protegido para claves grandes
  const rightMargin = 35;
  const usableWidth = width - leftMargin - rightMargin;
  const safeTotalSteps = Math.max(1, totalSteps);
  const stepWidth = usableWidth / safeTotalSteps;

  // LÍNEAS DE CLAVE DE SOL (Separación de 24px):
  // Línea 5 (Fa5) = 55
  // Línea 4 (Re5) = 79
  // Línea 3 (Si4) = 103
  // Línea 2 (Sol4) = 127
  // Línea 1 (Mi4) = 151
  // Línea Adicional Central (Do4 / C4 = MIDI 60) = 187
  //
  // LÍNEAS DE CLAVE DE FA (Separación de 24px):
  // Línea 5 (La3) = 223
  // Línea 4 (Fa3) = 247
  // Línea 3 (Re3) = 271
  // Línea 2 (Si2) = 295
  // Línea 1 (Sol2) = 319
  const trebleLines = [55, 79, 103, 127, 151];
  const bassLines = [223, 247, 271, 295, 319];
  const middleCY = 187;

  const beatsPerBar = useMemo(() => {
    return parseInt(timeSignature.split('/')[0], 10) || 4;
  }, [timeSignature]);

  const toggleFullscreenLandscape = async () => {
    if (!isFullscreen) {
      const elem = containerRef.current;
      try {
        if (elem?.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any)?.webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        }
      } catch (_) {}
      try {
        if ((screen.orientation as any)?.lock) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch (_) {}
      setIsFullscreen(true);
    } else {
      try {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen && (document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (_) {}
      try {
        if ((screen.orientation as any)?.unlock) {
          (screen.orientation as any).unlock();
        }
      } catch (_) {}
      setIsFullscreen(false);
    }
  };

  // Normalizar las notas para asegurar que tengan stepIndex relativo al compás actual (0 .. totalSteps - 1)
  const normalizedNotes = useMemo(() => {
    return notes
      .map((n) => {
        const localStep =
          n.stepIndex !== undefined
            ? n.stepIndex
            : n.step !== undefined
            ? n.step - measureStartStep
            : -1;
        return {
          stepIndex: localStep,
          midiNumber: n.midiNumber ?? 60,
          velocity: n.velocity ?? 100,
        };
      })
      .filter(
        (n) =>
          n.stepIndex >= 0 &&
          n.stepIndex < safeTotalSteps &&
          n.midiNumber !== undefined
      );
  }, [notes, measureStartStep, safeTotalSteps]);

  const getXForStep = (stepIdx: number) => leftMargin + (stepIdx + 0.5) * stepWidth;

  // Mapeo Y continuo calibrado a la nueva escala (1 semitono aprox = 4.8px)
  const getYForMidi = (midi: number): number => {
    const delta = midi - 60; // Distancia en semitonos respecto a C4
    return middleCY - delta * 4.8;
  };

  const handleStaffClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const relativeX = (clickX / rect.width) * width;
    if (relativeX < leftMargin || relativeX > width - rightMargin) return;

    const clickedStep = Math.min(
      safeTotalSteps - 1,
      Math.max(0, Math.floor((relativeX - leftMargin) / stepWidth))
    );
    onSelectStep(clickedStep);

    const relativeY = (clickY / rect.height) * height;
    const estimatedMidi = Math.max(
      36,
      Math.min(84, Math.round(60 + (middleCY - relativeY) / 4.8))
    );

    pianoPreviewSynth.playNote(estimatedMidi, 0.35, 95);
    onToggleNote(clickedStep, estimatedMidi, 100);
  };

  const handleTouchNoteInput = (midiNumber: number) => {
    pianoPreviewSynth.playNote(midiNumber, 0.35, 95);
    onToggleNote(activeStepInput, midiNumber, 100);
  };

  const effectiveCursorStep = useMemo(() => {
    if (isPlaying && currentStep >= 0 && currentStep < safeTotalSteps) {
      return currentStep;
    }
    if (currentStep >= 0 && currentStep < safeTotalSteps) {
      return currentStep;
    }
    return Math.max(0, Math.min(safeTotalSteps - 1, activeStepInput));
  }, [isPlaying, currentStep, activeStepInput, safeTotalSteps]);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-[#0c0e14] p-3 sm:p-4 flex flex-col justify-between select-none overflow-hidden'
          : 'w-full flex-1 bg-[#0d0f17] border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col items-center select-none shadow-2xl overflow-hidden'
      }
    >
      {/* Cabecera del Gran Pentagrama con Botón de Pantalla Completa Horizontal */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300 text-[11px] sm:text-xs">
            🎼 Gran Pentagrama (Sol / Fa)
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            • Mano Derecha: Clave de Sol | Mano Izquierda: Clave de Fa
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFullscreen ? (
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => onSelectStep(Math.max(0, activeStepInput - 1))}
                disabled={activeStepInput === 0}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              >
                ◀
              </button>
              <span className="text-cyan-400 font-bold px-1.5">
                Paso #{activeStepInput + 1} ({getStepLabel(activeStepInput, activeSubdivision, beatsPerBar)})
              </span>
              <button
                type="button"
                onClick={() => onSelectStep(Math.min(safeTotalSteps - 1, activeStepInput + 1))}
                disabled={activeStepInput >= safeTotalSteps - 1}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              >
                ▶
              </button>
            </div>
          ) : (
            <span className="font-mono text-cyan-400 text-[11px]">
              Paso activo: #{activeStepInput + 1} ({getStepLabel(activeStepInput, activeSubdivision, beatsPerBar)})
            </span>
          )}

          <button
            type="button"
            onClick={toggleFullscreenLandscape}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
          >
            <span>{isFullscreen ? '✕ Salir' : '⛶ Pantalla Completa (Girar)'}</span>
          </button>
        </div>
      </div>

      {/* Lienzo SVG del Gran Pentagrama con Espaciado Ampliado (24px por línea) */}
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center select-none overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={
            isFullscreen
              ? 'w-full h-full flex-1 min-h-0 cursor-crosshair'
              : 'w-full h-full max-h-[380px] cursor-crosshair'
          }
          onClick={handleStaffClick}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Franja de resaltado de la columna del paso activo de grabación */}
          <rect
            x={leftMargin + activeStepInput * stepWidth}
            y="42"
            width={stepWidth}
            height="295"
            fill="rgba(34, 211, 238, 0.06)"
            stroke="rgba(34, 211, 238, 0.22)"
            strokeWidth="1"
            rx="4"
          />

          {/* ============================================================ */}
          {/* 1. ESTRUCTURA Y CLAVES GRANDES                               */}
          {/* ============================================================ */}
          {/* Llave / Corchete vertical izquierdo */}
          <line
            x1={leftMargin - 30}
            y1="55"
            x2={leftMargin - 30}
            y2="319"
            stroke="#94a3b8"
            strokeWidth="4.5"
          />
          <path
            d={`M ${leftMargin - 30} 55 Q ${leftMargin - 45} 187 ${leftMargin - 30} 187 Q ${leftMargin - 45} 187 ${leftMargin - 30} 319`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          {/* 5 Líneas de Clave de Sol (2px de grosor para alta visibilidad) */}
          {trebleLines.map((y, i) => (
            <line
              key={`treble-${i}`}
              x1={leftMargin - 30}
              y1={y}
              x2={width - rightMargin}
              y2={y}
              stroke="#475569"
              strokeWidth="2"
            />
          ))}
          {/* Símbolo Clave de Sol agrandado */}
          <text x="65" y="142" fill="#cbd5e1" fontSize="62" fontFamily="serif">
            𝄞
          </text>

          {/* Línea adicional para C4 (Do Central) */}
          <line
            x1={leftMargin - 10}
            y1={middleCY}
            x2={width - rightMargin}
            y2={middleCY}
            stroke="#334155"
            strokeDasharray="4 6"
            strokeWidth="1.5"
          />

          {/* 5 Líneas de Clave de Fa (2px de grosor) */}
          {bassLines.map((y, i) => (
            <line
              key={`bass-${i}`}
              x1={leftMargin - 30}
              y1={y}
              x2={width - rightMargin}
              y2={y}
              stroke="#475569"
              strokeWidth="2"
            />
          ))}
          {/* Símbolo Clave de Fa agrandado */}
          <text x="66" y="282" fill="#cbd5e1" fontSize="48" fontFamily="serif">
            𝄢
          </text>

          {/* Barras divisorias verticales de inicio y fin */}
          <line
            x1={leftMargin - 30}
            y1="55"
            x2={leftMargin - 30}
            y2="319"
            stroke="#94a3b8"
            strokeWidth="3"
          />
          <line
            x1={width - rightMargin}
            y1="55"
            x2={width - rightMargin}
            y2="319"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          {/* ============================================================ */}
          {/* 2. CABECERA DE PASOS RÍTMICOS (NÚMEROS MÁS GRANDES)         */}
          {/* ============================================================ */}
          {Array.from({ length: safeTotalSteps }).map((_, stepIdx) => {
            const cx = getXForStep(stepIdx);
            const isSelected = activeStepInput === stepIdx;
            return (
              <g
                key={stepIdx}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStep(stepIdx);
                }}
              >
                <line
                  x1={cx}
                  y1="34"
                  x2={cx}
                  y2="44"
                  stroke={isSelected ? '#22d3ee' : '#334155'}
                  strokeWidth={isSelected ? '2' : '1'}
                />
                <text
                  x={cx}
                  y="28"
                  textAnchor="middle"
                  fill={isSelected ? '#22d3ee' : '#64748b'}
                  fontSize="13"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {stepIdx + 1}
                </text>
              </g>
            );
          })}

          {/* ============================================================ */}
          {/* 3. NOTAS AGIGANTADAS CON PLICAS CLARAS                      */}
          {/* ============================================================ */}
          {normalizedNotes.map((n, idx) => {
            const cx = getXForStep(n.stepIndex);
            const cy = getYForMidi(n.midiNumber);
            const isTreble = n.midiNumber >= 60;
            const isSharp = BLACK_KEY_OFFSETS.has(n.midiNumber % 12);
            const noteLabel = `${NOTE_NAMES[n.midiNumber % 12]}${Math.floor(n.midiNumber / 12) - 1}`;

            return (
              <g
                key={`${n.stepIndex}-${n.midiNumber}-${idx}`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStep(n.stepIndex);
                  pianoPreviewSynth.playNote(n.midiNumber, 0.35, 95);
                  onToggleNote(n.stepIndex, n.midiNumber, n.velocity);
                }}
              >
                <title>{`${noteLabel} (MIDI ${n.midiNumber}) - Paso #${n.stepIndex + 1}`}</title>

                {/* Línea adicional visible si es C4 */}
                {n.midiNumber === 60 && (
                  <line
                    x1={cx - 16}
                    y1={middleCY}
                    x2={cx + 16}
                    y2={middleCY}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                )}

                {/* Símbolo de sostenido si es tecla negra */}
                {isSharp && (
                  <text
                    x={cx - 18}
                    y={cy + 5}
                    fill="#fbbf24"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    ♯
                  </text>
                )}

                {/* Plica vertical más gruesa y visible */}
                <line
                  x1={isTreble ? cx + 9 : cx - 9}
                  y1={cy}
                  x2={isTreble ? cx + 9 : cx - 9}
                  y2={isTreble ? cy - 38 : cy + 38}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Cabeza ovalada de la nota ampliada al tamaño real */}
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx="10"
                  ry="7.5"
                  transform={`rotate(-20 ${cx} ${cy})`}
                  fill="#f59e0b"
                  stroke="#d97706"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* ============================================================ */}
          {/* 4. CURSOR ESCÁNER DE PASO ACTIVO / REPRODUCCIÓN             */}
          {/* ============================================================ */}
          <line
            x1={getXForStep(effectiveCursorStep)}
            y1="45"
            x2={getXForStep(effectiveCursorStep)}
            y2="335"
            stroke="#22d3ee"
            strokeWidth="3"
            filter="drop-shadow(0 0 8px rgba(34, 211, 238, 0.9))"
            className="pointer-events-none transition-all duration-75 ease-linear"
          />
        </svg>
      </div>

      {/* Panel Táctil Rápido: Teclado de Entrada Asistida (Especial para móviles) */}
      <div className="w-full mt-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-300">
            🎹 Tocar Nota en Paso <span className="text-cyan-400 font-mono">#{activeStepInput + 1}</span>:
          </span>

          {/* Selector de Registro */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setMobileOctaveRange('bass')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                mobileOctaveRange === 'bass'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Clave Fa (C2-B3)
            </button>
            <button
              type="button"
              onClick={() => setMobileOctaveRange('treble')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                mobileOctaveRange === 'treble'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Clave Sol (C4-B5)
            </button>
          </div>
        </div>

        {/* Teclas Táctiles Grandes de Entrada */}
        <div className="w-full flex items-center justify-start sm:justify-center gap-1 overflow-x-auto py-1 no-scrollbar">
          {[4, 5].map((octaveNum) => {
            const baseMidi =
              mobileOctaveRange === 'treble'
                ? octaveNum === 4
                  ? 60
                  : 72
                : octaveNum === 4
                ? 36
                : 48;
            const octaveLabel =
              mobileOctaveRange === 'treble'
                ? octaveNum === 4
                  ? '4'
                  : '5'
                : octaveNum === 4
                ? '2'
                : '3';

            return (
              <div key={octaveNum} className="flex items-center gap-1 shrink-0">
                {OCTAVE_NOTES.filter((n) => !n.isBlack).map((whiteKey) => {
                  const currentMidi = baseMidi + whiteKey.midiOffset;
                  const isNoteActive = normalizedNotes.some(
                    (n) =>
                      n.stepIndex === activeStepInput &&
                      n.midiNumber === currentMidi
                  );

                  return (
                    <button
                      key={currentMidi}
                      type="button"
                      onClick={() => handleTouchNoteInput(currentMidi)}
                      className={`h-14 w-9 sm:w-10 rounded-lg flex flex-col justify-end items-center pb-1 text-[10px] font-bold border transition-all active:scale-95 shadow-md ${
                        isNoteActive
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-amber-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                      }`}
                    >
                      <span>{whiteKey.name}</span>
                      <span className="text-[9px] opacity-60 font-mono">{octaveLabel}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PianoGrandStaffView;
