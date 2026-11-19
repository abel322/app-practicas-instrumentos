export type StringInstrument = 'bass_4' | 'guitar_6';

export type BendType = 'standard' | 'bend_release' | 'pre_bend';
export type BendAmount = '1/4' | '1/2' | '1' | '1.5';

export type PickDirection = 'down' | 'up' | 'm' | 'a' | null; // Π (down), V (up), dedos híbridos m/a
export type PickingStyle =
  | 'alternate'
  | 'alternate_down'
  | 'alternate_up'
  | 'economy'
  | 'sweep'
  | 'downpicking'
  | 'uppicking'
  | 'hybrid'
  | 'palm_mute';
export type StrumDirection = 'down' | 'up' | 'mute' | null; // ↓, ↑, × para acordes (notas simultáneas)

export type StringTechnique =
  | 'normal'
  | 'slap'
  | 'pop'
  | 'ghost'
  | 'hammer'
  | 'pull'
  | 'pulloff'
  | 'bend'
  | 'slide'
  | 'slide_up'
  | 'slide_down'
  | 'vibrato'
  | 'natural_harmonic'
  | 'pinch_harmonic'
  | 'pm';

export interface StringTabNote {
  id?: string;
  step: number;          // 0 to totalSteps - 1
  string: number;        // Cuerda: 1 es la más aguda, 4 o 6 es la más grave
  fret: number;          // 0 = cuerda al aire, 1...24 trastes
  finger?: string;       // "1" (índice), "2" (medio), "3" (anular), "4" (meñique), "T" (pulgar)
  technique?: StringTechnique | string;
  slideDirection?: 'up' | 'down' | null;
  bendType?: BendType;
  bendAmount?: BendAmount;
  duration?: string;     // e.g. "16n", "8n"
  velocity?: number;     // 0.0 to 1.0 (defecto 0.8)
  pickDirection?: PickDirection;
  palmMute?: boolean;
  strumDirection?: StrumDirection;
}

export type StringCategory =
  | 'Todas'
  | 'Slap & Pop'
  | 'Walking Bass'
  | 'Escalas & Arpegios'
  | 'Licks & Riffs'
  | 'Fingerpicking';

export interface StringExerciseData {
  id: string;
  slug: string;
  title: string;
  instrument: StringInstrument;
  tuning: string; // Ej: "E A D G" o "E A D G B E"
  category: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  bpmDefault: number;
  timeSignature: '4/4' | '6/8' | '3/4';
  totalSteps: number;
  subdivision?: string;
  stepsPerMeasure?: number;
  tabData: StringTabNote[];
  measures?: any[];
  patternBank?: any[];
  pickingStyle?: PickingStyle | string;
  description?: string;
  createdAt?: string | Date;
}
