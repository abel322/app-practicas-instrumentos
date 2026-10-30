export interface ScaleFormula {
  id: string;
  name: string;
  intervals: number[]; // Semitonos relativos a la tónica
  degrees: string[];   // Nomenclatura analítica
}

export const ALL_SCALES_CATALOG: Record<string, ScaleFormula> = {
  major: {
    id: 'major',
    name: 'Mayor (Jónica)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ['R', '2', '3', '4', '5', '6', '7']
  },
  dorian: {
    id: 'dorian',
    name: 'Dórica',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ['R', '2', 'b3', '4', '5', '6', 'b7']
  },
  phrygian: {
    id: 'phrygian',
    name: 'Frigia',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: ['R', 'b2', 'b3', '4', '5', 'b6', 'b7']
  },
  lydian: {
    id: 'lydian',
    name: 'Lidia',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: ['R', '2', '3', '#4', '5', '6', '7']
  },
  mixolydian: {
    id: 'mixolydian',
    name: 'Mixolidia',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ['R', '2', '3', '4', '5', '6', 'b7']
  },
  minor_natural: {
    id: 'minor_natural',
    name: 'Menor Natural (Eólica)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['R', '2', 'b3', '4', '5', 'b6', 'b7']
  },
  locrian: {
    id: 'locrian',
    name: 'Locria',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degrees: ['R', 'b2', 'b3', '4', 'b5', 'b6', 'b7']
  },
  pentatonic_minor: {
    id: 'pentatonic_minor',
    name: 'Pentatónica Menor',
    intervals: [0, 3, 5, 7, 10],
    degrees: ['R', 'b3', '4', '5', 'b7']
  },
  pentatonic_major: {
    id: 'pentatonic_major',
    name: 'Pentatónica Mayor',
    intervals: [0, 2, 4, 7, 9],
    degrees: ['R', '2', '3', '5', '6']
  },
  blues: {
    id: 'blues',
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ['R', 'b3', '4', 'b5', '5', 'b7']
  },
  harmonic_minor: {
    id: 'harmonic_minor',
    name: 'Menor Armónica',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: ['R', '2', 'b3', '4', '5', 'b6', '7']
  },
  melodic_minor: {
    id: 'melodic_minor',
    name: 'Menor Melódica',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    degrees: ['R', '2', 'b3', '4', '5', '6', '7']
  }
};

