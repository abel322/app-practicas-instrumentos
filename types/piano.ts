export type PianoHand = 'left' | 'right';

export interface PianoNoteData {
  id?: string;
  step: number;            // Índice de paso en la rejilla (0 a totalSteps - 1)
  midiNumber: number;      // Número MIDI de la nota (ej. 60 = C4 / Do central)
  noteName: string;        // Nombre de la nota con octava (ej. "C4", "F#3", "Bb5")
  velocity?: number;       // Dinámica de pulsación (0 a 127 o 0.0 a 1.0)
  durationSteps?: number;  // Duración en pasos de la rejilla (1 = semicorchea, 2 = corchea, etc.)
  hand?: PianoHand;        // 'left' (Mano Izquierda / Clave de Fa) o 'right' (Mano Derecha / Clave de Sol)
  finger?: number;         // Digitación recomendada: 1 (pulgar) al 5 (meñique)
}

export type PianoCategory =
  | 'Todas'
  | 'Clásico'
  | 'Hanon & Técnica'
  | 'Jazz & Voicings'
  | 'Pop & Worship'
  | 'Independencia de Manos'
  | 'Acordes & Arpegios';

export interface PianoExerciseData {
  id: string;
  slug: string;
  title: string;
  instrument: 'piano';
  category: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  bpmDefault: number;
  timeSignature: '4/4' | '6/8' | '3/4';
  totalSteps: number;
  subdivision?: string;
  stepsPerMeasure?: number;
  notesData: PianoNoteData[];
  description?: string;
  createdAt?: string | Date;
}

