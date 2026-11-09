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

// Mapeo diatónico natural: C=0, D=1, E=2, F=3, G=4, A=5, B=6
const SEMITONE_TO_DIATONIC: Record<number, { step: number; isAccidental: boolean; name: string }> = {
  0:  { step: 0, isAccidental: false, name: 'C' },  // Do
  1:  { step: 0, isAccidental: true,  name: 'C#' }, // Do#
  2:  { step: 1, isAccidental: false, name: 'D' },  // Re
  3:  { step: 1, isAccidental: true,  name: 'D#' }, // Re#
  4:  { step: 2, isAccidental: false, name: 'E' },  // Mi
  5:  { step: 3, isAccidental: false, name: 'F' },  // Fa
  6:  { step: 3, isAccidental: true,  name: 'F#' }, // Fa#
  7:  { step: 4, isAccidental: false, name: 'G' },  // Sol
  8:  { step: 4, isAccidental: true,  name: 'G#' }, // Sol#
  9:  { step: 5, isAccidental: false, name: 'A' },  // La
  10: { step: 5, isAccidental: true,  name: 'A#' }, // La#
  11: { step: 6, isAccidental: false, name: 'B' },  // Si
};

// Mapeo inverso de grado diatónico (0..6) a semitono natural dentro de la octava
const DIATONIC_TO_SEMITONE = [0, 2, 4, 5, 7, 9, 11];

// Altura exacta de las 5 líneas de cada pentagrama (separación de 24px entre líneas)
// Clave de Sol:
// Línea 5 (F5) = 55
// Línea 4 (D5) = 79
// Línea 3 (B4) = 103
// Línea 2 (G4 / Sol4) = 127  <-- ¡Segunda línea garantizada para SOL!
// Línea 1 (E4 / Mi4) = 151
//
// Línea Adicional Central (C4 / Do4 = Do Central):
// y = 175 (exactamente a 24px debajo de E4)
//
// Clave de Fa:
// Línea 5 (A3 / La3) = 199 (a 24px debajo de C4)
// Línea 4 (F3 / Fa3) = 223   <-- ¡Cuarta línea garantizada para FA!
// Línea 3 (D3 / Re3) = 247
// Línea 2 (B2 / Si2) = 271
// Línea 1 (G2 / Sol2) = 295

const LINE_SPACING = 24;
const STEP_SPACING = LINE_SPACING / 2; // 12px por grado diatónico (línea -> espacio -> línea)
const MIDDLE_C_Y = 175; // Altura de C4 (Do Central / MIDI 60)
const MIDDLE_C_DIATONIC = 4 * 7 + 0; // Octava 4, Grado 0 = 28

export function getDiatonicInfo(midi: number) {
  const octave = Math.floor(midi / 12) - 1;
  const semitoneInOctave = ((midi % 12) + 12) % 12;
  const info = SEMITONE_TO_DIATONIC[semitoneInOctave];
  const absoluteDiatonicIndex = octave * 7 + info.step;
  const diatonicOffset = absoluteDiatonicIndex - MIDDLE_C_DIATONIC;

  // Cada grado diatónico hacia arriba resta 12px en Y; hacia abajo suma 12px
  const y = MIDDLE_C_Y - diatonicOffset * STEP_SPACING;

  return {
    y,
    name: `${info.name}${octave}`,
    isAccidental: info.isAccidental,
    octave,
    step: info.step,
  };
}

const OCTAVES = [
  { num: 1, label: 'C1 - B1 (Subgrave)', baseMidi: 24, clefHint: 'Clave Fa' },
  { num: 2, label: 'C2 - B2 (Bajos Profundos)', baseMidi: 36, clefHint: 'Clave Fa' },
  { num: 3, label: 'C3 - B3 (Medios Graves)', baseMidi: 48, clefHint: 'Clave Fa' },
  { num: 4, label: 'C4 - B4 (Central)', baseMidi: 60, clefHint: 'Centro / Sol' },
  { num: 5, label: 'C5 - B5 (Agudos Medios)', baseMidi: 72, clefHint: 'Clave Sol' },
  { num: 6, label: 'C6 - B6 (Altos)', baseMidi: 84, clefHint: 'Clave Sol' },
  { num: 7, label: 'C7 - B7 (Sobreagudos)', baseMidi: 96, clefHint: 'Clave Sol' },
  { num: 8, label: 'C8 (Extremo Superior)', baseMidi: 108, clefHint: 'Clave Sol' },
];

const NOTE_NAMES = [
  { name: 'Do', offset: 0 },
  { name: 'Re', offset: 2 },
  { name: 'Mi', offset: 4 },
  { name: 'Fa', offset: 5 },
  { name: 'Sol', offset: 7 },
  { name: 'La', offset: 9 },
  { name: 'Si', offset: 11 },
];

const SHARP_NOTES = [
  { name: 'Do#', offset: 1 },
  { name: 'Re#', offset: 3 },
  { name: 'Fa#', offset: 6 },
  { name: 'Sol#', offset: 8 },
  { name: 'La#', offset: 10 },
];

/**
 * Generador de etiquetas rítmicas musicales según la cantidad de pasos o subdivisión activa:
 * - 8 pasos (1/8 Corcheas): 1, y, 2, y, 3, y, 4, y
 * - 4 pasos (1/4 Negras): 1, 2, 3, 4
 * - 12 pasos (1/8T Tresillos): 1, ti, ta, 2, ti, ta, 3, ti, ta, 4, ti, ta
 * - 16 pasos (1/16 Semicorcheas): 1, e, &, a, 2, e, &, a, 3, e, &, a, 4, e, &, a
 */
export const getStepLabels = (
  steps: number,
  subdivision?: string,
  beatsPerBar: number = 4
): string[] => {
  if (steps === 8) return ['1', 'y', '2', 'y', '3', 'y', '4', 'y'];
  if (steps === 4) return ['1', '2', '3', '4'];
  if (steps === 12) {
    return ['1', 'ti', 'ta', '2', 'ti', 'ta', '3', 'ti', 'ta', '4', 'ti', 'ta'];
  }
  if (steps === 16) {
    return ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'];
  }
  return Array.from({ length: steps }, (_, idx) =>
    getStepLabel(idx, subdivision || '1/16', beatsPerBar)
  );
};

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
  const [selectedOctave, setSelectedOctave] = useState<number>(4); // Octava activa (1 a 8)
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dimensiones del lienzo SVG optimizadas para llenar la pantalla
  const width = 960;
  const baseHeight = 365;
  const leftMargin = 100; // Espacio protegido para claves grandes
  const rightMargin = 35;
  const usableWidth = width - leftMargin - rightMargin;
  const safeTotalSteps = Math.max(1, totalSteps);
  const stepWidth = usableWidth / safeTotalSteps;

  const trebleLines = [55, 79, 103, 127, 151]; // F5, D5, B4, G4, E4
  const bassLines = [199, 223, 247, 271, 295]; // A3, F3, D3, B2, G2

  const beatsPerBar = useMemo(() => {
    return parseInt(timeSignature.split('/')[0], 10) || 4;
  }, [timeSignature]);

  const stepLabels = useMemo(
    () => getStepLabels(safeTotalSteps, activeSubdivision, beatsPerBar),
    [safeTotalSteps, activeSubdivision, beatsPerBar]
  );

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

  // Ajustar dinámicamente el viewBox vertical si existen notas en registros extremos (C1, C7, C8)
  const { viewBoxMinY, viewBoxHeight } = useMemo(() => {
    if (normalizedNotes.length === 0) {
      return { viewBoxMinY: 0, viewBoxHeight: baseHeight };
    }
    const ys = normalizedNotes.map((n) => getDiatonicInfo(n.midiNumber).y);
    const minNoteY = Math.min(...ys);
    const maxNoteY = Math.max(...ys);

    const topBound = Math.min(0, Math.floor(minNoteY - 48));
    const bottomBound = Math.max(baseHeight, Math.ceil(maxNoteY + 48));
    return {
      viewBoxMinY: topBound,
      viewBoxHeight: bottomBound - topBound,
    };
  }, [normalizedNotes]);

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

    const relativeY = viewBoxMinY + (clickY / rect.height) * viewBoxHeight;
    // Calcular el grado diatónico pulsado respecto a C4 (MIDDLE_C_Y = 175)
    const clickedDiatonicOffset = Math.round((MIDDLE_C_Y - relativeY) / STEP_SPACING);
    const targetDiatonicIndex = MIDDLE_C_DIATONIC + clickedDiatonicOffset;
    const targetOctave = Math.floor(targetDiatonicIndex / 7);
    const targetDiatonicStep = ((targetDiatonicIndex % 7) + 7) % 7;
    const estimatedMidi = Math.max(
      24,
      Math.min(108, (targetOctave + 1) * 12 + DIATONIC_TO_SEMITONE[targetDiatonicStep])
    );

    pianoPreviewSynth.playNote(estimatedMidi, 0.35, 95);
    onToggleNote(clickedStep, estimatedMidi, 100);
  };

  const handleTouchNoteInput = (midiNumber: number) => {
    const clampedMidi = Math.max(24, Math.min(108, midiNumber));
    pianoPreviewSynth.playNote(clampedMidi, 0.35, 95);
    onToggleNote(activeStepInput, clampedMidi, 100);
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

  const activeOctaveMeta = useMemo(
    () => OCTAVES.find((o) => o.num === selectedOctave) || OCTAVES[3],
    [selectedOctave]
  );

  const activeStepRhythmLabel = stepLabels[activeStepInput] || `${activeStepInput + 1}`;

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
            • Rango Concierto C1–C8 • Mano Derecha: Clave de Sol | Mano Izquierda: Clave de Fa
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
                Paso #{activeStepInput + 1} ({activeStepRhythmLabel})
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
              Paso activo: #{activeStepInput + 1} ({activeStepRhythmLabel})
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

      {/* Lienzo SVG del Gran Pentagrama con Mapeo Diatónico Exacto */}
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center select-none overflow-hidden">
        <svg
          viewBox={`0 ${viewBoxMinY} ${width} ${viewBoxHeight}`}
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
            height="268"
            fill="rgba(34, 211, 238, 0.06)"
            stroke="rgba(34, 211, 238, 0.22)"
            strokeWidth="1"
            rx="4"
          />

          {/* ============================================================ */}
          {/* 1. ESTRUCTURA Y CLAVES GRANDES                               */}
          {/* ============================================================ */}
          {/* Corchete / Llave de unión a la izquierda */}
          <line
            x1={leftMargin - 30}
            y1="55"
            x2={leftMargin - 30}
            y2="295"
            stroke="#94a3b8"
            strokeWidth="4.5"
          />
          <path
            d={`M ${leftMargin - 30} 55 Q ${leftMargin - 45} 175 ${leftMargin - 30} 175 Q ${leftMargin - 45} 175 ${leftMargin - 30} 295`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          {/* Líneas de Clave de Sol */}
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
          {/* Clave de Sol centrada exactamente con su bucle envolviendo la 2ª línea (G4 = 127) */}
          <text x="65" y="145" fill="#cbd5e1" fontSize="66" fontFamily="serif">
            𝄞
          </text>

          {/* Línea guía punteada para Do Central C4 (y = 175) */}
          <line
            x1={leftMargin - 15}
            y1={MIDDLE_C_Y}
            x2={width - rightMargin}
            y2={MIDDLE_C_Y}
            stroke="#334155"
            strokeDasharray="4 6"
            strokeWidth="1.5"
          />

          {/* Líneas de Clave de Fa */}
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
          {/* Clave de Fa con sus dos puntos abrazando la 4ª línea (F3 = 223) */}
          <text x="66" y="246" fill="#cbd5e1" fontSize="50" fontFamily="serif">
            𝄢
          </text>

          {/* Barras divisorias verticales de inicio y fin */}
          <line
            x1={leftMargin - 30}
            y1="55"
            x2={leftMargin - 30}
            y2="295"
            stroke="#94a3b8"
            strokeWidth="3"
          />
          <line
            x1={width - rightMargin}
            y1="55"
            x2={width - rightMargin}
            y2="295"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          {/* ============================================================ */}
          {/* 2. CABECERA DE PASOS RÍTMICOS MUSICALES (1 e & a / 1 y 2 y)  */}
          {/* ============================================================ */}
          {stepLabels.map((lbl, stepIdx) => {
            const cx = getXForStep(stepIdx);
            const isSelected = activeStepInput === stepIdx;
            const isMainBeat = !isNaN(Number(lbl)); // Tiempos 1, 2, 3, 4

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
                  y1={isMainBeat ? 26 : 32}
                  x2={cx}
                  y2="42"
                  stroke={isSelected ? '#22d3ee' : isMainBeat ? '#64748b' : '#334155'}
                  strokeWidth={isSelected ? '2' : isMainBeat ? '1.5' : '1'}
                />
                <text
                  x={cx}
                  y={isMainBeat ? 22 : 24}
                  textAnchor="middle"
                  fill={isSelected ? '#22d3ee' : isMainBeat ? '#f8fafc' : '#64748b'}
                  fontSize={isMainBeat ? '14' : '11'}
                  fontWeight={isMainBeat ? '900' : '600'}
                  fontFamily="ui-monospace, monospace"
                >
                  {lbl}
                </text>
              </g>
            );
          })}

          {/* ============================================================ */}
          {/* 3. RENDERIZADO DE CABEZAS DE NOTA, ACCIDENTALES Y LEDGERS    */}
          {/* ============================================================ */}
          {normalizedNotes.map((n, idx) => {
            const cx = getXForStep(n.stepIndex);
            const { y: cy, isAccidental, name } = getDiatonicInfo(n.midiNumber);
            const isTreble = n.midiNumber >= 60;

            // Determinar líneas adicionales necesarias
            const ledgerLines: number[] = [];

            // Do Central (C4 / C#4 = 175)
            if (n.midiNumber === 60 || n.midiNumber === 61) {
              ledgerLines.push(MIDDLE_C_Y);
            }
            // Notas por encima de la 5ª línea de Sol (y < 55)
            else if (cy < 55) {
              for (let lY = 55 - LINE_SPACING; lY >= cy - 6; lY -= LINE_SPACING) {
                ledgerLines.push(lY);
              }
            }
            // Notas por debajo de la 1ª línea de Fa (y > 295)
            else if (cy > 295) {
              for (let lY = 295 + LINE_SPACING; lY <= cy + 6; lY += LINE_SPACING) {
                ledgerLines.push(lY);
              }
            }

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
                <title>{`${name} (MIDI ${n.midiNumber}) - Paso #${n.stepIndex + 1}`}</title>

                {/* Líneas adicionales si la nota está fuera de las 5 líneas */}
                {ledgerLines.map((lY, lIdx) => (
                  <line
                    key={lIdx}
                    x1={cx - 16}
                    y1={lY}
                    x2={cx + 16}
                    y2={lY}
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                  />
                ))}

                {/* Accidental si es sostenido (#) */}
                {isAccidental && (
                  <text
                    x={cx - 18}
                    y={cy + 5}
                    fill="#f59e0b"
                    fontSize="18"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    ♯
                  </text>
                )}

                {/* Plica vertical */}
                <line
                  x1={isTreble ? cx + 9 : cx - 9}
                  y1={cy}
                  x2={isTreble ? cx + 9 : cx - 9}
                  y2={isTreble ? cy - 36 : cy + 36}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Cabeza de la nota */}
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

                {/* Etiqueta de la nota debajo para verificación pedagógica */}
                <text
                  x={cx}
                  y={isTreble ? cy + 18 : cy - 14}
                  textAnchor="middle"
                  fill="#fde68a"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {name}
                </text>
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
            y2="310"
            stroke="#22d3ee"
            strokeWidth="3"
            filter="drop-shadow(0 0 8px rgba(34, 211, 238, 0.9))"
            className="pointer-events-none transition-all duration-75 ease-linear"
          />
        </svg>
      </div>

      {/* Panel Táctil Rápido: Teclado de Entrada Asistida con Rango Completo C1 a C8 */}
      <div className="w-full mt-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300">
              🎹 Tocar Nota en Paso{' '}
              <span className="text-cyan-400 font-mono">
                #{activeStepInput + 1} ({activeStepRhythmLabel})
              </span>
              :
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-300">
              {activeOctaveMeta.label} • {activeOctaveMeta.clefHint}
            </span>
          </div>

          {/* Barra de Selección de Octava Completa (C1 a C8) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-slate-400 mr-1 shrink-0">OCTAVA:</span>
            {OCTAVES.map((oct) => (
              <button
                key={oct.num}
                type="button"
                onClick={() => setSelectedOctave(oct.num)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedOctave === oct.num
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
                title={oct.label}
              >
                C{oct.num}
              </button>
            ))}
          </div>
        </div>

        {/* Fila de Teclas Blancas (Do a Si) y Sostenidos para la Octava Seleccionada */}
        <div className="w-full flex flex-col gap-1.5">
          {/* Teclas Naturales Grandes (Do, Re, Mi, Fa, Sol, La, Si) */}
          <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            {NOTE_NAMES.map((noteItem) => {
              const currentMidi = activeOctaveMeta.baseMidi + noteItem.offset;
              if (currentMidi > 108) return null; // C8 es el tope superior del piano de 88 teclas
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
                  className={`h-14 flex-1 min-w-[44px] max-w-[76px] rounded-xl flex flex-col justify-end items-center pb-1.5 text-xs font-bold border transition-all active:scale-95 shadow-md ${
                    isNoteActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  }`}
                >
                  <span>{noteItem.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">
                    {selectedOctave}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Teclas Negras / Sostenidos de la Octava Activa */}
          {selectedOctave < 8 && (
            <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
              {SHARP_NOTES.map((sharpItem) => {
                const currentMidi = activeOctaveMeta.baseMidi + sharpItem.offset;
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
                    className={`h-8 px-3 rounded-lg flex items-center gap-1 text-[10px] font-bold border transition-all active:scale-95 ${
                      isNoteActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span>{sharpItem.name}</span>
                    <span className="text-[9px] opacity-60 font-mono">
                      {selectedOctave}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PianoGrandStaffView;
