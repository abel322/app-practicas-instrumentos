// ============================================================================
// 20 ESTUDIOS AVANZADOS DE PÚA ALTERNADA (AP-01 a AP-20) ESTILO GUITAR AEROBICS
// 32 Compases por Estudio • Cifrado por Compás (chordSymbol) • Dedos (1-4)
// Púa Alterna Estricta (down: Π / up: V) • Carpeta: "Púa Alternada"
// Respeto Tonal Estricto: Escala Mayor, Pentatónica Mayor, Escala Menor,
// Pentatónica Menor y Arpegios Avanzados en Cuerdas Adyacentes (Sin Sweep)
// ============================================================================

import { StringExerciseData, StringMeasureData, StringTabNote } from '../../types/strings';
import { PrismaClient } from '@prisma/client';

// ============================================================================
// DICCIONARIO TONAL Y AFINACIÓN ESTÁNDAR DE GUITARRA (E A D G B E)
// ============================================================================

export const OPEN_STRING_MIDI: Record<number, number> = {
  1: 64, // e4
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2
};

/**
 * Clases de altura MIDI permitidas (0..11) para cada acorde base (chordSymbol).
 * 0=C, 1=C#, 2=D, 3=Eb, 4=E, 5=F, 6=F#, 7=G, 8=G#/Ab, 9=A, 10=Bb, 11=B
 */
export const CHORD_ALLOWED_PITCH_CLASSES: Record<string, number[]> = {
  // --- Acordes Mayores y Maj7 (Escala Mayor, Pentatónica Mayor, Maj7, Add9) ---
  'C':      [0, 2, 4, 5, 7, 9, 11],
  'Cmaj7':  [0, 2, 4, 5, 7, 9, 11],
  'F':      [5, 7, 9, 10, 0, 2, 4],
  'Fmaj7':  [5, 7, 9, 10, 0, 2, 4],
  'G':      [7, 9, 11, 0, 2, 4, 6],
  'Gmaj7':  [7, 9, 11, 0, 2, 4, 6],
  'Bb':     [10, 0, 2, 3, 5, 7, 9],
  'Bbmaj7': [10, 0, 2, 3, 5, 7, 9],
  'Eb':     [3, 5, 7, 8, 10, 0, 2],
  'Ebmaj7': [3, 5, 7, 8, 10, 0, 2],
  'D':      [2, 4, 6, 7, 9, 11, 1],
  'Dmaj7':  [2, 4, 6, 7, 9, 11, 1],
  'A':      [9, 11, 1, 2, 4, 6, 8],
  'Amaj7':  [9, 11, 1, 2, 4, 6, 8],
  'E':      [4, 6, 8, 9, 11, 1, 2, 3], // E Mayor / Mixolidio

  // --- Acordes Menores y m7 (Escala Menor Eólica/Dórica, Pentatónica Menor, m7, m9) ---
  'Am':     [9, 11, 0, 2, 4, 5, 7],
  'Am7':    [9, 11, 0, 2, 4, 5, 7],
  'Dm':     [2, 4, 5, 7, 9, 10, 0],
  'Dm7':    [2, 4, 5, 7, 9, 10, 0],
  'Em':     [4, 6, 7, 9, 11, 0, 2],
  'Em7':    [4, 6, 7, 9, 11, 0, 2],
  'Bm':     [11, 1, 2, 4, 6, 7, 9],
  'Bm7':    [11, 1, 2, 4, 6, 7, 9],
  'F#m':    [6, 8, 9, 11, 1, 2, 4],
  'F#m7':   [6, 8, 9, 11, 1, 2, 4],
  'Cm':     [0, 2, 3, 5, 7, 8, 10],
  'Cm7':    [0, 2, 3, 5, 7, 8, 10],
  'Fm':     [5, 7, 8, 10, 0, 1, 3],
  'Fm7':    [5, 7, 8, 10, 0, 1, 3],
  'Gm':     [7, 9, 10, 0, 2, 3, 5],
  'Gm7':    [7, 9, 10, 0, 2, 3, 5],

  // --- Acordes Dominantes (Mixolidio + Blue Notes / Arpegio Dominante 1-3-5-b7) ---
  'G7':     [7, 9, 10, 11, 0, 1, 2, 4, 5], // G, A, Bb(blue), B, C, C#(blue), D, E, F
  'C7':     [0, 2, 3, 4, 5, 6, 7, 9, 10],  // C, D, Eb(blue), E, F, F#(blue), G, A, Bb
  'D7':     [2, 4, 5, 6, 7, 8, 9, 11, 0],  // D, E, F(blue), F#, G, G#(blue), A, B, C
  'E7':     [4, 6, 7, 8, 9, 11, 0, 1, 2],  // E, F#, G(blue), G#, A, B, C(alt), C#, D
  'A7':     [9, 11, 0, 1, 2, 3, 4, 6, 7],  // A, B, C(blue), C#, D, D#(blue), E, F#, G
  'Bb7':    [10, 0, 1, 2, 3, 4, 5, 7, 8],  // Bb, C, Db(blue), D, Eb, E(blue), F, G, Ab
};

export function getNoteMidi(stringNum: number, fret: number): number {
  return (OPEN_STRING_MIDI[stringNum] || 40) + fret;
}

export function getNotePitchClass(stringNum: number, fret: number): number {
  return getNoteMidi(stringNum, fret) % 12;
}

export function isValidChordNote(chord: string, stringNum: number, fret: number): boolean {
  const allowed = CHORD_ALLOWED_PITCH_CLASSES[chord];
  if (!allowed) return true;
  return allowed.includes(getNotePitchClass(stringNum, fret));
}

export function findNearestValidFret(chord: string, stringNum: number, targetFret: number): number {
  const allowed = CHORD_ALLOWED_PITCH_CLASSES[chord];
  if (!allowed || isValidChordNote(chord, stringNum, targetFret)) return targetFret;

  for (let offset = 1; offset <= 5; offset++) {
    if (targetFret - offset >= 0 && isValidChordNote(chord, stringNum, targetFret - offset)) {
      return targetFret - offset;
    }
    if (targetFret + offset <= 24 && isValidChordNote(chord, stringNum, targetFret + offset)) {
      return targetFret + offset;
    }
  }
  return targetFret;
}

/**
 * Validador armónico estricto que ajusta cualquier traste fuera de escala/arpegio
 * al grado diatónico permitido más próximo.
 */
export function enforceTonalValidation(
  chord: string,
  notes: { string: number; fret: number; finger?: string; pick?: 'down' | 'up' }[]
): { string: number; fret: number; finger: string; pick?: 'down' | 'up' }[] {
  return notes.map((n) => {
    const validFret = findNearestValidFret(chord, n.string, n.fret);
    const finger = n.finger || (validFret % 4 === 0 ? '4' : validFret % 3 === 0 ? '3' : validFret % 2 === 0 ? '2' : '1');
    return {
      string: n.string,
      fret: validFret,
      finger,
      pick: n.pick,
    };
  });
}

export interface ExerciseBlueprint {
  code: string;
  slug: string;
  title: string;
  bpm: number;
  description: string;
  category: string;
  difficulty: 'Avanzado';
  progression: { chord: string; measures: number }[];
  generateNotes: (measureIndex: number, chord: string, globalStepOffset: number) => StringTabNote[];
}

/**
 * Helper para generar 16 semicorcheas con púa alternada estricta (down / up)
 */
export function createMeasure16Notes(
  measureIndex: number,
  globalStepOffset: number,
  chord: string,
  noteDefs: { string: number; fret: number; finger?: string; pick?: 'down' | 'up' }[],
  initialPick: 'down' | 'up' = 'down'
): StringTabNote[] {
  const validated = enforceTonalValidation(chord, noteDefs);
  return validated.map((def, stepInMeasure) => {
    const isEven = stepInMeasure % 2 === 0;
    const defaultPick = initialPick === 'down' ? (isEven ? 'down' : 'up') : (isEven ? 'up' : 'down');
    const pickDirection = def.pick || defaultPick;

    return {
      step: globalStepOffset + stepInMeasure,
      stepIndex: stepInMeasure,
      measureIndex,
      string: def.string,
      fret: def.fret,
      finger: def.finger,
      pickDirection,
      duration: '16n',
      velocity: isEven ? 0.95 : 0.85,
      technique: 'normal',
    };
  });
}

// ============================================================================
// DEFINICIÓN DE LOS 20 BLUEPRINTS MUSICALES DE 32 COMPASES
// ============================================================================

export const BLUEPRINTS: ExerciseBlueprint[] = [
  // --------------------------------------------------------------------------
  // AP-01 • Workout Pentatónica Mayor & Blues en Sol (112 BPM)
  // G7 (8c) -> C7 (4c) -> G7 (4c) -> D7 (2c) -> C7 (2c) -> G7 (4c) -> D7 (4c) -> G7 (4c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-01',
    slug: 'ap-01-workout-blues-sol-outside-inside',
    title: 'AP-01 • Workout Pentatónica Mayor & Blues en Sol (Outside/Inside) — 32 Compases',
    bpm: 112,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Estudio de resistencia de 32 compases sobre blues en Sol (G7, C7, D7). Motivo mixolidio con blue notes (Bb y C#) combinando outside e inside picking estricto.',
    progression: [
      { chord: 'G7', measures: 8 },
      { chord: 'C7', measures: 4 },
      { chord: 'G7', measures: 4 },
      { chord: 'D7', measures: 2 },
      { chord: 'C7', measures: 2 },
      { chord: 'G7', measures: 4 },
      { chord: 'D7', measures: 4 },
      { chord: 'G7', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const baseFret = chord === 'C7' ? 8 : chord === 'D7' ? 10 : 3;
      const variation = mIdx % 2 === 0;

      if (variation) {
        // Fraseo ascendente a través de cuerdas adyacentes
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: baseFret, finger: '1' },
          { string: 6, fret: baseFret + 3, finger: '4' },
          { string: 5, fret: baseFret, finger: '1' },
          { string: 5, fret: baseFret + 1, finger: '2' },
          { string: 5, fret: baseFret + 2, finger: '3' },
          { string: 4, fret: baseFret, finger: '1' },
          { string: 4, fret: baseFret + 2, finger: '3' },
          { string: 3, fret: baseFret, finger: '1' },
          { string: 3, fret: baseFret + 2, finger: '3' },
          { string: 3, fret: baseFret + 3, finger: '4' },
          { string: 2, fret: baseFret, finger: '1' },
          { string: 2, fret: baseFret + 3, finger: '4' },
          { string: 1, fret: baseFret, finger: '1' },
          { string: 1, fret: baseFret + 3, finger: '4' },
          { string: 2, fret: baseFret + 3, finger: '4' },
          { string: 3, fret: baseFret + 2, finger: '3' },
        ]);
      } else {
        // Fraseo descendente y resolución
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 1, fret: baseFret + 3, finger: '4' },
          { string: 1, fret: baseFret, finger: '1' },
          { string: 2, fret: baseFret + 3, finger: '4' },
          { string: 2, fret: baseFret, finger: '1' },
          { string: 3, fret: baseFret + 2, finger: '3' },
          { string: 3, fret: baseFret, finger: '1' },
          { string: 4, fret: baseFret + 2, finger: '3' },
          { string: 4, fret: baseFret, finger: '1' },
          { string: 5, fret: baseFret + 2, finger: '3' },
          { string: 5, fret: baseFret + 1, finger: '2' },
          { string: 5, fret: baseFret, finger: '1' },
          { string: 6, fret: baseFret + 3, finger: '4' },
          { string: 6, fret: baseFret, finger: '1' },
          { string: 5, fret: baseFret + 2, finger: '3' },
          { string: 4, fret: baseFret + 2, finger: '3' },
          { string: 3, fret: baseFret + 2, finger: '3' },
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-02 • Workout Escala Mayor por Cuartas (C, F, Bb, Eb Mayor) (116 BPM)
  // Cmaj7 (8c) -> Fmaj7 (8c) -> Bbmaj7 (8c) -> Ebmaj7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-02',
    slug: 'ap-02-workout-escala-mayor-por-cuartas-c-f-bb-eb',
    title: 'AP-02 • Workout Escala Mayor por Cuartas (C, F, Bb, Eb Mayor) — 32 Compases',
    bpm: 116,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Desplazamiento diatónico a través de 4 tonalidades mayores (Do, Fa, Si bemol y Mi bemol). Cada compás contiene exactamente las notas de la escala mayor correspondiente con púa alternada rigurosa.',
    progression: [
      { chord: 'Cmaj7', measures: 8 },
      { chord: 'Fmaj7', measures: 8 },
      { chord: 'Bbmaj7', measures: 8 },
      { chord: 'Ebmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      if (chord === 'Cmaj7') {
        // Escala de Do Mayor en posición 5-8
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 8, finger: '4' },
          { string: 5, fret: 5, finger: '1' },
          { string: 5, fret: 7, finger: '3' },
          { string: 5, fret: 8, finger: '4' },
          { string: 4, fret: 5, finger: '1' },
          { string: 4, fret: 7, finger: '3' },
          { string: 3, fret: 4, finger: '1' },
          { string: 3, fret: 5, finger: '2' },
          { string: 3, fret: 7, finger: '4' },
          { string: 2, fret: 5, finger: '1' },
          { string: 2, fret: 6, finger: '2' },
          { string: 2, fret: 8, finger: '4' },
          { string: 1, fret: 5, finger: '1' },
          { string: 1, fret: 7, finger: '3' },
          { string: 1, fret: 8, finger: '4' },
          { string: 2, fret: 8, finger: '4' },
        ]);
      } else if (chord === 'Fmaj7') {
        // Escala de Fa Mayor (con Bb) en posición 1-5
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 1, finger: '1' },
          { string: 6, fret: 3, finger: '3' },
          { string: 6, fret: 5, finger: '4' },
          { string: 5, fret: 1, finger: '1' },
          { string: 5, fret: 3, finger: '3' },
          { string: 5, fret: 5, finger: '4' },
          { string: 4, fret: 2, finger: '1' },
          { string: 4, fret: 3, finger: '2' },
          { string: 4, fret: 5, finger: '4' },
          { string: 3, fret: 2, finger: '1' },
          { string: 3, fret: 3, finger: '2' },
          { string: 3, fret: 5, finger: '4' },
          { string: 2, fret: 3, finger: '2' },
          { string: 2, fret: 5, finger: '4' },
          { string: 1, fret: 1, finger: '1' },
          { string: 1, fret: 3, finger: '3' },
        ]);
      } else if (chord === 'Bbmaj7') {
        // Escala de Bb Mayor (con Bb y Eb) en posición 5-8
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 6, finger: '2' },
          { string: 5, fret: 5, finger: '1' },
          { string: 5, fret: 6, finger: '2' },
          { string: 5, fret: 8, finger: '4' },
          { string: 4, fret: 5, finger: '1' },
          { string: 4, fret: 7, finger: '3' },
          { string: 4, fret: 8, finger: '4' },
          { string: 3, fret: 5, finger: '1' },
          { string: 3, fret: 7, finger: '3' },
          { string: 3, fret: 8, finger: '4' },
          { string: 2, fret: 6, finger: '2' },
          { string: 2, fret: 8, finger: '4' },
          { string: 1, fret: 5, finger: '1' },
          { string: 1, fret: 6, finger: '2' },
          { string: 1, fret: 8, finger: '4' },
          { string: 2, fret: 6, finger: '2' },
        ]);
      } else {
        // Escala de Eb Mayor (con Bb, Eb, Ab) en posición 6-10
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 6, finger: '1' },
          { string: 5, fret: 8, finger: '3' },
          { string: 5, fret: 10, finger: '4' },
          { string: 4, fret: 6, finger: '1' },
          { string: 4, fret: 8, finger: '3' },
          { string: 4, fret: 10, finger: '4' },
          { string: 3, fret: 7, finger: '1' },
          { string: 3, fret: 8, finger: '2' },
          { string: 3, fret: 10, finger: '4' },
          { string: 2, fret: 8, finger: '1' },
          { string: 2, fret: 9, finger: '2' },
          { string: 2, fret: 11, finger: '4' },
          { string: 1, fret: 8, finger: '1' },
          { string: 1, fret: 10, finger: '3' },
          { string: 1, fret: 11, finger: '4' },
          { string: 2, fret: 11, finger: '4' },
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-03 • Workout Pentatónica Menor Extendida (Grupos de 6) en Am / Dm (120 BPM)
  // Am7 (8c) -> Dm7 (8c) -> Em7 (8c) -> Am7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-03',
    slug: 'ap-03-workout-pentatonica-menor-extendida-am-dm',
    title: 'AP-03 • Workout Pentatónica Menor Extendida (Grupos de 6) en Am / Dm — 32 Compases',
    bpm: 120,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Secuencias de 6 notas en pentatónica menor con saltos suaves entre cajas contiguas para desarrollar sincronía entre ambas manos a alta velocidad.',
    progression: [
      { chord: 'Am7', measures: 8 },
      { chord: 'Dm7', measures: 8 },
      { chord: 'Em7', measures: 8 },
      { chord: 'Am7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const rootFret = chord === 'Dm7' ? 10 : chord === 'Em7' ? 12 : 5;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 6, fret: rootFret, finger: '1' },
        { string: 6, fret: rootFret + 3, finger: '4' },
        { string: 5, fret: rootFret, finger: '1' },
        { string: 5, fret: rootFret + 2, finger: '3' },
        { string: 6, fret: rootFret + 3, finger: '4' },
        { string: 5, fret: rootFret, finger: '1' },
        { string: 5, fret: rootFret + 2, finger: '3' },
        { string: 4, fret: rootFret, finger: '1' },
        { string: 4, fret: rootFret + 2, finger: '3' },
        { string: 3, fret: rootFret, finger: '1' },
        { string: 3, fret: rootFret + 2, finger: '3' },
        { string: 2, fret: rootFret + 1, finger: '2' },
        { string: 2, fret: rootFret + 3, finger: '4' },
        { string: 1, fret: rootFret, finger: '1' },
        { string: 1, fret: rootFret + 3, finger: '4' },
        { string: 2, fret: rootFret + 3, finger: '4' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-04 • Workout Escala Mayor 3 Notas por Cuerda (3NPS) en Fa y Do Mayor (124 BPM)
  // Fmaj7 (4c) -> G7 (4c) -> Em7 (4c) -> Am7 (4c) -> Dm7 (4c) -> G7 (4c) -> Cmaj7 (4c) -> Fmaj7 (4c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-04',
    slug: 'ap-04-workout-escala-mayor-3nps-fa-do',
    title: 'AP-04 • Workout Escala Mayor 3 Notas por Cuerda (3NPS) en Fa y Do Mayor — 32 Compases',
    bpm: 124,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Patrones simétricos de tres notas por cuerda cruzando las 6 cuerdas diatónicamente sobre progresión armónica completa en Fa y Do Mayor.',
    progression: [
      { chord: 'Fmaj7', measures: 4 },
      { chord: 'G7', measures: 4 },
      { chord: 'Em7', measures: 4 },
      { chord: 'Am7', measures: 4 },
      { chord: 'Dm7', measures: 4 },
      { chord: 'G7', measures: 4 },
      { chord: 'Cmaj7', measures: 4 },
      { chord: 'Fmaj7', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      // Notas diatónicas 3NPS adaptadas al acorde activo
      const isF = chord === 'Fmaj7';
      const root = isF ? 1 : chord === 'G7' ? 3 : chord === 'Em7' ? 0 : chord === 'Am7' ? 5 : chord === 'Dm7' ? 5 : 3;

      if (isF) {
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 1, finger: '1' },
          { string: 6, fret: 3, finger: '2' },
          { string: 6, fret: 5, finger: '4' },
          { string: 5, fret: 1, finger: '1' },
          { string: 5, fret: 3, finger: '2' },
          { string: 5, fret: 5, finger: '4' },
          { string: 4, fret: 2, finger: '1' },
          { string: 4, fret: 3, finger: '2' },
          { string: 4, fret: 5, finger: '4' },
          { string: 3, fret: 2, finger: '1' },
          { string: 3, fret: 3, finger: '2' },
          { string: 3, fret: 5, finger: '4' },
          { string: 2, fret: 3, finger: '1' },
          { string: 2, fret: 5, finger: '2' },
          { string: 2, fret: 6, finger: '4' },
          { string: 1, fret: 5, finger: '2' },
        ]);
      } else {
        // En C diatónico
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: root, finger: '1' },
          { string: 6, fret: root + 2, finger: '2' },
          { string: 6, fret: root + 4, finger: '4' },
          { string: 5, fret: root, finger: '1' },
          { string: 5, fret: root + 2, finger: '2' },
          { string: 5, fret: root + 4, finger: '4' },
          { string: 4, fret: root + 1, finger: '1' },
          { string: 4, fret: root + 2, finger: '2' },
          { string: 4, fret: root + 4, finger: '4' },
          { string: 3, fret: root, finger: '1' },
          { string: 3, fret: root + 2, finger: '2' },
          { string: 3, fret: root + 4, finger: '4' },
          { string: 2, fret: root + 1, finger: '1' },
          { string: 2, fret: root + 3, finger: '3' },
          { string: 1, fret: root, finger: '1' },
          { string: 1, fret: root + 2, finger: '3' },
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-05 • Workout Escala Menor Natural & Pentatónica Menor Descendente (126 BPM)
  // Dm7 (8c) -> Gm7 (8c) -> Am7 (8c) -> Dm7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-05',
    slug: 'ap-05-workout-escala-menor-descendente-upstroke',
    title: 'AP-05 • Workout Escala Menor Natural & Pentatónica Menor Descendente (Upstroke V-Π) — 32 Compases',
    bpm: 126,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Cascadas descendentes en escalas menores naturales y pentatónicas con golpe de púa ascendente inicial (V-Π-V-Π) para perfeccionar el timing rítmico.',
    progression: [
      { chord: 'Dm7', measures: 8 },
      { chord: 'Gm7', measures: 8 },
      { chord: 'Am7', measures: 8 },
      { chord: 'Dm7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'Gm7' ? 3 : chord === 'Am7' ? 5 : 10;
      return createMeasure16Notes(
        mIdx,
        offset,
        chord,
        [
          { string: 1, fret: pos + 3, finger: '4' },
          { string: 1, fret: pos + 1, finger: '2' },
          { string: 1, fret: pos, finger: '1' },
          { string: 2, fret: pos + 3, finger: '4' },
          { string: 2, fret: pos + 1, finger: '2' },
          { string: 2, fret: pos, finger: '1' },
          { string: 3, fret: pos + 2, finger: '3' },
          { string: 3, fret: pos, finger: '1' },
          { string: 4, fret: pos + 3, finger: '4' },
          { string: 4, fret: pos + 2, finger: '3' },
          { string: 4, fret: pos, finger: '1' },
          { string: 5, fret: pos + 3, finger: '4' },
          { string: 5, fret: pos + 1, finger: '2' },
          { string: 5, fret: pos, finger: '1' },
          { string: 6, fret: pos + 3, finger: '4' },
          { string: 6, fret: pos, finger: '1' },
        ],
        'up' // Upstroke inicial
      );
    },
  },

  // --------------------------------------------------------------------------
  // AP-06 • Workout Arpegios Tríadas Mayores y Menores con Púa Alterna Pura (128 BPM)
  // C (4c) -> Am (4c) -> F (4c) -> G (4c) -> Em (4c) -> Am (4c) -> Dm (4c) -> G (4c) = 32c
  // Cuerdas adyacentes, sin sweep picking, sin saltos de cuerda
  // --------------------------------------------------------------------------
  {
    code: 'AP-06',
    slug: 'ap-06-workout-arpegios-triadas-mayores-menores',
    title: 'AP-06 • Workout Arpegios Tríadas Mayores y Menores con Púa Alterna Pura — 32 Compases',
    bpm: 128,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Arpegios completos de tríadas mayores y menores ejecutados con púa alternada estricta nota por nota en cuerdas contiguas (sin sweep picking).',
    progression: [
      { chord: 'C', measures: 4 },
      { chord: 'Am', measures: 4 },
      { chord: 'F', measures: 4 },
      { chord: 'G', measures: 4 },
      { chord: 'Em', measures: 4 },
      { chord: 'Am', measures: 4 },
      { chord: 'Dm', measures: 4 },
      { chord: 'G', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      // Arpegios en cuerdas contiguas (5, 4, 3, 2, 1, 2, 3, 4)
      if (chord === 'C') {
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 3, finger: '1' }, // C
          { string: 4, fret: 5, finger: '3' }, // G
          { string: 3, fret: 5, finger: '3' }, // C
          { string: 2, fret: 5, finger: '3' }, // E
          { string: 1, fret: 3, finger: '1' }, // G
          { string: 1, fret: 8, finger: '4' }, // C
          { string: 1, fret: 3, finger: '1' }, // G
          { string: 2, fret: 5, finger: '3' }, // E
          { string: 3, fret: 5, finger: '3' }, // C
          { string: 4, fret: 5, finger: '3' }, // G
          { string: 5, fret: 3, finger: '1' }, // C
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 3, fret: 0, finger: '0' }, // G
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 2, fret: 1, finger: '1' }, // C
        ]);
      } else if (chord === 'Am') {
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 5, finger: '1' }, // A
          { string: 5, fret: 7, finger: '3' }, // E
          { string: 4, fret: 7, finger: '3' }, // A
          { string: 3, fret: 5, finger: '1' }, // C
          { string: 2, fret: 5, finger: '1' }, // E
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 1, fret: 8, finger: '4' }, // C
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 2, fret: 5, finger: '1' }, // E
          { string: 3, fret: 5, finger: '1' }, // C
          { string: 4, fret: 7, finger: '3' }, // A
          { string: 5, fret: 7, finger: '3' }, // E
          { string: 6, fret: 5, finger: '1' }, // A
          { string: 5, fret: 3, finger: '1' }, // C
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 3, fret: 2, finger: '2' }, // A
        ]);
      } else if (chord === 'F') {
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 8, finger: '3' }, // F
          { string: 4, fret: 7, finger: '2' }, // A
          { string: 3, fret: 5, finger: '1' }, // C
          { string: 2, fret: 6, finger: '2' }, // F
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 1, fret: 8, finger: '4' }, // C
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 2, fret: 6, finger: '2' }, // F
          { string: 3, fret: 5, finger: '1' }, // C
          { string: 4, fret: 7, finger: '2' }, // A
          { string: 5, fret: 8, finger: '3' }, // F
          { string: 4, fret: 3, finger: '1' }, // F
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 1, fret: 1, finger: '1' }, // F
          { string: 2, fret: 1, finger: '1' }, // C
        ]);
      } else if (chord === 'G') {
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 3, finger: '1' }, // G
          { string: 5, fret: 5, finger: '3' }, // D
          { string: 4, fret: 5, finger: '3' }, // G
          { string: 3, fret: 4, finger: '2' }, // B
          { string: 2, fret: 3, finger: '1' }, // D
          { string: 1, fret: 3, finger: '1' }, // G
          { string: 1, fret: 7, finger: '4' }, // B
          { string: 1, fret: 3, finger: '1' }, // G
          { string: 2, fret: 3, finger: '1' }, // D
          { string: 3, fret: 4, finger: '2' }, // B
          { string: 4, fret: 5, finger: '3' }, // G
          { string: 5, fret: 5, finger: '3' }, // D
          { string: 6, fret: 3, finger: '1' }, // G
          { string: 5, fret: 2, finger: '1' }, // B
          { string: 4, fret: 0, finger: '0' }, // D
          { string: 3, fret: 0, finger: '0' }, // G
        ]);
      } else if (chord === 'Em') {
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 7, finger: '2' }, // E
          { string: 4, fret: 9, finger: '4' }, // B
          { string: 3, fret: 9, finger: '4' }, // E
          { string: 2, fret: 8, finger: '3' }, // G
          { string: 1, fret: 7, finger: '1' }, // B
          { string: 1, fret: 12, finger: '4' }, // E
          { string: 1, fret: 7, finger: '1' }, // B
          { string: 2, fret: 8, finger: '3' }, // G
          { string: 3, fret: 9, finger: '4' }, // E
          { string: 4, fret: 9, finger: '4' }, // B
          { string: 5, fret: 7, finger: '2' }, // E
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 3, fret: 0, finger: '0' }, // G
          { string: 2, fret: 0, finger: '0' }, // B
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 2, fret: 0, finger: '0' }, // B
        ]);
      } else {
        // Dm
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 5, finger: '1' }, // D
          { string: 4, fret: 7, finger: '3' }, // A
          { string: 3, fret: 7, finger: '3' }, // D
          { string: 2, fret: 6, finger: '2' }, // F
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 1, fret: 10, finger: '4' }, // D
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 2, fret: 6, finger: '2' }, // F
          { string: 3, fret: 7, finger: '3' }, // D
          { string: 4, fret: 7, finger: '3' }, // A
          { string: 5, fret: 5, finger: '1' }, // D
          { string: 4, fret: 0, finger: '0' }, // D
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 2, fret: 3, finger: '2' }, // D
          { string: 1, fret: 1, finger: '1' }, // F
          { string: 2, fret: 3, finger: '2' }, // D
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-07 • Workout Pentatónica Mayor en Tresillos de Semicorchea (132 BPM)
  // Gmaj7 (8c) -> Em7 (8c) -> Cmaj7 (8c) -> D7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-07',
    slug: 'ap-07-workout-pentatonica-mayor-tresillos-semicorchea',
    title: 'AP-07 • Workout Pentatónica Mayor en Tresillos de Semicorchea (G y D Mayor) — 32 Compases',
    bpm: 132,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Secuencias rápidas de pentatónica mayor en Sol y Re con saltos de cuerda controlados y alternancia rigurosa en el ataque de púa.',
    progression: [
      { chord: 'Gmaj7', measures: 8 },
      { chord: 'Em7', measures: 8 },
      { chord: 'Cmaj7', measures: 8 },
      { chord: 'D7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const base = chord === 'Gmaj7' ? 3 : chord === 'Em7' ? 7 : chord === 'Cmaj7' ? 8 : 10;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 6, fret: base, finger: '1' },
        { string: 6, fret: base + 2, finger: '2' },
        { string: 5, fret: base - 1 >= 0 ? base - 1 : base + 2, finger: '1' },
        { string: 5, fret: base + 2, finger: '3' },
        { string: 4, fret: base - 1 >= 0 ? base - 1 : base + 2, finger: '1' },
        { string: 4, fret: base + 2, finger: '3' },
        { string: 3, fret: base - 1 >= 0 ? base - 1 : base + 2, finger: '1' },
        { string: 3, fret: base + 2, finger: '3' },
        { string: 2, fret: base, finger: '1' },
        { string: 2, fret: base + 3, finger: '4' },
        { string: 1, fret: base, finger: '1' },
        { string: 1, fret: base + 2, finger: '3' },
        { string: 2, fret: base + 3, finger: '4' },
        { string: 3, fret: base + 2, finger: '3' },
        { string: 4, fret: base + 2, finger: '3' },
        { string: 5, fret: base + 2, finger: '3' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-08 • Workout Escala Mayor & Pentatónica Mayor sobre Progresión Pop/Rock (135 BPM)
  // Fmaj7 (8c) -> Cmaj7 (8c) -> Gmaj7 (8c) -> Am7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-08',
    slug: 'ap-08-workout-escala-mayor-pentatonica-pop-rock',
    title: 'AP-08 • Workout Escala Mayor & Pentatónica Mayor sobre Progresión Pop/Rock — 32 Compases',
    bpm: 135,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Fraseo melódico de escala mayor y pentatónica mayor sobre la clásica progresión I-V-VI-IV con púa alterna fluida y acentos dinámicos.',
    progression: [
      { chord: 'Fmaj7', measures: 8 },
      { chord: 'Cmaj7', measures: 8 },
      { chord: 'Gmaj7', measures: 8 },
      { chord: 'Am7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const isF = chord === 'Fmaj7';
      const isC = chord === 'Cmaj7';
      const isG = chord === 'Gmaj7';
      const rootFret = isF ? 1 : isC ? 8 : isG ? 3 : 5;

      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 5, fret: rootFret, finger: '1' },
        { string: 5, fret: rootFret + 2, finger: '2' },
        { string: 5, fret: rootFret + 4, finger: '4' },
        { string: 4, fret: rootFret, finger: '1' },
        { string: 4, fret: rootFret + 2, finger: '2' },
        { string: 4, fret: rootFret + 4, finger: '4' },
        { string: 3, fret: rootFret, finger: '1' },
        { string: 3, fret: rootFret + 2, finger: '3' },
        { string: 2, fret: rootFret + 1, finger: '2' },
        { string: 2, fret: rootFret + 3, finger: '4' },
        { string: 1, fret: rootFret, finger: '1' },
        { string: 1, fret: rootFret + 3, finger: '4' },
        { string: 2, fret: rootFret + 3, finger: '4' },
        { string: 3, fret: rootFret + 2, finger: '3' },
        { string: 4, fret: rootFret + 2, finger: '2' },
        { string: 5, fret: rootFret + 2, finger: '2' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-09 • Workout Escala Menor en Sextillos (Posiciones 1-2-4) en Fa# Menor (138 BPM)
  // F#m7 (8c) -> Dmaj7 (8c) -> A (8c) -> E (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-09',
    slug: 'ap-09-workout-escala-menor-sextillos-fsharp-minor',
    title: 'AP-09 • Workout Escala Menor en Sextillos (Posiciones 1-2-4) en Fa# Menor — 32 Compases',
    bpm: 138,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Digitaciones 1-2-4 de alcance amplio sobre la escala menor de Fa# y sus acordes relativos con púa alternada rigurosa en grupos rítmicos rápidos.',
    progression: [
      { chord: 'F#m7', measures: 8 },
      { chord: 'Dmaj7', measures: 8 },
      { chord: 'A', measures: 8 },
      { chord: 'E', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'F#m7' ? 2 : chord === 'Dmaj7' ? 5 : chord === 'A' ? 5 : 7;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 6, fret: pos, finger: '1' },
        { string: 6, fret: pos + 2, finger: '2' },
        { string: 6, fret: pos + 4, finger: '4' },
        { string: 5, fret: pos, finger: '1' },
        { string: 5, fret: pos + 2, finger: '2' },
        { string: 5, fret: pos + 4, finger: '4' },
        { string: 4, fret: pos, finger: '1' },
        { string: 4, fret: pos + 2, finger: '2' },
        { string: 4, fret: pos + 4, finger: '4' },
        { string: 3, fret: pos, finger: '1' },
        { string: 3, fret: pos + 2, finger: '2' },
        { string: 3, fret: pos + 4, finger: '4' },
        { string: 2, fret: pos, finger: '1' },
        { string: 2, fret: pos + 2, finger: '2' },
        { string: 1, fret: pos, finger: '1' },
        { string: 1, fret: pos + 2, finger: '3' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-10 • Workout Arpegios Maj7 y m7 en 4 Cuerdas Adyacentes (Sin Sweep) (140 BPM)
  // Fmaj7 (8c) -> Em7 (8c) -> Dm7 (8c) -> Cmaj7 (8c) = 32c
  // Cuerdas adyacentes 4, 3, 2, 1 con púa alternada pura
  // --------------------------------------------------------------------------
  {
    code: 'AP-10',
    slug: 'ap-10-workout-arpegios-maj7-m7-cuerdas-adyacentes',
    title: 'AP-10 • Workout Arpegios Maj7 y m7 en 4 Cuerdas Adyacentes (Sin Sweep) — 32 Compases',
    bpm: 140,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Arpegios de cuatro notas (fundamental, tercera, quinta y séptima) recorriendo las 4 primeras cuerdas contiguas con estricta alternancia de púa.',
    progression: [
      { chord: 'Fmaj7', measures: 8 },
      { chord: 'Em7', measures: 8 },
      { chord: 'Dm7', measures: 8 },
      { chord: 'Cmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      // 4 cuerdas contiguas (4, 3, 2, 1, 1, 2, 3, 4)
      if (chord === 'Fmaj7') {
        // F, A, C, E
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 4, fret: 3, finger: '1' }, // F
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 1, fret: 5, finger: '3' }, // A
          { string: 2, fret: 5, finger: '3' }, // E
          { string: 3, fret: 5, finger: '3' }, // C
          { string: 4, fret: 7, finger: '4' }, // A
          { string: 4, fret: 3, finger: '1' }, // F
          { string: 3, fret: 5, finger: '3' }, // C
          { string: 2, fret: 5, finger: '3' }, // E
          { string: 1, fret: 5, finger: '3' }, // A
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 4, fret: 3, finger: '1' }, // F
        ]);
      } else if (chord === 'Em7') {
        // E, G, B, D
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 3, fret: 0, finger: '0' }, // G
          { string: 2, fret: 0, finger: '0' }, // B
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 1, fret: 3, finger: '2' }, // G
          { string: 2, fret: 3, finger: '2' }, // D
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 2, fret: 3, finger: '2' }, // D
          { string: 1, fret: 3, finger: '2' }, // G
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 2, fret: 0, finger: '0' }, // B
          { string: 3, fret: 0, finger: '0' }, // G
          { string: 4, fret: 2, finger: '1' }, // E
        ]);
      } else if (chord === 'Dm7') {
        // D, F, A, C
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 4, fret: 0, finger: '0' }, // D
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 1, fret: 1, finger: '1' }, // F
          { string: 1, fret: 5, finger: '4' }, // A
          { string: 2, fret: 6, finger: '4' }, // F
          { string: 3, fret: 5, finger: '3' }, // C
          { string: 4, fret: 7, finger: '4' }, // A
          { string: 4, fret: 0, finger: '0' }, // D
          { string: 3, fret: 5, finger: '3' }, // C
          { string: 2, fret: 6, finger: '4' }, // F
          { string: 1, fret: 5, finger: '4' }, // A
          { string: 1, fret: 1, finger: '1' }, // F
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 4, fret: 0, finger: '0' }, // D
        ]);
      } else {
        // Cmaj7: C, E, G, B
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 3, fret: 0, finger: '0' }, // G
          { string: 2, fret: 0, finger: '0' }, // B
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 1, fret: 3, finger: '2' }, // G
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 1, fret: 3, finger: '2' }, // G
          { string: 1, fret: 0, finger: '0' }, // E
          { string: 2, fret: 0, finger: '0' }, // B
          { string: 3, fret: 0, finger: '0' }, // G
          { string: 4, fret: 2, finger: '1' }, // E
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-11 • Workout Inside Picking en Escala Menor de Mi y Pentatónica Menor (142 BPM)
  // Em7 (8c) -> Am7 (8c) -> Bm7 (8c) -> Em7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-11',
    slug: 'ap-11-workout-inside-picking-escala-menor-mi',
    title: 'AP-11 • Workout Inside Picking en Escala Menor de Mi y Pentatónica Menor — 32 Compases',
    bpm: 142,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Cruces de cuerda interiores estrictos (inside picking) alternando cuerdas adyacentes sobre las escalas menores de Mi, La y Si.',
    progression: [
      { chord: 'Em7', measures: 8 },
      { chord: 'Am7', measures: 8 },
      { chord: 'Bm7', measures: 8 },
      { chord: 'Em7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const root = chord === 'Am7' ? 5 : chord === 'Bm7' ? 7 : 0;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 4, fret: root + 2, finger: '1' },
        { string: 3, fret: root, finger: '1' },
        { string: 4, fret: root + 4, finger: '3' },
        { string: 3, fret: root + 2, finger: '2' },
        { string: 4, fret: root + 5, finger: '4' },
        { string: 3, fret: root + 4, finger: '4' },
        { string: 2, fret: root + 3, finger: '2' },
        { string: 1, fret: root + 2, finger: '1' },
        { string: 2, fret: root + 5, finger: '4' },
        { string: 1, fret: root + 3, finger: '2' },
        { string: 2, fret: root + 5, finger: '4' },
        { string: 3, fret: root + 4, finger: '4' },
        { string: 4, fret: root + 5, finger: '4' },
        { string: 3, fret: root + 2, finger: '2' },
        { string: 4, fret: root + 4, finger: '3' },
        { string: 5, fret: root + 2, finger: '1' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-12 • Workout Desplazamiento Diagonal en Escala Mayor de Fa y Bb (144 BPM)
  // Bbmaj7 (8c) -> Fmaj7 (8c) -> Gm7 (8c) -> C7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-12',
    slug: 'ap-12-workout-desplazamiento-diagonal-fa-bb',
    title: 'AP-12 • Workout Desplazamiento Diagonal en Escala Mayor de Fa y Bb — 32 Compases',
    bpm: 144,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Desplazamiento horizontal a lo largo del mástil conectando posiciones mediante cambios suaves de posición con digitación precisa.',
    progression: [
      { chord: 'Bbmaj7', measures: 8 },
      { chord: 'Fmaj7', measures: 8 },
      { chord: 'Gm7', measures: 8 },
      { chord: 'C7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const base = chord === 'Bbmaj7' ? 6 : chord === 'Fmaj7' ? 8 : chord === 'Gm7' ? 3 : 8;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 5, fret: base - 1, finger: '1' },
        { string: 5, fret: base + 1, finger: '2' },
        { string: 5, fret: base + 3, finger: '4' },
        { string: 4, fret: base, finger: '1' },
        { string: 4, fret: base + 2, finger: '3' },
        { string: 4, fret: base + 3, finger: '4' },
        { string: 3, fret: base, finger: '1' },
        { string: 3, fret: base + 2, finger: '3' },
        { string: 3, fret: base + 4, finger: '4' },
        { string: 2, fret: base + 1, finger: '1' },
        { string: 2, fret: base + 3, finger: '3' },
        { string: 2, fret: base + 5, finger: '4' },
        { string: 1, fret: base + 3, finger: '2' },
        { string: 1, fret: base + 5, finger: '4' },
        { string: 2, fret: base + 3, finger: '3' },
        { string: 3, fret: base + 2, finger: '2' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-13 • Workout Arpegios de Séptima Dominante (7) con Púa Alterna Estricta (146 BPM)
  // E7 (8c) -> A7 (8c) -> D7 (8c) -> G7 (8c) = 32c
  // Cuerdas adyacentes, arpegio dominante completo (1-3-5-b7)
  // --------------------------------------------------------------------------
  {
    code: 'AP-13',
    slug: 'ap-13-workout-arpegios-septima-dominante-pua-alterna',
    title: 'AP-13 • Workout Arpegios de Séptima Dominante (7) con Púa Alterna Estricta — 32 Compases',
    bpm: 146,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Arpegios dominantes 1-3-5-b7 en cuerdas contiguas atacados con púa alternada pura, exigiendo máxima independencia y sincronización motriz.',
    progression: [
      { chord: 'E7', measures: 8 },
      { chord: 'A7', measures: 8 },
      { chord: 'D7', measures: 8 },
      { chord: 'G7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      if (chord === 'E7') {
        // E (4), G# (8), B (11), D (2)
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 7, finger: '2' }, // E
          { string: 4, fret: 6, finger: '1' }, // G#
          { string: 4, fret: 9, finger: '4' }, // B
          { string: 3, fret: 7, finger: '2' }, // D
          { string: 3, fret: 9, finger: '4' }, // E
          { string: 2, fret: 9, finger: '4' }, // G#
          { string: 1, fret: 7, finger: '1' }, // B
          { string: 1, fret: 10, finger: '4' }, // D
          { string: 1, fret: 7, finger: '1' }, // B
          { string: 2, fret: 9, finger: '4' }, // G#
          { string: 3, fret: 9, finger: '4' }, // E
          { string: 3, fret: 7, finger: '2' }, // D
          { string: 4, fret: 9, finger: '4' }, // B
          { string: 4, fret: 6, finger: '1' }, // G#
          { string: 5, fret: 7, finger: '2' }, // E
          { string: 6, fret: 7, finger: '2' }, // B
        ]);
      } else if (chord === 'A7') {
        // A (9), C# (1), E (4), G (7)
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 12, finger: '3' }, // A
          { string: 4, fret: 11, finger: '2' }, // C#
          { string: 3, fret: 9, finger: '1' },  // E
          { string: 2, fret: 8, finger: '1' },  // G
          { string: 2, fret: 10, finger: '3' }, // A
          { string: 1, fret: 9, finger: '2' },  // C#
          { string: 1, fret: 12, finger: '4' }, // E
          { string: 1, fret: 9, finger: '2' },  // C#
          { string: 2, fret: 10, finger: '3' }, // A
          { string: 2, fret: 8, finger: '1' },  // G
          { string: 3, fret: 9, finger: '1' },  // E
          { string: 4, fret: 11, finger: '2' }, // C#
          { string: 5, fret: 12, finger: '3' }, // A
          { string: 4, fret: 7, finger: '1' },  // A
          { string: 3, fret: 6, finger: '1' },  // C#
          { string: 2, fret: 5, finger: '1' },  // E
        ]);
      } else if (chord === 'D7') {
        // D (2), F# (6), A (9), C (0)
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 5, finger: '2' }, // D
          { string: 4, fret: 4, finger: '1' }, // F#
          { string: 4, fret: 7, finger: '4' }, // A
          { string: 3, fret: 5, finger: '2' }, // C
          { string: 3, fret: 7, finger: '4' }, // D
          { string: 2, fret: 7, finger: '3' }, // F#
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 1, fret: 8, finger: '4' }, // C
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 2, fret: 7, finger: '3' }, // F#
          { string: 3, fret: 7, finger: '4' }, // D
          { string: 3, fret: 5, finger: '2' }, // C
          { string: 4, fret: 7, finger: '4' }, // A
          { string: 4, fret: 4, finger: '1' }, // F#
          { string: 5, fret: 5, finger: '2' }, // D
          { string: 4, fret: 0, finger: '0' }, // D
        ]);
      } else {
        // G7: G (7), B (11), D (2), F (5)
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 3, finger: '1' }, // G
          { string: 5, fret: 2, finger: '1' }, // B
          { string: 5, fret: 5, finger: '4' }, // D
          { string: 4, fret: 3, finger: '2' }, // F
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 2, fret: 3, finger: '2' }, // D
          { string: 1, fret: 1, finger: '1' }, // F
          { string: 1, fret: 3, finger: '3' }, // G
          { string: 2, fret: 3, finger: '2' }, // D
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 4, fret: 3, finger: '2' }, // F
          { string: 5, fret: 5, finger: '4' }, // D
          { string: 5, fret: 2, finger: '1' }, // B
          { string: 6, fret: 3, finger: '1' }, // G
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-14 • Workout Pentatónica Mayor y Menor Alternada (2 Notas x Cuerda Rápido) (148 BPM)
  // Bm7 (8c) -> Gmaj7 (8c) -> Dmaj7 (8c) -> A (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-14',
    slug: 'ap-14-workout-pentatonica-mayor-menor-alternada',
    title: 'AP-14 • Workout Pentatónica Mayor y Menor Alternada (2 Notas x Cuerda Rápido) — 32 Compases',
    bpm: 148,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Alternancia de dos notas por cuerda a gran velocidad pasando de pentatónica menor (Bm) a pentatónicas mayores (Sol, Re y La).',
    progression: [
      { chord: 'Bm7', measures: 8 },
      { chord: 'Gmaj7', measures: 8 },
      { chord: 'Dmaj7', measures: 8 },
      { chord: 'A', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const root = chord === 'Bm7' ? 7 : chord === 'Gmaj7' ? 3 : chord === 'Dmaj7' ? 10 : 5;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 6, fret: root, finger: '1' },
        { string: 6, fret: root + 3, finger: '4' },
        { string: 5, fret: root, finger: '1' },
        { string: 5, fret: root + 2, finger: '3' },
        { string: 4, fret: root, finger: '1' },
        { string: 4, fret: root + 2, finger: '3' },
        { string: 3, fret: root, finger: '1' },
        { string: 3, fret: root + 2, finger: '3' },
        { string: 2, fret: root, finger: '1' },
        { string: 2, fret: root + 3, finger: '4' },
        { string: 1, fret: root, finger: '1' },
        { string: 1, fret: root + 3, finger: '4' },
        { string: 2, fret: root + 3, finger: '4' },
        { string: 3, fret: root + 2, finger: '3' },
        { string: 4, fret: root + 2, finger: '3' },
        { string: 5, fret: root + 2, finger: '3' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-15 • Workout Grupos de 5 Notas en Escala Menor de Do y Pentatónica Menor (150 BPM)
  // Cm7 (8c) -> Fm7 (8c) -> Bb7 (8c) -> Ebmaj7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-15',
    slug: 'ap-15-workout-grupos-5-notas-escala-menor-do',
    title: 'AP-15 • Workout Grupos de 5 Notas en Escala Menor de Do y Pentatónica Menor — 32 Compases',
    bpm: 150,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Polirritmia de quintillos agrupados en compás de 4/4 con semicorcheas rápidas sobre el ciclo armónico de Do menor y Mi bemol mayor.',
    progression: [
      { chord: 'Cm7', measures: 8 },
      { chord: 'Fm7', measures: 8 },
      { chord: 'Bb7', measures: 8 },
      { chord: 'Ebmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'Cm7' ? 8 : chord === 'Fm7' ? 1 : chord === 'Bb7' ? 6 : 6;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 6, fret: pos, finger: '1' },
        { string: 6, fret: pos + 2, finger: '2' },
        { string: 6, fret: pos + 3, finger: '3' },
        { string: 5, fret: pos, finger: '1' },
        { string: 5, fret: pos + 2, finger: '2' },
        { string: 5, fret: pos + 3, finger: '3' },
        { string: 4, fret: pos, finger: '1' },
        { string: 4, fret: pos + 2, finger: '2' },
        { string: 4, fret: pos + 3, finger: '3' },
        { string: 3, fret: pos, finger: '1' },
        { string: 3, fret: pos + 2, finger: '3' },
        { string: 2, fret: pos + 1, finger: '2' },
        { string: 2, fret: pos + 3, finger: '4' },
        { string: 1, fret: pos, finger: '1' },
        { string: 1, fret: pos + 2, finger: '3' },
        { string: 2, fret: pos + 3, finger: '4' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-16 • Workout Arpegios Extendidos (m9 y maj9) con Púa Alterna Avanzada (152 BPM)
  // Dm7 (8c) -> G7 (8c) -> Cmaj7 (8c) -> Am7 (8c) = 32c
  // Cuerdas adyacentes, arpegios con 9na
  // --------------------------------------------------------------------------
  {
    code: 'AP-16',
    slug: 'ap-16-workout-arpegios-extendidos-m9-maj9',
    title: 'AP-16 • Workout Arpegios Extendidos (m9 y maj9) con Púa Alterna Avanzada — 32 Compases',
    bpm: 152,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Arpegios con tensiones de novena mayor (m9, dom9 y maj9) tocados exclusivamente en cuerdas adyacentes con técnica alterna pura.',
    progression: [
      { chord: 'Dm7', measures: 8 },
      { chord: 'G7', measures: 8 },
      { chord: 'Cmaj7', measures: 8 },
      { chord: 'Am7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      if (chord === 'Dm7') {
        // Dm9: D, F, A, C, E
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 5, finger: '1' },  // D
          { string: 4, fret: 7, finger: '3' },  // A
          { string: 3, fret: 5, finger: '1' },  // C
          { string: 2, fret: 5, finger: '1' },  // E (9)
          { string: 1, fret: 5, finger: '1' },  // A
          { string: 1, fret: 8, finger: '4' },  // C
          { string: 1, fret: 5, finger: '1' },  // A
          { string: 2, fret: 6, finger: '2' },  // F
          { string: 3, fret: 7, finger: '3' },  // D
          { string: 4, fret: 7, finger: '3' },  // A
          { string: 5, fret: 5, finger: '1' },  // D
          { string: 4, fret: 3, finger: '1' },  // F
          { string: 3, fret: 2, finger: '1' },  // A
          { string: 2, fret: 1, finger: '1' },  // C
          { string: 1, fret: 0, finger: '0' },  // E
          { string: 2, fret: 3, finger: '3' },  // D
        ]);
      } else if (chord === 'G7') {
        // G9: G, B, D, F, A
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 3, finger: '1' },  // G
          { string: 5, fret: 5, finger: '3' },  // D
          { string: 4, fret: 3, finger: '1' },  // F
          { string: 3, fret: 2, finger: '1' },  // A (9)
          { string: 3, fret: 4, finger: '3' },  // B
          { string: 2, fret: 3, finger: '2' },  // D
          { string: 1, fret: 1, finger: '1' },  // F
          { string: 1, fret: 5, finger: '4' },  // A
          { string: 1, fret: 1, finger: '1' },  // F
          { string: 2, fret: 3, finger: '2' },  // D
          { string: 3, fret: 4, finger: '3' },  // B
          { string: 4, fret: 3, finger: '1' },  // F
          { string: 5, fret: 5, finger: '3' },  // D
          { string: 6, fret: 3, finger: '1' },  // G
          { string: 5, fret: 2, finger: '1' },  // B
          { string: 4, fret: 5, finger: '4' },  // G
        ]);
      } else if (chord === 'Cmaj7') {
        // Cmaj9: C, E, G, B, D
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 3, finger: '1' },  // C
          { string: 4, fret: 2, finger: '1' },  // E
          { string: 3, fret: 0, finger: '0' },  // G
          { string: 2, fret: 0, finger: '0' },  // B
          { string: 1, fret: 0, finger: '0' },  // E
          { string: 1, fret: 3, finger: '3' },  // G
          { string: 2, fret: 3, finger: '3' },  // D (9)
          { string: 3, fret: 4, finger: '4' },  // B
          { string: 4, fret: 5, finger: '4' },  // G
          { string: 5, fret: 7, finger: '4' },  // E
          { string: 5, fret: 3, finger: '1' },  // C
          { string: 4, fret: 2, finger: '1' },  // E
          { string: 3, fret: 4, finger: '3' },  // B
          { string: 2, fret: 1, finger: '1' },  // C
          { string: 1, fret: 0, finger: '0' },  // E
          { string: 2, fret: 1, finger: '1' },  // C
        ]);
      } else {
        // Am9: A, C, E, G, B
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 0, finger: '0' },  // A
          { string: 4, fret: 2, finger: '1' },  // E
          { string: 3, fret: 0, finger: '0' },  // G
          { string: 2, fret: 0, finger: '0' },  // B (9)
          { string: 1, fret: 0, finger: '0' },  // E
          { string: 1, fret: 5, finger: '4' },  // A
          { string: 2, fret: 5, finger: '3' },  // E
          { string: 3, fret: 5, finger: '2' },  // C
          { string: 4, fret: 5, finger: '2' },  // G
          { string: 5, fret: 7, finger: '4' },  // E
          { string: 6, fret: 5, finger: '1' },  // A
          { string: 5, fret: 3, finger: '1' },  // C
          { string: 4, fret: 2, finger: '1' },  // E
          { string: 3, fret: 2, finger: '1' },  // A
          { string: 2, fret: 0, finger: '0' },  // B
          { string: 1, fret: 0, finger: '0' },  // E
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-17 • Workout Secuencias Lineales de Escala Mayor de Fa (Inside/Outside) (155 BPM)
  // Dm7 (8c) -> Gm7 (8c) -> C7 (8c) -> Fmaj7 (8c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-17',
    slug: 'ap-17-workout-secuencias-lineales-escala-mayor-fa',
    title: 'AP-17 • Workout Secuencias Lineales de Escala Mayor de Fa (Inside/Outside) — 32 Compases',
    bpm: 155,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Intervalos de terceras y cuartas en Fa mayor / Re menor que combinan inside y outside picking a alta velocidad sin perder articulación.',
    progression: [
      { chord: 'Dm7', measures: 8 },
      { chord: 'Gm7', measures: 8 },
      { chord: 'C7', measures: 8 },
      { chord: 'Fmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const isF = chord === 'Fmaj7';
      const isC = chord === 'C7';
      const root = isF ? 8 : isC ? 8 : chord === 'Gm7' ? 3 : 5;

      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 5, fret: root, finger: '1' },
        { string: 4, fret: root - 1 >= 0 ? root - 1 : root + 2, finger: '1' },
        { string: 5, fret: root + 2, finger: '3' },
        { string: 4, fret: root + 2, finger: '3' },
        { string: 4, fret: root - 1 >= 0 ? root - 1 : root + 2, finger: '1' },
        { string: 3, fret: root, finger: '2' },
        { string: 4, fret: root + 2, finger: '3' },
        { string: 3, fret: root + 2, finger: '4' },
        { string: 3, fret: root, finger: '2' },
        { string: 2, fret: root + 1, finger: '2' },
        { string: 3, fret: root + 2, finger: '4' },
        { string: 2, fret: root + 3, finger: '4' },
        { string: 2, fret: root + 1, finger: '2' },
        { string: 1, fret: root, finger: '1' },
        { string: 2, fret: root + 3, finger: '4' },
        { string: 1, fret: root + 2, finger: '3' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-18 • Workout Cascada en Sextillos de Escala Menor y Arpegios Menores (158 BPM)
  // Dm (4c) -> Gm (4c) -> A7 (4c) -> Dm (4c) -> Bb (4c) -> Gm (4c) -> A7 (4c) -> Dm (4c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-18',
    slug: 'ap-18-workout-cascada-sextillos-escala-menor',
    title: 'AP-18 • Workout Cascada en Sextillos de Escala Menor y Arpegios Menores — 32 Compases',
    bpm: 158,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Cascada continua descendente y ascendente en Re menor armónico con arpegios menores intercalados para resistencia y control extremo.',
    progression: [
      { chord: 'Dm', measures: 4 },
      { chord: 'Gm', measures: 4 },
      { chord: 'A7', measures: 4 },
      { chord: 'Dm', measures: 4 },
      { chord: 'Bb', measures: 4 },
      { chord: 'Gm', measures: 4 },
      { chord: 'A7', measures: 4 },
      { chord: 'Dm', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'Gm' ? 3 : chord === 'A7' ? 5 : chord === 'Bb' ? 6 : 10;
      return createMeasure16Notes(mIdx, offset, chord, [
        { string: 1, fret: pos + 3, finger: '4' },
        { string: 1, fret: pos + 1, finger: '2' },
        { string: 1, fret: pos, finger: '1' },
        { string: 2, fret: pos + 3, finger: '4' },
        { string: 2, fret: pos + 1, finger: '2' },
        { string: 2, fret: pos, finger: '1' },
        { string: 3, fret: pos + 2, finger: '3' },
        { string: 3, fret: pos, finger: '1' },
        { string: 4, fret: pos + 2, finger: '3' },
        { string: 4, fret: pos, finger: '1' },
        { string: 5, fret: pos + 2, finger: '3' },
        { string: 5, fret: pos, finger: '1' },
        { string: 4, fret: pos, finger: '1' },
        { string: 3, fret: pos, finger: '1' },
        { string: 2, fret: pos, finger: '1' },
        { string: 1, fret: pos, finger: '1' },
      ]);
    },
  },

  // --------------------------------------------------------------------------
  // AP-19 • Workout Arpegios Enlazados (Voice Leading) con Púa Alterna Estricta (160 BPM)
  // Am7 (8c) -> D7 (8c) -> Gmaj7 (8c) -> Cmaj7 (8c) = 32c
  // Cuerdas adyacentes, voice leading suave
  // --------------------------------------------------------------------------
  {
    code: 'AP-19',
    slug: 'ap-19-workout-arpegios-enlazados-voice-leading',
    title: 'AP-19 • Workout Arpegios Enlazados (Voice Leading) con Púa Alterna Estricta — 32 Compases',
    bpm: 160,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Conducción de voces armónicas (voice leading) donde la última nota de cada arpegio enlaza por tono o semitono con el siguiente con púa alterna estricta.',
    progression: [
      { chord: 'Am7', measures: 8 },
      { chord: 'D7', measures: 8 },
      { chord: 'Gmaj7', measures: 8 },
      { chord: 'Cmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      if (chord === 'Am7') {
        // A, C, E, G
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 0, finger: '0' },
          { string: 4, fret: 2, finger: '1' },
          { string: 3, fret: 2, finger: '2' },
          { string: 2, fret: 1, finger: '1' },
          { string: 1, fret: 0, finger: '0' },
          { string: 1, fret: 3, finger: '3' }, // G -> voice leading al F# de D7
          { string: 2, fret: 1, finger: '1' },
          { string: 3, fret: 2, finger: '2' },
          { string: 4, fret: 2, finger: '1' },
          { string: 5, fret: 0, finger: '0' },
          { string: 4, fret: 5, finger: '4' },
          { string: 3, fret: 5, finger: '3' },
          { string: 2, fret: 5, finger: '2' },
          { string: 1, fret: 5, finger: '1' },
          { string: 2, fret: 5, finger: '2' },
          { string: 3, fret: 5, finger: '3' },
        ]);
      } else if (chord === 'D7') {
        // D, F#, A, C
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 4, fret: 0, finger: '0' },
          { string: 3, fret: 2, finger: '1' },
          { string: 2, fret: 1, finger: '1' }, // C
          { string: 1, fret: 2, finger: '2' }, // F#
          { string: 1, fret: 5, finger: '4' },
          { string: 2, fret: 3, finger: '3' },
          { string: 3, fret: 2, finger: '1' },
          { string: 4, fret: 4, finger: '4' }, // F#
          { string: 5, fret: 5, finger: '4' }, // D
          { string: 4, fret: 4, finger: '3' },
          { string: 3, fret: 5, finger: '4' }, // C
          { string: 2, fret: 3, finger: '2' },
          { string: 1, fret: 2, finger: '1' },
          { string: 2, fret: 1, finger: '1' }, // C -> voice leading al B de Gmaj7
          { string: 3, fret: 2, finger: '2' },
          { string: 4, fret: 0, finger: '0' },
        ]);
      } else if (chord === 'Gmaj7') {
        // G, B, D, F#
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 3, finger: '1' },
          { string: 5, fret: 2, finger: '1' },
          { string: 4, fret: 0, finger: '0' },
          { string: 3, fret: 0, finger: '0' },
          { string: 2, fret: 0, finger: '0' },
          { string: 1, fret: 2, finger: '1' }, // F#
          { string: 1, fret: 3, finger: '2' }, // G
          { string: 2, fret: 0, finger: '0' },
          { string: 3, fret: 0, finger: '0' },
          { string: 4, fret: 0, finger: '0' },
          { string: 5, fret: 5, finger: '4' }, // D
          { string: 4, fret: 4, finger: '3' }, // F#
          { string: 3, fret: 4, finger: '2' }, // B
          { string: 2, fret: 3, finger: '1' }, // D
          { string: 1, fret: 2, finger: '1' }, // F# -> voice leading al E de Cmaj7
          { string: 2, fret: 3, finger: '2' },
        ]);
      } else {
        // Cmaj7: C, E, G, B
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 3, finger: '1' },
          { string: 4, fret: 2, finger: '1' },
          { string: 3, fret: 0, finger: '0' },
          { string: 2, fret: 0, finger: '0' },
          { string: 1, fret: 0, finger: '0' },
          { string: 1, fret: 3, finger: '3' },
          { string: 2, fret: 1, finger: '1' },
          { string: 3, fret: 0, finger: '0' },
          { string: 4, fret: 2, finger: '1' },
          { string: 5, fret: 3, finger: '1' },
          { string: 4, fret: 5, finger: '3' },
          { string: 3, fret: 4, finger: '2' },
          { string: 2, fret: 5, finger: '3' },
          { string: 1, fret: 3, finger: '1' },
          { string: 2, fret: 5, finger: '3' },
          { string: 3, fret: 4, finger: '2' },
        ]);
      }
    },
  },

  // --------------------------------------------------------------------------
  // AP-20 • Boss Final: Maratón 32 Compases (Escala Mayor + Pentatónicas + Arpegios Avanzados) (164 BPM)
  // Cmaj7 (4c) -> Fmaj7 (4c) -> Dm7 (4c) -> G7 (4c) -> Em7 (4c) -> Am7 (4c) -> Fmaj7 (4c) -> G7 (4c) = 32c
  // --------------------------------------------------------------------------
  {
    code: 'AP-20',
    slug: 'ap-20-boss-final-maraton-resistencia-32c',
    title: 'AP-20 • Boss Final: Maratón 32 Compases (Escala Mayor + Pentatónicas + Arpegios Avanzados) — 32 Compases',
    bpm: 164,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'El desafío definitivo de púa alternada: 32 compases continuos a 164 BPM combinando escalas mayores completas, pentatónicas y arpegios en cuerdas contiguas.',
    progression: [
      { chord: 'Cmaj7', measures: 4 },
      { chord: 'Fmaj7', measures: 4 },
      { chord: 'Dm7', measures: 4 },
      { chord: 'G7', measures: 4 },
      { chord: 'Em7', measures: 4 },
      { chord: 'Am7', measures: 4 },
      { chord: 'Fmaj7', measures: 4 },
      { chord: 'G7', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      if (chord === 'Cmaj7') {
        // Escala Mayor + Arpegio en Do
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 3, finger: '1' }, // C
          { string: 5, fret: 5, finger: '3' }, // D
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 4, fret: 3, finger: '2' }, // F
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 3, fret: 5, finger: '4' }, // C
          { string: 2, fret: 3, finger: '1' }, // D
          { string: 2, fret: 5, finger: '3' }, // E
          { string: 1, fret: 3, finger: '1' }, // G
          { string: 1, fret: 7, finger: '4' }, // B
          { string: 1, fret: 8, finger: '4' }, // C
          { string: 2, fret: 5, finger: '2' }, // E
          { string: 3, fret: 5, finger: '2' }, // C
          { string: 4, fret: 5, finger: '3' }, // G
        ]);
      } else if (chord === 'Fmaj7') {
        // 3NPS en Fa Mayor (con Bb)
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 1, finger: '1' }, // F
          { string: 6, fret: 3, finger: '2' }, // G
          { string: 6, fret: 5, finger: '4' }, // A
          { string: 5, fret: 1, finger: '1' }, // Bb
          { string: 5, fret: 3, finger: '2' }, // C
          { string: 5, fret: 5, finger: '4' }, // D
          { string: 4, fret: 2, finger: '1' }, // E
          { string: 4, fret: 3, finger: '2' }, // F
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 3, fret: 2, finger: '1' }, // A
          { string: 3, fret: 3, finger: '2' }, // Bb
          { string: 3, fret: 5, finger: '4' }, // C
          { string: 2, fret: 3, finger: '1' }, // D
          { string: 2, fret: 5, finger: '2' }, // E
          { string: 2, fret: 6, finger: '4' }, // F
          { string: 1, fret: 5, finger: '3' }, // A
        ]);
      } else if (chord === 'Dm7') {
        // Pentatónica Menor + Arpegio Dm9
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 5, finger: '1' }, // D
          { string: 4, fret: 7, finger: '3' }, // A
          { string: 3, fret: 5, finger: '1' }, // C
          { string: 2, fret: 5, finger: '1' }, // E
          { string: 2, fret: 6, finger: '2' }, // F
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 1, fret: 8, finger: '4' }, // C
          { string: 1, fret: 10, finger: '4' }, // D
          { string: 1, fret: 8, finger: '2' }, // C
          { string: 2, fret: 6, finger: '2' }, // F
          { string: 2, fret: 5, finger: '1' }, // E
          { string: 3, fret: 7, finger: '4' }, // D
          { string: 3, fret: 5, finger: '1' }, // C
          { string: 4, fret: 7, finger: '3' }, // A
          { string: 4, fret: 5, finger: '1' }, // G
          { string: 5, fret: 5, finger: '1' }, // D
        ]);
      } else if (chord === 'G7') {
        // Mixolidio + Arpegio G7
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 3, finger: '1' }, // G
          { string: 5, fret: 2, finger: '1' }, // B
          { string: 5, fret: 5, finger: '4' }, // D
          { string: 4, fret: 3, finger: '2' }, // F
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 3, fret: 4, finger: '3' }, // B
          { string: 2, fret: 3, finger: '2' }, // D
          { string: 1, fret: 1, finger: '1' }, // F
          { string: 1, fret: 3, finger: '3' }, // G
          { string: 1, fret: 7, finger: '4' }, // B
          { string: 2, fret: 6, finger: '3' }, // F
          { string: 2, fret: 3, finger: '1' }, // D
          { string: 3, fret: 4, finger: '2' }, // B
          { string: 4, fret: 5, finger: '4' }, // G
          { string: 5, fret: 5, finger: '4' }, // D
          { string: 6, fret: 3, finger: '1' }, // G
        ]);
      } else if (chord === 'Em7') {
        // Escala Menor Natural + Arpegio Em7
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 5, fret: 7, finger: '2' }, // E
          { string: 4, fret: 5, finger: '1' }, // G
          { string: 4, fret: 9, finger: '4' }, // B
          { string: 3, fret: 7, finger: '2' }, // D
          { string: 3, fret: 9, finger: '4' }, // E
          { string: 2, fret: 8, finger: '3' }, // G
          { string: 1, fret: 7, finger: '1' }, // B
          { string: 1, fret: 10, finger: '4' }, // D
          { string: 1, fret: 12, finger: '4' }, // E
          { string: 2, fret: 8, finger: '2' }, // G
          { string: 3, fret: 9, finger: '4' }, // E
          { string: 3, fret: 7, finger: '2' }, // D
          { string: 4, fret: 9, finger: '4' }, // B
          { string: 4, fret: 5, finger: '1' }, // G
          { string: 5, fret: 7, finger: '2' }, // E
          { string: 6, fret: 7, finger: '2' }, // B
        ]);
      } else {
        // Am7: Pentatónica Extendida + Arpegio Am7
        return createMeasure16Notes(mIdx, offset, chord, [
          { string: 6, fret: 5, finger: '1' }, // A
          { string: 6, fret: 8, finger: '4' }, // C
          { string: 5, fret: 5, finger: '1' }, // D
          { string: 5, fret: 7, finger: '3' }, // E
          { string: 4, fret: 5, finger: '1' }, // G
          { string: 4, fret: 7, finger: '3' }, // A
          { string: 3, fret: 5, finger: '1' }, // C
          { string: 3, fret: 7, finger: '3' }, // D
          { string: 2, fret: 5, finger: '1' }, // E
          { string: 2, fret: 8, finger: '4' }, // G
          { string: 1, fret: 5, finger: '1' }, // A
          { string: 1, fret: 8, finger: '4' }, // C
          { string: 1, fret: 10, finger: '4' }, // D
          { string: 2, fret: 10, finger: '4' }, // A
          { string: 3, fret: 9, finger: '3' }, // E
          { string: 4, fret: 7, finger: '1' }, // A
        ]);
      }
    },
  },
];

/**
 * Convierte un blueprint en un StringExerciseData estructurado con 32 compases
 * y validación tonal absoluta.
 */
export function buildExerciseFromBlueprint(bp: ExerciseBlueprint): StringExerciseData {
  const allNotes: StringTabNote[] = [];
  const measuresData: StringMeasureData[] = [];
  let currentMeasureIndex = 0;

  bp.progression.forEach((block) => {
    for (let i = 0; i < block.measures; i++) {
      const globalStepOffset = currentMeasureIndex * 16;
      const mNotes = bp.generateNotes(currentMeasureIndex, block.chord, globalStepOffset);

      allNotes.push(...mNotes);

      measuresData.push({
        measureIndex: currentMeasureIndex,
        measureNumber: currentMeasureIndex + 1,
        patternCode: `P${(currentMeasureIndex % 8) + 1}`,
        patternName: `${block.chord} - C.${currentMeasureIndex + 1}`,
        patternColor: currentMeasureIndex % 2 === 0 ? 'amber' : 'rose',
        timeSignature: '4/4',
        subdivision: '1/16',
        stepsPerMeasure: 16,
        chordSymbol: block.chord,
        notes: mNotes.map((n, sIdx) => ({
          ...n,
          step: n.step ?? (globalStepOffset + sIdx),
          stepIndex: typeof n.stepIndex === 'number' ? n.stepIndex : sIdx,
          measureIndex: currentMeasureIndex,
        })),
      });

      currentMeasureIndex++;
    }
  });

  return {
    id: `str_${bp.slug.replace(/-/g, '_')}`,
    slug: bp.slug,
    title: bp.title,
    instrument: 'guitar_6',
    tuning: 'E A D G B E',
    category: bp.category,
    difficulty: bp.difficulty,
    bpmDefault: bp.bpm,
    timeSignature: '4/4',
    totalSteps: currentMeasureIndex * 16,
    subdivision: '1/16',
    stepsPerMeasure: 16,
    tabData: allNotes,
    measures: measuresData,
    pickingStyle: 'alternate',
    folder: 'Púa Alternada',
    description: bp.description,
  };
}

/**
 * Colección exportada de los 20 estudios completos (32 compases cada uno)
 */
export const ADVANCED_ALTERNATE_PICKING_20: StringExerciseData[] = BLUEPRINTS.map(buildExerciseFromBlueprint);

/**
 * Validador estricto para verificar que el 100% de los 640 compases (20x32)
 * contengan notas tonalmente correctas respecto al acorde base.
 */
export function validateAllStudies(): { totalStudies: number; totalMeasures: number; invalidNotes: number } {
  let totalStudies = 0;
  let totalMeasures = 0;
  let invalidNotes = 0;

  ADVANCED_ALTERNATE_PICKING_20.forEach((ex) => {
    totalStudies++;
    (ex.measures || []).forEach((m) => {
      totalMeasures++;
      const chord = m.chordSymbol || 'C';
      (m.notes || []).forEach((n) => {
        if (!isValidChordNote(chord, n.string, n.fret)) {
          invalidNotes++;
          console.error(
            `❌ [Nota fuera de tono] ${ex.title} | C.${m.measureNumber} (${chord}) | Cuerda ${n.string}, Traste ${n.fret} (PitchClass ${getNotePitchClass(n.string, n.fret)})`
          );
        }
      });
    });
  });

  return { totalStudies, totalMeasures, invalidNotes };
}

/**
 * Función para sembrar en PostgreSQL vía Prisma (idempotente)
 */
export async function seedAlternatePicking20(prismaClient?: PrismaClient) {
  const prisma = prismaClient || new PrismaClient();
  const results = [];

  // Validación tonal previa antes de insertar
  const val = validateAllStudies();
  console.log(
    `🎼 [Validación Tonal] ${val.totalStudies} estudios verificados, ${val.totalMeasures} compases analizados. Notas fuera de tono: ${val.invalidNotes}`
  );
  if (val.invalidNotes > 0) {
    throw new Error(`Se detectaron ${val.invalidNotes} notas fuera de escala/acorde.`);
  }

  for (const ex of ADVANCED_ALTERNATE_PICKING_20) {
    const tabPayload = {
      tabNotes: ex.tabData,
      notes: ex.tabData,
      data: ex.tabData,
      measures: ex.measures,
      patternBank: ex.patternBank || [],
      pickingStyle: ex.pickingStyle,
      folder: ex.folder,
    };

    const saved = await prisma.stringExercise.upsert({
      where: { slug: ex.slug },
      update: {
        title: ex.title,
        instrument: ex.instrument,
        tuning: ex.tuning,
        category: ex.category,
        difficulty: ex.difficulty,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature,
        subdivision: ex.subdivision,
        stepsPerMeasure: ex.stepsPerMeasure,
        totalSteps: ex.totalSteps,
        tabData: tabPayload as any,
        folder: ex.folder,
      },
      create: {
        slug: ex.slug,
        title: ex.title,
        instrument: ex.instrument,
        tuning: ex.tuning,
        category: ex.category,
        difficulty: ex.difficulty,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature,
        subdivision: ex.subdivision,
        stepsPerMeasure: ex.stepsPerMeasure,
        totalSteps: ex.totalSteps,
        tabData: tabPayload as any,
        folder: ex.folder,
      },
    });

    results.push(saved.slug);
  }

  return results;
}

// Ejecución directa si se corre desde CLI (npx tsx prisma/seeds/advancedAlternatePicking20.ts)
if (require.main === module) {
  const prisma = new PrismaClient();
  seedAlternatePicking20(prisma)
    .then((saved) => {
      console.log(`✅ ${saved.length} estudios de 32 compases (AP-01 a AP-20) guardados en la carpeta "Púa Alternada" en PostgreSQL.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error sembrando estudios de púa alternada:', err);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
