'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  InstrumentType,
  INSTRUMENTS,
  NoteRole,
  getFretNote,
} from '@/lib/music-theory/fretboard';
import { getFretboardAudioEngine } from '@/lib/music-theory/fretboardAudio';
import { Volume2, Sparkles, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export interface ActiveFretNote {
  stringIndex: number; // 0 = más aguda (superior), N-1 = más grave (inferior)
  fret: number;        // 0 = al aire, 1..24
  note: string;
  interval: string;
  role: NoteRole;
  finger?: string;
  midi: number;
}

interface InteractiveFretboardProps {
  instrument: InstrumentType;
  activeNotes: ActiveFretNote[];
  displayMode: 'notes' | 'intervals';
  fretFocusRange?: [number, number] | null;
  onNoteClick?: (note: ActiveFretNote) => void;
  title?: string;
}

// Inlays estándar: simples en 3, 5, 7, 9, 15, 17, 19, 21; dobles en 12 y 24
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];

export const InteractiveFretboard: React.FC<InteractiveFretboardProps> = ({
  instrument,
  activeNotes,
  displayMode,
  fretFocusRange,
  onNoteClick,
  title,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastPlayedKey, setLastPlayedKey] = useState<string | null>(null);
  const [hoveredNote, setHoveredNote] = useState<ActiveFretNote | null>(null);

  const config = INSTRUMENTS[instrument];
  const numStrings = config.strings.length;
  const totalFrets = config.totalFrets; // 24

  // Mapa rápido de notas activas por clave `${stringIndex}_${fret}`
  const activeNoteMap = useMemo(() => {
    const map = new Map<string, ActiveFretNote>();
    activeNotes.forEach((item) => {
      map.set(`${item.stringIndex}_${item.fret}`, item);
    });
    return map;
  }, [activeNotes]);

  // Dimensiones del mástil SVG
  const nutWidth = 32;
  const stringSpacing = 36;
  const topPadding = 32;
  const bottomPadding = 32;
  const neckHeight = topPadding + bottomPadding + (numStrings - 1) * stringSpacing;

  // Ancho variable decreciente para los trastes 1..24
  const fretWidths = useMemo(() => {
    const widths: number[] = [nutWidth]; // fret 0
    for (let f = 1; f <= totalFrets; f++) {
      // Disminución armónica suave de 68px hasta 38px
      const w = Math.round(68 * Math.pow(0.976, f - 1));
      widths.push(Math.max(38, w));
    }
    return widths;
  }, [totalFrets]);

  // Posiciones X acumuladas de cada traste
  const fretPositions = useMemo(() => {
    const positions: { startX: number; width: number; centerX: number; wireX: number }[] = [];
    let currentX = 54; // margen izquierdo para nombres de cuerdas

    for (let f = 0; f <= totalFrets; f++) {
      const w = fretWidths[f];
      positions.push({
        startX: currentX,
        width: w,
        centerX: currentX + w / 2,
        wireX: currentX + w,
      });
      currentX += w;
    }
    return { positions, totalWidth: currentX + 40 };
  }, [fretWidths, totalFrets]);

  // Posición Y de cada cuerda
  const getStringY = (stringIndex: number) => {
    return topPadding + stringIndex * stringSpacing;
  };

  // Calibre visual de las cuerdas (proporcional al instrumento)
  const getStringGauge = (stringIndex: number) => {
    // stringIndex 0 es la más aguda, numStrings - 1 es la más grave
    if (instrument === 'guitar_6') {
      const gauges = [1.6, 2.0, 2.6, 3.4, 4.4, 5.4];
      return gauges[stringIndex] || 2.5;
    }
    if (instrument === 'bass_4') {
      const gauges = [2.6, 3.8, 5.0, 6.4];
      return gauges[stringIndex] || 4.0;
    }
    // bass_5
    const gauges = [2.6, 3.6, 4.8, 6.0, 7.5];
    return gauges[stringIndex] || 5.0;
  };

  // Reproducir nota
  const handlePlayNote = (stringIndex: number, fret: number) => {
    const stringConfig = config.strings[stringIndex];
    if (!stringConfig) return;

    const midi = stringConfig.midi + fret;
    const audio = getFretboardAudioEngine();
    audio.triggerNote(midi);

    const key = `${stringIndex}_${fret}`;
    setLastPlayedKey(key);
    setTimeout(() => {
      setLastPlayedKey((prev) => (prev === key ? null : prev));
    }, 450);

    const activeItem = activeNoteMap.get(key);
    if (activeItem && onNoteClick) {
      onNoteClick(activeItem);
    }
  };

  // Desplazamiento horizontal con botones o auto-focus en fretRange
  const scrollFretboard = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const delta = direction === 'left' ? -350 : 350;
      containerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Auto-scroll inteligente al rango enfocado si cambia
  useEffect(() => {
    if (fretFocusRange && containerRef.current) {
      const minFret = fretFocusRange[0];
      const targetPos = fretPositions.positions[minFret];
      if (targetPos) {
        const scrollOffset = Math.max(0, targetPos.startX - 60);
        containerRef.current.scrollTo({
          left: scrollOffset,
          behavior: 'smooth',
        });
      }
    }
  }, [fretFocusRange, fretPositions]);

  // Color de nota según rol armónico optimizado para fondo de madera noble (Palisandro)
  const getNoteRoleStyle = (role: NoteRole) => {
    switch (role) {
      case 'root':
        return {
          fill: '#22d3ee', // Cyan 400 brillante
          stroke: '#06b6d4', // Cyan 500
          textFill: '#020617', // Contraste cristalino
          shadow: 'rgba(34, 211, 238, 0.95)',
          ringColor: 'rgba(34, 211, 238, 0.5)',
        };
      case 'third':
        return {
          fill: '#d946ef', // Fuchsia 500 nítido
          stroke: '#f0abfc', // Fuchsia 300
          textFill: '#ffffff',
          shadow: 'rgba(217, 70, 239, 0.9)',
          ringColor: 'rgba(240, 171, 252, 0.45)',
        };
      case 'seventh':
        return {
          fill: '#fbbf24', // Ámbar 400 cálido
          stroke: '#fde68a', // Ámbar 200
          textFill: '#020617',
          shadow: 'rgba(251, 191, 36, 0.9)',
          ringColor: 'rgba(253, 230, 138, 0.45)',
        };
      case 'fifth':
        return {
          fill: '#14b8a6', // Teal 500
          stroke: '#5eead4', // Teal 300
          textFill: '#020617',
          shadow: 'rgba(20, 184, 166, 0.85)',
          ringColor: 'rgba(94, 234, 212, 0.4)',
        };
      default:
        return {
          fill: '#475569',
          stroke: '#cbd5e1',
          textFill: '#f8fafc',
          shadow: 'rgba(100, 116, 139, 0.6)',
          ringColor: 'rgba(203, 213, 225, 0.3)',
        };
    }
  };

  return (
    <div className="w-full max-w-full rounded-2xl overflow-hidden border-4 border-[#1a0e08] shadow-2xl bg-[#2a170e] my-2 min-w-0">
      {/* Barra de estado del mástil: Tónica actual, posición y ayuda de deslizamiento */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#3d1f11] bg-[#1a0e08]/90 text-[11px] text-amber-200/80 font-mono backdrop-blur-md">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          <span className="font-bold text-amber-100 text-xs truncate">
            {title || `Diapasón 24T • ${config.name}`}
          </span>
          {fretFocusRange && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono shrink-0 border border-amber-500/40">
              Tr. {fretFocusRange[0]}–{fretFocusRange[1]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {hoveredNote && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-cyan-300 font-bold bg-[#140b06] px-2.5 py-0.5 rounded border border-[#5c3a28]">
              <span>{hoveredNote.note}</span>
              <span className="text-amber-500/60">•</span>
              <span className="text-amber-200/80">{hoveredNote.interval}</span>
            </div>
          )}
          <span className="flex items-center gap-1 text-[10px] text-amber-200/50">
            ↔ Desliza (0 - 24)
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => scrollFretboard('left')}
              className="p-1 rounded bg-[#2e160e]/60 hover:bg-[#3d1f11] text-amber-200/70 hover:text-amber-100 transition-colors border border-[#5c3a28]/60"
              title="Izquierda"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollFretboard('right')}
              className="p-1 rounded bg-[#2e160e]/60 hover:bg-[#3d1f11] text-amber-200/70 hover:text-amber-100 transition-colors border border-[#5c3a28]/60"
              title="Derecha"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor con scroll horizontal propio: Mástil de Palisandro Noble Real */}
      <div
        ref={containerRef}
        className="w-full max-w-full overflow-x-auto overflow-y-hidden scroll-smooth touch-pan-x py-3 px-1 custom-scrollbar min-w-0 select-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          background: 'linear-gradient(180deg, #170a05 0%, #29140b 15%, #3a1c10 50%, #29140b 85%, #170a05 100%)',
          boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.7), inset 0 -4px 14px rgba(0,0,0,0.7)',
        }}
      >
        <div className="inline-block" style={{ width: fretPositions.totalWidth }}>
          <svg
            width={fretPositions.totalWidth}
            height={neckHeight}
            className="block"
            style={{ minWidth: fretPositions.totalWidth }}
          >
          <defs>
            {/* Veta Noble de Palisandro / Indian Rosewood */}
            <linearGradient id="rosewoodFretboard" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e0f09" />
              <stop offset="15%" stopColor="#2c160c" />
              <stop offset="35%" stopColor="#3d1f11" />
              <stop offset="50%" stopColor="#4a2615" />
              <stop offset="65%" stopColor="#3d1f11" />
              <stop offset="85%" stopColor="#28140b" />
              <stop offset="100%" stopColor="#1a0d07" />
            </linearGradient>

            {/* Cejuela de Hueso / Marfil Real */}
            <linearGradient id="boneNutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b8aa93" />
              <stop offset="35%" stopColor="#e8dfd1" />
              <stop offset="70%" stopColor="#d9cfbe" />
              <stop offset="100%" stopColor="#8c7a65" />
            </linearGradient>

            {/* Trastes Níquel-Plata con Relieve Metálico */}
            <linearGradient id="nickelFretWire" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="25%" stopColor="#9ca3af" />
              <stop offset="50%" stopColor="#f3f4f6" />
              <stop offset="75%" stopColor="#d1d5db" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>

            {/* Inlays Perlados de Nácar con Brillo Realista */}
            <radialGradient id="pearlInlayGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#f1f5f9" />
              <stop offset="75%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>

            {/* Cuerdas Lisas de Acero Pulido */}
            <linearGradient id="plainSteelString" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e5e7eb" />
              <stop offset="65%" stopColor="#9ca3af" />
              <stop offset="100%" stopColor="#4b5563" />
            </linearGradient>

            {/* Cuerdas Entorchadas de Níquel / Bronce Cálido */}
            <linearGradient id="woundNickelString" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="25%" stopColor="#e2e8f0" />
              <stop offset="55%" stopColor="#94a3b8" />
              <stop offset="85%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Filtros de Resplandor Neón */}
            <filter id="glowCyan" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#06b6d4" floodOpacity="0.85" />
            </filter>
            <filter id="glowFuchsia" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#d946ef" floodOpacity="0.8" />
            </filter>
            <filter id="glowAmber" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#f59e0b" floodOpacity="0.8" />
            </filter>
            <filter id="glowActive" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#22d3ee" floodOpacity="1" />
            </filter>
          </defs>

          {/* 1. Mástil de madera noble (Palisandro / Indian Rosewood) */}
          {(() => {
            const nutPos = fretPositions.positions[0];
            const endPos = fretPositions.positions[totalFrets];
            const neckStartX = nutPos.startX + nutPos.width;
            const neckWidth = endPos.wireX - neckStartX;
            const neckY = topPadding - 14;
            const neckH = (numStrings - 1) * stringSpacing + 28;

            return (
              <g id="neckWood">
                {/* Madera principal de Palisandro */}
                <rect
                  x={neckStartX}
                  y={neckY}
                  width={neckWidth}
                  height={neckH}
                  rx={8}
                  fill="url(#rosewoodFretboard)"
                  stroke="#1a0e08"
                  strokeWidth={2.5}
                />

                {/* Vetas orgánicas longitudinales de la madera */}
                <line x1={neckStartX} y1={neckY + neckH * 0.22} x2={neckStartX + neckWidth} y2={neckY + neckH * 0.22} stroke="#130804" strokeWidth={1.5} opacity={0.35} />
                <line x1={neckStartX} y1={neckY + neckH * 0.45} x2={neckStartX + neckWidth} y2={neckY + neckH * 0.45} stroke="#542c19" strokeWidth={1} opacity={0.25} />
                <line x1={neckStartX} y1={neckY + neckH * 0.72} x2={neckStartX + neckWidth} y2={neckY + neckH * 0.72} stroke="#130804" strokeWidth={1.5} opacity={0.35} />
                <line x1={neckStartX} y1={neckY + neckH * 0.88} x2={neckStartX + neckWidth} y2={neckY + neckH * 0.88} stroke="#542c19" strokeWidth={1} opacity={0.2} />

                {/* Resaltado del rango enfocado (Caja o Posición de Acorde) */}
                {fretFocusRange && (
                  (() => {
                    const [startF, endF] = fretFocusRange;
                    const pStart = fretPositions.positions[Math.max(1, startF)];
                    const pEnd = fretPositions.positions[Math.min(totalFrets, endF)];
                    if (!pStart || !pEnd) return null;
                    const boxX = pStart.startX;
                    const boxW = pEnd.wireX - boxX;

                    return (
                      <rect
                        x={boxX}
                        y={neckY - 2}
                        width={boxW}
                        height={neckH + 4}
                        rx={6}
                        fill="rgba(34, 211, 238, 0.12)"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        className="animate-pulse"
                      />
                    );
                  })()
                )}
              </g>
            );
          })()}

          {/* 2. Inlays Perlados de Nácar (Marcadores de Traste Clásicos) */}
          <g id="fretInlays">
            {SINGLE_INLAYS.map((fret) => {
              const pos = fretPositions.positions[fret];
              if (!pos) return null;
              const centerY = topPadding + ((numStrings - 1) * stringSpacing) / 2;

              return (
                <g key={`inlay_${fret}`}>
                  {/* Sombra de embutido en madera */}
                  <circle
                    cx={pos.centerX}
                    cy={centerY + 0.8}
                    r={6.5}
                    fill="#130804"
                    opacity={0.8}
                  />
                  {/* Disco de nácar perlado */}
                  <circle
                    cx={pos.centerX}
                    cy={centerY}
                    r={6}
                    fill="url(#pearlInlayGradient)"
                    stroke="#94a3b8"
                    strokeWidth={0.8}
                    opacity={0.92}
                  />
                </g>
              );
            })}

            {/* Trastes dobles: 12 y 24 */}
            {DOUBLE_INLAYS.map((fret) => {
              const pos = fretPositions.positions[fret];
              if (!pos) return null;
              const centerY = topPadding + ((numStrings - 1) * stringSpacing) / 2;
              const offset = stringSpacing * 0.75;

              return (
                <g key={`double_inlay_${fret}`}>
                  <circle cx={pos.centerX} cy={centerY - offset + 0.8} r={5.5} fill="#130804" opacity={0.8} />
                  <circle
                    cx={pos.centerX}
                    cy={centerY - offset}
                    r={5}
                    fill="url(#pearlInlayGradient)"
                    stroke="#94a3b8"
                    strokeWidth={0.8}
                    opacity={0.92}
                  />
                  <circle cx={pos.centerX} cy={centerY + offset + 0.8} r={5.5} fill="#130804" opacity={0.8} />
                  <circle
                    cx={pos.centerX}
                    cy={centerY + offset}
                    r={5}
                    fill="url(#pearlInlayGradient)"
                    stroke="#94a3b8"
                    strokeWidth={0.8}
                    opacity={0.92}
                  />
                </g>
              );
            })}
          </g>

          {/* 3. Cejuela (Nut / Traste 0) en Acabado Hueso / Marfil */}
          {(() => {
            const nut = fretPositions.positions[0];
            const nutY = topPadding - 16;
            const nutH = (numStrings - 1) * stringSpacing + 32;

            return (
              <g id="nutBar">
                <rect
                  x={nut.startX + 6}
                  y={nutY}
                  width={nut.width - 6}
                  height={nutH}
                  rx={3}
                  fill="url(#boneNutGradient)"
                  stroke="#5c4a38"
                  strokeWidth={1.5}
                  filter="drop-shadow(2px 0px 4px rgba(0,0,0,0.7))"
                />
                <line
                  x1={nut.startX + nut.width}
                  y1={nutY}
                  x2={nut.startX + nut.width}
                  y2={nutY + nutH}
                  stroke="#2e160e"
                  strokeWidth={2}
                />
                <text
                  x={nut.centerX + 3}
                  y={topPadding - 22}
                  textAnchor="middle"
                  fill="#b8aa93"
                  fontSize={10}
                  fontWeight="black"
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  CEJUELA
                </text>
              </g>
            );
          })()}

          {/* 4. Trastes metálicos con Relieve (Fretwires 1..24) */}
          <g id="fretWires">
            {fretPositions.positions.slice(1).map((pos, idx) => {
              const fretNum = idx + 1;
              const lineY1 = topPadding - 14;
              const lineY2 = topPadding + (numStrings - 1) * stringSpacing + 14;

              return (
                <g key={`wire_${fretNum}`}>
                  {/* Ranura oscura bajo la corona del traste */}
                  <line
                    x1={pos.wireX - 1.5}
                    y1={lineY1}
                    x2={pos.wireX - 1.5}
                    y2={lineY2}
                    stroke="#100703"
                    strokeWidth={2}
                  />
                  {/* Sombra de relieve de traste */}
                  <line
                    x1={pos.wireX + 1.2}
                    y1={lineY1}
                    x2={pos.wireX + 1.2}
                    y2={lineY2}
                    stroke="rgba(0,0,0,0.7)"
                    strokeWidth={1.5}
                  />
                  {/* Barra metálica de níquel brillante */}
                  <line
                    x1={pos.wireX}
                    y1={lineY1}
                    x2={pos.wireX}
                    y2={lineY2}
                    stroke="url(#nickelFretWire)"
                    strokeWidth={2.8}
                    strokeLinecap="round"
                  />
                  {/* Número de traste superior e inferior */}
                  <text
                    x={pos.centerX}
                    y={topPadding - 20}
                    textAnchor="middle"
                    fill={fretNum === 12 || fretNum === 24 ? '#fbbf24' : '#cbd5e1'}
                    fontSize={11}
                    fontFamily="monospace"
                    fontWeight={fretNum === 12 || fretNum === 24 ? '900' : 'bold'}
                  >
                    {fretNum}
                  </text>
                  <text
                    x={pos.centerX}
                    y={lineY2 + 16}
                    textAnchor="middle"
                    fill={fretNum === 12 || fretNum === 24 ? '#fbbf24' : '#94a3b8'}
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    {fretNum}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 5. Nombres y Afinación de Cuerdas al inicio */}
          <g id="stringBadges">
            {config.strings.map((str, sIdx) => {
              const y = getStringY(sIdx);
              return (
                <g
                  key={`str_badge_${sIdx}`}
                  className="cursor-pointer group"
                  onClick={() => handlePlayNote(sIdx, 0)}
                >
                  <rect
                    x={6}
                    y={y - 12}
                    width={38}
                    height={24}
                    rx={6}
                    fill="#2a170e"
                    stroke="#5c3a28"
                    strokeWidth={1.5}
                    className="group-hover:stroke-cyan-400 group-hover:fill-[#381f13] transition-colors"
                  />
                  <text
                    x={25}
                    y={y + 4}
                    textAnchor="middle"
                    fill="#fef3c7"
                    fontSize={11}
                    fontWeight="black"
                    fontFamily="monospace"
                    className="group-hover:fill-cyan-300"
                  >
                    {str.note}
                    <tspan fontSize={9} fill="#d4af37">
                      {str.octave}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </g>

          {/* 6. Cuerdas del Instrumento (Acero y Bronce Entorchado con Relieve) */}
          <g id="strings">
            {config.strings.map((str, sIdx) => {
              const y = getStringY(sIdx);
              const gauge = getStringGauge(sIdx);
              const startX = 46;
              const endX = fretPositions.positions[totalFrets].wireX + 16;
              const isWound = sIdx >= (numStrings > 4 ? 2 : 1);

              return (
                <g key={`string_${sIdx}`}>
                  {/* Sombra de la cuerda proyectada sobre la madera de palisandro */}
                  <line
                    x1={startX}
                    y1={y + 2.5}
                    x2={endX}
                    y2={y + 2.5}
                    stroke="#0a0402"
                    strokeWidth={gauge + 1.2}
                    opacity={0.8}
                  />
                  {/* Cuerda metálica con su gradiente */}
                  <line
                    x1={startX}
                    y1={y}
                    x2={endX}
                    y2={y}
                    stroke={isWound ? 'url(#woundNickelString)' : 'url(#plainSteelString)'}
                    strokeWidth={gauge}
                    strokeLinecap="butt"
                  />
                </g>
              );
            })}
          </g>

          {/* 7. Áreas clickeables invisibles para todos los trastes (Permite explorar cualquier nota) */}
          <g id="clickableFretGrid">
            {config.strings.map((str, sIdx) => {
              const y = getStringY(sIdx);
              return fretPositions.positions.map((pos, fIdx) => {
                const noteInfo = getFretNote(str.midi, fIdx);
                const key = `${sIdx}_${fIdx}`;
                const isActive = activeNoteMap.has(key);

                // Si ya está activo, lo renderiza la capa siguiente con estilo completo
                if (isActive) return null;

                const isCurrentPlayed = lastPlayedKey === key;

                return (
                  <g
                    key={`empty_slot_${key}`}
                    className="cursor-pointer group"
                    onClick={() => handlePlayNote(sIdx, fIdx)}
                  >
                    {/* Zona táctil invisible amplia */}
                    <rect
                      x={pos.startX}
                      y={y - stringSpacing / 2}
                      width={pos.width}
                      height={stringSpacing}
                      fill="transparent"
                    />

                    {/* Efecto hover suave: muestra la nota semi-transparente para exploración libre */}
                    <circle
                      cx={pos.centerX}
                      cy={y}
                      r={11}
                      fill="#27272a"
                      stroke="#52525b"
                      strokeWidth={1}
                      opacity={0}
                      className="group-hover:opacity-75 transition-opacity"
                    />
                    <text
                      cx={pos.centerX}
                      x={pos.centerX}
                      y={y + 3.5}
                      textAnchor="middle"
                      fill="#a1a1aa"
                      fontSize={9}
                      fontWeight="bold"
                      fontFamily="monospace"
                      opacity={0}
                      className="group-hover:opacity-100 transition-opacity pointer-events-none"
                    >
                      {noteInfo.note}
                    </text>

                    {/* Animación de pulsación al hacer clic */}
                    {isCurrentPlayed && (
                      <circle
                        cx={pos.centerX}
                        cy={y}
                        r={16}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              });
            })}
          </g>

          {/* 8. Marcadores de Notas Activas (Acorde / Escala) */}
          <g id="activeNoteMarkers">
            {activeNotes.map((item) => {
              const pos = fretPositions.positions[item.fret];
              if (!pos) return null;
              const y = getStringY(item.stringIndex);
              const key = `${item.stringIndex}_${item.fret}`;
              const isPlayed = lastPlayedKey === key;
              const style = getNoteRoleStyle(item.role);

              const isRoot = item.role === 'root';
              const radius = isRoot ? 14 : 13;
              const displayText = displayMode === 'notes' ? item.note : item.interval;

              return (
                <g
                  key={`active_${key}`}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => handlePlayNote(item.stringIndex, item.fret)}
                  onMouseEnter={() => setHoveredNote(item)}
                  onMouseLeave={() => setHoveredNote(null)}
                >
                  {/* Halo brillante exterior para la Tónica (Root) */}
                  {isRoot && (
                    <circle
                      cx={pos.centerX}
                      cy={y}
                      r={radius + 4}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      opacity={0.4}
                      className="animate-pulse"
                    />
                  )}

                  {/* Onda de clic de audio */}
                  {isPlayed && (
                    <circle
                      cx={pos.centerX}
                      cy={y}
                      r={radius + 8}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={2.5}
                      className="animate-ping"
                    />
                  )}

                  {/* Círculo Principal de la Nota */}
                  <circle
                    cx={pos.centerX}
                    cy={y}
                    r={radius}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={isRoot ? 2.5 : 1.8}
                    filter={isRoot ? 'url(#glowCyan)' : item.role === 'third' ? 'url(#glowFuchsia)' : item.role === 'seventh' ? 'url(#glowAmber)' : undefined}
                  />

                  {/* Texto de la Nota o Intervalo */}
                  <text
                    x={pos.centerX}
                    y={y + (displayText.length > 2 ? 3.5 : 4)}
                    textAnchor="middle"
                    fill={style.textFill}
                    fontSize={displayText.length > 2 ? 9 : isRoot ? 11 : 10}
                    fontWeight="900"
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {displayText}
                  </text>

                  {/* Badge de Digitado (Dedo 1, 2, 3, 4, T) en modo Acorde */}
                  {item.finger && (
                    <g className="pointer-events-none">
                      <circle
                        cx={pos.centerX + 9}
                        cy={y + 9}
                        r={6}
                        fill="#09090b"
                        stroke="#22d3ee"
                        strokeWidth={1}
                      />
                      <text
                        x={pos.centerX + 9}
                        y={y + 11.5}
                        textAnchor="middle"
                        fill="#22d3ee"
                        fontSize={8}
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {item.finger}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        </div>
      </div>

      {/* Leyenda de Colores Armónicos y Guía de Intervalos Ultra-Compacta */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-t border-[#3d1f11] bg-[#1a0e08]/90 text-[11px] backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)] border border-cyan-200" />
            <span className="text-amber-100 font-bold text-[10px] sm:text-[11px]">Tónica (R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_6px_rgba(217,70,239,0.8)] border border-fuchsia-200" />
            <span className="text-amber-100 font-bold text-[10px] sm:text-[11px]">3ra</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-200" />
            <span className="text-amber-100 font-bold text-[10px] sm:text-[11px]">7ma</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 border border-teal-200" />
            <span className="text-amber-200/80 font-medium text-[10px] sm:text-[11px]">5ta</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-amber-200/70 text-[10px]">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Toca cualquier traste para escuchar</span>
        </div>
      </div>
    </div>
  );
};
