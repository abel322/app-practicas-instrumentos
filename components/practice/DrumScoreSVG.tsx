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
      return 60;  // En la línea 5 (superior)
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
  // Etiquetas según subdivisión rítmica
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

  // Geometría unificada del SVG (Alineación milimétrica absoluta)
  const scoreWidth = 900;
  const leftMargin = 90;   // Espacio protegido para clave neutral y métrica 4/4
  const rightMargin = 45;
  const usableWidth = scoreWidth - leftMargin - rightMargin;
  const stepWidth = usableWidth / stepsPerMeasure;

  // Coordenada X exacta para cada paso (usada por etiquetas, notas y escáner)
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

  // Agrupar notas por paso para dibujar plicas unificadas
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

  const [numerator, denominator] = timeSignature ? timeSignature.split('/') : ['4', '4'];

  return (
    <div className="w-full relative flex items-center justify-center select-none overflow-hidden">
      <svg
        viewBox={`0 0 ${scoreWidth} 220`}
        className="w-full h-auto max-h-60"
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

        {/* ============================================================ */}
        {/* 1. CABECERA DE SUBDIVISIONES Y PULSOS (DENTRO DEL SVG)       */}
        {/* ============================================================ */}
        {stepLabels.map((lbl, idx) => {
          const cx = getXForStep(idx);
          const isMainBeat = !isNaN(Number(lbl)); // 1, 2, 3, 4
          const isActive = isPlaying && currentStepInMeasure === idx;

          return (
            <g key={`step-guide-${idx}`}>
              {/* Pequeña marca guía vertical sobre el pentagrama */}
              <line
                x1={cx}
                y1={isMainBeat ? 18 : 22}
                x2={cx}
                y2={30}
                stroke={isActive ? '#22d3ee' : isMainBeat ? '#64748b' : '#334155'}
                strokeWidth={isMainBeat ? 1.5 : 1}
              />

              {/* Texto del Pulso o Subdivisión perfectamente alineado */}
              <text
                x={cx}
                y={isMainBeat ? 14 : 16}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize={isMainBeat ? '14' : '11'}
                fontWeight={isMainBeat ? '900' : '600'}
                fill={
                  isActive
                    ? '#22d3ee'
                    : isMainBeat
                    ? '#f8fafc'
                    : '#64748b'
                }
                className="transition-colors duration-75 select-none"
              >
                {lbl}
              </text>
            </g>
          );
        })}

        {/* ============================================================ */}
        {/* 2. PENTAGRAMA DE PERCUSIÓN (5 LÍNEAS)                         */}
        {/* ============================================================ */}
        {[60, 80, 100, 120, 140].map((y, i) => (
          <line
            key={`staff-${i}`}
            x1={leftMargin - 20}
            y1={y}
            x2={scoreWidth - rightMargin}
            y2={y}
            stroke="#334155"
            strokeWidth="1.5"
          />
        ))}

        {/* Barras verticales divisorias (inicio y fin de compás) */}
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

        {/* Clave de Percusión Neutral y Métrica de Compás */}
        <text
          x="35"
          y="108"
          fill="#94a3b8"
          fontSize="22"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          𝄥
        </text>
        <text
          x="62"
          y="90"
          fill="#cbd5e1"
          fontSize="18"
          fontWeight="900"
          fontFamily="sans-serif"
          textAnchor="middle"
        >
          {numerator || '4'}
        </text>
        <text
          x="62"
          y="130"
          fill="#cbd5e1"
          fontSize="18"
          fontWeight="900"
          fontFamily="sans-serif"
          textAnchor="middle"
        >
          {denominator || '4'}
        </text>

        {/* Líneas divisorias tenues verticales entre pasos */}
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
              stroke={isMainBeat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.025)'}
              strokeWidth={isMainBeat ? '1.2' : '0.8'}
              strokeDasharray={isMainBeat ? undefined : '2,3'}
            />
          );
        })}

        {/* ============================================================ */}
        {/* 3. NOTAS Y STICKINGS (ALINEADOS A getXForStep)               */}
        {/* ============================================================ */}
        {Array.from(notesByStep.entries()).map(([stepIdx, stepNotes]) => {
          if (!stepNotes || stepNotes.length === 0) return null;
          const cx = getXForStep(stepIdx);
          const isStepActive = isPlaying && currentStepInMeasure === stepIdx;

          // Plica vertical unificada
          const yPositions = stepNotes.map((n: any) =>
            getDrumYPosition(n.instrumentKey || n.drumType || n.instrument)
          );
          const minY = Math.min(...yPositions);
          const maxY = Math.max(...yPositions);
          const stemTop = 38;

          const accentNote = stepNotes.find((n: any) => n.accent);
          const stickingNote = stepNotes.find((n: any) => n.sticking);

          return (
            <g key={`step-col-${stepIdx}`}>
              {/* Plica vertical que conecta la nota con la línea de tiempo */}
              <line
                x1={cx + 6}
                y1={stemTop}
                x2={cx + 6}
                y2={maxY}
                stroke={isStepActive ? '#22d3ee' : '#64748b'}
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
                    {/* Línea adicional superior para Crash */}
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

                    {/* Cabeza de nota: cruz (X) para platillos o círculo para tambores */}
                    {isHiHatOrCymbal ? (
                      <g>
                        <path
                          d={`M ${cx - 6} ${cy - 6} L ${cx + 6} ${cy + 6} M ${cx + 6} ${cy - 6} L ${cx - 6} ${cy + 6}`}
                          stroke={isStepActive ? '#22d3ee' : '#38bdf8'}
                          strokeWidth="2.5"
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

        {/* ============================================================ */}
        {/* 4. ESCÁNER VISUAL (RUNWAY SCANNER)                          */}
        {/* ============================================================ */}
        {isPlaying && (
          <g>
            <line
              x1={getXForStep(currentStepInMeasure)}
              y1="22"
              x2={getXForStep(currentStepInMeasure)}
              y2="190"
              stroke="#22d3ee"
              strokeWidth="2.5"
              filter="url(#drumScanGlow)"
            />
            <circle
              cx={getXForStep(currentStepInMeasure)}
              cy="22"
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
