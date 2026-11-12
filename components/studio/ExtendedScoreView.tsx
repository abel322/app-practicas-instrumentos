'use client';

import React, { useRef, useEffect } from 'react';

export interface ScoreNote {
  id?: string;
  stepIndex: number;
  midiNumber: number;
  duration?: string;
  velocity?: number;
  isRest?: boolean;
}

export interface ScoreMeasure {
  measureIndex: number;
  notes: ScoreNote[];
}

export interface ExtendedScoreViewProps {
  measures: ScoreMeasure[];
  activeMeasureIndex: number;
  currentStep: number;
  stepsPerMeasure?: number;
  isPlaying: boolean;
  /** Referencia mutable con el paso global fraccionario continuo (ej. 18.42) actualizado en rAF */
  continuousStepRef?: React.MutableRefObject<number>;
  onSelectMeasureAndStep?: (measureIndex: number, stepIndex: number) => void;
  onNoteClick?: (measureIndex: number, midiNumber: number) => void;
}

const SEMITONE_TO_DIATONIC: Record<number, { step: number; isAccidental: boolean; name: string }> = {
  0: { step: 0, isAccidental: false, name: 'C' },
  1: { step: 0, isAccidental: true, name: 'C#' },
  2: { step: 1, isAccidental: false, name: 'D' },
  3: { step: 1, isAccidental: true, name: 'D#' },
  4: { step: 2, isAccidental: false, name: 'E' },
  5: { step: 3, isAccidental: false, name: 'F' },
  6: { step: 3, isAccidental: true, name: 'F#' },
  7: { step: 4, isAccidental: false, name: 'G' },
  8: { step: 4, isAccidental: true, name: 'G#' },
  9: { step: 5, isAccidental: false, name: 'A' },
  10: { step: 5, isAccidental: true, name: 'A#' },
  11: { step: 6, isAccidental: false, name: 'B' },
};

const LINE_SPACING = 22;
const STEP_SPACING = 11;
const BASE_MIDDLE_C_Y = 165;
const MIDDLE_C_DIATONIC = 4 * 7 + 0; // C4 = 28
const SVG_HEIGHT = 330;
const CLEF_PANEL_WIDTH = 78;
const MEASURE_WIDTH = 440;
const RIGHT_PADDING = 40;

export function getDiatonicY(midi: number, systemOffsetY: number = 0) {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const info = SEMITONE_TO_DIATONIC[semitone];
  const absoluteIndex = octave * 7 + (info?.step ?? 0);
  const offset = absoluteIndex - MIDDLE_C_DIATONIC;
  return systemOffsetY + BASE_MIDDLE_C_Y - offset * STEP_SPACING;
}

const ExtendedScoreViewComponent: React.FC<ExtendedScoreViewProps> = ({
  measures,
  activeMeasureIndex,
  currentStep,
  stepsPerMeasure = 16,
  isPlaying,
  continuousStepRef,
  onSelectMeasureAndStep,
  onNoteClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<SVGLineElement>(null);

  const safeMeasures = measures.length > 0 ? measures : [{ measureIndex: 0, notes: [] }];
  const totalWidth = safeMeasures.length * MEASURE_WIDTH + RIGHT_PADDING;

  const trebleLines = [55, 77, 99, 121, 143];
  const bassLines = [187, 209, 231, 253, 275];

  // Posición inicial fija para no reiniciar x1 en el JSX durante re-renders
  const initialPlayheadX = useRef(
    activeMeasureIndex * MEASURE_WIDTH + ((currentStep + 0.5) / stepsPerMeasure) * MEASURE_WIDTH
  ).current;

  // Bucle de interpolación visual continua a 60/120fps (cero saltos, cero re-renders de React)
  useEffect(() => {
    if (!isPlaying) return;
    let rafId: number;

    const animatePlayhead = () => {
      const exactGlobalStep = continuousStepRef
        ? continuousStepRef.current
        : activeMeasureIndex * stepsPerMeasure + currentStep;

      const measureFloat = exactGlobalStep / stepsPerMeasure;
      const playheadX = measureFloat * MEASURE_WIDTH;

      if (playheadRef.current) {
        playheadRef.current.setAttribute('x1', String(playheadX));
        playheadRef.current.setAttribute('x2', String(playheadX));
      }

      // Desplazamiento horizontal continuo sin animaciones CSS conflictivas
      const container = scrollContainerRef.current;
      if (container) {
        const viewportWidth = container.clientWidth;
        const maxScroll = Math.max(0, container.scrollWidth - viewportWidth);
        const targetScrollLeft = Math.min(maxScroll, Math.max(0, playheadX - viewportWidth * 0.32));
        const currentScroll = container.scrollLeft;

        // Si reinicia al inicio del ejercicio, saltar limpio a 0; si avanza, interpolar suavemente
        if (targetScrollLeft < currentScroll - viewportWidth * 0.4) {
          container.scrollLeft = targetScrollLeft;
        } else {
          container.scrollLeft = currentScroll + (targetScrollLeft - currentScroll) * 0.2;
        }
      }

      rafId = requestAnimationFrame(animatePlayhead);
    };

    rafId = requestAnimationFrame(animatePlayhead);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, continuousStepRef, stepsPerMeasure, activeMeasureIndex, currentStep]);

  // Al detenerse o al presionar Stop (cuando isPlaying pasa a false)
  useEffect(() => {
    if (!isPlaying) {
      const resetX =
        activeMeasureIndex * MEASURE_WIDTH + ((currentStep + 0.5) / stepsPerMeasure) * MEASURE_WIDTH;
      if (playheadRef.current) {
        playheadRef.current.setAttribute('x1', String(resetX));
        playheadRef.current.setAttribute('x2', String(resetX));
      }
      if (activeMeasureIndex === 0 && currentStep === 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
    }
  }, [isPlaying, activeMeasureIndex, currentStep, stepsPerMeasure]);

  return (
    <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex">
      {/* Panel Izquierdo Fijo con Llave, Clave de Sol y Clave de Fa */}
      <div
        className="shrink-0 bg-slate-950 border-r border-slate-800/80 z-10 select-none"
        style={{ width: CLEF_PANEL_WIDTH }}
      >
        <svg viewBox={`0 0 ${CLEF_PANEL_WIDTH} ${SVG_HEIGHT}`} className="w-full h-[310px] block">
          {/* Llave orquestal */}
          <line x1={68} y1={55} x2={68} y2={275} stroke="#64748b" strokeWidth="4" />
          <path
            d={`M 68 55 Q 52 ${BASE_MIDDLE_C_Y} 68 ${BASE_MIDDLE_C_Y} Q 52 ${BASE_MIDDLE_C_Y} 68 275`}
            fill="none"
            stroke="#64748b"
            strokeWidth="2.2"
          />

          {/* Clave de Sol */}
          <text x={14} y={136} fill="#cbd5e1" fontSize="62" fontFamily="serif">
            𝄞
          </text>
          {/* Clave de Fa */}
          <text x={16} y={232} fill="#cbd5e1" fontSize="46" fontFamily="serif">
            𝄢
          </text>

          {/* Continuidad de líneas en el margen de claves */}
          {trebleLines.map((y, i) => (
            <line key={`ct-${i}`} x1={68} y1={y} x2={CLEF_PANEL_WIDTH} y2={y} stroke="#475569" strokeWidth="1.6" />
          ))}
          {bassLines.map((y, i) => (
            <line key={`cb-${i}`} x1={68} y1={y} x2={CLEF_PANEL_WIDTH} y2={y} stroke="#475569" strokeWidth="1.6" />
          ))}
        </svg>
      </div>

      {/* Cinta Horizontal Desplazable de Todos los Compases */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar"
      >
        <svg
          viewBox={`0 0 ${totalWidth} ${SVG_HEIGHT}`}
          style={{ width: totalWidth, height: 310 }}
          className="block select-none font-sans"
        >
          {/* 5 Líneas Continuas de Clave de Sol */}
          {trebleLines.map((y, i) => (
            <line
              key={`treble-line-${i}`}
              x1={0}
              y1={y}
              x2={totalWidth - RIGHT_PADDING}
              y2={y}
              stroke="#475569"
              strokeWidth="1.6"
            />
          ))}

          {/* Línea Guía Punteada para Do Central (C4) */}
          <line
            x1={0}
            y1={BASE_MIDDLE_C_Y}
            x2={totalWidth - RIGHT_PADDING}
            y2={BASE_MIDDLE_C_Y}
            stroke="#334155"
            strokeDasharray="4 6"
            strokeWidth="1.1"
          />

          {/* 5 Líneas Continuas de Clave de Fa */}
          {bassLines.map((y, i) => (
            <line
              key={`bass-line-${i}`}
              x1={0}
              y1={y}
              x2={totalWidth - RIGHT_PADDING}
              y2={y}
              stroke="#475569"
              strokeWidth="1.6"
            />
          ))}

          {/* Renderizado Horizontal de Cada Compás (Compás 1 -> Compás N) */}
          {safeMeasures.map((measure, mIdx) => {
            const mStartX = mIdx * MEASURE_WIDTH;
            const mEndX = mStartX + MEASURE_WIDTH;
            const isSelected = activeMeasureIndex === mIdx;

            return (
              <g key={`h-measure-${mIdx}`}>
                {/* Área clicable del compás */}
                <rect
                  x={mStartX}
                  y={40}
                  width={MEASURE_WIDTH}
                  height={250}
                  fill={isSelected ? 'rgba(56, 189, 248, 0.04)' : 'transparent'}
                  className="cursor-pointer hover:fill-cyan-500/5"
                  onClick={() => onSelectMeasureAndStep?.(mIdx, 0)}
                />

                {/* Guías sutiles de los 4 tiempos del compás */}
                {[1, 2, 3].map((beat) => {
                  const beatX = mStartX + (beat / 4) * MEASURE_WIDTH;
                  return (
                    <line
                      key={`beat-${mIdx}-${beat}`}
                      x1={beatX}
                      y1={55}
                      x2={beatX}
                      y2={275}
                      stroke="#1e293b"
                      strokeDasharray="3 5"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Número de compás en cabecera */}
                <text
                  x={mStartX + 10}
                  y={36}
                  fill={isSelected ? '#38bdf8' : '#94a3b8'}
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="ui-monospace, monospace"
                >
                  Compás {mIdx + 1}
                </text>

                {/* Barra divisoria vertical al final del compás */}
                <line
                  x1={mEndX}
                  y1={55}
                  x2={mEndX}
                  y2={275}
                  stroke="#64748b"
                  strokeWidth="2"
                />

                {/* Notas del compás */}
                {(measure.notes || []).map((note, nIdx) => {
                  if (note.isRest) return null;

                  const noteX = mStartX + ((note.stepIndex + 0.5) / stepsPerMeasure) * MEASURE_WIDTH;
                  const noteY = getDiatonicY(note.midiNumber);
                  const isTreble = note.midiNumber >= 60;
                  const semitone = ((note.midiNumber % 12) + 12) % 12;
                  const isAccidental = SEMITONE_TO_DIATONIC[semitone]?.isAccidental ?? false;

                  const ledgerLines: number[] = [];
                  if (note.midiNumber === 60 || note.midiNumber === 61) {
                    ledgerLines.push(BASE_MIDDLE_C_Y);
                  } else if (noteY < 55) {
                    for (let lY = 55 - LINE_SPACING; lY >= noteY - 5; lY -= LINE_SPACING) {
                      ledgerLines.push(lY);
                    }
                  } else if (noteY > 275) {
                    for (let lY = 275 + LINE_SPACING; lY <= noteY + 5; lY += LINE_SPACING) {
                      ledgerLines.push(lY);
                    }
                  }

                  return (
                    <g
                      key={`h-note-${mIdx}-${nIdx}`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNoteClick?.(mIdx, note.midiNumber);
                      }}
                    >
                      {ledgerLines.map((lY, lIdx) => (
                        <line
                          key={lIdx}
                          x1={noteX - 13}
                          y1={lY}
                          x2={noteX + 13}
                          y2={lY}
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                      ))}

                      {isAccidental && (
                        <text
                          x={noteX - 16}
                          y={noteY + 5}
                          fill="#f59e0b"
                          fontSize="15"
                          fontWeight="bold"
                          fontFamily="serif"
                        >
                          ♯
                        </text>
                      )}

                      <line
                        x1={isTreble ? noteX + 7.5 : noteX - 7.5}
                        y1={noteY}
                        x2={isTreble ? noteX + 7.5 : noteX - 7.5}
                        y2={isTreble ? noteY - 32 : noteY + 32}
                        stroke="#f59e0b"
                        strokeWidth="2.1"
                      />

                      <ellipse
                        cx={noteX}
                        cy={noteY}
                        rx="8.5"
                        ry="6.4"
                        transform={`rotate(-20 ${noteX} ${noteY})`}
                        fill="#f59e0b"
                        stroke="#d97706"
                        strokeWidth="1.1"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Doble barra final al término del último compás */}
          <line
            x1={totalWidth - RIGHT_PADDING - 5}
            y1={55}
            x2={totalWidth - RIGHT_PADDING - 5}
            y2={275}
            stroke="#64748b"
            strokeWidth="4"
          />

          {/* Barra vertical continua del cursor (sin CSS transition para 60/120fps puros) */}
          <line
            ref={playheadRef}
            x1={initialPlayheadX}
            y1={45}
            x2={initialPlayheadX}
            y2={290}
            stroke="#22d3ee"
            strokeWidth="2.5"
            filter="drop-shadow(0 0 8px rgba(34, 211, 238, 0.95))"
            className="pointer-events-none"
          />
        </svg>
      </div>
    </div>
  );
};

// Exportar memoizado para bloquear re-renders durante la reproducción
export const ExtendedScoreView = React.memo(
  ExtendedScoreViewComponent,
  (prevProps, nextProps) => {
    // Mientras está reproduciendo, evitar re-renders por cambios de step/measure;
    // el cursor y el scroll se mueven a 60/120fps por continuousStepRef
    if (prevProps.isPlaying && nextProps.isPlaying) {
      return (
        prevProps.measures === nextProps.measures &&
        prevProps.stepsPerMeasure === nextProps.stepsPerMeasure
      );
    }
    return (
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.activeMeasureIndex === nextProps.activeMeasureIndex &&
      prevProps.currentStep === nextProps.currentStep &&
      prevProps.measures === nextProps.measures &&
      prevProps.stepsPerMeasure === nextProps.stepsPerMeasure
    );
  }
);

export default ExtendedScoreView;
