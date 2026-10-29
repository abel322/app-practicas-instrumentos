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

export interface ScalePatternConfig {
  id: number;
  name: string;
  shortLabel: string;
  description: string;
  rootStringRef: number;
  fretSpanOffset: { start: number; end: number }; // Rango de trastes relativo a la tónica
}

export interface FingerAssignment {
  finger: number;      // 0 (al aire), 1 (Índice), 2 (Medio), 3 (Anular), 4 (Meñique)
  isStretch: boolean;  // True si requiere apertura/extensión fuera del bloque base de 4 trastes
  stretchType?: 'backward' | 'forward'; // Hacia la cejuela (dedo 1) o hacia el puente (dedo 4)
}

// 1. SISTEMA CAGED: 5 Cajas tradicionales
export const CAGED_BOXES: ScalePatternConfig[] = [
  { id: 1, name: 'Caja 1 (Forma E)', shortLabel: 'Caja 1 (Forma E)', description: 'Tónica en 6ª y 1ª cuerda', rootStringRef: 6, fretSpanOffset: { start: -1, end: 3 } },
  { id: 2, name: 'Caja 2 (Forma D)', shortLabel: 'Caja 2 (Forma D)', description: 'Tónica en 4ª cuerda', rootStringRef: 4, fretSpanOffset: { start: 2, end: 5 } },
  { id: 3, name: 'Caja 3 (Forma C)', shortLabel: 'Caja 3 (Forma C)', description: 'Tónica en 5ª y 2ª cuerda', rootStringRef: 5, fretSpanOffset: { start: 4, end: 8 } },
  { id: 4, name: 'Caja 4 (Forma A)', shortLabel: 'Caja 4 (Forma A)', description: 'Tónica en 5ª cuerda', rootStringRef: 5, fretSpanOffset: { start: 7, end: 10 } },
  { id: 5, name: 'Caja 5 (Forma G)', shortLabel: 'Caja 5 (Forma G)', description: 'Tónica en 6ª y 1ª cuerda', rootStringRef: 6, fretSpanOffset: { start: 9, end: 13 } },
];

// 2. SISTEMA 3NPS: 7 Patrones simétricos
export const THREE_NPS_PATTERNS: ScalePatternConfig[] = [
  { id: 1, name: 'Patrón 1: Jónico (Grado I)', shortLabel: 'P1: Jónico', description: 'Comienza en la tónica (6ª cuerda)', rootStringRef: 6, fretSpanOffset: { start: 0, end: 4 } },
  { id: 2, name: 'Patrón 2: Dórico (Grado II)', shortLabel: 'P2: Dórico', description: 'Comienza en la 2ª mayor', rootStringRef: 6, fretSpanOffset: { start: 2, end: 6 } },
  { id: 3, name: 'Patrón 3: Frigio (Grado III)', shortLabel: 'P3: Frigio', description: 'Comienza en la 3ª mayor', rootStringRef: 6, fretSpanOffset: { start: 4, end: 8 } },
  { id: 4, name: 'Patrón 4: Lidio (Grado IV)', shortLabel: 'P4: Lidio', description: 'Comienza en la 4ª justa', rootStringRef: 6, fretSpanOffset: { start: 5, end: 9 } },
  { id: 5, name: 'Patrón 5: Mixolidio (Grado V)', shortLabel: 'P5: Mixolidio', description: 'Comienza en la 5ª justa', rootStringRef: 6, fretSpanOffset: { start: 7, end: 11 } },
  { id: 6, name: 'Patrón 6: Eólico (Grado VI)', shortLabel: 'P6: Eólico', description: 'Comienza en la 6ª mayor', rootStringRef: 6, fretSpanOffset: { start: 9, end: 13 } },
  { id: 7, name: 'Patrón 7: Locrio (Grado VII)', shortLabel: 'P7: Locrio', description: 'Comienza en la 7ª mayor', rootStringRef: 6, fretSpanOffset: { start: 11, end: 15 } },
];

/**
 * Algoritmo de asignación biomecánica de digitación y detección de extensiones
 */
export function calculateFingerAssignment(
  fret: number,
  boxBaseFret: number,
  system: ScaleSystemType,
  fretsOnCurrentString: number[]
): FingerAssignment {
  if (fret === 0) {
    return { finger: 0, isStretch: false };
  }

  // --- LÓGICA BIOMECÁNICA 3NPS (3 Notas por Cuerda) ---
  if (system === '3nps' && fretsOnCurrentString.length === 3) {
    const sorted = [...fretsOnCurrentString].sort((a, b) => a - b);
    const noteIndex = sorted.indexOf(fret);
    const span = sorted[2] - sorted[0]; // Amplitud total en la cuerda (4 o 5 trastes)
    const d1 = sorted[1] - sorted[0];   // Distancia nota 1 a nota 2
    const d2 = sorted[2] - sorted[1];   // Distancia nota 2 a nota 3

    // Si el patrón en la cuerda abarca 5 trastes (ej. trastes 8, 10, 12 o 7, 9, 11), hay extensión obligatoria
    const hasStringStretch = span >= 4;

    if (noteIndex === 0) {
      // Dedo 1 (Índice). Si la posición base de la mano está anclada adelante, este dedo se extiende hacia atrás
      const isStretch = hasStringStretch && fret < boxBaseFret;
      return { 
        finger: 1, 
        isStretch,
        stretchType: isStretch ? 'backward' : undefined,
      };
    }

    if (noteIndex === 1) {
      // Si la amplitud es >= 4 (tono + tono, ej: 8-10-12), digitación 1-2-4 (dedo 2 intermedio)
      // Si no, si d1 es 1 semitono -> Dedo 2 (Medio); si d1 es 1 tono -> Dedo 3 (Anular)
      const finger = span >= 4 ? 2 : (d1 === 1 ? 2 : 3);
      return { finger, isStretch: false };
    }

    if (noteIndex === 2) {
      // Dedo 4 (Meñique). Si abarca 5 trastes y d2 es de 2 trastes, requiere extensión hacia adelante
      return { 
        finger: 4, 
        isStretch: hasStringStretch, 
        stretchType: 'forward' 
      };
    }
  }

  // --- LÓGICA POSICIONAL ESTÁNDAR CAGED (Posición de 4 trastes) ---
  const relativeFret = fret - boxBaseFret;

  // Si en la cuerda hay alguna nota por detrás de boxBaseFret (ej. traste 7 cuando la caja base empieza en el 8)
  const hasBackwardNote = fretsOnCurrentString.some((f) => f < boxBaseFret);

  if (relativeFret < 0) {
    // Extensión del índice hacia atrás (ej. traste 7 cuando la caja base empieza en el 8)
    return { finger: 1, isStretch: true, stretchType: 'backward' };
  }

  if (hasBackwardNote) {
    // La nota retrasada ya ocupó el dedo 1, por tanto el traste base lo pisa el dedo 2
    if (relativeFret === 0) return { finger: 2, isStretch: false };
    if (relativeFret === 1) return { finger: 3, isStretch: false };
    if (relativeFret === 2) return { finger: 4, isStretch: false };
    return { finger: 4, isStretch: true, stretchType: 'forward' };
  }

  if (relativeFret === 0) return { finger: 1, isStretch: false };
  if (relativeFret === 1) return { finger: 2, isStretch: false };
  if (relativeFret === 2) return { finger: 3, isStretch: false };
  if (relativeFret === 3) return { finger: 4, isStretch: false };

  // Extensión del meñique hacia adelante fuera de los 4 trastes base
  return { finger: 4, isStretch: true, stretchType: 'forward' };
}

export interface ScaleCalculationResult {
  notes: ActiveFretNote[];
  fretRange: [number, number];
  boxBaseFret: number;
}

/**
 * Calcula las notas activas, digitaciones anatómicas y ventana de enfoque
 * para el sistema dual de escalas (CAGED vs 3NPS).
 */
export function calculateScaleSystemNotes(
  instrument: InstrumentType,
  rootNote: string,
  scaleKey: ScaleKey,
  system: ScaleSystemType,
  patternId: number
): ScaleCalculationResult {
  const config = INSTRUMENTS[instrument];
  const numStrings = config.strings.length;
  const lowestStringIdx = numStrings - 1; // 6ª cuerda en guitarra (index 5)
  const lowestStringNote = config.strings[lowestStringIdx].note;

  const rootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
  const lowestStrNoteIdx = CHROMATIC_NOTES.indexOf(lowestStringNote as ChromaticNote);
  let rootFretLowest = (rootIdx - lowestStrNoteIdx + 12) % 12;

  // Lista de notas de la escala con intervalos y roles armónicos
  const scaleNotes = getScaleNoteList(rootNote, scaleKey);
  const noteMap = new Map<string, { interval: string; role: any }>();
  scaleNotes.forEach((sn) => {
    noteMap.set(sn.note, {
      interval: sn.interval.label,
      role: sn.interval.role,
    });
  });

  const notes: ActiveFretNote[] = [];

  // =========================================================================
  // SISTEMA 1: CAGED (5 Cajas tradicionales)
  // =========================================================================
  if (system === 'caged') {
    const pattern = CAGED_BOXES.find((b) => b.id === patternId) || CAGED_BOXES[0];

    // Ajustar si la caja quedaría en trastes negativos
    let baseFret = rootFretLowest;
    if (baseFret + pattern.fretSpanOffset.start < 0) {
      baseFret += 12;
    } else if (baseFret + pattern.fretSpanOffset.end > config.totalFrets) {
      baseFret = Math.max(0, baseFret - 12);
    }

    const minBoxFret = Math.max(0, baseFret + pattern.fretSpanOffset.start);
    const maxBoxFret = Math.min(config.totalFrets, baseFret + pattern.fretSpanOffset.end);

    // Recolectar primero las notas por cuerda para calcular digitaciones con contexto
    const stringFretsMap = new Map<number, number[]>();
    for (let sIdx = 0; sIdx < numStrings; sIdx++) {
      const str = config.strings[sIdx];
      const frets: number[] = [];
      for (let fret = minBoxFret; fret <= maxBoxFret; fret++) {
        const fn = getFretNote(str.midi, fret);
        if (noteMap.has(fn.note)) {
          frets.push(fret);
        }
      }
      stringFretsMap.set(sIdx, frets);
    }

    // Generar ActiveFretNotes con cálculo biomecánico
    for (let sIdx = 0; sIdx < numStrings; sIdx++) {
      const str = config.strings[sIdx];
      const fretsOnString = stringFretsMap.get(sIdx) || [];

      fretsOnString.forEach((fret) => {
        const fn = getFretNote(str.midi, fret);
        const found = noteMap.get(fn.note)!;
        const fingerAssign = calculateFingerAssignment(
          fret,
          baseFret,
          'caged',
          fretsOnString
        );

        notes.push({
          stringIndex: sIdx,
          fret,
          note: fn.note,
          interval: found.interval,
          role: found.role,
          finger: fingerAssign.finger > 0 ? String(fingerAssign.finger) : undefined,
          fingerAssignment: fingerAssign,
          midi: fn.midi,
        });
      });
    }

    return {
      notes,
      fretRange: [minBoxFret, maxBoxFret],
      boxBaseFret: baseFret,
    };
  }

  // =========================================================================
  // SISTEMA 2: 3NPS (7 Patrones Simétricos - 3 Notas por Cuerda)
  // =========================================================================
  const pattern = THREE_NPS_PATTERNS.find((p) => p.id === patternId) || THREE_NPS_PATTERNS[0];
  const scaleDegreeCount = scaleNotes.length; // 7 notas diatónicas

  // Grado de inicio en la cuerda más grave (0 = Tónica, 1 = 2ª, etc.)
  const startDegreeIdx = (pattern.id - 1) % scaleDegreeCount;

  // Traste de anclaje de la primera nota en la cuerda más grave
  let baseFret = rootFretLowest;
  // Offset relativo al patrón 3NPS
  const targetStartFret = rootFretLowest + pattern.fretSpanOffset.start;
  const targetNormalized = targetStartFret < 0 ? targetStartFret + 12 : targetStartFret;

  // Encontrar el traste exacto de la nota de inicio en la cuerda más grave
  const lowestStr = config.strings[lowestStringIdx];
  const firstNoteName = scaleNotes[startDegreeIdx].note;

  let startFret = -1;
  let minDiff = 999;
  for (let f = 0; f <= config.totalFrets; f++) {
    const fn = getFretNote(lowestStr.midi, f);
    if (fn.note === firstNoteName) {
      const diff = Math.abs(f - targetNormalized);
      if (diff < minDiff) {
        minDiff = diff;
        startFret = f;
      }
    }
  }

  if (startFret < 0) startFret = targetNormalized;
  baseFret = startFret;

  // Construir exactamente 3 notas consecutivas por cuerda desde la más grave hacia la más aguda
  const stringFretsMap = new Map<number, number[]>();
  let currentStartDeg = startDegreeIdx;
  let prevFirstFret = startFret;

  // Recorremos desde lowestStringIdx hacia 0 (arriba)
  for (let sIdx = lowestStringIdx; sIdx >= 0; sIdx--) {
    const str = config.strings[sIdx];
    const fretsThisString: number[] = [];

    // Las 3 notas diatónicas consecutivas
    const deg1 = currentStartDeg % scaleDegreeCount;
    const deg2 = (currentStartDeg + 1) % scaleDegreeCount;
    const deg3 = (currentStartDeg + 2) % scaleDegreeCount;

    const n1 = scaleNotes[deg1].note;
    const n2 = scaleNotes[deg2].note;
    const n3 = scaleNotes[deg3].note;

    // Encontrar traste de n1 cercano a prevFirstFret
    let bestF1 = -1;
    let bestDiff1 = 999;
    for (let f = Math.max(0, prevFirstFret - 3); f <= Math.min(config.totalFrets, prevFirstFret + 4); f++) {
      const fn = getFretNote(str.midi, f);
      if (fn.note === n1) {
        const diff = Math.abs(f - prevFirstFret);
        if (diff < bestDiff1) {
          bestDiff1 = diff;
          bestF1 = f;
        }
      }
    }

    if (bestF1 === -1) {
      // Búsqueda ampliada si la afinación difiere
      for (let f = 0; f <= config.totalFrets; f++) {
        if (getFretNote(str.midi, f).note === n1) {
          const diff = Math.abs(f - prevFirstFret);
          if (diff < bestDiff1) {
            bestDiff1 = diff;
            bestF1 = f;
          }
        }
      }
    }

    // Traste de n2 posterior a bestF1
    let bestF2 = -1;
    for (let f = bestF1 + 1; f <= Math.min(config.totalFrets, bestF1 + 4); f++) {
      if (getFretNote(str.midi, f).note === n2) {
        bestF2 = f;
        break;
      }
    }

    // Traste de n3 posterior a bestF2
    let bestF3 = -1;
    if (bestF2 !== -1) {
      for (let f = bestF2 + 1; f <= Math.min(config.totalFrets, bestF2 + 4); f++) {
        if (getFretNote(str.midi, f).note === n3) {
          bestF3 = f;
          break;
        }
      }
    }

    if (bestF1 !== -1 && bestF2 !== -1 && bestF3 !== -1) {
      fretsThisString.push(bestF1, bestF2, bestF3);
      prevFirstFret = bestF1;
    }

    stringFretsMap.set(sIdx, fretsThisString);
    // Para la siguiente cuerda, avanzar 3 grados en la escala diatónica
    currentStartDeg = (currentStartDeg + 3) % scaleDegreeCount;
  }

  let allFrets: number[] = [];
  stringFretsMap.forEach((frets) => allFrets.push(...frets));
  const minFret = allFrets.length > 0 ? Math.min(...allFrets) : 0;
  const maxFret = allFrets.length > 0 ? Math.max(...allFrets) : config.totalFrets;

  // Generar ActiveFretNotes con digitaciones 3NPS
  for (let sIdx = 0; sIdx < numStrings; sIdx++) {
    const str = config.strings[sIdx];
    const fretsOnString = stringFretsMap.get(sIdx) || [];

    fretsOnString.forEach((fret) => {
      const fn = getFretNote(str.midi, fret);
      const found = noteMap.get(fn.note);
      if (!found) return;

      const fingerAssign = calculateFingerAssignment(
        fret,
        baseFret,
        '3nps',
        fretsOnString
      );

      notes.push({
        stringIndex: sIdx,
        fret,
        note: fn.note,
        interval: found.interval,
        role: found.role,
        finger: fingerAssign.finger > 0 ? String(fingerAssign.finger) : undefined,
        fingerAssignment: fingerAssign,
        midi: fn.midi,
      });
    });
  }

  return {
    notes,
    fretRange: [minFret, maxFret],
    boxBaseFret: baseFret,
  };
}

