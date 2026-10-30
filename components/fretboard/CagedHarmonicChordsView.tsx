'use client';

import React from 'react';
import { DISPLAY_ROOTS } from '@/lib/music-theory/fretboard';
import {
  CAGED_BOX_DEFINITIONS,
  CagedChordVoicing,
  getCagedDiatonicChords,
} from '@/lib/music-theory/cagedHarmonics';
import { NoteDisplayMode } from '@/lib/music-theory/scaleSystems';
import { Volume2, Sparkles, Layers, Music2 } from 'lucide-react';

interface CagedHarmonicChordsViewProps {
  selectedKeyRoot: string;
  onKeyRootChange: (root: string) => void;
  activeCagedBoxId: number; // 1 a 5 (C, A, G, E, D)
  onSelectCagedBoxId: (boxId: number) => void;
  activeChordDegreeIndex: number; // 0 a 6 (I, ii, iii, IV, V, vi, vii°)
  onSelectChordDegreeIndex: (degreeIdx: number) => void;
  onPlayStrum: () => void;
  onPlayArpeggio: () => void;
  displayMode: NoteDisplayMode | 'intervals';
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  instrumentType?: 'guitar_6' | 'bass_4' | 'bass_5';
}

export const CagedHarmonicChordsView: React.FC<CagedHarmonicChordsViewProps> = ({
  selectedKeyRoot,
  onKeyRootChange,
  activeCagedBoxId,
  onSelectCagedBoxId,
  activeChordDegreeIndex,
  onSelectChordDegreeIndex,
  onPlayStrum,
  onPlayArpeggio,
  displayMode,
  onDisplayModeChange,
  instrumentType = 'guitar_6',
}) => {
  // Obtenemos los 7 acordes diatónicos calculados para la tonalidad y caja activa
  const diatonicChords: CagedChordVoicing[] = getCagedDiatonicChords(
    selectedKeyRoot,
    activeCagedBoxId,
    instrumentType
  );

  const activeChord = diatonicChords[activeChordDegreeIndex] || diatonicChords[0];
  const activeBoxMeta =
    CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId) || CAGED_BOX_DEFINITIONS[0];

  return (
    <div className="w-full flex flex-col gap-2.5 p-3 sm:p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shadow-sm backdrop-blur-xl transition-all">
      {/* 1. Fila Superior: Tonalidad (Key) y Selector de las 5 Cajas CAGED */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        {/* Selector de Tonalidad */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Music2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Tonalidad:</span>
          </label>
          <select
            value={selectedKeyRoot}
            onChange={(e) => onKeyRootChange(e.target.value)}
            className="h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white text-xs font-mono font-black rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer shadow-sm"
          >
            {DISPLAY_ROOTS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} {r.value === selectedKeyRoot ? '★' : ''}
              </option>
            ))}
          </select>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/20 px-2 py-1 rounded-lg border border-cyan-500/30">
            Escala Diatónica Mayor
          </span>
        </div>

        {/* Selector de Cajas CAGED (1 al 5) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>Forma CAGED:</span>
          </span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5">
            {CAGED_BOX_DEFINITIONS.map((box) => {
              const isSelected = activeCagedBoxId === box.id;
              return (
                <button
                  key={box.id}
                  onClick={() => onSelectCagedBoxId(box.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20 ring-2 ring-cyan-400/30'
                      : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={`${box.name}: ${box.description}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-slate-950' : 'bg-cyan-500'
                    }`}
                  />
                  <span>{box.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Barra de los 7 Acordes Diatónicos del Campo Armónico */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Campo Armónico Diatónico en</span>
            <span className="text-slate-900 dark:text-white font-black">
              {selectedKeyRoot} Mayor
            </span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">
              ({activeBoxMeta.shortLabel})
            </span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
            7 Voicings Posicionales
          </span>
        </div>

        {/* Botones de los 7 Grados con Codificación Cromática */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 w-full">
          {diatonicChords.map((chord, idx) => {
            const isSelected = activeChordDegreeIndex === idx;

            // Código de color musical:
            // - Grados Mayores (I, IV, V): Acento cian / esmeralda
            // - Grados Menores (ii, iii, vi): Acento índigo / violeta
            // - Grado Disminuido (vii°): Acento carmesí / rose
            const isMajor = chord.chordType === 'maj';
            const isMinor = chord.chordType === 'min';
            const isDim = chord.chordType === 'dim';

            let baseColorClasses = '';
            if (isSelected) {
              if (isMajor) {
                baseColorClasses =
                  'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/30';
              } else if (isMinor) {
                baseColorClasses =
                  'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50 shadow-md shadow-indigo-500/30';
              } else {
                baseColorClasses =
                  'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/50 shadow-md shadow-rose-500/30';
              }
            } else {
              if (isMajor) {
                baseColorClasses =
                  'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-500/40';
              } else if (isMinor) {
                baseColorClasses =
                  'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/30 dark:border-indigo-500/40';
              } else {
                baseColorClasses =
                  'bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40';
              }
            }

            return (
              <button
                key={chord.degreeRoman}
                onClick={() => onSelectChordDegreeIndex(idx)}
                className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all text-center select-none active:scale-95 ${baseColorClasses}`}
                title={`Grado ${chord.degreeRoman}: ${chord.chordName} (${chord.degreeName})`}
              >
                <span
                  className={`text-[10px] font-mono uppercase font-black tracking-tight ${
                    isSelected ? 'opacity-90' : 'opacity-70'
                  }`}
                >
                  {chord.degreeRoman}
                </span>
                <span className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                  {chord.chordName}
                </span>
                <span className="text-[9px] font-mono opacity-80 mt-0.5">
                  {isMajor ? 'Mayor' : isMinor ? 'menor' : 'disminuido'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Fila de Control: Audio (Rasguear / Arpegiar), Modo de Visualización y Detalle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        {/* Controles de Reproducción Web Audio */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPlayStrum}
            className="h-8 px-3 rounded-lg bg-[#0891b2] hover:bg-[#0e7490] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-cyan-600 dark:text-slate-950 dark:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            title="Reproducir acorde completo rasgueado"
          >
            <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Rasguear</span>
          </button>
          <button
            onClick={onPlayArpeggio}
            className="h-8 px-2.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1 border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
            title="Reproducir arpegio nota por nota"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Arpegiar</span>
          </button>
        </div>

        {/* Resumen del Voicing Activo */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-white dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-800">
          <span className="text-slate-500">Voicing:</span>
          <strong className="text-slate-900 dark:text-white">
            {activeChord?.fullName}
          </strong>
          <span className="text-slate-400">•</span>
          <span className="text-cyan-600 dark:text-cyan-400">
            {activeChord?.notes.length} notas en {activeBoxMeta.shortLabel}
          </span>
        </div>

        {/* Alternador de Modo de Visualización (Notas / Grados / Dedos) */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-950 rounded-lg border border-slate-300/80 dark:border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => onDisplayModeChange('notes')}
            className={`px-2 py-1 rounded-md transition-colors font-bold ${
              displayMode === 'notes'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-sm ring-1 ring-cyan-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Notas
          </button>
          <button
            onClick={() => onDisplayModeChange('degrees')}
            className={`px-2 py-1 rounded-md transition-colors font-bold ${
              displayMode === 'degrees' || displayMode === 'intervals'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-sm ring-1 ring-cyan-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Grados (R-3-5)
          </button>
          <button
            onClick={() => onDisplayModeChange('fingers')}
            className={`px-2 py-1 rounded-md transition-colors font-bold ${
              displayMode === 'fingers'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm ring-1 ring-emerald-300'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
            }`}
            title="Ver digitación anatómica (Dedos 1-4)"
          >
            🖐️ Dedos
          </button>
        </div>
      </div>
    </div>
  );
};

