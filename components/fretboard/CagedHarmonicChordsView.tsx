'use client';

import React, { useState } from 'react';
import { DISPLAY_ROOTS } from '@/lib/music-theory/fretboard';
import { resolveCleanKeyRoot } from '@/lib/music/diatonicSpelling';
import {
  CAGED_BOX_DEFINITIONS,
  CagedChordVoicing,
  ChordExtensionFamily,
  TonalityMode,
  TONALITY_MODE_LABELS,
  getCagedDiatonicChords,
} from '@/lib/music-theory/cagedHarmonics';
import { NoteDisplayMode } from '@/lib/music-theory/scaleSystems';
import { Volume2, Sparkles, Layers, Music2, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { ChordEditToolbar } from './ChordEditToolbar';
import { ChordExtensionSelector, EXTENSION_FAMILIES_LIST } from './ChordExtensionSelector';
import {
  ChordTensionVariation,
  getVariationsForDegree,
} from '@/lib/music-theory/chordVariationsCatalog';
import { ChordVariationChips } from './ChordVariationChips';

interface CagedHarmonicChordsViewProps {
  selectedKeyRoot: string;
  onKeyRootChange: (root: string) => void;
  tonalityMode?: TonalityMode;
  onTonalityModeChange?: (mode: TonalityMode) => void;
  activeCagedBoxId: number; // 1 a 5 (C, A, G, E, D)
  onSelectCagedBoxId: (boxId: number) => void;
  activeChordDegreeIndex: number; // 0 a 6 (I, ii, iii, IV, V, vi, vii°)
  onSelectChordDegreeIndex: (degreeIdx: number) => void;
  activeExtensionFamily: ChordExtensionFamily;
  onSelectExtensionFamily: (family: ChordExtensionFamily) => void;
  onPlayStrum: () => void;
  onPlayArpeggio: () => void;
  displayMode: NoteDisplayMode | 'intervals';
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  instrumentType?: 'guitar_6' | 'bass_4' | 'bass_5';
  // Props de Edición y Persistencia en BD
  isEditing?: boolean;
  onToggleEditing?: () => void;
  onSaveToDB?: () => void;
  onResetFactory?: () => void;
  isSaving?: boolean;
  isCustom?: boolean;
  // Variaciones Contextuales de Tensiones
  activeVariationId?: string;
  onSelectVariation?: (variation: ChordTensionVariation) => void;
  activeChordOverride?: CagedChordVoicing;
}

export const CagedHarmonicChordsView: React.FC<CagedHarmonicChordsViewProps> = ({
  selectedKeyRoot,
  onKeyRootChange,
  tonalityMode: controlledTonalityMode,
  onTonalityModeChange,
  activeCagedBoxId,
  onSelectCagedBoxId,
  activeChordDegreeIndex,
  onSelectChordDegreeIndex,
  activeExtensionFamily,
  onSelectExtensionFamily,
  onPlayStrum,
  onPlayArpeggio,
  displayMode,
  onDisplayModeChange,
  instrumentType = 'guitar_6',
  isEditing = false,
  onToggleEditing,
  onSaveToDB,
  onResetFactory,
  isSaving = false,
  isCustom = false,
  activeVariationId,
  onSelectVariation,
  activeChordOverride,
}) => {
  const [internalTonalityMode, setInternalTonalityMode] = useState<TonalityMode>('ionian');
  const tonalityMode = controlledTonalityMode ?? internalTonalityMode;
  const setTonalityMode = (mode: TonalityMode) => {
    if (onTonalityModeChange) {
      onTonalityModeChange(mode);
    } else {
      setInternalTonalityMode(mode);
    }
  };

  const cleanKeyRoot = resolveCleanKeyRoot(selectedKeyRoot, tonalityMode);

  // Obtenemos los 7 acordes diatónicos calculados para la tonalidad, modo, caja activa y familia de extensiones
  const diatonicChords: CagedChordVoicing[] = getCagedDiatonicChords(
    cleanKeyRoot,
    activeCagedBoxId,
    instrumentType,
    activeExtensionFamily,
    tonalityMode
  );

  const baseActiveChord = diatonicChords[activeChordDegreeIndex] || diatonicChords[0];
  const variations = getVariationsForDegree(activeChordDegreeIndex, cleanKeyRoot, tonalityMode);
  const currentVariationId = activeVariationId || (variations[0]?.id ?? '');

  const [isFamiliesOpen, setIsFamiliesOpen] = useState<boolean>(false);
  const currentFamily =
    EXTENSION_FAMILIES_LIST.find((f) => f.id === activeExtensionFamily) || EXTENSION_FAMILIES_LIST[0];

  const activeChord = activeChordOverride || baseActiveChord;
  const activeBoxMeta =
    CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId) || CAGED_BOX_DEFINITIONS[0];

  return (
    <div className="w-full flex flex-col gap-1.5 p-2 sm:p-3 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shadow-sm backdrop-blur-xl transition-all">
      {/* 1. Fila de Forma CAGED y Botón Acordeón de Familias Armónicas */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
        {/* Forma CAGED: C, A, G, E, D */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
            <Layers className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>CAGED:</span>
          </span>
          {CAGED_BOX_DEFINITIONS.map((box) => {
            const isSelected = activeCagedBoxId === box.id;
            return (
              <button
                key={box.id}
                type="button"
                onClick={() => onSelectCagedBoxId(box.id)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shrink-0 flex items-center gap-1 active:scale-95 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm ring-1 ring-cyan-400/50'
                    : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={`${box.name}: ${box.description}`}
              >
                <span>{box.shapeLetter}</span>
              </button>
            );
          })}
        </div>

        {/* Botón Acordeón Compacto de Familias Diatónicas (Plegado por defecto en móvil) */}
        <button
          type="button"
          onClick={() => setIsFamiliesOpen((prev) => !prev)}
          className={`px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
            isFamiliesOpen
              ? 'bg-amber-400 text-slate-950 border-amber-300 font-black ring-1 ring-amber-400/40'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
          }`}
          title="Ver las 7 familias armónicas (Tríadas, Séptimas, Novenas, Oncenas, Trecenas, Agregados, Suspendidos)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Familia: <b>{currentFamily.label}</b></span>
          <span className="text-[10px] opacity-75 font-mono hidden xs:inline">({currentFamily.badge})</span>
          {isFamiliesOpen ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          )}
        </button>
      </div>

      {/* Cajón Desplegable de las 7 Familias Armónicas (Solo cuando se pulsa el botón acordeón) */}
      {isFamiliesOpen && (
        <div className="pt-1 pb-1.5 border-b border-slate-200 dark:border-slate-800">
          <ChordExtensionSelector
            activeFamily={activeExtensionFamily}
            onSelectFamily={(fam) => {
              onSelectExtensionFamily(fam);
              setIsFamiliesOpen(false);
            }}
          />
        </div>
      )}

      {/* 2. Barra de los 7 Acordes Diatónicos del Campo Armónico */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 truncate">
            <span>7 Grados:</span>
            <span className="text-slate-900 dark:text-white font-black">{cleanKeyRoot} {TONALITY_MODE_LABELS[tonalityMode]}</span>
            <span className="text-cyan-600 dark:text-cyan-400">({activeBoxMeta.shortLabel} • {currentFamily.label})</span>
          </span>
          <span className="hidden sm:inline text-slate-400">Toca un grado para iluminar en el mástil</span>
        </div>

        {/* Botones de los 7 Grados: Fila horizontal deslizable en móvil, grid en pantallas mayores */}
        <div className="overflow-x-auto flex sm:grid sm:grid-cols-7 gap-1.5 pb-1 no-scrollbar w-full">
          {diatonicChords.map((chord, idx) => {
            const isSelected = activeChordDegreeIndex === idx;

            const isDominant = chord.chordType === 'dom7';
            const isMajor = chord.chordType === 'maj';
            const isMinor = chord.chordType === 'min';
            const isAugmented = chord.chordType === 'aug';
            const isSus = chord.chordType === 'sus';

            let baseColorClasses = '';
            if (isSelected) {
              if (isDominant) {
                baseColorClasses =
                  'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/30';
              } else if (isMajor) {
                baseColorClasses =
                  'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/30';
              } else if (isMinor) {
                baseColorClasses =
                  'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50 shadow-md shadow-indigo-500/30';
              } else if (isAugmented) {
                baseColorClasses =
                  'bg-fuchsia-600 text-white border-fuchsia-400 ring-2 ring-fuchsia-400/50 shadow-md shadow-fuchsia-500/30';
              } else if (isSus) {
                baseColorClasses =
                  'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/30';
              } else {
                baseColorClasses =
                  'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/50 shadow-md shadow-rose-500/30';
              }
            } else {
              if (isDominant) {
                baseColorClasses =
                  'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40';
              } else if (isMajor) {
                baseColorClasses =
                  'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-500/40';
              } else if (isMinor) {
                baseColorClasses =
                  'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/30 dark:border-indigo-500/40';
              } else if (isAugmented) {
                baseColorClasses =
                  'bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-500/30 dark:border-fuchsia-500/40';
              } else if (isSus) {
                baseColorClasses =
                  'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40';
              } else {
                baseColorClasses =
                  'bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40';
              }
            }

            return (
              <button
                key={chord.degreeRoman}
                onClick={() => onSelectChordDegreeIndex(idx)}
                className={`shrink-0 min-w-[56px] sm:min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all text-center select-none active:scale-95 ${baseColorClasses}`}
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
                <span className="text-[9px] font-mono opacity-80 mt-0.5 truncate max-w-full hidden xs:block">
                  {chord.degreeName}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2.1 Selector Contextual de Tensiones y Variaciones del Acorde */}
        {onSelectVariation && variations.length > 1 && (
          <div className="pt-0.5">
            <ChordVariationChips
              variations={variations}
              activeVariationId={currentVariationId}
              onSelectVariation={onSelectVariation}
              chordBaseLabel={`${baseActiveChord?.rootNote || cleanKeyRoot} (${baseActiveChord?.degreeRoman || 'I'})`}
            />
          </div>
        )}
      </div>

      {/* 3. Barra de Edición Visual de Acordes (CRUD en PostgreSQL cuando se activa) */}
      {onToggleEditing && isEditing && (
        <ChordEditToolbar
          isEditing={isEditing}
          onToggleEditing={onToggleEditing}
          onSaveToDB={onSaveToDB || (() => {})}
          onResetFactory={onResetFactory || (() => {})}
          isSaving={isSaving}
          isCustom={isCustom}
          chordName={activeChord?.chordName || ''}
        />
      )}
    </div>
  );
};
