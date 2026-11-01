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
  isTargetTone?: boolean;
  isShiftPoint?: boolean;
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
      {/* 1. Botonera de Modo de Visualización: [ Nota ] | [ Grado ] | [ Dedo ] */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onDisplayModeChange?.('notes')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            displayMode === 'notes'
              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Mostrar nombres de notas (C, D, E...)"
        >
          Nota
        </button>
        <button
          type="button"
          onClick={() => onDisplayModeChange?.('degrees')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            displayMode === 'degrees' || displayMode === 'intervals'
              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Mostrar grados e intervalos armónicos (R, 3, 5...)"
        >
          Grado
        </button>
        <button
          type="button"
          onClick={() => onDisplayModeChange?.('fingers')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            displayMode === 'fingers'
              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Mostrar digitación de dedos (1, 2, 3, 4)"
        >
          Dedo
        </button>
      </div>

      {/* 2. Barra de Motor de Bucle Interactivo & Metrónomo */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shrink-0 shadow-inner">
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
          <span>{isLooping ? 'Stop' : '▶ Loop'}</span>
        </button>

        {/* Selector de Patrón en Acordes */}
        {studyMode === 'chords' && (
          <div className="inline-flex p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onChordLoopTypeChange('arpeggio')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
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
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
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
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
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
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
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

        {/* Control Deslizante de Tempo Metrónomo (BPM: 50 - 200) */}
        <div className="flex items-center gap-2 pl-1 font-mono text-xs text-slate-300">
          <span className="text-amber-300 font-extrabold min-w-[54px]">{bpm} BPM</span>
          <input
            type="range"
            min={50}
            max={200}
            step={5}
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-20 sm:w-24 h-1.5 bg-slate-800 accent-amber-400 rounded-lg cursor-pointer"
            title="Ajustar tempo del metrónomo"
          />
        </div>
      </div>

      {/* 3. Selector de Cantidad de Trastes Visibles (12, 15, 21, 24) */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <span className="text-[10px] text-slate-400 font-bold px-1 hidden md:inline">Trastes:</span>
        {[12, 15, 21, 24].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onVisibleFretsChange(f)}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
              visibleFrets === f
                ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
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
          className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm ${
            isFullscreen
              ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700/80'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
          }`}
          title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Modo Estudio Zen (Pantalla Completa Horizontal)'}
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-black">✕ Salir</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-[#FFCC00]" />
              <span className="hidden sm:inline text-xs">Pantalla Completa</span>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalViewMode, setInternalViewMode] = useState<'scroll' | 'fit'>('fit');
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

  // Número de trastes visibles seleccionados (default: 21)
  const [visibleFrets, setVisibleFrets] = useState<number>(21);
  const config = INSTRUMENTS[instrument];
  const strings = config.strings;
  const numStrings = strings.length;
  const totalFrets = Math.min(config.totalFrets, visibleFrets);

  // Ancho de la cejuela (traste 0) fijo, y las columnas restantes repartidas proporcionalmente en 1fr
  const fretGridTemplate = useMemo(
    () => ({
      gridTemplateColumns: `minmax(34px, 42px) repeat(${totalFrets}, minmax(0, 1fr))`,
    }),
    [totalFrets]
  );

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

  // Entrada a Pantalla Completa Forzada en Horizontal
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

  const [lastPlayedKey, setLastPlayedKey] = useState<string | null>(null);
  const [hoveredNote, setHoveredNote] = useState<ActiveFretNote | null>(null);

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

  // Reproducir nota
  const handlePlayNote = (stringIndex: number, fret: number) => {
    const stringConfig = strings[stringIndex];
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
    const deltaPx = deltaFrets * 56;
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
    scrollByFrets(5);
  }, [scrollByFrets]);

  const scrollToFretZone = useCallback((fretNumber: number) => {
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const fretElement = containerRef.current.querySelector(`[data-fret="${fretNumber}"]`);
      if (fretElement && typeof fretElement.scrollIntoView === 'function') {
        fretElement.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    });
  }, []);

  const handleSelectFretRange = useCallback(
    (start: number, end: number) => {
      setActiveFretRangeState([start, end]);
      scrollToFretZone(start);
    },
    [scrollToFretZone]
  );

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

    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const fretElement = containerRef.current.querySelector(`[data-fret="${avgFret}"]`);
      if (fretElement && typeof fretElement.scrollIntoView === 'function') {
        fretElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }, [activeNotes, totalFrets, scrollToFretZone]);

  // Renderizado de los nodos de notas por cuerda (columnas: 0 .. maxFrets)
  const renderFretNodesForString = (stringIdx: number, maxFrets: number) => {
    const stringConfig = strings[stringIdx];
    if (!stringConfig) return null;

    const midStringIdx = Math.floor((numStrings - 1) / 2);

    return Array.from({ length: maxFrets + 1 }, (_, fIdx) => {
      const key = `${stringIdx}_${fIdx}`;
      const activeItem = activeNoteMap.get(key);
      const noteInfo = getFretNote(stringConfig.midi, fIdx);
      const isPlayed = lastPlayedKey === key;
      const isStepActive = highlightedNoteKey === 'ALL' || highlightedNoteKey === key;
      const isInFocusedBox =
        fretFocusRange && fIdx >= fretFocusRange[0] && fIdx <= fretFocusRange[1];

      // Inlays de referencia sutiles en el centro del mástil
      const showSingleInlay = stringIdx === midStringIdx && SINGLE_INLAYS.includes(fIdx);
      const showDoubleInlay =
        (stringIdx === 1 || stringIdx === numStrings - 2) && DOUBLE_INLAYS.includes(fIdx);

      return (
        <div
          key={key}
          data-fret={fIdx}
          onClick={() => {
            if (isEditorActive && onFretClickInEditor) {
              onFretClickInEditor(stringIdx, fIdx);
            }
            handlePlayNote(stringIdx, fIdx);
          }}
          onContextMenu={(e) => {
            if (isEditorActive && onToggleRootInEditor) {
              onToggleRootInEditor(e, stringIdx, fIdx);
            }
          }}
          onMouseEnter={() => {
            if (activeItem) setHoveredNote(activeItem);
          }}
          onMouseLeave={() => {
            if (activeItem) setHoveredNote(null);
          }}
          className={`relative h-full flex items-center justify-center cursor-pointer group select-none ${
            fIdx === 0
              ? 'bg-slate-950/60 border-r-[4px] border-r-slate-400/90'
              : 'border-r border-r-slate-400/40'
          } ${isInFocusedBox ? 'bg-amber-400/[0.07]' : ''}`}
        >
          {/* Punto marcador de traste (inlay) */}
          {(showSingleInlay || showDoubleInlay) && (
            <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-200/15 pointer-events-none z-0" />
          )}

          {/* Onda al tocar */}
          {isPlayed && (
            <div className="absolute w-8 h-8 rounded-full border-2 border-amber-400 animate-ping pointer-events-none z-30" />
          )}

          {activeItem ? (
            <div className={activeItem.isDimmed ? 'opacity-50 z-10' : 'z-20'}>
              <FretboardNoteNode
                noteName={activeItem.note}
                degreeLabel={activeItem.interval}
                fingerNumber={
                  activeItem.fingerAssignment?.finger ??
                  (activeItem.finger ? parseInt(activeItem.finger, 10) || 0 : 0)
                }
                fingerAssignment={activeItem.fingerAssignment}
                isRoot={
                  activeItem.role === 'root' ||
                  activeItem.interval === 'R' ||
                  !!activeItem.isTargetTone
                }
                displayMode={displayMode}
                isInActiveBox={!activeItem.isDimmed}
                isHighlighted={isStepActive}
                isShiftPoint={activeItem.isShiftPoint}
                size="md"
              />
            </div>
          ) : fIdx === 0 ? (
            <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/70 text-[10px] font-mono font-black text-slate-300 group-hover:text-amber-300 group-hover:border-amber-400/60 transition-colors z-10">
              {stringConfig.note}
            </span>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800/85 border border-slate-500/60 text-[9px] font-mono font-bold text-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-90 transition-opacity pointer-events-none z-10">
              {noteInfo.note}
            </div>
          )}
        </div>
      );
    });
  };

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
        isFullscreen
          ? isForceLandscapeCSS
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
            : { height: '100dvh' }
          : undefined
      }
    >
      {/* 1. Cabecera en Pantalla Completa con Tamaño Táctil Cómodo */}
      {isFullscreen ? (
        <header className="w-full h-12 sm:h-14 px-3 flex items-center justify-between gap-3 bg-slate-900/95 border-b border-slate-800/80 shrink-0 z-30 select-none shadow-md">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 min-w-0">
            {/* 1. Selector Nota / Grado / Dedo con botones táctiles */}
            <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              {(['notes', 'degrees', 'fingers'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onDisplayModeChange?.(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    displayMode === mode || (mode === 'degrees' && displayMode === 'intervals')
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-[1.02]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {mode === 'notes' ? 'Nota' : mode === 'degrees' ? 'Grado' : 'Dedo'}
                </button>
              ))}
            </div>

            {/* 2. Control Loop y Metrónomo BPM ampliado */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={togglePlayLoop}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isLooping
                    ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <span>{isLooping ? '⏹ Stop' : '▶ Loop'}</span>
              </button>

              {studyMode === 'chords' ? (
                <button
                  type="button"
                  onClick={() =>
                    handleChordLoopTypeChange(chordLoopType === 'arpeggio' ? 'strum' : 'arpeggio')
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-cyan-300 border border-slate-800 hover:bg-slate-800 transition-colors"
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
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-amber-300 border border-slate-800 hover:bg-slate-800 transition-colors"
                  title="Alternar entre Ascendente e Ida y Vuelta"
                >
                  {scaleLoopType === 'asc' ? 'Asc ↗' : '⇄ Péndulo'}
                </button>
              ) : null}

              <span className="text-xs font-mono text-amber-300 font-extrabold whitespace-nowrap">
                {bpm} BPM
              </span>
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={bpm}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-slate-800 accent-amber-400 rounded-lg cursor-pointer"
                title="Ajustar tempo del metrónomo"
              />
            </div>

            {/* 3. Selector de Trastes (12 / 15 / 21 / 24) */}
            <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              {[12, 15, 21, 24].map((fretCount) => (
                <button
                  key={fretCount}
                  type="button"
                  onClick={() => setVisibleFrets(fretCount)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    visibleFrets === fretCount
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fretCount}
                </button>
              ))}
            </div>

            {/* 4. Título informativo claro */}
            <span className="text-xs font-black text-cyan-300 whitespace-nowrap px-2">
              {title || config.name}
            </span>
          </div>

          {/* Botón Salir visible y cómodo */}
          <button
            type="button"
            onClick={exitFullscreenLandscape}
            className="px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/80 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
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
                  LOOP{' '}
                  {studyMode === 'chords'
                    ? chordLoopType === 'strum'
                      ? 'RASGUEO'
                      : 'ARPEGIO'
                    : scaleLoopType === 'asc'
                    ? 'ASC'
                    : 'IDA Y VUELTA'}{' '}
                  ({bpm} BPM)
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
                  ✓ Todo el mástil visible ({totalFrets} trastes)
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

      {/* Top Banner (si se proporciona en modo ventana) */}
      {!isFullscreen && topBanner}

      {/* Área principal: Centrado perfecto vertical y horizontal */}
      <main
        ref={containerRef}
        className="w-full flex-1 flex flex-col justify-center items-center px-2 sm:px-4 py-1.5 overflow-x-auto overflow-y-hidden select-none"
      >
        {/* Contenedor del mástil con altura incrementada */}
        <div
          className={`w-full max-w-[1300px] ${
            !isFullscreen && viewMode === 'scroll' ? 'min-w-[720px]' : ''
          } h-[255px] sm:h-[275px] flex flex-col justify-between bg-[#221c19] rounded-2xl border border-amber-950/50 p-2.5 sm:p-3 shadow-2xl shrink-0`}
        >
          {/* Grid de las 6 cuerdas con mayor altura y separación */}
          <div className="w-full flex-1 flex flex-col justify-between py-1">
            {strings.map((stringData, stringIdx) => (
              <div
                key={stringIdx}
                className="relative h-[33px] sm:h-[35px] flex items-center w-full"
              >
                {/* Cuerda física con calibre progresivo */}
                <div
                  style={{ height: `${1.3 + stringIdx * 0.4}px` }}
                  className="absolute left-0 right-0 bg-gradient-to-r from-slate-400 via-zinc-200 to-slate-400 shadow-sm pointer-events-none z-0"
                />

                {/* Grid de notas */}
                <div
                  className="relative w-full h-full grid items-center z-10"
                  style={fretGridTemplate}
                >
                  {renderFretNodesForString(stringIdx, totalFrets)}
                </div>
              </div>
            ))}
          </div>

          {/* Fila inferior de números de trastes */}
          <div
            className="h-6 grid items-center w-full pt-1.5 border-t border-slate-700/50 text-[11px] font-mono text-slate-400 select-none text-center"
            style={fretGridTemplate}
          >
            <span className="opacity-60">0</span>
            {Array.from({ length: totalFrets }, (_, i) => i + 1).map((fret) => (
              <span
                key={fret}
                className={`${
                  [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fret)
                    ? 'text-cyan-400 font-extrabold'
                    : 'opacity-40'
                }`}
              >
                {fret}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Leyenda inferior solo en modo ventana */}
      {!isFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-[11px] backdrop-blur-md border-t border-slate-800/80 bg-[#16161a]">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FFCC00] ring-1 ring-amber-300/80" />
              <span className="text-amber-300 font-bold text-[10px] sm:text-[11px]">Tónica (R)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500/60" />
              <span className="text-slate-300 font-medium text-[10px] sm:text-[11px]">
                Notas de Escala / Acorde
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-800/60 border border-slate-700/50" />
              <span className="text-slate-500 font-medium text-[10px] sm:text-[11px]">
                Fuera de Caja Activa
              </span>
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
