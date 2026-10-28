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
import { StudyMode } from './FretboardToolbar';
import { Sparkles, BookOpen, Award, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface ChordTheoryAccordionProps {
  studyMode: StudyMode;
  instrument: InstrumentType;
  rootNote: string;
  chordKey: ChordKey;
  scaleKey: ScaleKey;
  selectedProgressionId: string;
  currentProgressionStepIndex: number;
  defaultExpanded?: boolean;
}

export const ChordTheoryAccordion: React.FC<ChordTheoryAccordionProps> = ({
  studyMode,
  instrument,
  rootNote,
  chordKey,
  scaleKey,
  selectedProgressionId,
  currentProgressionStepIndex,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const isBass = instrument.startsWith('bass');

  // Título resumen para la barra del acordeón
  const summaryBadge =
    studyMode === 'chords'
      ? `${rootNote} ${CHORDS_CATALOG[chordKey]?.name || ''}`
      : studyMode === 'scales'
      ? `${rootNote} ${SCALES_CATALOG[scaleKey]?.name || ''}`
      : (() => {
          const prog = PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
          const resolved = resolveProgressionChords(prog, rootNote);
          const cur = resolved[currentProgressionStepIndex] || resolved[0];
          return `${cur?.fullChordLabel || ''} (${cur?.roman || ''})`;
        })();

  return (
    <div className="w-full max-w-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden my-2 backdrop-blur-xl transition-all">
      {/* Botón de Cabecera del Acordeón: 1 solo tap para expandir/colapsar */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
        aria-expanded={isExpanded}
        aria-label="Alternar análisis armónico y notas guía"
      >
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            {isExpanded ? '▴ Ocultar' : '▾ Ver'} Análisis Armónico y Notas Guía
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
            {summaryBadge}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-cyan-400 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
          )}
        </div>
      </button>

      {/* Contenido desplegable */}
      {isExpanded && (
        <div className="p-3 sm:p-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 animate-in fade-in duration-200">
          {studyMode === 'chords' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Estructura del Acorde */}
              {(() => {
                const chordInfo = CHORDS_CATALOG[chordKey];
                return (
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-bold uppercase">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Estructura</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">
                      {rootNote} {chordInfo.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono">Fórmula:</span>
                      {chordInfo.labels.map((lbl, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            lbl === 'R'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : lbl.includes('3')
                              ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                              : lbl.includes('7')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Notas y Guías */}
              {(() => {
                const notes = getChordNoteList(rootNote, chordKey);
                return (
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-fuchsia-400 text-xs font-mono font-bold uppercase">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Notas Guía (3ra y 7ma)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {notes.map((n, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800"
                        >
                          <span className="text-xs font-black text-white">{n.note}</span>
                          <span className="text-[10px] font-mono text-cyan-400 font-semibold">({n.interval.label})</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Las <strong className="text-fuchsia-300">notas guía</strong> definen la cualidad (mayor, menor, dominante) para improvisar o acompañar.
                    </p>
                  </div>
                );
              })()}

              {/* Tip de Instrumento */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase">
                  <Award className="w-3.5 h-3.5" />
                  <span>Tip para {isBass ? 'Bajistas' : 'Guitarristas'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isBass
                    ? 'En el bajo, tocar 3ra y 7ma en cuerdas agudas aporta textura armónica clara sin saturar el espectro grave.'
                    : 'En guitarra, usa inversiones con la 3ra en el bajo para crear líneas de bajo descendentes o ascendentes fluidas.'}
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
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-bold uppercase">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Modo / Escala</span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-white">
                        {rootNote} {scaleInfo.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {notes.length} notas en el mapa tonal
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-fuchsia-400 text-xs font-mono font-bold uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Notas del Modo</span>
                      </div>
                      <div className="flex flex-wrap gap-1 items-center">
                        {notes.map((n, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200"
                          >
                            {n.note}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold uppercase">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Aplicación</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
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
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="text-xs font-mono text-cyan-400 font-bold uppercase">Progresión</div>
                      <div className="text-base sm:text-lg font-black text-white">{prog.name}</div>
                      <div className="text-xs text-slate-400 font-mono">Género: {prog.genre}</div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="text-xs font-mono text-amber-400 font-bold uppercase">Acorde Activo</div>
                      <div className="text-xl font-black text-cyan-400">{cur.fullChordLabel}</div>
                      <div className="text-xs text-slate-400">
                        {cur.stepName} ({cur.roman})
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="text-xs font-mono text-emerald-400 font-bold uppercase">Movimiento Armónico</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{prog.description}</p>
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
