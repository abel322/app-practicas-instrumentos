import {
  InstrumentType,
  INSTRUMENTS,
  CHROMATIC_NOTES,
  ChromaticNote,
  ScaleKey,
  getScaleNoteList,
  getFretNote,
} from './fretboard';
import { ActiveFretNote } from '@/components/fretboard/InteractiveFretboard';

export type ScaleSystemType = 'caged' | '3nps';
export type NoteDisplayMode = 'notes' | 'degrees' | 'fingers';

export interface BoxFretNote {
  stringIndex: number; // 0 = 1ra aguda (E), 5 = 6ta grave (E)
  fret: number;
  finger: number;
  isStretch: boolean;
}

export interface SystemPatternDefinition {
  id: number;
  name: string;
  shortLabel: string;
  description: string;
  minFret: number;
  maxFret: number;
  // Mapa cuerda por cuerda de los trastes y dedos EXACTOS
  // stringIndex 5 es 6ta cuerda (grave), 0 es 1ra cuerda (aguda)
  stringsFrets: Record<number, { fret: number; finger: number; isStretch?: boolean }[]>;
}

export interface FingerAssignment {
  finger: number;      // 0 (al aire), 1 (Índice), 2 (Medio), 3 (Anular), 4 (Meñique)
  isStretch: boolean;  // True si requiere apertura/extensión fuera del bloque base de 4 trastes
  stretchType?: 'backward' | 'forward'; // Hacia la cejuela (dedo 1) o hacia el puente (dedo 4)
}

// ==========================================
// 1. SISTEMA CAGED REAL PARA C MAYOR (GUITARRA ESTÁNDAR)
// Ordenado cronológicamente de la Cejuela al Puente (Trastes 0 a 13)
// ==========================================
export const CAGED_C_MAJOR_PATTERNS: SystemPatternDefinition[] = [
  {
    id: 1,
    name: 'Caja 1 (Forma C)',
    shortLabel: 'Caja 1 (Forma C)',
    description: 'Posición abierta / cejuela. Tónica en 5ª cuerda (traste 3) y 2ª cuerda (traste 1).',
    minFret: 0,
    maxFret: 3,
    stringsFrets: {
      5: [{ fret: 0, finger: 0 }, { fret: 1, finger: 1 }, { fret: 3, finger: 3 }], // E, F, G
      4: [{ fret: 0, finger: 0 }, { fret: 2, finger: 2 }, { fret: 3, finger: 3 }], // A, B, C (Root)
      3: [{ fret: 0, finger: 0 }, { fret: 2, finger: 2 }, { fret: 3, finger: 3 }], // D, E, F
      2: [{ fret: 0, finger: 0 }, { fret: 2, finger: 2 }],                         // G, A (2 notas)
      1: [{ fret: 0, finger: 0 }, { fret: 1, finger: 1 }, { fret: 3, finger: 3 }], // B, C (Root), D
      0: [{ fret: 0, finger: 0 }, { fret: 1, finger: 1 }, { fret: 3, finger: 3 }], // E, F, G
    }
  },
  // CAJA 2: FORMA A (Trastes 2 al 6 - Con Traste 6 en 2ª cuerda)
  {
    id: 2,
    name: 'Caja 2 (Forma A)',
    shortLabel: 'Caja 2 (Forma A)',
    description: 'Trastes 2 al 6. Tónica en 5ª cuerda (traste 3) y 3ª cuerda (traste 5). Incluye Fa en traste 6.',
    minFret: 2,
    maxFret: 6,
    stringsFrets: {
      5: [{ fret: 3, finger: 2 }, { fret: 5, finger: 4 }],                                          // G, A
      4: [{ fret: 2, finger: 1 }, { fret: 3, finger: 2 }, { fret: 5, finger: 4 }],                  // B, C (Root), D
      3: [{ fret: 2, finger: 1 }, { fret: 3, finger: 2 }, { fret: 5, finger: 4 }],                  // E, F, G
      2: [{ fret: 2, finger: 1 }, { fret: 4, finger: 3 }, { fret: 5, finger: 4 }],                  // A, B, C (Root)
      1: [{ fret: 3, finger: 1 }, { fret: 5, finger: 3 }, { fret: 6, finger: 4 }],                  // D, E, F (Traste 6 añadido)
      0: [{ fret: 3, finger: 1 }, { fret: 5, finger: 3 }],                                          // G, A
    }
  },
  {
    id: 3,
    name: 'Caja 3 (Forma G)',
    shortLabel: 'Caja 3 (Forma G)',
    description: 'Trastes 4 al 8. Tónica en 6ª cuerda (traste 8) y 1ª cuerda (traste 8).',
    minFret: 4,
    maxFret: 8,
    stringsFrets: {
      5: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 8, finger: 4 }],                  // A, B, C (Root)
      4: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 8, finger: 4 }],                  // D, E, F
      3: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }],                                          // G, A
      2: [{ fret: 4, finger: 1, isStretch: true }, { fret: 5, finger: 2 }, { fret: 7, finger: 4 }],  // B, C (Root), D
      1: [{ fret: 5, finger: 1 }, { fret: 6, finger: 2 }, { fret: 8, finger: 4 }],                  // E, F, G
      0: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 8, finger: 4 }],                  // A, B, C (Root)
    }
  },
  {
    id: 4,
    name: 'Caja 4 (Forma E)',
    shortLabel: 'Caja 4 (Forma E)',
    description: 'Trastes 7 al 10. Tónica en 6ª cuerda (traste 8) y 4ª cuerda (traste 10).',
    minFret: 7,
    maxFret: 10,
    stringsFrets: {
      5: [{ fret: 7, finger: 1, isStretch: true }, { fret: 8, finger: 2 }, { fret: 10, finger: 4 }],  // B, C (Root), D
      4: [{ fret: 7, finger: 1 }, { fret: 8, finger: 2 }, { fret: 10, finger: 4 }],                   // E, F, G
      3: [{ fret: 7, finger: 1 }, { fret: 9, finger: 3 }, { fret: 10, finger: 4 }],                   // A, B, C (Root)
      2: [{ fret: 7, finger: 1 }, { fret: 9, finger: 3 }, { fret: 10, finger: 4 }],                   // D, E, F
      1: [{ fret: 8, finger: 2 }, { fret: 10, finger: 4 }],                                           // G, A
      0: [{ fret: 7, finger: 1, isStretch: true }, { fret: 8, finger: 2 }, { fret: 10, finger: 4 }],  // B, C (Root), D
    }
  },
  // CAJA 5: FORMA D (Trastes 8 al 13 - Con Traste 8 en 6ª, 5ª y 1ª cuerda)
  {
    id: 5,
    name: 'Caja 5 (Forma D)',
    shortLabel: 'Caja 5 (Forma D)',
    description: 'Trastes 8 al 13. Tónica en 4ª cuerda (traste 10), 2ª cuerda (traste 13) y traste 8 en cuerdas 6 y 1.',
    minFret: 8,
    maxFret: 13,
    stringsFrets: {
      5: [{ fret: 8, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4 }],                  // C (Root en Tr. 8 añadido), D, E
      4: [{ fret: 8, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4 }],                  // F (en Tr. 8 añadido), G, A
      3: [{ fret: 9, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4 }],                  // B, C (Root), D
      2: [{ fret: 9, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4 }],                  // E, F, G
      1: [{ fret: 10, finger: 1 }, { fret: 12, finger: 3 }, { fret: 13, finger: 4 }],                 // A, B, C (Root)
      0: [{ fret: 8, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4 }],                  // C (Root en Tr. 8 añadido), D, E
    }
  }
];

// ==========================================
// 2. SISTEMA 3NPS REAL PARA C MAYOR (7 PATRONES DE CEJUELA A OCTAVA)
// Cubre desde el traste 1 (Fa Lidio) hasta el traste 17 de manera continua
// ==========================================
export const THREE_NPS_C_MAJOR_PATTERNS: SystemPatternDefinition[] = [
  {
    id: 1,
    name: 'Patrón 1: Lidio (desde Fa)',
    shortLabel: 'P1: Lidio (Tr. 1-5)',
    description: 'Comienza en el traste 1 de la 6ª cuerda (Fa - 4to grado)',
    minFret: 1,
    maxFret: 5,
    stringsFrets: {
      5: [{ fret: 1, finger: 1 }, { fret: 3, finger: 2 }, { fret: 5, finger: 4, isStretch: true }],
      4: [{ fret: 2, finger: 1 }, { fret: 3, finger: 2 }, { fret: 5, finger: 4 }],
      3: [{ fret: 2, finger: 1 }, { fret: 3, finger: 2 }, { fret: 5, finger: 4 }],
      2: [{ fret: 2, finger: 1 }, { fret: 4, finger: 3 }, { fret: 5, finger: 4 }],
      1: [{ fret: 3, finger: 1 }, { fret: 5, finger: 3 }, { fret: 6, finger: 4 }],
      0: [{ fret: 3, finger: 1 }, { fret: 5, finger: 3 }, { fret: 7, finger: 4, isStretch: true }],
    }
  },
  {
    id: 2,
    name: 'Patrón 2: Mixolidio (desde Sol)',
    shortLabel: 'P2: Mixolidio (Tr. 3-8)',
    description: 'Comienza en el traste 3 de la 6ª cuerda (Sol - 5to grado)',
    minFret: 3,
    maxFret: 8,
    stringsFrets: {
      5: [{ fret: 3, finger: 1 }, { fret: 5, finger: 2 }, { fret: 7, finger: 4, isStretch: true }],
      4: [{ fret: 3, finger: 1 }, { fret: 5, finger: 2 }, { fret: 7, finger: 4, isStretch: true }],
      3: [{ fret: 3, finger: 1 }, { fret: 5, finger: 2 }, { fret: 7, finger: 4, isStretch: true }],
      2: [{ fret: 4, finger: 1 }, { fret: 5, finger: 2 }, { fret: 7, finger: 4 }],
      1: [{ fret: 5, finger: 1 }, { fret: 6, finger: 2 }, { fret: 8, finger: 4 }],
      0: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 8, finger: 4 }],
    }
  },
  {
    id: 3,
    name: 'Patrón 3: Eólico (desde La)',
    shortLabel: 'P3: Eólico (Tr. 5-10)',
    description: 'Comienza en el traste 5 de la 6ª cuerda (La - 6to grado / menor relativa)',
    minFret: 5,
    maxFret: 10,
    stringsFrets: {
      5: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 8, finger: 4 }],
      4: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 8, finger: 4 }],
      3: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 9, finger: 4, isStretch: true }],
      2: [{ fret: 5, finger: 1 }, { fret: 7, finger: 3 }, { fret: 9, finger: 4, isStretch: true }],
      1: [{ fret: 6, finger: 1 }, { fret: 8, finger: 3 }, { fret: 10, finger: 4, isStretch: true }],
      0: [{ fret: 7, finger: 1 }, { fret: 8, finger: 2 }, { fret: 10, finger: 4 }],
    }
  },
  {
    id: 4,
    name: 'Patrón 4: Locrio (desde Si)',
    shortLabel: 'P4: Locrio (Tr. 7-12)',
    description: 'Comienza en el traste 7 de la 6ª cuerda (Si - 7mo grado)',
    minFret: 7,
    maxFret: 12,
    stringsFrets: {
      5: [{ fret: 7, finger: 1 }, { fret: 8, finger: 2 }, { fret: 10, finger: 4 }],
      4: [{ fret: 7, finger: 1 }, { fret: 8, finger: 2 }, { fret: 10, finger: 4 }],
      3: [{ fret: 7, finger: 1 }, { fret: 9, finger: 3 }, { fret: 10, finger: 4 }],
      2: [{ fret: 7, finger: 1 }, { fret: 9, finger: 3 }, { fret: 10, finger: 4 }],
      1: [{ fret: 8, finger: 1 }, { fret: 10, finger: 3 }, { fret: 12, finger: 4, isStretch: true }],
      0: [{ fret: 8, finger: 1 }, { fret: 10, finger: 3 }, { fret: 12, finger: 4, isStretch: true }],
    }
  },
  {
    id: 5,
    name: 'Patrón 5: Jónico (desde Do - TÓNICA)',
    shortLabel: 'P5: Jónico (Tr. 8-13)',
    description: 'Comienza en el traste 8 de la 6ª cuerda (Do - Tónica fundamental)',
    minFret: 8,
    maxFret: 13,
    stringsFrets: {
      5: [{ fret: 8, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4, isStretch: true }],
      4: [{ fret: 8, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4, isStretch: true }],
      3: [{ fret: 9, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4 }],
      2: [{ fret: 9, finger: 1 }, { fret: 10, finger: 2 }, { fret: 12, finger: 4 }],
      1: [{ fret: 10, finger: 1 }, { fret: 12, finger: 3 }, { fret: 13, finger: 4 }],
      0: [{ fret: 10, finger: 1 }, { fret: 12, finger: 3 }, { fret: 13, finger: 4 }],
    }
  },
  {
    id: 6,
    name: 'Patrón 6: Dórico (desde Re)',
    shortLabel: 'P6: Dórico (Tr. 10-15)',
    description: 'Comienza en el traste 10 de la 6ª cuerda (Re - 2do grado)',
    minFret: 10,
    maxFret: 15,
    stringsFrets: {
      5: [{ fret: 10, finger: 1 }, { fret: 12, finger: 3 }, { fret: 13, finger: 4 }],
      4: [{ fret: 10, finger: 1 }, { fret: 12, finger: 3 }, { fret: 14, finger: 4, isStretch: true }],
      3: [{ fret: 10, finger: 1 }, { fret: 12, finger: 3 }, { fret: 14, finger: 4, isStretch: true }],
      2: [{ fret: 10, finger: 1 }, { fret: 12, finger: 3 }, { fret: 14, finger: 4, isStretch: true }],
      1: [{ fret: 12, finger: 1 }, { fret: 13, finger: 2 }, { fret: 15, finger: 4 }],
      0: [{ fret: 12, finger: 1 }, { fret: 13, finger: 2 }, { fret: 15, finger: 4 }],
    }
  },
  {
    id: 7,
    name: 'Patrón 7: Frigio (desde Mi)',
    shortLabel: 'P7: Frigio (Tr. 12-17)',
    description: 'Comienza en el traste 12 de la 6ª cuerda (Mi - 3er grado)',
    minFret: 12,
    maxFret: 17,
    stringsFrets: {
      5: [{ fret: 12, finger: 1 }, { fret: 13, finger: 2 }, { fret: 15, finger: 4 }],
      4: [{ fret: 12, finger: 1 }, { fret: 14, finger: 3 }, { fret: 15, finger: 4 }],
      3: [{ fret: 12, finger: 1 }, { fret: 14, finger: 3 }, { fret: 15, finger: 4 }],
      2: [{ fret: 12, finger: 1 }, { fret: 14, finger: 3 }, { fret: 16, finger: 4, isStretch: true }],
      1: [{ fret: 13, finger: 1 }, { fret: 15, finger: 3 }, { fret: 17, finger: 4, isStretch: true }],
      0: [{ fret: 13, finger: 1 }, { fret: 15, finger: 3 }, { fret: 17, finger: 4, isStretch: true }],
    }
  }
];

// Aliases para compatibilidad
export const CAGED_BOXES = CAGED_C_MAJOR_PATTERNS;
export const THREE_NPS_PATTERNS = THREE_NPS_C_MAJOR_PATTERNS;

/**
 * Transposición dinámica a cualquier tonalidad
 */
export function transposePattern(
  basePattern: SystemPatternDefinition,
  rootNote: string,
  totalFrets: number = 24
): SystemPatternDefinition {
  const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
  const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  if (targetRootIdx === -1) return basePattern;

  let shift = (targetRootIdx - baseRootIdx + 12) % 12;

  // Si shift es 0, no hay desplazamiento
  if (shift === 0) {
    return basePattern;
  }

  // Ajuste de octava si se desborda del mástil
  if (basePattern.maxFret + shift > totalFrets) {
    shift -= 12;
  } else if (basePattern.minFret + shift < 0) {
    shift += 12;
  }

  const transposedStringsFrets: Record<number, { fret: number; finger: number; isStretch?: boolean }[]> = {};
  let newMinFret = 999;
  let newMaxFret = -999;

  for (const [strIdxStr, fretList] of Object.entries(basePattern.stringsFrets)) {
    const sIdx = Number(strIdxStr);
    transposedStringsFrets[sIdx] = fretList.map((item) => {
      let f = item.fret + shift;
      if (f < 0) f += 12;
      if (f > totalFrets) f -= 12;

      if (f < newMinFret) newMinFret = f;
      if (f > newMaxFret) newMaxFret = f;

      let finger = item.finger;
      // Si era cuerda al aire (fret 0, dedo 0) y ahora se toca en un traste pisado
      if (item.fret === 0 && finger === 0 && f > 0) {
        finger = 1;
      }

      return {
        fret: f,
        finger,
        isStretch: item.isStretch,
      };
    });
  }

  return {
    ...basePattern,
    minFret: newMinFret === 999 ? basePattern.minFret : newMinFret,
    maxFret: newMaxFret === -999 ? basePattern.maxFret : newMaxFret,
    stringsFrets: transposedStringsFrets,
  };
}

export interface ScaleCalculationResult {
  notes: ActiveFretNote[];
  fretRange: [number, number];
  boxBaseFret: number;
}

/**
 * Motor de cálculo de notas activas para el diapasón.
 * Separa de manera estricta CAGED (cajas cerradas) de 3NPS (3 notas por cuerda).
 */
export function calculateScaleSystemNotes(
  instrument: InstrumentType,
  rootNote: string,
  scaleKey: ScaleKey,
  system: ScaleSystemType,
  patternId: number
): ScaleCalculationResult {
  const config = INSTRUMENTS[instrument];

  // 1. Obtener la definición del patrón base según el sistema
  const basePatterns = system === 'caged' ? CAGED_C_MAJOR_PATTERNS : THREE_NPS_C_MAJOR_PATTERNS;
  const basePattern = basePatterns.find((p) => p.id === patternId) || basePatterns[0];

  // 2. Transponer el patrón según la tónica seleccionada
  const pattern = transposePattern(basePattern, rootNote, config.totalFrets);

  // 3. Notas de la escala actual para mapear intervalos y roles
  const scaleNotes = getScaleNoteList(rootNote, scaleKey);
  const noteMap = new Map<string, { interval: string; role: any }>();
  scaleNotes.forEach((sn) => {
    noteMap.set(sn.note, {
      interval: sn.interval.label,
      role: sn.interval.role,
    });
  });

  const notes: ActiveFretNote[] = [];

  // Mapeo de cuerdas según instrumento
  // Guitarra (6C): 5 = 6ª cuerda (E2) ... 0 = 1ª cuerda (E4)
  // Bajo (4C): 3 = 4ª cuerda (E1) -> usa stringsFrets[5]
  //            2 = 3ª cuerda (A1) -> usa stringsFrets[4]
  //            1 = 2ª cuerda (D2) -> usa stringsFrets[3]
  //            0 = 1ª cuerda (G2) -> usa stringsFrets[2]
  // Bajo (5C): 4 = 5ª cuerda (B0) -> usa stringsFrets[1] (misma afinación B)
  //            3 = 4ª cuerda (E1) -> usa stringsFrets[5]
  //            2 = 3ª cuerda (A1) -> usa stringsFrets[4]
  //            1 = 2ª cuerda (D2) -> usa stringsFrets[3]
  //            0 = 1ª cuerda (G2) -> usa stringsFrets[2]

  const getPatternStringIndex = (instStringIdx: number): number => {
    if (instrument === 'guitar_6') {
      return instStringIdx;
    }
    if (instrument === 'bass_4') {
      const map: Record<number, number> = { 3: 5, 2: 4, 1: 3, 0: 2 };
      return map[instStringIdx] ?? 5;
    }
    // bass_5
    const map: Record<number, number> = { 4: 1, 3: 5, 2: 4, 1: 3, 0: 2 };
    return map[instStringIdx] ?? 5;
  };

  const allFrets: number[] = [];

  for (let sIdx = 0; sIdx < config.strings.length; sIdx++) {
    const patternStrIdx = getPatternStringIndex(sIdx);
    const fretItems = pattern.stringsFrets[patternStrIdx] || [];
    const str = config.strings[sIdx];

    fretItems.forEach((item) => {
      const fn = getFretNote(str.midi, item.fret);
      const found = noteMap.get(fn.note);
      const isRoot = fn.note === rootNote;

      allFrets.push(item.fret);

      const isStretchNote = !!item.isStretch;

      notes.push({
        stringIndex: sIdx,
        fret: item.fret,
        note: fn.note,
        interval: found?.interval || (isRoot ? 'R' : ''),
        role: found?.role || (isRoot ? 'root' : 'other'),
        finger: item.finger > 0 ? String(item.finger) : undefined,
        fingerAssignment: {
          finger: item.finger,
          isStretch: isStretchNote,
          stretchType: isStretchNote ? (item.finger === 1 ? 'backward' : 'forward') : undefined,
        },
        midi: fn.midi,
      });
    });
  }

  const minFret = allFrets.length > 0 ? Math.min(...allFrets) : pattern.minFret;
  const maxFret = allFrets.length > 0 ? Math.max(...allFrets) : pattern.maxFret;

  return {
    notes,
    fretRange: [minFret, maxFret],
    boxBaseFret: minFret,
  };
}
