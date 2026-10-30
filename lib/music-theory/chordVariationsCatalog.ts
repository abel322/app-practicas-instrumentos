import { CHROMATIC_NOTES, ENHARMONIC_MAP, InstrumentType } from './fretboard';
import { CagedChordVoicing } from './cagedHarmonics';

export interface ChordTensionVariation {
  id: string;
  shortLabel: string;
  fullName: string;
  category: 'standard' | 'sixth' | 'altered' | 'diminished' | 'slash';
  intervalFormula: { label: string; semitones: number }[];
  description: string;
}

export interface RawNote {
  stringIndex: number;
  fret: number;
  finger: number;
  intervalLabel: string;
  isRoot: boolean;
}

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

function getDegreeRoot(keyRoot: string, semitones: number): string {
  const safeRootIndex = normalizeToChromaticIndex(keyRoot);
  return CHROMATIC_NOTES[(safeRootIndex + semitones) % 12];
}

export function isStandardVariation(variationId: string): boolean {
  return (
    variationId === 'dom_std' ||
    variationId === 'maj_std' ||
    variationId === 'dim_half' ||
    variationId === 'min_std'
  );
}

/**
 * Obtiene las variaciones de tensiones avanzadas filtradas contextualmente según el grado armónico
 */
export function getVariationsForDegree(
  degreeIndex: number, // 0 = I, 4 = V, 6 = vii°, etc.
  keyRoot: string
): ChordTensionVariation[] {
  // 1. GRADO V (Dominante con tensiones de jazz y slash chord)
  if (degreeIndex === 4) {
    const ivRoot = getDegreeRoot(keyRoot, 5);
    const vRoot = getDegreeRoot(keyRoot, 7);
    const slashLabel = keyRoot === 'C' ? 'IV/V (F/G)' : `IV/V (${ivRoot}/${vRoot})`;

    return [
      {
        id: 'dom_std',
        shortLabel: '7 (Natural)',
        fullName: 'Dominante 7',
        category: 'standard',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: '5', semitones: 7 },
          { label: 'b7', semitones: 10 },
        ],
        description: 'Séptima dominante diatónica estándar',
      },
      {
        id: 'dom_b9',
        shortLabel: '7(♭9)',
        fullName: 'Dominante 7 (♭9)',
        category: 'altered',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: 'b7', semitones: 10 },
          { label: 'b9', semitones: 1 },
        ],
        description: 'Tensión flamenca / menor armónica',
      },
      {
        id: 'dom_s9',
        shortLabel: '7(♯9)',
        fullName: 'Dominante 7 (♯9 / Hendrix)',
        category: 'altered',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: 'b7', semitones: 10 },
          { label: '#9', semitones: 3 },
        ],
        description: 'Acorde de blues / funk / jazz rock',
      },
      {
        id: 'dom_s11',
        shortLabel: '7(♯11)',
        fullName: 'Dominante Lidio 7(♯11)',
        category: 'altered',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: 'b7', semitones: 10 },
          { label: '#11', semitones: 6 },
        ],
        description: 'Escala Lidia Dominante (4º modo menor melódica)',
      },
      {
        id: 'dom_b13',
        shortLabel: '7(♭13)',
        fullName: 'Dominante 7 (♭13)',
        category: 'altered',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: 'b7', semitones: 10 },
          { label: 'b13', semitones: 8 },
        ],
        description: 'Tensión de quinta aumentada',
      },
      {
        id: 'dom_alt',
        shortLabel: '7alt',
        fullName: 'Dominante Súper-Alterado',
        category: 'altered',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: 'b7', semitones: 10 },
          { label: 'b9', semitones: 1 },
          { label: '#9', semitones: 3 },
          { label: 'b13', semitones: 8 },
        ],
        description: 'Máxima tensión de resolución al Grado I',
      },
      {
        id: 'dom_slash',
        shortLabel: slashLabel,
        fullName: `Poliacorde IV/V (${vRoot}9sus4)`,
        category: 'slash',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '4', semitones: 5 },
          { label: '5', semitones: 7 },
          { label: 'b7', semitones: 10 },
          { label: '9', semitones: 2 },
        ],
        description: `Tríada de ${ivRoot} con bajo en ${vRoot}, sonoridad gospel/fusion`,
      },
    ];
  }

  // 2. GRADOS I y IV (Mayores: Sextas, 6/9 y Lidio Poliacorde)
  if (degreeIndex === 0 || degreeIndex === 3) {
    const isDegree0 = degreeIndex === 0;
    const iRoot = getDegreeRoot(keyRoot, isDegree0 ? 0 : 5);
    const iiRoot = getDegreeRoot(keyRoot, isDegree0 ? 2 : 7);
    const slashLabel = isDegree0
      ? keyRoot === 'C'
        ? 'II/I (D/C)'
        : `II/I (${iiRoot}/${iRoot})`
      : keyRoot === 'C'
      ? 'V/IV (G/F)'
      : `V/IV (${iiRoot}/${iRoot})`;

    return [
      {
        id: 'maj_std',
        shortLabel: 'Maj7',
        fullName: 'Mayor 7 Diatónico',
        category: 'standard',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: '5', semitones: 7 },
          { label: '7', semitones: 11 },
        ],
        description: 'Sonoridad clásica de reposo mayor',
      },
      {
        id: 'maj_6',
        shortLabel: '6',
        fullName: 'Acorde de 6ª Mayor',
        category: 'sixth',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: '5', semitones: 7 },
          { label: '6', semitones: 9 },
        ],
        description: 'Estilo Swing y Bossa Nova (sin disonancia de 7ª)',
      },
      {
        id: 'maj_69',
        shortLabel: '6/9',
        fullName: 'Acorde Pentatónico 6/9',
        category: 'sixth',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: '6', semitones: 9 },
          { label: '9', semitones: 2 },
        ],
        description: 'Voicing abierto de gran riqueza armónica',
      },
      {
        id: 'maj_add9',
        shortLabel: 'add9',
        fullName: 'Mayor con 9ª añadida',
        category: 'standard',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: '5', semitones: 7 },
          { label: '9', semitones: 2 },
        ],
        description: 'Tríada mayor con 9ª sin séptima',
      },
      {
        id: 'maj_slash',
        shortLabel: slashLabel,
        fullName: 'Poliacorde Lidio Híbrido',
        category: 'slash',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: '3', semitones: 4 },
          { label: '#11', semitones: 6 },
          { label: '9', semitones: 2 },
          { label: '13', semitones: 9 },
        ],
        description: 'Tríada sobre bajo que genera atmósfera lidia cinematográfica',
      },
    ];
  }

  // 3. GRADO vii° (Semidisminuido vs Disminuido Completo)
  if (degreeIndex === 6) {
    return [
      {
        id: 'dim_half',
        shortLabel: 'm7(♭5) / ø7',
        fullName: 'Semidisminuido Diatónico',
        category: 'standard',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: 'b3', semitones: 3 },
          { label: 'b5', semitones: 6 },
          { label: 'b7', semitones: 10 },
        ],
        description: 'Séptima menor con quinta disminuida diatónica',
      },
      {
        id: 'dim_full',
        shortLabel: '°7 (Disminuido Completo)',
        fullName: 'Disminuido Simétrico (°7)',
        category: 'diminished',
        intervalFormula: [
          { label: 'R', semitones: 0 },
          { label: 'b3', semitones: 3 },
          { label: 'b5', semitones: 6 },
          { label: 'bb7', semitones: 9 },
        ],
        description: 'Intercambio modal menor armónica; simetría de terceras menores',
      },
    ];
  }

  // 4. GRADOS ii, iii y vi (Menores)
  return [
    {
      id: 'min_std',
      shortLabel: 'm7',
      fullName: 'Menor 7 Diatónico',
      category: 'standard',
      intervalFormula: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '5', semitones: 7 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Acorde menor diatónico',
    },
    {
      id: 'min_6',
      shortLabel: 'm6',
      fullName: 'Menor 6 (Menor Melódica)',
      category: 'sixth',
      intervalFormula: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
      ],
      description: 'Sonoridad oscura de jazz menor',
    },
    {
      id: 'min_11',
      shortLabel: 'm11',
      fullName: 'Menor 11',
      category: 'standard',
      intervalFormula: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: 'b7', semitones: 10 },
        { label: '11', semitones: 5 },
      ],
      description: 'Sonoridad moderna modal',
    },
    {
      id: 'min_add9',
      shortLabel: 'm(add9)',
      fullName: 'Menor con 9ª añadida',
      category: 'standard',
      intervalFormula: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '5', semitones: 7 },
        { label: '9', semitones: 2 },
      ],
      description: 'Tríada menor moderna sin séptima',
    },
  ];
}

/**
 * Catálogo Maestro de Voicings Físicos en C Mayor para Guitarra (6 Cuerdas)
 * BoxId (1..5) -> DegreeIndex (0..6) -> VariationId -> RawNote[]
 */
const GUITAR_VARIATION_VOICINGS_C_MAJOR: Record<
  number,
  Record<number, Record<string, RawNote[]>>
> = {
  // ==========================================
  // CAJA 4 (FORMA E) - Trastes 7-10 en C Mayor
  // ==========================================
  4: {
    // Grado 0: I (C Mayor)
    0: {
      maj_std: [
        { stringIndex: 5, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      maj_6: [
        { stringIndex: 5, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '6', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: '5', isRoot: false },
      ],
      maj_69: [
        { stringIndex: 5, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '6', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 3, intervalLabel: '5', isRoot: false },
      ],
      maj_add9: [
        { stringIndex: 5, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      maj_slash: [
        { stringIndex: 5, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '13', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 7, finger: 1, intervalLabel: '#11', isRoot: false },
        { stringIndex: 0, fret: 10, finger: 4, intervalLabel: '9', isRoot: false },
      ],
    },

    // Grado 1: ii (Dm)
    1: {
      min_std: [
        { stringIndex: 5, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      min_6: [
        { stringIndex: 5, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '6', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      min_11: [
        { stringIndex: 5, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
      ],
      min_add9: [
        { stringIndex: 5, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '9', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '5', isRoot: false },
      ],
    },

    // Grado 2: iii (Em)
    2: {
      min_std: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      min_6: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 6, finger: 1, intervalLabel: '6', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      min_11: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      min_add9: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 7, finger: 1, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
      ],
    },

    // Grado 3: IV (F Mayor)
    3: {
      maj_std: [
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 9, finger: 2, intervalLabel: '7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      maj_6: [
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '6', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 2, intervalLabel: '5', isRoot: false },
      ],
      maj_69: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '6', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 2, intervalLabel: '5', isRoot: false },
      ],
      maj_add9: [
        { stringIndex: 4, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: '5', isRoot: false },
      ],
      maj_slash: [
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 3, intervalLabel: '#11', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '13', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '#11', isRoot: false },
      ],
    },

    // Grado 4: V (G7 Dominante Alterado)
    4: {
      dom_std: [
        { stringIndex: 4, fret: 10, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      dom_b9: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 9, finger: 1, intervalLabel: 'b9', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      dom_s9: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 11, finger: 4, intervalLabel: '#9', isRoot: false },
      ],
      dom_s11: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 9, finger: 2, intervalLabel: '#11', isRoot: false },
      ],
      dom_b13: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: 'b13', isRoot: false },
      ],
      dom_alt: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 9, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 3, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 11, finger: 4, intervalLabel: '#9', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: 'b13', isRoot: false },
      ],
      dom_slash: [
        { stringIndex: 4, fret: 10, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 10, finger: 3, intervalLabel: '4', isRoot: false },
        { stringIndex: 2, fret: 10, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 10, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 1, intervalLabel: '4', isRoot: false },
      ],
    },

    // Grado 5: vi (Am)
    5: {
      min_std: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      min_6: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 7, finger: 1, intervalLabel: '6', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
      min_11: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: '11', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 8, finger: 2, intervalLabel: 'b7', isRoot: false },
      ],
      min_add9: [
        { stringIndex: 4, fret: 7, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 9, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 8, finger: 2, intervalLabel: 'b3', isRoot: false },
        { stringIndex: 0, fret: 7, finger: 1, intervalLabel: '9', isRoot: false },
      ],
    },

    // Grado 6: vii° (Bm7b5 vs B°7)
    6: {
      dim_half: [
        { stringIndex: 5, fret: 7, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 3, fret: 7, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 1, intervalLabel: 'b3', isRoot: false },
      ],
      dim_full: [
        { stringIndex: 5, fret: 7, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 8, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 3, fret: 6, finger: 1, intervalLabel: 'bb7', isRoot: false },
        { stringIndex: 2, fret: 7, finger: 2, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },

  // ==========================================
  // CAJA 1 (FORMA C) - Trastes 0-3 en C Mayor
  // ==========================================
  1: {
    0: {
      maj_std: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '7', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      maj_6: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '6', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      maj_69: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '6', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      maj_add9: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: '9', isRoot: false },
        { stringIndex: 0, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
      ],
      maj_slash: [
        { stringIndex: 4, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 4, finger: 4, intervalLabel: '#11', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '13', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: '9', isRoot: false },
      ],
    },
    4: {
      dom_std: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 0, finger: 1, intervalLabel: '5', isRoot: false },
        { stringIndex: 2, fret: 0, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 1, fret: 0, finger: 1, intervalLabel: '3', isRoot: false },
        { stringIndex: 0, fret: 1, finger: 1, intervalLabel: 'b7', isRoot: false },
      ],
      dom_b9: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'b9', isRoot: false },
      ],
      dom_s9: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 3, finger: 4, intervalLabel: '#9', isRoot: false },
      ],
      dom_s11: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 2, finger: 2, intervalLabel: '#11', isRoot: false },
      ],
      dom_b13: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'b13', isRoot: false },
      ],
      dom_alt: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 3, finger: 4, intervalLabel: '#9', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: 'b13', isRoot: false },
      ],
      dom_slash: [
        { stringIndex: 5, fret: 3, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: '9', isRoot: false },
        { stringIndex: 1, fret: 1, finger: 1, intervalLabel: '4', isRoot: false },
      ],
    },
    6: {
      dim_half: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 2, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
      dim_full: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'bb7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },

  // ==========================================
  // CAJA 2 (FORMA A) - Trastes 2-5 en C Mayor
  // ==========================================
  2: {
    4: {
      dom_std: [
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      dom_s9: [
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 6, finger: 4, intervalLabel: '#9', isRoot: false },
      ],
      dom_b9: [
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 4, finger: 2, intervalLabel: 'b9', isRoot: false },
      ],
      dom_s11: [
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 3, finger: 1, intervalLabel: 'R', isRoot: true },
      ],
      dom_b13: [
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 4, finger: 2, intervalLabel: 'b13', isRoot: false },
        { stringIndex: 0, fret: 6, finger: 4, intervalLabel: 'b7', isRoot: false },
      ],
      dom_alt: [
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 4, finger: 2, intervalLabel: '3', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 0, fret: 6, finger: 4, intervalLabel: '#9', isRoot: false },
      ],
      dom_slash: [
        { stringIndex: 4, fret: 5, finger: 3, intervalLabel: '5', isRoot: false },
        { stringIndex: 3, fret: 5, finger: 3, intervalLabel: 'R', isRoot: true },
        { stringIndex: 2, fret: 5, finger: 3, intervalLabel: '4', isRoot: false },
        { stringIndex: 1, fret: 6, finger: 4, intervalLabel: 'b7', isRoot: false },
      ],
    },
    6: {
      dim_half: [
        { stringIndex: 4, fret: 2, finger: 1, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 2, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 2, finger: 1, intervalLabel: 'b7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 3, intervalLabel: 'b3', isRoot: false },
      ],
      dim_full: [
        { stringIndex: 4, fret: 2, finger: 2, intervalLabel: 'R', isRoot: true },
        { stringIndex: 3, fret: 3, finger: 3, intervalLabel: 'b5', isRoot: false },
        { stringIndex: 2, fret: 1, finger: 1, intervalLabel: 'bb7', isRoot: false },
        { stringIndex: 1, fret: 3, finger: 4, intervalLabel: 'b3', isRoot: false },
      ],
    },
  },
};

/**
 * Aplica una variación armónica avanzada (ej. 7#9, 6/9, °7, etc.) sobre un acorde CAGED base
 * adaptando los trastes, nombres e intervalos en tiempo real.
 */
export function applyChordTensionVariation(
  baseChord: CagedChordVoicing,
  variation: ChordTensionVariation,
  keyRoot: string,
  cagedBoxId: number,
  instrumentType: InstrumentType = 'guitar_6'
): CagedChordVoicing {
  if (isStandardVariation(variation.id) && variation.id.endsWith('_std')) {
    return baseChord;
  }

  const safeRootIndex = normalizeToChromaticIndex(keyRoot);
  const transposeOffset = safeRootIndex;
  const isBass = instrumentType === 'bass_4' || instrumentType === 'bass_5';

  // Obtener el índice del grado (0 a 6)
  const degMap: Record<string, number> = {
    I: 0,
    ii: 1,
    iii: 2,
    IV: 3,
    V: 4,
    vi: 5,
    'vii°': 6,
  };
  const degIdx = degMap[baseChord.degreeRoman] ?? 0;

  // 1. Verificar si existe en el catálogo maestro para guitarra
  let rawNotes: RawNote[] | null = null;
  if (!isBass) {
    const boxDef = GUITAR_VARIATION_VOICINGS_C_MAJOR[cagedBoxId];
    if (boxDef && boxDef[degIdx] && boxDef[degIdx][variation.id]) {
      rawNotes = boxDef[degIdx][variation.id];
    }
  }

  // 2. Si no hay catálogo específico, aplicar transformación algorítmica sobre baseChord.notes
  if (!rawNotes) {
    // Tomamos las notas del acorde base des-transpuestas (en C)
    const baseUntransposed = baseChord.notes.map((n) => {
      let uFret = n.fret - transposeOffset;
      if (uFret < 0) uFret += 12;
      if (uFret > 24) uFret -= 12;
      return {
        stringIndex: n.stringIndex,
        fret: uFret,
        finger: n.finger,
        intervalLabel: n.intervalLabel,
        isRoot: n.isRoot,
      };
    });

    rawNotes = baseUntransposed.map((n) => {
      // Sustituciones teóricas según la variación
      if (variation.id === 'dim_full') {
        if (n.intervalLabel === 'b7' || n.intervalLabel === '7') {
          return { ...n, fret: Math.max(0, n.fret - 1), intervalLabel: 'bb7', isRoot: false };
        }
      } else if (variation.id === 'maj_6') {
        if (n.intervalLabel === '7') {
          return { ...n, fret: Math.max(0, n.fret - 2), intervalLabel: '6', isRoot: false };
        }
      } else if (variation.id === 'maj_69') {
        if (n.intervalLabel === '7') {
          return { ...n, fret: Math.max(0, n.fret - 2), intervalLabel: '6', isRoot: false };
        }
        if (n.intervalLabel === '5' && n.stringIndex <= 2) {
          return { ...n, fret: Math.max(0, n.fret - 5), intervalLabel: '9', isRoot: false };
        }
      } else if (variation.id === 'maj_add9') {
        if (n.intervalLabel === '7' || (n.isRoot && n.stringIndex <= 2)) {
          return { ...n, fret: n.fret + 2, intervalLabel: '9', isRoot: false };
        }
      } else if (variation.id === 'dom_s9') {
        if (n.isRoot && n.stringIndex <= 2) {
          return { ...n, fret: n.fret + 3, intervalLabel: '#9', isRoot: false };
        }
        if (n.intervalLabel === '5' && n.stringIndex <= 2) {
          return { ...n, fret: n.fret - 4, intervalLabel: '#9', isRoot: false };
        }
      } else if (variation.id === 'dom_b9') {
        if (n.isRoot && n.stringIndex <= 2) {
          return { ...n, fret: n.fret + 1, intervalLabel: 'b9', isRoot: false };
        }
      } else if (variation.id === 'dom_s11') {
        if (n.intervalLabel === '5') {
          return { ...n, fret: Math.max(0, n.fret - 1), intervalLabel: '#11', isRoot: false };
        }
      } else if (variation.id === 'dom_b13') {
        if (n.intervalLabel === '5') {
          return { ...n, fret: n.fret + 1, intervalLabel: 'b13', isRoot: false };
        }
      } else if (variation.id === 'min_6') {
        if (n.intervalLabel === 'b7' || n.intervalLabel === '7') {
          return { ...n, fret: Math.max(0, n.fret - 1), intervalLabel: '6', isRoot: false };
        }
      } else if (variation.id === 'min_11') {
        if (n.intervalLabel === '5' || (n.isRoot && n.stringIndex <= 2)) {
          return { ...n, fret: n.fret - 2, intervalLabel: '11', isRoot: false };
        }
      } else if (variation.id === 'min_add9') {
        if (n.intervalLabel === 'b7' || (n.isRoot && n.stringIndex <= 2)) {
          return { ...n, fret: n.fret + 2, intervalLabel: '9', isRoot: false };
        }
      }
      return n;
    });
  }

  // 3. Transponer trastes con control de límites para 24 trastes
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

  // 4. Nombre armónico enriquecido
  let formattedChordName = baseChord.chordName;
  if (variation.id === 'dom_s9') formattedChordName = `${baseChord.rootNote}7(♯9)`;
  else if (variation.id === 'dom_b9') formattedChordName = `${baseChord.rootNote}7(♭9)`;
  else if (variation.id === 'dom_s11') formattedChordName = `${baseChord.rootNote}7(♯11)`;
  else if (variation.id === 'dom_b13') formattedChordName = `${baseChord.rootNote}7(♭13)`;
  else if (variation.id === 'dom_alt') formattedChordName = `${baseChord.rootNote}7alt`;
  else if (variation.id === 'dom_slash') {
    const ivRoot = getDegreeRoot(keyRoot, 5);
    formattedChordName = `${ivRoot}/${baseChord.rootNote}`;
  } else if (variation.id === 'maj_6') formattedChordName = `${baseChord.rootNote}6`;
  else if (variation.id === 'maj_69') formattedChordName = `${baseChord.rootNote}6/9`;
  else if (variation.id === 'maj_add9') formattedChordName = `${baseChord.rootNote}add9`;
  else if (variation.id === 'maj_slash') {
    const isDeg0 = degIdx === 0;
    const iiRoot = getDegreeRoot(keyRoot, isDeg0 ? 2 : 7);
    formattedChordName = `${iiRoot}/${baseChord.rootNote}`;
  } else if (variation.id === 'dim_full') formattedChordName = `${baseChord.rootNote}°7`;
  else if (variation.id === 'dim_half') formattedChordName = `${baseChord.rootNote}m7(♭5)`;
  else if (variation.id === 'min_6') formattedChordName = `${baseChord.rootNote}m6`;
  else if (variation.id === 'min_11') formattedChordName = `${baseChord.rootNote}m11`;
  else if (variation.id === 'min_add9') formattedChordName = `${baseChord.rootNote}m(add9)`;

  return {
    ...baseChord,
    chordName: formattedChordName,
    fullName: `${baseChord.degreeRoman} - ${formattedChordName} (${variation.fullName})`,
    notes: transposedNotes,
  };
}
