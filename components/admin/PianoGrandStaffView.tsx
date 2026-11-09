'use client';

import React, { useMemo } from 'react';
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
  const width = 960;
  const height = 340;
  const leftMargin = 90;
  const rightMargin = 40;
  const usableWidth = width - leftMargin - rightMargin;
  const safeTotalSteps = Math.max(1, totalSteps);
  const stepWidth = usableWidth / safeTotalSteps;

  const beatsPerBar = useMemo(() => {
    return parseInt(timeSignature.split('/')[0], 10) || 4;
  }, [timeSignature]);

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

  const getYForMidi = (midi: number): number => {
    // Escala lineal de semitonos centrada en C4 (midi = 60, y = 135)
    const delta = midi - 60;
    return 135 - delta * 3.1;
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
      Math.min(84, Math.round(60 + (135 - relativeY) / 3.1))
    );

    pianoPreviewSynth.playNote(estimatedMidi, 0.35, 95);
    onToggleNote(clickedStep, estimatedMidi, 100);
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
    <div className="w-full bg-[#0d0f17] border border-slate-800 rounded-2xl p-4 flex flex-col items-center select-none shadow-2xl overflow-x-auto no-scrollbar">
      <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-2 px-2">
        <span className="font-bold text-amber-300">
          Gran Pentagrama para Piano (Mano Derecha: Clave de Sol • Mano Izquierda: Clave de Fa)
        </span>
        <span className="font-mono text-cyan-400">
          Paso activo: #{activeStepInput + 1} ({getStepLabel(activeStepInput, activeSubdivision, beatsPerBar)})
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[380px] cursor-crosshair"
        onClick={handleStaffClick}
      >
        {/* Franja de resaltado de la columna del paso activo de grabación */}
        <rect
          x={leftMargin + activeStepInput * stepWidth}
          y="36"
          width={stepWidth}
          height="208"
          fill="rgba(34, 211, 238, 0.06)"
          stroke="rgba(34, 211, 238, 0.2)"
          strokeWidth="1"
          rx="4"
        />

        {/* Guías verticales sutiles por paso */}
        {Array.from({ length: safeTotalSteps }).map((_, stepIdx) => (
          <line
            key={`step-guide-${stepIdx}`}
            x1={getXForStep(stepIdx)}
            y1="50"
            x2={getXForStep(stepIdx)}
            y2="230"
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}

        {/* Llave / Corchete de unión a la izquierda */}
        <line
          x1={leftMargin - 25}
          y1="50"
          x2={leftMargin - 25}
          y2="230"
          stroke="#94a3b8"
          strokeWidth="4"
        />
        <path
          d={`M ${leftMargin - 25} 50 Q ${leftMargin - 35} 140 ${leftMargin - 25} 140 Q ${leftMargin - 35} 140 ${leftMargin - 25} 230`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.5"
        />

        {/* 1. CLAVE DE SOL (5 Líneas superiores: 50, 65, 80, 95, 110) */}
        {[50, 65, 80, 95, 110].map((y, i) => (
          <line
            key={`treble-${i}`}
            x1={leftMargin - 25}
            y1={y}
            x2={width - rightMargin}
            y2={y}
            stroke="#334155"
            strokeWidth="1.5"
          />
        ))}
        {/* Símbolo Clave de Sol */}
        <text x="68" y="102" fill="#cbd5e1" fontSize="42" fontFamily="serif">
          𝄞
        </text>

        {/* Línea adicional central de referencia para C4 (Do Central = 135) */}
        <line
          x1={leftMargin - 10}
          y1="135"
          x2={width - rightMargin}
          y2="135"
          stroke={normalizedNotes.some((n) => n.midiNumber === 60) ? '#475569' : '#1e293b'}
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <text x={leftMargin - 22} y="138" fill="#475569" fontSize="9" fontFamily="monospace">
          C4
        </text>

        {/* 2. CLAVE DE FA (5 Líneas inferiores: 170, 185, 200, 215, 230) */}
        {[170, 185, 200, 215, 230].map((y, i) => (
          <line
            key={`bass-${i}`}
            x1={leftMargin - 25}
            y1={y}
            x2={width - rightMargin}
            y2={y}
            stroke="#334155"
            strokeWidth="1.5"
          />
        ))}
        {/* Símbolo Clave de Fa */}
        <text x="68" y="205" fill="#cbd5e1" fontSize="34" fontFamily="serif">
          𝄢
        </text>

        {/* Líneas divisorias de compás */}
        <line
          x1={leftMargin - 25}
          y1="50"
          x2={leftMargin - 25}
          y2="230"
          stroke="#94a3b8"
          strokeWidth="2.5"
        />
        <line
          x1={width - rightMargin}
          y1="50"
          x2={width - rightMargin}
          y2="230"
          stroke="#94a3b8"
          strokeWidth="2.5"
        />

        {/* Cabecera de pasos rítmicos */}
        {Array.from({ length: safeTotalSteps }).map((_, stepIdx) => {
          const isSelected = activeStepInput === stepIdx;
          const rhythmLabel = getStepLabel(stepIdx, activeSubdivision, beatsPerBar);
          return (
            <g
              key={stepIdx}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStep(stepIdx);
              }}
            >
              <text
                x={getXForStep(stepIdx)}
                y="22"
                textAnchor="middle"
                fill={isSelected ? '#22d3ee' : '#64748b'}
                fontSize="11"
                fontWeight={isSelected ? 'bold' : 'normal'}
                fontFamily="monospace"
              >
                {stepIdx + 1}
              </text>
              <text
                x={getXForStep(stepIdx)}
                y="34"
                textAnchor="middle"
                fill={isSelected ? '#fbbf24' : '#475569'}
                fontSize="9"
                fontWeight={isSelected ? 'bold' : 'normal'}
                fontFamily="monospace"
              >
                {rhythmLabel}
              </text>
            </g>
          );
        })}

        {/* Renderizado de Notas */}
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

              {/* Línea adicional para Do Central C4 */}
              {n.midiNumber === 60 && (
                <line
                  x1={cx - 12}
                  y1="135"
                  x2={cx + 12}
                  y2="135"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
              )}

              {/* Líneas adicionales superiores o inferiores extremas */}
              {(cy < 42 || cy > 238) && (
                <line
                  x1={cx - 12}
                  y1={cy}
                  x2={cx + 12}
                  y2={cy}
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
              )}

              {/* Símbolo de sostenido si es tecla negra */}
              {isSharp && (
                <text
                  x={cx - 14}
                  y={cy + 4}
                  fill="#fbbf24"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="serif"
                >
                  ♯
                </text>
              )}

              {/* Plica vertical */}
              <line
                x1={isTreble ? cx + 6 : cx - 6}
                y1={cy}
                x2={isTreble ? cx + 6 : cx - 6}
                y2={isTreble ? cy - 28 : cy + 28}
                stroke="#f59e0b"
                strokeWidth="2"
              />

              {/* Cabeza ovalada de la nota */}
              <ellipse
                cx={cx}
                cy={cy}
                rx="7"
                ry="5"
                transform={`rotate(-20 ${cx} ${cy})`}
                fill="#f59e0b"
              />

              {/* Etiqueta miniatura de la nota */}
              <text
                x={cx}
                y={isTreble ? cy + 14 : cy - 9}
                textAnchor="middle"
                fill="#fde68a"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {noteLabel}
              </text>
            </g>
          );
        })}

        {/* Cursor del Escáner de Reproducción */}
        <line
          x1={getXForStep(effectiveCursorStep)}
          y1="40"
          x2={getXForStep(effectiveCursorStep)}
          y2="240"
          stroke="#22d3ee"
          strokeWidth="2.5"
          filter="drop-shadow(0 0 6px rgba(34, 211, 238, 0.8))"
          className="pointer-events-none transition-all duration-75 ease-linear"
        />
      </svg>

      {/* Pie informativo de interacción */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 mt-2 px-2 border-t border-slate-800/80 pt-2">
        <span>
          💡 Haz clic en cualquier línea o espacio del pentagrama para añadir/quitar notas (C4 y superiores en Clave de Sol; B3 e inferiores en Clave de Fa).
        </span>
        <span className="font-mono text-slate-400">
          Notas en este compás: <strong className="text-amber-400">{normalizedNotes.length}</strong>
        </span>
      </div>
    </div>
  );
}

export default PianoGrandStaffView;

