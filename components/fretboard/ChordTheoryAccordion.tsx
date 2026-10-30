'use client';

import React, { useState } from 'react';
import {
  InstrumentType,
  CHORDS_CATALOG,
  ChordKey,
  SCALES_CATALOG,
  ScaleKey,
  getChordNoteList,
  getScaleNoteList,
  PROGRESSIONS_CATALOG,
  resolveProgressionChords,
} from '@/lib/music-theory/fretboard';
import { CagedChordVoicing } from '@/lib/music-theory/cagedHarmonics';
import { StudyMode } from './FretboardToolbar';
import { Sparkles, BookOpen, Award, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface ChordTheoryAccordionProps {
  studyMode: StudyMode;
  instrument: InstrumentType;
  rootNote: string;
  chordKey?: ChordKey;
  scaleKey: ScaleKey;
  selectedProgressionId: string;
  currentProgressionStepIndex: number;
  defaultExpanded?: boolean;
  cagedChord?: CagedChordVoicing;
  cagedBoxName?: string;
}

export const ChordTheoryAccordion: React.FC<ChordTheoryAccordionProps> = ({
  studyMode,
  instrument,
  rootNote,
  chordKey = 'major',
  scaleKey,
  selectedProgressionId,
  currentProgressionStepIndex,
  defaultExpanded = false,
  cagedChord,
  cagedBoxName,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const isBass = instrument.startsWith('bass');

  // Título resumen para la barra del acordeón
  const summaryBadge =
    studyMode === 'chords'
      ? cagedChord
        ? `${cagedChord.fullName} (${cagedBoxName || 'CAGED'})`
        : `${rootNote} Mayor`
      : studyMode === 'scales'
      ? `${rootNote} ${SCALES_CATALOG[scaleKey]?.name || ''}`
      : (() => {
          const prog = PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
          const resolved = resolveProgressionChords(prog, rootNote);
          const cur = resolved[currentProgressionStepIndex] || resolved[0];
          return `${cur?.fullChordLabel || ''} (${cur?.roman || ''})`;
        })();

  return (
    <div className="w-full max-w-full bg-white/95 dark:bg-slate-900/90 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-sm overflow-hidden my-2 backdrop-blur-xl transition-all">
      {/* Botón de Cabecera del Acordeón: 1 solo tap para expandir/colapsar */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-stone-100/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
        aria-expanded={isExpanded}
        aria-label="Alternar análisis armónico y notas guía"
      >
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="w-4 h-4 text-teal-700 dark:text-cyan-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-slate-200">
            {isExpanded ? '▴ Ocultar' : '▾ Ver'} Análisis Armónico y Notas Guía
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-800 dark:text-cyan-300 border border-teal-500/30 dark:border-cyan-500/30 shrink-0 font-bold">
            {summaryBadge}
          </span>
        </div>

        <div className="flex items-center gap-1 text-stone-500 dark:text-slate-400 shrink-0 ml-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-teal-700 dark:text-cyan-400 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-500 dark:text-slate-400 transition-transform" />
          )}
        </div>
      </button>

      {/* Contenido desplegable */}
      {isExpanded && (
        <div className="p-3 sm:p-5 pt-2 border-t border-stone-200/80 dark:border-slate-800/80 bg-stone-50/70 dark:bg-slate-950/40 animate-in fade-in duration-200">
          {studyMode === 'chords' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Estructura del Acorde CAGED */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-stone-200/90 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 text-teal-700 dark:text-cyan-400 text-xs font-mono font-bold uppercase">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Campo Armónico Diatónico</span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {cagedChord ? cagedChord.fullName : `${rootNote} Mayor`}
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  <span>Grado: </span>
                  <strong className="text-cyan-600 dark:text-cyan-400">
                    {cagedChord?.degreeRoman} ({cagedChord?.degreeName})
                  </strong>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Tonalidad: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{rootNote} Mayor</strong>
                  <span> • Forma: </span>
                  <strong className="text-purple-600 dark:text-purple-400">{cagedBoxName || 'CAGED'}</strong>
                </div>
              </div>

              {/* Notas del Voicing Posicional */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-mono font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Notas del Voicing Cerrado</span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {cagedChord?.notes.map((n, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {n.intervalLabel === 'R' ? cagedChord.rootNote : n.intervalLabel}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                        ({n.intervalLabel})
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/15 text-emerald-600 font-bold">
                        D{n.finger}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Las notas fundamentales (<strong className="text-cyan-500">R</strong>), terceras (<strong className="text-fuchsia-500">3/b3</strong>) y quintas (<strong className="text-amber-500">5/b5</strong>) definen la sonoridad posicional del acorde sin salir de la caja.
                </p>
              </div>

              {/* Tip de Instrumento */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold uppercase">
                  <Award className="w-3.5 h-3.5" />
                  <span>Pedagogía Armónica CAGED</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  En el sistema CAGED, dominar los 7 acordes diatónicos en una sola forma permite acompañar progresiones enteras (ej. ii–V–I o I–vi–IV–V) con mínima tensión biomecánica y economía máxima de movimiento.
                </p>
              </div>
            </div>
          )}

          {studyMode === 'scales' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const scaleInfo = SCALES_CATALOG[scaleKey];
                const notes = getScaleNoteList(rootNote, scaleKey);
                return (
                  <>
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold uppercase">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Modo / Escala</span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {rootNote} {scaleInfo.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {notes.length} notas en el mapa tonal
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-1.5 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-mono font-bold uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Notas del Modo</span>
                      </div>
                      <div className="flex flex-wrap gap-1 items-center">
                        {notes.map((n, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                          >
                            {n.note}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Aplicación</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isBass
                          ? 'Usa notas de la escala para conectar acordes en Walking Bass con notas de paso cromáticas y diatónicas.'
                          : 'Conecta las 5 Cajas CAGED a lo largo de los 24 trastes para improvisar sin perder la referencia de la tónica.'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {studyMode === 'progressions' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const prog =
                  PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
                const resolved = resolveProgressionChords(prog, rootNote);
                const cur = resolved[currentProgressionStepIndex] || resolved[0];
                return (
                  <>
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">Progresión</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{prog.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Género: {prog.genre}</div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">Acorde Activo</div>
                      <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">{cur.fullChordLabel}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {cur.stepName} ({cur.roman})
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">Movimiento Armónico</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{prog.description}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChordTheoryAccordion;
