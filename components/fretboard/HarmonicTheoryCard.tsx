'use client';

import React from 'react';
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
import { Sparkles, Info, BookOpen, Layers, Award, Zap } from 'lucide-react';

interface HarmonicTheoryCardProps {
  studyMode: StudyMode;
  instrument: InstrumentType;
  rootNote: string;
  chordKey: ChordKey;
  scaleKey: ScaleKey;
  selectedProgressionId: string;
  currentProgressionStepIndex: number;
}

export const HarmonicTheoryCard: React.FC<HarmonicTheoryCardProps> = ({
  studyMode,
  instrument,
  rootNote,
  chordKey,
  scaleKey,
  selectedProgressionId,
  currentProgressionStepIndex,
}) => {
  const isBass = instrument.startsWith('bass');

  if (studyMode === 'chords') {
    const chordInfo = CHORDS_CATALOG[chordKey];
    const notes = getChordNoteList(rootNote, chordKey);
    const guideNotes = notes.filter((n) => n.interval.role === 'third' || n.interval.role === 'seventh');

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl">
        {/* Columna 1: Estructura del Acorde */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Estructura Armónica</span>
          </div>
          <div className="text-xl font-black text-white">
            {rootNote} {chordInfo.name}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] text-zinc-400 font-mono">Fórmula:</span>
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
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {lbl}
              </span>
            ))}
          </div>
        </div>

        {/* Columna 2: Notas y Notas Guía */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-mono font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Notas & Guías (3ra y 7ma)</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {notes.map((n, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10"
              >
                <span className="text-sm font-black text-white">{n.note}</span>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold">({n.interval.label})</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
            Las <strong className="text-fuchsia-300">notas guía</strong> definen la cualidad (Mayor/Menor/Dominante). Son la brújula armónica para improvisar o acompañar.
          </p>
        </div>

        {/* Columna 3: Consejo Práctico según Instrumento */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
            <Award className="w-3.5 h-3.5" />
            <span>Tip para {isBass ? 'Bajistas' : 'Guitarristas'}</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {isBass
              ? 'En el bajo, tocar la 3ra y 7ma en cuerdas agudas (shell voicings o décimas) aporta gran riqueza armónica sin embarrar el rango sub-grave.'
              : 'En guitarra, usa las inversiones con la 3ra en el bajo para crear transiciones suaves (Voice Leading) entre acordes adyacentes.'}
          </p>
        </div>
      </div>
    );
  }

  if (studyMode === 'scales') {
    const scaleInfo = SCALES_CATALOG[scaleKey];
    const notes = getScaleNoteList(rootNote, scaleKey);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl">
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Modo / Escala</span>
          </div>
          <div className="text-xl font-black text-white">
            {rootNote} {scaleInfo.name}
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            {notes.length} Notas en el patrón tonal
          </div>
        </div>

        <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-mono font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Notas de la Escala</span>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {notes.map((n, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-xs font-mono font-bold text-zinc-200"
              >
                {n.note}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Explora las <strong className="text-cyan-300">Cajas 1 a 5</strong> para conectar los patrones a lo largo de los 24 trastes sin saltos abruptos.
          </p>
        </div>

        <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>Aplicación en {isBass ? 'Líneas de Bajo' : 'Solos de Guitarra'}</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {isBass
              ? 'Usa las notas de paso de la escala para crear Walking Bass y fills melódicos entre los tiempos fuertes del compás.'
              : 'Enfatiza las notas del acorde subyacente cuando hagas bends o reposos melódicos dentro de las cajas de la escala.'}
          </p>
        </div>
      </div>
    );
  }

  // Modo Progresiones
  const prog =
    PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
  const resolved = resolveProgressionChords(prog, rootNote);
  const currentStep = resolved[currentProgressionStepIndex] || resolved[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl">
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Progresión Activa</span>
        </div>
        <div className="text-lg font-black text-white">{prog.name}</div>
        <div className="text-xs font-mono text-cyan-300">Género: {prog.genre}</div>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Acorde Actual en Playback</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-cyan-400">{currentStep.fullChordLabel}</span>
          <span className="text-xs font-mono text-zinc-400">({currentStep.roman})</span>
        </div>
        <div className="text-xs text-zinc-400">{currentStep.stepName}</div>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
          <Info className="w-3.5 h-3.5" />
          <span>Dinámica Armónica</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">{prog.description}</p>
      </div>
    </div>
  );
};
