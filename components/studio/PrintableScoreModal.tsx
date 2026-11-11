'use client';

import React, { useRef } from 'react';
import { ScoreMeasure } from './ExtendedScoreView';

export interface PrintableScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instrument: string;
  tempo: number;
  subdivision: string;
  measures: ScoreMeasure[];
}

const LINE_SPACING = 20;
const STEP_SPACING = 10;
const BASE_MIDDLE_C_Y = 150;
const MIDDLE_C_DIATONIC = 28; // C4
const SYSTEM_HEIGHT = 290;
const SVG_WIDTH = 960;
const LEFT_MARGIN = 75;
const RIGHT_MARGIN = 25;
const MEASURES_PER_SYSTEM = 2;

const SEMITONE_MAP: Record<number, { step: number; isAccidental: boolean }> = {
  0: { step: 0, isAccidental: false },
  1: { step: 0, isAccidental: true },
  2: { step: 1, isAccidental: false },
  3: { step: 1, isAccidental: true },
  4: { step: 2, isAccidental: false },
  5: { step: 3, isAccidental: false },
  6: { step: 3, isAccidental: true },
  7: { step: 4, isAccidental: false },
  8: { step: 4, isAccidental: true },
  9: { step: 5, isAccidental: false },
  10: { step: 5, isAccidental: true },
  11: { step: 6, isAccidental: false },
};

function getDiatonicY(midi: number, sysY: number) {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const info = SEMITONE_MAP[semitone];
  const absIndex = octave * 7 + info.step;
  const offset = absIndex - MIDDLE_C_DIATONIC;
  return sysY + BASE_MIDDLE_C_Y - (offset * STEP_SPACING);
}

export const PrintableScoreModal: React.FC<PrintableScoreModalProps> = ({
  isOpen,
  onClose,
  title,
  instrument,
  tempo,
  subdivision,
  measures,
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalSystems = Math.max(1, Math.ceil(measures.length / MEASURES_PER_SYSTEM));
  const usableWidth = SVG_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
  const measureWidth = usableWidth / MEASURES_PER_SYSTEM;
  const totalSvgHeight = totalSystems * SYSTEM_HEIGHT + 20;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Estilos estrictos para impresión editorial en papel */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-score-area,
          #printable-score-area * {
            visibility: visible !important;
          }
          #printable-score-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Tarjeta de Vista Previa */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:w-full print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
        {/* Barra Superior (Oculta al imprimir) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <h3 className="text-sm font-black text-white">Vista Previa de Partitura Lista para Imprimir</h3>
              <p className="text-xs text-slate-400">Generación vectorial a escala editorial (PDF / A4)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <span>🖨️ Imprimir / Guardar como PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Hoja de Partitura Renderizada */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-800/40 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-score-area"
            ref={printContainerRef}
            className="w-full max-w-[850px] bg-white text-black p-10 rounded-xl shadow-xl print:p-0 print:shadow-none print:rounded-none font-serif"
          >
            {/* Encabezado Editorial */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-600">
                  {instrument.toUpperCase()} SCORE
                </span>
                <span className="text-xs font-mono text-neutral-600">
                  {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-3xl font-black text-center tracking-tight text-neutral-900 capitalize my-1">
                {title.trim() || 'Sin Título'}
              </h1>
              <div className="flex justify-between items-center text-xs font-bold text-neutral-800 mt-3 pt-2">
                <div className="flex items-center gap-4">
                  <span>Tempo: <strong className="font-mono">{tempo} BPM</strong></span>
                  <span>Compás: <strong className="font-mono">4/4</strong></span>
                  <span>Subdivisión: <strong className="font-mono">{subdivision}</strong></span>
                </div>
                <div>
                  <span>Grabado con: <strong>Studio Builder</strong></span>
                </div>
              </div>
            </div>

            {/* Lienzo SVG Vectorial en Blanco y Negro */}
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${totalSvgHeight}`}
              className="w-full h-auto text-black font-sans"
            >
              {Array.from({ length: totalSystems }).map((_, systemIdx) => {
                const sysY = systemIdx * SYSTEM_HEIGHT + 10;
                const trebleLines = [45, 65, 85, 105, 125].map((y) => sysY + y);
                const bassLines = [175, 195, 215, 235, 255].map((y) => sysY + y);
                const middleCY = sysY + BASE_MIDDLE_C_Y;

                const startIdx = systemIdx * MEASURES_PER_SYSTEM;
                const sysMeasures = measures.slice(startIdx, startIdx + MEASURES_PER_SYSTEM);

                return (
                  <g key={`print-sys-${systemIdx}`} style={{ breakInside: 'avoid' }}>
                    {/* Llave / Corchete inicial */}
                    <line x1={LEFT_MARGIN - 30} y1={sysY + 45} x2={LEFT_MARGIN - 30} y2={sysY + 255} stroke="#000" strokeWidth="4" />
                    <path
                      d={`M ${LEFT_MARGIN - 30} ${sysY + 45} Q ${LEFT_MARGIN - 42} ${middleCY} ${LEFT_MARGIN - 30} ${middleCY} Q ${LEFT_MARGIN - 42} ${middleCY} ${LEFT_MARGIN - 30} ${sysY + 255}`}
                      fill="none"
                      stroke="#000"
                      strokeWidth="2"
                    />

                    {/* Claves en negro editorial */}
                    <text x={LEFT_MARGIN - 68} y={sysY + 122} fill="#000" fontSize="56" fontFamily="serif">𝄞</text>
                    <text x={LEFT_MARGIN - 66} y={sysY + 215} fill="#000" fontSize="42" fontFamily="serif">𝄢</text>

                    {/* Líneas de Clave de Sol */}
                    {trebleLines.map((y, i) => (
                      <line key={`pt-${i}`} x1={LEFT_MARGIN - 30} y1={y} x2={SVG_WIDTH - RIGHT_MARGIN} y2={y} stroke="#000" strokeWidth="1.2" />
                    ))}

                    {/* Líneas de Clave de Fa */}
                    {bassLines.map((y, i) => (
                      <line key={`pb-${i}`} x1={LEFT_MARGIN - 30} y1={y} x2={SVG_WIDTH - RIGHT_MARGIN} y2={y} stroke="#000" strokeWidth="1.2" />
                    ))}

                    {/* Barra de inicio de sistema */}
                    <line x1={LEFT_MARGIN} y1={sysY + 45} x2={LEFT_MARGIN} y2={sysY + 255} stroke="#000" strokeWidth="1.8" />

                    {/* Compases del Sistema */}
                    {sysMeasures.map((measure, mSubIdx) => {
                      const globalIdx = startIdx + mSubIdx;
                      const mStartX = LEFT_MARGIN + mSubIdx * measureWidth;
                      const mEndX = mStartX + measureWidth;

                      return (
                        <g key={`p-meas-${globalIdx}`}>
                          {/* Número de compás */}
                          <text
                            x={mStartX + 4}
                            y={sysY + 34}
                            fill="#333"
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="ui-monospace, monospace"
                          >
                            {globalIdx + 1}
                          </text>

                          {/* Barra divisoria de compás */}
                          <line x1={mEndX} y1={sysY + 45} x2={mEndX} y2={sysY + 255} stroke="#000" strokeWidth="1.5" />

                          {/* Notas */}
                          {(measure.notes || []).map((note, nIdx) => {
                            if (note.isRest) return null;

                            const noteStep =
                              note.stepIndex !== undefined
                                ? note.stepIndex
                                : ((note as any).step !== undefined ? (note as any).step % 16 : 0);
                            const noteX = mStartX + (noteStep + 0.5) * (measureWidth / 16);
                            const noteY = getDiatonicY(note.midiNumber, sysY);
                            const isTreble = note.midiNumber >= 60;
                            const semitone = ((note.midiNumber % 12) + 12) % 12;
                            const isAccidental = SEMITONE_MAP[semitone].isAccidental;

                            // Líneas adicionales
                            const ledgerLines: number[] = [];
                            if (note.midiNumber === 60 || note.midiNumber === 61) {
                              ledgerLines.push(middleCY);
                            } else if (noteY < sysY + 45) {
                              for (let lY = sysY + 45 - LINE_SPACING; lY >= noteY - 4; lY -= LINE_SPACING) {
                                ledgerLines.push(lY);
                              }
                            } else if (noteY > sysY + 255) {
                              for (let lY = sysY + 255 + LINE_SPACING; lY <= noteY + 4; lY += LINE_SPACING) {
                                ledgerLines.push(lY);
                              }
                            }

                            return (
                              <g key={`p-note-${globalIdx}-${nIdx}`}>
                                {ledgerLines.map((lY, lIdx) => (
                                  <line key={lIdx} x1={noteX - 12} y1={lY} x2={noteX + 12} y2={lY} stroke="#000" strokeWidth="1.6" />
                                ))}

                                {isAccidental && (
                                  <text x={noteX - 15} y={noteY + 4} fill="#000" fontSize="15" fontWeight="bold" fontFamily="serif">♯</text>
                                )}

                                <line
                                  x1={isTreble ? noteX + 7.5 : noteX - 7.5}
                                  y1={noteY}
                                  x2={isTreble ? noteX + 7.5 : noteX - 7.5}
                                  y2={isTreble ? noteY - 30 : noteY + 30}
                                  stroke="#000"
                                  strokeWidth="1.8"
                                />

                                <ellipse
                                  cx={noteX}
                                  cy={noteY}
                                  rx="8"
                                  ry="5.8"
                                  transform={`rotate(-22 ${noteX} ${noteY})`}
                                  fill="#000"
                                  stroke="#000"
                                  strokeWidth="0.5"
                                />
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}

                    {/* Doble barra final */}
                    {systemIdx === totalSystems - 1 && (
                      <line x1={SVG_WIDTH - RIGHT_MARGIN - 4} y1={sysY + 45} x2={SVG_WIDTH - RIGHT_MARGIN - 4} y2={sysY + 255} stroke="#000" strokeWidth="3.5" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Pie de Página Editorial */}
            <div className="mt-8 pt-4 border-t border-neutral-300 flex justify-between text-[10px] text-neutral-500 font-sans">
              <span>Sonora Music Studio — Edición Pedagógica Oficial</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableScoreModal;
