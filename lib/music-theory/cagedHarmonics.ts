import { CHROMATIC_NOTES, InstrumentType } from './fretboard';

export type ChordExtensionFamily = 
  | 'triad' 
  | 'seventh' 
  | 'ninth' 
  | 'eleventh' 
  | 'thirteenth' 
  | 'added' 
  | 'suspended';

export type TonalityMode = 'major' | 'minor_natural' | 'minor_harmonic' | 'minor_melodic';

export const TONALITY_MODE_LABELS: Record<TonalityMode, string> = {
  major: 'Mayor (Jónica)',
  minor_natural: 'Menor Natural (Eólica)',
  minor_harmonic: 'Menor Armónica',
  minor_melodic: 'Menor Melódica',
};

export interface TonalityDegreeConfig {
  degreeIndex: number;
  roman: string;
  semitonesFromRoot: number;
  triadSuffix: string;
  triadFullName: string;
  triadType: 'maj' | 'min' | 'dim' | 'aug';
  triadIntervals: { label: string; semitones: number }[];
  seventhSuffix: string;
  seventhFullName: string;
  seventhType: 'maj' | 'min' | 'dim' | 'dom7';
  seventhIntervals: { label: string; semitones: number }[];
}

export const TONALITY_DEGREES_CATALOG: Record<TonalityMode, TonalityDegreeConfig[]> = {
  // 1. TONALIDAD MAYOR DIATÓNICA (I, ii, iii, IV, V, vi, vii°)
  major: [
    { degreeIndex: 0, roman: 'I', semitonesFromRoot: 0, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: 'maj7', seventhFullName: 'Maj7', seventhType: 'maj', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'7', semitones:11}] },
    { degreeIndex: 1, roman: 'II', semitonesFromRoot: 2, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 2, roman: 'III', semitonesFromRoot: 4, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 3, roman: 'IV', semitonesFromRoot: 5, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: 'maj7', seventhFullName: 'Maj7', seventhType: 'maj', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'7', semitones:11}] },
    { degreeIndex: 4, roman: 'V', semitonesFromRoot: 7, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: '7', seventhFullName: 'Dominante 7', seventhType: 'dom7', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 5, roman: 'VI', semitonesFromRoot: 9, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 6, roman: 'VII°', semitonesFromRoot: 11, triadSuffix: 'dim', triadFullName: 'disminuido', triadType: 'dim', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}], seventhSuffix: 'm7b5', seventhFullName: 'Semidisminuido', seventhType: 'dim', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}, {label:'b7', semitones:10}] },
  ],

  // 2. TONALIDAD MENOR NATURAL / EÓLICA (i, ii°, III, iv, v, VI, VII)
  minor_natural: [
    { degreeIndex: 0, roman: 'I', semitonesFromRoot: 0, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 1, roman: 'II°', semitonesFromRoot: 2, triadSuffix: 'dim', triadFullName: 'disminuido', triadType: 'dim', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}], seventhSuffix: 'm7b5', seventhFullName: 'Semidisminuido', seventhType: 'dim', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}, {label:'b7', semitones:10}] },
    { degreeIndex: 2, roman: '♭III', semitonesFromRoot: 3, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: 'maj7', seventhFullName: 'Maj7', seventhType: 'maj', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'7', semitones:11}] },
    { degreeIndex: 3, roman: 'IV', semitonesFromRoot: 5, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 4, roman: 'V', semitonesFromRoot: 7, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 5, roman: '♭VI', semitonesFromRoot: 8, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: 'maj7', seventhFullName: 'Maj7', seventhType: 'maj', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'7', semitones:11}] },
    { degreeIndex: 6, roman: '♭VII', semitonesFromRoot: 10, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: '7', seventhFullName: 'Dominante 7', seventhType: 'dom7', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
  ],

  // 3. TONALIDAD MENOR ARMÓNICA (Sensible 7ma mayor y V dominante)
  minor_harmonic: [
    { degreeIndex: 0, roman: 'I', semitonesFromRoot: 0, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm(maj7)', seventhFullName: 'menor (Maj7)', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'7', semitones:11}] },
    { degreeIndex: 1, roman: 'II°', semitonesFromRoot: 2, triadSuffix: 'dim', triadFullName: 'disminuido', triadType: 'dim', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}], seventhSuffix: 'm7b5', seventhFullName: 'Semidisminuido', seventhType: 'dim', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}, {label:'b7', semitones:10}] },
    { degreeIndex: 2, roman: '♭III+', semitonesFromRoot: 3, triadSuffix: 'aug', triadFullName: 'Aumentado', triadType: 'aug', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'#5', semitones:8}], seventhSuffix: 'maj7(#5)', seventhFullName: 'Maj7(#5)', seventhType: 'maj', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'#5', semitones:8}, {label:'7', semitones:11}] },
    { degreeIndex: 3, roman: 'IV', semitonesFromRoot: 5, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 4, roman: 'V', semitonesFromRoot: 7, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: '7', seventhFullName: 'Dominante 7', seventhType: 'dom7', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 5, roman: '♭VI', semitonesFromRoot: 8, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: 'maj7', seventhFullName: 'Maj7', seventhType: 'maj', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'7', semitones:11}] },
    { degreeIndex: 6, roman: 'VII°', semitonesFromRoot: 11, triadSuffix: 'dim', triadFullName: 'Disminuido', triadType: 'dim', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}], seventhSuffix: '°7', seventhFullName: 'Disminuido Completo', seventhType: 'dim', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}, {label:'bb7', semitones:9}] },
  ],

  // 4. TONALIDAD MENOR MELÓDICA (Jazz Minor)
  minor_melodic: [
    { degreeIndex: 0, roman: 'I', semitonesFromRoot: 0, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm(maj7)', seventhFullName: 'menor (Maj7)', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'7', semitones:11}] },
    { degreeIndex: 1, roman: 'II', semitonesFromRoot: 2, triadSuffix: 'm', triadFullName: 'menor', triadType: 'min', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}], seventhSuffix: 'm7', seventhFullName: 'menor 7', seventhType: 'min', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 2, roman: '♭III+', semitonesFromRoot: 3, triadSuffix: 'aug', triadFullName: 'Aumentado', triadType: 'aug', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'#5', semitones:8}], seventhSuffix: 'maj7(#5)', seventhFullName: 'Maj7(#5)', seventhType: 'maj', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'#5', semitones:8}, {label:'7', semitones:11}] },
    { degreeIndex: 3, roman: 'IV', semitonesFromRoot: 5, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: '7', seventhFullName: 'Dominante (Lidio Dom)', seventhType: 'dom7', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 4, roman: 'V', semitonesFromRoot: 7, triadSuffix: '', triadFullName: 'Mayor', triadType: 'maj', triadIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}], seventhSuffix: '7', seventhFullName: 'Dominante 7', seventhType: 'dom7', seventhIntervals: [{label:'R', semitones:0}, {label:'3', semitones:4}, {label:'5', semitones:7}, {label:'b7', semitones:10}] },
    { degreeIndex: 5, roman: 'VI°', semitonesFromRoot: 9, triadSuffix: 'dim', triadFullName: 'disminuido', triadType: 'dim', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}], seventhSuffix: 'm7b5', seventhFullName: 'Semidisminuido', seventhType: 'dim', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}, {label:'b7', semitones:10}] },
    { degreeIndex: 6, roman: 'VII°', semitonesFromRoot: 11, triadSuffix: 'dim', triadFullName: 'disminuido', triadType: 'dim', triadIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}], seventhSuffix: 'm7b5', seventhFullName: 'Semidisminuido / Alterado', seventhType: 'dim', seventhIntervals: [{label:'R', semitones:0}, {label:'b3', semitones:3}, {label:'b5', semitones:6}, {label:'b7', semitones:10}] },
  ]
};

export interface ChordFormulaDefinition {
  degreeIndex: number;
  roman: string;
  labelSuffix: string;
  fullNameSuffix: string;
  chordType: 'maj' | 'min' | 'dim' | 'aug' | 'dom7' | 'sus';
  intervals: { label: string; semitones: number; isOmitRecommended?: boolean }[];
}

export const HARMONIC_FAMILIES_CONFIG: Record<ChordExtensionFamily, ChordFormulaDefinition[]> = {
  // 1. TRÍADAS (R - 3 - 5)
  triad: [
    { degreeIndex: 0, roman: 'I', labelSuffix: '', fullNameSuffix: 'Mayor', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm', fullNameSuffix: 'menor', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm', fullNameSuffix: 'menor', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: '', fullNameSuffix: 'Mayor', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '', fullNameSuffix: 'Mayor', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm', fullNameSuffix: 'menor', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'dim', fullNameSuffix: 'disminuido', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }] },
  ],

  // 2. SÉPTIMAS (R - 3 - 5 - 7)
  seventh: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'maj7', fullNameSuffix: 'Maj7', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '7', semitones: 11 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm7', fullNameSuffix: 'menor 7', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm7', fullNameSuffix: 'menor 7', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'maj7', fullNameSuffix: 'Maj7', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '7', semitones: 11 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '7', fullNameSuffix: 'Dominante 7', chordType: 'dom7', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm7', fullNameSuffix: 'menor 7', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: 'b7', semitones: 10 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'm7b5', fullNameSuffix: 'Semidisminuido', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }, { label: 'b7', semitones: 10 }] },
  ],

  // 3. NOVENAS (R - 3 - [5 omitible] - 7 - 9)
  ninth: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'maj9', fullNameSuffix: 'Maj9', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '7', semitones: 11 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm9', fullNameSuffix: 'menor 9', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm(b9)', fullNameSuffix: 'menor (b9)', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: 'b9', semitones: 1 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'maj9', fullNameSuffix: 'Maj9', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '7', semitones: 11 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '9', fullNameSuffix: 'Dominante 9', chordType: 'dom7', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: 'b7', semitones: 10 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm9', fullNameSuffix: 'menor 9', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'dim(b9)', fullNameSuffix: 'disminuido (b9)', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }, { label: 'b7', semitones: 10 }, { label: 'b9', semitones: 1 }] },
  ],

  // 4. ONCENAS (Guitar-Friendly: 5ª Omitida, 4-5 notas limpias)
  eleventh: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'maj11', fullNameSuffix: 'Maj11 (sin 5ª)', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '7', semitones: 11 }, { label: '11', semitones: 5 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm11', fullNameSuffix: 'menor 11', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: '11', semitones: 5 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm11', fullNameSuffix: 'menor 11', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: '11', semitones: 5 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'maj7(#11)', fullNameSuffix: 'Maj7(#11) Lidio', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '7', semitones: 11 }, { label: '#11', semitones: 6 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '11', fullNameSuffix: 'Dominante 11 (9sus4)', chordType: 'dom7', intervals: [{ label: 'R', semitones: 0 }, { label: 'b7', semitones: 10 }, { label: '9', semitones: 2 }, { label: '11', semitones: 5 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm11', fullNameSuffix: 'menor 11', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: '11', semitones: 5 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'm7b5(11)', fullNameSuffix: 'Semidisminuido 11', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }, { label: 'b7', semitones: 10 }, { label: '11', semitones: 5 }] },
  ],

  // 5. TRECENAS (Guitar-Friendly: 5ª Omitida, voicing Shell/Drop cómodo)
  thirteenth: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'maj13', fullNameSuffix: 'Maj13 (sin 5ª)', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '7', semitones: 11 }, { label: '13', semitones: 9 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm13', fullNameSuffix: 'menor 13', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: '13', semitones: 9 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm7(b13)', fullNameSuffix: 'menor 7(b13)', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: 'b13', semitones: 8 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'maj13', fullNameSuffix: 'Maj13', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '7', semitones: 11 }, { label: '13', semitones: 9 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: '13', fullNameSuffix: 'Dominante 13 (sin 5ª)', chordType: 'dom7', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: 'b7', semitones: 10 }, { label: '13', semitones: 9 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm7(b13)', fullNameSuffix: 'menor 7(b13)', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b7', semitones: 10 }, { label: 'b13', semitones: 8 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'm7b5(b13)', fullNameSuffix: 'Semidisminuido b13', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }, { label: 'b7', semitones: 10 }, { label: 'b13', semitones: 8 }] },
  ],

  // 6. FAMILIA ADD (Tríadas con Color, Sin Séptima)
  added: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'add9', fullNameSuffix: 'add9', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'm(add9)', fullNameSuffix: 'menor add9', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'm(add11)', fullNameSuffix: 'menor add11', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: '11', semitones: 5 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'add9', fullNameSuffix: 'add9', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: 'add9', fullNameSuffix: 'add9', chordType: 'maj', intervals: [{ label: 'R', semitones: 0 }, { label: '3', semitones: 4 }, { label: '5', semitones: 7 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'm(add9)', fullNameSuffix: 'menor add9', chordType: 'min', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: '5', semitones: 7 }, { label: '9', semitones: 2 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'dim(add11)', fullNameSuffix: 'disminuido add11', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }, { label: '11', semitones: 5 }] },
  ],

  // 7. SUSPENDIDOS (sus2 / sus4)
  suspended: [
    { degreeIndex: 0, roman: 'I', labelSuffix: 'sus4', fullNameSuffix: 'sus4', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '4', semitones: 5 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 1, roman: 'ii', labelSuffix: 'sus2', fullNameSuffix: 'sus2', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '2', semitones: 2 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 2, roman: 'iii', labelSuffix: 'sus4', fullNameSuffix: 'sus4', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '4', semitones: 5 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 3, roman: 'IV', labelSuffix: 'sus2', fullNameSuffix: 'sus2', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '2', semitones: 2 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 4, roman: 'V', labelSuffix: 'sus4', fullNameSuffix: 'sus4', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '4', semitones: 5 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 5, roman: 'vi', labelSuffix: 'sus2', fullNameSuffix: 'sus2', chordType: 'sus', intervals: [{ label: 'R', semitones: 0 }, { label: '2', semitones: 2 }, { label: '5', semitones: 7 }] },
    { degreeIndex: 6, roman: 'vii°', labelSuffix: 'dim', fullNameSuffix: 'dim', chordType: 'dim', intervals: [{ label: 'R', semitones: 0 }, { label: 'b3', semitones: 3 }, { label: 'b5', semitones: 6 }] },
  ],
};

export interface CagedChordVoicing {
  degreeRoman: string;
  degreeName: string;
  chordName: string;
  fullName: string;
  chordType: 'maj' | 'min' | 'dim' | 'aug' | 'dom7' | 'sus';
  rootNote: string;
  extension?: ChordExtensionFamily;
  tonalityMode?: TonalityMode;
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
  eleventh: {
    // Caja 1 (Forma C)
    1: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '#11', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 3, intervalLabel: '11', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 2 (Forma A)
    2: {
      0: [
        { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '3', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '11', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 4, intervalLabel: '#11', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 3 (Forma G)
    3: {
      0: [
        { stringIndex: 5, fret: 8, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: '11', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '11', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 4, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '#11', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 2, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 4 (Forma E)
    4: {
      0: [
        { stringIndex: 5, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: '11', isRoot: false },
      ],
      1: [
        { stringIndex: 5, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '#11', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '11', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      5: [
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 3, intervalLabel: 'b3', isRoot: false },
      ],
      6: [
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 1, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 2, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 5 (Forma D)
    5: {
      0: [
        { stringIndex: 3, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 4, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 13, finger: 4, intervalLabel: '11', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 13, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      2: [
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '#11', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 4, intervalLabel: '3', isRoot: false },
      ],
      4: [
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 2, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 12, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },
  thirteenth: {
    // Caja 1 (Forma C)
    1: {
      0: [
        { stringIndex: 4, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '13', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '13', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b13', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: '13', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b13', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b13', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
    },
    // Caja 2 (Forma A)
    2: {
      0: [
        { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '13', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 3, intervalLabel: 'b7', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 4, intervalLabel: 'b13', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'b13', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'b13', isRoot: false },
      ],
    },
    // Caja 3 (Forma G)
    3: {
      0: [
        { stringIndex: 5, fret: 8, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 2, intervalLabel: '13', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
      ],
      1: [
        { stringIndex: 5, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '13', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b13', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      3: [
        { stringIndex: 5, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      4: [
        { stringIndex: 3, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 9, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b13', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: 'b7', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: 'b13', isRoot: false },
      ],
    },
    // Caja 4 (Forma E)
    4: {
      0: [
        { stringIndex: 5, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      1: [
        { stringIndex: 5, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '13', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 12, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 12, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 13, finger: 4, intervalLabel: 'b13', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      5: [
        { stringIndex: 3, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 3, intervalLabel: 'b13', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: 'b7', isRoot: false },
      ],
      6: [
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b13', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
    },
    // Caja 5 (Forma D)
    5: {
      0: [
        { stringIndex: 3, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 3, intervalLabel: '13', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '7', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 4, intervalLabel: '13', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 1, intervalLabel: 'b7', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 4, intervalLabel: 'b13', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '13', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 3, intervalLabel: '3', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '13', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b13', isRoot: false },
        { stringIndex: 1, fret: 12, finger: 4, intervalLabel: 'b7', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'b13', isRoot: false },
      ],
    },
  },
  added: {
    // Caja 1 (Forma C)
    1: {
      0: [
        { stringIndex: 4, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 2, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 4, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
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
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 2 (Forma A)
    2: {
      0: [
        { stringIndex: 4, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 6, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 2, intervalLabel: '11', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      4: [
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 3 (Forma G)
    3: {
      0: [
        { stringIndex: 5, fret: 8, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      1: [
        { stringIndex: 4, fret: 5, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 5, fret: 7, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 4, fret: 7, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      3: [
        { stringIndex: 5, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      6: [
        { stringIndex: 5, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 4 (Forma E)
    4: {
      0: [
        { stringIndex: 5, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      1: [
        { stringIndex: 5, fret: 10, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 12, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 4, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 4, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 8, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '11', isRoot: false },
      ],
      3: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 2, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 4, intervalLabel: '9', isRoot: false },
      ],
      5: [
        { stringIndex: 3, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 5, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      6: [
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 1, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 2, intervalLabel: '11', isRoot: false },
      ],
    },
    // Caja 5 (Forma D)
    5: {
      0: [
        { stringIndex: 3, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      1: [
        { stringIndex: 3, fret: 12, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 12, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      2: [
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 4, intervalLabel: '11', isRoot: false },
      ],
      3: [
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      4: [
        { stringIndex: 3, fret: 5, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 5, finger: 3, intervalLabel: '9', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 12, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '9', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b5', isRoot: false },
      ],
    },
  },
};

/**
 * Asigna la función interválica de cualquier nota en semitonos relativa a la tónica del acorde
 */
export function getIntervalLabel(
  noteName: string,
  chordRootNote: string,
  targetIntervals?: { label: string; semitones: number }[]
): string {
  const rootIdx = normalizeToChromaticIndex(chordRootNote);
  const noteIdx = normalizeToChromaticIndex(noteName);
  const semitones = (noteIdx - rootIdx + 12) % 12;

  if (targetIntervals && targetIntervals.length > 0) {
    const match = targetIntervals.find((ti) => (ti.semitones % 12) === semitones);
    if (match) return match.label;
  }

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
      return '11';
    case 6:
      return 'b5';
    case 7:
      return '5';
    case 8:
      return 'b13';
    case 9:
      return '13';
    case 10:
      return 'b7';
    case 11:
      return '7';
    default:
      return 'R';
  }
}

/**
 * Normaliza cualquier nombre de tónica (ej: Bb, B♭, Db, D♭, F#, C) a la escala cromática estándar de sostenidos
 */
function normalizeToChromaticIndex(root: string): number {
  const enharmonics: Record<string, string> = {
    Db: 'C#',
    'D♭': 'C#',
    Eb: 'D#',
    'E♭': 'D#',
    Gb: 'F#',
    'G♭': 'F#',
    Ab: 'G#',
    'A♭': 'G#',
    Bb: 'A#',
    'B♭': 'A#',
  };
  const standard = enharmonics[root] || root;
  const idx = CHROMATIC_NOTES.indexOf(standard as any);
  return idx === -1 ? 0 : idx;
}

const SHARP_TO_FLAT_SYMBOL: Record<string, string> = {
  'C#': 'D♭',
  'D#': 'E♭',
  'F#': 'G♭',
  'G#': 'A♭',
  'A#': 'B♭',
};

/**
 * Formatea el nombre de la nota fundamental del grado respetando la ortografía de bemoles (♭)
 * cuando el grado romano es bemol (ej. ♭III -> E♭, ♭VI -> A♭, ♭VII -> B♭)
 */
function formatDegreeRootNote(chromaticNote: string, roman: string): string {
  if (roman.includes('♭') && SHARP_TO_FLAT_SYMBOL[chromaticNote]) {
    return SHARP_TO_FLAT_SYMBOL[chromaticNote];
  }
  return chromaticNote;
}

/**
 * Calcula dinámicamente las fórmulas de los 7 grados para cualquier Modo de Tonalidad y Familia Armónica
 */
export function getFormulasForTonalityAndFamily(
  tonalityMode: TonalityMode = 'major',
  extension: ChordExtensionFamily = 'triad'
): ChordFormulaDefinition[] {
  const degrees = TONALITY_DEGREES_CATALOG[tonalityMode] || TONALITY_DEGREES_CATALOG.major;
  const scaleSemitones = degrees.map((d) => d.semitonesFromRoot);

  if (extension === 'triad') {
    return degrees.map((d) => ({
      degreeIndex: d.degreeIndex,
      roman: d.roman,
      labelSuffix: d.triadSuffix,
      fullNameSuffix: d.triadFullName,
      chordType: d.triadType,
      intervals: d.triadIntervals,
    }));
  }

  if (extension === 'seventh') {
    return degrees.map((d) => ({
      degreeIndex: d.degreeIndex,
      roman: d.roman,
      labelSuffix: d.seventhSuffix,
      fullNameSuffix: d.seventhFullName,
      chordType: d.seventhType,
      intervals: d.seventhIntervals,
    }));
  }

  if (tonalityMode === 'major') {
    return (HARMONIC_FAMILIES_CONFIG[extension] || HARMONIC_FAMILIES_CONFIG.triad).map(
      (item, idx) => ({
        ...item,
        roman: degrees[idx]?.roman || item.roman,
      })
    );
  }

  return degrees.map((d, idx) => {
    const ninthSemis = (scaleSemitones[(idx + 1) % 7] - d.semitonesFromRoot + 12) % 12;
    const eleventhSemis = (scaleSemitones[(idx + 3) % 7] - d.semitonesFromRoot + 12) % 12;
    const thirteenthSemis = (scaleSemitones[(idx + 5) % 7] - d.semitonesFromRoot + 12) % 12;

    const ninthLabel = ninthSemis === 1 ? 'b9' : ninthSemis === 3 ? '#9' : '9';
    const eleventhLabel = eleventhSemis === 6 ? '#11' : '11';
    const thirteenthLabel = thirteenthSemis === 8 ? 'b13' : '13';

    const thirdInt = d.triadIntervals[1] || { label: 'b3', semitones: 3 };
    const fifthInt = d.triadIntervals[2] || { label: '5', semitones: 7 };
    const seventhInt = d.seventhIntervals[3] || { label: 'b7', semitones: 10 };

    if (extension === 'ninth') {
      let suffix = `${d.seventhSuffix}(${ninthLabel})`;
      let fullName = `${d.seventhFullName} (${ninthLabel})`;
      if (ninthLabel === '9') {
        if (d.seventhSuffix === 'm7') {
          suffix = 'm9';
          fullName = 'menor 9';
        } else if (d.seventhSuffix === 'm(maj7)') {
          suffix = 'm(maj9)';
          fullName = 'menor (Maj9)';
        } else if (d.seventhSuffix === 'maj7') {
          suffix = 'maj9';
          fullName = 'Maj9';
        } else if (d.seventhSuffix === 'maj7(#5)') {
          suffix = 'maj9(#5)';
          fullName = 'Maj9(#5)';
        } else if (d.seventhSuffix === '7') {
          suffix = '9';
          fullName = 'Dominante 9';
        } else if (d.seventhSuffix === 'm7b5') {
          suffix = 'm9b5';
          fullName = 'Semidisminuido 9';
        }
      } else if (d.seventhSuffix === 'm7' && ninthLabel === 'b9') {
        suffix = 'm(b9)';
        fullName = 'menor (b9)';
      } else if (d.seventhSuffix === 'm7b5' && ninthLabel === 'b9') {
        suffix = 'dim(b9)';
        fullName = 'disminuido (b9)';
      }

      const intervals =
        fifthInt.label !== '5'
          ? [
              { label: 'R', semitones: 0 },
              thirdInt,
              fifthInt,
              seventhInt,
              { label: ninthLabel, semitones: ninthSemis },
            ]
          : [
              { label: 'R', semitones: 0 },
              thirdInt,
              seventhInt,
              { label: ninthLabel, semitones: ninthSemis },
            ];

      return {
        degreeIndex: idx,
        roman: d.roman,
        labelSuffix: suffix,
        fullNameSuffix: fullName,
        chordType: d.seventhType,
        intervals,
      };
    }

    if (extension === 'eleventh') {
      let suffix = `${d.seventhSuffix}(${eleventhLabel})`;
      let fullName = `${d.seventhFullName} (${eleventhLabel})`;
      if (eleventhLabel === '#11') {
        if (d.seventhType === 'dom7') {
          suffix = '7(#11)';
          fullName = 'Dominante 7(#11) Lidio';
        } else if (d.seventhSuffix === 'maj7') {
          suffix = 'maj7(#11)';
          fullName = 'Maj7(#11) Lidio';
        }
      } else {
        if (d.seventhSuffix === 'm7') {
          suffix = 'm11';
          fullName = 'menor 11';
        } else if (d.seventhSuffix === 'm(maj7)') {
          suffix = 'm(maj11)';
          fullName = 'menor (Maj11)';
        } else if (d.seventhSuffix === 'maj7') {
          suffix = 'maj11';
          fullName = 'Maj11 (sin 5ª)';
        } else if (d.seventhSuffix === '7') {
          suffix = '11';
          fullName = 'Dominante 11 (9sus4)';
        } else if (d.seventhSuffix === 'm7b5') {
          suffix = 'm7b5(11)';
          fullName = 'Semidisminuido 11';
        }
      }

      return {
        degreeIndex: idx,
        roman: d.roman,
        labelSuffix: suffix,
        fullNameSuffix: fullName,
        chordType: d.seventhType,
        intervals: [
          { label: 'R', semitones: 0 },
          thirdInt,
          seventhInt,
          { label: eleventhLabel, semitones: eleventhSemis },
        ],
      };
    }

    if (extension === 'thirteenth') {
      let suffix = `${d.seventhSuffix}(${thirteenthLabel})`;
      let fullName = `${d.seventhFullName} (${thirteenthLabel})`;
      if (thirteenthLabel === '13') {
        if (d.seventhSuffix === 'm7') {
          suffix = 'm13';
          fullName = 'menor 13';
        } else if (d.seventhSuffix === 'm(maj7)') {
          suffix = 'm(maj13)';
          fullName = 'menor (Maj13)';
        } else if (d.seventhSuffix === 'maj7') {
          suffix = 'maj13';
          fullName = 'Maj13';
        } else if (d.seventhSuffix === '7') {
          suffix = '13';
          fullName = 'Dominante 13';
        }
      } else if (d.seventhSuffix === '7' && thirteenthLabel === 'b13') {
        suffix = '7(b13)';
        fullName = 'Dominante 7(b13)';
      } else if (d.seventhSuffix === 'm7' && thirteenthLabel === 'b13') {
        suffix = 'm7(b13)';
        fullName = 'menor 7(b13)';
      }

      return {
        degreeIndex: idx,
        roman: d.roman,
        labelSuffix: suffix,
        fullNameSuffix: fullName,
        chordType: d.seventhType,
        intervals: [
          { label: 'R', semitones: 0 },
          thirdInt,
          seventhInt,
          { label: thirteenthLabel, semitones: thirteenthSemis },
        ],
      };
    }

    if (extension === 'added') {
      const useAdd9 = ninthSemis === 2;
      const addLabel = useAdd9 ? '9' : '11';
      const addSemis = useAdd9 ? 2 : eleventhSemis;
      const suffix =
        d.triadType === 'maj'
          ? `add${addLabel}`
          : `${d.triadSuffix}(add${addLabel})`;
      const fullName =
        d.triadType === 'maj'
          ? `add${addLabel}`
          : `${d.triadFullName} add${addLabel}`;

      return {
        degreeIndex: idx,
        roman: d.roman,
        labelSuffix: suffix,
        fullNameSuffix: fullName,
        chordType: d.triadType,
        intervals: [...d.triadIntervals, { label: addLabel, semitones: addSemis }],
      };
    }

    // 'suspended'
    if (d.triadType === 'dim' || d.triadType === 'aug') {
      return {
        degreeIndex: idx,
        roman: d.roman,
        labelSuffix: d.triadSuffix,
        fullNameSuffix: d.triadFullName,
        chordType: d.triadType,
        intervals: d.triadIntervals,
      };
    }

    const useSus4 = eleventhSemis === 5;
    const susLabel = useSus4 ? '4' : '2';
    const susSemis = useSus4 ? 5 : 2;
    return {
      degreeIndex: idx,
      roman: d.roman,
      labelSuffix: `sus${susLabel}`,
      fullNameSuffix: `sus${susLabel}`,
      chordType: 'sus',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: susLabel, semitones: susSemis },
        fifthInt,
      ],
    };
  });
}

/**
 * Voicings curados en Caja 1 (Forma C, trastes 0-4 en C) para modos menores donde la cuerda al aire
 * de Do Mayor requeriría bajar por debajo del traste 0.
 */
const BOX1_MINOR_CURATED_VOICINGS_C: Record<
  Exclude<TonalityMode, 'major'>,
  Record<'triad' | 'seventh', Partial<Record<number, RawNote[]>>>
> = {
  minor_natural: {
    triad: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 3, finger: 2, intervalLabel: '3', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: 'R', isRoot: true },
      ],
      5: [
        { stringIndex: 5, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
      ],
    },
    seventh: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 3, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      2: [
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 3, intervalLabel: '3', isRoot: false },
      ],
      4: [
        { stringIndex: 5, fret: 3, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 3, intervalLabel: '7', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
      ],
    },
  },
  minor_harmonic: {
    triad: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: '#5', isRoot: false },
        { stringIndex: 1, fret: 4, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 3, finger: 2, intervalLabel: '3', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '3', isRoot: false },
      ],
    },
    seventh: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: '#5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 3, intervalLabel: '3', isRoot: false },
      ],
      5: [
        { stringIndex: 5, fret: 4, finger: 4, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 3, intervalLabel: '7', isRoot: false },
      ],
      6: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'bb7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },
  minor_melodic: {
    triad: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: '#5', isRoot: false },
        { stringIndex: 1, fret: 4, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 3, finger: 2, intervalLabel: '3', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 1, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
    },
    seventh: {
      0: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      2: [
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 4, intervalLabel: '#5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 3, intervalLabel: '3', isRoot: false },
      ],
      3: [
        { stringIndex: 5, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      5: [
        { stringIndex: 4, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 1, finger: 1, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },
};

const INTERVAL_SEMITONES_LOOKUP: Record<string, number> = {
  R: 0,
  b9: 1,
  '9': 2,
  '2': 2,
  '#9': 3,
  b3: 3,
  '3': 4,
  '11': 5,
  '4': 5,
  '#11': 6,
  b5: 6,
  '5': 7,
  '#5': 8,
  b13: 8,
  '13': 9,
  '6': 9,
  bb7: 9,
  b7: 10,
  '7': 11,
};

/**
 * Adapta un voicing base de C Mayor al modo de tonalidad activo manteniendo los dedos dentro de la misma caja CAGED
 */
function adaptVoicingToTonalityMode(
  baseNotes: RawNote[],
  degIdx: number,
  boxId: number,
  tonalityMode: TonalityMode,
  extension: ChordExtensionFamily,
  targetFormula: ChordFormulaDefinition,
  isBass: boolean
): RawNote[] {
  if (tonalityMode === 'major') return baseNotes;

  if (
    !isBass &&
    boxId === 1 &&
    (extension === 'triad' || extension === 'seventh')
  ) {
    const curated = BOX1_MINOR_CURATED_VOICINGS_C[tonalityMode]?.[extension]?.[degIdx];
    if (curated && curated.length > 0) {
      return curated;
    }
  }

  const majorDeg = TONALITY_DEGREES_CATALOG.major[degIdx];
  const targetDeg = TONALITY_DEGREES_CATALOG[tonalityMode][degIdx];
  if (!majorDeg || !targetDeg) return baseNotes;

  const majorRootSemis = majorDeg.semitonesFromRoot;
  const targetRootSemis = targetDeg.semitonesFromRoot;

  const findSlotInterval = (oldLabel: string): { label: string; semitones: number } => {
    if (oldLabel === 'R') return { label: 'R', semitones: 0 };
    if (['3', 'b3', '2', '4'].includes(oldLabel)) {
      return (
        targetFormula.intervals.find((i) => ['3', 'b3', '2', '4'].includes(i.label)) ||
        targetDeg.triadIntervals[1] || { label: 'b3', semitones: 3 }
      );
    }
    if (['5', 'b5', '#5'].includes(oldLabel)) {
      return (
        targetFormula.intervals.find((i) => ['5', 'b5', '#5'].includes(i.label)) ||
        targetDeg.triadIntervals[2] || { label: '5', semitones: 7 }
      );
    }
    if (['7', 'b7', 'bb7'].includes(oldLabel)) {
      return (
        targetFormula.intervals.find((i) => ['7', 'b7', 'bb7'].includes(i.label)) ||
        targetDeg.seventhIntervals[3] || { label: 'b7', semitones: 10 }
      );
    }
    if (['9', 'b9', '#9'].includes(oldLabel)) {
      return (
        targetFormula.intervals.find((i) => ['9', 'b9', '#9', '11'].includes(i.label)) || {
          label: oldLabel,
          semitones: INTERVAL_SEMITONES_LOOKUP[oldLabel] ?? 2,
        }
      );
    }
    if (['11', '#11'].includes(oldLabel)) {
      return (
        targetFormula.intervals.find((i) => ['11', '#11', '9'].includes(i.label)) || {
          label: oldLabel,
          semitones: INTERVAL_SEMITONES_LOOKUP[oldLabel] ?? 5,
        }
      );
    }
    if (['13', 'b13', '6'].includes(oldLabel)) {
      return (
        targetFormula.intervals.find((i) => ['13', 'b13', '6'].includes(i.label)) || {
          label: oldLabel,
          semitones: INTERVAL_SEMITONES_LOOKUP[oldLabel] ?? 9,
        }
      );
    }
    return { label: oldLabel, semitones: INTERVAL_SEMITONES_LOOKUP[oldLabel] ?? 0 };
  };

  let hasShift = false;
  const adapted: RawNote[] = [];

  for (const n of baseNotes) {
    const oldSemis = INTERVAL_SEMITONES_LOOKUP[n.intervalLabel] ?? 0;
    const targetSlot = findSlotInterval(n.intervalLabel);

    const oldPitch = majorRootSemis + oldSemis;
    const newPitch = targetRootSemis + targetSlot.semitones;
    let delta = newPitch - oldPitch;
    if (delta > 6) delta -= 12;
    if (delta < -6) delta += 12;

    if (delta !== 0) hasShift = true;
    const newFret = n.fret + delta;

    if (newFret < 0) {
      // En Caja 1, omitir cuerda al aire que bajaría por debajo de la cejuela para no desfasar posición
      continue;
    }

    adapted.push({
      stringIndex: n.stringIndex,
      fret: newFret,
      finger: n.finger,
      intervalLabel: targetSlot.label,
      isRoot: targetSlot.label === 'R',
    });
  }

  if (!hasShift || adapted.length === 0) {
    return adapted.length > 0 ? adapted : baseNotes;
  }

  // Recalcular digitación ergonómica relativa a la posición de la mano cuando hay alteración de trastes
  const fretted = adapted.filter((n) => n.fret > 0);
  if (fretted.length === 0) return adapted;

  const minFret = Math.min(...fretted.map((n) => n.fret));
  return adapted.map((n) => {
    if (n.fret === 0) return { ...n, finger: 1 };
    const offset = n.fret - minFret;
    const finger = offset <= 0 ? 1 : offset === 1 ? 2 : offset === 2 ? 3 : 4;
    return { ...n, finger };
  });
}

/**
 * Voicings posicionales cerrados de los 7 acordes diatónicos para las 5 formas CAGED
 * Transponibles matemáticamente a las 12 tonalidades y con soporte dinámico de Modos de Tonalidad y Familias de Extensiones.
 */
export function getCagedDiatonicChords(
  keyRoot: string,
  boxId: number, // 1 a 5 (C, A, G, E, D)
  instrument: InstrumentType = 'guitar_6',
  extension: ChordExtensionFamily = 'triad',
  tonalityMode: TonalityMode = 'major'
): CagedChordVoicing[] {
  const safeRootIndex = normalizeToChromaticIndex(keyRoot);
  const transposeOffset = safeRootIndex; // C = 0, C# = 1, D = 2...

  const isBass = instrument === 'bass_4' || instrument === 'bass_5';
  const degreeCatalog = TONALITY_DEGREES_CATALOG[tonalityMode] || TONALITY_DEGREES_CATALOG.major;
  const familyConfigs = getFormulasForTonalityAndFamily(tonalityMode, extension);

  return familyConfigs.map((formulaDef, degIdx) => {
    const degConfig = degreeCatalog[degIdx] || degreeCatalog[0];
    const chordRootMidi = (safeRootIndex + degConfig.semitonesFromRoot) % 12;
    const rawRootName = CHROMATIC_NOTES[chordRootMidi];
    const chordRootName = formatDegreeRootNote(rawRootName, formulaDef.roman);
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

    if (tonalityMode !== 'major') {
      rawNotes = adaptVoicingToTonalityMode(
        rawNotes,
        degIdx,
        boxId,
        tonalityMode,
        extension,
        formulaDef,
        isBass
      );
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
      tonalityMode,
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

