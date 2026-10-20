import { DrumExerciseData } from '@/types/drum';

export const INITIAL_EXERCISES: DrumExerciseData[] = [
  {
    id: "ex_paradiddle_accent",
    slug: "paradiddle-simple-acentos",
    title: "Paradiddle Simple con Acentos",
    category: "Rudimentos",
    difficulty: "Básico",
    bpmDefault: 105,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "El rudimento fundamental por excelencia: R-L-R-R L-R-L-L con acento marcado en la primera nota de cada grupo de 4 semicorcheas para desarrollar control dinámico y rebote.",
    hitsData: [
      // Beat 1: R L R R
      { step: 0, instrument: "snare", sticking: "R", accent: true, velocity: 1.0 },
      { step: 1, instrument: "snare", sticking: "L", accent: false, velocity: 0.65 },
      { step: 2, instrument: "snare", sticking: "R", accent: false, velocity: 0.65 },
      { step: 3, instrument: "snare", sticking: "R", accent: false, velocity: 0.65 },
      // Beat 2: L R L L
      { step: 4, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 5, instrument: "snare", sticking: "R", accent: false, velocity: 0.65 },
      { step: 6, instrument: "snare", sticking: "L", accent: false, velocity: 0.65 },
      { step: 7, instrument: "snare", sticking: "L", accent: false, velocity: 0.65 },
      // Beat 3: R L R R
      { step: 8, instrument: "snare", sticking: "R", accent: true, velocity: 1.0 },
      { step: 9, instrument: "snare", sticking: "L", accent: false, velocity: 0.65 },
      { step: 10, instrument: "snare", sticking: "R", accent: false, velocity: 0.65 },
      { step: 11, instrument: "snare", sticking: "R", accent: false, velocity: 0.65 },
      // Beat 4: L R L L
      { step: 12, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 13, instrument: "snare", sticking: "R", accent: false, velocity: 0.65 },
      { step: 14, instrument: "snare", sticking: "L", accent: false, velocity: 0.65 },
      { step: 15, instrument: "snare", sticking: "L", accent: false, velocity: 0.65 },
    ]
  },
  {
    id: "ex_linear_funk",
    slug: "groove-funk-lineal",
    title: "Groove Funk Lineal",
    category: "Grooves",
    difficulty: "Avanzado",
    bpmDefault: 96,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Patrón sincopado estilo Tower of Power donde ningún miembro toca simultáneamente. Exige precisión microscópica, notas fantasma en la caja y micro-tiempo implacable.",
    hitsData: [
      // 0: Kick
      { step: 0, instrument: "kick", sticking: "K", accent: true, velocity: 1.0 },
      // 1: HiHat
      { step: 1, instrument: "hihat", sticking: "R", accent: false, velocity: 0.75 },
      // 2: Snare ghost
      { step: 2, instrument: "snare", sticking: "L", accent: false, velocity: 0.4 },
      // 3: HiHat
      { step: 3, instrument: "hihat", sticking: "R", accent: false, velocity: 0.7 },
      // 4: Snare accent (Backbeat)
      { step: 4, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      // 5: Kick
      { step: 5, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      // 6: HiHat
      { step: 6, instrument: "hihat", sticking: "R", accent: false, velocity: 0.7 },
      // 7: Snare ghost
      { step: 7, instrument: "snare", sticking: "L", accent: false, velocity: 0.4 },
      // 8: Kick
      { step: 8, instrument: "kick", sticking: "K", accent: true, velocity: 0.95 },
      // 9: HiHat
      { step: 9, instrument: "hihat", sticking: "R", accent: false, velocity: 0.7 },
      // 10: Kick
      { step: 10, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      // 11: HiHat
      { step: 11, instrument: "hihat", sticking: "R", accent: false, velocity: 0.7 },
      // 12: Snare accent (Backbeat)
      { step: 12, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      // 13: HiHat
      { step: 13, instrument: "hihat", sticking: "R", accent: false, velocity: 0.7 },
      // 14: Kick
      { step: 14, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      // 15: Snare ghost
      { step: 15, instrument: "snare", sticking: "L", accent: false, velocity: 0.45 },
    ]
  },
  {
    id: "ex_pattern_6_8",
    slug: "patron-en-6-8",
    title: "Patrón Polirítmico en 6/8",
    category: "Acentos & Síncopas",
    difficulty: "Intermedio",
    bpmDefault: 68,
    timeSignature: "6/8",
    totalSteps: 12,
    description: "Métrica compuesta con dos pulsos de negra con puntillo subdivididos en 6 corcheas / 12 semicorcheas. Explora el balance entre Ride campana, bombo en síncopa y caja en el pulso 4.",
    hitsData: [
      // Pulso 1: paso 0
      { step: 0, instrument: "ride", sticking: "R", accent: true, velocity: 0.95 },
      { step: 0, instrument: "kick", sticking: "K", accent: true, velocity: 1.0 },
      { step: 1, instrument: "ride", sticking: "R", accent: false, velocity: 0.65 },
      { step: 2, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 2, instrument: "snare", sticking: "L", accent: false, velocity: 0.4 },
      // Paso 3
      { step: 3, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 3, instrument: "kick", sticking: "K", accent: false, velocity: 0.8 },
      { step: 4, instrument: "ride", sticking: "R", accent: false, velocity: 0.65 },
      { step: 5, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      // Pulso 2: paso 6 (Backbeat fuerte de caja)
      { step: 6, instrument: "ride", sticking: "R", accent: true, velocity: 0.9 },
      { step: 6, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 7, instrument: "ride", sticking: "R", accent: false, velocity: 0.65 },
      { step: 8, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 8, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      { step: 9, instrument: "ride", sticking: "R", accent: false, velocity: 0.65 },
      // Paso 10 & 11
      { step: 10, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 10, instrument: "kick", sticking: "K", accent: false, velocity: 0.8 },
      { step: 11, instrument: "ride", sticking: "R", accent: false, velocity: 0.65 },
      { step: 11, instrument: "snare", sticking: "L", accent: false, velocity: 0.45 },
    ]
  },
  {
    id: "ex_hihat_coordination",
    slug: "coordinacion-de-hi-hat",
    title: "Coordinación e Independencia de Hi-Hat",
    category: "Independencia",
    difficulty: "Intermedio",
    bpmDefault: 92,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Desarrollo de independencia limb-by-limb: flujo constante de corcheas en Hi-Hat con apertura en el contratiempo (upbeat), bombo polirrítmico y caja acentuada.",
    hitsData: [
      // 0: Kick + HiHat cerrado
      { step: 0, instrument: "hihat", sticking: "R", accent: true, velocity: 0.9 },
      { step: 0, instrument: "kick", sticking: "K", accent: true, velocity: 1.0 },
      // 2: HiHat
      { step: 2, instrument: "hihat", sticking: "R", accent: false, velocity: 0.75 },
      // 3: Kick sincopado (e-and-a)
      { step: 3, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      // 4: Snare backbeat + HiHat
      { step: 4, instrument: "hihat", sticking: "R", accent: false, velocity: 0.8 },
      { step: 4, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      // 6: HiHat abierto con acento
      { step: 6, instrument: "hihat_open", sticking: "R", accent: true, velocity: 0.95 },
      // 7: Snare ghost note
      { step: 7, instrument: "snare", sticking: "L", accent: false, velocity: 0.4 },
      // 8: HiHat cerrado + Kick
      { step: 8, instrument: "hihat", sticking: "R", accent: true, velocity: 0.9 },
      { step: 8, instrument: "kick", sticking: "K", accent: true, velocity: 0.95 },
      // 10: HiHat + Kick anticipado
      { step: 10, instrument: "hihat", sticking: "R", accent: false, velocity: 0.75 },
      { step: 10, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      // 11: Kick
      { step: 11, instrument: "kick", sticking: "K", accent: false, velocity: 0.8 },
      // 12: Snare backbeat + HiHat
      { step: 12, instrument: "hihat", sticking: "R", accent: false, velocity: 0.8 },
      { step: 12, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      // 14: HiHat abierto
      { step: 14, instrument: "hihat_open", sticking: "R", accent: true, velocity: 0.95 },
      // 15: Snare ghost
      { step: 15, instrument: "snare", sticking: "L", accent: false, velocity: 0.45 },
    ]
  },
  {
    id: "ex_double_stroke_control",
    slug: "golpe-doble-y-acentos",
    title: "Double Stroke Roll & Acentos Invertidos",
    category: "Rudimentos",
    difficulty: "Avanzado",
    bpmDefault: 115,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Estudio de golpes dobles (R-R-L-L) con acentos desplazados al segundo golpe de cada par. Vital para el control fino del rebote y relajación muscular.",
    hitsData: [
      { step: 0, instrument: "snare", sticking: "R", accent: false, velocity: 0.6 },
      { step: 1, instrument: "snare", sticking: "R", accent: true, velocity: 1.0 },
      { step: 2, instrument: "snare", sticking: "L", accent: false, velocity: 0.6 },
      { step: 3, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 4, instrument: "snare", sticking: "R", accent: false, velocity: 0.6 },
      { step: 5, instrument: "snare", sticking: "R", accent: true, velocity: 1.0 },
      { step: 6, instrument: "snare", sticking: "L", accent: false, velocity: 0.6 },
      { step: 7, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 8, instrument: "snare", sticking: "R", accent: false, velocity: 0.6 },
      { step: 9, instrument: "snare", sticking: "R", accent: true, velocity: 1.0 },
      { step: 10, instrument: "snare", sticking: "L", accent: false, velocity: 0.6 },
      { step: 11, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 12, instrument: "snare", sticking: "R", accent: false, velocity: 0.6 },
      { step: 13, instrument: "snare", sticking: "R", accent: true, velocity: 1.0 },
      { step: 14, instrument: "snare", sticking: "L", accent: false, velocity: 0.6 },
      { step: 15, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
    ]
  },
  {
    id: "ex_afro_songo",
    slug: "songo-independencia-moderna",
    title: "Songo Cubano & Polirritmia",
    category: "Independencia",
    difficulty: "Avanzado",
    bpmDefault: 100,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Groove latino legendario popularizado por Changuito (Los Van Van). Combina campana Ride, bombo en tiempo y contratiempo, y fraseo cruzado entre toms y caja.",
    hitsData: [
      { step: 0, instrument: "ride", sticking: "R", accent: true, velocity: 0.95 },
      { step: 0, instrument: "kick", sticking: "K", accent: true, velocity: 1.0 },
      { step: 1, instrument: "snare", sticking: "L", accent: false, velocity: 0.4 },
      { step: 2, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 2, instrument: "tom1", sticking: "L", accent: true, velocity: 0.9 },
      { step: 3, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      { step: 4, instrument: "ride", sticking: "R", accent: true, velocity: 0.9 },
      { step: 4, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 5, instrument: "tom2", sticking: "R", accent: false, velocity: 0.75 },
      { step: 6, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 6, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      { step: 7, instrument: "floor_tom", sticking: "L", accent: true, velocity: 0.9 },
      { step: 8, instrument: "ride", sticking: "R", accent: true, velocity: 0.95 },
      { step: 8, instrument: "kick", sticking: "K", accent: true, velocity: 1.0 },
      { step: 9, instrument: "snare", sticking: "L", accent: false, velocity: 0.4 },
      { step: 10, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 10, instrument: "tom1", sticking: "L", accent: false, velocity: 0.8 },
      { step: 11, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      { step: 12, instrument: "ride", sticking: "R", accent: true, velocity: 0.9 },
      { step: 12, instrument: "snare", sticking: "L", accent: true, velocity: 1.0 },
      { step: 13, instrument: "floor_tom", sticking: "R", accent: false, velocity: 0.75 },
      { step: 14, instrument: "ride", sticking: "R", accent: false, velocity: 0.7 },
      { step: 14, instrument: "kick", sticking: "K", accent: false, velocity: 0.85 },
      { step: 15, instrument: "tom2", sticking: "L", accent: false, velocity: 0.7 },
    ]
  }
];
