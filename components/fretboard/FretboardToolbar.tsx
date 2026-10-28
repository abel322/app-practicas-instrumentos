'use client';

import React from 'react';
import {
  InstrumentType,
  INSTRUMENTS,
  DISPLAY_ROOTS,
  CHORDS_CATALOG,
  ChordKey,
  SCALES_CATALOG,
  ScaleKey,
  SCALE_BOXES,
  PROGRESSIONS_CATALOG,
  ChordVoicing,
  getVoicingShortLabel,
} from '@/lib/music-theory/fretboard';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Layers,
  Music,
  Sliders,
  Sparkles,
  Volume2,
  ListMusic,
} from 'lucide-react';

export type StudyMode = 'chords' | 'scales' | 'progressions';

interface FretboardToolbarProps {
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  instrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  rootNote: string;
  onRootNoteChange: (root: string) => void;

  // Modo 1: Acordes
  chordKey: ChordKey;
  onChordKeyChange: (chord: ChordKey) => void;
  voicings: ChordVoicing[];
  selectedVoicingIndex: number;
  onSelectVoicingIndex: (idx: number) => void;
  onStrumVoicing: () => void;
  onArpeggiateVoicing: () => void;

  // Modo 2: Escalas
  scaleKey: ScaleKey;
  onScaleKeyChange: (scale: ScaleKey) => void;
  scaleViewMode: 'all' | 'boxes';
  onScaleViewModeChange: (mode: 'all' | 'boxes') => void;
  selectedBox: number;
  onSelectBox: (boxId: number) => void;
  displayMode: 'notes' | 'intervals';
  onDisplayModeChange: (mode: 'notes' | 'intervals') => void;

  // Modo 3: Progresiones
  selectedProgressionId: string;
  onProgressionIdChange: (id: string) => void;
  progressionPlaying: boolean;
  onToggleProgressionPlay: () => void;
  onNextProgressionStep: () => void;
  onPrevProgressionStep: () => void;
  currentProgressionStepIndex: number;
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export const FretboardToolbar: React.FC<FretboardToolbarProps> = ({
  studyMode,
  onStudyModeChange,
  instrument,
  onInstrumentChange,
  rootNote,
  onRootNoteChange,
  chordKey,
  onChordKeyChange,
  voicings,
  selectedVoicingIndex,
  onSelectVoicingIndex,
  onStrumVoicing,
  onArpeggiateVoicing,
  scaleKey,
  onScaleKeyChange,
  scaleViewMode,
  onScaleViewModeChange,
  selectedBox,
  onSelectBox,
  displayMode,
  onDisplayModeChange,
  selectedProgressionId,
  onProgressionIdChange,
  progressionPlaying,
  onToggleProgressionPlay,
  onNextProgressionStep,
  onPrevProgressionStep,
  currentProgressionStepIndex,
  bpm,
  onBpmChange,
}) => {
  const currentProgression =
    PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];

  return (
    <div className="w-full max-w-full flex flex-col gap-2 min-w-0">
      {/* 1. Selector de Instrumento tipo Segmented Control (Fila Única Compacta) */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold w-full">
        <button
          onClick={() => onInstrumentChange('guitar_6')}
          className={`py-2 px-1 rounded-lg transition-all text-center truncate ${
            instrument === 'guitar_6'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Guitarra de 6 Cuerdas (E-A-D-G-B-E)"
        >
          🎸 Guitarra 6C
        </button>

        <button
          onClick={() => onInstrumentChange('bass_4')}
          className={`py-2 px-1 rounded-lg transition-all text-center truncate ${
            instrument === 'bass_4'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Bajo Eléctrico de 4 Cuerdas (E-A-D-G)"
        >
          ⚡ Bajo 4C
        </button>

        <button
          onClick={() => onInstrumentChange('bass_5')}
          className={`py-2 px-1 rounded-lg transition-all text-center truncate ${
            instrument === 'bass_5'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Bajo Eléctrico de 5 Cuerdas con Low B (B-E-A-D-G)"
        >
          ⚡ Bajo 5C
        </button>
      </div>

      {/* 2. Modos en Pestañas Compactas (1 Sola Fila) */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-bold w-full">
        <button
          onClick={() => onStudyModeChange('chords')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all truncate ${
            studyMode === 'chords'
              ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.4)] font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Acordes</span>
        </button>

        <button
          onClick={() => onStudyModeChange('scales')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all truncate ${
            studyMode === 'scales'
              ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.4)] font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Music className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Escalas</span>
        </button>

        <button
          onClick={() => onStudyModeChange('progressions')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all truncate ${
            studyMode === 'progressions'
              ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.4)] font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Progresiones</span>
        </button>
      </div>

      {/* 3. Panel de Controles Ultra-Compacto según el Modo */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-xl flex flex-col gap-2 w-full min-w-0">
        {/* ======================= MODO 1: ACORDES ======================= */}
        {studyMode === 'chords' && (
          <div className="flex flex-col gap-2 min-w-0">
            {/* Cuadrícula de 2 Columnas para Tónica y Tipo de Acorde (Ahorro vertical del 70%) */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Tónica (Root)
                </label>
                <select
                  value={rootNote}
                  onChange={(e) => onRootNoteChange(e.target.value)}
                  className="w-full h-9 bg-slate-950 border border-slate-700/80 text-white text-xs font-mono font-bold rounded-xl px-2.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DISPLAY_ROOTS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Tipo de Acorde
                </label>
                <select
                  value={chordKey}
                  onChange={(e) => onChordKeyChange(e.target.value as ChordKey)}
                  className="w-full h-9 bg-slate-950 border border-slate-700/80 text-white text-xs font-mono font-bold rounded-xl px-2.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {Object.entries(CHORDS_CATALOG).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila de Utilidades: Rasguear / Arpegiar + Nombres/Intervalos */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onStrumVoicing}
                  className="h-8 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Rasguear</span>
                </button>
                <button
                  onClick={onArpeggiateVoicing}
                  className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 border border-slate-700 transition-all active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Arpegiar</span>
                </button>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => onDisplayModeChange('notes')}
                  className={`px-2 py-1 rounded-md transition-colors font-bold ${
                    displayMode === 'notes'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Notas
                </button>
                <button
                  onClick={() => onDisplayModeChange('intervals')}
                  className={`px-2 py-1 rounded-md transition-colors font-bold ${
                    displayMode === 'intervals'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Grados
                </button>
              </div>
            </div>

            {/* Carrusel Horizontal de Posiciones con Etiquetas Cortas (Mobile-Friendly) */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-800/60 min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                Posición / Inversión:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
                {voicings.length === 0 ? (
                  <span className="text-xs text-slate-500">Calculando digitaciones...</span>
                ) : (
                  voicings.map((v, idx) => {
                    const isSelected = selectedVoicingIndex === idx;
                    const shortLabel = getVoicingShortLabel(v, idx);
                    return (
                      <button
                        key={v.id}
                        onClick={() => onSelectVoicingIndex(idx)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                        title={v.name}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span>{shortLabel}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================= MODO 2: ESCALAS ======================= */}
        {studyMode === 'scales' && (
          <div className="flex flex-col gap-2 min-w-0">
            {/* Cuadrícula de 2 Columnas para Tónica y Escala */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Tónica (Root)
                </label>
                <select
                  value={rootNote}
                  onChange={(e) => onRootNoteChange(e.target.value)}
                  className="w-full h-9 bg-slate-950 border border-slate-700/80 text-white text-xs font-mono font-bold rounded-xl px-2.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DISPLAY_ROOTS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Modo / Escala
                </label>
                <select
                  value={scaleKey}
                  onChange={(e) => onScaleKeyChange(e.target.value as ScaleKey)}
                  className="w-full h-9 bg-slate-950 border border-slate-700/80 text-white text-xs font-mono font-bold rounded-xl px-2.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {Object.entries(SCALES_CATALOG).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila de Utilidades: Todo el mástil vs Cajas + Etiquetas */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => onScaleViewModeChange('all')}
                  className={`px-2 py-1 rounded-md font-bold transition-all ${
                    scaleViewMode === 'all'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mástil (0–24)
                </button>
                <button
                  onClick={() => onScaleViewModeChange('boxes')}
                  className={`px-2 py-1 rounded-md font-bold transition-all ${
                    scaleViewMode === 'boxes'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Por Cajas (1–5)
                </button>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => onDisplayModeChange('notes')}
                  className={`px-2 py-1 rounded-md transition-colors font-bold ${
                    displayMode === 'notes'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Notas
                </button>
                <button
                  onClick={() => onDisplayModeChange('intervals')}
                  className={`px-2 py-1 rounded-md transition-colors font-bold ${
                    displayMode === 'intervals'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Grados
                </button>
              </div>
            </div>

            {/* Selector de Cajas 1 a 5 si está en modo Cajas */}
            {scaleViewMode === 'boxes' && (
              <div className="flex flex-col gap-1 pt-1 border-t border-slate-800/60 min-w-0">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Caja / Posición:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
                  {SCALE_BOXES.map((box) => {
                    const isSelected = selectedBox === box.id;
                    return (
                      <button
                        key={box.id}
                        onClick={() => onSelectBox(box.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-cyan-400">Box {box.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= MODO 3: PROGRESIONES ======================= */}
        {studyMode === 'progressions' && (
          <div className="flex flex-col gap-2 min-w-0">
            {/* Cuadrícula de 2 Columnas para Tonalidad y Progresión */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Tonalidad (Key)
                </label>
                <select
                  value={rootNote}
                  onChange={(e) => onRootNoteChange(e.target.value)}
                  className="w-full h-9 bg-slate-950 border border-slate-700/80 text-white text-xs font-mono font-bold rounded-xl px-2.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DISPLAY_ROOTS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Biblioteca
                </label>
                <select
                  value={selectedProgressionId}
                  onChange={(e) => onProgressionIdChange(e.target.value)}
                  className="w-full h-9 bg-slate-950 border border-slate-700/80 text-white text-xs font-mono font-bold rounded-xl px-2.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {PROGRESSIONS_CATALOG.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila de Transporte y BPM */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onPrevProgressionStep}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95"
                  title="Anterior"
                  aria-label="Acorde anterior"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onToggleProgressionPlay}
                  className={`h-8 px-3.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                    progressionPlaying
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                      : 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:bg-cyan-300'
                  }`}
                >
                  {progressionPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-slate-950" />
                      <span>PAUSAR</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onNextProgressionStep}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95"
                  title="Siguiente"
                  aria-label="Siguiente acorde"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 text-[10px]">TEMPO:</span>
                <span className="font-bold text-cyan-300">{bpm}</span>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={bpm}
                  onChange={(e) => onBpmChange(Number(e.target.value))}
                  className="w-20 sm:w-28 accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Chips de Pasos de la Progresión */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
              {currentProgression.steps.map((step, idx) => {
                const isActive = currentProgressionStepIndex === idx;
                return (
                  <div
                    key={`${step.roman}_${idx}`}
                    className={`px-2.5 py-1 rounded-lg border text-center shrink-0 transition-all ${
                      isActive
                        ? 'bg-cyan-500/25 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-mono font-black text-cyan-300">{step.roman}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({step.bars}c)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
