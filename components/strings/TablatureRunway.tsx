'use client';

import React, { useMemo } from 'react';
import { StringInstrument, StringTabNote } from '@/types/strings';

interface TablatureRunwayProps {
  instrument: StringInstrument;
  tuning: string;
  totalSteps: number;
  timeSignature: '4/4' | '6/8' | '3/4';
  tabData: StringTabNote[];
  progress: number; // 0.0 to 1.0
  activeStep: number;
  isPlaying: boolean;
}

const SVG_WIDTH = 1000;
const START_X = 125;
const END_X = 955;
const SCORE_WIDTH = END_X - START_X;

export const TablatureRunway: React.FC<TablatureRunwayProps> = ({
  instrument,
  tuning,
  totalSteps,
  timeSignature,
  tabData,
  progress,
  activeStep,
  isPlaying,
}) => {
  const isBass = instrument === 'bass_4';
  const numStrings = isBass ? 4 : 6;

  // Altura y espaciado de líneas según instrumento
  const SVG_HEIGHT = isBass ? 230 : 250;
  const lineSpacing = isBass ? 26 : 22;
  const startY = isBass ? 70 : 60;

  // Coordenadas Y para cada cuerda (1 es la más aguda = arriba, 4/6 es la más grave = abajo)
  const stringLines = useMemo(() => {
    const lines: { stringNum: number; y: number; label: string }[] = [];
    // Etiquetas de afinación estándar
    const bassLabels = ['G', 'D', 'A', 'E'];
    const guitarLabels = ['e', 'B', 'G', 'D', 'A', 'E'];
    const labels = isBass ? bassLabels : guitarLabels;

    for (let i = 0; i < numStrings; i++) {
      lines.push({
        stringNum: i + 1,
        y: startY + i * lineSpacing,
        label: labels[i] || `${i + 1}`,
      });
    }
    return lines;
  }, [isBass, numStrings, lineSpacing, startY]);

  const getStringY = (stringNum: number) => {
    const found = stringLines.find((l) => l.stringNum === stringNum);
    return found ? found.y : startY;
  };

  const stepWidth = SCORE_WIDTH / totalSteps;
  const runwayX = START_X + Math.min(Math.max(progress, 0), 1) * SCORE_WIDTH;

  // Agrupar notas por paso
  const notesByStep = useMemo(() => {
    const map = new Map<number, StringTabNote[]>();
    for (let i = 0; i < totalSteps; i++) {
      map.set(i, []);
    }
    tabData.forEach((note) => {
      if (note.step >= 0 && note.step < totalSteps) {
        map.get(note.step)?.push(note);
      }
    });
    return map;
  }, [tabData, totalSteps]);

  // Subdivisión de compás (1 e & a)
  const subdivisions = useMemo(() => {
    const labels: { step: number; text: string; isBeat: boolean }[] = [];
    if (timeSignature === '4/4') {
      const beats = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'];
      for (let i = 0; i < totalSteps; i++) {
        labels.push({
          step: i,
          text: beats[i % beats.length],
          isBeat: i % 4 === 0,
        });
      }
    } else {
      for (let i = 0; i < totalSteps; i++) {
        labels.push({
          step: i,
          text: `${i + 1}`,
          isBeat: i % 4 === 0,
        });
      }
    }
    return labels;
  }, [timeSignature, totalSteps]);

  // Color de insignia para cada técnica
  const getTechniqueBadge = (technique?: string) => {
    switch (technique) {
      case 'slap':
        return { label: 'S', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.2)' }; // Cian
      case 'pop':
        return { label: 'P', color: '#e879f9', bg: 'rgba(232, 121, 249, 0.2)' }; // Fucsia
      case 'ghost':
        return { label: 'X', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }; // Gris
      case 'hammer':
        return { label: 'H', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' }; // Azul cielo
      case 'pull':
        return { label: 'P', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.2)' }; // Rosa
      case 'slide':
        return { label: '/', color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' }; // Esmeralda
      case 'vibrato':
        return { label: '~', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' }; // Ámbar
      default:
        return null;
    }
  };

  const topStaffY = stringLines[0].y;
  const bottomStaffY = stringLines[stringLines.length - 1].y;

  return (
    <div className="w-full select-none flex flex-col items-center">
      {/* Contenedor responsivo con scroll horizontal suave en pantallas estrechas */}
      <div className="w-full overflow-x-auto rounded-2xl glass-panel p-2 sm:p-5 border border-white/10 shadow-2xl relative">
        <div className="min-w-[700px] w-full">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto drop-shadow-md"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Glow Filter para el cabezal Runway */}
              <filter id="stringRunwayGlow" x="-50%" y="-20%" width="200%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur1" />
                <feGaussianBlur stdDeviation="7" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradiente luminoso vertical */}
              <linearGradient id="stringRunwayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
              </linearGradient>

              {/* Destello de nota activa */}
              <radialGradient id="stringHitBurst" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ============================================================== */}
            {/* SUBDIVISIONES Y CONTEO RÍTMICO                                */}
            {/* ============================================================== */}
            {subdivisions.map((item) => {
              const x = START_X + item.step * stepWidth;
              return (
                <g key={`subdiv-${item.step}`}>
                  <line
                    x1={x}
                    y1={25}
                    x2={x}
                    y2={bottomStaffY + 25}
                    stroke={item.isBeat ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}
                    strokeWidth={item.isBeat ? 1.5 : 1}
                    strokeDasharray={item.isBeat ? undefined : '3,4'}
                  />

                  {/* Conteo superior (1 e & a) */}
                  <text
                    x={x + stepWidth / 2}
                    y={22}
                    textAnchor="middle"
                    fontSize={item.isBeat ? 13 : 11}
                    fontWeight={item.isBeat ? '700' : '500'}
                    fill={item.isBeat ? (activeStep === item.step && isPlaying ? '#22d3ee' : '#e4e4e7') : '#71717a'}
                    className="font-mono transition-colors duration-150"
                  >
                    {item.text}
                  </text>
                </g>
              );
            })}

            {/* ============================================================== */}
            {/* CABECERA TAB LATERAL Y AFINACIÓN                              */}
            {/* ============================================================== */}
            {/* Bloque TAB */}
            <g className="font-sans font-black select-none text-zinc-400">
              <text x={38} y={topStaffY + (bottomStaffY - topStaffY) * 0.28} fontSize="15" fill="#a1a1aa" textAnchor="middle" fontWeight="900">
                T
              </text>
              <text x={38} y={topStaffY + (bottomStaffY - topStaffY) * 0.58} fontSize="15" fill="#a1a1aa" textAnchor="middle" fontWeight="900">
                A
              </text>
              <text x={38} y={topStaffY + (bottomStaffY - topStaffY) * 0.88} fontSize="15" fill="#a1a1aa" textAnchor="middle" fontWeight="900">
                B
              </text>
            </g>

            {/* Separador vertical del cabezal */}
            <line
              x1={54}
              y1={topStaffY}
              x2={54}
              y2={bottomStaffY}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />

            {/* Rótulo de cuerda (afinación E, A, D, G / e, B, G, D, A, E) */}
            {stringLines.map((line) => (
              <text
                key={`tune-${line.stringNum}`}
                x={72}
                y={line.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fontFamily="monospace"
                fill="#71717a"
              >
                {line.label}
              </text>
            ))}

            {/* Barra inicial del compás */}
            <line
              x1={95}
              y1={topStaffY}
              x2={95}
              y2={bottomStaffY}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="2"
            />

            {/* Barra final de repetición */}
            <line
              x1={END_X + 10}
              y1={topStaffY}
              x2={END_X + 10}
              y2={bottomStaffY}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
            />
            <line
              x1={END_X + 15}
              y1={topStaffY}
              x2={END_X + 15}
              y2={bottomStaffY}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            {/* Puntos de repetición */}
            <circle cx={END_X + 4} cy={topStaffY + 12} r="2.5" fill="#e4e4e7" />
            <circle cx={END_X + 4} cy={bottomStaffY - 12} r="2.5" fill="#e4e4e7" />

            {/* ============================================================== */}
            {/* LÍNEAS HORIZONTALES DE LA TABLATURA                            */}
            {/* ============================================================== */}
            {stringLines.map((line) => (
              <line
                key={`string-${line.stringNum}`}
                x1={95}
                y1={line.y}
                x2={END_X + 10}
                y2={line.y}
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.2"
              />
            ))}

            {/* ============================================================== */}
            {/* NOTAS DE TABLATURA (TRASTES, MÁSCARAS Y TÉCNICAS)              */}
            {/* ============================================================== */}
            {Array.from(notesByStep.entries()).map(([step, notes]) => {
              const noteX = START_X + (step + 0.5) * stepWidth;
              const isStepActive = isPlaying && activeStep === step;

              return (
                <g key={`step-notes-${step}`}>
                  {notes.map((note, noteIdx) => {
                    const noteY = getStringY(note.string);
                    const techBadge = getTechniqueBadge(note.technique);
                    const isGhost = note.technique === 'ghost';
                    const fretText = isGhost ? 'X' : `${note.fret}`;

                    return (
                      <g key={`note-${step}-${noteIdx}`}>
                        {/* Halo reactivo cuando el escaneo impacta la nota */}
                        {isStepActive && (
                          <ellipse
                            cx={noteX}
                            cy={noteY}
                            rx={18}
                            ry={14}
                            fill="url(#stringHitBurst)"
                            className="pointer-events-none"
                          />
                        )}

                        {/* Píldora de máscara de fondo que corta limpiamente la línea detrás del número */}
                        <rect
                          x={noteX - 11}
                          y={noteY - 9.5}
                          width={22}
                          height={19}
                          rx={5}
                          fill="#09090b"
                          stroke={isStepActive ? '#22d3ee' : 'rgba(255, 255, 255, 0.2)'}
                          strokeWidth={isStepActive ? 2 : 1}
                          filter={isStepActive ? 'url(#stringRunwayGlow)' : undefined}
                          className="transition-all duration-75"
                        />

                        {/* Número de traste */}
                        <text
                          x={noteX}
                          y={noteY + 4.5}
                          textAnchor="middle"
                          fontSize={fretText.length > 1 ? 12 : 13}
                          fontWeight="800"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fill={isStepActive ? '#22d3ee' : '#f8fafc'}
                          className="select-none"
                        >
                          {fretText}
                        </text>

                        {/* Insignia de técnica (Slap 'S', Pop 'P', Slide '/', Hammer 'H') */}
                        {techBadge && (
                          <g transform={`translate(${noteX}, ${noteY - 14})`}>
                            <rect
                              x="-6"
                              y="-6"
                              width="12"
                              height="12"
                              rx="3"
                              fill={techBadge.bg}
                              stroke={techBadge.color}
                              strokeWidth="0.8"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="900"
                              fontFamily="monospace"
                              fill={techBadge.color}
                            >
                              {techBadge.label}
                            </text>
                          </g>
                        )}

                        {/* Dedo sugerido (debajo del traste) */}
                        {note.finger && !techBadge && (
                          <text
                            x={noteX}
                            y={noteY + 18}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fill="#71717a"
                          >
                            {note.finger}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* ============================================================== */}
            {/* CABEZAL DE ESCANEO RUNWAY ANIMADO                              */}
            {/* ============================================================== */}
            {isPlaying && (
              <g transform={`translate(${runwayX}, 0)`}>
                {/* Glow difuso */}
                <line
                  x1="0"
                  y1={25}
                  x2="0"
                  y2={bottomStaffY + 22}
                  stroke="#06b6d4"
                  strokeWidth="10"
                  strokeOpacity="0.2"
                  filter="url(#stringRunwayGlow)"
                />

                {/* Haz medio */}
                <line
                  x1="0"
                  y1={28}
                  x2="0"
                  y2={bottomStaffY + 20}
                  stroke="#22d3ee"
                  strokeWidth="3.5"
                  strokeOpacity="0.75"
                />

                {/* Centro blanco */}
                <line
                  x1="0"
                  y1={30}
                  x2="0"
                  y2={bottomStaffY + 18}
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeOpacity="0.95"
                />

                {/* Marcador puntero superior */}
                <polygon
                  points="-4.5,25 4.5,25 0,33"
                  fill="#22d3ee"
                  filter="url(#stringRunwayGlow)"
                />

                {/* Marcador puntero inferior */}
                <polygon
                  points="-4.5,${bottomStaffY + 25} 4.5,${bottomStaffY + 25} 0,${bottomStaffY + 17}"
                  fill="#22d3ee"
                  filter="url(#stringRunwayGlow)"
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Indicador de estado inferior */}
      <div className="w-full mt-3 flex items-center justify-between px-2 text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>RUNWAY SCANNER:</span>
          <span className="text-zinc-300 font-medium">
            {isPlaying ? `Paso ${activeStep + 1} / ${totalSteps}` : 'En pausa'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>AFINACIÓN: {tuning}</span>
          <span>•</span>
          <span>COMPÁS: {timeSignature}</span>
          <span className="text-zinc-400 font-semibold">
            {isPlaying ? `${Math.round(progress * 100)}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
};
