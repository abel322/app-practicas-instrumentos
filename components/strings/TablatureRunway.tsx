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
  isFullscreen?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const TablatureRunway: React.FC<TablatureRunwayProps> = ({
  instrument,
  tuning,
  totalSteps,
  timeSignature,
  tabData,
  progress,
  activeStep,
  isPlaying,
  isFullscreen = false,
  scrollContainerRef,
}) => {
  const isBass = instrument === 'bass_4';
  const numStrings = isBass ? 4 : 6;

  // Altura y espaciado de líneas según instrumento
  const SVG_HEIGHT = isBass ? 230 : 250;
  const lineSpacing = isBass ? 26 : 22;
  const startY = isBass ? 70 : 60;

  // Pasos por compás
  const stepsPerMeasure = timeSignature === '6/8' ? 12 : 16;
  const numMeasures = Math.max(1, Math.ceil(totalSteps / stepsPerMeasure));
  const currentMeasureIndex = Math.floor(activeStep / stepsPerMeasure);

  // Parámetros de dimensionamiento proporcional por compás (viewBox estándar 1000px)
  const SVG_WIDTH = 1000;
  const leftPadding = 24;
  const rightPadding = 28;
  const MEASURE_WIDTH = SVG_WIDTH - leftPadding - rightPadding; // 948px
  const rightBarX = leftPadding + MEASURE_WIDTH; // 972px
  const stepWidth = MEASURE_WIDTH / stepsPerMeasure;

  // Coordenadas Y para cada cuerda (1 es la más aguda = arriba, 4/6 es la más grave = abajo)
  const stringLines = useMemo(() => {
    const lines: { stringNum: number; y: number; label: string }[] = [];
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

  // Agrupar notas por paso global
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

  // Etiquetas rítmicas del compás (1 e & a 2 e & a...)
  const beatLabels = useMemo(() => {
    if (timeSignature === '4/4') {
      return ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'];
    }
    return Array.from({ length: stepsPerMeasure }).map((_, idx) => `${idx + 1}`);
  }, [timeSignature, stepsPerMeasure]);

  // Color de insignia para cada técnica
  const getTechniqueBadge = (technique?: string) => {
    switch (technique) {
      case 'slap':
        return { label: 'S', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.2)' };
      case 'pop':
        return { label: 'P', color: '#e879f9', bg: 'rgba(232, 121, 249, 0.2)' };
      case 'ghost':
        return { label: 'X', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
      case 'hammer':
        return { label: 'H', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' };
      case 'pull':
        return { label: 'P', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.2)' };
      case 'slide':
        return { label: '/', color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' };
      case 'vibrato':
        return { label: '~', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
      default:
        return null;
    }
  };

  const topStaffY = stringLines[0].y;
  const bottomStaffY = stringLines[stringLines.length - 1].y;

  return (
    <div className="w-full select-none flex flex-col items-center h-full">
      {/* Contenedor principal: Columna Lateral Fija TAB + Área de Compases con Paginación Responsiva */}
      <div className="flex items-stretch bg-[#11131c] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl w-full h-full">
        {/* ============================================================== */}
        {/* COLUMNA LATERAL FIJA DE CUERDAS Y RÓTULO TAB                   */}
        {/* ============================================================== */}
        <div className="w-10 sm:w-12 bg-slate-950/95 border-r border-slate-800 flex flex-col justify-between py-3 px-1 shrink-0 select-none z-20 shadow-lg">
          <span className="text-[10px] font-black tracking-widest text-cyan-400 text-center select-none pt-1">
            TAB
          </span>
          <svg
            viewBox={`0 0 36 ${SVG_HEIGHT}`}
            className="w-full h-auto select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {stringLines.map((line) => (
              <text
                key={`fixed-tune-${line.stringNum}`}
                x={18}
                y={line.y + 4.5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="900"
                fontFamily="monospace"
                fill="#f1f5f9"
              >
                {line.label}
              </text>
            ))}
          </svg>
          <div className="h-2" />
        </div>

        {/* ============================================================== */}
        {/* CONTENEDOR DE COMPASES: CADA COMPÁS TOMA EL 100% DEL ANCHO      */}
        {/* ============================================================== */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden p-2 sm:p-3 relative no-scrollbar scroll-smooth flex items-center"
        >
          {Array.from({ length: numMeasures }).map((_, mIdx) => {
            const startStep = mIdx * stepsPerMeasure;
            const isCurrentMeasure = currentMeasureIndex === mIdx;

            // Progreso del escáner en este compás específico
            const localContinuousStep = progress * totalSteps - mIdx * stepsPerMeasure;
            const clampedMeasureProgress = Math.max(0, Math.min(1, localContinuousStep / stepsPerMeasure));
            const localRunwayX = leftPadding + clampedMeasureProgress * MEASURE_WIDTH;

            return (
              <div
                key={`measure-${mIdx}`}
                data-measure-index={mIdx}
                className="w-full min-w-full shrink-0 px-2 sm:px-4 relative flex items-center justify-center"
              >
                {/* Marcadores de paso HTML para querySelector y centrado */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: stepsPerMeasure }).map((_, s) => {
                    const globalStep = startStep + s;
                    const leftPercent = ((leftPadding + s * stepWidth) / SVG_WIDTH) * 100;
                    const widthPercent = (stepWidth / SVG_WIDTH) * 100;
                    return (
                      <div
                        key={`step-marker-${globalStep}`}
                        data-step={globalStep}
                        data-step-index={globalStep}
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* SVG del compás ajustado al 100% del ancho del compás */}
                <svg
                  viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                  className="w-full h-auto drop-shadow-md select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {/* Glow Filter para el cabezal Runway */}
                    <filter id={`runwayGlow-${mIdx}`} x="-50%" y="-20%" width="200%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur1" />
                      <feGaussianBlur stdDeviation="7" result="blur2" />
                      <feMerge>
                        <feMergeNode in="blur2" />
                        <feMergeNode in="blur1" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    {/* Destello de nota activa */}
                    <radialGradient id={`hitBurst-${mIdx}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* ============================================================== */}
                  {/* LÍNEAS HORIZONTALES DE LA TABLATURA                            */}
                  {/* ============================================================== */}
                  {stringLines.map((line) => (
                    <line
                      key={`string-${line.stringNum}`}
                      x1={leftPadding}
                      y1={line.y}
                      x2={rightBarX}
                      y2={line.y}
                      stroke="rgba(255, 255, 255, 0.28)"
                      strokeWidth="1.2"
                    />
                  ))}

                  {/* ============================================================== */}
                  {/* BARRA INICIAL DEL COMPÁS Y BADGE DE NÚMERO                     */}
                  {/* ============================================================== */}
                  <g>
                    <line
                      x1={leftPadding}
                      y1={topStaffY - 8}
                      x2={leftPadding}
                      y2={bottomStaffY + 8}
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth={3}
                    />
                    <rect
                      x={leftPadding + 3}
                      y={topStaffY - 22}
                      width={28}
                      height={14}
                      rx={4}
                      fill="#0f172a"
                      stroke="#22d3ee"
                      strokeWidth={1}
                    />
                    <text
                      x={leftPadding + 17}
                      y={topStaffY - 11}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="800"
                      fontFamily="monospace"
                      fill="#38bdf8"
                    >
                      c.{mIdx + 1}
                    </text>
                  </g>

                  {/* ============================================================== */}
                  {/* SUBDIVISIONES Y TIEMPOS (1 e & a 2 e & a 3 e & a 4 e & a)      */}
                  {/* ============================================================== */}
                  {Array.from({ length: stepsPerMeasure }).map((_, s) => {
                    const globalStep = startStep + s;
                    const stepX = leftPadding + (s + 0.5) * stepWidth;
                    const tickX = leftPadding + s * stepWidth;
                    const isBeat = s % 4 === 0;
                    const text = beatLabels[s % beatLabels.length];
                    const isStepActive = isPlaying && activeStep === globalStep;

                    return (
                      <g key={`subdiv-${mIdx}-${s}`}>
                        {/* Línea vertical de subdivisión interna */}
                        {s > 0 && (
                          <line
                            x1={tickX}
                            y1={25}
                            x2={tickX}
                            y2={bottomStaffY + 25}
                            stroke={isBeat ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.05)'}
                            strokeWidth={isBeat ? 1.5 : 1}
                            strokeDasharray={isBeat ? undefined : '3,4'}
                          />
                        )}

                        {/* Conteo superior (1 e & a) */}
                        <text
                          x={stepX}
                          y={22}
                          textAnchor="middle"
                          fontSize={isBeat ? 13 : 11}
                          fontWeight={isBeat ? '700' : '500'}
                          fill={
                            isBeat
                              ? isStepActive
                                ? '#22d3ee'
                                : '#e4e4e7'
                              : isStepActive
                              ? '#38bdf8'
                              : '#71717a'
                          }
                          className="font-mono transition-colors duration-150"
                        >
                          {text}
                        </text>
                      </g>
                    );
                  })}

                  {/* ============================================================== */}
                  {/* BARRA FINAL DEL COMPÁS / CIERRE DE REPETICIÓN                  */}
                  {/* ============================================================== */}
                  {mIdx === numMeasures - 1 ? (
                    <g>
                      <line
                        x1={rightBarX}
                        y1={topStaffY}
                        x2={rightBarX}
                        y2={bottomStaffY}
                        stroke="rgba(255, 255, 255, 0.6)"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={rightBarX + 6}
                        y1={topStaffY}
                        x2={rightBarX + 6}
                        y2={bottomStaffY}
                        stroke="rgba(255, 255, 255, 0.95)"
                        strokeWidth="3.5"
                      />
                      <circle cx={rightBarX - 6} cy={topStaffY + 12} r="2.5" fill="#e4e4e7" />
                      <circle cx={rightBarX - 6} cy={bottomStaffY - 12} r="2.5" fill="#e4e4e7" />
                    </g>
                  ) : (
                    <line
                      x1={rightBarX}
                      y1={topStaffY}
                      x2={rightBarX}
                      y2={bottomStaffY}
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth={2}
                    />
                  )}

                  {/* ============================================================== */}
                  {/* NOTAS DE TABLATURA EN ESTE COMPÁS                              */}
                  {/* ============================================================== */}
                  {Array.from({ length: stepsPerMeasure }).map((_, s) => {
                    const globalStep = startStep + s;
                    const notes = notesByStep.get(globalStep) || [];
                    const noteX = leftPadding + (s + 0.5) * stepWidth;
                    const isStepActive = isPlaying && activeStep === globalStep;

                    return (
                      <g key={`step-notes-${mIdx}-${s}`}>
                        {notes.map((note, noteIdx) => {
                          const noteY = getStringY(note.string);
                          const techBadge = getTechniqueBadge(note.technique);
                          const isGhost = note.technique === 'ghost';
                          const fretText = isGhost ? 'X' : `${note.fret}`;

                          return (
                            <g key={`note-${globalStep}-${noteIdx}`}>
                              {/* Halo reactivo al impactar el cabezal */}
                              {isStepActive && (
                                <ellipse
                                  cx={noteX}
                                  cy={noteY}
                                  rx={18}
                                  ry={14}
                                  fill={`url(#hitBurst-${mIdx})`}
                                  className="pointer-events-none"
                                />
                              )}

                              {/* Píldora de máscara que corta limpiamente la línea */}
                              <rect
                                x={noteX - 11}
                                y={noteY - 9.5}
                                width={22}
                                height={19}
                                rx={5}
                                fill="#09090b"
                                stroke={isStepActive ? '#22d3ee' : 'rgba(255, 255, 255, 0.25)'}
                                strokeWidth={isStepActive ? 2 : 1}
                                filter={isStepActive ? `url(#runwayGlow-${mIdx})` : undefined}
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

                              {/* Insignia de técnica (Slap 'S', Pop 'P', Slide '/', etc.) */}
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

                              {/* Dedo sugerido */}
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
                  {/* CABEZAL DE ESCANEO RUNWAY EN EL COMPÁS ACTIVO                  */}
                  {/* ============================================================== */}
                  {isPlaying && isCurrentMeasure && (
                    <g transform={`translate(${localRunwayX}, 0)`}>
                      <line
                        x1="0"
                        y1={25}
                        x2="0"
                        y2={bottomStaffY + 22}
                        stroke="#06b6d4"
                        strokeWidth="10"
                        strokeOpacity="0.2"
                        filter={`url(#runwayGlow-${mIdx})`}
                      />
                      <line
                        x1="0"
                        y1={28}
                        x2="0"
                        y2={bottomStaffY + 20}
                        stroke="#22d3ee"
                        strokeWidth="3.5"
                        strokeOpacity="0.75"
                      />
                      <line
                        x1="0"
                        y1={30}
                        x2="0"
                        y2={bottomStaffY + 18}
                        stroke="#ffffff"
                        strokeWidth="1.8"
                        strokeOpacity="0.95"
                      />
                      <polygon
                        points="-4.5,25 4.5,25 0,33"
                        fill="#22d3ee"
                        filter={`url(#runwayGlow-${mIdx})`}
                      />
                      <polygon
                        points={`-4.5,${bottomStaffY + 25} 4.5,${bottomStaffY + 25} 0,${bottomStaffY + 17}`}
                        fill="#22d3ee"
                        filter={`url(#runwayGlow-${mIdx})`}
                      />
                    </g>
                  )}
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de estado inferior (solo visible fuera de pantalla completa) */}
      {!isFullscreen && (
        <div className="w-full mt-2 flex items-center justify-between px-2 text-xs text-zinc-500 font-mono">
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
      )}
    </div>
  );
};
