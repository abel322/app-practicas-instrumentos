'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { StringInstrument, StringTabNote, BendType, BendAmount, PickDirection, StrumDirection } from '@/types/strings';
import { getSubdivisionConfig } from '@/lib/music-theory/rhythmSubdivisions';

export interface RenderedNote {
  id: string;
  stepInMeasure: number;
  string: number;
  fret: number;
  technique?: string;
  slideDirection?: 'up' | 'down' | null;
  bendType?: BendType;
  bendAmount?: BendAmount;
  finger?: string;
  pickDirection?: PickDirection;
  palmMute?: boolean;
  strumDirection?: StrumDirection;
}

export interface TablatureRunwayProps {
  instrument?: StringInstrument;
  tuning?: string;
  totalSteps?: number;
  timeSignature?: '4/4' | '6/8' | '3/4';
  subdivision?: string;
  tabData?: StringTabNote[];
  progress?: number; // 0.0 to 1.0
  activeStep?: number;
  isPlaying?: boolean;
  isFullscreen?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  // Props de Paginación Fija por Compás (Zero-Jerk Page Flip)
  activeMeasureIndex?: number;
  stepInCurrentMeasure?: number;
  totalMeasures?: number;
  stepsPerMeasure?: number;
  currentStep?: number;
  measures?: any[];
  tuningNotes?: string[];
}

export const TablatureRunway: React.FC<TablatureRunwayProps> = ({
  instrument = 'guitar_6',
  tuning = 'Standard',
  totalSteps = 16,
  timeSignature = '4/4',
  subdivision,
  tabData = [],
  progress = 0,
  activeStep = 0,
  isPlaying = false,
  isFullscreen = false,
  scrollContainerRef,
  activeMeasureIndex,
  stepInCurrentMeasure,
  totalMeasures,
  stepsPerMeasure,
  currentStep,
  measures,
  tuningNotes,
}) => {
  const effectiveInstrument = instrument || (tuningNotes && tuningNotes.length === 4 ? 'bass_4' : 'guitar_6');
  const isBass = effectiveInstrument === 'bass_4';
  const numStrings = isBass ? 4 : 6;

  // Altura y espaciado de líneas según instrumento (amplitud optimizada para cero colisiones entre púa y dedo)
  const SVG_HEIGHT = isBass ? 250 : 285;
  const lineSpacing = isBass ? 36 : 32;
  const startY = isBass ? 70 : 66;

  // Subdivisión rítmica dinámica (ej. 1/8 Corcheas, 1/16 Semicorcheas, 1/8T Tresillos)
  const subConfig = useMemo(() => {
    return getSubdivisionConfig(
      subdivision,
      timeSignature,
      stepsPerMeasure || (totalSteps ? totalSteps : undefined)
    );
  }, [subdivision, timeSignature, stepsPerMeasure, totalSteps]);

  // Pasos por compás y compases totales
  const effectiveStepsPerMeasure = stepsPerMeasure || subConfig.stepsPerMeasure;
  const effectiveTotalSteps = totalSteps || (measures ? measures.length * effectiveStepsPerMeasure : 16);
  const effectiveTotalMeasures =
    totalMeasures || Math.max(1, Math.ceil(effectiveTotalSteps / effectiveStepsPerMeasure));

  const effectiveStep = currentStep ?? activeStep;
  const effectiveActiveMeasure =
    activeMeasureIndex !== undefined
      ? Math.min(effectiveTotalMeasures - 1, Math.max(0, activeMeasureIndex))
      : Math.min(effectiveTotalMeasures - 1, Math.floor(effectiveStep / effectiveStepsPerMeasure));

  const effectiveStepInMeasure =
    stepInCurrentMeasure !== undefined
      ? stepInCurrentMeasure
      : (effectiveStep % effectiveStepsPerMeasure);

  // Parámetros de dimensionamiento estático por compás (viewBox estándar 1000px)
  const SVG_WIDTH = 1000;
  const leftPadding = 24;
  const rightPadding = 28;
  const MEASURE_WIDTH = SVG_WIDTH - leftPadding - rightPadding; // 948px
  const rightBarX = leftPadding + MEASURE_WIDTH; // 972px
  const stepWidth = MEASURE_WIDTH / effectiveStepsPerMeasure;

  // Coordenadas Y para cada cuerda (1 es la más aguda = arriba, 4/6 es la más grave = abajo)
  const stringLines = useMemo(() => {
    const lines: { stringNum: number; y: number; label: string }[] = [];
    const bassLabels = ['G', 'D', 'A', 'E'];
    const guitarLabels = ['e', 'B', 'G', 'D', 'A', 'E'];
    const labels = tuningNotes || (isBass ? bassLabels : guitarLabels);

    for (let i = 0; i < numStrings; i++) {
      lines.push({
        stringNum: i + 1,
        y: startY + i * lineSpacing,
        label: labels[i] || `${i + 1}`,
      });
    }
    return lines;
  }, [isBass, numStrings, lineSpacing, startY, tuningNotes]);

  const getStringY = (stringNum: number) => {
    const found = stringLines.find((l) => l.stringNum === stringNum);
    return found ? found.y : startY;
  };

  // Notas pertenecientes exclusivamente al compás activo
  const measureStartStep = effectiveActiveMeasure * effectiveStepsPerMeasure;
  const measureEndStep = measureStartStep + effectiveStepsPerMeasure;

  const notesInCurrentMeasure = useMemo<RenderedNote[]>(() => {
    const rawMeasureNotes = measures && measures[effectiveActiveMeasure]?.notes;
    if (Array.isArray(rawMeasureNotes) && rawMeasureNotes.length > 0) {
      return rawMeasureNotes.map((n: any, idx: number) => {
        // Resolver de forma unificada el índice de paso dentro del compás
        let stepInMeasure = idx;
        if (typeof n.stepIndex === 'number') {
          stepInMeasure = n.stepIndex;
        } else if (typeof n.step === 'number') {
          if (n.step >= measureStartStep && n.step < measureEndStep) {
            stepInMeasure = n.step - measureStartStep;
          } else {
            stepInMeasure = n.step % effectiveStepsPerMeasure;
          }
        } else if (typeof n.tick === 'number') {
          stepInMeasure = n.tick;
        } else if (typeof n.position === 'number') {
          stepInMeasure = n.position;
        }

        return {
          id: n.id || `m-note-${effectiveActiveMeasure}-${idx}`,
          stepInMeasure,
          string: n.stringIndex !== undefined ? n.stringIndex + 1 : (n.string || 1),
          fret: n.fret,
          technique: n.technique,
          slideDirection: n.slideDirection,
          bendType: n.bendType,
          bendAmount: n.bendAmount,
          finger: n.finger,
          pickDirection: n.pickDirection,
          palmMute: n.palmMute,
          strumDirection: n.strumDirection,
        };
      });
    }

    if (tabData && tabData.length > 0) {
      return tabData
        .filter((note) => {
          const s =
            typeof note.step === 'number'
              ? note.step
              : typeof (note as any).stepIndex === 'number'
              ? (note as any).stepIndex + measureStartStep
              : -1;
          return s >= measureStartStep && s < measureEndStep;
        })
        .map((note, idx) => {
          let stepInMeasure = idx;
          if (typeof note.step === 'number') {
            stepInMeasure = note.step - measureStartStep;
          } else if (typeof (note as any).stepIndex === 'number') {
            stepInMeasure = (note as any).stepIndex;
          } else if (typeof (note as any).tick === 'number') {
            stepInMeasure = (note as any).tick;
          } else if (typeof (note as any).position === 'number') {
            stepInMeasure = (note as any).position;
          }

          return {
            id: note.id || `tab-note-${effectiveActiveMeasure}-${idx}`,
            stepInMeasure,
            string: note.string,
            fret: note.fret,
            technique: note.technique,
            slideDirection: note.slideDirection,
            bendType: note.bendType,
            bendAmount: note.bendAmount,
            finger: note.finger,
            pickDirection: note.pickDirection,
            palmMute: note.palmMute,
            strumDirection: note.strumDirection,
          };
        });
    }

    return [];
  }, [measures, tabData, effectiveActiveMeasure, effectiveStepsPerMeasure, measureStartStep, measureEndStep]);

  // Acorde guía del compás activo (estilo Bass Aerobics / Real Book)
  const currentMeasureChord = useMemo(() => {
    if (measures && measures[effectiveActiveMeasure]?.chordSymbol) {
      return measures[effectiveActiveMeasure].chordSymbol;
    }
    if (measures && (measures[effectiveActiveMeasure] as any)?.chord) {
      return (measures[effectiveActiveMeasure] as any).chord;
    }
    return null;
  }, [measures, effectiveActiveMeasure]);

  // Agrupar notas de este compás por paso relativo (0 a effectiveStepsPerMeasure - 1)
  const notesByStep = useMemo(() => {
    const map = new Map<number, RenderedNote[]>();
    for (let s = 0; s < effectiveStepsPerMeasure; s++) {
      map.set(s, []);
    }
    notesInCurrentMeasure.forEach((note: RenderedNote) => {
      if (note.stepInMeasure >= 0 && note.stepInMeasure < effectiveStepsPerMeasure) {
        map.get(note.stepInMeasure)?.push(note);
      }
    });
    return map;
  }, [notesInCurrentMeasure, effectiveStepsPerMeasure]);

  // Etiquetas rítmicas del compás dinámicas según subdivisión
  const beatLabels = subConfig.stepLabels;

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
      case 'pulloff':
        return { label: 'P', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.2)' };
      case 'bend':
        return { label: 'b', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' };
      case 'natural_harmonic':
        return { label: 'N.H.', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' };
      case 'pinch_harmonic':
        return { label: 'A.H.', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' };
      case 'slide':
        return { label: 's', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.2)' };
      case 'slide_up':
        return { label: '/', color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' };
      case 'slide_down':
        return { label: '\\', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.2)' };
      case 'vibrato':
        return { label: '~', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
      default:
        return null;
    }
  };

  const topStaffY = stringLines[0].y;
  const bottomStaffY = stringLines[stringLines.length - 1].y;

  // Progreso continuo suave del cabezal escáner dentro de este compás activo
  const localRunwayX = useMemo(() => {
    if (!isPlaying) {
      return leftPadding + ((effectiveStepInMeasure + 0.5) / effectiveStepsPerMeasure) * MEASURE_WIDTH;
    }
    const continuousStep = progress * effectiveTotalSteps;
    const continuousInMeasure = continuousStep - effectiveActiveMeasure * effectiveStepsPerMeasure;
    const clampedProgress = Math.max(0, Math.min(1, continuousInMeasure / effectiveStepsPerMeasure));
    return leftPadding + clampedProgress * MEASURE_WIDTH;
  }, [
    isPlaying,
    progress,
    effectiveTotalSteps,
    effectiveActiveMeasure,
    effectiveStepsPerMeasure,
    effectiveStepInMeasure,
    leftPadding,
    MEASURE_WIDTH,
  ]);

  const internalScrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = (scrollContainerRef || internalScrollRef) as React.RefObject<HTMLDivElement | null>;

  // Ancho mínimo por compás garantizado (38px a 44px por paso para evitar que las 16 notas se amontonen en móvil)
  const minMeasurePx = useMemo(() => {
    return Math.max(640, effectiveStepsPerMeasure * 40);
  }, [effectiveStepsPerMeasure]);

  // Auto-scroll para seguir el cursor de reproducción centrado en pantalla
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (el.scrollWidth <= el.clientWidth + 10) return;

    const cursorRatio = localRunwayX / SVG_WIDTH;
    const targetScrollLeft = cursorRatio * el.scrollWidth - el.clientWidth / 2;

    el.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: isPlaying ? 'smooth' : 'auto',
    });
  }, [effectiveStepInMeasure, localRunwayX, SVG_WIDTH, isPlaying, containerRef]);

  // Al cambiar de compás (Page Flip), reiniciar el scroll horizontal al inicio
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [effectiveActiveMeasure, containerRef]);

  return (
    <div className="w-full select-none flex flex-col items-center h-full">
      {/* Contenedor principal: Columna Lateral Fija TAB + Área de Compás Estático (Zero-Jerk, sin scroll) */}
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
        {/* CONTENEDOR DEL COMPÁS CON ANCHO AMPLIO Y SCROLL HORIZONTAL     */}
        {/* ============================================================== */}
        <div
          ref={containerRef}
          className="flex-1 relative p-2 sm:p-4 flex flex-col justify-center overflow-x-auto overflow-y-hidden custom-scrollbar"
        >
          {/* Badge del Compás Actual, Acorde y Subdivisión (sticky para permanecer visible) */}
          <div className="sticky left-2 top-0 z-30 self-start mb-1 px-2.5 py-0.5 rounded-md bg-cyan-950/85 border border-cyan-800/60 text-cyan-300 font-mono text-[11px] font-bold shadow-md select-none pointer-events-none flex items-center gap-1.5 shrink-0">
            <span>c.{effectiveActiveMeasure + 1} de {effectiveTotalMeasures}</span>
            {currentMeasureChord && (
              <>
                <span className="text-cyan-500">•</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/25 border border-amber-400/50 text-amber-300 font-black text-xs">
                  {currentMeasureChord}
                </span>
              </>
            )}
            <span className="text-cyan-500">•</span>
            <span className="text-amber-300 font-extrabold">{subConfig.id}</span>
          </div>

          {/* Capa de notas del compás activo con key para refresco limpio instantáneo */}
          <div
            key={`measure-flip-${effectiveActiveMeasure}`}
            className="w-full relative flex items-center justify-start transition-opacity duration-150 ease-out animate-fadeIn"
            style={{ minWidth: `${minMeasurePx}px` }}
          >
            {/* SVG del compás ajustado al ancho mínimo para máxima legibilidad */}
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="w-full h-auto drop-shadow-md select-none shrink-0"
              style={{ minWidth: `${minMeasurePx}px` }}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Glow Filter para el cabezal Runway */}
                <filter id={`runwayGlow-${effectiveActiveMeasure}`} x="-50%" y="-20%" width="200%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur1" />
                  <feGaussianBlur stdDeviation="7" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Destello de nota activa */}
                <radialGradient id={`hitBurst-${effectiveActiveMeasure}`} cx="50%" cy="50%" r="50%">
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
              {/* BARRA INICIAL DEL COMPÁS                                       */}
              {/* ============================================================== */}
              <line
                x1={leftPadding}
                y1={topStaffY - 8}
                x2={leftPadding}
                y2={bottomStaffY + 8}
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth={3}
              />

              {/* ============================================================== */}
              {/* ACORDE GUÍA POR COMPÁS (Real Book / Bass Aerobics Style)       */}
              {/* ============================================================== */}
              {currentMeasureChord && (
                <g className="select-none pointer-events-none" transform={`translate(${leftPadding + 6}, ${topStaffY - 30})`}>
                  <rect
                    x={0}
                    y={0}
                    width={Math.max(48, currentMeasureChord.length * 10 + 22)}
                    height={22}
                    rx={6}
                    fill="#090d16"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                  />
                  <text
                    x={Math.max(48, currentMeasureChord.length * 10 + 22) / 2}
                    y={15.5}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight="900"
                    fontFamily="monospace"
                    fill="#fbbf24"
                  >
                    {currentMeasureChord}
                  </text>
                </g>
              )}

              {/* ============================================================== */}
              {/* SUBDIVISIONES Y TIEMPOS (Adaptables a 1/8, 1/16, 1/4, 1/8T)    */}
              {/* ============================================================== */}
              {Array.from({ length: effectiveStepsPerMeasure }).map((_, s) => {
                const stepX = leftPadding + (s + 0.5) * stepWidth;
                const tickX = leftPadding + s * stepWidth;
                const text = beatLabels[s % beatLabels.length];
                const isBeat = !isNaN(Number(text));
                const isStepActive = isPlaying && effectiveStepInMeasure === s;

                return (
                  <g key={`subdiv-${effectiveActiveMeasure}-${s}`}>
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

                    {/* Conteo superior dinámico (1 y 2 y... ó 1 e & a...) */}
                    <text
                      x={stepX}
                      y={22}
                      textAnchor="middle"
                      fontSize={isBeat ? 13 : 11}
                      fontWeight={isBeat ? '800' : '600'}
                      fill={
                        isBeat
                          ? isStepActive
                            ? '#22d3ee'
                            : '#f1f5f9'
                          : isStepActive
                            ? '#38bdf8'
                            : '#94a3b8'
                      }
                      className="font-mono transition-colors duration-150"
                    >
                      {text}
                    </text>

                    {/* Flecha de Rasgueo para Acordes (>= 2 notas simultáneas en el paso) */}
                    {(() => {
                      const stepNotes = notesByStep.get(s) || [];
                      if (stepNotes.length < 2) return null;
                      const strumDir = stepNotes.find((n) => n.strumDirection)?.strumDirection || 'down';
                      const isDown = strumDir === 'down';
                      const isUp = strumDir === 'up';
                      const isMute = strumDir === 'mute';
                      const arrowChar = isDown ? '↓' : isUp ? '↑' : '×';
                      const arrowColor = isDown ? '#22d3ee' : isUp ? '#fbbf24' : '#fb7185';
                      const arrowBg = isDown
                        ? 'rgba(34, 211, 238, 0.18)'
                        : isUp
                          ? 'rgba(251, 191, 36, 0.18)'
                          : 'rgba(251, 113, 133, 0.18)';

                      return (
                        <g key={`runway-strum-${effectiveActiveMeasure}-${s}`} transform={`translate(${stepX}, 42)`}>
                          <rect
                            x={-10}
                            y={-9}
                            width={20}
                            height={18}
                            rx={4}
                            fill={arrowBg}
                            stroke={arrowColor}
                            strokeWidth={isStepActive ? 1.6 : 0.9}
                          />
                          <text
                            x={0}
                            y={isMute ? 3.5 : 4.5}
                            textAnchor="middle"
                            fontSize={isMute ? 12 : 14}
                            fontWeight="900"
                            fontFamily="monospace"
                            fill={arrowColor}
                            className="select-none pointer-events-none"
                          >
                            {arrowChar}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* ============================================================== */}
              {/* BARRA FINAL DEL COMPÁS / CIERRE DE REPETICIÓN                  */}
              {/* ============================================================== */}
              {effectiveActiveMeasure === effectiveTotalMeasures - 1 ? (
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
              {/* CAPA DE ARCOS DE LIGADURA (Hammer-on / Pull-off)               */}
              {/* ============================================================== */}
              {notesInCurrentMeasure.map((note, idx, arr) => {
                const tech = (note.technique || '').toLowerCase();
                if (tech !== 'hammer' && tech !== 'pulloff' && tech !== 'pull') return null;

                // Encontrar la nota precedente más cercana en la misma cuerda dentro de este compás
                const prevNote = arr
                  .filter((n) => n.string === note.string && n.stepInMeasure < note.stepInMeasure)
                  .sort((a, b) => b.stepInMeasure - a.stepInMeasure)[0];

                if (!prevNote) return null;

                const x1 = leftPadding + (prevNote.stepInMeasure + 0.5) * stepWidth;
                const x2 = leftPadding + (note.stepInMeasure + 0.5) * stepWidth;
                const stringY = getStringY(note.string);

                // Posicionar la curva justo por encima de los trastes
                const y = stringY - 14;
                const midX = (x1 + x2) / 2;
                const arcControlY = y - Math.min(18, Math.abs(x2 - x1) * 0.22);

                const isHammer = tech === 'hammer';
                const color = isHammer ? '#38bdf8' : '#fbbf24'; // Cyan para Hammer, Ámbar para Pull-off

                return (
                  <g key={`legato-slur-${note.id || idx}`} className="pointer-events-none select-none">
                    {/* Arco Curvo de Ligadura */}
                    <path
                      d={`M ${x1} ${y} Q ${midX} ${arcControlY} ${x2} ${y}`}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    {/* Insignia tipográfica 'h' o 'p' */}
                    <text
                      x={midX}
                      y={arcControlY - 3}
                      textAnchor="middle"
                      fill={color}
                      fontSize="11"
                      fontWeight="900"
                      fontFamily="ui-monospace, monospace"
                    >
                      {isHammer ? 'h' : 'p'}
                    </text>
                  </g>
                );
              })}

              {/* ============================================================== */}
              {/* CAPA DE BENDING (Standard Bend, Bend & Release, Pre-Bend)      */}
              {/* ============================================================== */}
              {notesInCurrentMeasure.map((note, idx) => {
                if ((note.technique || '').toLowerCase() !== 'bend') return null;
                const cx = leftPadding + (note.stepInMeasure + 0.5) * stepWidth;
                const cy = getStringY(note.string);
                const isRelease = note.bendType === 'bend_release';
                const isPreBend = note.bendType === 'pre_bend';
                const amountLabel =
                  note.bendAmount === '1/4'
                    ? '¼'
                    : note.bendAmount === '1/2'
                      ? '½'
                      : note.bendAmount === '1.5'
                        ? '1½'
                        : 'Full';

                return (
                  <g key={`runway-bend-${note.id || idx}`} className="pointer-events-none select-none">
                    {/* 1. Standard Bend (Flecha Curva Ascendente) */}
                    {!isRelease && !isPreBend && (
                      <>
                        <path
                          d={`M ${cx + 8} ${cy} Q ${cx + 14} ${cy - 14} ${cx + 12} ${cy - 22}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <polygon
                          points={`${cx + 12},${cy - 26} ${cx + 9},${cy - 20} ${cx + 15},${cy - 20}`}
                          fill="#10b981"
                        />
                      </>
                    )}

                    {/* 2. Bend & Release (Curva Parabólica Subida y Bajada) */}
                    {isRelease && (
                      <>
                        <path
                          d={`M ${cx + 4} ${cy} Q ${cx + 12} ${cy - 24} ${cx + 20} ${cy}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <polygon
                          points={`${cx + 20},${cy + 2} ${cx + 17},${cy - 4} ${cx + 23},${cy - 4}`}
                          fill="#10b981"
                        />
                      </>
                    )}

                    {/* 3. Pre-Bend (Flecha Vertical con Caída) */}
                    {isPreBend && (
                      <>
                        <line
                          x1={cx + 10}
                          y1={cy - 22}
                          x2={cx + 10}
                          y2={cy}
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="2 2"
                        />
                        <polygon
                          points={`${cx + 10},${cy + 2} ${cx + 7},${cy - 4} ${cx + 13},${cy - 4}`}
                          fill="#10b981"
                        />
                      </>
                    )}

                    {/* Insignia tipográfica superior con el valor */}
                    <rect
                      x={cx - 15}
                      y={cy - 30}
                      width="30"
                      height="12"
                      rx="3"
                      fill="#022c22"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    <text
                      x={cx}
                      y={cy - 21}
                      textAnchor="middle"
                      fill="#6ee7b7"
                      fontSize="8.5"
                      fontWeight="900"
                      fontFamily="ui-monospace, monospace"
                    >
                      {isPreBend ? `pb ${amountLabel}` : isRelease ? `b/r ${amountLabel}` : amountLabel}
                    </text>
                  </g>
                );
              })}

              {/* ============================================================== */}
              {/* NOTAS DE TABLATURA EN ESTE COMPÁS                              */}
              {/* ============================================================== */}
              {Array.from({ length: effectiveStepsPerMeasure }).map((_, s) => {
                const notes = notesByStep.get(s) || [];
                const noteX = leftPadding + (s + 0.5) * stepWidth;
                const isStepActive = isPlaying && effectiveStepInMeasure === s;

                return (
                  <g key={`step-notes-${effectiveActiveMeasure}-${s}`}>
                    {notes.map((note, noteIdx) => {
                      const noteY = getStringY(note.string);
                      const techBadge = getTechniqueBadge(note.technique);
                      const hasSlideUp = note.technique === 'slide_up' || note.slideDirection === 'up';
                      const hasSlideDown = note.technique === 'slide_down' || note.slideDirection === 'down';
                      const isGhost = note.technique === 'ghost';
                      const fretText = isGhost ? 'X' : `${hasSlideUp ? '/' : ''}${note.fret}${hasSlideDown ? '\\' : ''}`;
                      const pillWidth = fretText.length > 2 ? 28 : 22;

                      return (
                        <g key={`note-${effectiveActiveMeasure}-${s}-${noteIdx}`}>
                          {/* Halo reactivo al impactar el cabezal */}
                          {isStepActive && (
                            <ellipse
                              cx={noteX}
                              cy={noteY}
                              rx={18}
                              ry={14}
                              fill={`url(#hitBurst-${effectiveActiveMeasure})`}
                              className="pointer-events-none"
                            />
                          )}

                          {/* Trazo diagonal de entrada hacia la izquierda si es slide ascendente (/10) */}
                          {hasSlideUp && (
                            <line
                              x1={noteX - 18}
                              y1={noteY + 7}
                              x2={noteX - pillWidth / 2}
                              y2={noteY - 5}
                              stroke="#34d399"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          )}

                          {/* Píldora de máscara que corta limpiamente la línea */}
                          <rect
                            x={noteX - pillWidth / 2}
                            y={noteY - 9.5}
                            width={pillWidth}
                            height={19}
                            rx={5}
                            fill="#09090b"
                            stroke={
                              isStepActive
                                ? '#22d3ee'
                                : hasSlideUp
                                  ? '#34d399'
                                  : hasSlideDown
                                    ? '#fb7185'
                                    : 'rgba(255, 255, 255, 0.25)'
                            }
                            strokeWidth={isStepActive ? 2 : 1.2}
                            filter={isStepActive ? `url(#runwayGlow-${effectiveActiveMeasure})` : undefined}
                          />

                          {/* Trazo diagonal de salida hacia la derecha si es slide descendente (8\) */}
                          {hasSlideDown && (
                            <line
                              x1={noteX + pillWidth / 2}
                              y1={noteY - 5}
                              x2={noteX + 18}
                              y2={noteY + 7}
                              stroke="#fb7185"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          )}

                          {/* Número de traste */}
                          <text
                            x={noteX}
                            y={noteY + 4.5}
                            textAnchor="middle"
                            fontSize={fretText.length > 2 ? 11 : fretText.length > 1 ? 12 : 13}
                            fontWeight="800"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fill={
                              isStepActive
                                ? '#22d3ee'
                                : hasSlideUp
                                  ? '#34d399'
                                  : hasSlideDown
                                    ? '#fb7185'
                                    : '#f8fafc'
                            }
                            className="select-none"
                          >
                            {fretText}
                          </text>

                          {/* 1. ARRIBA DE LA NOTA: Símbolo de Púa / Picking (Π / V / m / a), Palm Mute (P.M.) y Técnica */}
                          {note.pickDirection && (
                            <g transform={`translate(${noteX}, ${noteY - 15})`}>
                              <rect
                                x="-6.5"
                                y="-6.5"
                                width="13"
                                height="13"
                                rx="3"
                                fill={
                                  note.pickDirection === 'down'
                                    ? 'rgba(34, 211, 238, 0.25)'
                                    : note.pickDirection === 'up'
                                      ? 'rgba(251, 191, 36, 0.25)'
                                      : 'rgba(192, 132, 252, 0.25)'
                                }
                                stroke={
                                  note.pickDirection === 'down'
                                    ? '#22d3ee'
                                    : note.pickDirection === 'up'
                                      ? '#fbbf24'
                                      : '#c084fc'
                                }
                                strokeWidth="1"
                              />
                              <text
                                x="0"
                                y="3.5"
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="900"
                                fontFamily="system-ui, monospace"
                                fill={
                                  note.pickDirection === 'down'
                                    ? '#22d3ee'
                                    : note.pickDirection === 'up'
                                      ? '#fbbf24'
                                      : '#c084fc'
                                }
                              >
                                {note.pickDirection === 'down'
                                  ? 'Π'
                                  : note.pickDirection === 'up'
                                    ? 'V'
                                    : note.pickDirection}
                              </text>
                            </g>
                          )}

                          {/* Marca Palm Mute (P.M.) - Arriba junto a la púa */}
                          {note.palmMute && (
                            <g transform={`translate(${noteX + (note.pickDirection ? 14 : 0)}, ${noteY - 15})`}>
                              <rect
                                x="-9"
                                y="-6"
                                width="18"
                                height="12"
                                rx="2.5"
                                fill="#022c22"
                                stroke="#10b981"
                                strokeWidth="0.8"
                              />
                              <text
                                x="0"
                                y="3"
                                textAnchor="middle"
                                fontSize="7.5"
                                fontWeight="900"
                                fontFamily="monospace"
                                fill="#34d399"
                              >
                                P.M.
                              </text>
                            </g>
                          )}

                          {/* Insignia de técnica (Slap 'S', Pop 'P', Slide '/', etc.) - Arriba */}
                          {techBadge &&
                            note.technique !== 'hammer' &&
                            note.technique !== 'pull' &&
                            note.technique !== 'pulloff' &&
                            note.technique !== 'bend' &&
                            note.technique !== 'slide_up' &&
                            note.technique !== 'slide_down' && (
                              <g transform={`translate(${noteX + (note.pickDirection ? -13 : 0)}, ${noteY - 15})`}>
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
                                  y="3.5"
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

                          {/* 2. ABAJO DE LA NOTA: Dedo sugerido (1, 2, 3, 4, T) en píldora ámbar */}
                          {note.finger && (
                            <g transform={`translate(${noteX}, ${noteY + 16})`}>
                              <rect
                                x="-6"
                                y="-6"
                                width="12"
                                height="12"
                                rx="2.5"
                                fill="#090d16"
                                stroke="rgba(251, 191, 36, 0.7)"
                                strokeWidth="0.8"
                              />
                              <text
                                x="0"
                                y="3.5"
                                textAnchor="middle"
                                fontSize="9.5"
                                fontWeight="bold"
                                fontFamily="monospace"
                                fill="#fcd34d"
                              >
                                {note.finger}
                              </text>
                            </g>
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
              {isPlaying && (
                <g transform={`translate(${localRunwayX}, 0)`}>
                  <line
                    x1="0"
                    y1={25}
                    x2="0"
                    y2={bottomStaffY + 22}
                    stroke="#06b6d4"
                    strokeWidth="10"
                    strokeOpacity="0.2"
                    filter={`url(#runwayGlow-${effectiveActiveMeasure})`}
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
                    filter={`url(#runwayGlow-${effectiveActiveMeasure})`}
                  />
                  <polygon
                    points={`-4.5,${bottomStaffY + 25} 4.5,${bottomStaffY + 25} 0,${bottomStaffY + 17}`}
                    fill="#22d3ee"
                    filter={`url(#runwayGlow-${effectiveActiveMeasure})`}
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Indicador de estado inferior (solo visible fuera de pantalla completa) */}
      {!isFullscreen && (
        <div className="w-full mt-2 flex items-center justify-between px-2 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>RUNWAY SCANNER:</span>
            <span className="text-zinc-300 font-medium">
              {isPlaying
                ? `Paso ${effectiveStepInMeasure + 1} / ${effectiveStepsPerMeasure} (${subConfig.id} ${subConfig.name} - Compás ${effectiveActiveMeasure + 1} de ${effectiveTotalMeasures})`
                : 'En pausa'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>AFINACIÓN: {tuning}</span>
            <span>•</span>
            <span>COMPÁS: {timeSignature}</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">SUBDIVISIÓN: {subConfig.id}</span>
            <span className="text-zinc-400 font-semibold">
              {isPlaying ? `${Math.round(progress * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablatureRunway;
