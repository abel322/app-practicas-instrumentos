'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  InstrumentType,
  INSTRUMENTS,
  NoteRole,
  getFretNote,
} from '@/lib/music-theory/fretboard';
import { getFretboardAudioEngine } from '@/lib/music-theory/fretboardAudio';
import { FingerAssignment, NoteDisplayMode } from '@/lib/music-theory/scaleSystems';
import { FretboardNoteNode } from './FretboardNoteNode';
import { Volume2, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export interface ActiveFretNote {
  stringIndex: number; // 0 = más aguda (superior), N-1 = más grave (inferior)
  fret: number;        // 0 = al aire, 1..24
  note: string;
  interval: string;
  role: NoteRole;
  finger?: string;
  fingerAssignment?: FingerAssignment;
  midi: number;
  isDimmed?: boolean;
}

export interface FretboardViewControlsProps {
  viewMode: 'scroll' | 'fit';
  onToggleViewMode: () => void;
  activeFretRange: [number, number];
  onSelectFretRange: (start: number, end: number) => void;
  onFocusActiveNotes: () => void;
  displayMode: NoteDisplayMode | 'intervals';
  onDisplayModeChange?: (mode: NoteDisplayMode) => void;
  visibleFrets: number;
  onVisibleFretsChange: (frets: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function FretboardViewControls({
  viewMode,
  onToggleViewMode,
  activeFretRange,
  onSelectFretRange,
  onFocusActiveNotes,
  displayMode,
  onDisplayModeChange,
  visibleFrets,
  onVisibleFretsChange,
  isFullscreen,
  onToggleFullscreen,
}: FretboardViewControlsProps) {
  const isRange012 = activeFretRange[0] === 0 && activeFretRange[1] === 12;
  const isRange1224 = activeFretRange[0] === 12 && activeFretRange[1] === 24;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs backdrop-blur-md transition-all ${
        isFullscreen
          ? 'bg-slate-900/90 border border-slate-800 rounded-xl mb-2 shrink-0'
          : 'bg-[#16161a] border-b border-slate-800'
      }`}
    >
      {/* 1. Botonera de Modo de Visualización Minimalista: [ Note ] | [ Degree ] | [ Finger ] */}
      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onDisplayModeChange?.('notes')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
            displayMode === 'notes'
              ? 'bg-[#FFCC00] text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Mostrar nombres de notas (C, D, E...)"
        >
          Note
        </button>
        <button
          type="button"
          onClick={() => onDisplayModeChange?.('degrees')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
            displayMode === 'degrees' || displayMode === 'intervals'
              ? 'bg-[#FFCC00] text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Mostrar grados e intervalos armónicos (R, 3, 5...)"
        >
          Degree
        </button>
        <button
          type="button"
          onClick={() => onDisplayModeChange?.('fingers')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
            displayMode === 'fingers'
              ? 'bg-[#FFCC00] text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Mostrar digitación de dedos (1, 2, 3, 4)"
        >
          Finger
        </button>
      </div>

      {/* 2. Selector de Cantidad de Trastes Visibles (12, 15, 21, 24) */}
      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
        <span className="text-[10px] text-slate-400 font-bold px-1 hidden sm:inline">Trastes:</span>
        {[12, 15, 21, 24].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onVisibleFretsChange(f)}
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${
              visibleFrets === f
                ? 'bg-slate-700 text-white font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 3. Saltos Rápidos de Zona & Foco */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onSelectFretRange(0, Math.min(12, visibleFrets))}
          className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors ${
            isRange012
              ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
        >
          Tr. 0-12
        </button>
        {visibleFrets > 12 && (
          <button
            type="button"
            onClick={() => onSelectFretRange(12, visibleFrets)}
            className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors ${
              isRange1224
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            Tr. 12-{visibleFrets}
          </button>
        )}
        <button
          type="button"
          onClick={onFocusActiveNotes}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono text-[11px] font-bold border border-slate-700 transition-colors shadow-sm"
          title="Centrar en donde están las notas del acorde"
        >
          🎯 Ver Notas
        </button>
      </div>

      {/* 4. Switch Ajustado/Scroll y Botón Fullscreen (Modo Estudio Zen) */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <button
          type="button"
          onClick={onToggleViewMode}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${
            viewMode === 'fit'
              ? 'bg-slate-700 text-white border-slate-600 font-bold'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          {viewMode === 'fit' ? <span>↔️ Ajustado</span> : <span>🔍 Scroll</span>}
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm ${
            isFullscreen
              ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border-rose-800/80'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
          }`}
          title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Modo Estudio Zen (Pantalla Completa)'}
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline text-[11px]">Salir</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-[#FFCC00]" />
              <span className="hidden sm:inline text-[11px]">Estudio Zen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export interface InteractiveFretboardProps {
  instrument: InstrumentType;
  activeNotes: ActiveFretNote[];
  displayMode: NoteDisplayMode | 'intervals';
  onDisplayModeChange?: (mode: NoteDisplayMode) => void;
  fretFocusRange?: [number, number] | null;
  onNoteClick?: (note: ActiveFretNote) => void;
  title?: string;
  viewMode?: 'scroll' | 'fit';
  onViewModeChange?: (mode: 'scroll' | 'fit') => void;
  isEditorActive?: boolean;
  onFretClickInEditor?: (stringIndex: number, fret: number) => void;
  onToggleRootInEditor?: (e: React.MouseEvent, stringIndex: number, fret: number) => void;
  topBanner?: React.ReactNode;
}

// Inlays estándar: simples en 3, 5, 7, 9, 15, 17, 19, 21; dobles en 12 y 24
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];

export const InteractiveFretboard: React.FC<InteractiveFretboardProps> = ({
  instrument,
  activeNotes,
  displayMode,
  onDisplayModeChange,
  fretFocusRange,
  onNoteClick,
  title,
  viewMode: controlledViewMode,
  onViewModeChange,
  isEditorActive = false,
  onFretClickInEditor,
  onToggleRootInEditor,
  topBanner,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalViewMode, setInternalViewMode] = useState<'scroll' | 'fit'>('scroll');
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;

  // Estado y manejador de Pantalla Completa / Estudio Zen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.warn('Fullscreen no permitido directamente por el navegador:', err);
        }
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.warn('Error al salir de fullscreen nativo:', err);
        }
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const [visibleFrets, setVisibleFrets] = useState<number>(24);
  const config = INSTRUMENTS[instrument];
  const numStrings = config.strings.length;
  const totalFrets = Math.min(config.totalFrets, visibleFrets);

  const [activeFretRangeState, setActiveFretRangeState] = useState<[number, number]>(() => {
    return fretFocusRange || [0, totalFrets];
  });

  const [containerWidth, setContainerWidth] = useState<number>(1000);
  const [lastPlayedKey, setLastPlayedKey] = useState<string | null>(null);
  const [hoveredNote, setHoveredNote] = useState<ActiveFretNote | null>(null);

  // Observador de ancho del contenedor para el modo Fit
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Actualizar rango si cambia fretFocusRange externo
  useEffect(() => {
    if (fretFocusRange) {
      setActiveFretRangeState(fretFocusRange);
    }
  }, [fretFocusRange]);

  const handleToggleViewMode = useCallback(() => {
    const nextMode = viewMode === 'scroll' ? 'fit' : 'scroll';
    setInternalViewMode(nextMode);
    if (onViewModeChange) onViewModeChange(nextMode);
  }, [viewMode, onViewModeChange]);

  const isFit = viewMode === 'fit';
  const isCompact = isFit && containerWidth < 560;

  // Mapa rápido de notas activas por clave `${stringIndex}_${fret}`
  const activeNoteMap = useMemo(() => {
    const map = new Map<string, ActiveFretNote>();
    activeNotes.forEach((item) => {
      if (item.fret <= totalFrets) {
        map.set(`${item.stringIndex}_${item.fret}`, item);
      }
    });
    return map;
  }, [activeNotes, totalFrets]);

  // Dimensiones del mástil SVG
  const nutWidth = isFit ? (containerWidth < 480 ? 14 : containerWidth < 768 ? 20 : 26) : 30;
  const labelMargin = isFit ? (containerWidth < 480 ? 28 : containerWidth < 768 ? 38 : 46) : 52;
  const stringSpacing = 36;
  const topPadding = 32;
  const bottomPadding = 32;
  const neckHeight = topPadding + bottomPadding + (numStrings - 1) * stringSpacing;

  // Ancho variable decreciente para los trastes 1..totalFrets
  const fretWidths = useMemo(() => {
    const widths: number[] = [nutWidth]; // fret 0
    if (isFit) {
      const availableWidth = Math.max(300, containerWidth - 12);
      const remainingWidth = Math.max(200, availableWidth - labelMargin - nutWidth - 12);

      const rawWeights: number[] = [];
      let sumWeights = 0;
      for (let f = 1; f <= totalFrets; f++) {
        const weight = Math.pow(0.985, f - 1);
        rawWeights.push(weight);
        sumWeights += weight;
      }
      for (let f = 1; f <= totalFrets; f++) {
        const w = (rawWeights[f - 1] / sumWeights) * remainingWidth;
        widths.push(w);
      }
    } else {
      for (let f = 1; f <= totalFrets; f++) {
        const w = Math.round(68 * Math.pow(0.976, f - 1));
        widths.push(Math.max(38, w));
      }
    }
    return widths;
  }, [totalFrets, isFit, containerWidth, labelMargin, nutWidth]);

  // Posiciones X acumuladas de cada traste
  const fretPositions = useMemo(() => {
    const positions: { startX: number; width: number; centerX: number; wireX: number }[] = [];
    let currentX = labelMargin;

    for (let f = 0; f <= totalFrets; f++) {
      const w = fretWidths[f] ?? 40;
      positions.push({
        startX: currentX,
        width: w,
        centerX: currentX + w / 2,
        wireX: currentX + w,
      });
      currentX += w;
    }
    const totalWidth = isFit ? Math.max(320, containerWidth - 8) : currentX + 36;
    return { positions, totalWidth };
  }, [fretWidths, totalFrets, isFit, containerWidth, labelMargin]);

  // Posición Y de cada cuerda
  const getStringY = (stringIndex: number) => {
    return topPadding + stringIndex * stringSpacing;
  };

  // Calibre visual nítido y realista de cuerdas (desde 1px en 1ª cuerda hasta 2.6px en 6ª)
  const getStringGauge = (stringIndex: number) => {
    if (instrument === 'guitar_6') {
      const gauges = [1.0, 1.3, 1.6, 2.0, 2.3, 2.6];
      return gauges[stringIndex] || 1.8;
    }
    if (instrument === 'bass_4') {
      const gauges = [1.8, 2.4, 3.2, 4.0];
      return gauges[stringIndex] || 2.5;
    }
    // bass_5
    const gauges = [1.8, 2.4, 3.2, 4.0, 4.8];
    return gauges[stringIndex] || 2.5;
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

  const scrollByFrets = useCallback((deltaFrets: number) => {
    if (!containerRef.current) return;
    const deltaPx = deltaFrets * 54;
    containerRef.current.scrollBy({ left: deltaPx, behavior: 'smooth' });
  }, []);

  const handlePrevZone = useCallback(() => {
    if (!containerRef.current) return;
    const currentLeft = containerRef.current.scrollLeft;
    if (currentLeft < 320) {
      containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollByFrets(-5);
    }
  }, [scrollByFrets]);

  const handleNextZone = useCallback(() => {
    if (!containerRef.current) return;
    const currentLeft = containerRef.current.scrollLeft;
    const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
    if (currentLeft > maxScroll - 350) {
      const targetPos = fretPositions.positions[totalFrets];
      if (targetPos) {
        containerRef.current.scrollTo({ left: targetPos.startX - 30, behavior: 'smooth' });
      }
    } else {
      scrollByFrets(5);
    }
  }, [scrollByFrets, fretPositions, totalFrets]);

  const scrollToFretZone = useCallback((fretNumber: number) => {
    if (viewMode === 'fit') {
      handleToggleViewMode();
    }
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const fretElement = containerRef.current.querySelector(`[data-fret="${fretNumber}"]`);
      if (fretElement && typeof fretElement.scrollIntoView === 'function') {
        fretElement.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      } else {
        const targetPos = fretPositions.positions[fretNumber];
        if (targetPos) {
          const offset = Math.max(0, targetPos.startX - 40);
          containerRef.current.scrollTo({ left: offset, behavior: 'smooth' });
        }
      }
    });
  }, [viewMode, handleToggleViewMode, fretPositions]);

  const handleSelectFretRange = useCallback((start: number, end: number) => {
    setActiveFretRangeState([start, end]);
    scrollToFretZone(start);
  }, [scrollToFretZone]);

  const handleFocusActiveNotes = useCallback(() => {
    if (activeNotes.length === 0) {
      scrollToFretZone(0);
      return;
    }

    const frettedNotes = activeNotes.filter((n) => n.fret > 0 && n.fret <= totalFrets);
    const targetNotes = frettedNotes.length > 0 ? frettedNotes : activeNotes;

    const frets = targetNotes.map((n) => n.fret);
    const minFret = Math.min(...frets);
    const maxFret = Math.max(...frets);
    const avgFret = Math.round(frets.reduce((a, b) => a + b, 0) / frets.length);

    setActiveFretRangeState([minFret, maxFret]);

    if (viewMode === 'fit') {
      handleToggleViewMode();
    }

    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const targetPos = fretPositions.positions[avgFret] || fretPositions.positions[minFret];
      if (targetPos) {
        const cWidth = containerRef.current.clientWidth;
        const centerScroll = Math.max(0, targetPos.centerX - cWidth / 2);
        containerRef.current.scrollTo({ left: centerScroll, behavior: 'smooth' });
      }
    });
  }, [activeNotes, totalFrets, viewMode, handleToggleViewMode, fretPositions, scrollToFretZone]);

  useEffect(() => {
    if (fretFocusRange && containerRef.current && viewMode === 'scroll') {
      const minFret = fretFocusRange[0];
      const fretTargetElement = containerRef.current.querySelector(`[data-fret="${minFret}"]`);
      if (fretTargetElement && typeof fretTargetElement.scrollIntoView === 'function') {
        fretTargetElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        const targetPos = fretPositions.positions[minFret];
        if (targetPos) {
          const cWidth = containerRef.current.clientWidth;
          const centerScroll = Math.max(0, targetPos.centerX - cWidth / 2);
          containerRef.current.scrollTo({
            left: centerScroll,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [fretFocusRange, fretPositions, viewMode]);

  return (
    <div
      className={`transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#121217] flex flex-col justify-between p-2 sm:p-4 overflow-hidden w-screen h-screen'
          : 'w-full max-w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#1e1e24] my-2 min-w-0 flex flex-col'
      }`}
    >
      {/* 1. Barra Superior Minimalista de Control */}
      <FretboardViewControls
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        activeFretRange={activeFretRangeState}
        onSelectFretRange={handleSelectFretRange}
        onFocusActiveNotes={handleFocusActiveNotes}
        displayMode={displayMode}
        onDisplayModeChange={onDisplayModeChange}
        visibleFrets={visibleFrets}
        onVisibleFretsChange={setVisibleFrets}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* 2. Barra de Estado de Alto Contraste */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 text-[11px] font-mono text-slate-400 backdrop-blur-md ${
          isFullscreen ? 'bg-slate-900/60 border border-slate-800/80 rounded-xl mb-2' : 'border-b border-slate-800/80 bg-[#16161a]'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] shadow-[0_0_8px_rgba(255,204,0,0.8)] shrink-0" />
          <span className="font-bold text-slate-100 text-xs truncate">
            {title || `Diapasón ${totalFrets}T • ${config.name}`}
          </span>
          {activeFretRangeState && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono shrink-0 border border-slate-700">
              Tr. {activeFretRangeState[0]}–{activeFretRangeState[1]}
            </span>
          )}
          {isFullscreen && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-[#FFCC00] font-bold border border-amber-500/30">
              MODO ZEN
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {hoveredNote && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#FFCC00] font-bold bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
              <span>{hoveredNote.note}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{hoveredNote.interval}</span>
            </div>
          )}
          {viewMode === 'scroll' ? (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              ↔ Desliza (0 - {totalFrets})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-slate-300 font-bold">
              ✓ Todo el mástil visible
            </span>
          )}
          {viewMode === 'scroll' && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrevZone}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
                title="Retroceder"
                aria-label="Retroceder a la izquierda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextZone}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
                title="Avanzar"
                aria-label="Avanzar a la derecha"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Banner (si se proporciona) */}
      {topBanner}

      {/* 3. Contenedor del Diapasón SVG Maximizado */}
      <div
        className={`relative w-full max-w-full flex-1 flex flex-col justify-center min-h-0 ${
          isFullscreen ? 'overflow-hidden my-auto' : ''
        }`}
      >
        {viewMode === 'scroll' && (
          <>
            <button
              type="button"
              onClick={handlePrevZone}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/90 hover:bg-slate-900 text-slate-200 border border-slate-700 shadow-md backdrop-blur-md flex items-center justify-center transition-all active:scale-90"
              title="Retroceder hacia la cejuela"
              aria-label="Retroceder hacia la cejuela"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleNextZone}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/90 hover:bg-slate-900 text-slate-200 border border-slate-700 shadow-md backdrop-blur-md flex items-center justify-center transition-all active:scale-90"
              title="Avanzar hacia trastes altos"
              aria-label="Avanzar hacia trastes altos"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </>
        )}

        <div
          ref={containerRef}
          className={`w-full max-w-full ${
            isFit ? 'overflow-x-hidden' : 'overflow-x-auto scroll-smooth touch-pan-x'
          } overflow-y-hidden py-3 px-1 custom-scrollbar min-w-0 select-none ${
            isFullscreen ? 'rounded-xl border border-slate-800 shadow-inner' : ''
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            background: '#1e1e24',
          }}
        >
          <div
            className={isFit ? 'w-full block' : 'inline-block'}
            style={isFit ? { width: '100%' } : { width: fretPositions.totalWidth }}
          >
            <svg
              width={fretPositions.totalWidth}
              height={neckHeight}
              className="block"
              style={isFit ? { width: '100%', minWidth: '100%' } : { minWidth: fretPositions.totalWidth }}
            >
              <defs>
                {/* Madera Neutra de Pizarra Oscura */}
                <linearGradient id="slateFretboard" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1a1a20" />
                  <stop offset="50%" stopColor="#25242b" />
                  <stop offset="100%" stopColor="#1a1a20" />
                </linearGradient>

                {/* Cuerdas Lisas de Acero Plata */}
                <linearGradient id="plainSteelString" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="40%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                {/* Cuerdas Entorchadas */}
                <linearGradient id="woundNickelString" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="35%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {/* 1. Mástil Neutro Minimalista (Estilo Guitar Composers Toolbox) */}
              {(() => {
                const nutPos = fretPositions.positions[0];
                const endPos = fretPositions.positions[totalFrets];
                if (!nutPos || !endPos) return null;
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
                      rx={6}
                      fill="url(#slateFretboard)"
                      stroke="#141418"
                      strokeWidth={2}
                    />

                    {/* Resaltado del rango enfocado (Caja Activa CAGED) */}
                    {fretFocusRange && (
                      (() => {
                        const [startF, endF] = fretFocusRange;
                        const pStart = fretPositions.positions[Math.max(0, startF)];
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
                            fill="rgba(255, 204, 0, 0.08)"
                            stroke="#FFCC00"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                          />
                        );
                      })()
                    )}
                  </g>
                );
              })()}

              {/* 2. Puntos marcadores de posición (Inlays): Pequeños y discretos */}
              <g id="fretInlays">
                {SINGLE_INLAYS.filter((f) => f <= totalFrets).map((fret) => {
                  const pos = fretPositions.positions[fret];
                  if (!pos) return null;
                  const centerY = topPadding + ((numStrings - 1) * stringSpacing) / 2;
                  const rInlay = isCompact ? 3 : 4.5;

                  return (
                    <circle
                      key={`inlay_${fret}`}
                      cx={pos.centerX}
                      cy={centerY}
                      r={rInlay}
                      fill="#e2e8f0"
                      opacity={0.75}
                    />
                  );
                })}

                {/* Traste doble en 12 (y 24) */}
                {DOUBLE_INLAYS.filter((f) => f <= totalFrets).map((fret) => {
                  const pos = fretPositions.positions[fret];
                  if (!pos) return null;
                  const centerY = topPadding + ((numStrings - 1) * stringSpacing) / 2;
                  const offset = stringSpacing * 0.75;
                  const rInlay = isCompact ? 2.5 : 3.5;

                  return (
                    <g key={`double_inlay_${fret}`}>
                      <circle cx={pos.centerX} cy={centerY - offset} r={rInlay} fill="#e2e8f0" opacity={0.8} />
                      <circle cx={pos.centerX} cy={centerY + offset} r={rInlay} fill="#e2e8f0" opacity={0.8} />
                    </g>
                  );
                })}
              </g>

              {/* 3. Cejuela (Nut / Traste 0) */}
              {(() => {
                const nut = fretPositions.positions[0];
                if (!nut) return null;
                const nutY = topPadding - 16;
                const nutH = (numStrings - 1) * stringSpacing + 32;
                const pad = isCompact ? 2 : 6;

                return (
                  <g id="nutBar" data-fret={0}>
                    <rect
                      x={nut.startX + pad}
                      y={nutY}
                      width={Math.max(4, nut.width - pad)}
                      height={nutH}
                      rx={2}
                      fill="#334155"
                      stroke="#475569"
                      strokeWidth={1}
                    />
                    <text
                      x={nut.centerX + 1}
                      y={topPadding - (isCompact ? 16 : 20)}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={isCompact ? 8 : 10}
                      fontWeight="black"
                      fontFamily="monospace"
                    >
                      0
                    </text>
                  </g>
                );
              })()}

              {/* 4. Líneas de Traste Delgadas (Fretwires) y Números Claros */}
              <g id="fretWires">
                {fretPositions.positions.slice(1, totalFrets + 1).map((pos, idx) => {
                  const fretNum = idx + 1;
                  const lineY1 = topPadding - 14;
                  const lineY2 = topPadding + (numStrings - 1) * stringSpacing + 14;
                  const showFretNumber = !isCompact || [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fretNum);

                  return (
                    <g key={`wire_${fretNum}`} data-fret={fretNum}>
                      {/* Línea vertical delgada */}
                      <line
                        x1={pos.wireX}
                        y1={lineY1}
                        x2={pos.wireX}
                        y2={lineY2}
                        stroke="rgba(148, 163, 184, 0.45)"
                        strokeWidth={isCompact ? 1.4 : 1.8}
                        strokeLinecap="round"
                      />

                      {/* Números de traste claros y limpios debajo y arriba del mástil */}
                      {showFretNumber && (
                        <>
                          <text
                            x={pos.centerX}
                            y={topPadding - (isCompact ? 16 : 20)}
                            textAnchor="middle"
                            fill={fretNum === 12 || fretNum === 24 ? '#FFCC00' : '#cbd5e1'}
                            fontSize={isCompact ? 8 : 10.5}
                            fontFamily="monospace"
                            fontWeight={fretNum === 12 || fretNum === 24 ? '900' : 'bold'}
                          >
                            {fretNum}
                          </text>
                          <text
                            x={pos.centerX}
                            y={lineY2 + (isCompact ? 13 : 16)}
                            textAnchor="middle"
                            fill={fretNum === 12 || fretNum === 24 ? '#FFCC00' : '#94a3b8'}
                            fontSize={isCompact ? 7.5 : 10}
                            fontFamily="monospace"
                            fontWeight={fretNum === 12 || fretNum === 24 ? '900' : 'bold'}
                          >
                            {fretNum}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* 5. Nombres de afinación de las cuerdas */}
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
                        x={isCompact ? 2 : 6}
                        y={y - (isCompact ? 10 : 12)}
                        width={isCompact ? 24 : 36}
                        height={isCompact ? 20 : 24}
                        rx={4}
                        fill="#16161a"
                        stroke="#334155"
                        strokeWidth={1}
                        className="group-hover:stroke-amber-400 group-hover:fill-slate-900 transition-colors"
                      />
                      <text
                        x={isCompact ? 14 : 24}
                        y={y + (isCompact ? 3.5 : 4)}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize={isCompact ? 9 : 11}
                        fontWeight="black"
                        fontFamily="monospace"
                        className="group-hover:fill-[#FFCC00]"
                      >
                        {str.note}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* 6. Cuerdas del Instrumento con Calibre Variable Nítido */}
              <g id="strings">
                {config.strings.map((str, sIdx) => {
                  const y = getStringY(sIdx);
                  const gauge = getStringGauge(sIdx);
                  const startX = isCompact ? 28 : 46;
                  const endPos = fretPositions.positions[totalFrets];
                  const endX = (endPos ? endPos.wireX : fretPositions.totalWidth) + 16;
                  const isWound = sIdx >= (numStrings > 4 ? 2 : 1);

                  return (
                    <g key={`string_${sIdx}`}>
                      {/* Sombra sutil */}
                      <line
                        x1={startX}
                        y1={y + 1.2}
                        x2={endX}
                        y2={y + 1.2}
                        stroke="rgba(0, 0, 0, 0.6)"
                        strokeWidth={gauge + 0.8}
                      />
                      {/* Cuerda de acero/níquel plata */}
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

              {/* 7. Áreas clickeables invisibles */}
              <g id="clickableFretGrid">
                {config.strings.map((str, sIdx) => {
                  const y = getStringY(sIdx);
                  return fretPositions.positions.slice(0, totalFrets + 1).map((pos, fIdx) => {
                    const noteInfo = getFretNote(str.midi, fIdx);
                    const key = `${sIdx}_${fIdx}`;
                    const isActive = activeNoteMap.has(key);

                    if (isActive) return null;

                    const isCurrentPlayed = lastPlayedKey === key;

                    return (
                      <g
                        key={`empty_slot_${key}`}
                        data-fret={fIdx}
                        className="cursor-pointer group"
                        onClick={() => {
                          if (isEditorActive && onFretClickInEditor) {
                            onFretClickInEditor(sIdx, fIdx);
                          }
                          handlePlayNote(sIdx, fIdx);
                        }}
                        onContextMenu={(e) => {
                          if (isEditorActive && onToggleRootInEditor) {
                            onToggleRootInEditor(e, sIdx, fIdx);
                          }
                        }}
                      >
                        <rect
                          x={pos.startX}
                          y={y - stringSpacing / 2}
                          width={pos.width}
                          height={stringSpacing}
                          fill="transparent"
                        />

                        {/* Hover suave minimalista */}
                        <circle
                          cx={pos.centerX}
                          cy={y}
                          r={isCompact ? 6 : 9}
                          fill="#334155"
                          stroke="#64748b"
                          strokeWidth={1}
                          opacity={0}
                          className="group-hover:opacity-75 transition-opacity"
                        />
                        <text
                          cx={pos.centerX}
                          x={pos.centerX}
                          y={y + (isCompact ? 2.5 : 3.5)}
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fontSize={isCompact ? 6.5 : 8.5}
                          fontWeight="bold"
                          fontFamily="monospace"
                          opacity={0}
                          className="group-hover:opacity-100 transition-opacity pointer-events-none"
                        >
                          {noteInfo.note}
                        </text>

                        {isCurrentPlayed && (
                          <circle
                            cx={pos.centerX}
                            cy={y}
                            r={isCompact ? 10 : 15}
                            fill="none"
                            stroke="#FFCC00"
                            strokeWidth={2}
                            className="animate-ping"
                          />
                        )}
                      </g>
                    );
                  });
                })}
              </g>

              {/* 8. Marcadores de Notas Activas de Alto Contraste (Guitar Composers Toolbox Style) */}
              <g id="activeNoteMarkers">
                {activeNotes
                  .filter((item) => item.fret <= totalFrets)
                  .map((item) => {
                    const pos = fretPositions.positions[item.fret];
                    if (!pos) return null;
                    const y = getStringY(item.stringIndex);
                    const key = `${item.stringIndex}_${item.fret}`;
                    const isPlayed = lastPlayedKey === key;
                    const isRoot = item.role === 'root' || item.interval === 'R';

                    const fingerAssign: FingerAssignment = item.fingerAssignment || {
                      finger: item.finger ? parseInt(item.finger, 10) || 0 : 0,
                      isStretch: false,
                    };

                    const nodeSize = isCompact ? 28 : 32;
                    const halfSize = nodeSize / 2;

                    return (
                      <g
                        key={`active_${key}`}
                        data-fret={item.fret}
                        className={item.isDimmed ? 'opacity-40 transition-opacity' : 'transition-opacity'}
                        onMouseEnter={() => setHoveredNote(item)}
                        onMouseLeave={() => setHoveredNote(null)}
                        onContextMenu={(e) => {
                          if (isEditorActive && onToggleRootInEditor) {
                            onToggleRootInEditor(e, item.stringIndex, item.fret);
                          }
                        }}
                      >
                        {/* Onda de clic de audio al pulsar */}
                        {isPlayed && (
                          <circle
                            cx={pos.centerX}
                            cy={y}
                            r={isCompact ? 13 : 17}
                            fill="none"
                            stroke="#FFCC00"
                            strokeWidth={2}
                            className="animate-ping pointer-events-none"
                          />
                        )}

                        {/* Nodo visual interactivo contenido */}
                        <foreignObject
                          x={pos.centerX - halfSize}
                          y={y - halfSize}
                          width={nodeSize}
                          height={nodeSize}
                          className="overflow-visible"
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <FretboardNoteNode
                              noteName={item.note}
                              degreeLabel={item.interval}
                              fingerNumber={fingerAssign.finger}
                              fingerAssignment={fingerAssign}
                              isRoot={isRoot}
                              displayMode={displayMode}
                              isInActiveBox={!item.isDimmed}
                              onClick={() => {
                                if (isEditorActive && onFretClickInEditor) {
                                  onFretClickInEditor(item.stringIndex, item.fret);
                                }
                                handlePlayNote(item.stringIndex, item.fret);
                              }}
                              onContextMenu={(e) => {
                                if (isEditorActive && onToggleRootInEditor) {
                                  onToggleRootInEditor(e, item.stringIndex, item.fret);
                                }
                              }}
                            />
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Leyenda Limpia de Alto Contraste */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-[11px] backdrop-blur-md ${
          isFullscreen ? 'bg-slate-900/60 border border-slate-800/80 rounded-xl mt-2 shrink-0' : 'border-t border-slate-800/80 bg-[#16161a]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FFCC00] ring-1 ring-amber-300/80" />
            <span className="text-amber-300 font-bold text-[10px] sm:text-[11px]">Tónica ($R$)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500/60" />
            <span className="text-slate-300 font-medium text-[10px] sm:text-[11px]">Notas de Escala / Acorde</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-800/60 border border-slate-700/50" />
            <span className="text-slate-500 font-medium text-[10px] sm:text-[11px]">Fuera de Caja Activa</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
          <Volume2 className="w-3.5 h-3.5 text-[#FFCC00]" />
          <span>Toca cualquier traste para escuchar</span>
        </div>
      </div>
    </div>
  );
};
