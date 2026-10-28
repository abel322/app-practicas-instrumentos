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

  // Auto-scroll al rango enfocado si cambia
  useEffect(() => {
    if (fretFocusRange && containerRef.current) {
      const minFret = fretFocusRange[0];
      const targetPos = fretPositions.positions[minFret];
      if (targetPos) {
        containerRef.current.scrollTo({
          left: Math.max(0, targetPos.startX - 120),
          behavior: 'smooth',
        });
      }
    }
  }, [fretFocusRange, fretPositions]);

  // Color de nota según rol armónico
  const getNoteRoleStyle = (role: NoteRole) => {
    switch (role) {
      case 'root':
        return {
          fill: '#06b6d4', // Cyan 500
          stroke: '#22d3ee', // Cyan 400
          textFill: '#09090b',
          shadow: 'rgba(6, 182, 212, 0.9)',
          ringColor: 'rgba(34, 211, 238, 0.4)',
        };
      case 'third':
        return {
          fill: '#c026d3', // Fuchsia 600
          stroke: '#f0abfc', // Fuchsia 300
          textFill: '#ffffff',
          shadow: 'rgba(217, 70, 239, 0.85)',
          ringColor: 'rgba(232, 121, 249, 0.35)',
        };
      case 'seventh':
        return {
          fill: '#d97706', // Amber 600
          stroke: '#fde68a', // Amber 200
          textFill: '#09090b',
          shadow: 'rgba(245, 158, 11, 0.85)',
          ringColor: 'rgba(251, 191, 36, 0.35)',
        };
      case 'fifth':
        return {
          fill: '#0d9488', // Teal 600
          stroke: '#5eead4', // Teal 300
          textFill: '#ffffff',
          shadow: 'rgba(20, 184, 166, 0.8)',
          ringColor: 'rgba(94, 234, 212, 0.35)',
        };
      default:
        return {
          fill: '#334155', // Slate 700
          stroke: '#94a3b8', // Slate 400
          textFill: '#f8fafc',
          shadow: 'rgba(100, 116, 139, 0.5)',
          ringColor: 'rgba(148, 163, 184, 0.25)',
        };
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-zinc-950/80 shadow-2xl backdrop-blur-xl overflow-hidden p-3 sm:p-5">
      {/* Barra superior de controles del diapasón */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
            {title || `Diapasón Completo (24 Trastes) — ${config.name}`}
          </h3>
          {fretFocusRange && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Trastes {fretFocusRange[0]}–{fretFocusRange[1]}
            </span>
          )}
        </div>

        {/* Controles de Navegación y Scroll */}
        <div className="flex items-center gap-2">
          {hoveredNote && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300">
              <span className="font-bold text-cyan-300">{hoveredNote.note}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">Grado: {hoveredNote.interval}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">Traste {hoveredNote.fret}</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-zinc-900/80 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => scrollFretboard('left')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Desplazar a la izquierda"
              aria-label="Desplazar mástil a la izquierda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-zinc-400 px-1">Scroll Mástil</span>
            <button
              onClick={() => scrollFretboard('right')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Desplazar a la derecha"
              aria-label="Desplazar mástil a la derecha"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor con Scroll Horizontal suave */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto pb-3 pt-1 select-none focus:outline-none custom-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <svg
          width={fretPositions.totalWidth}
          height={neckHeight}
          className="overflow-visible block"
          style={{ minWidth: fretPositions.totalWidth }}
        >
          <defs>
            {/* Gradiente de fondo del mástil: Palisandro / Ébano oscuro */}
            <linearGradient id="fretboardWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1e24" />
              <stop offset="50%" stopColor="#15151a" />
              <stop offset="100%" stopColor="#0f0f14" />
            </linearGradient>

            {/* Gradiente de la cejuela (Hueso / Marfil sintético de alta densidad) */}
            <linearGradient id="nutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="40%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Gradiente de los trastes de níquel/plata */}
            <linearGradient id="fretWire" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="40%" stopColor="#cbd5e1" />
              <stop offset="60%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Gradiente de cuerdas lisas de acero */}
            <linearGradient id="stringPlain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Gradiente de cuerdas entorchadas (Bajo / Cuerdas graves) */}
            <linearGradient id="stringWound" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Filtros de Resplandor Neón */}
            <filter id="glowCyan" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#06b6d4" floodOpacity="0.8" />
            </filter>
            <filter id="glowFuchsia" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#d946ef" floodOpacity="0.75" />
            </filter>
            <filter id="glowAmber" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#f59e0b" floodOpacity="0.75" />
            </filter>
            <filter id="glowActive" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#22d3ee" floodOpacity="1" />
            </filter>
          </defs>

          {/* 1. Mástil de madera principal */}
          {(() => {
            const nutPos = fretPositions.positions[0];
            const endPos = fretPositions.positions[totalFrets];
            const neckStartX = nutPos.startX + nutPos.width;
            const neckWidth = endPos.wireX - neckStartX;
            const neckY = topPadding - 14;
            const neckH = (numStrings - 1) * stringSpacing + 28;

            return (
              <g id="neckWood">
                <rect
                  x={neckStartX}
                  y={neckY}
                  width={neckWidth}
                  height={neckH}
                  rx={8}
                  fill="url(#fretboardWood)"
                  stroke="#27272a"
                  strokeWidth={2}
                />

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
                        fill="rgba(6, 182, 212, 0.08)"
                        stroke="#06b6d4"
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

          {/* 2. Inlays (Marcadores de Traste Clásicos) */}
          <g id="fretInlays">
            {SINGLE_INLAYS.map((fret) => {
              const pos = fretPositions.positions[fret];
              if (!pos) return null;
              const centerY = topPadding + ((numStrings - 1) * stringSpacing) / 2;

              return (
                <circle
                  key={`inlay_${fret}`}
                  cx={pos.centerX}
                  cy={centerY}
                  r={5}
                  fill="#71717a"
                  opacity={0.35}
                />
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
                  <circle
                    cx={pos.centerX}
                    cy={centerY - offset}
                    r={4.5}
                    fill="#a1a1aa"
                    opacity={0.45}
                  />
                  <circle
                    cx={pos.centerX}
                    cy={centerY + offset}
                    r={4.5}
                    fill="#a1a1aa"
                    opacity={0.45}
                  />
                </g>
              );
            })}
          </g>

          {/* 3. Cejuela (Nut / Traste 0) */}
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
                  rx={4}
                  fill="url(#nutGradient)"
                  stroke="#475569"
                  strokeWidth={1.5}
                  filter="drop-shadow(2px 0px 5px rgba(0,0,0,0.6))"
                />
                <text
                  x={nut.centerX + 3}
                  y={topPadding - 22}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  CEJUELA
                </text>
              </g>
            );
          })()}

          {/* 4. Trastes metálicos (Fretwires 1..24) */}
          <g id="fretWires">
            {fretPositions.positions.slice(1).map((pos, idx) => {
              const fretNum = idx + 1;
              const lineY1 = topPadding - 14;
              const lineY2 = topPadding + (numStrings - 1) * stringSpacing + 14;

              return (
                <g key={`wire_${fretNum}`}>
                  {/* Sombra de la barra de traste */}
                  <line
                    x1={pos.wireX - 1}
                    y1={lineY1}
                    x2={pos.wireX - 1}
                    y2={lineY2}
                    stroke="#09090b"
                    strokeWidth={1.5}
                  />
                  {/* Traste metálico brillante */}
                  <line
                    x1={pos.wireX}
                    y1={lineY1}
                    x2={pos.wireX}
                    y2={lineY2}
                    stroke="url(#fretWire)"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                  {/* Número de traste superior e inferior */}
                  <text
                    x={pos.centerX}
                    y={topPadding - 20}
                    textAnchor="middle"
                    fill={fretNum === 12 || fretNum === 24 ? '#22d3ee' : '#71717a'}
                    fontSize={11}
                    fontFamily="monospace"
                    fontWeight={fretNum === 12 || fretNum === 24 ? 'bold' : 'normal'}
                  >
                    {fretNum}
                  </text>
                  <text
                    x={pos.centerX}
                    y={lineY2 + 16}
                    textAnchor="middle"
                    fill={fretNum === 12 || fretNum === 24 ? '#22d3ee' : '#52525b'}
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
                    fill="#18181b"
                    stroke="#3f3f46"
                    strokeWidth={1}
                    className="group-hover:stroke-cyan-400 group-hover:fill-zinc-800 transition-colors"
                  />
                  <text
                    x={25}
                    y={y + 4}
                    textAnchor="middle"
                    fill="#22d3ee"
                    fontSize={11}
                    fontWeight="black"
                    fontFamily="monospace"
                    className="group-hover:fill-cyan-300"
                  >
                    {str.note}
                    <tspan fontSize={9} fill="#71717a">
                      {str.octave}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </g>

          {/* 6. Cuerdas del Instrumento (Líneas horizontales diferenciadas por calibre) */}
          <g id="strings">
            {config.strings.map((str, sIdx) => {
              const y = getStringY(sIdx);
              const gauge = getStringGauge(sIdx);
              const startX = 46;
              const endX = fretPositions.positions[totalFrets].wireX + 16;
              const isWound = sIdx >= (numStrings > 4 ? 2 : 1);

              return (
                <g key={`string_${sIdx}`}>
                  {/* Sombra de la cuerda proyectada sobre la madera */}
                  <line
                    x1={startX}
                    y1={y + gauge * 0.4}
                    x2={endX}
                    y2={y + gauge * 0.4}
                    stroke="#000000"
                    strokeWidth={gauge + 1}
                    opacity={0.65}
                  />
                  {/* Cuerda metálica con su gradiente */}
                  <line
                    x1={startX}
                    y1={y}
                    x2={endX}
                    y2={y}
                    stroke={isWound ? 'url(#stringWound)' : 'url(#stringPlain)'}
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

      {/* Leyenda de Colores Armónicos y Guía de Intervalos */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-zinc-500 font-medium">Codificación:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] border border-cyan-300" />
            <span className="text-zinc-300 font-semibold">Tónica (Fundamental)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-fuchsia-600 shadow-[0_0_8px_rgba(217,70,239,0.7)] border border-fuchsia-300" />
            <span className="text-zinc-300 font-semibold">Terceras (Guía 3 / b3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.7)] border border-amber-300" />
            <span className="text-zinc-300 font-semibold">Séptimas (Guía 7 / b7)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-teal-600 border border-teal-300" />
            <span className="text-zinc-400">Quintas (5 / b5)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Haz clic en cualquier traste para escuchar el audio sintetizado</span>
        </div>
      </div>
    </div>
  );
};
