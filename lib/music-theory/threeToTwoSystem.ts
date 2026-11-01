// ============================================================================
// SISTEMA 3 A 2 (THREE-TO-TWO SYSTEM) PARA DIAPASÓN
// 7 Patrones Ergonómicos que alternan 3 y 2 notas por cuerda (1-2-4 / 1-3-4 y 1-3 / 1-4)
// ============================================================================

import {
  InstrumentType,
  INSTRUMENTS,
  CHROMATIC_NOTES,
  ChromaticNote,
  ScaleKey,
  getFretNote,
  NoteRole,
} from './fretboard';
import { ActiveFretNote } from '@/components/fretboard/InteractiveFretboard';
import { ALL_SCALES_CATALOG, ScaleFormula } from './scaleDefinitions';
import { assignFingersToString, SystemPatternDefinition } from './scaleSystems';
import {
  CagedChordVoicing,
  ChordExtensionFamily,
  TonalityMode,
  getCagedDiatonicChords,
} from './cagedHarmonics';

export interface ThreeToTwoPatternDef {
  id: string;
  name: string;
  patternIndex: number; // 1 a 7
  shortLabel: string;   // e.g. "P1 (3-2)", "P2 (2-3)", ...
  stringDistribution: (2 | 3)[]; // de 6ª cuerda a 1ª cuerda, e.g. [3, 2, 3, 2, 3, 2]
  description: string;
  baseMinFret: number;
  baseMaxFret: number;
  baseFretOffset: number;
}

export const THREE_TO_TWO_PATTERNS: ThreeToTwoPatternDef[] = [
  {
    id: '32_p1',
    patternIndex: 1,
    name: 'Patrón 1',
    shortLabel: 'P1 (3-2)',
    stringDistribution: [3, 2, 3, 2, 3, 2],
    description: 'Inicio en 6ª cuerda con 3 notas. Patrón fundamental ergonómico.',
    baseMinFret: 0,
    baseMaxFret: 4,
    baseFretOffset: 0,
  },
  {
    id: '32_p2',
    patternIndex: 2,
    name: 'Patrón 2',
    shortLabel: 'P2 (2-3)',
    stringDistribution: [2, 3, 2, 3, 2, 3],
    description: 'Inicio en 6ª cuerda con 2 notas. Conexión cerrada y ágil.',
    baseMinFret: 2,
    baseMaxFret: 6,
    baseFretOffset: 0,
  },
  {
    id: '32_p3',
    patternIndex: 3,
    name: 'Patrón 3',
    shortLabel: 'P3 (3-3-2)',
    stringDistribution: [3, 3, 2, 3, 2, 2],
    description: 'Bloque grave expandido. Excelente para arpegios y barridos.',
    baseMinFret: 4,
    baseMaxFret: 8,
    baseFretOffset: 1,
  },
  {
    id: '32_p4',
    patternIndex: 4,
    name: 'Patrón 4',
    shortLabel: 'P4 (2-2-3)',
    stringDistribution: [2, 2, 3, 2, 3, 3],
    description: 'Bloque agudo expandido. Máxima velocidad en cuerdas agudas.',
    baseMinFret: 7,
    baseMaxFret: 11,
    baseFretOffset: 0,
  },
  {
    id: '32_p5',
    patternIndex: 5,
    name: 'Patrón 5',
    shortLabel: 'P5 (3-2-2)',
    stringDistribution: [3, 2, 2, 3, 2, 3],
    description: 'Conexión intermedia. Equilibrado para líneas melódicas modernas.',
    baseMinFret: 8,
    baseMaxFret: 13,
    baseFretOffset: 1,
  },
  {
    id: '32_p6',
    patternIndex: 6,
    name: 'Patrón 6',
    shortLabel: 'P6 (2-3-3)',
    stringDistribution: [2, 3, 3, 2, 3, 2],
    description: 'Enfoque melódico central con transiciones fluidas de mano izquierda.',
    baseMinFret: 10,
    baseMaxFret: 15,
    baseFretOffset: 0,
  },
  {
    id: '32_p7',
    patternIndex: 7,
    name: 'Patrón 7',
    shortLabel: 'P7 (3-3-3)',
    stringDistribution: [3, 2, 3, 3, 2, 2],
    description: 'Resolución a la octava. Enlace directo de regreso a la posición 1.',
    baseMinFret: 12,
    baseMaxFret: 17,
    baseFretOffset: 0,
  },
];

export const THREE_TO_TWO_SYSTEM_PATTERNS: SystemPatternDefinition[] = THREE_TO_TWO_PATTERNS.map((p) => ({
  id: p.patternIndex,
  name: p.name,
  shortLabel: p.shortLabel,
  description: p.description,
  minFret: p.baseMinFret,
  maxFret: p.baseMaxFret,
}));

export function getThreeToTwoPattern(patternIdOrIndex: string | number): ThreeToTwoPatternDef {
  if (typeof patternIdOrIndex === 'number') {
    return (
      THREE_TO_TWO_PATTERNS.find((p) => p.patternIndex === patternIdOrIndex) ||
      THREE_TO_TWO_PATTERNS[0]
    );
  }
  return (
    THREE_TO_TWO_PATTERNS.find((p) => p.id === patternIdOrIndex) ||
    THREE_TO_TWO_PATTERNS.find((p) => p.patternIndex === parseInt(patternIdOrIndex, 10)) ||
    THREE_TO_TWO_PATTERNS[0]
  );
}

/**
 * Calcula las notas, grados y digitaciones para un patrón del Sistema 3 a 2
 */
export function calculateThreeToTwoNotes(
  instrument: InstrumentType,
  rootNote: string,
  scaleKey: ScaleKey,
  patternIdOrIndex: string | number
): { notes: ActiveFretNote[]; fretRange: [number, number]; boxBaseFret: number } {
  const config = INSTRUMENTS[instrument];
  const totalFrets = config.totalFrets;
  const pattern = getThreeToTwoPattern(patternIdOrIndex);

  const formula: ScaleFormula = ALL_SCALES_CATALOG[scaleKey] || ALL_SCALES_CATALOG.major;

  const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
  const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

  let minFret = pattern.baseMinFret + shift;
  let maxFret = pattern.baseMaxFret + shift;

  if (maxFret > totalFrets) {
    minFret -= 12;
    maxFret -= 12;
  } else if (minFret < 0) {
    minFret += 12;
    maxFret += 12;
  }

  const boxBaseFret = minFret === 0 ? 1 : minFret + pattern.baseFretOffset;
  const notes: ActiveFretNote[] = [];

  for (let sIdx = 0; sIdx < config.strings.length; sIdx++) {
    const str = config.strings[sIdx];
    const candidateFrets: number[] = [];
    const fretDataMap = new Map<
      number,
      {
        note: string;
        interval: string;
        role: NoteRole;
        isRoot: boolean;
        midi: number;
      }
    >();

    const startFret = Math.max(0, minFret);
    const endFret = Math.min(totalFrets, maxFret);

    for (let fret = startFret; fret <= endFret; fret++) {
      const fn = getFretNote(str.midi, fret);
      const noteIdx = CHROMATIC_NOTES.indexOf(fn.note);
      const semitones = (noteIdx - targetRootIdx + 12) % 12;

      const intervalIdx = formula.intervals.indexOf(semitones);

      if (intervalIdx !== -1) {
        candidateFrets.push(fret);
        const degree = formula.degrees[intervalIdx];

        let role: NoteRole = 'other';
        if (degree === 'R') {
          role = 'root';
        } else if (degree.includes('3')) {
          role = 'third';
        } else if (degree.includes('5')) {
          role = 'fifth';
        } else if (degree.includes('7')) {
          role = 'seventh';
        }

        fretDataMap.set(fret, {
          note: fn.note,
          interval: degree,
          role,
          isRoot: semitones === 0,
          midi: fn.midi,
        });
      }
    }

    // Aplicar distribución 3 a 2 de cuerdas
    // stringDistribution va de 6ª cuerda a 1ª cuerda
    const distIdx = (config.strings.length - 1) - sIdx;
    const targetCount = pattern.stringDistribution[distIdx % pattern.stringDistribution.length] || 2;

    let validFretsForString = candidateFrets;
    if (candidateFrets.length > targetCount) {
      // Filtrar a las targetCount notas más centradas en el bloque de 4 trastes alrededor de boxBaseFret
      const scored = candidateFrets.map((fret) => {
        const distFromBase = Math.abs(fret - (boxBaseFret + 1.5));
        return { fret, distFromBase };
      });
      scored.sort((a, b) => a.distFromBase - b.distFromBase);
      validFretsForString = scored
        .slice(0, targetCount)
        .map((s) => s.fret)
        .sort((a, b) => a - b);
    }

    const fingerAssignments = assignFingersToString(
      validFretsForString,
      boxBaseFret,
      'caged'
    );

    validFretsForString.forEach((fret) => {
      const data = fretDataMap.get(fret)!;
      const fa = fingerAssignments.get(fret) || { finger: 0, isStretch: false };

      notes.push({
        stringIndex: sIdx,
        fret,
        note: data.note,
        interval: data.interval,
        role: data.role,
        fingerAssignment: fa,
        midi: data.midi,
      });
    });
  }

  return {
    notes,
    fretRange: [Math.max(0, minFret), Math.min(totalFrets, maxFret)],
    boxBaseFret,
  };
}

/**
 * Genera el voicing de acorde y notas de paso dentro del patrón 3 a 2 seleccionado.
 */
export function getThreeToTwoChordVoicing(
  rootNote: string,
  tonalityMode: TonalityMode,
  chordDegreeIndex: number,
  extensionFamily: ChordExtensionFamily,
  patternIdOrIndex: string | number,
  instrument: InstrumentType = 'guitar_6'
): CagedChordVoicing {
  const pattern = getThreeToTwoPattern(patternIdOrIndex);
  const baseDiatonic = getCagedDiatonicChords(
    rootNote,
    1,
    instrument,
    extensionFamily,
    tonalityMode
  );
  const baseChord = baseDiatonic[chordDegreeIndex] || baseDiatonic[0];

  // Calculamos las notas de la escala en este patrón 3 a 2 para obtener el rango y notas de paso
  const scaleKey: ScaleKey =
    tonalityMode === 'dorian'
      ? 'dorian'
      : tonalityMode === 'phrygian'
      ? 'phrygian'
      : tonalityMode === 'lydian'
      ? 'lydian'
      : tonalityMode === 'mixolydian'
      ? 'mixolydian'
      : tonalityMode === 'aeolian'
      ? 'minor_natural'
      : tonalityMode === 'locrian'
      ? 'locrian'
      : tonalityMode === 'minor_harmonic'
      ? 'harmonic_minor'
      : tonalityMode === 'minor_melodic'
      ? 'melodic_minor'
      : 'major';

  const scaleResult = calculateThreeToTwoNotes(instrument, rootNote, scaleKey, pattern.patternIndex);
  const config = INSTRUMENTS[instrument];

  // Encontramos los tonos del acorde que caen en este patrón 3 a 2
  const chordNotes: {
    stringIndex: number;
    fret: number;
    finger: number;
    intervalLabel: string;
    isRoot: boolean;
  }[] = [];

  const audioNotes: {
    stringIndex: number;
    fret: number;
    midi: number;
  }[] = [];

  // Recorremos las cuerdas buscando las notas del acorde en este patrón
  for (let sIdx = 0; sIdx < config.strings.length; sIdx++) {
    const scaleNotesOnString = scaleResult.notes.filter((n) => n.stringIndex === sIdx);
    // Priorizamos tónica, tercera, quinta, séptima
    const chordTone =
      scaleNotesOnString.find((n) => n.role === 'root') ||
      scaleNotesOnString.find((n) => n.role === 'third') ||
      scaleNotesOnString.find((n) => n.role === 'seventh') ||
      scaleNotesOnString.find((n) => n.role === 'fifth') ||
      scaleNotesOnString[0];

    if (chordTone) {
      chordNotes.push({
        stringIndex: sIdx,
        fret: chordTone.fret,
        finger: chordTone.fingerAssignment?.finger || 1,
        intervalLabel: chordTone.interval,
        isRoot: chordTone.role === 'root',
      });

      audioNotes.push({
        stringIndex: sIdx,
        fret: chordTone.fret,
        midi: chordTone.midi,
      });
    }
  }

  return {
    ...(baseChord || {
      degreeRoman: 'I',
      degreeName: 'Tónica',
      chordName: rootNote,
      fullName: `${rootNote} Mayor`,
      chordType: 'maj' as const,
      rootNote,
    }),
    chordName: `${baseChord?.chordName || rootNote} [3-2]`,
    notes: chordNotes.length > 0 ? chordNotes : baseChord?.notes || [],
  };
}

// ============================================================================
// DIGITACIONES DIAGONALES 3 A 2 (SHIFTING HORIZONTAL A LO LARGO DEL MÁSTIL)
// ============================================================================

export type ThreeToTwoLayoutMode = 'vertical' | 'diagonal_asc' | 'diagonal_desc';

export interface DiagonalNode {
  stringIndex: number; // 5 (6ª cuerda) a 0 (1ª cuerda)
  fret: number;
  note: string;
  finger: number; // 1, 2, 3, 4
  isShiftPoint?: boolean; // Indica si en esa nota se realiza el cambio de posición de la mano
}

export interface ThreeToTwoDiagonalTrack {
  id: string;
  name: string;
  description: string;
  direction: 'ascending' | 'descending';
  startFretRange: [number, number];
  endFretRange: [number, number];
  calculateNodes: (rootNote: string, scaleNotes: string[], startingFret: number) => DiagonalNode[];
}

export const THREE_TO_TWO_DIAGONAL_TRACKS: ThreeToTwoDiagonalTrack[] = [
  {
    id: 'diag_asc_6to1',
    name: 'Diagonal Mayor (Tr. 3 al 15)',
    description: 'Avanza 2 trastes por cuerda alternando 3 y 2 notas con shift de dedo 1.',
    direction: 'ascending',
    startFretRange: [3, 7],
    endFretRange: [12, 15],
    calculateNodes: (rootNote: string, _scaleNotes: string[], _startingFret: number): DiagonalNode[] => {
      const res = calculateThreeToTwoDiagonalNotes('guitar_6', rootNote, 'major', 'ascending', 1);
      return res.notes.map((n) => ({
        stringIndex: n.stringIndex,
        fret: n.fret,
        note: n.note,
        finger: n.fingerAssignment?.finger || 1,
        isShiftPoint: n.isShiftPoint,
      }));
    },
  },
  {
    id: 'diag_pentatonic_connect',
    name: 'Diagonal Pentatónica + Notas de Paso',
    description: 'Conecta 3 cajas consecutivas a través de slides/cambios de posición en cuerdas 4ª y 2ª.',
    direction: 'ascending',
    startFretRange: [5, 8],
    endFretRange: [12, 15],
    calculateNodes: (rootNote: string, _scaleNotes: string[], _startingFret: number): DiagonalNode[] => {
      const res = calculateThreeToTwoDiagonalNotes('guitar_6', rootNote, 'pentatonic_minor', 'ascending', 1);
      return res.notes.map((n) => ({
        stringIndex: n.stringIndex,
        fret: n.fret,
        note: n.note,
        finger: n.fingerAssignment?.finger || 1,
        isShiftPoint: n.isShiftPoint,
      }));
    },
  },
];

/**
 * Calcula las notas, intervalos, roles y digitaciones para un recorrido diagonal
 * a lo largo de todo el diapasón (ascendente o descendente) alternando 3 y 2 notas por cuerda.
 */
export function calculateThreeToTwoDiagonalNotes(
  instrument: InstrumentType,
  rootNote: string,
  scaleKey: ScaleKey,
  direction: 'ascending' | 'descending' = 'ascending',
  patternIdOrIndex: string | number = 1
): { notes: ActiveFretNote[]; fretRange: [number, number]; boxBaseFret: number } {
  const config = INSTRUMENTS[instrument];
  const totalFrets = config.totalFrets;
  const pattern = getThreeToTwoPattern(patternIdOrIndex);
  const formula: ScaleFormula = ALL_SCALES_CATALOG[scaleKey] || ALL_SCALES_CATALOG.major;

  const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
  const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

  const numStrings = config.strings.length;

  // Encontrar el traste ancla en la cuerda más grave (6ª cuerda en guitarra, 4ª en bajo)
  let anchorFret = (pattern.baseMinFret + shift) % 12;
  if (anchorFret < 1) anchorFret += 12;

  if (direction === 'ascending') {
    while (anchorFret > 5 && anchorFret - 12 >= 1) {
      anchorFret -= 12;
    }
  } else {
    while (anchorFret < 11 && anchorFret + 12 <= totalFrets - 4) {
      anchorFret += 12;
    }
  }

  const notes: ActiveFretNote[] = [];
  let prevFirstFret = anchorFret;

  for (let sFromBass = 0; sFromBass < numStrings; sFromBass++) {
    const sIdx = (numStrings - 1) - sFromBass;
    const str = config.strings[sIdx];
    const targetCount = pattern.stringDistribution[sFromBass % pattern.stringDistribution.length] || 2;

    let idealStartFret: number;
    if (sFromBass === 0) {
      idealStartFret = anchorFret;
    } else if (direction === 'ascending') {
      idealStartFret = prevFirstFret + 2;
    } else {
      idealStartFret = Math.max(1, prevFirstFret - 2);
    }

    if (direction === 'ascending' && idealStartFret > totalFrets - 4) {
      idealStartFret = Math.max(1, idealStartFret - 12);
    }

    const validScaleFrets: {
      fret: number;
      note: string;
      interval: string;
      role: NoteRole;
      isRoot: boolean;
      midi: number;
    }[] = [];

    for (let f = 0; f <= totalFrets; f++) {
      const fn = getFretNote(str.midi, f);
      const noteIdx = CHROMATIC_NOTES.indexOf(fn.note);
      const semitones = (noteIdx - targetRootIdx + 12) % 12;
      const intervalIdx = formula.intervals.indexOf(semitones);

      if (intervalIdx !== -1) {
        const degree = formula.degrees[intervalIdx];
        let role: NoteRole = 'other';
        if (degree === 'R') role = 'root';
        else if (degree.includes('3')) role = 'third';
        else if (degree.includes('5')) role = 'fifth';
        else if (degree.includes('7')) role = 'seventh';

        validScaleFrets.push({
          fret: f,
          note: fn.note,
          interval: degree,
          role,
          isRoot: semitones === 0,
          midi: fn.midi,
        });
      }
    }

    let chosenCandidateFrets = validScaleFrets.filter((item) => item.fret >= idealStartFret);
    if (chosenCandidateFrets.length < targetCount) {
      chosenCandidateFrets = validScaleFrets.slice(-targetCount);
    } else {
      chosenCandidateFrets = chosenCandidateFrets.slice(0, targetCount);
    }

    if (chosenCandidateFrets.length === 0) continue;

    const firstFret = chosenCandidateFrets[0].fret;
    const isShiftString = sFromBass > 0;

    const fingers: number[] = [];
    if (chosenCandidateFrets.length === 3) {
      const d1 = chosenCandidateFrets[1].fret - chosenCandidateFrets[0].fret;
      const d2 = chosenCandidateFrets[2].fret - chosenCandidateFrets[1].fret;
      if (d1 === 1 && d2 === 2) {
        fingers.push(1, 2, 4);
      } else if (d1 === 2 && d2 === 1) {
        fingers.push(1, 3, 4);
      } else {
        fingers.push(1, 2, 4);
      }
    } else if (chosenCandidateFrets.length === 2) {
      const d = chosenCandidateFrets[1].fret - chosenCandidateFrets[0].fret;
      if (d <= 2) {
        fingers.push(1, 3);
      } else {
        fingers.push(1, 4);
      }
    } else {
      fingers.push(1);
    }

    chosenCandidateFrets.forEach((item, idx) => {
      const isShiftPoint = isShiftString && idx === 0;
      notes.push({
        stringIndex: sIdx,
        fret: item.fret,
        note: item.note,
        interval: item.interval,
        role: item.role,
        fingerAssignment: {
          finger: fingers[idx] || 1,
          isStretch: false,
        },
        finger: String(fingers[idx] || 1),
        isShiftPoint,
        midi: item.midi,
      });
    });

    prevFirstFret = firstFret;
  }

  const allFrets = notes.map((n) => n.fret);
  const minFret = allFrets.length > 0 ? Math.min(...allFrets) : 0;
  const maxFret = allFrets.length > 0 ? Math.max(...allFrets) : 12;

  return {
    notes,
    fretRange: [minFret, maxFret],
    boxBaseFret: minFret,
  };
}

