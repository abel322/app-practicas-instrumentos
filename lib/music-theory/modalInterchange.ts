import { ChordKey } from './fretboard';
import {
  resolveCleanKeyRoot,
  getCleanNoteNameForTonality,
  getPitchClass,
} from '@/lib/music/diatonicSpelling';

export type ParallelModeType = 'aeolian' | 'dorian' | 'lydian' | 'mixolydian' | 'phrygian';

export interface BorrowedChordDefinition {
  idSuffix: string;
  parallelMode: ParallelModeType;
  degreeLabel: string;
  degreeDisplay: string;
  semitoneOffset: number;
  chordKey: ChordKey;
  suggestedResourceId: string;
  suggestedScaleName: string;
  harmonicFunction: string;
  description: string;
}

export interface BorrowedChordInfo {
  id: string;
  parallelMode: ParallelModeType;
  parallelModeLabel: string;
  degreeLabel: string;
  degreeDisplay: string;
  semitoneOffset: number;
  chordKey: ChordKey;
  chordName: string;
  rootNote: string;
  suggestedResourceId: string;
  suggestedScaleName: string;
  harmonicFunction: string;
  description: string;
}

export interface ModalInterchangeGroup {
  mode: ParallelModeType;
  modeLabel: string;
  badge: string;
  description: string;
  chords: BorrowedChordInfo[];
}

const PARALLEL_MODE_DEFINITIONS: Record<
  ParallelModeType,
  { label: string; badge: string; description: string; chordDefs: BorrowedChordDefinition[] }
> = {
  aeolian: {
    label: 'Eólico / Menor Paralelo',
    badge: '♭3, ♭6, ♭7',
    description: 'La fuente más rica de intercambio modal en música popular, cinematográfica y jazz.',
    chordDefs: [
      {
        idSuffix: 'ivm7',
        parallelMode: 'aeolian',
        degreeLabel: 'ivm7',
        degreeDisplay: 'IVm7',
        semitoneOffset: 5,
        chordKey: 'm7',
        suggestedResourceId: 'dorian',
        suggestedScaleName: 'Modo Dórico (o Eólico)',
        harmonicFunction: 'Subdominante Menor',
        description: 'Cadencia plagal emotiva (IVm7 → Imaj7), sonido icónico de baladas.',
      },
      {
        idSuffix: 'bVImaj7',
        parallelMode: 'aeolian',
        degreeLabel: '♭VImaj7',
        degreeDisplay: '♭VImaj7',
        semitoneOffset: 8,
        chordKey: 'maj7',
        suggestedResourceId: 'lydian',
        suggestedScaleName: 'Modo Lidio',
        harmonicFunction: 'Tensión Épica / Resonancia Menor',
        description: 'Sonido cinematográfico majestuoso (♭VImaj7 → ♭VII7 → Imaj7).',
      },
      {
        idSuffix: 'bVII7',
        parallelMode: 'aeolian',
        degreeLabel: '♭VII7',
        degreeDisplay: '♭VII7',
        semitoneOffset: 10,
        chordKey: 'dom7',
        suggestedResourceId: 'mixolydian',
        suggestedScaleName: 'Modo Mixolidio',
        harmonicFunction: 'Cadencia Backdoor (♭VII7 → I)',
        description: 'Resolución backdoor hacia la tónica sin el tritono duro de V7.',
      },
      {
        idSuffix: 'iim7b5',
        parallelMode: 'aeolian',
        degreeLabel: 'iim7b5',
        degreeDisplay: 'IIm7b5',
        semitoneOffset: 2,
        chordKey: 'm7b5',
        suggestedResourceId: 'locrian',
        suggestedScaleName: 'Modo Locrio (o Locrio #2)',
        harmonicFunction: 'Subdominante Semidisminuido',
        description: 'Prepara cadencias menores sofisticadas (IIm7b5 → V7alt → Im/I).',
      },
      {
        idSuffix: 'bIIImaj7',
        parallelMode: 'aeolian',
        degreeLabel: '♭IIImaj7',
        degreeDisplay: '♭IIImaj7',
        semitoneOffset: 3,
        chordKey: 'maj7',
        suggestedResourceId: 'lydian',
        suggestedScaleName: 'Modo Lidio',
        harmonicFunction: 'Tónica Menor Relativa Prestada',
        description: 'Color neo-soul y rock alternativo (Imaj7 → ♭IIImaj7 → IVmaj7).',
      },
    ],
  },
  dorian: {
    label: 'Dórico Paralelo',
    badge: '6ª Mayor Natural',
    description: 'Aporta acordes mayores y dominantes con sabor soul, funk y jazz.',
    chordDefs: [
      {
        idSuffix: 'IV7',
        parallelMode: 'dorian',
        degreeLabel: 'IV7',
        degreeDisplay: 'IV7',
        semitoneOffset: 5,
        chordKey: 'dom7',
        suggestedResourceId: 'mixolydian',
        suggestedScaleName: 'Modo Mixolidio (IV)',
        harmonicFunction: 'Subdominante Dominante Bluesy',
        description: 'Groove funky y blues característico del modo Dórico.',
      },
      {
        idSuffix: 'vm7',
        parallelMode: 'dorian',
        degreeLabel: 'vm7',
        degreeDisplay: 'Vm7',
        semitoneOffset: 7,
        chordKey: 'm7',
        suggestedResourceId: 'dorian',
        suggestedScaleName: 'Modo Dórico (V)',
        harmonicFunction: 'Dominante Suave sin Tritono',
        description: 'Dominante menor atmosférico para cadencias modales.',
      },
      {
        idSuffix: 'bVIImaj7',
        parallelMode: 'dorian',
        degreeLabel: '♭VIImaj7',
        degreeDisplay: '♭VIImaj7',
        semitoneOffset: 10,
        chordKey: 'maj7',
        suggestedResourceId: 'lydian',
        suggestedScaleName: 'Modo Lidio (♭VII)',
        harmonicFunction: 'Séptimo Bemol Brillante',
        description: 'Color moderno y flotante hacia la tónica.',
      },
    ],
  },
  lydian: {
    label: 'Lidio Paralelo',
    badge: '#4 / #11 Aumentada',
    description: 'Expande la tonalidad con acordes mayores ultra-brillantes y dominantes secundarios.',
    chordDefs: [
      {
        idSuffix: 'II7',
        parallelMode: 'lydian',
        degreeLabel: 'II7',
        degreeDisplay: 'II7',
        semitoneOffset: 2,
        chordKey: 'dom7',
        suggestedResourceId: 'lydian_dominant',
        suggestedScaleName: 'Modo Lidio Dominante (#11)',
        harmonicFunction: 'Dominante Secundario (V/V)',
        description: 'Impulso brillante que conduce directamente a V7 o a IVmaj7.',
      },
      {
        idSuffix: 'IImaj7',
        parallelMode: 'lydian',
        degreeLabel: 'IImaj7',
        degreeDisplay: 'IImaj7',
        semitoneOffset: 2,
        chordKey: 'maj7',
        suggestedResourceId: 'lydian',
        suggestedScaleName: 'Modo Lidio (II)',
        harmonicFunction: 'Mayor Brillante Lidio',
        description: 'Tensión mística y etérea gracias a la nota #11.',
      },
      {
        idSuffix: 'viim7',
        parallelMode: 'lydian',
        degreeLabel: 'viim7',
        degreeDisplay: 'VIIm7',
        semitoneOffset: 11,
        chordKey: 'm7',
        suggestedResourceId: 'dorian',
        suggestedScaleName: 'Modo Dórico (VII)',
        harmonicFunction: 'Sensible Menor Suave',
        description: 'Reemplaza el viim7b5 por un acorde menor estable.',
      },
    ],
  },
  mixolydian: {
    label: 'Mixolidio Paralelo',
    badge: '♭7 Dominante',
    description: 'Armonía de rock melódico y pop contemporáneo.',
    chordDefs: [
      {
        idSuffix: 'vm7_mixo',
        parallelMode: 'mixolydian',
        degreeLabel: 'vm7',
        degreeDisplay: 'Vm7',
        semitoneOffset: 7,
        chordKey: 'm7',
        suggestedResourceId: 'dorian',
        suggestedScaleName: 'Modo Dórico (V)',
        harmonicFunction: 'Quinto Menor Melódico',
        description: 'Quinto grado menor característico de progresiones folk y rock.',
      },
      {
        idSuffix: 'bVIImaj7_mixo',
        parallelMode: 'mixolydian',
        degreeLabel: '♭VIImaj7',
        degreeDisplay: '♭VIImaj7',
        semitoneOffset: 10,
        chordKey: 'maj7',
        suggestedResourceId: 'lydian',
        suggestedScaleName: 'Modo Lidio (♭VII)',
        harmonicFunction: 'Cadencia Modal Suave',
        description: 'Resolución sin tensión hacia Imaj7.',
      },
    ],
  },
  phrygian: {
    label: 'Frigio Paralelo',
    badge: '♭2 Menor',
    description: 'El sonido dramático del acorde Napolitano (♭IImaj7).',
    chordDefs: [
      {
        idSuffix: 'bIImaj7',
        parallelMode: 'phrygian',
        degreeLabel: '♭IImaj7',
        degreeDisplay: '♭IImaj7',
        semitoneOffset: 1,
        chordKey: 'maj7',
        suggestedResourceId: 'lydian',
        suggestedScaleName: 'Modo Lidio (Napolitano)',
        harmonicFunction: 'Acorde Napolitano (♭IImaj7)',
        description: 'Resolución dramática hacia Imaj7 o hacia V7.',
      },
    ],
  },
};

/**
 * Genera todos los acordes de intercambio modal para una tonalidad dada,
 * garantizando ortografía limpia del Círculo de Quintas sin dobles alteraciones.
 */
export function getModalInterchangeChords(tonalityRoot: string): ModalInterchangeGroup[] {
  const cleanKeyRoot = resolveCleanKeyRoot(tonalityRoot);
  const rootIdx = getPitchClass(cleanKeyRoot);

  return (Object.keys(PARALLEL_MODE_DEFINITIONS) as ParallelModeType[]).map((modeKey) => {
    const modeDef = PARALLEL_MODE_DEFINITIONS[modeKey];
    const chords: BorrowedChordInfo[] = modeDef.chordDefs.map((def) => {
      const chordRootIdx = (rootIdx + def.semitoneOffset) % 12;
      const chordRoot = getCleanNoteNameForTonality(chordRootIdx, cleanKeyRoot);

      const suffix =
        def.chordKey === 'major'
          ? ''
          : def.chordKey === 'minor'
          ? 'm'
          : def.chordKey === 'dom7'
          ? '7'
          : def.chordKey;

      const chordName = `${chordRoot}${suffix}`;

      return {
        id: `${modeKey}_${def.idSuffix}`,
        parallelMode: def.parallelMode,
        parallelModeLabel: modeDef.label,
        degreeLabel: def.degreeLabel,
        degreeDisplay: def.degreeDisplay,
        semitoneOffset: def.semitoneOffset,
        chordKey: def.chordKey,
        chordName,
        rootNote: chordRoot,
        suggestedResourceId: def.suggestedResourceId,
        suggestedScaleName: `${chordRoot} ${def.suggestedScaleName}`,
        harmonicFunction: def.harmonicFunction,
        description: def.description,
      };
    });

    return {
      mode: modeKey,
      modeLabel: modeDef.label,
      badge: modeDef.badge,
      description: modeDef.description,
      chords,
    };
  });
}

/**
 * Busca un acorde prestado específico por su ID y tonalidad activa.
 */
export function findBorrowedChordById(
  id: string,
  tonalityRoot: string
): BorrowedChordInfo | null {
  const groups = getModalInterchangeChords(tonalityRoot);
  for (const group of groups) {
    const found = group.chords.find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}
