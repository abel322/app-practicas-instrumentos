'use client';

import React, { useMemo } from 'react';
import { DrumHit, DrumVoice, StickingType } from '@/types/drum';

export interface DrumScoreProps {
  measure?: any;
  hits?: DrumHit[];
  stepsPerMeasure: number; // 8 para corcheas, 16 para semicorcheas
  currentStepInMeasure: number;
  timeSignature?: string;
  isPlaying?: boolean;
}

export function getDrumYPosition(voice: string = ''): number {
  const v = voice.toLowerCase();
  switch (v) {
    case 'crash':
      return 40;  // Sobre la línea superior
    case 'ride':
      return 60;  // En la línea 5
    case 'hihat':
    case 'hihat_open':
      return 50;  // Justo sobre la línea 5
    case 'tom1':
      return 70;  // 4º espacio
    case 'snare':
      return 100; // 3º espacio (caja)
    case 'tom2':
      return 110; // 2º espacio
    case 'floor_tom':
      return 120; // 1º espacio
    case 'kick':
      return 140; // Debajo de la línea 1 (bombo)
    default:
      return 100;
  }
}

export function DrumScoreRenderer({
  measure,
  hits,
  stepsPerMeasure = 16,
  currentStepInMeasure = 0,
  timeSignature = '4/4',
  isPlaying = false,
}: DrumScoreProps) {
  // Etiquetas superiores dinámicas según los pasos del compás
  const stepLabels = useMemo(() => {
    if (stepsPerMeasure === 8) {
      return ['1', 'y', '2', 'y', '3', 'y', '4', 'y'];
    }
    if (stepsPerMeasure === 4) {
      return ['1', '2', '3', '4'];
    }
    if (stepsPerMeasure === 12 && timeSignature === '4/4') {
      return ['1', 'ti', 'ta', '2', 'ti', 'ta', '3', 'ti', 'ta', '4', 'ti', 'ta'];
    }
    if (timeSignature === '6/8') {
      return stepsPerMeasure === 6
        ? ['1', '2', '3', '4', '5', '6']
        : ['1', '·', '2', '·', '3', '·', '4', '·', '5', '·', '6', '·'];
    }
    return ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'];
  }, [stepsPerMeasure, timeSignature]);

  // Dimensiones base del compás en el SVG
  const scoreWidth = 900;
  const leftMargin = 80;  // Espacio para clave neutral y métrica
  const rightMargin = 40;
  const usableWidth = scoreWidth - leftMargin - rightMargin;
  const stepWidth = usableWidth / stepsPerMeasure;

  // Función para obtener la coordenada X exacta de cualquier paso
  const getXForStep = (stepIdx: number) => leftMargin + (stepIdx + 0.5) * stepWidth;

  // Normalizar lista de notas del compás
  const notesList = useMemo(() => {
    if (hits && Array.isArray(hits)) return hits;
    if (measure) {
      if (Array.isArray(measure)) return measure;
      if (Array.isArray(measure.notes)) return measure.notes;
      if (Array.isArray(measure.hits)) return measure.hits;
    }
    return [];
  }, [measure, hits]);

  // Agrupar notas por paso para dibujar plicas
  const notesByStep = useMemo(() => {
    const map = new Map<number, any[]>();
    for (let i = 0; i < stepsPerMeasure; i++) {
      map.set(i, []);
    }
    notesList.forEach((n: any) => {
      const step = n.stepIndex !== undefined ? n.stepIndex : n.step !== undefined ? n.step : 0;
      const normalizedStep = step % stepsPerMeasure;
      if (normalizedStep >= 0 && normalizedStep < stepsPerMeasure) {
        map.get(normalizedStep)?.push(n);
      }
    });
    return map;
  }, [notesList, stepsPerMeasure]);

  return (
    <div className="w-full relative flex flex-col items-center select-none">
      {/* Cabecera Rítmica Superior Proporcional */}
      <div
        className="w-full text-center text-xs font-mono text-slate-400 mb-1 px-4 sm:px-8 select-none"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${stepsPerMeasure}, minmax(0, 1fr))` }}
      >
        {stepLabels.map((lbl, idx) => {
          const isCurrent = isPlaying && currentStepInMeasure === idx;
          const isMainBeat = !isNaN(Number(lbl));
          return (
            <span
              key={idx}
              className={`transition-colors duration-75 ${
                isCurrent
                  ? 'text-cyan-400 font-black text-sm scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  : isMainBeat
                  ? 'font-bold text-slate-100 text-sm'
                  : 'text-slate-500'
              }`}
            >
              {lbl}
            </span>
          );
        })}
      </div>

      {/* Pentagrama SVG de Batería con Ajuste 100% Responsivo */}
      <svg
        viewBox={`0 0 ${scoreWidth} 200`}
        className="w-full h-auto max-h-56 drop-shadow-md"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="drumScanGlow" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 5 Líneas del pentagrama de percusión */}
        {[60, 80, 100, 120, 140].map((y, i) => (
          <line
            key={`staff-line-${i}`}
            x1={leftMargin - 20}
            y1={y}
            x2={scoreWidth - rightMargin}
            y2={y}
            stroke="#334155"
            strokeWidth="1.5"
          />
        ))}

        {/* Barras divisorias inicial y final */}
        <line
          x1={leftMargin - 20}
          y1="60"
          x2={leftMargin - 20}
          y2="140"
          stroke="#94a3b8"
          strokeWidth="2.5"
        />
        <line
          x1={scoreWidth - rightMargin}
          y1="60"
          x2={scoreWidth - rightMargin}
          y2="140"
          stroke="#94a3b8"
          strokeWidth="2.5"
        />

        {/* Clave Neutral de Percusión (dos barras verticales) */}
        <rect x={leftMargin - 15} y="80" width="3" height="40" fill="#94a3b8" rx="1" />
        <rect x={leftMargin - 9} y="80" width="3" height="40" fill="#94a3b8" rx="1" />

        {/* Métrica del Compás */}
        <text
          x={leftMargin + 6}
          y="93"
          fontSize="18"
          fill="#cbd5e1"
          fontWeight="bold"
          fontFamily="serif"
          textAnchor="middle"
        >
          {timeSignature.split('/')[0] || '4'}
        </text>
        <text
          x={leftMargin + 6}
          y="125"
          fontSize="18"
          fill="#cbd5e1"
          fontWeight="bold"
          fontFamily="serif"
          textAnchor="middle"
        >
          {timeSignature.split('/')[1] || '4'}
        </text>

        {/* Líneas divisorias tenues entre pasos */}
        {Array.from({ length: stepsPerMeasure }).map((_, stepIdx) => {
          const x = getXForStep(stepIdx);
          const isMainBeat = stepIdx % (stepsPerMeasure === 8 ? 2 : 4) === 0;
          return (
            <line
              key={`grid-${stepIdx}`}
              x1={x}
              y1="50"
              x2={x}
              y2="150"
              stroke={isMainBeat ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}
              strokeWidth={isMainBeat ? '1.2' : '0.8'}
              strokeDasharray={isMainBeat ? undefined : '2,3'}
            />
          );
        })}

        {/* Renderizado de Notas de Batería con Posición X Matemática Real */}
        {Array.from(notesByStep.entries()).map(([stepIdx, stepNotes]) => {
          if (!stepNotes || stepNotes.length === 0) return null;
          const cx = getXForStep(stepIdx);
          const isStepActive = isPlaying && currentStepInMeasure === stepIdx;

          // Plica vertical unificada si hay notas
          const yPositions = stepNotes.map((n: any) =>
            getDrumYPosition(n.instrumentKey || n.drumType || n.instrument)
          );
          const minY = Math.min(...yPositions);
          const maxY = Math.max(...yPositions);
          const stemTop = 35;

          const accentNote = stepNotes.find((n: any) => n.accent);
          const stickingNote = stepNotes.find((n: any) => n.sticking);

          return (
            <g key={`step-col-${stepIdx}`} className="transition-all">
              {/* Plica (Stem) vertical */}
              <line
                x1={cx + 6}
                y1={stemTop}
                x2={cx + 6}
                y2={maxY}
                stroke={isStepActive ? '#22d3ee' : '#94a3b8'}
                strokeWidth="1.6"
              />

              {/* Símbolo de Acento ('>') */}
              {accentNote && (
                <path
                  d={`M ${cx - 5} ${stemTop - 8} L ${cx + 5} ${stemTop - 5} L ${cx - 5} ${stemTop - 2}`}
                  stroke={isStepActive ? '#00f0ff' : '#f8fafc'}
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Renderizar cada cabeza de nota en este paso */}
              {stepNotes.map((note: any, nIdx: number) => {
                const voice = note.instrumentKey || note.drumType || note.instrument || 'snare';
                const cy = getDrumYPosition(voice);
                const isHiHatOrCymbal = ['hihat', 'hihat_open', 'crash', 'ride'].includes(
                  voice.toLowerCase()
                );

                return (
                  <g key={`note-${stepIdx}-${nIdx}`}>
                    {/* Línea adicional para platillos superiores (Crash) */}
                    {cy <= 40 && (
                      <line
                        x1={cx - 10}
                        y1={cy}
                        x2={cx + 10}
                        y2={cy}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1.2"
                      />
                    )}

                    {/* Cabeza de nota: cruz (X) para platillos o círculo relleno para tambores */}
                    {isHiHatOrCymbal ? (
                      <g>
                        <path
                          d={`M ${cx - 6} ${cy - 6} L ${cx + 6} ${cy + 6} M ${cx + 6} ${cy - 6} L ${cx - 6} ${cy + 6}`}
                          stroke={isStepActive ? '#22d3ee' : '#38bdf8'}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        {voice.toLowerCase() === 'hihat_open' && (
                          <circle
                            cx={cx}
                            cy={cy - 10}
                            r="3"
                            stroke={isStepActive ? '#22d3ee' : '#38bdf8'}
                            strokeWidth="1.2"
                            fill="none"
                          />
                        )}
                      </g>
                    ) : (
                      <ellipse
                        cx={cx}
                        cy={cy}
                        rx="7"
                        ry="5.5"
                        fill={isStepActive ? '#22d3ee' : '#38bdf8'}
                        transform={`rotate(-15, ${cx}, ${cy})`}
                        filter={isStepActive ? 'url(#drumScanGlow)' : undefined}
                      />
                    )}
                  </g>
                );
              })}

              {/* Sticking si existe (R / L / K) */}
              {stickingNote && stickingNote.sticking && (
                <text
                  x={cx}
                  y="180"
                  textAnchor="middle"
                  fill={
                    stickingNote.sticking === 'R'
                      ? '#38bdf8'
                      : stickingNote.sticking === 'L'
                      ? '#f43f5e'
                      : '#34d399'
                  }
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="transition-transform duration-75"
                  style={{
                    transform: isStepActive ? 'scale(1.25)' : 'scale(1)',
                    transformOrigin: `${cx}px 180px`,
                  }}
                >
                  {stickingNote.sticking}
                </text>
              )}
            </g>
          );
        })}

        {/* Barra del Escáner (Runway Scanner) sincronizada en base stepsPerMeasure */}
        {isPlaying && (
          <g>
            <line
              x1={getXForStep(currentStepInMeasure)}
              y1="30"
              x2={getXForStep(currentStepInMeasure)}
              y2="190"
              stroke="#22d3ee"
              strokeWidth="2.5"
              className="transition-all duration-75 ease-linear"
              filter="url(#drumScanGlow)"
            />
            <circle
              cx={getXForStep(currentStepInMeasure)}
              cy="30"
              r="4"
              fill="#22d3ee"
              filter="url(#drumScanGlow)"
            />
            <circle
              cx={getXForStep(currentStepInMeasure)}
              cy="190"
              r="4"
              fill="#22d3ee"
              filter="url(#drumScanGlow)"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export const DrumScoreSVG = DrumScoreRenderer;
export default DrumScoreRenderer;

