'use client';

import React, { useState } from 'react';
import { Shuffle, Volume2, Plus, RefreshCw, ChevronDown, ChevronUp, Sparkles, Music } from 'lucide-react';
import {
  getModalInterchangeChords,
  BorrowedChordInfo,
} from '@/lib/music-theory/modalInterchange';

export interface ModalInterchangePanelProps {
  tonalityRoot: string;
  activeBorrowedChordId?: string | null;
  onSelectBorrowedChord: (chord: BorrowedChordInfo) => void;
  onAddBorrowedChordToProgression?: (chord: BorrowedChordInfo) => void;
  onReplaceCurrentProgressionChord?: (chord: BorrowedChordInfo) => void;
}

export function ModalInterchangePanel({
  tonalityRoot,
  activeBorrowedChordId,
  onSelectBorrowedChord,
  onAddBorrowedChordToProgression,
  onReplaceCurrentProgressionChord,
}: ModalInterchangePanelProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const groups = getModalInterchangeChords(tonalityRoot);

  // Buscar el acorde activo seleccionado actualmente si existe
  const activeChord = groups
    .flatMap((g) => g.chords)
    .find((c) => c.id === activeBorrowedChordId);

  return (
    <div className="w-full my-1.5 bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-md select-none transition-all">
      {/* Cabecera Plegable del Acordeón */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Shuffle className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-300" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-100 dark:text-white">
                🔀 Intercambio Modal
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                Tonalidad {tonalityRoot}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              Acordes prestados de modos paralelos (Eólico, Dórico, Lidio, Mixolidio, Frigio)
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-slate-950 dark:bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800 flex items-center gap-1 transition-all"
          >
            <span className="text-[11px] font-mono">{isOpen ? 'Plegar' : 'Explorar'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Contenido Desplegable */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-3">
          {/* Grupos de Modos Paralelos */}
          <div className="flex flex-col gap-2.5">
            {groups.map((group) => (
              <div
                key={group.mode}
                className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60"
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-slate-200">{group.modeLabel}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-normal">
                      ({group.badge})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {group.description}
                  </span>
                </div>

                {/* Píldoras de Acordes del Modo Paralelo */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {group.chords.map((chord) => {
                    const isSelected = activeBorrowedChordId === chord.id;

                    const isMajor = chord.chordKey === 'maj7' || chord.chordKey === 'major';
                    const isMinor = chord.chordKey === 'm7' || chord.chordKey === 'minor';
                    const isDominant = chord.chordKey === 'dom7';

                    let badgeColor = isMajor
                      ? 'border-cyan-500/50 text-cyan-300'
                      : isMinor
                      ? 'border-indigo-500/50 text-indigo-300'
                      : isDominant
                      ? 'border-amber-500/50 text-amber-300'
                      : 'border-rose-500/50 text-rose-300';

                    return (
                      <button
                        key={chord.id}
                        type="button"
                        onClick={() => onSelectBorrowedChord(chord)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-left transition-all active:scale-95 flex items-center gap-2 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md ring-2 ring-amber-400/50 scale-102'
                            : `bg-slate-900/90 hover:bg-slate-800 border-slate-800 ${badgeColor}`
                        }`}
                        title={`${chord.chordName} (${chord.degreeDisplay}): ${chord.harmonicFunction}. Clic para proyectar en diapasón y escuchar.`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-xs font-mono font-black ${isSelected ? 'text-slate-950' : ''}`}>
                            {chord.chordName}
                          </span>
                          <span
                            className={`text-[9px] font-mono leading-none ${
                              isSelected ? 'text-slate-900 font-extrabold' : 'opacity-70'
                            }`}
                          >
                            {chord.degreeDisplay}
                          </span>
                        </div>
                        <Volume2 className={`w-3 h-3 shrink-0 ${isSelected ? 'text-slate-950' : 'opacity-60'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Banner de Acción cuando hay un Acorde Prestado Seleccionado */}
          {activeChord && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-amber-300">
                      {activeChord.chordName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                      {activeChord.degreeDisplay} ({activeChord.parallelModeLabel})
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 truncate font-mono">
                    💡 Modo recomendado: <b>{activeChord.suggestedScaleName}</b> • {activeChord.harmonicFunction}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => onSelectBorrowedChord(activeChord)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1 active:scale-95"
                  title="Tocar acorde nuevamente"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Escuchar</span>
                </button>

                {onReplaceCurrentProgressionChord && (
                  <button
                    type="button"
                    onClick={() => onReplaceCurrentProgressionChord(activeChord)}
                    className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                    title="Reemplazar el acorde actualmente seleccionado en la progresión con este acorde prestado"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reemplazar</span>
                  </button>
                )}

                {onAddBorrowedChordToProgression && (
                  <button
                    type="button"
                    onClick={() => onAddBorrowedChordToProgression(activeChord)}
                    className="px-2.5 py-1 rounded-lg bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                    title="Añadir este acorde prestado como nuevo paso al final de la progresión activa"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>+ Añadir a Progresión</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ModalInterchangePanel;
