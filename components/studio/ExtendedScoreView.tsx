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
  isPlaying: boolean;
  stepsPerMeasure?: number;
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

const LINE_SPACING = 24;
const STEP_SPACING = 12;
const BASE_MIDDLE_C_Y = 175;
const MIDDLE_C_DIATONIC = 4 * 7 + 0; // C4 = 28
const SYSTEM_HEIGHT = 330; // Altura de cada sistema de 2 pentagramas
const SVG_WIDTH = 980;
const LEFT_MARGIN = 85;
const RIGHT_MARGIN = 25;
const MEASURES_PER_SYSTEM = 2;

export function getDiatonicY(midi: number, systemOffsetY: number) {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const info = SEMITONE_TO_DIATONIC[semitone];
  const absoluteIndex = octave * 7 + info.step;
  const offset = absoluteIndex - MIDDLE_C_DIATONIC;
  return systemOffsetY + BASE_MIDDLE_C_Y - (offset * STEP_SPACING);
}

export const ExtendedScoreView: React.FC<ExtendedScoreViewProps> = ({
  measures,
  activeMeasureIndex,
  currentStep,
  isPlaying,
  stepsPerMeasure = 16,
  onSelectMeasureAndStep,
  onNoteClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<SVGLineElement>(null);

  const totalSystems = Math.max(1, Math.ceil(measures.length / MEASURES_PER_SYSTEM));
  const totalSvgHeight = totalSystems * SYSTEM_HEIGHT + 40;
  const usableWidth = SVG_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
  const measureWidth = usableWidth / MEASURES_PER_SYSTEM;
  const spm = stepsPerMeasure || 16;

  // Auto-scroll para seguir el cursor en obras largas
  useEffect(() => {
    if (isPlaying && playheadRef.current && containerRef.current) {
      const activeSystem = Math.floor(activeMeasureIndex / MEASURES_PER_SYSTEM);
      const targetScroll = activeSystem * SYSTEM_HEIGHT - 60;
      containerRef.current.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }, [activeMeasureIndex, isPlaying]);

  // Cálculo de coordenadas del cursor de reproducción
  const activeSystem = Math.floor(activeMeasureIndex / MEASURES_PER_SYSTEM);
  const measureInSystem = activeMeasureIndex % MEASURES_PER_SYSTEM;
  const systemBaseY = activeSystem * SYSTEM_HEIGHT;
  const currentMeasureStartX = LEFT_MARGIN + measureInSystem * measureWidth;
  const playheadX = currentMeasureStartX + (currentStep + 0.5) * (measureWidth / spm);

  return (
    <div
      ref={containerRef}
      className="w-full max-h-[640px] overflow-y-auto overflow-x-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-4 no-scrollbar"
    >
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${totalSvgHeight}`}
        className="w-full h-auto select-none font-sans"
      >
        {Array.from({ length: totalSystems }).map((_, systemIdx) => {
          const sysY = systemIdx * SYSTEM_HEIGHT + 20;
          const trebleLines = [55, 79, 103, 127, 151].map((y) => sysY + y);
          const bassLines = [199, 223, 247, 271, 295].map((y) => sysY + y);
          const middleCY = sysY + BASE_MIDDLE_C_Y;

          const startMeasureIdx = systemIdx * MEASURES_PER_SYSTEM;
          const systemMeasures = measures.slice(startMeasureIdx, startMeasureIdx + MEASURES_PER_SYSTEM);

          return (
            <g key={`system-${systemIdx}`}>
              {/* Llave / Corchete orquestal a la izquierda */}
              <line
                x1={LEFT_MARGIN - 35}
                y1={sysY + 55}
                x2={LEFT_MARGIN - 35}
                y2={sysY + 295}
                stroke="#64748b"
                strokeWidth="4.5"
              />
              <path
                d={`M ${LEFT_MARGIN - 35} ${sysY + 55} Q ${LEFT_MARGIN - 50} ${middleCY} ${LEFT_MARGIN - 35} ${middleCY} Q ${LEFT_MARGIN - 50} ${middleCY} ${LEFT_MARGIN - 35} ${sysY + 295}`}
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
              />

              {/* Clave de Sol */}
              <text x={LEFT_MARGIN - 78} y={sysY + 145} fill="#cbd5e1" fontSize="66" fontFamily="serif">
                𝄞
              </text>
              {/* Clave de Fa */}
              <text x={LEFT_MARGIN - 76} y={sysY + 246} fill="#cbd5e1" fontSize="50" fontFamily="serif">
                𝄢
              </text>

              {/* 5 Líneas de Clave de Sol */}
              {trebleLines.map((y, i) => (
                <line
                  key={`treble-${systemIdx}-${i}`}
                  x1={LEFT_MARGIN - 35}
                  y1={y}
                  x2={SVG_WIDTH - RIGHT_MARGIN}
                  y2={y}
                  stroke="#475569"
                  strokeWidth="1.8"
                />
              ))}

              {/* Línea guía punteada para Do Central (C4) */}
              <line
                x1={LEFT_MARGIN - 15}
                y1={middleCY}
                x2={SVG_WIDTH - RIGHT_MARGIN}
                y2={middleCY}
                stroke="#334155"
                strokeDasharray="4 6"
                strokeWidth="1.2"
              />

              {/* 5 Líneas de Clave de Fa */}
              {bassLines.map((y, i) => (
                <line
                  key={`bass-${systemIdx}-${i}`}
                  x1={LEFT_MARGIN - 35}
                  y1={y}
                  x2={SVG_WIDTH - RIGHT_MARGIN}
                  y2={y}
                  stroke="#475569"
                  strokeWidth="1.8"
                />
              ))}

              {/* Barra vertical de inicio del sistema */}
              <line
                x1={LEFT_MARGIN}
                y1={sysY + 55}
                x2={LEFT_MARGIN}
                y2={sysY + 295}
                stroke="#475569"
                strokeWidth="2"
              />

              {/* Renderizado de cada compás en este sistema */}
              {systemMeasures.map((measure, mSubIdx) => {
                const globalMeasureIdx = startMeasureIdx + mSubIdx;
                const mStartX = LEFT_MARGIN + mSubIdx * measureWidth;
                const mEndX = mStartX + measureWidth;
                const isSelectedMeasure = activeMeasureIndex === globalMeasureIdx;

                return (
                  <g key={`measure-${globalMeasureIdx}`}>
                    {/* Fondo interactivo para seleccionar compás al hacer clic */}
                    <rect
                      x={mStartX}
                      y={sysY + 45}
                      width={measureWidth}
                      height={260}
                      fill={isSelectedMeasure && !isPlaying ? 'rgba(56, 189, 248, 0.04)' : 'transparent'}
                      className="cursor-pointer hover:fill-cyan-500/5 transition-colors"
                      onClick={() => onSelectMeasureAndStep?.(globalMeasureIdx, 0)}
                    />

                    {/* Etiqueta del número de compás */}
                    <text
                      x={mStartX + 8}
                      y={sysY + 40}
                      fill={isSelectedMeasure ? '#38bdf8' : '#94a3b8'}
                      fontSize="12"
                      fontWeight="900"
                      fontFamily="ui-monospace, monospace"
                    >
                      Compás {globalMeasureIdx + 1}
                    </text>

                    {/* Barra divisoria al final del compás */}
                    <line
                      x1={mEndX}
                      y1={sysY + 55}
                      x2={mEndX}
                      y2={sysY + 295}
                      stroke="#475569"
                      strokeWidth="2"
                    />

                    {/* Renderizado de Notas del Compás */}
                    {(measure.notes || []).map((note, nIdx) => {
                      if (note.isRest) return null;

                      const noteStep =
                        note.stepIndex !== undefined
                          ? note.stepIndex
                          : ((note as any).step !== undefined ? (note as any).step % spm : 0);
                      const noteX = mStartX + (noteStep + 0.5) * (measureWidth / spm);
                      const noteY = getDiatonicY(note.midiNumber, sysY);
                      const isTreble = note.midiNumber >= 60;
                      const semitone = ((note.midiNumber % 12) + 12) % 12;
                      const isAccidental = SEMITONE_TO_DIATONIC[semitone].isAccidental;

                      // Líneas adicionales si la nota está fuera de las 5 líneas
                      const ledgerLines: number[] = [];
                      if (note.midiNumber === 60 || note.midiNumber === 61) {
                        ledgerLines.push(middleCY);
                      } else if (noteY < sysY + 55) {
                        for (let lY = sysY + 55 - LINE_SPACING; lY >= noteY - 6; lY -= LINE_SPACING) {
                          ledgerLines.push(lY);
                        }
                      } else if (noteY > sysY + 295) {
                        for (let lY = sysY + 295 + LINE_SPACING; lY <= noteY + 6; lY += LINE_SPACING) {
                          ledgerLines.push(lY);
                        }
                      }

                      return (
                        <g
                          key={`note-${globalMeasureIdx}-${nIdx}`}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNoteClick?.(globalMeasureIdx, note.midiNumber);
                          }}
                        >
                          {/* Líneas adicionales */}
                          {ledgerLines.map((lY, lIdx) => (
                            <line
                              key={lIdx}
                              x1={noteX - 14}
                              y1={lY}
                              x2={noteX + 14}
                              y2={lY}
                              stroke="#94a3b8"
                              strokeWidth="2.2"
                            />
                          ))}

                          {/* Sostenido (#) si aplica */}
                          {isAccidental && (
                            <text
                              x={noteX - 16}
                              y={noteY + 5}
                              fill="#f59e0b"
                              fontSize="16"
                              fontWeight="bold"
                              fontFamily="serif"
                            >
                              ♯
                            </text>
                          )}

                          {/* Plica vertical */}
                          <line
                            x1={isTreble ? noteX + 8 : noteX - 8}
                            y1={noteY}
                            x2={isTreble ? noteX + 8 : noteX - 8}
                            y2={isTreble ? noteY - 34 : noteY + 34}
                            stroke="#f59e0b"
                            strokeWidth="2.2"
                          />

                          {/* Cabeza de la nota */}
                          <ellipse
                            cx={noteX}
                            cy={noteY}
                            rx="9"
                            ry="6.8"
                            transform={`rotate(-20 ${noteX} ${noteY})`}
                            fill="#f59e0b"
                            stroke="#d97706"
                            strokeWidth="1.2"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Doble barra final al término de la obra */}
              {systemIdx === totalSystems - 1 && (
                <line
                  x1={SVG_WIDTH - RIGHT_MARGIN - 5}
                  y1={sysY + 55}
                  x2={SVG_WIDTH - RIGHT_MARGIN - 5}
                  y2={sysY + 295}
                  stroke="#475569"
                  strokeWidth="4"
                />
              )}
            </g>
          );
        })}

        {/* Cursor / Escáner de Reproducción en Vivo (Playhead Continuo) */}
        {isPlaying && (
          <line
            ref={playheadRef}
            x1={playheadX}
            y1={systemBaseY + 65}
            x2={playheadX}
            y2={systemBaseY + 315}
            stroke="#22d3ee"
            strokeWidth="2.5"
            filter="drop-shadow(0 0 8px rgba(34, 211, 238, 0.95))"
            className="pointer-events-none"
          />
        )}
      </svg>
    </div>
  );
};

export default ExtendedScoreView;

