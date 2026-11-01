import { PianoExerciseData, PianoNoteData } from '@/types/piano';

export const PIANO_INITIAL_EXERCISES: PianoExerciseData[] = [
  {
    id: 'piano-seed-1',
    slug: 'hanon-1-independencia-dedos',
    title: 'Hanon Nº 1 — Agilidad e Independencia de Dedos',
    instrument: 'piano',
    category: 'Hanon & Técnica',
    difficulty: 'Básico',
    bpmDefault: 85,
    timeSignature: '4/4',
    totalSteps: 32, // 2 compases en semicorcheas
    description:
      'El clásico estudio de Charles-Louis Hanon para extender la articulación del 5º dedo y flexibilizar el pulgar a dos manos al unísono.',
    notesData: [
      // Compás 1: Subida desde Do (C)
      // Mano Derecha (MD) - C4 a C5
      { step: 0, midiNumber: 60, noteName: 'C4', hand: 'right', finger: 1, velocity: 90, durationSteps: 1 },
      { step: 1, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 2, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 3, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 4, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
      { step: 5, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 6, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 7, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },

      { step: 8, midiNumber: 62, noteName: 'D4', hand: 'right', finger: 1, velocity: 90, durationSteps: 1 },
      { step: 9, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 10, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 11, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 12, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
      { step: 13, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 14, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 15, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },

      // Mano Izquierda (MI) - C3 a C4 (octava grave)
      { step: 0, midiNumber: 48, noteName: 'C3', hand: 'left', finger: 5, velocity: 90, durationSteps: 1 },
      { step: 1, midiNumber: 52, noteName: 'E3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 2, midiNumber: 53, noteName: 'F3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 3, midiNumber: 55, noteName: 'G3', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 4, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 1, velocity: 95, durationSteps: 1 },
      { step: 5, midiNumber: 55, noteName: 'G3', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 6, midiNumber: 53, noteName: 'F3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 7, midiNumber: 52, noteName: 'E3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },

      { step: 8, midiNumber: 50, noteName: 'D3', hand: 'left', finger: 5, velocity: 90, durationSteps: 1 },
      { step: 9, midiNumber: 53, noteName: 'F3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 10, midiNumber: 55, noteName: 'G3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 11, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 12, midiNumber: 59, noteName: 'B3', hand: 'left', finger: 1, velocity: 95, durationSteps: 1 },
      { step: 13, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 14, midiNumber: 55, noteName: 'G3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 15, midiNumber: 53, noteName: 'F3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },

      // Compás 2: Subida desde Mi (E) hacia la cima
      { step: 16, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 1, velocity: 90, durationSteps: 1 },
      { step: 17, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 18, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 19, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 20, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
      { step: 21, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 22, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 23, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },

      { step: 24, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 1, velocity: 90, durationSteps: 1 },
      { step: 25, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 26, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 27, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 28, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
      { step: 29, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 30, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 31, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },

      { step: 16, midiNumber: 52, noteName: 'E3', hand: 'left', finger: 5, velocity: 90, durationSteps: 1 },
      { step: 17, midiNumber: 55, noteName: 'G3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 18, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 19, midiNumber: 59, noteName: 'B3', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 20, midiNumber: 60, noteName: 'C4', hand: 'left', finger: 1, velocity: 95, durationSteps: 1 },
      { step: 21, midiNumber: 59, noteName: 'B3', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 22, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 23, midiNumber: 55, noteName: 'G3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },

      { step: 24, midiNumber: 53, noteName: 'F3', hand: 'left', finger: 5, velocity: 90, durationSteps: 1 },
      { step: 25, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 26, midiNumber: 59, noteName: 'B3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 27, midiNumber: 60, noteName: 'C4', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 28, midiNumber: 62, noteName: 'D4', hand: 'left', finger: 1, velocity: 95, durationSteps: 1 },
      { step: 29, midiNumber: 60, noteName: 'C4', hand: 'left', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 30, midiNumber: 59, noteName: 'B3', hand: 'left', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 31, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 4, velocity: 85, durationSteps: 1 },
    ],
  },
  {
    id: 'piano-seed-2',
    slug: 'voicing-jazz-ii-v-i-bill-evans',
    title: 'Voicing Jazz II-V-I (Bill Evans Style)',
    instrument: 'piano',
    category: 'Jazz & Voicings',
    difficulty: 'Intermedio',
    bpmDefault: 95,
    timeSignature: '4/4',
    totalSteps: 32, // ii7 (Dm9) -> V7 (G13) -> Imaj7 (Cmaj9)
    description:
      'Progresión armónica modal con voicings elegantes sin fundamental en mano derecha y raíces espaciadas en mano izquierda.',
    notesData: [
      // Compás 1 (Paso 0 a 15): Dm9 (ii) hacia G13 (V)
      // Dm9: LH D2 + D3 (Paso 0), RH F4, A4, C5, E5 (Paso 0 a 7)
      { step: 0, midiNumber: 38, noteName: 'D2', hand: 'left', finger: 5, velocity: 95, durationSteps: 8 },
      { step: 0, midiNumber: 50, noteName: 'D3', hand: 'left', finger: 1, velocity: 85, durationSteps: 8 },
      { step: 0, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 1, velocity: 90, durationSteps: 8 },
      { step: 0, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 2, velocity: 90, durationSteps: 8 },
      { step: 0, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 3, velocity: 90, durationSteps: 8 },
      { step: 0, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 8 },

      // Síncopa o variación rítmica en paso 4
      { step: 4, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 1, velocity: 80, durationSteps: 4 },
      { step: 4, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 2, velocity: 80, durationSteps: 4 },
      { step: 4, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 3, velocity: 80, durationSteps: 4 },
      { step: 4, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 85, durationSteps: 4 },

      // G13 (V7 alterado): LH G2 + B2 (Paso 8 a 15), RH F4, A4, B4, E5
      { step: 8, midiNumber: 43, noteName: 'G2', hand: 'left', finger: 5, velocity: 95, durationSteps: 8 },
      { step: 8, midiNumber: 47, noteName: 'B2', hand: 'left', finger: 1, velocity: 85, durationSteps: 8 },
      { step: 8, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 1, velocity: 90, durationSteps: 8 },
      { step: 8, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 2, velocity: 90, durationSteps: 8 },
      { step: 8, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 3, velocity: 90, durationSteps: 8 },
      { step: 8, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 8 },

      // Compás 2 (Paso 16 a 31): Resolución en Cmaj9 (I)
      // Cmaj9: LH C2 + G2 + E3, RH E4, G4, B4, D5
      { step: 16, midiNumber: 36, noteName: 'C2', hand: 'left', finger: 5, velocity: 100, durationSteps: 16 },
      { step: 16, midiNumber: 43, noteName: 'G2', hand: 'left', finger: 2, velocity: 90, durationSteps: 16 },
      { step: 16, midiNumber: 52, noteName: 'E3', hand: 'left', finger: 1, velocity: 85, durationSteps: 16 },
      { step: 16, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 1, velocity: 90, durationSteps: 8 },
      { step: 16, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 2, velocity: 90, durationSteps: 8 },
      { step: 16, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 3, velocity: 90, durationSteps: 8 },
      { step: 16, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 5, velocity: 95, durationSteps: 8 },

      // Acorde staccato decorativo en tiempo débil (paso 24)
      { step: 24, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 1, velocity: 85, durationSteps: 4 },
      { step: 24, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 2, velocity: 85, durationSteps: 4 },
      { step: 24, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 3, velocity: 85, durationSteps: 4 },
      { step: 24, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 5, velocity: 90, durationSteps: 4 },
    ],
  },
  {
    id: 'piano-seed-3',
    slug: 'clasico-para-elisa-beethoven',
    title: 'Clásico: Para Elisa (Tema Principal en La Menor)',
    instrument: 'piano',
    category: 'Clásico',
    difficulty: 'Intermedio',
    bpmDefault: 120,
    timeSignature: '3/4',
    totalSteps: 24, // Compás de 3/8 en semicorcheas fluidas
    description:
      'El famoso motivo de Ludwig van Beethoven. Requiere equilibrio de peso en la melodía cantabile y arpegios ligeros en la mano izquierda.',
    notesData: [
      // Melodía principal mano derecha
      { step: 0, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
      { step: 1, midiNumber: 75, noteName: 'D#5', hand: 'right', finger: 4, velocity: 90, durationSteps: 1 },
      { step: 2, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
      { step: 3, midiNumber: 75, noteName: 'D#5', hand: 'right', finger: 4, velocity: 90, durationSteps: 1 },
      { step: 4, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
      { step: 5, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 6, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 4, velocity: 85, durationSteps: 1 },
      { step: 7, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 3, velocity: 85, durationSteps: 1 },
      { step: 8, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 1, velocity: 95, durationSteps: 4 },

      // Acompañamiento arpegiado Am en mano izquierda
      { step: 8, midiNumber: 45, noteName: 'A2', hand: 'left', finger: 5, velocity: 85, durationSteps: 2 },
      { step: 10, midiNumber: 52, noteName: 'E3', hand: 'left', finger: 2, velocity: 80, durationSteps: 2 },
      { step: 12, midiNumber: 57, noteName: 'A3', hand: 'left', finger: 1, velocity: 80, durationSteps: 2 },

      // Mano derecha continúa hacia C - E - A
      { step: 12, midiNumber: 60, noteName: 'C4', hand: 'right', finger: 1, velocity: 85, durationSteps: 1 },
      { step: 13, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 14, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 4, velocity: 90, durationSteps: 1 },
      { step: 15, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 5, velocity: 95, durationSteps: 4 },

      // Acompañamiento E en mano izquierda
      { step: 16, midiNumber: 40, noteName: 'E2', hand: 'left', finger: 5, velocity: 85, durationSteps: 2 },
      { step: 18, midiNumber: 52, noteName: 'E3', hand: 'left', finger: 2, velocity: 80, durationSteps: 2 },
      { step: 20, midiNumber: 56, noteName: 'G#3', hand: 'left', finger: 1, velocity: 80, durationSteps: 2 },

      { step: 20, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 1, velocity: 85, durationSteps: 1 },
      { step: 21, midiNumber: 68, noteName: 'G#4', hand: 'right', finger: 2, velocity: 85, durationSteps: 1 },
      { step: 22, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 4, velocity: 90, durationSteps: 1 },
      { step: 23, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 5, velocity: 95, durationSteps: 1 },
    ],
  },
  {
    id: 'piano-seed-4',
    slug: 'pop-worship-progresion-arpegiada',
    title: 'Pop & Worship: Progresión Arpegiada Fluyente',
    instrument: 'piano',
    category: 'Pop & Worship',
    difficulty: 'Básico',
    bpmDefault: 76,
    timeSignature: '4/4',
    totalSteps: 32, // 2 compases: C - G - Am - F
    description:
      'Patrón rítmico arpegiado contemporáneo estilo Bethel / Hillsong con pedal de sustain implícito y octavas profundas en el bajo.',
    notesData: [
      // Acorde 1: C (Pasos 0 a 7)
      // Bajo LH
      { step: 0, midiNumber: 36, noteName: 'C2', hand: 'left', finger: 5, velocity: 95, durationSteps: 8 },
      { step: 0, midiNumber: 48, noteName: 'C3', hand: 'left', finger: 1, velocity: 85, durationSteps: 8 },
      // Arpegio RH: C4 - G4 - C5 - E5
      { step: 0, midiNumber: 60, noteName: 'C4', hand: 'right', finger: 1, velocity: 80, durationSteps: 2 },
      { step: 2, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 3, velocity: 85, durationSteps: 2 },
      { step: 4, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 4, velocity: 90, durationSteps: 2 },
      { step: 6, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 2 },

      // Acorde 2: G/B (Pasos 8 a 15)
      { step: 8, midiNumber: 35, noteName: 'B1', hand: 'left', finger: 5, velocity: 95, durationSteps: 8 },
      { step: 8, midiNumber: 47, noteName: 'B2', hand: 'left', finger: 1, velocity: 85, durationSteps: 8 },
      { step: 8, midiNumber: 59, noteName: 'B3', hand: 'right', finger: 1, velocity: 80, durationSteps: 2 },
      { step: 10, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 3, velocity: 85, durationSteps: 2 },
      { step: 12, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 4, velocity: 90, durationSteps: 2 },
      { step: 14, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 5, velocity: 95, durationSteps: 2 },

      // Acorde 3: Am7 (Pasos 16 a 23)
      { step: 16, midiNumber: 33, noteName: 'A1', hand: 'left', finger: 5, velocity: 95, durationSteps: 8 },
      { step: 16, midiNumber: 45, noteName: 'A2', hand: 'left', finger: 1, velocity: 85, durationSteps: 8 },
      { step: 16, midiNumber: 57, noteName: 'A3', hand: 'right', finger: 1, velocity: 80, durationSteps: 2 },
      { step: 18, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 2, velocity: 85, durationSteps: 2 },
      { step: 20, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 4, velocity: 90, durationSteps: 2 },
      { step: 22, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 5, velocity: 95, durationSteps: 2 },

      // Acorde 4: Fadd9 (Pasos 24 a 31)
      { step: 24, midiNumber: 29, noteName: 'F1', hand: 'left', finger: 5, velocity: 95, durationSteps: 8 },
      { step: 24, midiNumber: 41, noteName: 'F2', hand: 'left', finger: 1, velocity: 85, durationSteps: 8 },
      { step: 24, midiNumber: 60, noteName: 'C4', hand: 'right', finger: 1, velocity: 80, durationSteps: 2 },
      { step: 26, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 2, velocity: 85, durationSteps: 2 },
      { step: 28, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 3, velocity: 90, durationSteps: 2 },
      { step: 30, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 5, velocity: 95, durationSteps: 2 },
    ],
  },
  {
    id: 'piano-seed-5',
    slug: 'bossa-nova-keys-independencia',
    title: 'Bossa Nova Piano: Independencia Rítmica Clave',
    instrument: 'piano',
    category: 'Independencia de Manos',
    difficulty: 'Avanzado',
    bpmDefault: 125,
    timeSignature: '4/4',
    totalSteps: 32,
    description:
      'Patrón síncopado clásico brasileño (Jobim). El bajo en mano izquierda marca el pulso en blancas mientras la mano derecha ejecuta acordes percusivos en contratiempo.',
    notesData: [
      // Mano izquierda (Surdo / Bajo de Bossa): pulso constante 1 y 3 (pasos 0, 8, 16, 24)
      { step: 0, midiNumber: 36, noteName: 'C2', hand: 'left', finger: 5, velocity: 100, durationSteps: 4 },
      { step: 4, midiNumber: 43, noteName: 'G2', hand: 'left', finger: 1, velocity: 85, durationSteps: 4 },
      { step: 8, midiNumber: 36, noteName: 'C2', hand: 'left', finger: 5, velocity: 95, durationSteps: 4 },
      { step: 12, midiNumber: 43, noteName: 'G2', hand: 'left', finger: 1, velocity: 85, durationSteps: 4 },

      { step: 16, midiNumber: 41, noteName: 'F2', hand: 'left', finger: 5, velocity: 100, durationSteps: 4 },
      { step: 20, midiNumber: 48, noteName: 'C3', hand: 'left', finger: 1, velocity: 85, durationSteps: 4 },
      { step: 24, midiNumber: 41, noteName: 'F2', hand: 'left', finger: 5, velocity: 95, durationSteps: 4 },
      { step: 28, midiNumber: 48, noteName: 'C3', hand: 'left', finger: 1, velocity: 85, durationSteps: 4 },

      // Mano derecha (Clave síncopada de Bossa: tiempos 1, 2+, 4, 1+, 3):
      // Paso 0:
      { step: 0, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 1, velocity: 90, durationSteps: 3 },
      { step: 0, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 2, velocity: 90, durationSteps: 3 },
      { step: 0, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 4, velocity: 90, durationSteps: 3 },
      { step: 0, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 5, velocity: 90, durationSteps: 3 },

      // Paso 6 (contratiempo):
      { step: 6, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 1, velocity: 95, durationSteps: 3 },
      { step: 6, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 2, velocity: 95, durationSteps: 3 },
      { step: 6, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 4, velocity: 95, durationSteps: 3 },
      { step: 6, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 5, velocity: 95, durationSteps: 3 },

      // Paso 12:
      { step: 12, midiNumber: 64, noteName: 'E4', hand: 'right', finger: 1, velocity: 90, durationSteps: 3 },
      { step: 12, midiNumber: 67, noteName: 'G4', hand: 'right', finger: 2, velocity: 90, durationSteps: 3 },
      { step: 12, midiNumber: 71, noteName: 'B4', hand: 'right', finger: 4, velocity: 90, durationSteps: 3 },
      { step: 12, midiNumber: 74, noteName: 'D5', hand: 'right', finger: 5, velocity: 90, durationSteps: 3 },

      // Paso 18:
      { step: 18, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 1, velocity: 95, durationSteps: 3 },
      { step: 18, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 2, velocity: 95, durationSteps: 3 },
      { step: 18, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 4, velocity: 95, durationSteps: 3 },
      { step: 18, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 3 },

      // Paso 26:
      { step: 26, midiNumber: 65, noteName: 'F4', hand: 'right', finger: 1, velocity: 95, durationSteps: 3 },
      { step: 26, midiNumber: 69, noteName: 'A4', hand: 'right', finger: 2, velocity: 95, durationSteps: 3 },
      { step: 26, midiNumber: 72, noteName: 'C5', hand: 'right', finger: 4, velocity: 95, durationSteps: 3 },
      { step: 26, midiNumber: 76, noteName: 'E5', hand: 'right', finger: 5, velocity: 95, durationSteps: 3 },
    ],
  },
];

