'use client';

import React from 'react';
import {
  InstrumentType,
  DISPLAY_ROOTS,
  ChordKey,
  SCALES_CATALOG,
  ScaleKey,
  PROGRESSIONS_CATALOG,
  ProgressionDef,
  ChordVoicing,
  resolveProgressionChords,
} from '@/lib/music-theory/fretboard';
import { resolveCleanKeyRoot } from '@/lib/music/diatonicSpelling';
import { TonalityMode, TONALITY_MODE_LABELS } from '@/lib/music-theory/cagedHarmonics';
import { getImprovOptionsForChord } from '@/lib/music-theory/chordImprovOptions';
import { NoteDisplayMode } from '@/lib/music-theory/scaleSystems';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Layers,
  Music,
  ListMusic,
  Plus,
  Music2,
} from 'lucide-react';

export type StudyMode = 'chords' | 'scales' | 'progressions';

interface FretboardToolbarProps {
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  instrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  rootNote: string;
  onRootNoteChange: (root: string) => void;

  // Modo 1: Acordes Diatónicos
  tonalityMode?: TonalityMode;
  onTonalityModeChange?: (mode: TonalityMode) => void;
  chordKey?: ChordKey;
  onChordKeyChange?: (chord: ChordKey) => void;
  voicings?: ChordVoicing[];
  selectedVoicingIndex?: number;
  onSelectVoicingIndex?: (idx: number) => void;
  onStrumVoicing?: () => void;
  onArpeggiateVoicing?: () => void;

  // Modo 2: Escalas
  scaleKey: ScaleKey;
  onScaleKeyChange: (scale: ScaleKey) => void;
  scaleViewMode?: 'all' | 'boxes';
  onScaleViewModeChange?: (mode: 'all' | 'boxes') => void;
  selectedBox?: number;
  onSelectBox?: (boxId: number) => void;
  displayMode: NoteDisplayMode | 'intervals';
  onDisplayModeChange: (mode: NoteDisplayMode) => void;

  // Modo 3: Progresiones
  progressionsList?: ProgressionDef[];
  selectedProgressionId: string;
  onProgressionIdChange: (id: string) => void;
  progressionPlaying: boolean;
  onToggleProgressionPlay: () => void;
  onNextProgressionStep: () => void;
  onPrevProgressionStep: () => void;
  onSelectProgressionStep?: (idx: number) => void;
  currentProgressionStepIndex: number;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onOpenCreateModal?: () => void;
  activeStepImprovResourceId?: string;
  onStepImprovResourceChange?: (stepIndex: number, resourceId: string) => void;
}

export const FretboardToolbar: React.FC<FretboardToolbarProps> = ({
  studyMode,
  onStudyModeChange,
  instrument,
  onInstrumentChange,
  rootNote,
  onRootNoteChange,
  tonalityMode = 'ionian',
  onTonalityModeChange,
  scaleKey,
  onScaleKeyChange,
  progressionsList = PROGRESSIONS_CATALOG,
  selectedProgressionId,
  onProgressionIdChange,
  progressionPlaying,
  onToggleProgressionPlay,
  onNextProgressionStep,
  onPrevProgressionStep,
  onSelectProgressionStep,
  currentProgressionStepIndex,
  bpm,
  onBpmChange,
  onOpenCreateModal,
  activeStepImprovResourceId = 'default',
  onStepImprovResourceChange,
}) => {
  const currentProgression =
    progressionsList.find((p) => p.id === selectedProgressionId) || progressionsList[0];
  const resolvedSteps = resolveProgressionChords(currentProgression, rootNote);
  const currentResolvedStep = resolvedSteps[currentProgressionStepIndex] || resolvedSteps[0];

  const currentCleanRoot = resolveCleanKeyRoot(
    rootNote,
    studyMode === 'chords' ? tonalityMode : scaleKey
  );

  return (
    <div className="w-full max-w-full flex flex-col gap-1.5 min-w-0">
      {/* 1. Cabecera Compacta (Fila 1: Tonalidad + Modo / Escala / Progresión) */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shadow-sm backdrop-blur-xl flex flex-col gap-1.5 w-full min-w-0 transition-colors">
        <div className="grid grid-cols-2 gap-2 w-full items-center">
          {/* Tonalidad (Key) */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <label className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Music2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>Tonalidad:</span>
            </label>
            <select
              value={currentCleanRoot}
              onChange={(e) => onRootNoteChange(e.target.value)}
              className="w-full h-8 sm:h-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white text-xs font-mono font-black rounded-xl px-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer shadow-sm"
            >
              {DISPLAY_ROOTS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} {r.value === currentCleanRoot ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Modo Contextual según la Pestaña Activa */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <label className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>{studyMode === 'chords' ? 'Modo / Escala:' : studyMode === 'scales' ? 'Modo / Escala:' : 'Progresión:'}</span>
            </label>

            {studyMode === 'chords' && onTonalityModeChange && (
              <select
                value={tonalityMode}
                onChange={(e) => onTonalityModeChange(e.target.value as TonalityMode)}
                className="w-full h-8 sm:h-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-xl px-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer shadow-sm truncate"
              >
                <optgroup label="─── MODOS GRIEGOS ───" className="text-slate-400 bg-slate-950 font-bold">
                  <option value="ionian">Jónico (Mayor)</option>
                  <option value="dorian">Dórico</option>
                  <option value="phrygian">Frigio</option>
                  <option value="lydian">Lidio</option>
                  <option value="mixolydian">Mixolidio</option>
                  <option value="aeolian">Eólico (Menor)</option>
                  <option value="locrian">Locrio</option>
                </optgroup>
                <optgroup label="─── MENORES ───" className="text-slate-400 bg-slate-950 font-bold">
                  <option value="minor_harmonic">Menor Armónica</option>
                  <option value="minor_melodic">Menor Melódica</option>
                </optgroup>
              </select>
            )}

            {studyMode === 'scales' && (
              <select
                value={scaleKey}
                onChange={(e) => onScaleKeyChange(e.target.value as ScaleKey)}
                className="w-full h-8 sm:h-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-xl px-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer shadow-sm truncate"
              >
                {Object.entries(SCALES_CATALOG).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}

            {studyMode === 'progressions' && (
              <div className="flex items-center gap-1.5 w-full">
                <select
                  value={selectedProgressionId}
                  onChange={(e) => onProgressionIdChange(e.target.value)}
                  className="flex-1 min-w-0 h-8 sm:h-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-xl px-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer shadow-sm truncate"
                >
                  {progressionsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {onOpenCreateModal && (
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-black flex items-center gap-1 shrink-0 shadow-sm active:scale-95 transition-all"
                    title="Crear nueva progresión"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span className="hidden xs:inline">Nueva</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Cabecera Compacta (Fila 2: Instrumento + Pestaña de Estudio) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full">
          {/* Selector de Instrumento tipo Segmented Control */}
          <div className="grid grid-cols-3 gap-1 p-0.5 sm:p-1 bg-[#dce2ec]/80 dark:bg-slate-950 rounded-xl border border-slate-300/80 dark:border-slate-800 text-xs font-bold w-full transition-colors shadow-sm">
            <button
              onClick={() => onInstrumentChange('guitar_6')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                instrument === 'guitar_6'
                  ? 'bg-[#0891b2] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Guitarra de 6 Cuerdas (E-A-D-G-B-E)"
            >
              🎸 Guitarra 6C
            </button>

            <button
              onClick={() => onInstrumentChange('bass_4')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                instrument === 'bass_4'
                  ? 'bg-[#0891b2] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Bajo Eléctrico de 4 Cuerdas (E-A-D-G)"
            >
              ⚡ Bajo 4C
            </button>

            <button
              onClick={() => onInstrumentChange('bass_5')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                instrument === 'bass_5'
                  ? 'bg-[#0891b2] text-white dark:bg-cyan-500 dark:text-slate-950 font-black shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Bajo Eléctrico de 5 Cuerdas con Low B"
            >
              ⚡ Bajo 5C
            </button>
          </div>

          {/* Modos en Pestañas Compactas */}
          <div className="grid grid-cols-3 gap-1 p-0.5 sm:p-1 bg-[#dce2ec]/70 dark:bg-slate-950/80 rounded-xl border border-slate-300/70 dark:border-slate-800/80 text-xs font-bold w-full transition-colors shadow-sm">
            <button
              onClick={() => onStudyModeChange('chords')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all truncate ${
                studyMode === 'chords'
                  ? 'bg-[#0891b2] text-white dark:bg-cyan-400 dark:text-slate-950 shadow-sm font-black'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Acordes</span>
            </button>

            <button
              onClick={() => onStudyModeChange('scales')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all truncate ${
                studyMode === 'scales'
                  ? 'bg-[#0891b2] text-white dark:bg-cyan-400 dark:text-slate-950 shadow-sm font-black'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Escalas</span>
            </button>

            <button
              onClick={() => onStudyModeChange('progressions')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all truncate ${
                studyMode === 'progressions'
                  ? 'bg-[#0891b2] text-white dark:bg-cyan-400 dark:text-slate-950 shadow-sm font-black'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Progresiones</span>
            </button>
          </div>
        </div>

        {/* Indicador del Sistema Dual Activo en Modo Escalas */}
        {studyMode === 'scales' && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-mono text-[10px] font-bold flex items-center gap-1">
              <span>🎸 Sistema de Estudio:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">CAGED (5 Cajas)</span>
              <span>/</span>
              <span className="text-purple-600 dark:text-purple-400 font-extrabold">3NPS (7 Patrones)</span>
            </span>
            <span className="text-[10px] font-bold text-amber-500/90 dark:text-amber-400 flex items-center gap-1">
              <span>⚡ Biomecánica de Dedos (1-4)</span>
            </span>
          </div>
        )}

        {/* Controles de Transporte y Pasos en Modo Progresiones */}
        {studyMode === 'progressions' && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onPrevProgressionStep}
                  className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
                  title="Anterior"
                  aria-label="Acorde anterior"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onToggleProgressionPlay}
                  className={`h-8 px-3 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                    progressionPlaying
                      ? 'bg-amber-500 text-white shadow-sm dark:bg-amber-400 dark:text-slate-950'
                      : 'bg-[#0891b2] hover:bg-[#0e7490] text-white shadow-sm dark:bg-cyan-400 dark:text-slate-950'
                  }`}
                >
                  {progressionPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>PAUSAR</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onNextProgressionStep}
                  className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
                  title="Siguiente"
                  aria-label="Siguiente acorde"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {currentResolvedStep && onStepImprovResourceChange && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-xl border border-slate-300 dark:border-cyan-900/60 max-w-[200px] truncate">
                  <select
                    value={activeStepImprovResourceId || 'default'}
                    onChange={(e) =>
                      onStepImprovResourceChange(currentProgressionStepIndex, e.target.value)
                    }
                    className="bg-transparent text-xs font-bold text-[#0891b2] dark:text-cyan-300 focus:outline-none cursor-pointer w-full truncate"
                  >
                    <option value="default" className="bg-slate-950 text-cyan-300">
                      💡 Auto ({currentResolvedStep.fullChordLabel})
                    </option>
                    {getImprovOptionsForChord(currentResolvedStep.roman).map((res) => (
                      <option key={res.id} value={res.id} className="bg-slate-950 text-white">
                        {res.type === 'arpeggio' ? '🎯' : '🎸'} {res.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs font-mono ml-auto">
                <span className="font-bold text-[#0891b2] dark:text-cyan-300">{bpm} BPM</span>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={bpm}
                  onChange={(e) => onBpmChange(Number(e.target.value))}
                  className="w-16 sm:w-24 accent-[#0891b2] dark:accent-cyan-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Chips de Pasos de la Progresión */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-200 dark:border-slate-800/60">
              {resolvedSteps.map((step, idx) => {
                const isActive = currentProgressionStepIndex === idx;
                return (
                  <button
                    key={`${step.roman}_${idx}`}
                    type="button"
                    onClick={() => onSelectProgressionStep?.(idx)}
                    className={`px-2.5 py-1 rounded-lg border text-center shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#0891b2]/15 border-[#0891b2]/50 shadow-sm ring-1 ring-[#0891b2]/40 dark:bg-cyan-500/20 dark:border-cyan-400'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900 border-slate-300/80 dark:border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                      {step.fullChordLabel}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#0891b2] dark:text-cyan-300">
                      {step.roman}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FretboardToolbar;
