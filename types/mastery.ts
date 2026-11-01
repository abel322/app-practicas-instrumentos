export type MasteryInstrument = 'guitar' | 'piano' | 'bass' | 'drums';

export type MasteryLevel = 1 | 2 | 3 | 4 | 5;

export interface MicroExerciseSpec {
  title: string;
  tabOrNotation: string;
  description: string;
  fingering?: string;
  techniqueKey: string;
  instructions: string[];
}

export interface MasterySkillNode {
  id: string;
  instrument: MasteryInstrument;
  level: MasteryLevel;
  title: string;
  technique: string;
  category: string;
  difficultyLabel: 'Fundamentos' | 'Básico-Medio' | 'Intermedio' | 'Avanzado' | 'Virtuoso / Maestría';
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
}

export interface MasteryInstrumentProgress {
  completedLevels: number[];
  activeLevel: number;
  cleanRepsCount: Record<number, number>;
  lastTrainedAt?: string;
  totalPracticeMinutes: number;
}

export type MasteryProgressState = Record<MasteryInstrument, MasteryInstrumentProgress>;

