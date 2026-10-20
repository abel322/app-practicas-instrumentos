export type DrumVoice =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'hihat_open'
  | 'crash'
  | 'ride'
  | 'tom1'
  | 'tom2'
  | 'floor_tom';

export type StickingType = 'R' | 'L' | 'K' | 'B';

export interface DrumHit {
  id?: string;
  step: number;               // 0 to totalSteps - 1
  instrument: DrumVoice;
  accent?: boolean;
  sticking?: StickingType;
  velocity?: number;          // 0.0 to 1.0 (default 0.8, accents 1.0)
  duration?: string;          // e.g. "16n", "8n"
}

export type ExerciseCategory = 
  | 'Todos' 
  | 'Rudimentos' 
  | 'Grooves' 
  | 'Independencia' 
  | 'Acentos & Síncopas';

export type ExerciseDifficulty = 'Básico' | 'Intermedio' | 'Avanzado';

export interface DrumExerciseData {
  id: string;
  slug: string;
  title: string;
  category: 'Rudimentos' | 'Grooves' | 'Independencia' | 'Acentos & Síncopas';
  difficulty: ExerciseDifficulty;
  bpmDefault: number;
  timeSignature: '4/4' | '6/8' | '3/4';
  totalSteps: number;
  hitsData: DrumHit[];
  description?: string;
  createdAt?: string | Date;
}
