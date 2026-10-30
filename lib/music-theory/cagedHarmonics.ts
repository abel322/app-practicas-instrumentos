import { CHROMATIC_NOTES, InstrumentType } from './fretboard';

export type ChordExtensionFamily = 'triad' | 'seventh' | 'ninth' | 'suspended';

export interface ChordFormulaDefinition {
  degreeIndex: number;
  roman: string;
  labelSuffix: string;
  fullNameSuffix: string;
  chordType: 'maj' | 'min' | 'dim' | 'dom7' | 'sus';
  intervals: { label: string; semitones: number }[];
}

export const HARMONIC_FAMILIES_CONFIG: Record<ChordExtensionFamily, ChordFormulaDefinition[]> = {
  triad: [
    { degreeIndex: 0, roman: 'I', labelSuffix: '', fullNameSuffix: 'Mayor', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm', fullNameSuffix: 'menor', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm', fullNameSuffix: 'menor', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: '', fullNameSuffix: 'Mayor', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '', fullNameSuffix: 'Mayor', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm', fullNameSuffix: 'menor', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'dim', fullNameSuffix: 'disminuido', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }] },
  ],
  seventh: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'maj7', fullNameSuffix: 'Maj7', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '7', semitones: 11 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm7', fullNameSuffix: 'menor 7', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm7', fullNameSuffix: 'menor 7', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'maj7', fullNameSuffix: 'Maj7', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '7', semitones: 11 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '7', fullNameSuffix: 'Dominante 7', chordType: 'dom7', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm7', fullNameSuffix: 'menor 7', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'm7b5', fullNameSuffix: 'Semidisminuido', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }, { label: 'b7', semitones: 10 }] },
  ],
  ninth: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'maj9', fullNameSuffix: 'Maj9', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '7', semitones: 11 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm9', fullNameSuffix: 'menor 9', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm(b9)', fullNameSuffix: 'menor b9', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }, { label: 'b9', semitones: 1 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'maj9', fullNameSuffix: 'Maj9', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '7', semitones: 11 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '9', fullNameSuffix: 'Dominante 9', chordType: 'dom7', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm9', fullNameSuffix: 'menor 9', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'dim(b9)', fullNameSuffix: 'disminuido b9', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }, { label: 'b7', semitones: 10 }] },
  ],
  suspended: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'sus4', fullNameSuffix: 'sus4', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '4', semitones: 5 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'sus2', fullNameSuffix: 'sus2', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '2', semitones: 2 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'sus4', fullNameSuffix: 'sus4', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '4', semitones: 5 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'sus2', fullNameSuffix: 'sus2', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '2', semitones: 2 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: 'sus4', fullNameSuffix: 'sus4', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '4', semitones: 5 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'sus2', fullNameSuffix: 'sus2', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '2', semitones: 2 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'dim', fullNameSuffix: 'dim', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }] },
  ]
};

export interface CagedChordVoicing {
  degreeRoman: string;
  degreeName: string;
  chordName: string;
  fullName: string;
  chordType: 'maj' | 'min' | 'dim' | 'dom7' | 'sus';
  rootNote: string;
  extension?: ChordExtensionFamily;
  // Array de notas activas en el acorde: cuerda (0=aguda, N-1=grave), traste, dedo, función interválica
  notes: {
    stringIndex: number;
    fret: number;
    finger: number;
    intervalLabel: string;
    isRoot: boolean;
  }[];
}

export interface CagedBoxMeta {
  id: number;
  shapeLetter: 'C' | 'A' | 'G' | 'E' | 'D';
  name: string;
  shortLabel: string;
  description: string;
  baseFretRange: [number, number]; // Trastes en C Mayor
}

export const CAGED_BOX_DEFINITIONS: CagedBoxMeta[] = [
  {
    id: 1,
    shapeLetter: 'C',
    name: 'Caja 1 (Forma C)',
    shortLabel: 'Forma C',
    description: 'Trastes 0–3 en C Mayor (Voz abierta / cejilla móvil C)',
    baseFretRange: [0, 3],
  },
  {
    id: 2,
    shapeLetter: 'A',
    name: 'Caja 2 (Forma A)',
    shortLabel: 'Forma A',
    description: 'Trastes 2–6 en C Mayor (Cejilla raíz cuerda 5)',
    baseFretRange: [2, 6],
  },
  {
    id: 3,
    shapeLetter: 'G',
    name: 'Caja 3 (Forma G)',
    shortLabel: 'Forma G',
    description: 'Trastes 4–8 en C Mayor (Voz extendida / arpegio)',
    baseFretRange: [4, 8],
  },
  {
    id: 4,
    shapeLetter: 'E',
    name: 'Caja 4 (Forma E)',
    shortLabel: 'Forma E',
    description: 'Trastes 7–10 en C Mayor (Cejilla clásica raíz cuerda 6)',
    baseFretRange: [7, 10],
  },
  {
    id: 5,
    shapeLetter: 'D',
    name: 'Caja 5 (Forma D)',
    shortLabel: 'Forma D',
    description: 'Trastes 8–13 en C Mayor (Forma aguda tríada D)',
    baseFretRange: [8, 13],
  },
];

export const DIATONIC_DEGREES = [
  { roman: 'I', type: 'maj', semitonesFromKeyRoot: 0, labelSuffix: '', name: 'Tónica' },
  { roman: 'ii', type: 'min', semitonesFromKeyRoot: 2, labelSuffix: 'm', name: 'Supertónica' },
  { roman: 'iii', type: 'min', semitonesFromKeyRoot: 4, labelSuffix: 'm', name: 'Mediante' },
  { roman: 'IV', type: 'maj', semitonesFromKeyRoot: 5, labelSuffix: '', name: 'Subdominante' },
  { roman: 'V', type: 'maj', semitonesFromKeyRoot: 7, labelSuffix: '', name: 'Dominante' },
  { roman: 'vi', type: 'min', semitonesFromKeyRoot: 9, labelSuffix: 'm', name: 'Submediante' },
  { roman: 'vii°', type: 'dim', semitonesFromKeyRoot: 11, labelSuffix: 'dim', name: 'Sensible' },
] as const;

type RawNote = {
  stringIndex: number;
  fret: number;
  finger: number;
  intervalLabel: string;
  isRoot: boolean;
};

// ======================================================================
// BIBLIOTECA BASE DE VOICINGS DIATÓNICOS CAGED PARA GUITARRA (6 CUERDAS)
// En la tonalidad de Do Mayor (C = 0 semitonos)
// Normalizados para transposición a las 12 tonalidades
// stringIndex: 0 = 1ra (E4), 1 = 2da (B3), 2 = 3ra (G3), 3 = 4ta (D3), 4 = 5ta (A2), 5 = 6ta (E2)
// ======================================================================

const GUITAR_CAGED_VOICINGS_C_MAJOR: Record<number, Record<number, RawNote[]>> = {
  // CAJA 1 (Forma C, Trastes 0-3)
  1: {
    // I - C
    0: [
      { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
      { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
    ],
    // ii - Dm
    1: [
      { stringIndex: 4, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
    ],
    // iii - Em
    2: [
      { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 2, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    // IV - F
    3: [
      { stringIndex: 5, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
      { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    // V - G
    4: [
      { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
      { stringIndex: 3, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
    ],
    // vi - Am
    5: [
      { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 2, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    // vii° - Bdim
    6: [
      { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b5', isRoot: false },
    ],
  },

  // CAJA 2 (Forma A, Trastes 2-6)
  2: {
    // I - C
    0: [
      { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    // ii - Dm
    1: [
      { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 5, finger: 4, intervalLabel: '5', isRoot: false },
    ],
    // iii - Em
    2: [
      { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 4, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 4, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 5, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 3, finger: 2, intervalLabel: 'b3', isRoot: false },
    ],
    // IV - F
    3: [
      { stringIndex: 4, fret: 3, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
      { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 5, finger: 3, intervalLabel: '3', isRoot: false },
    ],
    // V - G
    4: [
      { stringIndex: 5, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 5, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
      { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    // vi - Am
    5: [
      { stringIndex: 5, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 3, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 5, finger: 4, intervalLabel: 'R', isRoot: true },
    ],
    // vii° - Bdim
    6: [
      { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 2, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
    ],
  },

  // CAJA 3 (Forma G, Trastes 4-8)
  3: {
    // I - C
    0: [
      { stringIndex: 5, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 3, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
    ],
    // ii - Dm
    1: [
      { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    // iii - Em
    2: [
      { stringIndex: 5, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 4, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
    ],
    // IV - F
    3: [
      { stringIndex: 4, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 2, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '3', isRoot: false },
    ],
    // V - G
    4: [
      { stringIndex: 4, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 7, finger: 2, intervalLabel: '3', isRoot: false },
    ],
    // vi - Am
    5: [
      { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    // vii° - Bdim
    6: [
      { stringIndex: 5, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 0, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
    ],
  },

  // CAJA 4 (Forma E, Trastes 7-10)
  4: {
    // I - C
    0: [
      { stringIndex: 5, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
      { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    // ii - Dm
    1: [
      { stringIndex: 5, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
    ],
    // iii - Em
    2: [
      { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 9, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    // IV - F
    3: [
      { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 10, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    // V - G
    4: [
      { stringIndex: 4, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
    ],
    // vi - Am
    5: [
      { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
    ],
    // vii° - Bdim
    6: [
      { stringIndex: 5, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 3, fret: 9, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
  },

  // CAJA 5 (Forma D, Trastes 8-13)
  5: {
    // I - C
    0: [
      { stringIndex: 5, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 10, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 12, finger: 4, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 12, finger: 3, intervalLabel: '3', isRoot: false },
    ],
    // ii - Dm
    1: [
      { stringIndex: 5, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 3, fret: 12, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    // iii - Em
    2: [
      { stringIndex: 5, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 9, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 12, finger: 4, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
    ],
    // IV - F
    3: [
      { stringIndex: 5, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 4, fret: 12, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 3, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
    ],
    // V - G
    4: [
      { stringIndex: 4, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 12, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    // vi - Am
    5: [
      { stringIndex: 4, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '5', isRoot: false },
    ],
    // vii° - Bdim
    6: [
      { stringIndex: 3, fret: 9, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 10, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 1, fret: 12, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 10, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 13, finger: 4, intervalLabel: 'b5', isRoot: false },
    ],
  },
};

// ======================================================================
// BIBLIOTECA BASE DE TRÍADAS Y ARPEGIOS CAGED PARA BAJO (4 Y 5 CUERDAS)
// En C Mayor, mapeados a cuerdas: 0 = G2, 1 = D2, 2 = A1, 3 = E1
// ======================================================================

const BASS_CAGED_VOICINGS_C_MAJOR: Record<number, Record<number, RawNote[]>> = {
  1: {
    0: [
      { stringIndex: 2, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    1: [
      { stringIndex: 1, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
    ],
    2: [
      { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
    ],
    3: [
      { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
    ],
    4: [
      { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
      { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    5: [
      { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
    ],
    6: [
      { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 0, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
    ],
  },
  2: {
    0: [
      { stringIndex: 2, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
    ],
    1: [
      { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 3, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    2: [
      { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    3: [
      { stringIndex: 2, fret: 3, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
    ],
    4: [
      { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
    ],
    5: [
      { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 3, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    6: [
      { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 0, fret: 4, finger: 3, intervalLabel: 'R', isRoot: true },
    ],
  },
  3: {
    0: [
      { stringIndex: 3, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    1: [
      { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
    ],
    2: [
      { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
    ],
    3: [
      { stringIndex: 2, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    4: [
      { stringIndex: 2, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
    ],
    5: [
      { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
    ],
    6: [
      { stringIndex: 3, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 8, finger: 4, intervalLabel: 'b5', isRoot: false },
    ],
  },
  4: {
    0: [
      { stringIndex: 3, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
    ],
    1: [
      { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    2: [
      { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 9, finger: 4, intervalLabel: 'R', isRoot: true },
    ],
    3: [
      { stringIndex: 2, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
    ],
    4: [
      { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 9, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    5: [
      { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
    ],
    6: [
      { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 8, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 1, fret: 9, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
    ],
  },
  5: {
    0: [
      { stringIndex: 3, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 10, finger: 2, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '5', isRoot: false },
    ],
    1: [
      { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 1, fret: 12, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
    ],
    2: [
      { stringIndex: 3, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 1, fret: 9, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 9, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    3: [
      { stringIndex: 3, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
      { stringIndex: 2, fret: 12, finger: 3, intervalLabel: '3', isRoot: false },
      { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
    ],
    4: [
      { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
      { stringIndex: 0, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
    ],
    5: [
      { stringIndex: 2, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
      { stringIndex: 1, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
      { stringIndex: 0, fret: 9, finger: 1, intervalLabel: '5', isRoot: false },
    ],
    6: [
      { stringIndex: 1, fret: 9, finger: 1, intervalLabel: 'R', isRoot: true },
      { stringIndex: 0, fret: 10, finger: 2, intervalLabel: 'b5', isRoot: false },
      { stringIndex: 3, fret: 10, finger: 2, intervalLabel: 'b3', isRoot: false },
    ],
  },
};

// ======================================================================
// BIBLIOTECA EXTENDIDA DE VOICINGS DIATÓNICOS CAGED (SÉPTIMAS, NOVENAS, SUSPENDIDOS)
// En C Mayor, optimizados para digitación fluida en cada forma CAGED
// ======================================================================

const GUITAR_CAGED_VOICINGS_EXTENSIONS_C_MAJOR: Record<
  Exclude<ChordExtensionFamily, 'triad'>,
  Record<number, Record<number, RawNote[]>>
> = {
  seventh: {
    // Caja 1 (Forma C)
    1: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b7', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
      ],
    },
    // Caja 2 (Forma A)
    2: {
      0: [
        { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
      ],
    },
    // Caja 3 (Forma G)
    3: {
      0: [
        { stringIndex: 5, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 3, intervalLabel: '7', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 4, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 4, intervalLabel: '3', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b5', isRoot: false },
      ],
    },
    // Caja 4 (Forma E)
    4: {
      0: [
        { stringIndex: 5, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      1: [
        { stringIndex: 5, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
      ],
    },
    // Caja 5 (Forma D)
    5: {
      0: [
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 3, intervalLabel: '3', isRoot: false },
      ],
      1: [
        { stringIndex: 5, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      2: [
        { stringIndex: 5, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 12, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 12, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
      3: [
        { stringIndex: 5, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 12, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },
  ninth: {
    1: {
      0: [
        { stringIndex: 4, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b9', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b9', isRoot: false },
      ],
    },
    2: {
      0: [
        { stringIndex: 4, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b9', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b9', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b5', isRoot: false },
      ],
    },
    3: {
      0: [
        { stringIndex: 5, fret: 8, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 3, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 4, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b9', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 2, intervalLabel: '9', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b9', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b5', isRoot: false },
      ],
    },
    4: {
      0: [
        { stringIndex: 5, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 4, intervalLabel: '7', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      1: [
        { stringIndex: 5, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 1, intervalLabel: 'b9', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 2, intervalLabel: '5', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: '9', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '9', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b9', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 1, intervalLabel: 'b3', isRoot: false },
      ],
    },
    5: {
      0: [
        { stringIndex: 3, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 4, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 2, intervalLabel: '9', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 12, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b9', isRoot: false },
      ],
      3: [
        { stringIndex: 5, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 12, finger: 3, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '7', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 12, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: 'b9', isRoot: false },
      ],
    },
  },
  suspended: {
    1: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      1: [
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '2', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 2, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 3, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '4', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b5', isRoot: false },
      ],
    },
    2: {
      0: [
        { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '4', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: '2', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 4, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
      ],
    },
    3: {
      0: [
        { stringIndex: 5, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: '4', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 4, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: '2', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: '4', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 8, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 2, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
      ],
    },
    4: {
      0: [
        { stringIndex: 5, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      1: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 10, finger: 4, intervalLabel: '2', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '4', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: '4', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '2', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
    },
    5: {
      0: [
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: '4', isRoot: false },
        { stringIndex: 1, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 13, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: '4', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 10, finger: 2, intervalLabel: '4', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 4, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 5, fret: 13, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 13, finger: 4, intervalLabel: '2', isRoot: false },
        { stringIndex: 0, fret: 13, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 13, finger: 4, intervalLabel: '4', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '2', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 10, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },
};

/**
 * Asigna la función interválica de cualquier nota en semitonos relativa a la tónica del acorde
 */
export function getIntervalLabel(noteName: string, chordRootNote: string): string {
  const rootIdx = normalizeToChromaticIndex(chordRootNote);
  const noteIdx = normalizeToChromaticIndex(noteName);
  const semitones = (noteIdx - rootIdx + 12) % 12;

  switch (semitones) {
    case 0:
      return 'R';
    case 1:
      return 'b9';
    case 2:
      return '9';
    case 3:
      return 'b3';
    case 4:
      return '3';
    case 5:
      return '4';
    case 6:
      return 'b5';
    case 7:
      return '5';
    case 8:
      return 'b6';
    case 9:
      return '6';
    case 10:
      return 'b7';
    case 11:
      return '7';
    default:
      return 'R';
  }
}

/**
 * Normaliza cualquier nombre de tónica (ej: Bb, Db, F#, C) a la escala cromática estándar de sostenidos
 */
function normalizeToChromaticIndex(root: string): number {
  const enharmonics: Record<string, string> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  };
  const standard = enharmonics[root] || root;
  const idx = CHROMATIC_NOTES.indexOf(standard as any);
  return idx === -1 ? 0 : idx;
}

/**
 * Voicings posicionales cerrados de los 7 acordes diatónicos para las 5 formas CAGED
 * Transponibles matemáticamente a las 12 tonalidades y con soporte dinámico de Familias de Extensiones.
 */
export function getCagedDiatonicChords(
  keyRoot: string,
  boxId: number, // 1 a 5 (C, A, G, E, D)
  instrument: InstrumentType = 'guitar_6',
  extension: ChordExtensionFamily = 'triad'
): CagedChordVoicing[] {
  const safeRootIndex = normalizeToChromaticIndex(keyRoot);
  const transposeOffset = safeRootIndex; // C = 0, C# = 1, D = 2...

  const isBass = instrument === 'bass_4' || instrument === 'bass_5';
  const familyConfigs = HARMONIC_FAMILIES_CONFIG[extension] || HARMONIC_FAMILIES_CONFIG.triad;

  return familyConfigs.map((formulaDef, degIdx) => {
    const chordRootMidi = (safeRootIndex + DIATONIC_DEGREES[degIdx].semitonesFromKeyRoot) % 12;
    const chordRootName = CHROMATIC_NOTES[chordRootMidi];
    const chordName = `${chordRootName}${formulaDef.labelSuffix}`;
    const fullName = `${formulaDef.roman} - ${chordName}`;

    let rawNotes: RawNote[] = [];

    if (isBass) {
      const boxCatalog = BASS_CAGED_VOICINGS_C_MAJOR[boxId] || BASS_CAGED_VOICINGS_C_MAJOR[1];
      const baseTriad = boxCatalog[degIdx] || [];
      if (extension === 'triad') {
        rawNotes = baseTriad;
      } else {
        rawNotes = baseTriad.map((n) => {
          if (extension === 'suspended') {
            if (n.intervalLabel === '3') {
              const susInt = formulaDef.intervals.find((i) => i.label === '4' || i.label === '2');
              return { ...n, intervalLabel: susInt ? susInt.label : '4' };
            }
            if (n.intervalLabel === 'b3') {
              const susInt = formulaDef.intervals.find((i) => i.label === '4' || i.label === '2');
              return { ...n, intervalLabel: susInt ? susInt.label : '2' };
            }
          }
          return n;
        });
      }
    } else {
      // Guitarra: buscar en catálogo de extensiones o en el de tríadas
      if (extension === 'triad') {
        const boxCatalog = GUITAR_CAGED_VOICINGS_C_MAJOR[boxId] || GUITAR_CAGED_VOICINGS_C_MAJOR[1];
        rawNotes = boxCatalog[degIdx] || [];
      } else {
        const extCatalog = GUITAR_CAGED_VOICINGS_EXTENSIONS_C_MAJOR[extension]?.[boxId];
        if (extCatalog && extCatalog[degIdx] && extCatalog[degIdx].length > 0) {
          rawNotes = extCatalog[degIdx];
        } else {
          const boxCatalog = GUITAR_CAGED_VOICINGS_C_MAJOR[boxId] || GUITAR_CAGED_VOICINGS_C_MAJOR[1];
          rawNotes = boxCatalog[degIdx] || [];
        }
      }
    }

    // Transponer trastes con control de límites para 24 trastes
    const transposedNotes = rawNotes.map((n) => {
      let tFret = n.fret + transposeOffset;
      if (tFret > 24) tFret -= 12;
      if (tFret < 0) tFret += 12;

      return {
        stringIndex: n.stringIndex,
        fret: tFret,
        finger: n.finger,
        intervalLabel: n.intervalLabel,
        isRoot: n.isRoot,
      };
    });

    return {
      degreeRoman: formulaDef.roman,
      degreeName: formulaDef.fullNameSuffix,
      chordName,
      fullName,
      chordType: formulaDef.chordType,
      rootNote: chordRootName,
      extension,
      notes: transposedNotes,
    };
  });
}

/**
 * Calcula el rango de trastes a enfocar en el mástil para la caja CAGED dada según la tonalidad
 */
export function getCagedBoxFretRange(boxId: number, keyRoot: string): [number, number] {
  const meta = CAGED_BOX_DEFINITIONS.find((b) => b.id === boxId) || CAGED_BOX_DEFINITIONS[0];
  const safeRootIndex = normalizeToChromaticIndex(keyRoot);
  const shift = safeRootIndex;

  let minFret = meta.baseFretRange[0] + shift;
  let maxFret = meta.baseFretRange[1] + shift;

  if (maxFret > 24) {
    minFret -= 12;
    maxFret -= 12;
  }
  if (minFret < 0) {
    minFret += 12;
    maxFret += 12;
  }

  return [Math.max(0, minFret), Math.min(24, maxFret)];
}

