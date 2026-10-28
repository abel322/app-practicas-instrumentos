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
  ChordVoicing,
  PROGRESSIONS_CATALOG,
  resolveProgressionChords,
} from '@/lib/music-theory/fretboard';
import { getFretboardAudioEngine } from '@/lib/music-theory/fretboardAudio';
import { InteractiveFretboard, ActiveFretNote } from '@/components/fretboard/InteractiveFretboard';
import { FretboardToolbar, StudyMode } from '@/components/fretboard/FretboardToolbar';
import { ChordTheoryAccordion } from '@/components/fretboard/ChordTheoryAccordion';

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

      const resolved = resolveProgressionChords(prog, rootNote);
      const stepChord = resolved[nextIdx];
      if (stepChord) {
        const chordNotes = getChordNoteList(stepChord.rootNote, stepChord.chordKey);
        const rootMidi = 40 + CHROMATIC_NOTES.indexOf(stepChord.rootNote);
        const midis = chordNotes.map((cn) => rootMidi + cn.interval.semitones);
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

  useEffect(() => {
    setCurrentProgressionStepIndex(0);
  }, [selectedProgressionId, rootNote]);

  // Presets Rápidos
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
    // 1. Contenedor Raíz Blindado contra Desbordamiento Horizontal
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 flex flex-col gap-2 min-w-0 flex-1">
        {/* 2. Cabecera Ultra-Compacta (Mobile-First) */}
        <div className="flex flex-col gap-1.5 p-2.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-xl w-full min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>🎸 Diapasón & Armonía</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shrink-0 font-bold">
                24 Trastes
              </span>
            </div>

            {/* Presets Rápidos en Chips Horizontales */}
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() =>
                  applyPreset({
                    instrument: 'bass_5',
                    mode: 'chords',
                    root: 'D',
                    chord: 'm7',
                  })
                }
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 transition-colors shrink-0"
                title="Bajo 5C D m7"
              >
                ⚡ D m7 (B5)
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
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-fuchsia-700 dark:text-fuchsia-300 border border-slate-300 dark:border-slate-700 transition-colors shrink-0"
                title="Guitarra A Dórica"
              >
                🎸 A Dórica
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
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 transition-colors shrink-0 hidden xs:inline-block"
                title="Bajo 4C II-V-I"
              >
                🎶 II-V-I
              </button>
            </div>
          </div>

          <p className="hidden sm:block text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Laboratorio interactivo de acordes, escalas modales e inversiones armónicas para{' '}
            <strong className="text-slate-900 dark:text-white">Guitarra (6C)</strong>,{' '}
            <strong className="text-cyan-600 dark:text-cyan-400">Bajo (4C)</strong> y{' '}
            <strong className="text-fuchsia-600 dark:text-fuchsia-400">Bajo (5C con Low B)</strong>.
          </p>
        </div>

        {/* 3. Barra de Herramientas Compacta (Controles Arriba) */}
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

        {/* 4. El Diapasón como Protagonista Central (Visible Inmediatamente) */}
        <InteractiveFretboard
          instrument={instrument}
          activeNotes={activeNotes}
          displayMode={displayMode}
          fretFocusRange={fretFocusRange}
          title={
            studyMode === 'chords'
              ? `${rootNote} ${CHORDS_CATALOG[chordKey]?.name || ''}`
              : studyMode === 'scales'
              ? `${rootNote} ${SCALES_CATALOG[scaleKey]?.name || ''}`
              : `${rootNote} ${PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId)?.name || ''}`
          }
        />

        {/* 5. Información Teórica en Acordeón Colapsable Abajo */}
        <ChordTheoryAccordion
          studyMode={studyMode}
          instrument={instrument}
          rootNote={rootNote}
          chordKey={chordKey}
          scaleKey={scaleKey}
          selectedProgressionId={selectedProgressionId}
          currentProgressionStepIndex={currentProgressionStepIndex}
        />
      </main>
    </div>
  );
}
