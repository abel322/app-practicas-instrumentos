'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  InstrumentType,
  INSTRUMENTS,
  CHROMATIC_NOTES,
  ChordKey,
  ScaleKey,
  SCALES_CATALOG,
  CHORDS_CATALOG,
  getChordVoicings,
  getScaleNoteList,
  getChordNoteList,
  getFretNote,
  getIntervalBetween,
  ChordVoicing,
  PROGRESSIONS_CATALOG,
  resolveProgressionChords,
  SCALE_BOXES,
} from '@/lib/music-theory/fretboard';
import { getFretboardAudioEngine } from '@/lib/music-theory/fretboardAudio';
import { InteractiveFretboard, ActiveFretNote } from '@/components/fretboard/InteractiveFretboard';
import { FretboardToolbar, StudyMode } from '@/components/fretboard/FretboardToolbar';
import { HarmonicTheoryCard } from '@/components/fretboard/HarmonicTheoryCard';
import { Sparkles, Sliders, Music, Zap, Volume2, Compass, Layers } from 'lucide-react';

export default function FretboardPage() {
  // Estado General
  const [studyMode, setStudyMode] = useState<StudyMode>('chords');
  const [instrument, setInstrument] = useState<InstrumentType>('guitar_6');
  const [rootNote, setRootNote] = useState<string>('C');
  const [displayMode, setDisplayMode] = useState<'notes' | 'intervals'>('notes');

  // Estado Modo 1: Acordes
  const [chordKey, setChordKey] = useState<ChordKey>('major');
  const [selectedVoicingIndex, setSelectedVoicingIndex] = useState<number>(0);

  // Estado Modo 2: Escalas
  const [scaleKey, setScaleKey] = useState<ScaleKey>('pentatonic_minor');
  const [scaleViewMode, setScaleViewMode] = useState<'all' | 'boxes'>('all');
  const [selectedBox, setSelectedBox] = useState<number>(1);

  // Estado Modo 3: Progresiones
  const [selectedProgressionId, setSelectedProgressionId] = useState<string>('ii_v_i');
  const [progressionPlaying, setProgressionPlaying] = useState<boolean>(false);
  const [currentProgressionStepIndex, setCurrentProgressionStepIndex] = useState<number>(0);
  const [bpm, setBpm] = useState<number>(85);

  const config = INSTRUMENTS[instrument];

  // Voicings para el acorde actual
  const voicings = useMemo(() => {
    return getChordVoicings(instrument, rootNote, chordKey);
  }, [instrument, rootNote, chordKey]);

  // Si cambia el instrumento o acorde, mantener índice de voicing seguro
  useEffect(() => {
    if (selectedVoicingIndex >= voicings.length) {
      setSelectedVoicingIndex(0);
    }
  }, [voicings, selectedVoicingIndex]);

  const activeVoicing: ChordVoicing | undefined = voicings[selectedVoicingIndex] || voicings[0];

  // Cálculo de las notas activas que se mostrarán sobre el diapasón según el modo
  const activeNotes: ActiveFretNote[] = useMemo(() => {
    // -------------------------------------------------------------
    // MODO 1: ACORDES Y POSICIONES
    // -------------------------------------------------------------
    if (studyMode === 'chords') {
      if (!activeVoicing) return [];
      return activeVoicing.notes.map((vn) => ({
        stringIndex: vn.stringIndex,
        fret: vn.fret,
        note: vn.note,
        interval: vn.interval,
        role: vn.role,
        finger: vn.finger,
        midi: vn.midi,
      }));
    }

    // -------------------------------------------------------------
    // MODO 2: ESCALAS Y MODOS
    // -------------------------------------------------------------
    if (studyMode === 'scales') {
      const scaleNotes = getScaleNoteList(rootNote, scaleKey);
      const noteMap = new Map<string, { interval: string; role: any }>();
      scaleNotes.forEach((sn) => {
        noteMap.set(sn.note, {
          interval: sn.interval.label,
          role: sn.interval.role,
        });
      });

      const notes: ActiveFretNote[] = [];

      // Calcular ventana de trastes si se eligió ver por cajas (Box 1..5)
      let minBoxFret = 0;
      let maxBoxFret = config.totalFrets;

      if (scaleViewMode === 'boxes') {
        const rootIdx = CHROMATIC_NOTES.indexOf(rootNote as any);
        const lowestStringNoteIdx = CHROMATIC_NOTES.indexOf(config.strings[config.strings.length - 1].note as any);
        const anchorFret = (rootIdx - lowestStringNoteIdx + 12) % 12;

        const boxOffsets: Record<number, [number, number]> = {
          1: [anchorFret, anchorFret + 4],
          2: [anchorFret + 2, anchorFret + 6],
          3: [anchorFret + 4, anchorFret + 8],
          4: [anchorFret + 7, anchorFret + 11],
          5: [anchorFret + 9, anchorFret + 13],
        };

        const targetOffset = boxOffsets[selectedBox] || [anchorFret, anchorFret + 4];
        minBoxFret = Math.max(0, targetOffset[0]);
        maxBoxFret = Math.min(config.totalFrets, targetOffset[1]);
      }

      config.strings.forEach((str, sIdx) => {
        for (let fret = 0; fret <= config.totalFrets; fret++) {
          if (scaleViewMode === 'boxes' && (fret < minBoxFret || fret > maxBoxFret)) {
            continue;
          }

          const fn = getFretNote(str.midi, fret);
          const found = noteMap.get(fn.note);
          if (found) {
            notes.push({
              stringIndex: sIdx,
              fret,
              note: fn.note,
              interval: found.interval,
              role: found.role,
              midi: fn.midi,
            });
          }
        }
      });

      return notes;
    }

    // -------------------------------------------------------------
    // MODO 3: PROGRESIONES ARMÓNICAS
    // -------------------------------------------------------------
    if (studyMode === 'progressions') {
      const prog =
        PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
      const resolved = resolveProgressionChords(prog, rootNote);
      const currentStep = resolved[currentProgressionStepIndex] || resolved[0];

      const chordNotes = getChordNoteList(currentStep.rootNote, currentStep.chordKey);
      const chordNoteMap = new Map<string, { interval: string; role: any }>();
      chordNotes.forEach((cn) => {
        chordNoteMap.set(cn.note, {
          interval: cn.interval.label,
          role: cn.interval.role,
        });
      });

      const notes: ActiveFretNote[] = [];

      // Mapear todas las notas del acorde activo a lo largo de los 24 trastes
      config.strings.forEach((str, sIdx) => {
        for (let fret = 0; fret <= config.totalFrets; fret++) {
          const fn = getFretNote(str.midi, fret);
          const found = chordNoteMap.get(fn.note);
          if (found) {
            notes.push({
              stringIndex: sIdx,
              fret,
              note: fn.note,
              interval: found.interval,
              role: found.role,
              midi: fn.midi,
            });
          }
        }
      });

      return notes;
    }

    return [];
  }, [
    studyMode,
    activeVoicing,
    rootNote,
    scaleKey,
    scaleViewMode,
    selectedBox,
    config,
    selectedProgressionId,
    currentProgressionStepIndex,
  ]);

  // Rango de trastes enfocado
  const fretFocusRange: [number, number] | null = useMemo(() => {
    if (studyMode === 'chords' && activeVoicing) {
      return activeVoicing.fretRange;
    }
    if (studyMode === 'scales' && scaleViewMode === 'boxes') {
      const rootIdx = CHROMATIC_NOTES.indexOf(rootNote as any);
      const lowestStringNoteIdx = CHROMATIC_NOTES.indexOf(config.strings[config.strings.length - 1].note as any);
      const anchorFret = (rootIdx - lowestStringNoteIdx + 12) % 12;
      const boxOffsets: Record<number, [number, number]> = {
        1: [anchorFret, anchorFret + 4],
        2: [anchorFret + 2, anchorFret + 6],
        3: [anchorFret + 4, anchorFret + 8],
        4: [anchorFret + 7, anchorFret + 11],
        5: [anchorFret + 9, anchorFret + 13],
      };
      const b = boxOffsets[selectedBox] || [anchorFret, anchorFret + 4];
      return [Math.max(0, b[0]), Math.min(config.totalFrets, b[1])];
    }
    return null;
  }, [studyMode, activeVoicing, scaleViewMode, selectedBox, rootNote, config]);

  // Audio: Rasguear Acorde (de grave a agudo)
  const handleStrumVoicing = useCallback(() => {
    if (!activeVoicing || activeVoicing.notes.length === 0) return;
    // Ordenar de cuerda grave (índice más alto) a más aguda (índice 0)
    const sorted = [...activeVoicing.notes].sort((a, b) => b.stringIndex - a.stringIndex);
    const midis = sorted.map((n) => n.midi);
    getFretboardAudioEngine().playChord(midis, 'strum');
  }, [activeVoicing]);

  // Audio: Arpegiar Acorde
  const handleArpeggiateVoicing = useCallback(() => {
    if (!activeVoicing || activeVoicing.notes.length === 0) return;
    const sorted = [...activeVoicing.notes].sort((a, b) => b.stringIndex - a.stringIndex);
    const midis = sorted.map((n) => n.midi);
    getFretboardAudioEngine().playChord(midis, 'arpeggio');
  }, [activeVoicing]);

  // Modo Progresiones: Secuenciador con reproducción continua
  const progTimerRef = useRef<NodeJS.Timeout | null>(null);

  const advanceProgressionStep = useCallback(() => {
    const prog =
      PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];

    setCurrentProgressionStepIndex((prev) => {
      const nextIdx = (prev + 1) % prog.steps.length;

      // Disparar acorde de la progresión al cambiar de compás
      const resolved = resolveProgressionChords(prog, rootNote);
      const stepChord = resolved[nextIdx];
      if (stepChord) {
        const chordNotes = getChordNoteList(stepChord.rootNote, stepChord.chordKey);
        const rootMidi = 40 + CHROMATIC_NOTES.indexOf(stepChord.rootNote);
        const midis = chordNotes.map((cn, i) => rootMidi + cn.interval.semitones);
        getFretboardAudioEngine().playChord(midis, 'strum', 0.05);
      }

      return nextIdx;
    });
  }, [selectedProgressionId, rootNote]);

  const prevProgressionStep = useCallback(() => {
    const prog =
      PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
    setCurrentProgressionStepIndex((prev) => (prev - 1 + prog.steps.length) % prog.steps.length);
  }, [selectedProgressionId]);

  useEffect(() => {
    if (progressionPlaying && studyMode === 'progressions') {
      // Duración de un compás en milisegundos: 4 tiempos a BPM dado
      const barDurationMs = (60 / bpm) * 4 * 1000;
      progTimerRef.current = setInterval(() => {
        advanceProgressionStep();
      }, barDurationMs);
    } else {
      if (progTimerRef.current) {
        clearInterval(progTimerRef.current);
        progTimerRef.current = null;
      }
    }
    return () => {
      if (progTimerRef.current) {
        clearInterval(progTimerRef.current);
      }
    };
  }, [progressionPlaying, studyMode, bpm, advanceProgressionStep]);

  // Si cambia la progresión seleccionada, reiniciar al paso 0
  useEffect(() => {
    setCurrentProgressionStepIndex(0);
  }, [selectedProgressionId, rootNote]);

  // Presets Rápidos de Prueba para el Músico
  const applyPreset = (preset: {
    instrument: InstrumentType;
    mode: StudyMode;
    root: string;
    chord?: ChordKey;
    scale?: ScaleKey;
    progression?: string;
  }) => {
    setInstrument(preset.instrument);
    setStudyMode(preset.mode);
    setRootNote(preset.root);
    if (preset.chord) setChordKey(preset.chord);
    if (preset.scale) setScaleKey(preset.scale);
    if (preset.progression) setSelectedProgressionId(preset.progression);
  };

  return (
    <main className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6 pt-6">
      {/* 1. Encabezado Premium de SoundLab */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-950/80 to-zinc-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              SOUNDLAB LAB • FRETBOARD & HARMONY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              24 TRASTES COMPLETOS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
              AUDIO SINTETIZADO WEB AUDIO
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>🎸 Diapasón & Armonía</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Visualizador interactivo de acordes con múltiples digitaciones, inversiones, escalas y modos griegos, y progresiones armónicas en tiempo real para{' '}
            <strong className="text-white">Guitarra (6C)</strong>,{' '}
            <strong className="text-cyan-300">Bajo (4C)</strong> y{' '}
            <strong className="text-fuchsia-300">Bajo (5C) con Low B (B0)</strong>.
          </p>
        </div>

        {/* Atajos Rápidos / Presets de Demostración */}
        <div className="flex flex-col gap-1.5 relative z-10 w-full lg:w-auto">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Presets Rápidos:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() =>
                applyPreset({
                  instrument: 'bass_5',
                  mode: 'chords',
                  root: 'D',
                  chord: 'm7',
                })
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 transition-colors"
            >
              ⚡ D m7 (Bajo 5C)
            </button>
            <button
              onClick={() =>
                applyPreset({
                  instrument: 'guitar_6',
                  mode: 'scales',
                  root: 'A',
                  scale: 'dorian',
                })
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-fuchsia-300 transition-colors"
            >
              🎸 A Dórica (Guitarra)
            </button>
            <button
              onClick={() =>
                applyPreset({
                  instrument: 'bass_4',
                  mode: 'progressions',
                  root: 'C',
                  progression: 'ii_v_i',
                })
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 transition-colors"
            >
              🎶 II - V - I (Bajo 4C)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Selectores de Estudio */}
      <FretboardToolbar
        studyMode={studyMode}
        onStudyModeChange={setStudyMode}
        instrument={instrument}
        onInstrumentChange={setInstrument}
        rootNote={rootNote}
        onRootNoteChange={setRootNote}
        chordKey={chordKey}
        onChordKeyChange={setChordKey}
        voicings={voicings}
        selectedVoicingIndex={selectedVoicingIndex}
        onSelectVoicingIndex={setSelectedVoicingIndex}
        onStrumVoicing={handleStrumVoicing}
        onArpeggiateVoicing={handleArpeggiateVoicing}
        scaleKey={scaleKey}
        onScaleKeyChange={setScaleKey}
        scaleViewMode={scaleViewMode}
        onScaleViewModeChange={setScaleViewMode}
        selectedBox={selectedBox}
        onSelectBox={setSelectedBox}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        selectedProgressionId={selectedProgressionId}
        onProgressionIdChange={setSelectedProgressionId}
        progressionPlaying={progressionPlaying}
        onToggleProgressionPlay={() => setProgressionPlaying((prev) => !prev)}
        onNextProgressionStep={advanceProgressionStep}
        onPrevProgressionStep={prevProgressionStep}
        currentProgressionStepIndex={currentProgressionStepIndex}
        bpm={bpm}
        onBpmChange={setBpm}
      />

      {/* 3. Mástil Interactivo de 24 Trastes con Web Audio */}
      <InteractiveFretboard
        instrument={instrument}
        activeNotes={activeNotes}
        displayMode={displayMode}
        fretFocusRange={fretFocusRange}
        title={
          studyMode === 'chords'
            ? `${rootNote} ${CHORDS_CATALOG[chordKey].name} — ${activeVoicing?.name || 'Posición'}`
            : studyMode === 'scales'
            ? `${rootNote} ${SCALES_CATALOG[scaleKey].name} ${
                scaleViewMode === 'boxes' ? `(Caja ${selectedBox})` : '(Todo el Mástil 0–24)'
              }`
            : `Progresión Armónica: ${rootNote} ${
                PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId)?.name || ''
              }`
        }
      />

      {/* 4. Tarjeta Didáctica de Armonía & Guía de Intervalos */}
      <HarmonicTheoryCard
        studyMode={studyMode}
        instrument={instrument}
        rootNote={rootNote}
        chordKey={chordKey}
        scaleKey={scaleKey}
        selectedProgressionId={selectedProgressionId}
        currentProgressionStepIndex={currentProgressionStepIndex}
      />
    </main>
  );
}
