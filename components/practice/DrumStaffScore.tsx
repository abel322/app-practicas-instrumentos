'use client';

import React, { useMemo } from 'react';
import { DrumHit, DrumVoice, StickingType } from '@/types/drum';
import { getSubdivisionConfig } from '@/lib/music-theory/rhythmSubdivisions';

export interface DrumStaffScoreProps {
  timeSignature?: '4/4' | '6/8' | '3/4';
  totalSteps?: number;
  hitsData?: DrumHit[];
  progress?: number; // 0.0 to 1.0 (recorrido exacto del compás)
  activeStep?: number; // 0 to totalSteps - 1
  isPlaying?: boolean;
  // Soporte de Paginación Fija por Compás (Zero-Jerk Page Flip)
  activeMeasureIndex?: number;
  totalMeasures?: number;
  stepsPerMeasure?: number;
  subdivision?: string;
  isFullscreen?: boolean;
  measure?: { hits?: DrumHit[]; measureIndex?: number } | DrumHit[];
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
  timeSignature = '4/4',
  totalSteps = 16,
  hitsData = [],
  progress = 0,
  activeStep = 0,
  isPlaying = false,
  activeMeasureIndex,
  totalMeasures,
  stepsPerMeasure,
  subdivision,
  isFullscreen = false,
  measure,
}) => {
  // Configuración de subdivisión rítmica dinámica
  const subConfig = useMemo(() => {
    return getSubdivisionConfig(
      subdivision,
      timeSignature,
      stepsPerMeasure || (totalSteps ? Math.min(16, totalSteps) : undefined)
    );
  }, [subdivision, timeSignature, stepsPerMeasure, totalSteps]);

  // Pasos por compás y compases totales
  const effectiveStepsPerMeasure = stepsPerMeasure || subConfig.stepsPerMeasure;
  const effectiveTotalMeasures =
    totalMeasures || Math.max(1, Math.ceil(totalSteps / effectiveStepsPerMeasure));

  const effectiveActiveMeasure =
    activeMeasureIndex !== undefined
      ? Math.min(effectiveTotalMeasures - 1, Math.max(0, activeMeasureIndex))
      : Math.min(effectiveTotalMeasures - 1, Math.floor(activeStep / effectiveStepsPerMeasure));

  const stepInMeasure = activeStep % effectiveStepsPerMeasure;
  const stepWidth = SCORE_WIDTH / effectiveStepsPerMeasure;

  // Coordenada X del cabezal de escaneo Runway en tiempo real
  // Si progress está provisto continuamente, usarlo; de lo contrario, usar stepInMeasure centrado
  const runwayProgress =
    progress !== undefined && progress > 0
      ? progress
      : (stepInMeasure + 0.5) / effectiveStepsPerMeasure;
  const runwayX = START_X + Math.min(Math.max(runwayProgress, 0), 1) * SCORE_WIDTH;

  // Hits normalizados para el compás activo (0 a effectiveStepsPerMeasure - 1)
  const activeHits = useMemo(() => {
    // Si se pasa directamente un compás
    if (measure) {
      if (Array.isArray(measure)) return measure;
      if (Array.isArray(measure.hits)) return measure.hits;
    }
    const startStep = effectiveActiveMeasure * effectiveStepsPerMeasure;
    const endStep = startStep + effectiveStepsPerMeasure;
    return hitsData
      .filter((h) => h.step >= startStep && h.step < endStep)
      .map((h) => ({
        ...h,
        step: h.step - startStep,
      }));
  }, [hitsData, measure, effectiveActiveMeasure, effectiveStepsPerMeasure]);

  // Agrupamiento de hits por paso para dibujar plicas y articular
  const hitsByStep = useMemo(() => {
    const map = new Map<number, DrumHit[]>();
    for (let i = 0; i < effectiveStepsPerMeasure; i++) {
      map.set(i, []);
    }
    activeHits.forEach((hit) => {
      if (hit.step >= 0 && hit.step < effectiveStepsPerMeasure) {
        map.get(hit.step)?.push(hit);
      }
    });
    return map;
  }, [activeHits, effectiveStepsPerMeasure]);

  // Subdivisión de tiempo y etiquetas de conteo (1 e & a / 1 y 2 y / etc)
  const subdivisions = useMemo(() => {
    const labels = subConfig.stepLabels;
    return labels.slice(0, effectiveStepsPerMeasure).map((lbl, idx) => ({
      step: idx,
      text: lbl,
      isBeat: !isNaN(Number(lbl)),
    }));
  }, [subConfig, effectiveStepsPerMeasure]);

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

  // Grupos de vigas (Beams) según la subdivisión
  const beamGroups = useMemo(() => {
    if (timeSignature === '4/4') {
      if (effectiveStepsPerMeasure === 16) {
        // 4 grupos de 4 semicorcheas con doble viga
        return [0, 1, 2, 3].map((g) => ({
          group: g,
          start: g * 4,
          end: g * 4 + 3,
          doubleBeam: true,
        }));
      }
      if (effectiveStepsPerMeasure === 8) {
        // 4 grupos de 2 corcheas con viga simple
        return [0, 1, 2, 3].map((g) => ({
          group: g,
          start: g * 2,
          end: g * 2 + 1,
          doubleBeam: false,
        }));
      }
    } else if (timeSignature === '6/8') {
      if (effectiveStepsPerMeasure === 12) {
        // 2 pulsos de 6 semicorcheas
        return [0, 1].map((g) => ({
          group: g,
          start: g * 6,
          end: g * 6 + 5,
          doubleBeam: true,
        }));
      }
      if (effectiveStepsPerMeasure === 6) {
        // 2 pulsos de 3 corcheas
        return [0, 1].map((g) => ({
          group: g,
          start: g * 3,
          end: g * 3 + 2,
          doubleBeam: false,
        }));
      }
    }
    return [];
  }, [timeSignature, effectiveStepsPerMeasure]);

  return (
    <div className={`w-full select-none flex flex-col items-center ${isFullscreen ? 'h-full justify-center' : ''}`}>
      <div
        className={`w-full relative overflow-hidden rounded-2xl glass-panel ${
          isFullscreen
            ? 'p-1 sm:p-2 border-0 bg-transparent shadow-none'
            : 'p-2 sm:p-5 border border-white/10 shadow-2xl'
        }`}
      >
        {/* Glow de fondo para ambientación en modo normal */}
        {!isFullscreen && (
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.03] via-transparent to-fuchsia-500/[0.02] pointer-events-none" />
        )}

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className={`w-full h-auto drop-shadow-md ${
            isFullscreen ? 'max-h-[min(55vh,360px)]' : 'max-h-[380px]'
          }`}
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
          {subdivisions.map((item) => {
            const x = START_X + item.step * stepWidth;
            const isStepActive = stepInMeasure === item.step;
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

                {/* Conteo superior (1 e & a / 1 y 2 y) */}
                <text
                  x={x + stepWidth / 2}
                  y={25}
                  textAnchor="middle"
                  fontSize={item.isBeat ? 13 : 11}
                  fontWeight={item.isBeat ? '700' : '500'}
                  fill={
                    item.isBeat
                      ? isStepActive && isPlaying
                        ? '#22d3ee'
                        : '#e4e4e7'
                      : isStepActive && isPlaying
                      ? '#22d3ee'
                      : '#71717a'
                  }
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
          {/* VIGAS DE UNIÓN (BEAMS) DINÁMICAS POR SUBDIVISIÓN               */}
          {/* ============================================================== */}
          {beamGroups.map((bg) => {
            const x1 = START_X + (bg.start + 0.5) * stepWidth + 5;
            const x2 = START_X + (bg.end + 0.5) * stepWidth + 5;
            const beamY1 = 44;
            const beamY2 = 50;

            return (
              <g key={`beam-group-${bg.group}`}>
                {/* Viga superior */}
                <line x1={x1} y1={beamY1} x2={x2} y2={beamY1} stroke="#f4f4f5" strokeWidth="3" />
                {/* Segunda viga para semicorcheas */}
                {bg.doubleBeam && (
                  <line x1={x1} y1={beamY2} x2={x2} y2={beamY2} stroke="#f4f4f5" strokeWidth="2.5" />
                )}
              </g>
            );
          })}

          {/* ============================================================== */}
          {/* RENDERIZADO DE NOTAS, PLICAS, ARTICULACIONES Y STICKING        */}
          {/* ============================================================== */}
          {Array.from(hitsByStep.entries()).map(([step, hits]) => {
            const noteX = START_X + (step + 0.5) * stepWidth;
            const isStepActive = isPlaying && stepInMeasure === step;

            // Si no hay notas en este paso, renderizar silencio sutil
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

            // Plica vertical
            const minY = Math.min(...hits.map((h) => getNoteY(h.instrument)));
            const maxY = Math.max(...hits.map((h) => getNoteY(h.instrument)));
            const stemTop = 44;

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

                {/* Símbolo de ACENTO ('>') */}
                {accentHit && (
                  <g
                    transform={`translate(${noteX}, ${stemTop - 10})`}
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

                {/* Plica (Stem) */}
                <line
                  x1={noteX + 5}
                  y1={stemTop}
                  x2={noteX + 5}
                  y2={maxY}
                  stroke={isStepActive ? '#22d3ee' : '#f4f4f5'}
                  strokeWidth="1.6"
                />

                {/* Cabezas de notas */}
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
                        // TAMBOR: Cabeza Ovalada Rellena
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

                {/* Símbolo de STICKING debajo de la nota (R, L, K, B) */}
                {stickingHit && stickingHit.sticking && (
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
      {!isFullscreen && (
        <div className="w-full mt-3 flex items-center justify-between px-2 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>RUNWAY SCANNER:</span>
            <span className="text-zinc-300 font-medium">
              {isPlaying
                ? `Paso ${stepInMeasure + 1} / ${effectiveStepsPerMeasure} (Compás ${effectiveActiveMeasure + 1}/${effectiveTotalMeasures})`
                : 'En pausa'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>COMPÁS: {timeSignature}</span>
            <span className="text-zinc-400">
              {isPlaying ? `${Math.round(runwayProgress * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const DrumMeasureRenderer = DrumStaffScore;
