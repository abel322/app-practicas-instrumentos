export type MasteryInstrument = 'guitar' | 'piano' | 'bass' | 'drums';

export type MasteryLevel = number;

export interface InteractiveNoteStep {
  step: number;
  label: string;
  stringOrHand?: string;
  fretOrKey?: number | string;
  finger?: string;
  pickDirection?: 'down' | 'up' | 'legato' | 'tap';
  accent?: boolean;
}

export interface MicroExerciseSpec {
  title: string;
  tabOrNotation: string;
  description: string;
  fingering?: string;
  techniqueKey: string;
  instructions: string[];
  interactiveSteps?: InteractiveNoteStep[];
}

export interface MasterySkillNode {
  id: string;
  instrument: MasteryInstrument;
  level: MasteryLevel;
  title: string;
  technique: string;
  category: string;
  difficultyLabel:
    | 'Fundamentos'
    | 'Básico-Medio'
    | 'Intermedio'
    | 'Intermedio-Alto'
    | 'Avanzado'
    | 'Virtuoso / Maestría';
  badgeColor: string;
  initialBpm: number;
  targetBpm: number;
  subdivision: string;
  subdivisionNote: string;
  timeSignature: string;
  passCriterion: string;
  targetReps: number;
  warmupBpm: number;
  microExercise: MicroExerciseSpec;
  proTips: string[];
  anatomicalFocus: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface CustomLevelInput {
  title: string;
  technique?: string;
  category?: string;
  difficultyLabel?:
    | 'Fundamentos'
    | 'Básico-Medio'
    | 'Intermedio'
    | 'Intermedio-Alto'
    | 'Avanzado'
    | 'Virtuoso / Maestría';
  microExerciseTitle?: string;
  tabOrNotation: string;
  description?: string;
  initialBpm: number;
  targetBpm: number;
  targetReps: number;
  subdivision?: string;
  subdivisionNote?: string;
  passCriterion?: string;
  sessionDurationMin?: number;
  level?: number;
}

export interface MasteryInstrumentProgress {
  completedLevels: number[];
  activeLevel: number;
  cleanRepsCount: Record<number, number>;
  lastTrainedAt?: string;
  totalPracticeMinutes: number;
}

export type MasteryProgressState = Record<MasteryInstrument, MasteryInstrumentProgress>;
