'use client';

import React, { useMemo } from 'react';
import { DrumHit, DrumVoice, StickingType } from '@/types/drum';

interface DrumStaffScoreProps {
  timeSignature: '4/4' | '6/8' | '3/4';
  totalSteps: number;
  hitsData: DrumHit[];
  progress: number; // 0.0 to 1.0 (recorrido exacto del compás)
  activeStep: number; // 0 to totalSteps - 1
  isPlaying: boolean;
}

// Dimensiones del pentagrama SVG
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 250;
const START_X = 135;
const END_X = 955;
const SCORE_WIDTH = END_X - START_X;

// 5 líneas del pentagrama (14px de distancia)
// Línea 5 (superior) = 80
// Línea 4 = 94
// Línea 3 = 108
// Línea 2 = 122
// Línea 1 (inferior) = 136
const STAFF_LINES = [80, 94, 108, 122, 136];

// Posiciones Y para cada voz de percusión según el estándar internacional
function getNoteY(voice: DrumVoice): number {
  switch (voice) {
    case 'crash':
      return 56; // Sobre la línea adicional superior
    case 'hihat':
    case 'hihat_open':
      return 68; // Justo sobre la línea 5
    case 'ride':
      return 80; // En la línea 5
    case 'tom1':
      return 87; // 4º espacio (entre línea 4 y 5)
    case 'snare':
      return 101; // 3º espacio (entre línea 3 y 4) - Posición estándar de la caja
    case 'tom2':
      return 115; // 2º espacio (entre línea 2 y 3)
    case 'floor_tom':
      return 129; // 1º espacio (entre línea 1 y 2)
    case 'kick':
      return 148; // 1º espacio inferior debajo de la línea 1
    default:
      return 101;
  }
}

export const DrumStaffScore: React.FC<DrumStaffScoreProps> = ({
  timeSignature,
  totalSteps,
  hitsData,
  progress,
  activeStep,
  isPlaying,
}) => {
  const stepWidth = SCORE_WIDTH / totalSteps;

  // Coordenada X del cabezal de escaneo Runway en tiempo real
  const runwayX = START_X + Math.min(Math.max(progress, 0), 1) * SCORE_WIDTH;

  // Agrupamiento de hits por paso para dibujar plicas y articular
  const hitsByStep = useMemo(() => {
    const map = new Map<number, DrumHit[]>();
    for (let i = 0; i < totalSteps; i++) {
      map.set(i, []);
    }
    hitsData.forEach((hit) => {
      if (hit.step >= 0 && hit.step < totalSteps) {
        map.get(hit.step)?.push(hit);
      }
    });
    return map;
  }, [hitsData, totalSteps]);

  // Subdivisión de tiempo y etiquetas de conteo (1 e & a)
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
    } else if (timeSignature === '6/8') {
      const beats = ['1', '·', '2', '·', '3', '·', '4', '·', '5', '·', '6', '·'];
      for (let i = 0; i < totalSteps; i++) {
        labels.push({
          step: i,
          text: beats[i % beats.length],
          isBeat: i % 2 === 0,
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

  // Color para Sticking
  const getStickingColor = (sticking?: StickingType) => {
    switch (sticking) {
      case 'R':
        return '#22d3ee'; // Cian
      case 'L':
        return '#e879f9'; // Rosa/Fucsia
      case 'K':
        return '#34d399'; // Esmeralda / Bombo
      case 'B':
        return '#fbbf24'; // Ámbar (ambas manos / flam)
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="w-full select-none flex flex-col items-center">
      <div className="w-full relative overflow-hidden rounded-2xl glass-panel p-2 sm:p-5 border border-white/10 shadow-2xl">
        {/* Glow de fondo para ambientación */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.03] via-transparent to-fuchsia-500/[0.02] pointer-events-none" />

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto max-h-[380px] drop-shadow-md"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow Filter para el cabezal Runway */}
            <filter id="runwayGlow" x="-50%" y="-20%" width="200%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur1" />
              <feGaussianBlur stdDeviation="7" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradiente luminoso para el cabezal vertical */}
            <linearGradient id="runwayBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
              <stop offset="25%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="75%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
            </linearGradient>

            {/* Halo de golpe activo */}
            <radialGradient id="hitBurstGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ============================================================== */}
          {/* LÍNEAS DE FONDO Y PULSO DEL COMPÁS                             */}
          {/* ============================================================== */}

          {/* Marcadores de pulso verticales (beat subdivisions) */}
          {subdivisions.map((item) => {
            const x = START_X + item.step * stepWidth;
            return (
              <g key={`subdiv-${item.step}`}>
                {/* Línea divisoria tenue */}
                <line
                  x1={x}
                  y1={30}
                  x2={x}
                  y2={210}
                  stroke={item.isBeat ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}
                  strokeWidth={item.isBeat ? 1.5 : 1}
                  strokeDasharray={item.isBeat ? undefined : '3,4'}
                />

                {/* Conteo superior (1 e & a) */}
                <text
                  x={x + stepWidth / 2}
                  y={25}
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
          {/* PENTAGRAMA FORMAL DE 5 LÍNEAS                                  */}
          {/* ============================================================== */}
          {STAFF_LINES.map((lineY, idx) => (
            <line
              key={`staff-${idx}`}
              x1={START_X - 60}
              y1={lineY}
              x2={END_X + 15}
              y2={lineY}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
            />
          ))}

          {/* Barra inicial (Clef bar) */}
          <line
            x1={START_X - 60}
            y1={STAFF_LINES[0]}
            x2={START_X - 60}
            y2={STAFF_LINES[4]}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="2"
          />

          {/* Clave de Percusión Neutral (dos barras rectangulares paralelas) */}
          <rect
            x={START_X - 52}
            y={STAFF_LINES[1]}
            width="4"
            height={STAFF_LINES[3] - STAFF_LINES[1]}
            fill="#e4e4e7"
            rx="1"
          />
          <rect
            x={START_X - 44}
            y={STAFF_LINES[1]}
            width="4"
            height={STAFF_LINES[3] - STAFF_LINES[1]}
            fill="#e4e4e7"
            rx="1"
          />

          {/* Numerador y Denominador del Compás (ej: 4 / 4 o 6 / 8) */}
          <g className="font-serif font-bold text-white select-none">
            {timeSignature === '4/4' ? (
              <>
                <text x={START_X - 24} y={105} fontSize="24" fill="#f4f4f5" textAnchor="middle" fontWeight="bold">
                  4
                </text>
                <text x={START_X - 24} y={132} fontSize="24" fill="#f4f4f5" textAnchor="middle" fontWeight="bold">
                  4
                </text>
              </>
            ) : timeSignature === '6/8' ? (
              <>
                <text x={START_X - 24} y={105} fontSize="24" fill="#f4f4f5" textAnchor="middle" fontWeight="bold">
                  6
                </text>
                <text x={START_X - 24} y={132} fontSize="24" fill="#f4f4f5" textAnchor="middle" fontWeight="bold">
                  8
                </text>
              </>
            ) : (
              <>
                <text x={START_X - 24} y={105} fontSize="24" fill="#f4f4f5" textAnchor="middle" fontWeight="bold">
                  3
                </text>
                <text x={START_X - 24} y={132} fontSize="24" fill="#f4f4f5" textAnchor="middle" fontWeight="bold">
                  4
                </text>
              </>
            )}
          </g>

          {/* Barra de compás final (doble barra fina + gruesa de repetición) */}
          <line
            x1={END_X + 10}
            y1={STAFF_LINES[0]}
            x2={END_X + 10}
            y2={STAFF_LINES[4]}
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
          />
          <line
            x1={END_X + 15}
            y1={STAFF_LINES[0]}
            x2={END_X + 15}
            y2={STAFF_LINES[4]}
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="4"
          />

          {/* Puntos de repetición de compás */}
          <circle cx={END_X + 4} cy={94} r="2.5" fill="#e4e4e7" />
          <circle cx={END_X + 4} cy={122} r="2.5" fill="#e4e4e7" />

          {/* ============================================================== */}
          {/* LÍNEAS ADICIONALES PARA PLATILLOS Y BOMBO                     */}
          {/* ============================================================== */}
          {Array.from(hitsByStep.entries()).map(([step, hits]) => {
            const x = START_X + (step + 0.5) * stepWidth;
            const hasCrash = hits.some((h) => h.instrument === 'crash');
            const hasKick = hits.some((h) => h.instrument === 'kick');

            return (
              <g key={`ledgers-${step}`}>
                {/* Línea adicional superior para Crash */}
                {hasCrash && (
                  <line
                    x1={x - 12}
                    y1={66}
                    x2={x + 12}
                    y2={66}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1.2"
                  />
                )}
                {/* Línea adicional inferior para Bombo */}
                {hasKick && (
                  <line
                    x1={x - 12}
                    y1={150}
                    x2={x + 12}
                    y2={150}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1.2"
                  />
                )}
              </g>
            );
          })}

          {/* ============================================================== */}
          {/* VIGAS DE UNIÓN (BEAMS) DE SEMICORCHEAS POR GRUPO DE PULSO      */}
          {/* ============================================================== */}
          {timeSignature === '4/4' && (
            // 4 grupos de 4 semicorcheas
            [0, 1, 2, 3].map((group) => {
              const startStep = group * 4;
              const endStep = startStep + 3;
              const x1 = START_X + (startStep + 0.5) * stepWidth + 5;
              const x2 = START_X + (endStep + 0.5) * stepWidth + 5;
              const beamY1 = 44;
              const beamY2 = 50;

              return (
                <g key={`beam-group-${group}`}>
                  {/* Viga superior */}
                  <line x1={x1} y1={beamY1} x2={x2} y2={beamY1} stroke="#f4f4f5" strokeWidth="3" />
                  {/* Segunda viga para semicorcheas */}
                  <line x1={x1} y1={beamY2} x2={x2} y2={beamY2} stroke="#f4f4f5" strokeWidth="2.5" />
                </g>
              );
            })
          )}

          {/* ============================================================== */}
          {/* RENDERIZADO DE NOTAS, PLICAS, ARTICULACIONES Y STICKING        */}
          {/* ============================================================== */}
          {Array.from(hitsByStep.entries()).map(([step, hits]) => {
            const noteX = START_X + (step + 0.5) * stepWidth;
            const isStepActive = isPlaying && activeStep === step;

            // Si no hay notas en este paso, renderizar silencio sutil de semicorchea
            if (hits.length === 0) {
              return (
                <g key={`rest-${step}`} opacity="0.25">
                  <path
                    d={`M ${noteX - 3} 98 L ${noteX + 2} 98 L ${noteX - 2} 118`}
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx={noteX - 4} cy={97} r="2" fill="#ffffff" />
                </g>
              );
            }

            // Calculamos la plica: va desde la nota más baja hasta la viga superior
            const minY = Math.min(...hits.map((h) => getNoteY(h.instrument)));
            const maxY = Math.max(...hits.map((h) => getNoteY(h.instrument)));
            const stemTop = 44;

            // Revisar si algún hit tiene acento o sticking en este paso
            const accentHit = hits.find((h) => h.accent);
            const stickingHit = hits.find((h) => h.sticking);

            return (
              <g key={`step-${step}`}>
                {/* Destello reactivo cuando el cabezal golpea este paso */}
                {isStepActive && (
                  <ellipse
                    cx={noteX}
                    cy={(minY + maxY) / 2}
                    rx={20}
                    ry={30}
                    fill="url(#hitBurstGrad)"
                    className="pointer-events-none"
                  />
                )}

                {/* Símbolo de ACENTO ('>') encima de la nota o sobre la plica */}
                {accentHit && (
                  <g
                    transform={`translate(${noteX}, ${stemTop - 10})`}
                    className="transition-all duration-100"
                  >
                    <path
                      d="M -6 -4 L 6 0 L -6 4"
                      stroke={isStepActive ? '#00f0ff' : '#f8fafc'}
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={isStepActive ? 'url(#runwayGlow)' : undefined}
                    />
                  </g>
                )}

                {/* Plica (Stem vertical hacia arriba) */}
                <line
                  x1={noteX + 5}
                  y1={stemTop}
                  x2={noteX + 5}
                  y2={maxY}
                  stroke={isStepActive ? '#22d3ee' : '#f4f4f5'}
                  strokeWidth="1.6"
                />

                {/* Cada cabeza de nota en este paso */}
                {hits.map((hit, hitIdx) => {
                  const y = getNoteY(hit.instrument);
                  const isCymbal =
                    hit.instrument === 'hihat' ||
                    hit.instrument === 'hihat_open' ||
                    hit.instrument === 'crash' ||
                    hit.instrument === 'ride';

                  return (
                    <g key={`hit-${step}-${hitIdx}`}>
                      {isCymbal ? (
                        // PLATILLO: Cabeza en Cruz ('✕')
                        <g transform={`translate(${noteX}, ${y})`}>
                          <line
                            x1="-5.5"
                            y1="-5.5"
                            x2="5.5"
                            y2="5.5"
                            stroke={isStepActive ? '#22d3ee' : '#f8fafc'}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                          <line
                            x1="-5.5"
                            y1="5.5"
                            x2="5.5"
                            y2="-5.5"
                            stroke={isStepActive ? '#22d3ee' : '#f8fafc'}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />

                          {/* Si es Hi-Hat abierto, círculo indicador encima */}
                          {hit.instrument === 'hihat_open' && (
                            <circle
                              cx="0"
                              cy="-12"
                              r="3.5"
                              stroke={isStepActive ? '#22d3ee' : '#f8fafc'}
                              strokeWidth="1.5"
                              fill="none"
                            />
                          )}
                        </g>
                      ) : (
                        // TAMBOR (Caja, Bombo, Tom): Cabeza Ovalada Rellena
                        <g transform={`translate(${noteX}, ${y})`}>
                          <ellipse
                            cx="0"
                            cy="0"
                            rx="5.5"
                            ry="4.2"
                            transform="rotate(-20)"
                            fill={isStepActive ? '#22d3ee' : '#f8fafc'}
                            stroke={isStepActive ? '#00f0ff' : '#09090b'}
                            strokeWidth="1"
                            filter={isStepActive ? 'url(#runwayGlow)' : undefined}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Símbolo de STICKING debajo de la nota (R, L, K) */}
                {stickingHit && (
                  <g transform={`translate(${noteX}, 185)`}>
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={getStickingColor(stickingHit.sticking)}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="monospace"
                      filter={isStepActive ? 'url(#runwayGlow)' : undefined}
                      className="transition-transform duration-75"
                      style={{
                        transform: isStepActive ? 'scale(1.25)' : 'scale(1)',
                        transformOrigin: 'center',
                      }}
                    >
                      {stickingHit.sticking}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ============================================================== */}
          {/* CABEZAL DE LECTURA ANIMADO: RUNWAY SCANNER                     */}
          {/* ============================================================== */}
          {isPlaying && (
            <g transform={`translate(${runwayX}, 0)`}>
              {/* Resplandor exterior difuso */}
              <line
                x1="0"
                y1="30"
                x2="0"
                y2="210"
                stroke="#06b6d4"
                strokeWidth="10"
                strokeOpacity="0.18"
                filter="url(#runwayGlow)"
              />

              {/* Halo medio */}
              <line
                x1="0"
                y1="32"
                x2="0"
                y2="208"
                stroke="#22d3ee"
                strokeWidth="4"
                strokeOpacity="0.65"
              />

              {/* Núcleo blanco brillante (Core) */}
              <line
                x1="0"
                y1="35"
                x2="0"
                y2="205"
                stroke="#ffffff"
                strokeWidth="2"
                strokeOpacity="0.95"
              />

              {/* Marcador puntero superior (Chevron) */}
              <polygon
                points="-5,30 5,30 0,38"
                fill="#22d3ee"
                filter="url(#runwayGlow)"
              />

              {/* Marcador puntero inferior */}
              <polygon
                points="-5,210 5,210 0,202"
                fill="#22d3ee"
                filter="url(#runwayGlow)"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Indicador de posición visual y estado del compás */}
      <div className="w-full mt-3 flex items-center justify-between px-2 text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>RUNWAY SCANNER:</span>
          <span className="text-zinc-300 font-medium">
            {isPlaying ? `Paso ${activeStep + 1} / ${totalSteps}` : 'En pausa'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>COMPÁS: {timeSignature}</span>
          <span className="text-zinc-400">
            {isPlaying ? `${Math.round(progress * 100)}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
};
