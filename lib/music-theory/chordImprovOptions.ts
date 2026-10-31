export interface ImprovResourceOption {
  id: string;
  name: string;
  type: 'scale' | 'arpeggio' | 'pentatonic';
  tag: string;
  intervals: { label: string; semitones: number }[];
  description: string;
}

export const CHORD_IMPROV_RESOURCES: Record<string, ImprovResourceOption[]> = {
  minor: [
    {
      id: 'dorian',
      name: 'Modo Dórico',
      type: 'scale',
      tag: 'Estándar',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Sonido jazz/funk con 6ª mayor',
    },
    {
      id: 'minor_pentatonic',
      name: 'Pentatónica Menor',
      type: 'pentatonic',
      tag: 'Seguro / Rock',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Sin notas a evitar, máxima fluidez',
    },
    {
      id: 'minor_blues',
      name: 'Escala Blues Menor',
      type: 'scale',
      tag: 'Blues',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: 'b5', semitones: 6 },
        { label: '5', semitones: 7 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Color blues con blue note (b5)',
    },
    {
      id: 'm7_arpeggio',
      name: 'Arpegio Menor 7',
      type: 'arpeggio',
      tag: 'Diana Exacta',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '5', semitones: 7 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'R, b3, 5, b7 del acorde',
    },
    {
      id: 'aeolian',
      name: 'Modo Eólico (Menor)',
      type: 'scale',
      tag: 'Balada',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Color melancólico con b6',
    },
  ],
  dominant: [
    {
      id: 'mixolydian',
      name: 'Modo Mixolidio',
      type: 'scale',
      tag: 'Estándar',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Color diatónico natural de dominante',
    },
    {
      id: 'dom7_arpeggio',
      name: 'Arpegio Dominante 7',
      type: 'arpeggio',
      tag: 'Diana Exacta',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '3', semitones: 4 },
        { label: '5', semitones: 7 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'R, 3, 5, b7 directo',
    },
    {
      id: 'phrygian_dominant',
      name: 'Frigio Dominante (5º Menor Armónica)',
      type: 'scale',
      tag: 'Tensión Flamenca',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Tensión b9 y b13 sobre dominante menor',
    },
    {
      id: 'altered',
      name: 'Escala Alterada (Superlocria)',
      type: 'scale',
      tag: 'Jazz Avanzado',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: 'b3', semitones: 3 },
        { label: 'b4', semitones: 4 },
        { label: 'b5', semitones: 6 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Tensiones alteradas: b9, #9, b5, #5',
    },
  ],
  major: [
    {
      id: 'ionian',
      name: 'Modo Jónico (Mayor)',
      type: 'scale',
      tag: 'Estándar',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: '7', semitones: 11 },
      ],
      description: 'Escala mayor tradicional',
    },
    {
      id: 'lydian',
      name: 'Modo Lidio (#4)',
      type: 'scale',
      tag: 'Color Moderno',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '#4', semitones: 6 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: '7', semitones: 11 },
      ],
      description: 'Sin nota a evitar (evita el choque de la 4ª justa)',
    },
    {
      id: 'major_pentatonic',
      name: 'Pentatónica Mayor',
      type: 'pentatonic',
      tag: 'Seguro / Melódico',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
      ],
      description: 'Sonido melódico sin disonancias',
    },
    {
      id: 'maj7_arpeggio',
      name: 'Arpegio Maj7',
      type: 'arpeggio',
      tag: 'Diana Exacta',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '3', semitones: 4 },
        { label: '5', semitones: 7 },
        { label: '7', semitones: 11 },
      ],
      description: 'R, 3, 5, 7 del acorde de reposo',
    },
  ],
  diminished: [
    {
      id: 'locrian',
      name: 'Modo Locrio',
      type: 'scale',
      tag: 'Estándar',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: 'b5', semitones: 6 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Escala natural de acorde semidisminuido',
    },
    {
      id: 'm7b5_arpeggio',
      name: 'Arpegio Semidisminuido (m7b5)',
      type: 'arpeggio',
      tag: 'Diana Exacta',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: 'b5', semitones: 6 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Esqueleto exacto del acorde',
    },
  ],
};

export function getImprovOptionsForChord(degreeLabel: string): ImprovResourceOption[] {
  const clean = degreeLabel.toLowerCase();
  if (clean.includes('dim') || clean.includes('ø') || clean.includes('°') || clean.includes('m7b5')) {
    return CHORD_IMPROV_RESOURCES.diminished;
  }
  if (clean.includes('7') && !clean.includes('maj7') && !clean.includes('m7') && !clean.includes('ii') && !clean.includes('iii') && !clean.includes('vi')) {
    return CHORD_IMPROV_RESOURCES.dominant;
  }
  if (clean.includes('m') && !clean.includes('maj')) {
    return CHORD_IMPROV_RESOURCES.minor;
  }
  if (clean.includes('ii') || clean.includes('vi') || clean.includes('iii') || clean === 'iv' || clean === 'iv7') {
    if (!clean.includes('♭iii') && !clean.includes('♭vi') && !clean.includes('♭vii') && !clean.includes('♭ii')) {
      return CHORD_IMPROV_RESOURCES.minor;
    }
  }
  return CHORD_IMPROV_RESOURCES.major;
}

export function findImprovResourceById(
  resourceId: string | undefined,
  degreeLabel: string
): ImprovResourceOption | null {
  if (!resourceId || resourceId === 'default') return null;
  const allOptions = Object.values(CHORD_IMPROV_RESOURCES).flat();
  return allOptions.find((opt) => opt.id === resourceId) || getImprovOptionsForChord(degreeLabel)[0] || null;
}
