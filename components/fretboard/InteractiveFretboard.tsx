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
import { Volume2, ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Square } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  practiceLoopEngine,
  LoopNoteItem,
  ScaleLoopPattern,
  ChordLoopPattern,
} from '@/lib/audio/practiceLoopEngine';

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
  // Práctica en Bucle & Metrónomo
  isLooping: boolean;
  onToggleLoop: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  studyMode?: 'chords' | 'scales' | 'progressions';
  chordLoopType: ChordLoopPattern;
  onChordLoopTypeChange: (type: ChordLoopPattern) => void;
  scaleLoopType: ScaleLoopPattern;
  onScaleLoopTypeChange: (type: ScaleLoopPattern) => void;
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
  isLooping,
  onToggleLoop,
  bpm,
  onBpmChange,
  studyMode = 'chords',
  chordLoopType,
  onChordLoopTypeChange,
  scaleLoopType,
  onScaleLoopTypeChange,
}: FretboardViewControlsProps) {
  const isRange012 = activeFretRange[0] === 0 && activeFretRange[1] === 12;
  const isRange1224 = activeFretRange[0] === 12 && activeFretRange[1] === 24;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs backdrop-blur-md transition-all ${
        isFullscreen
          ? 'bg-slate-900/95 border border-slate-800 rounded-xl mb-2 shrink-0 shadow-lg'
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

      {/* 2. Barra de Motor de Bucle Interactivo & Metrónomo */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 px-2 py-1 rounded-xl border border-slate-800 text-xs shrink-0 shadow-inner">
        {/* Botón Play / Stop Loop */}
        <button
          type="button"
          onClick={onToggleLoop}
          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-sm ${
            isLooping
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-black animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
          }`}
          title={isLooping ? 'Detener práctica en bucle' : 'Iniciar bucle con metrónomo'}
        >
          {isLooping ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isLooping ? 'Detener' : '▶ Loop'}</span>
        </button>

        {/* Selector de Patrón en Acordes */}
        {studyMode === 'chords' && (
          <div className="inline-flex p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onChordLoopTypeChange('arpeggio')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors ${
                chordLoopType === 'arpeggio'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Arpegiar cuerda por cuerda"
            >
              Arpegio 🎶
            </button>
            <button
              type="button"
              onClick={() => onChordLoopTypeChange('strum')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors ${
                chordLoopType === 'strum'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rasgueo de acorde completo en cada compás"
            >
              Rasgueo 🔊
            </button>
          </div>
        )}

        {/* Selector de Patrón en Escalas */}
        {studyMode === 'scales' && (
          <div className="inline-flex p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onScaleLoopTypeChange('asc')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors ${
                scaleLoopType === 'asc'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Escala ascendente continua"
            >
              Ascendente ↗
            </button>
            <button
              type="button"
              onClick={() => onScaleLoopTypeChange('pendulum')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors ${
                scaleLoopType === 'pendulum'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ida y vuelta (ascendente y descendente)"
            >
              Ida y Vuelta ⇄
            </button>
          </div>
        )}

        {/* Control Deslizante de Tempo Metrónomo (BPM: 40 - 240) */}
        <div className="flex items-center gap-1.5 pl-1 font-mono text-[11px] text-slate-300">
          <span className="text-amber-400 font-bold min-w-[50px]">{bpm} BPM</span>
          <input
            type="range"
            min={40}
            max={240}
            step={5}
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-16 sm:w-20 h-1.5 bg-slate-800 accent-amber-400 rounded-lg cursor-pointer"
            title="Ajustar tempo del metrónomo"
          />
        </div>
      </div>

      {/* 3. Selector de Cantidad de Trastes Visibles (12, 15, 21, 24) */}
      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
        <span className="text-[10px] text-slate-400 font-bold px-1 hidden md:inline">Trastes:</span>
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

      {/* 4. Saltos Rápidos de Zona & Foco */}
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
          title="Centrar en donde están las notas activas"
        >
          🎯 Ver Notas
        </button>
      </div>

      {/* 5. Switch Ajustado/Scroll y Botón Fullscreen Landscape */}
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
              ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800/80 ring-1 ring-rose-500/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
          }`}
          title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Modo Estudio Zen (Pantalla Completa Horizontal)'}
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-rose-400" />
              <span className="text-[11px] font-black">✕ Salir</span>
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
  studyMode?: 'chords' | 'scales' | 'progressions';
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
  studyMode = 'chords',
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalViewMode, setInternalViewMode] = useState<'scroll' | 'fit'>('scroll');
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;

  // Estado y manejador de Pantalla Completa Forzada Horizontal & Fallback CSS
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscapeCSS, setIsForceLandscapeCSS] = useState<boolean>(false);

  // Estado Modo Bucle Interactivo & Metrónomo
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(85);
  const [chordLoopType, setChordLoopType] = useState<ChordLoopPattern>('arpeggio');
  const [scaleLoopType, setScaleLoopType] = useState<ScaleLoopPattern>('pendulum');
  const [highlightedNoteKey, setHighlightedNoteKey] = useState<string | null>(null);

  const [visibleFrets, setVisibleFrets] = useState<number>(24);
  const config = INSTRUMENTS[instrument];
  const numStrings = config.strings.length;
  const totalFrets = Math.min(config.totalFrets, visibleFrets);

  // Detener bucle de audio
  const stopAudioLoop = useCallback(() => {
    practiceLoopEngine.stop();
    setIsLooping(false);
    setHighlightedNoteKey(null);
  }, []);

  // Iniciar bucle de audio con notas activas actuales
  const startAudioLoop = useCallback(() => {
    const filteredNotes = activeNotes.filter((n) => !n.isDimmed && n.fret <= totalFrets);
    const targetNotes = filteredNotes.length > 0 ? filteredNotes : activeNotes;

    const loopNotes: LoopNoteItem[] = targetNotes.map((n) => ({
      midi: n.midi,
      stringIndex: n.stringIndex,
      fret: n.fret,
      noteName: n.note,
      isRoot: n.role === 'root' || n.interval === 'R',
    }));

    if (loopNotes.length === 0) return;

    const mode =
      studyMode === 'chords'
        ? chordLoopType === 'strum'
          ? 'chord_strum'
          : 'chord_arpeggio'
        : 'scale';

    practiceLoopEngine.start({
      bpm,
      mode,
      notes: loopNotes,
      scalePattern: scaleLoopType,
      onStepNote: (idx, currentNote) => {
        if (idx === -1 || !currentNote) {
          if (mode === 'chord_strum') {
            setHighlightedNoteKey('ALL');
            setTimeout(() => setHighlightedNoteKey(null), 350);
          } else {
            setHighlightedNoteKey(null);
          }
        } else {
          setHighlightedNoteKey(`${currentNote.stringIndex}_${currentNote.fret}`);
        }
      },
    });

    setIsLooping(true);
  }, [activeNotes, totalFrets, studyMode, chordLoopType, scaleLoopType, bpm]);

  const togglePlayLoop = useCallback(() => {
    if (isLooping) {
      stopAudioLoop();
    } else {
      startAudioLoop();
    }
  }, [isLooping, stopAudioLoop, startAudioLoop]);

  // Actualizar BPM en vivo sin interrumpir reproducción
  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(newBpm);
    practiceLoopEngine.setBpm(newBpm);
  }, []);

  // Actualizar modo de bucle en acordes
  const handleChordLoopTypeChange = useCallback(
    (type: ChordLoopPattern) => {
      setChordLoopType(type);
      if (isLooping) {
        practiceLoopEngine.updateConfig({
          mode: type === 'strum' ? 'chord_strum' : 'chord_arpeggio',
        });
      }
    },
    [isLooping]
  );

  // Actualizar modo de bucle en escalas
  const handleScaleLoopTypeChange = useCallback(
    (type: ScaleLoopPattern) => {
      setScaleLoopType(type);
      if (isLooping) {
        practiceLoopEngine.updateConfig({
          scalePattern: type,
        });
      }
    },
    [isLooping]
  );

  // Si cambian las notas seleccionadas mientras el bucle está corriendo, actualizar secuencia
  useEffect(() => {
    if (isLooping) {
      const filteredNotes = activeNotes.filter((n) => !n.isDimmed && n.fret <= totalFrets);
      const targetNotes = filteredNotes.length > 0 ? filteredNotes : activeNotes;
      const loopNotes: LoopNoteItem[] = targetNotes.map((n) => ({
        midi: n.midi,
        stringIndex: n.stringIndex,
        fret: n.fret,
        noteName: n.note,
        isRoot: n.role === 'root' || n.interval === 'R',
      }));
      practiceLoopEngine.updateConfig({ notes: loopNotes });
    }
  }, [activeNotes, totalFrets, isLooping]);

  // Detener audio al desmontar
  useEffect(() => {
    return () => {
      practiceLoopEngine.stop();
    };
  }, []);

  // 1. Entrada a Pantalla Completa Forzada en Horizontal
  const enterFullscreenLandscape = useCallback(async () => {
    const elem = (document.documentElement || document.body) as any;

    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen nativo no disponible o bloqueado:', err);
    }

    let orientationLocked = false;
    try {
      const orientation =
        (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orientation && orientation.lock) {
        await orientation.lock('landscape');
        orientationLocked = true;
      }
    } catch (err) {
      console.warn('screen.orientation.lock bloqueado o no soportado:', err);
    }

    const isPortrait = typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
    setIsForceLandscapeCSS(!orientationLocked && isPortrait);
    setIsFullscreen(true);
  }, []);

  // Salida de Pantalla Completa
  const exitFullscreenLandscape = useCallback(async () => {
    stopAudioLoop();

    try {
      const orientation = screen.orientation as any;
      if (orientation && orientation.unlock) {
        orientation.unlock();
      }
    } catch (err) {
      console.warn('Error al desbloquear orientación:', err);
    }

    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (err) {
      console.warn('Error al salir de fullscreen nativo:', err);
    }

    setIsForceLandscapeCSS(false);
    setIsFullscreen(false);
  }, [stopAudioLoop]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      enterFullscreenLandscape();
    } else {
      exitFullscreenLandscape();
    }
  }, [isFullscreen, enterFullscreenLandscape, exitFullscreenLandscape]);

  useEffect(() => {
    const handleResizeOrOrientation = () => {
      if (isFullscreen) {
        const isPortrait = window.innerHeight > window.innerWidth;
        setIsForceLandscapeCSS(isPortrait);
      }
    };

    const handleFullscreenChange = () => {
      const isStillFullscreen = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      if (!isStillFullscreen) {
        setIsFullscreen(false);
        setIsForceLandscapeCSS(false);
        stopAudioLoop();
        const orientation = screen.orientation as any;
        if (orientation && orientation.unlock) {
          try {
            orientation.unlock();
          } catch (e) {}
        }
      }
    };

    window.addEventListener('resize', handleResizeOrOrientation);
    window.addEventListener('orientationchange', handleResizeOrOrientation);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', handleResizeOrOrientation);
      window.removeEventListener('orientationchange', handleResizeOrOrientation);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, stopAudioLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreenLandscape();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, exitFullscreenLandscape]);

  const [activeFretRangeState, setActiveFretRangeState] = useState<[number, number]>(() => {
    return fretFocusRange || [0, totalFrets];
  });

  const [containerWidth, setContainerWidth] = useState<number>(1000);
  const [containerHeight, setContainerHeight] = useState<number>(300);
  const [lastPlayedKey, setLastPlayedKey] = useState<string | null>(null);
  const [hoveredNote, setHoveredNote] = useState<ActiveFretNote | null>(null);

  // Observador de ancho y alto del contenedor para el modo Fit y Pantalla Completa
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0) setContainerWidth(w);
        if (h > 0) setContainerHeight(h);
      }
    };
    updateDims();
    const ro = new ResizeObserver(updateDims);
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

  // Dimensiones del mástil SVG proporcionales (garantizan que NUNCA se corten cuerdas en horizontal)
  const nutWidth = isFit ? (containerWidth < 480 ? 14 : containerWidth < 768 ? 20 : 26) : 30;
  const labelMargin = isFit ? (containerWidth < 480 ? 28 : containerWidth < 768 ? 38 : 46) : 52;
  const topPadding = isFullscreen ? 20 : 32;
  const bottomPadding = isFullscreen ? 20 : 32;

  // Altura disponible real calculada para el diapasón en pantalla completa
  const availHeight = isFullscreen
    ? Math.max(150, containerHeight > 50 ? containerHeight - 6 : 260)
    : 300;

  // Espaciado proporcional entre cuerdas: reparte equitativamente las 6 cuerdas dentro del área útil
  const stringSpacing = isFullscreen
    ? Math.max(
        22,
        Math.min(
          38,
          Math.floor((availHeight - topPadding - bottomPadding) / Math.max(1, numStrings - 1))
        )
      )
    : 36;

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
    let base = 1.8;
    if (instrument === 'guitar_6') {
      const gauges = [1.0, 1.3, 1.6, 2.0, 2.3, 2.6];
      base = gauges[stringIndex] || 1.8;
    } else if (instrument === 'bass_4') {
      const gauges = [1.8, 2.4, 3.2, 4.0];
      base = gauges[stringIndex] || 2.5;
    } else {
      // bass_5
      const gauges = [1.8, 2.4, 3.2, 4.0, 4.8];
      base = gauges[stringIndex] || 2.5;
    }
    return isFullscreen ? base * 1.35 : base;
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
          ? isForceLandscapeCSS
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] h-[100vw] rotate-90 z-50 bg-[#121217] flex flex-col justify-between overflow-hidden select-none'
            : 'fixed inset-0 z-50 bg-[#121217] flex flex-col justify-between overflow-hidden w-screen h-screen select-none'
          : 'w-full max-w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#1e1e24] my-2 min-w-0 flex flex-col'
      }`}
      style={
        isFullscreen && isForceLandscapeCSS
          ? {
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '100vh',
              height: '100vw',
              transform: 'translate(-50%, -50%) rotate(90deg)',
              transformOrigin: 'center center',
              zIndex: 9999,
            }
          : undefined
      }
    >
      {/* 1. Cabecera Adaptativa: Ultra-compacta en Fullscreen (h-11) / Completa en Ventana */}
      {isFullscreen ? (
        <header className="w-full h-11 px-2 flex items-center justify-between gap-2 bg-slate-900/95 border-b border-slate-800 shrink-0 z-30 select-none backdrop-blur-md">
          {/* Controles Izquierda/Centro con scroll horizontal interno suave */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {/* 1.1 Selector de Visualización Note | Degree | Finger */}
            <div className="inline-flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
              {(['notes', 'degrees', 'fingers'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onDisplayModeChange?.(mode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                    displayMode === mode || (mode === 'degrees' && displayMode === 'intervals')
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'notes' ? 'Nota' : mode === 'degrees' ? 'Grado' : 'Dedo'}
                </button>
              ))}
            </div>

            {/* 1.2 Control de Loop y BPM */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={togglePlayLoop}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  isLooping
                    ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isLooping ? '⏹ Stop' : '▶ Loop'}
              </button>

              {studyMode === 'chords' ? (
                <button
                  type="button"
                  onClick={() =>
                    handleChordLoopTypeChange(chordLoopType === 'arpeggio' ? 'strum' : 'arpeggio')
                  }
                  className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-900 text-cyan-300 border border-slate-800 hover:bg-slate-800"
                  title="Alternar entre Arpegio y Rasgueo"
                >
                  {chordLoopType === 'arpeggio' ? 'Arpegio 🎶' : 'Rasgueo 🔊'}
                </button>
              ) : studyMode === 'scales' ? (
                <button
                  type="button"
                  onClick={() =>
                    handleScaleLoopTypeChange(scaleLoopType === 'asc' ? 'pendulum' : 'asc')
                  }
                  className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-900 text-amber-300 border border-slate-800 hover:bg-slate-800"
                  title="Alternar entre Ascendente e Ida y Vuelta"
                >
                  {scaleLoopType === 'asc' ? 'Asc ↗' : '⇄ Péndulo'}
                </button>
              ) : null}

              <span className="text-[10px] font-mono text-amber-300 font-bold ml-1">{bpm}</span>
              <input
                type="range"
                min={40}
                max={240}
                step={5}
                value={bpm}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                className="w-14 sm:w-16 h-1 bg-slate-800 accent-amber-400 rounded cursor-pointer"
                title="Ajustar tempo del metrónomo"
              />
            </div>

            {/* 1.3 Selector de Trastes Visibles */}
            <div className="inline-flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
              {[12, 15, 21, 24].map((fretCount) => (
                <button
                  key={fretCount}
                  type="button"
                  onClick={() => setVisibleFrets(fretCount)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    visibleFrets === fretCount
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fretCount}
                </button>
              ))}
            </div>

            {/* 1.4 Switch Ajustado / Scroll */}
            <button
              type="button"
              onClick={handleToggleViewMode}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border shrink-0 ${
                viewMode === 'fit'
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
              title="Ajustar mástil a pantalla o permitir scroll"
            >
              {viewMode === 'fit' ? '↔ Ajustado' : '🔍 Scroll'}
            </button>

            {/* 1.5 Etiqueta informativa compacta */}
            <span className="text-[10px] font-bold text-cyan-300 whitespace-nowrap px-1 truncate max-w-[180px] sm:max-w-xs">
              {title || config.name}
            </span>
          </div>

          {/* Botón Salir Fijo a la Derecha */}
          <button
            type="button"
            onClick={exitFullscreenLandscape}
            className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/70 text-[11px] font-bold rounded-lg flex items-center gap-1 shrink-0 ml-1 shadow-sm"
            title="Salir de pantalla completa"
          >
            <span>✕ Salir</span>
          </button>
        </header>
      ) : (
        <>
          {/* Barra Superior Completa en Modo Ventana */}
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
            isLooping={isLooping}
            onToggleLoop={togglePlayLoop}
            bpm={bpm}
            onBpmChange={handleBpmChange}
            studyMode={studyMode}
            chordLoopType={chordLoopType}
            onChordLoopTypeChange={handleChordLoopTypeChange}
            scaleLoopType={scaleLoopType}
            onScaleLoopTypeChange={handleScaleLoopTypeChange}
          />

          {/* Barra de Estado de Alto Contraste en Modo Ventana */}
          <div className="flex items-center justify-between px-3.5 py-2 text-[11px] font-mono text-slate-400 backdrop-blur-md border-b border-slate-800/80 bg-[#16161a]">
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
              {isLooping && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 animate-pulse">
                  LOOP {studyMode === 'chords' ? (chordLoopType === 'strum' ? 'RASGUEO' : 'ARPEGIO') : (scaleLoopType === 'asc' ? 'ASC' : 'IDA Y VUELTA')} ({bpm} BPM)
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
        </>
      )}

      {/* Top Banner (si se proporciona) */}
      {!isFullscreen && topBanner}

      {/* 2. Área del Diapasón Flexible */}
      <main
        className={`w-full flex-1 min-h-0 flex flex-col justify-center ${
          isFullscreen ? 'px-1 py-0.5 overflow-hidden' : 'relative'
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
          } overflow-y-hidden ${
            isFullscreen
              ? 'py-0.5 px-0.5 rounded-lg border border-slate-800/70 shadow-inner'
              : 'py-3 px-1 custom-scrollbar rounded-2xl'
          } min-w-0 select-none flex flex-col justify-center`}
          style={{
            WebkitOverflowScrolling: 'touch',
            background: '#1e1e24',
          }}
        >
          <div
            className={isFit ? 'w-full block my-auto' : 'inline-block my-auto'}
            style={isFit ? { width: '100%' } : { width: fretPositions.totalWidth }}
          >
            <svg
              width={fretPositions.totalWidth}
              height={neckHeight}
              className="block mx-auto"
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

              {/* 2. Puntos marcadores de posición (Inlays): Se ocultan en modo pantalla completa para maximizar el espacio entre cuerdas */}
              {!isFullscreen && (
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
              )}

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
                  const badgeH = isFullscreen ? Math.min(18, stringSpacing - 4) : (isCompact ? 20 : 24);
                  const badgeW = isFullscreen ? (isCompact ? 20 : 26) : (isCompact ? 24 : 36);

                  return (
                    <g
                      key={`str_badge_${sIdx}`}
                      className="cursor-pointer group"
                      onClick={() => handlePlayNote(sIdx, 0)}
                    >
                      <rect
                        x={isCompact ? 2 : 6}
                        y={y - badgeH / 2}
                        width={badgeW}
                        height={badgeH}
                        rx={3}
                        fill="#16161a"
                        stroke="#334155"
                        strokeWidth={1}
                        className="group-hover:stroke-amber-400 group-hover:fill-slate-900 transition-colors"
                      />
                      <text
                        x={(isCompact ? 2 : 6) + badgeW / 2}
                        y={y + (badgeH <= 18 ? 3 : 4)}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize={badgeH <= 18 ? 8.5 : (isCompact ? 9 : 11)}
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
                    const isStepActive = highlightedNoteKey === 'ALL' || highlightedNoteKey === key;
                    const isRoot = item.role === 'root' || item.interval === 'R';

                    const fingerAssign: FingerAssignment = item.fingerAssignment || {
                      finger: item.finger ? parseInt(item.finger, 10) || 0 : 0,
                      isStretch: false,
                    };

                    const nodeSize = isFullscreen ? (isCompact ? 22 : 26) : (isCompact ? 28 : 32);
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

                        {/* Halo Neón de Seguimiento Visual en Tiempo Real para el Loop */}
                        {isStepActive && (
                          <circle
                            cx={pos.centerX}
                            cy={y}
                            r={isCompact ? 14 : (isFullscreen ? 18 : 20)}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth={2.5}
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
                              isHighlighted={isStepActive}
                              size={isFullscreen ? 'sm' : 'md'}
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
      </main>

      {/* 4. Pie de Página */}
      {isFullscreen ? (
        <footer className="w-full h-5 px-3 flex items-center justify-between text-[9px] text-slate-400 bg-slate-950/90 border-t border-slate-900 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FFCC00] inline-block" /> Tónica
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" /> Notas Escala
            </span>
            {isLooping && (
              <span className="text-[9px] text-emerald-400 font-bold ml-2 animate-pulse">
                ● Loop Activo ({bpm} BPM)
              </span>
            )}
          </div>
          <span className="hidden xs:inline text-slate-500">Toca cualquier traste para escuchar</span>
        </footer>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-[11px] backdrop-blur-md border-t border-slate-800/80 bg-[#16161a]">
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
      )}
    </div>
  );
};
