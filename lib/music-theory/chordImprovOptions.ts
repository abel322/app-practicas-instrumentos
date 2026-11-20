export interface ImprovResourceOption {
  id: string;
  name: string;
  label?: string;
  type: 'scale' | 'arpeggio' | 'pentatonic';
  tag: string;
  intervals: { label: string; semitones: number }[];
  description: string;
}

export const CHORD_IMPROV_RESOURCES: Record<'minor' | 'dominant' | 'major' | 'diminished', ImprovResourceOption[]> = {
  minor: [
    {
      id: 'dorian',
      name: 'Modo Dórico',
      type: 'scale',
      tag: 'Jazz / Funk (II)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Sonido moderno y elegante con 6ª mayor para acordes iim7.',
    },
    {
      id: 'aeolian',
      name: 'Modo Eólico (Menor Natural)',
      type: 'scale',
      tag: 'Pop / Rock (VI)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Color melancólico tradicional con b6 para acordes vim7 o baladas.',
    },
    {
      id: 'phrygian',
      name: 'Modo Frigio',
      type: 'scale',
      tag: 'Flamenco / Tensión (III)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Color exótico y oscuro con 2ª menor (b2) para acordes iiim7.',
    },
    {
      id: 'dorian_b2',
      name: 'Modo Dórico ♭2 (Frigio #6)',
      type: 'scale',
      tag: '2º Menor Melódica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Tensión oscura de ♭2 combinada con el brillo de la 6ª mayor.',
    },
    {
      id: 'melodic_minor',
      name: 'Menor Melódica',
      type: 'scale',
      tag: 'Jazz Contemporáneo',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: '7', semitones: 11 },
      ],
      description: 'Escala menor con 6ª y 7ª mayor natural para acordes m(maj7).',
    },
    {
      id: 'minor_pentatonic',
      name: 'Pentatónica Menor',
      type: 'pentatonic',
      tag: 'Rock / Blues',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Sin notas a evitar, máxima fluidez y ataque en solos.',
    },
    {
      id: 'minor_blues',
      name: 'Escala Blues Menor',
      type: 'scale',
      tag: 'Blue Note (♭5)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: 'b5', semitones: 6 },
        { label: '5', semitones: 7 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Pentatónica menor con la blue note (♭5) para expresividad blues.',
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
      description: 'Notas exactas del acorde menor 7 (R, ♭3, 5, ♭7).',
    },
  ],
  dominant: [
    {
      id: 'mixolydian',
      name: 'Modo Mixolidio',
      type: 'scale',
      tag: 'Dominante Estándar (V)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Color diatónico natural de dominante para acordes V7.',
    },
    {
      id: 'lydian_dominant',
      name: 'Modo Lidio Dominante (#11)',
      type: 'scale',
      tag: '4º Menor Melódica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '#4', semitones: 6 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Sonido acústico sin choque de 4ª justa para acordes 7(#11) y sustitutos tritonales.',
    },
    {
      id: 'phrygian_dominant',
      name: 'Frigio Dominante (♭9 ♭13)',
      type: 'scale',
      tag: '5º Menor Armónica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Tensión flamenca y resolución hacia acordes menores con ♭9 y ♭13.',
    },
    {
      id: 'altered',
      name: 'Escala Alterada / Superlocria',
      type: 'scale',
      tag: '7º Menor Melódica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: 'b3', semitones: 3 },
        { label: 'b4', semitones: 4 },
        { label: 'b5', semitones: 6 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Tensión máxima alterada: ♭9, #9, ♭5, #5 para acordes V7alt.',
    },
    {
      id: 'mixolydian_b6',
      name: 'Modo Mixolidio ♭6',
      type: 'scale',
      tag: '5º Menor Melódica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Dominante melancólico con 9ª mayor y ♭13 para acordes 7(♭13).',
    },
    {
      id: 'half_whole_diminished',
      name: 'Disminuida Semitono-Tono (13♭9)',
      type: 'scale',
      tag: 'Octatónica Simétrica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: 'b3', semitones: 3 },
        { label: '3', semitones: 4 },
        { label: '#4', semitones: 6 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Escala simétrica de 8 notas para acordes 7(♭9, #9, 13).',
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
      description: 'Esqueleto exacto del acorde dominante (R, 3, 5, ♭7).',
    },
  ],
  major: [
    {
      id: 'ionian',
      name: 'Modo Jónico (Mayor Natural)',
      type: 'scale',
      tag: 'Diatónico / Reposo (I)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: '7', semitones: 11 },
      ],
      description: 'Escala mayor natural para acordes Imaj7 de reposo.',
    },
    {
      id: 'lydian',
      name: 'Modo Lidio (#11)',
      type: 'scale',
      tag: 'Color Moderno (IV)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '#4', semitones: 6 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: '7', semitones: 11 },
      ],
      description: 'Sin nota a evitar (evita el choque de 4ª justa); sonido brillante y cinematográfico.',
    },
    {
      id: 'mixolydian',
      name: 'Modo Mixolidio (♭7)',
      type: 'scale',
      tag: 'Bluesy / Rock',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '4', semitones: 5 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Mayor con 7ª menor para líneas blues/rock sobre acordes mayores.',
    },
    {
      id: 'lydian_augmented',
      name: 'Modo Lidio Aumentado (#5 #11)',
      type: 'scale',
      tag: '3º Menor Melódica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '#4', semitones: 6 },
        { label: '#5', semitones: 8 },
        { label: '6', semitones: 9 },
        { label: '7', semitones: 11 },
      ],
      description: 'Sonido místico y espacial para acordes Maj7(#5).',
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
      description: '5 notas melódicas sin semitonos conflictivos.',
    },
    {
      id: 'major_hexatonic',
      name: 'Hexatónica Mayor (sin 4ª)',
      type: 'scale',
      tag: 'Fluido / Sin Choque',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: '3', semitones: 4 },
        { label: '5', semitones: 7 },
        { label: '6', semitones: 9 },
        { label: '7', semitones: 11 },
      ],
      description: 'Escala mayor de 6 notas que elimina la 4ª para evitar choques con la 3ª.',
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
      description: 'Notas diana exactas del acorde Maj7 (R, 3, 5, 7).',
    },
  ],
  diminished: [
    {
      id: 'locrian',
      name: 'Modo Locrio',
      type: 'scale',
      tag: 'Diatónico (VII)',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b2', semitones: 1 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: 'b5', semitones: 6 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Escala diatónica natural para acordes semidisminuidos m7♭5.',
    },
    {
      id: 'locrian_sharp2',
      name: 'Modo Locrio #2 (Eólico ♭5)',
      type: 'scale',
      tag: '6º Menor Melódica',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: '2', semitones: 2 },
        { label: 'b3', semitones: 3 },
        { label: '4', semitones: 5 },
        { label: 'b5', semitones: 6 },
        { label: 'b6', semitones: 8 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Sonido semidisminuido más dulce y moderno con 9ª mayor natural (sin choque de ♭2).',
    },
    {
      id: 'm7b5_arpeggio',
      name: 'Arpegio Semidisminuido (m7♭5)',
      type: 'arpeggio',
      tag: 'Diana Exacta',
      intervals: [
        { label: 'R', semitones: 0 },
        { label: 'b3', semitones: 3 },
        { label: 'b5', semitones: 6 },
        { label: 'b7', semitones: 10 },
      ],
      description: 'Esqueleto exacto del acorde semidisminuido (R, ♭3, ♭5, ♭7).',
    },
  ],
};

export function getImprovOptionsForChord(degreeOrChord: string): ImprovResourceOption[] {
  const clean = (degreeOrChord || '').trim().toLowerCase();

  if (
    clean.includes('dim') ||
    clean.includes('ø') ||
    clean.includes('°') ||
    clean.includes('m7b5') ||
    clean.includes('b5') ||
    clean.startsWith('vii')
  ) {
    return CHORD_IMPROV_RESOURCES.diminished;
  }

  // Acorde Dominante: contiene 7, 9, 13, alt o V sin ser maj ni m7/min
  if (
    (clean.includes('7') || clean.includes('9') || clean.includes('13') || clean.includes('alt') || clean.startsWith('v')) &&
    !clean.includes('maj') &&
    !clean.includes('m7') &&
    !clean.includes('min') &&
    !clean.includes('m9') &&
    !clean.includes('m11') &&
    !clean.includes('ii') &&
    !clean.includes('iii') &&
    !clean.includes('vi')
  ) {
    return CHORD_IMPROV_RESOURCES.dominant;
  }

  // Acorde Menor: contiene 'm', 'min' o grados menores ii, iii, vi, ivm
  if (
    clean.includes('min') ||
    (clean.includes('m') && !clean.includes('maj')) ||
    clean.startsWith('ii') ||
    clean.startsWith('iii') ||
    clean.startsWith('vi') ||
    clean.startsWith('ivm')
  ) {
    return CHORD_IMPROV_RESOURCES.minor;
  }

  return CHORD_IMPROV_RESOURCES.major;
}

export function findImprovResourceById(
  resourceId: string | undefined,
  degreeLabel: string
): ImprovResourceOption | null {
  if (!resourceId || resourceId === 'default') return null;
  const allOptions = Object.values(CHORD_IMPROV_RESOURCES).flat();
  const match =
    allOptions.find((opt) => opt.id === resourceId) ||
    getImprovOptionsForChord(degreeLabel)[0] ||
    null;
  if (!match) return null;
  return {
    ...match,
    label: match.label || match.name,
  };
}
