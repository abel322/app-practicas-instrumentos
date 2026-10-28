// Motor de Teoría Musical y Afinaciones para SoundLab Fretboard Lab

export type InstrumentType = 'guitar_6' | 'bass_4' | 'bass_5';

export interface InstrumentConfig {
  name: string;
  strings: { note: string; midi: number; octave: number }[];
  totalFrets: number;
}

export const INSTRUMENTS: Record<InstrumentType, InstrumentConfig> = {
  guitar_6: {
    name: 'Guitarra (6 Cuerdas)',
    totalFrets: 24,
    strings: [
      { note: 'E', midi: 64, octave: 4 }, // 1ra cuerda aguda
      { note: 'B', midi: 59, octave: 3 },
      { note: 'G', midi: 55, octave: 3 },
      { note: 'D', midi: 50, octave: 3 },
      { note: 'A', midi: 45, octave: 2 },
      { note: 'E', midi: 40, octave: 2 }, // 6ta cuerda grave
    ],
  },
  bass_4: {
    name: 'Bajo (4 Cuerdas)',
    totalFrets: 24,
    strings: [
      { note: 'G', midi: 43, octave: 2 }, // 1ra cuerda aguda
      { note: 'D', midi: 38, octave: 2 },
      { note: 'A', midi: 33, octave: 1 },
      { note: 'E', midi: 28, octave: 1 }, // 4ta cuerda grave
    ],
  },
  bass_5: {
    name: 'Bajo (5 Cuerdas)',
    totalFrets: 24,
    strings: [
      { note: 'G', midi: 43, octave: 2 }, // 1ra cuerda aguda
      { note: 'D', midi: 38, octave: 2 },
      { note: 'A', midi: 33, octave: 1 },
      { note: 'E', midi: 28, octave: 1 },
      { note: 'B', midi: 23, octave: 0 }, // 5ta cuerda grave (Low B)
    ],
  },
};

export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type ChromaticNote = typeof CHROMATIC_NOTES[number];

// Equivalencias de bemoles a sostenidos para selectores amigables
export const ENHARMONIC_MAP: Record<string, ChromaticNote> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

export const DISPLAY_ROOTS = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C# / Db' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D# / Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F# / Gb' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G# / Ab' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A# / Bb' },
  { value: 'B', label: 'B' },
];

export const SCALES_CATALOG = {
  major: { name: 'Mayor (Jónica)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian: { name: 'Dórica', intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { name: 'Frigia', intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { name: 'Lidia', intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { name: 'Mixolidia', intervals: [0, 2, 4, 5, 7, 9, 10] },
  minor_natural: { name: 'Menor Natural (Eólica)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  locrian: { name: 'Locria', intervals: [0, 1, 3, 5, 6, 8, 10] },
  pentatonic_minor: { name: 'Pentatónica Menor', intervals: [0, 3, 5, 7, 10] },
  pentatonic_major: { name: 'Pentatónica Mayor', intervals: [0, 2, 4, 7, 9] },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  harmonic_minor: { name: 'Menor Armónica', intervals: [0, 2, 3, 5, 7, 8, 11] },
  melodic_minor: { name: 'Menor Melódica', intervals: [0, 2, 3, 5, 7, 9, 11] },
};

export type ScaleKey = keyof typeof SCALES_CATALOG;

export const CHORDS_CATALOG = {
  major: { name: 'Mayor', formula: [0, 4, 7], labels: ['R', '3', '5'] },
  minor: { name: 'Menor', formula: [0, 3, 7], labels: ['R', 'b3', '5'] },
  dom7: { name: 'Dominante 7', formula: [0, 4, 7, 10], labels: ['R', '3', '5', 'b7'] },
  maj7: { name: 'Maj7', formula: [0, 4, 7, 11], labels: ['R', '3', '5', '7'] },
  m7: { name: 'Menor 7 (m7)', formula: [0, 3, 7, 10], labels: ['R', 'b3', '5', 'b7'] },
  m7b5: { name: 'Semidisminuido (m7b5)', formula: [0, 3, 6, 10], labels: ['R', 'b3', 'b5', 'b7'] },
  dim7: { name: 'Disminuido 7', formula: [0, 3, 6, 9], labels: ['R', 'b3', 'b5', 'bb7'] },
  sus4: { name: 'Suspendido 4 (sus4)', formula: [0, 5, 7], labels: ['R', '4', '5'] },
  add9: { name: 'Add9', formula: [0, 4, 7, 14], labels: ['R', '3', '5', '9'] },
};

export type ChordKey = keyof typeof CHORDS_CATALOG;

export type NoteRole = 'root' | 'third' | 'seventh' | 'fifth' | 'other';

export interface IntervalInfo {
  semitones: number;
  label: string;
  role: NoteRole;
  fullName: string;
}

export const INTERVAL_MAP: Record<number, { label: string; role: NoteRole; fullName: string }> = {
  0: { label: 'R', role: 'root', fullName: 'Tónica (Fundamental)' },
  1: { label: 'b2', role: 'other', fullName: 'Segunda Menor' },
  2: { label: '2', role: 'other', fullName: 'Segunda Mayor (9na)' },
  3: { label: 'b3', role: 'third', fullName: 'Tercera Menor (Guía)' },
  4: { label: '3', role: 'third', fullName: 'Tercera Mayor (Guía)' },
  5: { label: '4', role: 'other', fullName: 'Cuarta Justa (11na)' },
  6: { label: 'b5', role: 'fifth', fullName: 'Quinta Disminuida / #4' },
  7: { label: '5', role: 'fifth', fullName: 'Quinta Justa' },
  8: { label: 'b6', role: 'other', fullName: 'Sexta Menor / #5' },
  9: { label: '6', role: 'other', fullName: 'Sexta Mayor (13na)' },
  10: { label: 'b7', role: 'seventh', fullName: 'Séptima Menor (Guía)' },
  11: { label: '7', role: 'seventh', fullName: 'Séptima Mayor (Guía)' },
  12: { label: 'R', role: 'root', fullName: 'Octava' },
  14: { label: '9', role: 'other', fullName: 'Novena Mayor' },
};

// Conversión de MIDI a frecuencia en Hertz
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Obtener nota y octava dado un número MIDI
export function midiToNote(midi: number): { note: ChromaticNote; octave: number; midi: number } {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return {
    note: CHROMATIC_NOTES[noteIndex],
    octave,
    midi,
  };
}

// Obtener la nota en un traste dado para una cuerda
export function getFretNote(stringMidi: number, fret: number): { note: ChromaticNote; octave: number; midi: number } {
  return midiToNote(stringMidi + fret);
}

// Calcular intervalo relativo a una tónica
export function getIntervalBetween(rootNote: string, targetNote: string): IntervalInfo {
  const rootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  const targetIdx = CHROMATIC_NOTES.indexOf(targetNote as ChromaticNote);
  const semitones = ((targetIdx - rootIdx) % 12 + 12) % 12;
  const base = INTERVAL_MAP[semitones] || { label: `${semitones}`, role: 'other' as NoteRole, fullName: `Intervalo ${semitones}` };
  return {
    semitones,
    label: base.label,
    role: base.role,
    fullName: base.fullName,
  };
}

// Notas pertenecientes a una escala
export function getScaleNoteList(rootNote: string, scaleKey: ScaleKey): { note: ChromaticNote; interval: IntervalInfo }[] {
  const scale = SCALES_CATALOG[scaleKey];
  const rootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  if (rootIdx === -1) return [];

  return scale.intervals.map((interval) => {
    const semitones = interval % 12;
    const noteIdx = (rootIdx + semitones) % 12;
    const note = CHROMATIC_NOTES[noteIdx];
    const info = INTERVAL_MAP[semitones] || { label: `${semitones}`, role: 'other', fullName: `Intervalo ${semitones}` };
    return {
      note,
      interval: {
        semitones,
        label: info.label,
        role: info.role,
        fullName: info.fullName,
      },
    };
  });
}

// Notas pertenecientes a un acorde
export function getChordNoteList(rootNote: string, chordKey: ChordKey): { note: ChromaticNote; interval: IntervalInfo }[] {
  const chord = CHORDS_CATALOG[chordKey];
  const rootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  if (rootIdx === -1) return [];

  return chord.formula.map((interval, idx) => {
    const semitones = interval % 12;
    const noteIdx = (rootIdx + semitones) % 12;
    const note = CHROMATIC_NOTES[noteIdx];
    const customLabel = chord.labels[idx] || INTERVAL_MAP[semitones]?.label || `${semitones}`;
    const role: NoteRole =
      customLabel === 'R'
        ? 'root'
        : customLabel.includes('3')
        ? 'third'
        : customLabel.includes('7')
        ? 'seventh'
        : customLabel.includes('5')
        ? 'fifth'
        : 'other';

    return {
      note,
      interval: {
        semitones,
        label: customLabel,
        role,
        fullName: INTERVAL_MAP[semitones]?.fullName || `Intervalo ${customLabel}`,
      },
    };
  });
}

// Definición de Voicings / Digitaciones para Acordes
export interface VoicingNote {
  stringIndex: number; // 0 = más aguda (arriba en mástil), N-1 = más grave
  fret: number;        // 0 = al aire, 1...24
  finger?: '1' | '2' | '3' | '4' | 'T';
  note: ChromaticNote;
  interval: string;
  role: NoteRole;
  midi: number;
}

export interface ChordVoicing {
  id: string;
  name: string;
  description: string;
  fretRange: [number, number]; // Trastes que abarca la posición [min, max]
  notes: VoicingNote[];
  barre?: { fret: number; fromString: number; toString: number };
}

// Cajas de Escalas / Patrones (CAGED & 3NPS)
export interface ScaleBoxPattern {
  id: number;
  name: string;
  description: string;
  // Offset relativo a la tónica en la cuerda más grave
  fretWindowOffset: [number, number]; // [minOffset, maxOffset]
}

export const SCALE_BOXES: ScaleBoxPattern[] = [
  { id: 1, name: 'Caja 1 (Posición Fundamental)', description: 'Patrón anclado a la tónica con dedo 1 o 2', fretWindowOffset: [0, 4] },
  { id: 2, name: 'Caja 2 (Extensión Superior)', description: 'Conexión a través de la 3ra y 4ta de la escala', fretWindowOffset: [2, 6] },
  { id: 3, name: 'Caja 3 (Posición Media)', description: 'Patrón centrado en la 5ta justa y 6ta grado', fretWindowOffset: [4, 8] },
  { id: 4, name: 'Caja 4 (Extensión Aguda)', description: 'Abarca la 7ma y octava superior del registro', fretWindowOffset: [7, 11] },
  { id: 5, name: 'Caja 5 (Retorno a la Octava)', description: 'Patrón que conecta de nuevo con la tónica superior', fretWindowOffset: [9, 13] },
];

// Generador inteligente de Voicings para Acordes según instrumento y tónica
export function getChordVoicings(
  instrument: InstrumentType,
  rootNote: string,
  chordKey: ChordKey
): ChordVoicing[] {
  const rootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  if (rootIdx === -1) return [];

  const config = INSTRUMENTS[instrument];
  const chordNotes = getChordNoteList(rootNote, chordKey);
  const noteSet = new Set(chordNotes.map((n) => n.note));

  const voicings: ChordVoicing[] = [];

  if (instrument === 'guitar_6') {
    // 1. Posición E-Shape (Fundamental en 6ta cuerda)
    // Cuerda 5 (E2, midi 40): traste donde está rootNote
    const rootFret6 = (rootIdx - CHROMATIC_NOTES.indexOf('E') + 12) % 12;
    const pos1Fret = rootFret6;
    const v1Notes: VoicingNote[] = [];

    if (chordKey === 'major') {
      const offsets = [
        { s: 5, f: 0, finger: '1', int: 'R' },
        { s: 4, f: 2, finger: '3', int: '5' },
        { s: 3, f: 2, finger: '4', int: 'R' },
        { s: 2, f: 1, finger: '2', int: '3' },
        { s: 1, f: 0, finger: '1', int: '5' },
        { s: 0, f: 0, finger: '1', int: 'R' },
      ];
      offsets.forEach((o) => {
        const fret = pos1Fret + o.f;
        if (fret <= config.totalFrets) {
          const fn = getFretNote(config.strings[o.s].midi, fret);
          v1Notes.push({
            stringIndex: o.s,
            fret,
            finger: (pos1Fret === 0 && o.f === 0) ? undefined : (o.finger as any),
            note: fn.note,
            interval: o.int,
            role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : 'fifth',
            midi: fn.midi,
          });
        }
      });
      voicings.push({
        id: 'g6_pos_e_shape',
        name: `Posición 1 (Forma E — Fret ${pos1Fret || 'Abierta'})`,
        description: `Fundamental ${rootNote} en la 6ta cuerda grave. Sonoridad completa y masiva.`,
        fretRange: [Math.max(0, pos1Fret - 1), Math.min(24, pos1Fret + 3)],
        notes: v1Notes,
        barre: pos1Fret > 0 ? { fret: pos1Fret, fromString: 0, toString: 5 } : undefined,
      });
    } else if (chordKey === 'minor' || chordKey === 'm7') {
      const isM7 = chordKey === 'm7';
      const offsets = [
        { s: 5, f: 0, finger: '1', int: 'R' },
        { s: 4, f: 2, finger: '3', int: '5' },
        { s: 3, f: isM7 ? 0 : 2, finger: isM7 ? '1' : '4', int: isM7 ? 'b7' : 'R' },
        { s: 2, f: 0, finger: '1', int: 'b3' },
        { s: 1, f: 0, finger: '1', int: '5' },
        { s: 0, f: 0, finger: '1', int: 'R' },
      ];
      offsets.forEach((o) => {
        const fret = pos1Fret + o.f;
        if (fret <= config.totalFrets) {
          const fn = getFretNote(config.strings[o.s].midi, fret);
          v1Notes.push({
            stringIndex: o.s,
            fret,
            finger: (pos1Fret === 0 && o.f === 0) ? undefined : (o.finger as any),
            note: fn.note,
            interval: o.int,
            role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : o.int.includes('7') ? 'seventh' : 'fifth',
            midi: fn.midi,
          });
        }
      });
      voicings.push({
        id: 'g6_pos_em_shape',
        name: `Posición 1 (${isM7 ? 'Forma Em7' : 'Forma Em'} — Fret ${pos1Fret || 'Abierta'})`,
        description: `Fundamental ${rootNote} en 6ta cuerda. Resonancia oscura y balanceada.`,
        fretRange: [Math.max(0, pos1Fret - 1), Math.min(24, pos1Fret + 3)],
        notes: v1Notes,
        barre: pos1Fret > 0 ? { fret: pos1Fret, fromString: 0, toString: 5 } : undefined,
      });
    } else if (chordKey === 'dom7' || chordKey === 'maj7') {
      const isMaj = chordKey === 'maj7';
      const offsets = [
        { s: 5, f: 0, finger: '1', int: 'R' },
        { s: 4, f: 2, finger: '3', int: '5' },
        { s: 3, f: 0, finger: '1', int: isMaj ? '7' : 'b7' },
        { s: 2, f: 1, finger: '2', int: '3' },
        { s: 1, f: 0, finger: '1', int: '5' },
        { s: 0, f: 0, finger: '1', int: 'R' },
      ];
      offsets.forEach((o) => {
        const fret = pos1Fret + o.f;
        if (fret <= config.totalFrets) {
          const fn = getFretNote(config.strings[o.s].midi, fret);
          v1Notes.push({
            stringIndex: o.s,
            fret,
            finger: (pos1Fret === 0 && o.f === 0) ? undefined : (o.finger as any),
            note: fn.note,
            interval: o.int,
            role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : 'seventh',
            midi: fn.midi,
          });
        }
      });
      voicings.push({
        id: 'g6_pos_7_shape',
        name: `Posición 1 (Forma E${isMaj ? 'maj7' : '7'} — Fret ${pos1Fret || 'Abierta'})`,
        description: `Tensión armónica con nota guía en 3ra cuerda.`,
        fretRange: [Math.max(0, pos1Fret - 1), Math.min(24, pos1Fret + 3)],
        notes: v1Notes,
      });
    } else {
      // Genérico tríada en 6ta cuerda
      const offsets = [
        { s: 5, f: 0, finger: '1', int: 'R' },
        { s: 4, f: 2, finger: '3', int: '5' },
        { s: 3, f: 2, finger: '4', int: 'R' },
        { s: 2, f: 1, finger: '2', int: '3' },
      ];
      offsets.forEach((o) => {
        const fret = pos1Fret + o.f;
        if (fret <= config.totalFrets) {
          const fn = getFretNote(config.strings[o.s].midi, fret);
          v1Notes.push({
            stringIndex: o.s,
            fret,
            finger: o.finger as any,
            note: fn.note,
            interval: o.int,
            role: o.int === 'R' ? 'root' : 'other',
            midi: fn.midi,
          });
        }
      });
      voicings.push({
        id: 'g6_pos_generic_6',
        name: `Posición 1 (Fundamental en 6ta — Fret ${pos1Fret})`,
        description: `Forma cerrada sobre registro grave.`,
        fretRange: [Math.max(0, pos1Fret - 1), Math.min(24, pos1Fret + 3)],
        notes: v1Notes,
      });
    }

    // 2. Posición A-Shape (Fundamental en 5ta cuerda)
    const rootFret5 = (rootIdx - CHROMATIC_NOTES.indexOf('A') + 12) % 12;
    const pos2Fret = rootFret5;
    const v2Notes: VoicingNote[] = [];

    if (chordKey === 'major' || chordKey === 'add9') {
      const offsets = [
        { s: 4, f: 0, finger: '1', int: 'R' },
        { s: 3, f: 2, finger: '2', int: '5' },
        { s: 2, f: 2, finger: '3', int: 'R' },
        { s: 1, f: chordKey === 'add9' ? 0 : 2, finger: chordKey === 'add9' ? '1' : '4', int: chordKey === 'add9' ? '9' : '3' },
        { s: 0, f: 0, finger: '1', int: '5' },
      ];
      offsets.forEach((o) => {
        const fret = pos2Fret + o.f;
        if (fret <= config.totalFrets) {
          const fn = getFretNote(config.strings[o.s].midi, fret);
          v2Notes.push({
            stringIndex: o.s,
            fret,
            finger: (pos2Fret === 0 && o.f === 0) ? undefined : (o.finger as any),
            note: fn.note,
            interval: o.int,
            role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : 'fifth',
            midi: fn.midi,
          });
        }
      });
      voicings.push({
        id: 'g6_pos_a_shape',
        name: `Posición 2 (Forma A — Fret ${pos2Fret || 'Abierta'})`,
        description: `Fundamental ${rootNote} en la 5ta cuerda. Timbre brillante y compacto.`,
        fretRange: [Math.max(0, pos2Fret - 1), Math.min(24, pos2Fret + 4)],
        notes: v2Notes,
        barre: pos2Fret > 0 ? { fret: pos2Fret, fromString: 0, toString: 4 } : undefined,
      });
    } else if (chordKey === 'minor' || chordKey === 'm7' || chordKey === 'm7b5') {
      const isM7 = chordKey === 'm7';
      const isM7b5 = chordKey === 'm7b5';
      const offsets = [
        { s: 4, f: 0, finger: '1', int: 'R' },
        { s: 3, f: isM7b5 ? 1 : 2, finger: '3', int: isM7b5 ? 'b5' : '5' },
        { s: 2, f: 0, finger: '1', int: isM7 || isM7b5 ? 'b7' : 'R' },
        { s: 1, f: 1, finger: '2', int: 'b3' },
        { s: 0, f: 0, finger: '1', int: isM7b5 ? 'b5' : '5' },
      ];
      offsets.forEach((o) => {
        const fret = pos2Fret + o.f;
        if (fret <= config.totalFrets) {
          const fn = getFretNote(config.strings[o.s].midi, fret);
          v2Notes.push({
            stringIndex: o.s,
            fret,
            finger: (pos2Fret === 0 && o.f === 0) ? undefined : (o.finger as any),
            note: fn.note,
            interval: o.int,
            role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : o.int.includes('7') ? 'seventh' : 'fifth',
            midi: fn.midi,
          });
        }
      });
      voicings.push({
        id: 'g6_pos_am_shape',
        name: `Posición 2 (Forma Am — Fret ${pos2Fret || 'Abierta'})`,
        description: `Fundamental en 5ta cuerda con terceras y séptimas de fácil acceso.`,
        fretRange: [Math.max(0, pos2Fret - 1), Math.min(24, pos2Fret + 4)],
        notes: v2Notes,
        barre: pos2Fret > 0 ? { fret: pos2Fret, fromString: 0, toString: 4 } : undefined,
      });
    } else if (chordKey === 'maj7') {
      const offsets = [
        { s: 4, f: 0, finger: '1', int: 'R' },
        { s: 3, f: 2, finger: '3', int: '5' },
        { s: 2, f: 1, finger: '2', int: '7' },
        { s: 1, f: 2, finger: '4', int: '3' },
      ];
      offsets.forEach((o) => {
        const fret = pos2Fret + o.f;
        if (fret <= config.totalFrets) {
          const fn = getFretNote(config.strings[o.s].midi, fret);
          v2Notes.push({
            stringIndex: o.s,
            fret,
            finger: o.finger as any,
            note: fn.note,
            interval: o.int,
            role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : 'seventh',
            midi: fn.midi,
          });
        }
      });
      voicings.push({
        id: 'g6_pos_maj7_drop2',
        name: `Posición 2 (Drop 2 Maj7 — Fret ${pos2Fret})`,
        description: `Clásico voicing moderno de Jazz / Neo-Soul con 7ma en el medio.`,
        fretRange: [Math.max(0, pos2Fret - 1), Math.min(24, pos2Fret + 4)],
        notes: v2Notes,
      });
    }

    // 3. Inversión 1 (1ra Inversión — 3ra en el bajo)
    // Encontrar dónde cae la 3ra (mayor o menor) en 5ta o 6ta cuerda
    const thirdInterval = chordKey.includes('minor') || chordKey === 'm7' || chordKey === 'm7b5' || chordKey === 'dim7' ? 3 : 4;
    const thirdIdx = (rootIdx + thirdInterval) % 12;
    const thirdFret5 = (thirdIdx - CHROMATIC_NOTES.indexOf('A') + 12) % 12;
    const inv1Notes: VoicingNote[] = [];

    const offsetsInv1 = [
      { s: 4, f: 0, finger: '1', int: thirdInterval === 3 ? 'b3' : '3' },
      { s: 3, f: 2, finger: '2', int: 'R' },
      { s: 2, f: 2, finger: '3', int: '5' },
      { s: 1, f: 3, finger: '4', int: thirdInterval === 3 ? 'b3' : '3' },
    ];
    offsetsInv1.forEach((o) => {
      const fret = thirdFret5 + o.f;
      if (fret <= config.totalFrets) {
        const fn = getFretNote(config.strings[o.s].midi, fret);
        inv1Notes.push({
          stringIndex: o.s,
          fret,
          finger: o.finger as any,
          note: fn.note,
          interval: o.int,
          role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : 'fifth',
          midi: fn.midi,
        });
      }
    });
    voicings.push({
      id: 'g6_inv_1',
      name: `Inversión 1 (Bajo en ${CHROMATIC_NOTES[thirdIdx]} / 3ra)`,
      description: `Línea de bajo ascendente ideal para transiciones y baladas.`,
      fretRange: [Math.max(0, thirdFret5 - 1), Math.min(24, thirdFret5 + 4)],
      notes: inv1Notes,
    });

    // 4. Inversión 2 (2da Inversión — 5ta en el bajo)
    const fifthInterval = chordKey === 'm7b5' || chordKey === 'dim7' ? 6 : 7;
    const fifthIdx = (rootIdx + fifthInterval) % 12;
    const fifthFret6 = (fifthIdx - CHROMATIC_NOTES.indexOf('E') + 12) % 12;
    const inv2Notes: VoicingNote[] = [];

    const offsetsInv2 = [
      { s: 5, f: 0, finger: '1', int: '5' },
      { s: 4, f: 2, finger: '3', int: 'R' },
      { s: 3, f: 2, finger: '4', int: thirdInterval === 3 ? 'b3' : '3' },
      { s: 2, f: 1, finger: '2', int: '5' },
    ];
    offsetsInv2.forEach((o) => {
      const fret = fifthFret6 + o.f;
      if (fret <= config.totalFrets) {
        const fn = getFretNote(config.strings[o.s].midi, fret);
        inv2Notes.push({
          stringIndex: o.s,
          fret,
          finger: o.finger as any,
          note: fn.note,
          interval: o.int,
          role: o.int === 'R' ? 'root' : o.int.includes('3') ? 'third' : 'fifth',
          midi: fn.midi,
        });
      }
    });
    voicings.push({
      id: 'g6_inv_2',
      name: `Inversión 2 (Bajo en ${CHROMATIC_NOTES[fifthIdx]} / 5ta)`,
      description: `Resolución cadencial clásica con 5ta en la base.`,
      fretRange: [Math.max(0, fifthFret6 - 1), Math.min(24, fifthFret6 + 4)],
      notes: inv2Notes,
    });
  } else if (instrument === 'bass_4') {
    // BAJO DE 4 CUERDAS:
    // Cuerdas: 0 = G2, 1 = D2, 2 = A1, 3 = E1
    const rootFretE = (rootIdx - CHROMATIC_NOTES.indexOf('E') + 12) % 12;
    const rootFretA = (rootIdx - CHROMATIC_NOTES.indexOf('A') + 12) % 12;
    const thirdInt = chordKey.includes('minor') || chordKey === 'm7' || chordKey === 'm7b5' || chordKey === 'dim7' ? 3 : 4;
    const seventhInt = chordKey === 'maj7' ? 11 : chordKey === 'dim7' ? 9 : 10;
    const hasSeventh = chordKey.includes('7');

    // 1. Posición 1: Tríada / Power Grip fundamental en 4ta cuerda (E)
    const p1Notes: VoicingNote[] = [];
    p1Notes.push({
      stringIndex: 3, // E
      fret: rootFretE,
      finger: '1',
      note: rootNote as ChromaticNote,
      interval: 'R',
      role: 'root',
      midi: config.strings[3].midi + rootFretE,
    });
    p1Notes.push({
      stringIndex: 2, // A
      fret: rootFretE + (thirdInt === 3 ? 1 : 2),
      finger: thirdInt === 3 ? '2' : '3',
      note: CHROMATIC_NOTES[(rootIdx + thirdInt) % 12],
      interval: thirdInt === 3 ? 'b3' : '3',
      role: 'third',
      midi: config.strings[2].midi + rootFretE + (thirdInt === 3 ? 1 : 2),
    });
    p1Notes.push({
      stringIndex: 1, // D
      fret: rootFretE + (chordKey === 'm7b5' || chordKey === 'dim7' ? 1 : 2),
      finger: '4',
      note: CHROMATIC_NOTES[(rootIdx + (chordKey === 'm7b5' || chordKey === 'dim7' ? 6 : 7)) % 12],
      interval: chordKey === 'm7b5' || chordKey === 'dim7' ? 'b5' : '5',
      role: 'fifth',
      midi: config.strings[1].midi + rootFretE + (chordKey === 'm7b5' || chordKey === 'dim7' ? 1 : 2),
    });
    if (hasSeventh) {
      p1Notes.push({
        stringIndex: 0, // G
        fret: rootFretE + (seventhInt === 11 ? 4 : seventhInt === 9 ? 2 : 3),
        finger: '4',
        note: CHROMATIC_NOTES[(rootIdx + seventhInt) % 12],
        interval: seventhInt === 11 ? '7' : seventhInt === 9 ? 'bb7' : 'b7',
        role: 'seventh',
        midi: config.strings[0].midi + rootFretE + (seventhInt === 11 ? 4 : seventhInt === 9 ? 2 : 3),
      });
    }
    voicings.push({
      id: 'b4_pos_root_e',
      name: `Posición 1 (Tríada / Grip en 4ta Cuerda — Fret ${rootFretE})`,
      description: `Fundamental ${rootNote} en cuerda E. Digitado compacto con 3ra y 5ta.`,
      fretRange: [Math.max(0, rootFretE - 1), Math.min(24, rootFretE + 5)],
      notes: p1Notes,
    });

    // 2. Posición 2: Shell Voicing (Fundamental + 7ma + 3ra)
    const p2Notes: VoicingNote[] = [];
    p2Notes.push({
      stringIndex: 2, // A
      fret: rootFretA,
      finger: '1',
      note: rootNote as ChromaticNote,
      interval: 'R',
      role: 'root',
      midi: config.strings[2].midi + rootFretA,
    });
    if (hasSeventh) {
      p2Notes.push({
        stringIndex: 1, // D
        fret: rootFretA + (seventhInt === 11 ? 2 : 1),
        finger: '2',
        note: CHROMATIC_NOTES[(rootIdx + seventhInt) % 12],
        interval: seventhInt === 11 ? '7' : 'b7',
        role: 'seventh',
        midi: config.strings[1].midi + rootFretA + (seventhInt === 11 ? 2 : 1),
      });
    }
    p2Notes.push({
      stringIndex: 0, // G
      fret: rootFretA + (thirdInt === 3 ? 2 : 3),
      finger: '3',
      note: CHROMATIC_NOTES[(rootIdx + thirdInt) % 12],
      interval: thirdInt === 3 ? 'b3' : '3',
      role: 'third',
      midi: config.strings[0].midi + rootFretA + (thirdInt === 3 ? 2 : 3),
    });
    voicings.push({
      id: 'b4_shell_voicing',
      name: `Posición 2 (Shell Voicing R-7-3 — Fret ${rootFretA})`,
      description: `Acorde de bajo Jazz / Gospel: notas guía de alta definición sin saturar el grave.`,
      fretRange: [Math.max(0, rootFretA - 1), Math.min(24, rootFretA + 4)],
      notes: p2Notes,
    });

    // 3. Posición 3: Acorde de Décima (10th Voicing)
    // R en cuerda E y 3ra mayor/menor una octava arriba en cuerda G
    const tenthFretG = rootFretE + (thirdInt === 3 ? 3 : 4);
    if (tenthFretG <= config.totalFrets) {
      const p3Notes: VoicingNote[] = [
        {
          stringIndex: 3,
          fret: rootFretE,
          finger: '1',
          note: rootNote as ChromaticNote,
          interval: 'R',
          role: 'root',
          midi: config.strings[3].midi + rootFretE,
        },
        {
          stringIndex: 0,
          fret: tenthFretG,
          finger: '3',
          note: CHROMATIC_NOTES[(rootIdx + thirdInt) % 12],
          interval: thirdInt === 3 ? 'b3 (10ma)' : '3 (10ma)',
          role: 'third',
          midi: config.strings[0].midi + tenthFretG,
        },
      ];
      voicings.push({
        id: 'b4_tenth_voicing',
        name: `Posición 3 (Doble Parada / Décima — Fret ${rootFretE})`,
        description: `Fundamental + Décima melódica. Sonido etéreo estilo Jaco Pastorius / Marcus Miller.`,
        fretRange: [Math.max(0, rootFretE - 1), Math.min(24, tenthFretG + 2)],
        notes: p3Notes,
      });
    }

    // 4. Inversión 1 (3ra en el bajo)
    const thirdFretE = (rootIdx + thirdInt - CHROMATIC_NOTES.indexOf('E') + 12) % 12;
    const inv1Notes: VoicingNote[] = [
      {
        stringIndex: 3,
        fret: thirdFretE,
        finger: '1',
        note: CHROMATIC_NOTES[(rootIdx + thirdInt) % 12],
        interval: thirdInt === 3 ? 'b3' : '3',
        role: 'third',
        midi: config.strings[3].midi + thirdFretE,
      },
      {
        stringIndex: 2,
        fret: (rootIdx - CHROMATIC_NOTES.indexOf('A') + 12) % 12,
        finger: '3',
        note: rootNote as ChromaticNote,
        interval: 'R',
        role: 'root',
        midi: config.strings[2].midi + (rootIdx - CHROMATIC_NOTES.indexOf('A') + 12) % 12,
      },
    ];
    voicings.push({
      id: 'b4_inv_1',
      name: `Inversión 1 (Bajo en 3ra — Fret ${thirdFretE})`,
      description: `Bajo melódico con tercera en el registro grave.`,
      fretRange: [Math.max(0, thirdFretE - 1), Math.min(24, thirdFretE + 4)],
      notes: inv1Notes,
    });
  } else if (instrument === 'bass_5') {
    // BAJO DE 5 CUERDAS:
    // Cuerdas: 0 = G2, 1 = D2, 2 = A1, 3 = E1, 4 = B0 (Low B)
    const rootFretB = (rootIdx - CHROMATIC_NOTES.indexOf('B') + 12) % 12;
    const rootFretE = (rootIdx - CHROMATIC_NOTES.indexOf('E') + 12) % 12;
    const rootFretA = (rootIdx - CHROMATIC_NOTES.indexOf('A') + 12) % 12;
    const thirdInt = chordKey.includes('minor') || chordKey === 'm7' || chordKey === 'm7b5' || chordKey === 'dim7' ? 3 : 4;
    const seventhInt = chordKey === 'maj7' ? 11 : chordKey === 'dim7' ? 9 : 10;
    const hasSeventh = chordKey.includes('7');

    // 1. Posición 1: Fundamental en 5ta Cuerda (Low B)
    const p1Notes: VoicingNote[] = [];
    p1Notes.push({
      stringIndex: 4, // B0
      fret: rootFretB,
      finger: '1',
      note: rootNote as ChromaticNote,
      interval: 'R',
      role: 'root',
      midi: config.strings[4].midi + rootFretB,
    });
    p1Notes.push({
      stringIndex: 3, // E1
      fret: rootFretB + (thirdInt === 3 ? 1 : 2),
      finger: thirdInt === 3 ? '2' : '3',
      note: CHROMATIC_NOTES[(rootIdx + thirdInt) % 12],
      interval: thirdInt === 3 ? 'b3' : '3',
      role: 'third',
      midi: config.strings[3].midi + rootFretB + (thirdInt === 3 ? 1 : 2),
    });
    p1Notes.push({
      stringIndex: 2, // A1
      fret: rootFretB + (chordKey === 'm7b5' || chordKey === 'dim7' ? 1 : 2),
      finger: '4',
      note: CHROMATIC_NOTES[(rootIdx + (chordKey === 'm7b5' || chordKey === 'dim7' ? 6 : 7)) % 12],
      interval: chordKey === 'm7b5' || chordKey === 'dim7' ? 'b5' : '5',
      role: 'fifth',
      midi: config.strings[2].midi + rootFretB + (chordKey === 'm7b5' || chordKey === 'dim7' ? 1 : 2),
    });
    if (hasSeventh) {
      p1Notes.push({
        stringIndex: 1, // D2
        fret: rootFretB + (seventhInt === 11 ? 4 : seventhInt === 9 ? 2 : 3),
        finger: '4',
        note: CHROMATIC_NOTES[(rootIdx + seventhInt) % 12],
        interval: seventhInt === 11 ? '7' : seventhInt === 9 ? 'bb7' : 'b7',
        role: 'seventh',
        midi: config.strings[1].midi + rootFretB + (seventhInt === 11 ? 4 : seventhInt === 9 ? 2 : 3),
      });
    }
    voicings.push({
      id: 'b5_pos_sub_b',
      name: `Posición 1 (Sub-Grave en 5ta Cuerda Low B — Fret ${rootFretB})`,
      description: `Aprovecha el poder del Low B (31Hz) para bases demoledoras con pegada masiva.`,
      fretRange: [Math.max(0, rootFretB - 1), Math.min(24, rootFretB + 5)],
      notes: p1Notes,
    });

    // 2. Posición 2: Shell Voicing en cuerdas 3-2-1
    const p2Notes: VoicingNote[] = [];
    p2Notes.push({
      stringIndex: 3, // E
      fret: rootFretE,
      finger: '1',
      note: rootNote as ChromaticNote,
      interval: 'R',
      role: 'root',
      midi: config.strings[3].midi + rootFretE,
    });
    if (hasSeventh) {
      p2Notes.push({
        stringIndex: 2, // A
        fret: rootFretE + (seventhInt === 11 ? 2 : 1),
        finger: '2',
        note: CHROMATIC_NOTES[(rootIdx + seventhInt) % 12],
        interval: seventhInt === 11 ? '7' : 'b7',
        role: 'seventh',
        midi: config.strings[2].midi + rootFretE + (seventhInt === 11 ? 2 : 1),
      });
    }
    p2Notes.push({
      stringIndex: 1, // D
      fret: rootFretE + (thirdInt === 3 ? 2 : 3),
      finger: '3',
      note: CHROMATIC_NOTES[(rootIdx + thirdInt) % 12],
      interval: thirdInt === 3 ? 'b3' : '3',
      role: 'third',
      midi: config.strings[1].midi + rootFretE + (thirdInt === 3 ? 2 : 3),
    });
    voicings.push({
      id: 'b5_pos_shell_e',
      name: `Posición 2 (Shell Voicing en 4ta Cuerda — Fret ${rootFretE})`,
      description: `Rango medio-grave articulado con separación tonal perfecta.`,
      fretRange: [Math.max(0, rootFretE - 1), Math.min(24, rootFretE + 4)],
      notes: p2Notes,
    });

    // 3. Posición 3: Acorde Extendido de 10ma en Cuerdas Superiores
    const tenthFretG = rootFretA + (thirdInt === 3 ? 3 : 4);
    if (tenthFretG <= config.totalFrets) {
      const p3Notes: VoicingNote[] = [
        {
          stringIndex: 2, // A
          fret: rootFretA,
          finger: '1',
          note: rootNote as ChromaticNote,
          interval: 'R',
          role: 'root',
          midi: config.strings[2].midi + rootFretA,
        },
        {
          stringIndex: 0, // G
          fret: tenthFretG,
          finger: '3',
          note: CHROMATIC_NOTES[(rootIdx + thirdInt) % 12],
          interval: thirdInt === 3 ? 'b3 (10ma)' : '3 (10ma)',
          role: 'third',
          midi: config.strings[0].midi + tenthFretG,
        },
      ];
      voicings.push({
        id: 'b5_pos_tenth',
        name: `Posición 3 (Doble Parada 10ma Superior — Fret ${rootFretA})`,
        description: `Acorde melódico dulce en cuerdas agudas A y G.`,
        fretRange: [Math.max(0, rootFretA - 1), Math.min(24, tenthFretG + 2)],
        notes: p3Notes,
      });
    }
  }

  return voicings;
}

// Progresiones Armónicas de Estudio
export interface ProgressionStep {
  roman: string;
  name: string;
  semitoneOffset: number;
  chordKey: ChordKey;
  bars: number;
}

export interface ProgressionDef {
  id: string;
  name: string;
  genre: string;
  description: string;
  bpmDefault: number;
  steps: ProgressionStep[];
}

export const PROGRESSIONS_CATALOG: ProgressionDef[] = [
  {
    id: 'ii_v_i',
    name: 'II - V - I (Jazz / Worship)',
    genre: 'Jazz / Neo-Soul / Worship',
    description: 'La progresión rey de la armonía tonal moderna. Movimiento de quintas con máxima fluidez melódica.',
    bpmDefault: 80,
    steps: [
      { roman: 'ii7', name: 'Segundo Menor 7', semitoneOffset: 2, chordKey: 'm7', bars: 2 },
      { roman: 'V7', name: 'Dominante 7', semitoneOffset: 7, chordKey: 'dom7', bars: 2 },
      { roman: 'Imaj7', name: 'Tónica Maj7', semitoneOffset: 0, chordKey: 'maj7', bars: 4 },
    ],
  },
  {
    id: 'i_v_vi_iv',
    name: 'I - V - vi - IV (Pop / Alabanza)',
    genre: 'Pop / Worship / Rock',
    description: 'La progresión de 4 acordes más célebre y emotiva de la música contemporánea.',
    bpmDefault: 95,
    steps: [
      { roman: 'I', name: 'Tónica Mayor', semitoneOffset: 0, chordKey: 'major', bars: 1 },
      { roman: 'V', name: 'Dominante', semitoneOffset: 7, chordKey: 'major', bars: 1 },
      { roman: 'vi', name: 'Relativo Menor', semitoneOffset: 9, chordKey: 'minor', bars: 1 },
      { roman: 'IV', name: 'Subdominante', semitoneOffset: 5, chordKey: 'major', bars: 1 },
    ],
  },
  {
    id: 'i_vi_ii_v',
    name: 'I - vi - ii - V (Balada Clásica)',
    genre: 'Balada / Doowop / Standards',
    description: 'Ciclo armónico circular clásico para improvisación continua y líneas de bajo caminante (Walking Bass).',
    bpmDefault: 75,
    steps: [
      { roman: 'Imaj7', name: 'Tónica Maj7', semitoneOffset: 0, chordKey: 'maj7', bars: 2 },
      { roman: 'vi7', name: 'Sexto Menor 7', semitoneOffset: 9, chordKey: 'm7', bars: 2 },
      { roman: 'ii7', name: 'Segundo Menor 7', semitoneOffset: 2, chordKey: 'm7', bars: 2 },
      { roman: 'V7', name: 'Dominante 7', semitoneOffset: 7, chordKey: 'dom7', bars: 2 },
    ],
  },
  {
    id: 'blues_12_bar',
    name: '12-Bar Blues',
    genre: 'Blues / Funk / Shuffle',
    description: 'Estructura tradicional de 12 compases con acordes dominantes. Base indispensable de todo músico.',
    bpmDefault: 105,
    steps: [
      { roman: 'I7', name: 'Tónica Dominante (4 compases)', semitoneOffset: 0, chordKey: 'dom7', bars: 4 },
      { roman: 'IV7', name: 'Subdominante (2 compases)', semitoneOffset: 5, chordKey: 'dom7', bars: 2 },
      { roman: 'I7', name: 'Tónica Dominante (2 compases)', semitoneOffset: 0, chordKey: 'dom7', bars: 2 },
      { roman: 'V7', name: 'Dominante Tensión (1 compás)', semitoneOffset: 7, chordKey: 'dom7', bars: 1 },
      { roman: 'IV7', name: 'Subdominante Retorno (1 compás)', semitoneOffset: 5, chordKey: 'dom7', bars: 1 },
      { roman: 'I7', name: 'Resolución Tónica (1 compás)', semitoneOffset: 0, chordKey: 'dom7', bars: 1 },
      { roman: 'V7', name: 'Turnaround Final (1 compás)', semitoneOffset: 7, chordKey: 'dom7', bars: 1 },
    ],
  },
];

// Resolver los acordes reales de una progresión según la tonalidad elegida
export function resolveProgressionChords(
  progression: ProgressionDef,
  keyRoot: string
): {
  roman: string;
  stepName: string;
  rootNote: ChromaticNote;
  chordKey: ChordKey;
  chordName: string;
  fullChordLabel: string;
  bars: number;
}[] {
  const rootIdx = CHROMATIC_NOTES.indexOf(keyRoot as ChromaticNote);
  if (rootIdx === -1) return [];

  return progression.steps.map((step) => {
    const chordRootIdx = (rootIdx + step.semitoneOffset) % 12;
    const chordRoot = CHROMATIC_NOTES[chordRootIdx];
    const chordDef = CHORDS_CATALOG[step.chordKey];
    const fullChordLabel = `${chordRoot}${
      step.chordKey === 'major'
        ? ''
        : step.chordKey === 'minor'
        ? 'm'
        : step.chordKey === 'dom7'
        ? '7'
        : step.chordKey
    }`;

    return {
      roman: step.roman,
      stepName: step.name,
      rootNote: chordRoot,
      chordKey: step.chordKey,
      chordName: chordDef.name,
      fullChordLabel,
      bars: step.bars,
    };
  });
}
