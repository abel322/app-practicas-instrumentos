'use client';

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { DrumHit } from '@/types/drum';
import { analyzeMeasureDuplicates, MeasureAnalysis } from '@/lib/music/measureFingerprint';

export interface DrumScoreProps {
  measure?: any;
  measures?: any[];
  hits?: DrumHit[];
  stepsPerMeasure?: number; // 8 para corcheas, 16 para semicorcheas
  currentStepInMeasure?: number;
  activeMeasureIndex?: number;
  totalMeasures?: number;
  timeSignature?: string;
  isPlaying?: boolean;
  progress?: number; // 0.0 to 1.0 dentro del compás activo
  onSelectMeasure?: (measureIndex: number) => void;
  isFullscreen?: boolean;
}

export function getDrumYPosition(voice: string = ''): number {
  const v = voice.toLowerCase();
  switch (v) {
    case 'crash':
      return 40; // Sobre la línea superior (línea adicional)
    case 'ride':
      return 60; // En la línea 5 (superior)
    case 'hihat':
    case 'hihat_open':
    case 'hihat_closed':
      return 50; // Justo sobre la línea 5
    case 'tom1':
      return 70; // 4º espacio
    case 'snare':
      return 100; // 3º espacio (caja)
    case 'tom2':
      return 110; // 2º espacio
    case 'floor_tom':
    case 'granadero':
      return 120; // 1º espacio
    case 'kick':
    case 'bombo':
      return 140; // Debajo de la línea 1 (bombo)
    default:
      return 100;
  }
}

export function DrumScoreRenderer({
  measure,
  measures,
  hits,
  stepsPerMeasure = 16,
  currentStepInMeasure = 0,
  activeMeasureIndex = 0,
  totalMeasures: totalMeasuresProp,
  timeSignature = '4/4',
  isPlaying = false,
  progress = 0,
  onSelectMeasure,
  isFullscreen = false,
}: DrumScoreProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevMeasureRef = useRef<number>(0);

  // Métrica
  const [numerator, denominator] = timeSignature ? timeSignature.split('/') : ['4', '4'];

  // Normalizar los compases en una estructura unificada
  const safeMeasures = useMemo(() => {
    if (Array.isArray(measures) && measures.length > 0) {
      return measures.map((m: any, idx: number) => ({
        measureIndex: idx,
        measureNumber: idx + 1,
        notes: (m.notes || m.hits || []).map((n: any) => ({
          ...n,
          stepIndex:
            n.stepIndex !== undefined
              ? n.stepIndex
              : n.step !== undefined
              ? n.step % stepsPerMeasure
              : 0,
          step:
            n.step !== undefined
              ? n.step
              : idx * stepsPerMeasure + (n.stepIndex || 0),
          instrument: n.instrument || n.drumType || n.instrumentKey || 'snare',
          accent: Boolean(n.accent),
          sticking: n.sticking || 'R',
          velocity: n.velocity ?? 0.8,
        })),
      }));
    }

    if (measure) {
      const rawNotes = Array.isArray(measure)
        ? measure
        : measure.notes || measure.hits || [];
      return [
        {
          measureIndex: 0,
          measureNumber: 1,
          notes: rawNotes.map((n: any) => ({
            ...n,
            stepIndex:
              n.stepIndex !== undefined
                ? n.stepIndex
                : n.step !== undefined
                ? n.step % stepsPerMeasure
                : 0,
            instrument: n.instrument || n.drumType || n.instrumentKey || 'snare',
            accent: Boolean(n.accent),
            sticking: n.sticking || 'R',
            velocity: n.velocity ?? 0.8,
          })),
        },
      ];
    }

    const count =
      totalMeasuresProp ||
      (hits && hits.length > 0
        ? Math.max(
            1,
            Math.ceil(
              Math.max(...hits.map((h: any) => (h.step || 0) + 1)) /
                stepsPerMeasure
            )
          )
        : 1);

    const allHits = hits || [];
    return Array.from({ length: count }).map((_, mIdx) => {
      const mStart = mIdx * stepsPerMeasure;
      const mEnd = mStart + stepsPerMeasure;
      const mNotes = allHits
        .filter((h: any) => {
          const s =
            h.step !== undefined
              ? h.step
              : h.stepIndex !== undefined
              ? h.stepIndex
              : 0;
          return s >= mStart && s < mEnd;
        })
        .map((h: any) => {
          const s =
            h.step !== undefined
              ? h.step
              : h.stepIndex !== undefined
              ? h.stepIndex
              : 0;
          return {
            ...h,
            step: s,
            stepIndex: s - mStart,
            instrument: h.instrument || h.drumType || h.instrumentKey || 'snare',
            accent: Boolean(h.accent),
            sticking: h.sticking || 'R',
            velocity: h.velocity ?? 0.8,
          };
        });

      return {
        measureIndex: mIdx,
        measureNumber: mIdx + 1,
        notes: mNotes,
      };
    });
  }, [measures, measure, hits, totalMeasuresProp, stepsPerMeasure]);

  const totalMeasures = safeMeasures.length;

  // Análisis automático de huellas digitales de compases duplicados y cambios de patrón
  const analysisList = useMemo<MeasureAnalysis[]>(() => {
    return analyzeMeasureDuplicates(safeMeasures);
  }, [safeMeasures]);

  // Etiquetas de subdivisión por paso dentro de cada compás
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

  // Geometría horizontal continua: cada compás mide exactamente 520px
  // Al usar stepWidth = MEASURE_WIDTH / stepsPerMeasure, la distancia entre el paso 16
  // de un compás y el paso 1 del siguiente es idéntica a cualquier otro paso (velocidad constante sin saltos).
  const MEASURE_WIDTH = 520;
  const stepWidth = MEASURE_WIDTH / stepsPerMeasure;

  const getXForStep = useCallback(
    (stepIdx: number) => (stepIdx + 0.5) * stepWidth,
    [stepWidth]
  );

  // Desplazamiento horizontal suave manteniendo el compás activo a la izquierda y el siguiente a la derecha
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const targetLeft = activeMeasureIndex * MEASURE_WIDTH;

    if (activeMeasureIndex === 0 && prevMeasureRef.current > 0) {
      // Reinicio limpio al volver al Compás 1
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }

    prevMeasureRef.current = activeMeasureIndex;
  }, [activeMeasureIndex, MEASURE_WIDTH]);

  // Posición continua milimétrica del cursor Runway Scanner a través de toda la cinta horizontal
  const scannerX = useMemo(() => {
    const currentStepContinuous = isPlaying
      ? progress * stepsPerMeasure
      : currentStepInMeasure;
    return (
      activeMeasureIndex * MEASURE_WIDTH +
      (currentStepContinuous + 0.5) * stepWidth
    );
  }, [
    isPlaying,
    progress,
    stepsPerMeasure,
    currentStepInMeasure,
    activeMeasureIndex,
    MEASURE_WIDTH,
    stepWidth,
  ]);

  const handleMeasurePillClick = useCallback(
    (idx: number) => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: idx * MEASURE_WIDTH,
          behavior: 'smooth',
        });
      }
      onSelectMeasure?.(idx);
    },
    [MEASURE_WIDTH, onSelectMeasure]
  );

  return (
    <div className="w-full flex flex-col gap-3 relative select-none">
      {/* ============================================================== */}
      {/* 1. BARRA DE PÍLDORAS DE COMPASES EN LA CABECERA DEL RUNWAY     */}
      {/* ============================================================== */}
      <div className="w-full flex items-center justify-between gap-2 px-1 pb-2 border-b border-white/5 select-none overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mr-1 shrink-0 font-mono">
            COMPASES:
          </span>
          {safeMeasures.map((_, idx) => {
            const analysis = analysisList[idx];
            const isCurrent = idx === activeMeasureIndex;
            const isNext = idx === activeMeasureIndex + 1;
            const isDup = analysis?.isDuplicate;
            const isChange = analysis?.isPatternChange;

            return (
              <button
                key={`pill-measure-${idx}`}
                type="button"
                onClick={() => handleMeasurePillClick(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                    : isDup
                    ? 'text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                    : isNext
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600'
                    : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
                title={`Ir al Compás ${idx + 1}`}
              >
                <span>C.{idx + 1}</span>

                {/* Etiqueta sutil SIGUIENTE */}
                {isNext && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-700/90 text-cyan-300 font-bold tracking-wider">
                    SIGUIENTE
                  </span>
                )}

                {/* Etiqueta de Compás Duplicado */}
                {isDup && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border text-amber-300 border-amber-500/40 bg-amber-500/10 font-semibold flex items-center gap-0.5`}
                  >
                    ↻ =C.{analysis.sourceMeasureNumber} ({analysis.occurrenceIndex}/{analysis.totalOccurrences})
                  </span>
                )}

                {/* Etiqueta de Cambio de Patrón */}
                {isChange && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 font-bold flex items-center gap-0.5">
                    ⚡ Cambio
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-400 shrink-0">
          <span className="text-zinc-500">Vista continua:</span>
          <span className="font-bold text-cyan-400">
            Compás {activeMeasureIndex + 1}
            {activeMeasureIndex + 1 < totalMeasures
              ? ` + Compás ${activeMeasureIndex + 2}`
              : ''}{' '}
            ({totalMeasures} total)
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CINTA HORIZONTAL CONTINUA (RUNWAY CON COMPASES LADO A LADO) */}
      {/* ============================================================== */}
      <div
        ref={scrollContainerRef}
        className={`w-full overflow-x-auto relative rounded-2xl bg-[#0c0e14] border border-slate-800/90 shadow-2xl custom-scrollbar ${
          isFullscreen ? 'max-h-[75vh]' : ''
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="inline-flex min-w-full relative">
          {/* ---------------------------------------------------------- */}
          {/* A. PANEL IZQUIERDO FIJO (STICKY LEFT-0 Z-10)               */}
          {/* ---------------------------------------------------------- */}
          <div
            className="sticky left-0 z-10 shrink-0 bg-[#0c0e14]/95 backdrop-blur-md border-r border-slate-700/70 shadow-[4px_0_14px_rgba(0,0,0,0.6)] flex flex-col"
            style={{ width: 72 }}
          >
            {/* Espaciador alineado con el encabezado superior de los compases */}
            <div className="h-9 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-center px-1">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-widest">
                𝄁 {timeSignature}
              </span>
            </div>

            {/* Pentagrama Fijo con las 5 líneas y Clave de Percusión */}
            <svg viewBox="0 0 72 220" className="w-[72px] h-[220px]">
              {/* 5 líneas horizontales del pentagrama a Y = [60, 80, 100, 120, 140] */}
              {[60, 80, 100, 120, 140].map((y, i) => (
                <line
                  key={`sticky-line-${i}`}
                  x1="0"
                  y1={y}
                  x2="72"
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1.5"
                />
              ))}

              {/* Clave de Percusión Neutral formal (2 barras verticales + símbolo 𝄁) */}
              <rect x="18" y="80" width="3.5" height="40" fill="#94a3b8" rx="0.5" />
              <rect x="26" y="80" width="3.5" height="40" fill="#94a3b8" rx="0.5" />
              <text
                x="24"
                y="108"
                fill="transparent"
                fontSize="18"
                textAnchor="middle"
                aria-label="Clave de percusión"
              >
                𝄁
              </text>

              {/* Métrica de compás (ej. 4/4) */}
              <text
                x="52"
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
                x="52"
                y="130"
                fill="#cbd5e1"
                fontSize="18"
                fontWeight="900"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {denominator || '4'}
              </text>
            </svg>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* B. PISTA DE COMPASES HORIZONTALES LADO A LADO              */}
          {/* ---------------------------------------------------------- */}
          <div
            className="flex flex-row flex-nowrap relative shrink-0"
            style={{ width: totalMeasures * MEASURE_WIDTH }}
          >
            {/* LÍNEA DE ESCANEO CONTINUA (RUNWAY SCANNER OVERLAY) */}
            <div
              className="absolute top-[36px] h-[220px] w-0 pointer-events-none z-10 transition-none"
              style={{
                left: 0,
                transform: `translateX(${scannerX}px)`,
                opacity: isPlaying ? 1 : 0.65,
              }}
            >
              {/* Halo de resplandor cian */}
              <div className="absolute -left-3 top-0 bottom-0 w-6 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent blur-[3px]" />

              {/* Línea láser vertical central */}
              <div className="absolute -left-[1.25px] top-4 bottom-5 w-[2.5px] bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

              {/* Cabezal guía superior */}
              <div className="absolute -left-1.5 top-3 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] border border-cyan-100" />

              {/* Cabezal guía inferior */}
              <div className="absolute -left-1.5 bottom-4 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] border border-cyan-100" />
            </div>

            {/* RENDERIZADO DE CADA COMPÁS (520px CADA UNO EN FILA HORIZONTAL) */}
            {safeMeasures.map((meas, mIdx) => {
              const analysis = analysisList[mIdx];
              const isCurrent = mIdx === activeMeasureIndex;
              const isNext = mIdx === activeMeasureIndex + 1;
              const opacityClass = isCurrent
                ? 'opacity-100'
                : isNext
                ? 'opacity-90'
                : 'opacity-65';

              // Agrupar notas de este compás por paso (0 a stepsPerMeasure - 1)
              const notesByStep = new Map<number, any[]>();
              for (let s = 0; s < stepsPerMeasure; s++) {
                notesByStep.set(s, []);
              }
              (meas.notes || []).forEach((n: any) => {
                const s =
                  n.stepIndex !== undefined
                    ? n.stepIndex
                    : n.step !== undefined
                    ? n.step % stepsPerMeasure
                    : 0;
                if (s >= 0 && s < stepsPerMeasure) {
                  notesByStep.get(s)?.push(n);
                }
              });

              return (
                <div
                  key={`measure-block-${mIdx}`}
                  onClick={() => handleMeasurePillClick(mIdx)}
                  className={`w-[520px] min-w-[520px] shrink-0 flex flex-col border-r border-slate-800/80 relative transition-opacity duration-300 cursor-pointer ${opacityClass} ${
                    isCurrent
                      ? 'bg-cyan-950/10'
                      : isNext
                      ? 'bg-slate-900/20'
                      : 'bg-transparent'
                  }`}
                >
                  {/* Encabezado Visual Dentro de Cada Compás en el Pentagrama */}
                  <div className="h-9 px-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-1 text-xs select-none">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-white font-mono tracking-wider">
                        COMPÁS {analysis ? analysis.measureNumber : mIdx + 1}
                      </span>
                      {isCurrent && (
                        <span className="bg-cyan-500/25 border border-cyan-400 text-cyan-200 text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-pulse flex items-center gap-1">
                          ▶ TOCANDO
                        </span>
                      )}
                      {isNext && (
                        <span className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          SIGUIENTE ➔
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {/* Badge Duplicado */}
                      {analysis?.isDuplicate && (
                        <span className="text-amber-300 border border-amber-500/50 bg-amber-500/15 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm truncate">
                          ↻ DUPLICADO DE C.{analysis.sourceMeasureNumber} • Rep.{' '}
                          {analysis.occurrenceIndex}/{analysis.totalOccurrences}
                        </span>
                      )}

                      {/* Badge Patrón Base */}
                      {analysis &&
                        analysis.totalOccurrences > 1 &&
                        !analysis.isDuplicate && (
                          <span className="text-cyan-300 border border-cyan-800/50 bg-cyan-950/60 text-[10px] font-semibold px-2 py-0.5 rounded-full truncate">
                            PATRÓN BASE (1/{analysis.totalOccurrences})
                          </span>
                        )}

                      {/* Badge Cambio de Patrón */}
                      {analysis?.isPatternChange && (
                        <span className="text-fuchsia-300 border border-fuchsia-500/60 bg-fuchsia-950/80 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(217,70,239,0.3)] animate-pulse truncate">
                          ⚡ CAMBIO DE PATRÓN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pentagrama SVG del Compás */}
                  <svg
                    viewBox={`0 0 ${MEASURE_WIDTH} 220`}
                    className="w-[520px] h-[220px]"
                  >
                    <defs>
                      <filter
                        id={`drumScanGlow-${mIdx}`}
                        x="-50%"
                        y="-20%"
                        width="200%"
                        height="140%"
                      >
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Guías y números de tiempo (1, 2, 3, 4 y subdivisiones) */}
                    {stepLabels.map((lbl, sIdx) => {
                      const cx = getXForStep(sIdx);
                      const isMainBeat = !isNaN(Number(lbl));
                      const isStepActive =
                        isPlaying && isCurrent && currentStepInMeasure === sIdx;

                      return (
                        <g key={`step-guide-${mIdx}-${sIdx}`}>
                          <line
                            x1={cx}
                            y1={isMainBeat ? 18 : 22}
                            x2={cx}
                            y2={30}
                            stroke={
                              isStepActive
                                ? '#22d3ee'
                                : isMainBeat
                                ? '#64748b'
                                : '#334155'
                            }
                            strokeWidth={isMainBeat ? 1.5 : 1}
                          />
                          <text
                            x={cx}
                            y={isMainBeat ? 14 : 16}
                            textAnchor="middle"
                            fontFamily="ui-monospace, monospace"
                            fontSize={isMainBeat ? '13' : '10'}
                            fontWeight={isMainBeat ? '900' : '600'}
                            fill={
                              isStepActive
                                ? '#22d3ee'
                                : isMainBeat
                                ? '#f8fafc'
                                : '#64748b'
                            }
                          >
                            {lbl}
                          </text>
                        </g>
                      );
                    })}

                    {/* 5 líneas horizontales continuas del pentagrama */}
                    {[60, 80, 100, 120, 140].map((y, lineIdx) => (
                      <line
                        key={`staff-line-${mIdx}-${lineIdx}`}
                        x1="0"
                        y1={y}
                        x2={MEASURE_WIDTH}
                        y2={y}
                        stroke="#334155"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Barra vertical divisoria izquierda */}
                    <line
                      x1="0"
                      y1="60"
                      x2="0"
                      y2="140"
                      stroke={analysis?.isDuplicate ? '#f59e0b' : '#94a3b8'}
                      strokeWidth="2.5"
                    />

                    {/* Etiqueta '= C.X' en la barra divisoria izquierda si es compás duplicado */}
                    {analysis?.isDuplicate && (
                      <text
                        x="6"
                        y="52"
                        fill="#fbbf24"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="ui-monospace, monospace"
                        textAnchor="start"
                      >
                        = C.{analysis.sourceMeasureNumber}
                      </text>
                    )}

                    {/* Doble barra final si es el último compás */}
                    {mIdx === totalMeasures - 1 && (
                      <>
                        <line
                          x1={MEASURE_WIDTH - 4}
                          y1="60"
                          x2={MEASURE_WIDTH - 4}
                          y2="140"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={MEASURE_WIDTH - 1}
                          y1="60"
                          x2={MEASURE_WIDTH - 1}
                          y2="140"
                          stroke="#94a3b8"
                          strokeWidth="3"
                        />
                      </>
                    )}

                    {/* Guías verticales punteadas entre pasos */}
                    {Array.from({ length: stepsPerMeasure }).map((_, sIdx) => {
                      const cx = getXForStep(sIdx);
                      const isMainBeat =
                        sIdx % (stepsPerMeasure === 8 ? 2 : 4) === 0;
                      return (
                        <line
                          key={`grid-${mIdx}-${sIdx}`}
                          x1={cx}
                          y1="50"
                          x2={cx}
                          y2="150"
                          stroke={
                            isMainBeat
                              ? 'rgba(255,255,255,0.09)'
                              : 'rgba(255,255,255,0.03)'
                          }
                          strokeWidth={isMainBeat ? '1.2' : '0.8'}
                          strokeDasharray="2,3"
                        />
                      );
                    })}

                    {/* Notas, Plicas, Sticking (R en rojo, L en azul) y Acentos (>) */}
                    {Array.from(notesByStep.entries()).map(
                      ([sIdx, stepNotes]) => {
                        if (!stepNotes || stepNotes.length === 0) return null;
                        const cx = getXForStep(sIdx);
                        const isStepActive =
                          isPlaying &&
                          isCurrent &&
                          currentStepInMeasure === sIdx;

                        const yPositions = stepNotes.map((n: any) =>
                          getDrumYPosition(
                            n.instrumentKey || n.drumType || n.instrument
                          )
                        );
                        const maxY = Math.max(...yPositions);
                        const stemTop = 38;

                        const accentNote = stepNotes.find((n: any) => n.accent);
                        const stickingNote = stepNotes.find(
                          (n: any) => n.sticking
                        );

                        return (
                          <g key={`step-col-${mIdx}-${sIdx}`}>
                            {/* Plica vertical */}
                            <line
                              x1={cx + 6}
                              y1={stemTop}
                              x2={cx + 6}
                              y2={maxY}
                              stroke={isStepActive ? '#22d3ee' : '#64748b'}
                              strokeWidth="1.6"
                            />

                            {/* Símbolo de Acento ('>') sobre la plica */}
                            {accentNote && (
                              <path
                                d={`M ${cx - 5} ${stemTop - 8} L ${
                                  cx + 5
                                } ${stemTop - 5} L ${cx - 5} ${stemTop - 2}`}
                                stroke={isStepActive ? '#00f0ff' : '#f8fafc'}
                                strokeWidth="2.2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* Cabezas de notas: ● para tambores y × para platos */}
                            {stepNotes.map((note: any, nIdx: number) => {
                              const voice =
                                note.instrumentKey ||
                                note.drumType ||
                                note.instrument ||
                                'snare';
                              const cy = getDrumYPosition(voice);
                              const isCymbal = [
                                'hihat',
                                'hihat_open',
                                'hihat_closed',
                                'crash',
                                'ride',
                              ].includes(voice.toLowerCase());

                              return (
                                <g key={`note-${mIdx}-${sIdx}-${nIdx}`}>
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

                                  {/* Cabeza de nota cian: cruz (×) para platos o elipse (●) para tambores */}
                                  {isCymbal ? (
                                    <g>
                                      <path
                                        d={`M ${cx - 5.5} ${cy - 5.5} L ${
                                          cx + 5.5
                                        } ${cy + 5.5} M ${cx + 5.5} ${
                                          cy - 5.5
                                        } L ${cx - 5.5} ${cy + 5.5}`}
                                        stroke={
                                          isStepActive ? '#22d3ee' : '#38bdf8'
                                        }
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                      />
                                      {voice.toLowerCase() ===
                                        'hihat_open' && (
                                        <circle
                                          cx={cx}
                                          cy={cy - 9}
                                          r="3"
                                          stroke={
                                            isStepActive
                                              ? '#22d3ee'
                                              : '#38bdf8'
                                          }
                                          strokeWidth="1.2"
                                          fill="none"
                                        />
                                      )}
                                    </g>
                                  ) : (
                                    <ellipse
                                      cx={cx}
                                      cy={cy}
                                      rx="6.5"
                                      ry="5"
                                      fill={
                                        isStepActive ? '#22d3ee' : '#38bdf8'
                                      }
                                      transform={`rotate(-15, ${cx}, ${cy})`}
                                      filter={
                                        isStepActive
                                          ? `url(#drumScanGlow-${mIdx})`
                                          : undefined
                                      }
                                    />
                                  )}
                                </g>
                              );
                            })}

                            {/* Etiqueta de Sticking debajo de cada nota: R en rojo, L en azul */}
                            {stickingNote && stickingNote.sticking && (
                              <text
                                x={cx}
                                y="176"
                                textAnchor="middle"
                                fill={
                                  stickingNote.sticking === 'R'
                                    ? '#ef4444' // R en Rojo
                                    : stickingNote.sticking === 'L'
                                    ? '#3b82f6' // L en Azul
                                    : '#34d399' // Otros (K, B) en Esmeralda
                                }
                                fontSize="13"
                                fontWeight="bold"
                                fontFamily="monospace"
                                className="transition-transform duration-75"
                                style={{
                                  transform: isStepActive
                                    ? 'scale(1.25)'
                                    : 'scale(1)',
                                  transformOrigin: `${cx}px 176px`,
                                }}
                              >
                                {stickingNote.sticking}
                              </text>
                            )}

                            {/* Etiqueta de Acento (>) debajo de la nota */}
                            {accentNote && (
                              <text
                                x={cx}
                                y="194"
                                textAnchor="middle"
                                fill={isStepActive ? '#22d3ee' : '#fbbf24'}
                                fontSize="12"
                                fontWeight="900"
                                fontFamily="monospace"
                              >
                                &gt;
                              </text>
                            )}
                          </g>
                        );
                      }
                    )}
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const DrumScoreSVG = DrumScoreRenderer;
export default DrumScoreRenderer;
