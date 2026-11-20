// ============================================================================
// Motor de Ortografía Diatónica Práctica para Músicos Modernos
// SoundLab - Diapasón & Armonía (/fretboard)
// Cero dobles alteraciones (## / bb). Tonalidades reales del Círculo de Quintas.
// ============================================================================

export const CHROMATIC_NOTES_SHARP = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export const CHROMATIC_NOTES_FLAT = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export const NATURAL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export const LETTER_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * Mapeo de tonalidades mayores canónicas según el Círculo de Quintas
 * (Cero dobles alteraciones, armaduras estándar de la práctica musical moderna)
 */
export const CIRCLE_OF_FIFTHS_MAJOR: Record<number, string> = {
  0: 'C',
  1: 'Db', // 5 bemoles (Db, Eb, F, Gb, Ab, Bb, C)
  2: 'D',  // 2 sostenidos (D, E, F#, G, A, B, C#)
  3: 'Eb', // 3 bemoles (Eb, F, G, Ab, Bb, C, D) - NUNCA D# Mayor con F## y C##
  4: 'E',  // 4 sostenidos (E, F#, G#, A, B, C#, D#)
  5: 'F',  // 1 bemol (F, G, A, Bb, C, D, E)
  6: 'F#', // 6 sostenidos (F#, G#, A#, B, C#, D#, E#)
  7: 'G',  // 1 sostenido (G, A, B, C, D, E, F#)
  8: 'Ab', // 4 bemoles (Ab, Bb, C, Db, Eb, F, G) - NUNCA G# Mayor con F##
  9: 'A',  // 3 sostenidos (A, B, C#, D, E, F#, G#)
  10: 'Bb', // 2 bemoles (Bb, C, D, Eb, F, G, A) - NUNCA A# Mayor con F##, C##, G##
  11: 'B', // 5 sostenidos (B, C#, D#, E, F#, G#, A#)
};

/**
 * Tonalidades menores estándar (Eólico / Menor Natural) del Círculo de Quintas
 */
export const CIRCLE_OF_FIFTHS_MINOR: Record<number, string> = {
  0: 'C',
  1: 'C#', // 4 sostenidos (C#m). Db menor daría Bbb (doble bemol)
  2: 'D',  // 1 bemol
  3: 'Eb', // Ebm (6 bemoles) o D#m (6 sostenidos)
  4: 'E',  // 1 sostenido
  5: 'F',  // 4 bemoles
  6: 'F#', // 3 sostenidos (F#m). Gb menor daría Bbb (doble bemol)
  7: 'G',  // 2 bemoles
  8: 'G#', // 5 sostenidos (G#m). Ab menor daría 7 bemoles
  9: 'A',  // 0 alteraciones
  10: 'Bb', // 5 bemoles (Bbm). A# menor daría 7 sostenidos
  11: 'B', // 2 sostenidos
};

/**
 * Opciones canónicas para selectores de tonalidad en la interfaz de usuario.
 * Cumple con el estándar del Círculo de Quintas y etiquetas amigables para músicos.
 */
export const DISPLAY_ROOTS = [
  { value: 'C', label: 'C' },
  { value: 'Db', label: 'C# / Db' },
  { value: 'D', label: 'D' },
  { value: 'Eb', label: 'D# / Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F# / Gb' },
  { value: 'G', label: 'G' },
  { value: 'Ab', label: 'G# / Ab' },
  { value: 'A', label: 'A' },
  { value: 'Bb', label: 'A# / Bb' },
  { value: 'B', label: 'B' },
] as const;

export type DisplayRootValue = typeof DISPLAY_ROOTS[number]['value'];

/**
 * Intervalos de semitonos para modos y escalas estándar
 */
export const MODE_INTERVALS_CATALOG: Record<string, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  minor_natural: [0, 2, 3, 5, 7, 8, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  minor_harmonic: [0, 2, 3, 5, 7, 8, 11],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  minor_melodic: [0, 2, 3, 5, 7, 9, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  pentatonic_minor: [0, 3, 5, 7, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

/**
 * Convierte cualquier string de nota (sostenidos, bemoles, caracteres unicode o slash)
 * a su clase de tono (Pitch Class) 0 a 11.
 */
export function getPitchClass(noteStr: string): number {
  if (!noteStr) return 0;

  const trimmed = noteStr.trim();

  // Si viene con formato combinado como "D# / Eb" o "Eb / D#"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    // Preferir la parte bemol si existe (ej. Eb en D# / Eb)
    const flatPart = parts.find((p) => p.includes('b') || p.includes('♭'));
    if (flatPart) return getPitchClass(flatPart);
    return getPitchClass(parts[0]);
  }

  // Si tiene sufijos tipo "Eb Mayor" o "Ebmaj7" o "Eb (D#)"
  const cleanMatch = trimmed.match(/^([A-Ga-g][#b♯♭]?)/);
  const core = cleanMatch ? cleanMatch[1] : trimmed;

  const letter = core.charAt(0).toUpperCase();
  const acc = core.slice(1);

  const baseSemitone = LETTER_SEMITONES[letter];
  if (baseSemitone === undefined) return 0;

  let semitone = baseSemitone;
  for (const char of acc) {
    if (char === '#' || char === '♯') semitone += 1;
    else if (char === 'b' || char === '♭') semitone -= 1;
  }

  return ((semitone % 12) + 12) % 12;
}

/**
 * Determina si un modo o escala es de cualidad mayor (tercera mayor = 4 semitonos)
 */
export function isMajorQualityMode(mode: string = 'ionian'): boolean {
  const norm = mode.toLowerCase();
  return (
    norm === 'ionian' ||
    norm === 'major' ||
    norm === 'lydian' ||
    norm === 'mixolydian' ||
    norm === 'pentatonic_major'
  );
}

/**
 * Resuelve la tónica limpia canónica del Círculo de Quintas sin dobles alteraciones.
 * - En Modo Mayor / Jónico:
 *   D# -> Eb (Eb - Fm - Gm - Ab - Bb - Cm - Dm7b5)
 *   G# -> Ab (Ab - Bbm - Cm - Db - Eb - Fm - Gm7b5)
 *   A# -> Bb (Bb - Cm - Dm - Eb - F - Gm - Am7b5)
 *   C# / Db -> Db (o C# si se eligió explícitamente y es limpio)
 *   F# / Gb -> F# (o Gb si se eligió explícitamente y es limpio)
 * - En Modos Menores / Modos Griegos:
 *   Elige automáticamente la raíz enarmónica que produzca CERO ## y CERO bb
 *   (ej. D#m = D#m - E#m7b5 - F# - G#m - A#m - B - C#, Ebm = Ebm - Fm7b5 - Gb - Abm - Bbm - Cb - Db,
 *   C#m en lugar de Dbm que tendría Bbb, F#m en lugar de Gbm que tendría Bbb).
 */
export function resolveCleanKeyRoot(rawRoot: string, mode: string = 'ionian'): string {
  const pitch = getPitchClass(rawRoot);
  const cleanMode = mode.toLowerCase();

  // 1. En Modo Mayor / Jónico (y Lidio, Mixolidio):
  // Regla absoluta: nunca dobles alteraciones ## ni bb
  if (isMajorQualityMode(cleanMode)) {
    if (pitch === 3) return 'Eb'; // Siempre Eb, nunca D# Mayor
    if (pitch === 8) return 'Ab'; // Siempre Ab, nunca G# Mayor
    if (pitch === 10) return 'Bb'; // Siempre Bb, nunca A# Mayor

    if (pitch === 1) {
      // C# vs Db: Db (5 bemoles) es la norma del círculo de quintas; si rawRoot fue explícitamente C#,
      // C# Mayor tiene 7 sostenidos simples (sin ##). Pero en la práctica moderna Db es la recomendada.
      if (rawRoot.trim().startsWith('C#') && !rawRoot.includes('Db')) return 'C#';
      return 'Db';
    }

    if (pitch === 6) {
      // F# vs Gb: F# (6 sostenidos) o Gb (6 bemoles), ambos tienen 0 dobles alteraciones.
      if (rawRoot.trim().startsWith('Gb')) return 'Gb';
      return 'F#';
    }

    return CIRCLE_OF_FIFTHS_MAJOR[pitch] || 'C';
  }

  // 2. En Modos Menores / Modos Griegos con tercera menor (Eólico, Dórico, Frigio, etc.)
  // y Menor Armónica / Melódica:
  if (pitch === 1) return 'C#'; // C#m (4#). Dbm daría Bbb (doble bemol)
  if (pitch === 6) return 'F#'; // F#m (3#). Gbm daría Bbb (doble bemol)
  if (pitch === 8) return 'G#'; // G#m (5#). Abm daría 7 bemoles
  if (pitch === 10) return 'Bb'; // Bbm (5b). A#m daría 7 sostenidos

  if (pitch === 3) {
    // Pitch 3: D#m vs Ebm
    // En Menor Armónica: D# menor armónica tiene C## (séptima mayor de D#), por lo tanto
    // en Menor Armónica SIEMPRE debe ser Eb para evitar C## (Eb m armónica = Eb, F, Gb, Ab, Bb, Cb, D).
    if (cleanMode.includes('harmonic') || cleanMode.includes('armonica') || cleanMode.includes('armónica')) {
      return 'Eb';
    }

    // En Menor Natural / Eólico / Dórico:
    // Si el usuario especificó 'D#' o 'D#m', D#m = D# - E#m7b5 - F# - G#m - A#m - B - C# (cero ## y cero bb).
    // Si especificó 'Eb' o 'Ebm', Ebm = Eb - Fm7b5 - Gb - Abm - Bbm - Cb - Db (cero ## y cero bb).
    const rawTrimmed = rawRoot.trim().toUpperCase();
    if (rawTrimmed.startsWith('D#')) return 'D#';
    return 'Eb';
  }

  // Verificar si la raíz del círculo menor produce 0 dobles alteraciones
  const defaultMinorRoot = CIRCLE_OF_FIFTHS_MINOR[pitch] || 'C';
  return defaultMinorRoot;
}

/**
 * Calcula las 7 notas diatónicas de una escala con letras consecutivas y ortografía limpia
 * garantizando CERO ## y CERO bb.
 */
export function getCleanDiatonicScaleNotes(
  keyRoot: string,
  mode: string = 'ionian',
  customIntervals?: number[]
): string[] {
  const cleanRoot = resolveCleanKeyRoot(keyRoot, mode);
  const rootPitch = getPitchClass(cleanRoot);
  const rootLetter = cleanRoot.charAt(0).toUpperCase();
  const rootLetterIdx = NATURAL_LETTERS.indexOf(rootLetter as any);

  const intervals =
    customIntervals && customIntervals.length === 7
      ? customIntervals
      : MODE_INTERVALS_CATALOG[mode] || MODE_INTERVALS_CATALOG.ionian;

  if (rootLetterIdx === -1 || intervals.length !== 7) {
    // Fallback para escalas pentatónicas o exóticas
    return intervals.map((semitones) => {
      const p = (rootPitch + semitones) % 12;
      return CIRCLE_OF_FIFTHS_MAJOR[p] || CHROMATIC_NOTES_SHARP[p];
    });
  }

  const result: string[] = [];

  for (let degIdx = 0; degIdx < 7; degIdx++) {
    const targetLetter = NATURAL_LETTERS[(rootLetterIdx + degIdx) % 7];
    const naturalSemitone = LETTER_SEMITONES[targetLetter];
    const targetPitch = (rootPitch + intervals[degIdx]) % 12;

    let diff = (targetPitch - naturalSemitone + 12) % 12;
    if (diff > 6) diff -= 12;

    if (diff === 0) {
      result.push(targetLetter);
    } else if (diff === 1) {
      result.push(`${targetLetter}#`);
    } else if (diff === -1) {
      result.push(`${targetLetter}b`);
    } else if (diff === 2) {
      // Red de seguridad: si un cálculo produjera ##, simplificar al enarmónico simple sin ##
      result.push(CHROMATIC_NOTES_SHARP[targetPitch]);
    } else if (diff === -2) {
      // Red de seguridad: si produjera bb, simplificar al enarmónico simple sin bb
      result.push(CHROMATIC_NOTES_FLAT[targetPitch]);
    } else {
      result.push(CHROMATIC_NOTES_SHARP[targetPitch]);
    }
  }

  return result;
}

/**
 * Obtiene el nombre ortográficamente correcto de la fundamental diatónica (ej. Eb, Bb, F#)
 * para un grado y distancia en semitonos, garantizando CERO ## y CERO bb.
 */
export function getCleanDiatonicDegreeRoot(
  keyRoot: string,
  semitonesFromRoot: number,
  degreeIndex: number,
  mode: string = 'ionian'
): string {
  const scaleNotes = getCleanDiatonicScaleNotes(keyRoot, mode);
  if (degreeIndex >= 0 && degreeIndex < scaleNotes.length) {
    return scaleNotes[degreeIndex];
  }

  // Fallback si degreeIndex está fuera de rango:
  const cleanRoot = resolveCleanKeyRoot(keyRoot, mode);
  const targetPitch = (getPitchClass(cleanRoot) + semitonesFromRoot) % 12;
  const isFlatKey = cleanRoot.includes('b') || cleanRoot === 'F';
  return isFlatKey ? CHROMATIC_NOTES_FLAT[targetPitch] : CHROMATIC_NOTES_SHARP[targetPitch];
}

/**
 * Obtiene el nombre limpio de una nota en el contexto de una tonalidad dada.
 * Si la nota pertenece a la escala diatónica de la tonalidad, se devuelve su nombre exacto
 * en la escala (ej. si la tonalidad es Eb Mayor, el pitch 3 es 'Eb', el pitch 8 es 'Ab', el 10 es 'Bb').
 * Si está fuera de la escala, usa la alteración armónica coherente (bemoles para tonalidades de bemoles).
 */
export function getCleanNoteNameForTonality(
  pitchOrNote: number | string,
  keyRoot: string,
  mode: string = 'ionian'
): string {
  const targetPitch = typeof pitchOrNote === 'number' ? pitchOrNote : getPitchClass(pitchOrNote);
  const cleanRoot = resolveCleanKeyRoot(keyRoot, mode);
  const scaleNotes = getCleanDiatonicScaleNotes(cleanRoot, mode);

  // Buscar si el pitch coincide con alguna nota de la escala diatónica
  for (const sn of scaleNotes) {
    if (getPitchClass(sn) === targetPitch) {
      return sn;
    }
  }

  // Nota cromática fuera de la escala:
  const isFlatKey = cleanRoot.includes('b') || cleanRoot === 'F';
  return isFlatKey ? CHROMATIC_NOTES_FLAT[targetPitch] : CHROMATIC_NOTES_SHARP[targetPitch];
}

/**
 * Normaliza cualquier nombre de tónica al índice cromático 0..11 estándar
 */
export function normalizeToChromaticIndex(root: string): number {
  return getPitchClass(root);
}
