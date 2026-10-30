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
import { PositionZone } from '@/components/fretboard/PositionMapBrackets';
import { ALL_SCALES_CATALOG, ScaleFormula } from './scaleDefinitions';

export type ScaleSystemType = 'caged' | '3nps';
export type NoteDisplayMode = 'notes' | 'degrees' | 'fingers';

export interface BoxFretNote {
  stringIndex: number; // 0 = 1ra aguda (E), 5 = 6ta grave (E)
  fret: number;
  finger: number;
  isStretch: boolean;
}

export interface FingerAssignment {
  finger: number;      // 0 (al aire), 1 (Índice), 2 (Medio), 3 (Anular), 4 (Meñique)
  isStretch: boolean;  // True si requiere apertura/extensión fuera del bloque base de 4 trastes
  stretchType?: 'backward' | 'forward'; // Hacia la cejuela (dedo 1) o hacia el puente (dedo 4)
}

export interface SystemPatternDefinition {
  id: number;
  name: string;
  shortLabel: string;
  description: string;
  minFret: number;
  maxFret: number;
  stringsFrets?: Record<number, { fret: number; finger: number; isStretch?: boolean }[]>;
}

export interface CagedBoxSpan {
  id: number;
  name: string;
  shortLabel: string;
  description: string;
  baseMinFret: number;
  baseMaxFret: number;
  baseFretOffset: number; // Compensación de traste base para la posición neutra de la mano
}

export interface ThreeNpsPatternSpan {
  id: number;
  name: string;
  shortLabel: string;
  description: string;
  baseMinFret: number;
  baseMaxFret: number;
}

// ==========================================
// 1. DEFINICIÓN UNIVERSAL DE LAS 5 CAJAS CAGED
// Rangos anatómicos base para Do Mayor (fret 0 a 13)
// ==========================================
export const CAGED_BASE_BOXES: CagedBoxSpan[] = [
  {
    id: 1,
    name: 'Caja 1 (Forma C)',
    shortLabel: 'Caja 1 (Forma C)',
    description: 'Posición abierta / cejuela. Tónica en 5ª cuerda (traste 3) y 2ª cuerda (traste 1).',
    baseMinFret: 0,
    baseMaxFret: 3,
    baseFretOffset: 0,
  },
  {
    id: 2,
    name: 'Caja 2 (Forma A)',
    shortLabel: 'Caja 2 (Forma A)',
    description: 'Trastes 2 al 6. Tónica en 5ª cuerda (traste 3) y 3ª cuerda (traste 5). Incluye Fa en traste 6.',
    baseMinFret: 2,
    baseMaxFret: 6,
    baseFretOffset: 0,
  },
  {
    id: 3,
    name: 'Caja 3 (Forma G)',
    shortLabel: 'Caja 3 (Forma G)',
    description: 'Trastes 4 al 8. Tónica en 6ª cuerda (traste 8) y 1ª cuerda (traste 8).',
    baseMinFret: 4,
    baseMaxFret: 8,
    baseFretOffset: 1, // Mano anclada en traste 5; traste 4 es extensión hacia atrás del dedo 1
  },
  {
    id: 4,
    name: 'Caja 4 (Forma E)',
    shortLabel: 'Caja 4 (Forma E)',
    description: 'Trastes 7 al 10. Tónica en 6ª cuerda (traste 8) y 4ª cuerda (traste 10).',
    baseMinFret: 7,
    baseMaxFret: 10,
    baseFretOffset: 0, // Bloque estricto de 4 trastes sin tensiones
  },
  {
    id: 5,
    name: 'Caja 5 (Forma D)',
    shortLabel: 'Caja 5 (Forma D)',
    description: 'Trastes 8 al 13. Tónica en 4ª cuerda (traste 10), 2ª cuerda (traste 13) y traste 8 en cuerdas 6 y 1.',
    baseMinFret: 8,
    baseMaxFret: 13,
    baseFretOffset: 1, // Mano anclada en traste 9; traste 8 es extensión inferior
  },
];

export const CAGED_BOX_SPANS = CAGED_BASE_BOXES;

// ==========================================
// 2. DEFINICIÓN UNIVERSAL DE LOS 7 PATRONES 3NPS
// Cubre desde la cejuela hasta el registro medio/agudo de manera continua
// ==========================================
export const THREE_NPS_BASE_PATTERNS: ThreeNpsPatternSpan[] = [
  {
    id: 1,
    name: 'Patrón 1: Lidio (desde Fa)',
    shortLabel: 'P1: Lidio (Tr. 1-5)',
    description: 'Comienza en el traste 1 de la 6ª cuerda (Fa - 4to grado)',
    baseMinFret: 1,
    baseMaxFret: 5,
  },
  {
    id: 2,
    name: 'Patrón 2: Mixolidio (desde Sol)',
    shortLabel: 'P2: Mixolidio (Tr. 3-8)',
    description: 'Comienza en el traste 3 de la 6ª cuerda (Sol - 5to grado)',
    baseMinFret: 3,
    baseMaxFret: 8,
  },
  {
    id: 3,
    name: 'Patrón 3: Eólico (desde La)',
    shortLabel: 'P3: Eólico (Tr. 5-10)',
    description: 'Comienza en el traste 5 de la 6ª cuerda (La - 6to grado / menor relativa)',
    baseMinFret: 5,
    baseMaxFret: 10,
  },
  {
    id: 4,
    name: 'Patrón 4: Locrio (desde Si)',
    shortLabel: 'P4: Locrio (Tr. 7-12)',
    description: 'Comienza en el traste 7 de la 6ª cuerda (Si - 7mo grado)',
    baseMinFret: 7,
    baseMaxFret: 12,
  },
  {
    id: 5,
    name: 'Patrón 5: Jónico (desde Do - TÓNICA)',
    shortLabel: 'P5: Jónico (Tr. 8-13)',
    description: 'Comienza en el traste 8 de la 6ª cuerda (Do - Tónica fundamental)',
    baseMinFret: 8,
    baseMaxFret: 13,
  },
  {
    id: 6,
    name: 'Patrón 6: Dórico (desde Re)',
    shortLabel: 'P6: Dórico (Tr. 10-15)',
    description: 'Comienza en el traste 10 de la 6ª cuerda (Re - 2do grado)',
    baseMinFret: 10,
    baseMaxFret: 15,
  },
  {
    id: 7,
    name: 'Patrón 7: Frigio (desde Mi)',
    shortLabel: 'P7: Frigio (Tr. 12-17)',
    description: 'Comienza en el traste 12 de la 6ª cuerda (Mi - 3er grado)',
    baseMinFret: 12,
    baseMaxFret: 17,
  },
];

// Compatibilidad con selectores e interfaz de usuario
export const CAGED_BOXES: SystemPatternDefinition[] = CAGED_BASE_BOXES.map((b) => ({
  id: b.id,
  name: b.name,
  shortLabel: b.shortLabel,
  description: b.description,
  minFret: b.baseMinFret,
  maxFret: b.baseMaxFret,
}));

export const THREE_NPS_PATTERNS: SystemPatternDefinition[] = THREE_NPS_BASE_PATTERNS.map((p) => ({
  id: p.id,
  name: p.name,
  shortLabel: p.shortLabel,
  description: p.description,
  minFret: p.baseMinFret,
  maxFret: p.baseMaxFret,
}));

export const CAGED_C_MAJOR_PATTERNS = CAGED_BOXES;
export const THREE_NPS_C_MAJOR_PATTERNS = THREE_NPS_PATTERNS;

/**
 * Transposición de patrón base (mantenido para retrocompatibilidad)
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
  if (shift === 0) return basePattern;

  let minFret = basePattern.minFret + shift;
  let maxFret = basePattern.maxFret + shift;

  if (maxFret > totalFrets) {
    minFret -= 12;
    maxFret -= 12;
  } else if (minFret < 0) {
    minFret += 12;
    maxFret += 12;
  }

  return {
    ...basePattern,
    minFret,
    maxFret,
  };
}

/**
 * Motor de asignación anatómica y biomecánica de dedos (1 = Índice, 2 = Medio, 3 = Anular, 4 = Meñique).
 * Asigna dedos de manera ergonómica según los trastes presentes en la cuerda y la caja activa.
 */
export function assignFingersToString(
  frets: number[],
  boxBaseFret: number,
  system: ScaleSystemType = 'caged'
): Map<number, FingerAssignment> {
  const result = new Map<number, FingerAssignment>();
  if (frets.length === 0) return result;

  // Cuerdas al aire siempre asignadas con dedo 0 sin estiramiento
  if (frets.includes(0)) {
    result.set(0, { finger: 0, isStretch: false });
  }

  const fretted = frets.filter((f) => f > 0).sort((a, b) => a - b);
  if (fretted.length === 0) return result;

  // 1 Sola nota en la cuerda
  if (fretted.length === 1) {
    const f = fretted[0];
    const rel = f - boxBaseFret;
    if (rel <= 0) {
      const isStretch = f < boxBaseFret;
      result.set(f, {
        finger: 1,
        isStretch,
        stretchType: isStretch ? 'backward' : undefined,
      });
    } else if (rel === 1) {
      result.set(f, { finger: 2, isStretch: false });
    } else if (rel === 2) {
      result.set(f, { finger: 3, isStretch: false });
    } else {
      const isStretch = rel > 3;
      result.set(f, {
        finger: 4,
        isStretch,
        stretchType: isStretch ? 'forward' : undefined,
      });
    }
    return result;
  }

  // 2 Notas en la cuerda (habitual en Pentatónicas o cajas intermedias)
  if (fretted.length === 2) {
    const [f1, f2] = fretted;
    const diff = f2 - f1;
    const rel1 = f1 - boxBaseFret;

    let finger1 = 1;
    let finger2 = 4;
    let s1 = f1 < boxBaseFret;
    let s2 = f2 > boxBaseFret + 3;

    if (diff === 1) {
      if (rel1 <= 0) {
        finger1 = 1;
        finger2 = 2;
      } else if (rel1 === 1) {
        finger1 = 2;
        finger2 = 3;
      } else {
        finger1 = 3;
        finger2 = 4;
      }
    } else if (diff === 2) {
      if (rel1 <= 0) {
        finger1 = 1;
        finger2 = 3;
      } else if (rel1 === 1) {
        finger1 = 2;
        finger2 = 4;
      } else {
        finger1 = 3;
        finger2 = 4;
      }
    } else if (diff === 3) {
      finger1 = 1;
      finger2 = 4;
    } else {
      finger1 = 1;
      finger2 = 4;
      s2 = true;
    }

    result.set(f1, {
      finger: finger1,
      isStretch: s1,
      stretchType: s1 ? 'backward' : undefined,
    });
    result.set(f2, {
      finger: finger2,
      isStretch: s2,
      stretchType: s2 ? 'forward' : undefined,
    });
    return result;
  }

  // 3 Notas en la cuerda (3NPS o escalas diatónicas mayores/menores)
  if (fretted.length === 3) {
    const [f1, f2, f3] = fretted;
    const d1 = f2 - f1;
    const d2 = f3 - f2;
    const rel1 = f1 - boxBaseFret;

    let fin1 = 1;
    let fin2 = 2;
    let fin3 = 4;
    let s1 = f1 < boxBaseFret;
    let s3 = f3 > boxBaseFret + 3;

    if (d1 === 1 && d2 === 2) {
      // Semitono + Tono (ej. 7, 8, 10)
      fin1 = 1;
      fin2 = 2;
      fin3 = 4;
    } else if (d1 === 2 && d2 === 1) {
      // Tono + Semitono (ej. 7, 9, 10 o 3, 5, 6)
      fin1 = 1;
      fin2 = 3;
      fin3 = 4;
    } else if (d1 === 2 && d2 === 2) {
      // Tono + Tono (ej. 8, 10, 12 o 1, 3, 5 en 3NPS): extensión natural del meñique
      fin1 = 1;
      fin2 = 2;
      fin3 = 4;
      s3 = true;
    } else if (d1 === 1 && d2 === 1) {
      // Cromatismo de 3 notas (ej. 8, 9, 10 en Blues)
      if (rel1 <= 0) {
        fin1 = 1;
        fin2 = 2;
        fin3 = 3;
      } else {
        fin1 = 2;
        fin2 = 3;
        fin3 = 4;
      }
    } else {
      fin1 = 1;
      fin2 = 2;
      fin3 = 4;
    }

    result.set(f1, {
      finger: fin1,
      isStretch: s1,
      stretchType: s1 ? 'backward' : undefined,
    });
    result.set(f2, {
      finger: fin2,
      isStretch: false,
    });
    result.set(f3, {
      finger: fin3,
      isStretch: s3,
      stretchType: s3 ? 'forward' : undefined,
    });
    return result;
  }

  // 4 Notas en la cuerda (cromatismos o extensiones)
  const [f1, f2, f3, f4] = fretted;
  result.set(f1, {
    finger: 1,
    isStretch: f1 < boxBaseFret,
    stretchType: f1 < boxBaseFret ? 'backward' : undefined,
  });
  result.set(f2, { finger: 2, isStretch: false });
  result.set(f3, { finger: 3, isStretch: false });
  result.set(f4, {
    finger: 4,
    isStretch: f4 > boxBaseFret + 3,
    stretchType: f4 > boxBaseFret + 3 ? 'forward' : undefined,
  });
  return result;
}

export interface ScaleCalculationResult {
  notes: ActiveFretNote[];
  fretRange: [number, number];
  boxBaseFret: number;
}

/**
 * MOTOR DINÁMICO UNIVERSAL DE ESCALAS PARA CAGED Y 3NPS
 *
 * Computa reactivamente las notas, grados analíticos ('R', 'b3', 'b5', etc.), roles armónicos
 * y digitaciones anatómicas (dedos 1-4) cruzando:
 * 1. La Tónica elegida (C, C#, D, etc.)
 * 2. La Escala / Modo elegido (Mayor, Pentatónica Menor, Blues, Dórica, etc.)
 * 3. La Caja CAGED (1-5) o Patrón 3NPS (1-7) activo
 * 4. El Instrumento (Guitarra 6C, Bajo 4C, Bajo 5C con Low B)
 */
export function calculateScaleSystemNotes(
  instrument: InstrumentType,
  rootNote: string,
  scaleKey: ScaleKey,
  system: ScaleSystemType,
  patternId: number
): ScaleCalculationResult {
  const config = INSTRUMENTS[instrument];
  const totalFrets = config.totalFrets; // 24 trastes

  // 1. Obtener la fórmula teórica de la escala seleccionada
  const formula: ScaleFormula = ALL_SCALES_CATALOG[scaleKey] || ALL_SCALES_CATALOG.major;

  // 2. Calcular el desplazamiento relativo de la tónica respecto a C
  const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
  const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

  // 3. Determinar la ventana de trastes [minFret, maxFret] y el traste base de la mano
  let minFret = 0;
  let maxFret = 12;
  let boxBaseFret = 0;

  if (system === 'caged') {
    const baseDef = CAGED_BASE_BOXES.find((b) => b.id === patternId) || CAGED_BASE_BOXES[0];
    minFret = baseDef.baseMinFret + shift;
    maxFret = baseDef.baseMaxFret + shift;

    if (maxFret > totalFrets) {
      minFret -= 12;
      maxFret -= 12;
    } else if (minFret < 0) {
      minFret += 12;
      maxFret += 12;
    }

    boxBaseFret = minFret === 0 ? 1 : minFret + baseDef.baseFretOffset;
  } else {
    // 3NPS (7 Patrones)
    const baseDef = THREE_NPS_BASE_PATTERNS.find((p) => p.id === patternId) || THREE_NPS_BASE_PATTERNS[0];
    minFret = baseDef.baseMinFret + shift;
    maxFret = baseDef.baseMaxFret + shift;

    if (maxFret > totalFrets) {
      minFret -= 12;
      maxFret -= 12;
    } else if (minFret < 0) {
      minFret += 12;
      maxFret += 12;
    }

    boxBaseFret = minFret;
  }

  const notes: ActiveFretNote[] = [];

  // 4. Filtrar y computar notas cuerda por cuerda de forma universal para cualquier afinación
  for (let sIdx = 0; sIdx < config.strings.length; sIdx++) {
    const str = config.strings[sIdx];
    const validFretsForString: number[] = [];
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

      // Comprobar si la nota pertenece estrictamente a la fórmula de la escala seleccionada
      const intervalIdx = formula.intervals.indexOf(semitones);

      if (intervalIdx !== -1) {
        validFretsForString.push(fret);
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

    // 5. Asignar biomecánica de dedos para las notas activas en esta cuerda
    const fingerAssignments = assignFingersToString(
      validFretsForString,
      boxBaseFret,
      system
    );

    // 6. Construir las notas activas para el renderizado
    validFretsForString.forEach((fret) => {
      const data = fretDataMap.get(fret)!;
      const fa = fingerAssignments.get(fret) || { finger: 0, isStretch: false };

      notes.push({
        stringIndex: sIdx,
        fret,
        note: data.note,
        interval: data.interval,
        role: data.role,
        finger: fa.finger > 0 ? String(fa.finger) : undefined,
        fingerAssignment: {
          finger: fa.finger,
          isStretch: fa.isStretch,
          stretchType: fa.stretchType,
        },
        midi: data.midi,
      });
    });
  }

  return {
    notes,
    fretRange: [minFret, maxFret],
    boxBaseFret,
  };
}


/**
 * Calcula todas las zonas/posiciones a lo largo del mástil para el sistema de estudio seleccionado
 */
export function getScalePositionZones(
  system: ScaleSystemType,
  rootNote: string,
  totalFrets: number = 24
): PositionZone[] {
  const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
  const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

  const zones: PositionZone[] = [];

  if (system === 'caged') {
    CAGED_BASE_BOXES.forEach((b) => {
      let startF = b.baseMinFret + shift;
      let endF = b.baseMaxFret + shift;

      if (endF > totalFrets) {
        startF -= 12;
        endF -= 12;
      } else if (startF < 0) {
        startF += 12;
        endF += 12;
      }

      zones.push({
        id: b.id,
        label: b.name,
        shortLabel: b.shortLabel,
        startFret: Math.max(0, startF),
        endFret: Math.min(totalFrets, endF),
      });

      // Si la octava superior (+12) cabe en el mástil
      const octStart = startF + 12;
      const octEnd = endF + 12;
      if (octStart <= totalFrets) {
        zones.push({
          id: b.id,
          label: `${b.shortLabel} (8va)`,
          shortLabel: `${b.shortLabel} 8va`,
          startFret: octStart,
          endFret: Math.min(totalFrets, octEnd),
          isOctaveUp: true,
        });
      }
    });
  } else {
    // 3NPS (7 Patrones)
    THREE_NPS_BASE_PATTERNS.forEach((p) => {
      let startF = p.baseMinFret + shift;
      let endF = p.baseMaxFret + shift;

      if (endF > totalFrets) {
        startF -= 12;
        endF -= 12;
      } else if (startF < 0) {
        startF += 12;
        endF += 12;
      }

      zones.push({
        id: p.id,
        label: p.name,
        shortLabel: p.shortLabel,
        startFret: Math.max(0, startF),
        endFret: Math.min(totalFrets, endF),
      });

      const octStart = startF + 12;
      const octEnd = endF + 12;
      if (octStart <= totalFrets) {
        zones.push({
          id: p.id,
          label: `${p.shortLabel} (8va)`,
          shortLabel: `${p.shortLabel} 8va`,
          startFret: octStart,
          endFret: Math.min(totalFrets, octEnd),
          isOctaveUp: true,
        });
      }
    });
  }

  return zones.sort((a, b) => a.startFret - b.startFret || a.endFret - b.endFret);
}

/**
 * Calcula todas las notas de la escala a lo largo de todo el mástil (trastes 0 a 24)
 */
export function calculateFullNeckScaleNotes(
  instrument: InstrumentType,
  rootNote: string,
  scaleKey: ScaleKey
): ActiveFretNote[] {
  const config = INSTRUMENTS[instrument];
  const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  const formula = ALL_SCALES_CATALOG[scaleKey] || ALL_SCALES_CATALOG.major;
  const totalFrets = config.totalFrets;

  const notes: ActiveFretNote[] = [];

  for (let sIdx = 0; sIdx < config.strings.length; sIdx++) {
    const str = config.strings[sIdx];
    for (let fret = 0; fret <= totalFrets; fret++) {
      const fn = getFretNote(str.midi, fret);
      const noteIdx = CHROMATIC_NOTES.indexOf(fn.note);
      const semitones = (noteIdx - targetRootIdx + 12) % 12;

      const intervalIdx = formula.intervals.indexOf(semitones);
      if (intervalIdx !== -1) {
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

        notes.push({
          stringIndex: sIdx,
          fret,
          note: fn.note,
          interval: degree,
          role,
          fingerAssignment: { finger: 0, isStretch: false },
          midi: fn.midi,
        });
      }
    }
  }

  return notes;
}
