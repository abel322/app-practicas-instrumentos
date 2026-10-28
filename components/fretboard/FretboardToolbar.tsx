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
  Guitar,
  Volume2,
  ListMusic,
  Hash,
  Eye,
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
    <div className="w-full flex flex-col gap-4">
      {/* 1. Barra de Selector de Instrumento y Modos de Estudio Principales */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 rounded-2xl bg-zinc-900/70 border border-white/10 backdrop-blur-xl">
        {/* Selector de Instrumento */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/70 border border-white/5 overflow-x-auto no-scrollbar">
          {(['guitar_6', 'bass_4', 'bass_5'] as InstrumentType[]).map((inst) => {
            const isSelected = instrument === inst;
            const config = INSTRUMENTS[inst];
            return (
              <button
                key={inst}
                onClick={() => onInstrumentChange(inst)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{inst.startsWith('guitar') ? '🎸' : '⚡'}</span>
                <span>{config.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selector de Modos de Estudio (Pastillas Superiores) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950/70 border border-white/5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onStudyModeChange('chords')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              studyMode === 'chords'
                ? 'bg-cyan-400 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MODO 1: ACORDES & POSICIONES</span>
          </button>

          <button
            onClick={() => onStudyModeChange('scales')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              studyMode === 'scales'
                ? 'bg-cyan-400 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>MODO 2: ESCALAS & MODOS</span>
          </button>

          <button
            onClick={() => onStudyModeChange('progressions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              studyMode === 'progressions'
                ? 'bg-cyan-400 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>MODO 3: PROGRESIONES ARMÓNICAS</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Herramientas Dinámica según el Modo Activo */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl">
        {/* ======================= MODO 1: ACORDES ======================= */}
        {studyMode === 'chords' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Selector de Tónica y Tipo de Acorde */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Tónica (Root)
                  </label>
                  <select
                    value={rootNote}
                    onChange={(e) => onRootNoteChange(e.target.value)}
                    className="bg-zinc-950 border border-white/15 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {DISPLAY_ROOTS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Tipo de Acorde
                  </label>
                  <select
                    value={chordKey}
                    onChange={(e) => onChordKeyChange(e.target.value as ChordKey)}
                    className="bg-zinc-950 border border-white/15 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {Object.entries(CHORDS_CATALOG).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alternador Nombres de Notas vs Intervalos */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Visualización
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-white/15 rounded-xl">
                    <button
                      onClick={() => onDisplayModeChange('notes')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        displayMode === 'notes'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Notas (C, D..)
                    </button>
                    <button
                      onClick={() => onDisplayModeChange('intervals')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        displayMode === 'intervals'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Grados (R, 3..)
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones de Escucha: Rasguear y Arpegiar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onStrumVoicing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Rasguear Acorde</span>
                </button>
                <button
                  onClick={onArpeggiateVoicing}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 border border-white/10 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Arpegiar</span>
                </button>
              </div>
            </div>

            {/* Carrusel de Posiciones e Inversiones */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                Carrusel de Posiciones & Inversiones (Enfoque de Mástil con Dedos 1, 2, 3, 4):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {voicings.length === 0 ? (
                  <span className="text-xs text-zinc-500">Calculando digitaciones para este instrumento...</span>
                ) : (
                  voicings.map((v, idx) => {
                    const isSelected = selectedVoicingIndex === idx;
                    return (
                      <button
                        key={v.id}
                        onClick={() => onSelectVoicingIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                            : 'bg-zinc-950/60 border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{v.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.2 rounded bg-white/5">
                          Trastes {v.fretRange[0]}–{v.fretRange[1]}
                        </span>
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Selector de Tónica y Escala */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Tónica (Root)
                  </label>
                  <select
                    value={rootNote}
                    onChange={(e) => onRootNoteChange(e.target.value)}
                    className="bg-zinc-950 border border-white/15 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {DISPLAY_ROOTS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Escala / Modo
                  </label>
                  <select
                    value={scaleKey}
                    onChange={(e) => onScaleKeyChange(e.target.value as ScaleKey)}
                    className="bg-zinc-950 border border-white/15 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {Object.entries(SCALES_CATALOG).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alternador Nombres de Notas vs Intervalos */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Etiquetas
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-white/15 rounded-xl">
                    <button
                      onClick={() => onDisplayModeChange('notes')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        displayMode === 'notes'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Notas (C, D..)
                    </button>
                    <button
                      onClick={() => onDisplayModeChange('intervals')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        displayMode === 'intervals'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Intervalos (R, b3, 5..)
                    </button>
                  </div>
                </div>
              </div>

              {/* Conmutador: Ver Todo el Mástil vs Por Patrones / Cajas */}
              <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-white/15 rounded-xl">
                <button
                  onClick={() => onScaleViewModeChange('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scaleViewMode === 'all'
                      ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Ver Todo el Mástil (0–24)
                </button>
                <button
                  onClick={() => onScaleViewModeChange('boxes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scaleViewMode === 'boxes'
                      ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Ver por Cajas / Patrones
                </button>
              </div>
            </div>

            {/* Selector de Cajas 1 a 5 si está en modo Cajas */}
            {scaleViewMode === 'boxes' && (
              <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                  Selecciona la Posición de Estudio (Cajas 1 a 5):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {SCALE_BOXES.map((box) => {
                    const isSelected = selectedBox === box.id;
                    return (
                      <button
                        key={box.id}
                        onClick={() => onSelectBox(box.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                            : 'bg-zinc-950/60 border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="font-mono text-cyan-400 font-bold">Box {box.id}</span>
                        <span>{box.name}</span>
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Selector de Tonalidad y Progresión */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Tonalidad (Key)
                  </label>
                  <select
                    value={rootNote}
                    onChange={(e) => onRootNoteChange(e.target.value)}
                    className="bg-zinc-950 border border-white/15 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {DISPLAY_ROOTS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                    Biblioteca de Progresiones
                  </label>
                  <select
                    value={selectedProgressionId}
                    onChange={(e) => onProgressionIdChange(e.target.value)}
                    className="bg-zinc-950 border border-white/15 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {PROGRESSIONS_CATALOG.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slider de Tempo (BPM) */}
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="uppercase font-semibold">Tempo</span>
                    <span className="font-bold text-cyan-300">{bpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={bpm}
                    onChange={(e) => onBpmChange(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Barra de Transporte / Reproducción */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onPrevProgressionStep}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 transition-all active:scale-95"
                  title="Compás Anterior"
                  aria-label="Acorde anterior en progresión"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={onToggleProgressionPlay}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 ${
                    progressionPlaying
                      ? 'bg-amber-400 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                      : 'bg-cyan-400 text-zinc-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:bg-cyan-300'
                  }`}
                >
                  {progressionPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-zinc-950" />
                      <span>PAUSAR</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-zinc-950" />
                      <span>INICIAR PLAYBACK</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onNextProgressionStep}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 transition-all active:scale-95"
                  title="Siguiente Compás"
                  aria-label="Siguiente acorde en progresión"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visualizador de Pasos de la Progresión */}
            <div className="pt-2 border-t border-white/5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {currentProgression.steps.map((step, idx) => {
                  const isActive = currentProgressionStepIndex === idx;
                  return (
                    <div
                      key={`${step.roman}_${idx}`}
                      className={`p-2.5 rounded-xl border transition-all text-center ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                          : 'bg-zinc-950/60 border-white/10'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold text-cyan-300">{step.roman}</div>
                      <div className="text-[11px] text-zinc-300 font-semibold truncate">{step.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{step.bars} Compás(es)</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
