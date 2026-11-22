import { StringExerciseData } from '@/types/strings';

export const STRINGS_INITIAL_EXERCISES: StringExerciseData[] = [
  {
    id: "str_bass_slap_funk",
    slug: "bajo-slap-pop-funk",
    title: "Slap & Pop Funk Foundation",
    instrument: "bass_4",
    tuning: "E A D G",
    category: "Slap & Pop",
    difficulty: "Intermedio",
    bpmDefault: 95,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Técnica fundamental del bajo funk moderno estilo Flea / Marcus Miller: golpe de pulgar (Slap), tirón de índice (Pop), octavas percusivas y notas fantasma en semicorcheas.",
    tabData: [
      { step: 0, string: 4, fret: 0, finger: "T", technique: "slap", velocity: 1.0 },
      { step: 1, string: 4, fret: 0, finger: "T", technique: "ghost", velocity: 0.5 },
      { step: 2, string: 2, fret: 2, finger: "1", technique: "pop", velocity: 0.95 },
      { step: 3, string: 3, fret: 0, finger: "T", technique: "ghost", velocity: 0.4 },
      { step: 4, string: 4, fret: 0, finger: "T", technique: "slap", velocity: 0.9 },
      { step: 6, string: 4, fret: 3, finger: "1", technique: "slap", velocity: 0.85 },
      { step: 7, string: 4, fret: 4, finger: "2", technique: "hammer", velocity: 0.9 },
      { step: 8, string: 2, fret: 6, finger: "4", technique: "pop", velocity: 1.0 },
      { step: 9, string: 4, fret: 0, finger: "T", technique: "ghost", velocity: 0.45 },
      { step: 10, string: 3, fret: 0, finger: "T", technique: "slap", velocity: 0.9 },
      { step: 12, string: 1, fret: 2, finger: "1", technique: "pop", velocity: 0.95 },
      { step: 13, string: 2, fret: 5, finger: "1", technique: "normal", velocity: 0.7 },
      { step: 14, string: 2, fret: 7, finger: "3", technique: "slide", velocity: 0.9 },
    ]
  },
  {
    id: "str_bass_walking_jazz",
    slug: "walking-bass-jazz-standard",
    title: "Walking Bass Jazz Standard en C",
    instrument: "bass_4",
    tuning: "E A D G",
    category: "Walking Bass",
    difficulty: "Intermedio",
    bpmDefault: 110,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Construcción clásica de línea caminante en 4 cuartos sobre Cmaj7 - A7: tónica, tercera mayor, quinta justa y aproximación cromática con pulsos continuos y ataque cálido.",
    tabData: [
      // Beat 1: Tónica C
      { step: 0, string: 3, fret: 3, finger: "2", technique: "normal", velocity: 0.95 },
      { step: 2, string: 3, fret: 3, finger: "2", technique: "ghost", velocity: 0.4 },
      // Beat 2: Tercera E
      { step: 4, string: 2, fret: 2, finger: "1", technique: "normal", velocity: 0.85 },
      // Beat 3: Quinta G
      { step: 8, string: 1, fret: 0, finger: "0", technique: "normal", velocity: 0.9 },
      // Beat 4: Séptima B
      { step: 12, string: 1, fret: 4, finger: "4", technique: "normal", velocity: 0.85 },
      // Aproximación cromática a la siguiente tónica
      { step: 14, string: 1, fret: 3, finger: "3", technique: "slide", velocity: 0.8 },
    ]
  },
  {
    id: "str_bass_pentatonic_groove",
    slug: "bajo-pentatonico-funk-rock",
    title: "Groove Pentatónico Menor Funk-Rock",
    instrument: "bass_4",
    tuning: "E A D G",
    category: "Escalas & Arpegios",
    difficulty: "Básico",
    bpmDefault: 100,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Patrón de bajo con articulación rítmica ajustada en D menor pentatónico. Desarrolla precisión en cambios de cuerda y sincronización con el bombo.",
    tabData: [
      { step: 0, string: 3, fret: 5, finger: "1", technique: "normal", velocity: 1.0 },
      { step: 3, string: 3, fret: 8, finger: "4", technique: "normal", velocity: 0.8 },
      { step: 4, string: 2, fret: 5, finger: "1", technique: "normal", velocity: 0.9 },
      { step: 6, string: 2, fret: 6, finger: "2", technique: "hammer", velocity: 0.85 },
      { step: 7, string: 2, fret: 7, finger: "3", technique: "slide", velocity: 0.95 },
      { step: 8, string: 1, fret: 5, finger: "1", technique: "normal", velocity: 0.85 },
      { step: 10, string: 1, fret: 7, finger: "3", technique: "vibrato", velocity: 1.0 },
      { step: 12, string: 1, fret: 5, finger: "1", technique: "normal", velocity: 0.8 },
      { step: 14, string: 2, fret: 7, finger: "3", technique: "normal", velocity: 0.85 },
    ]
  },
  {
    id: "str_guitar_neo_soul",
    slug: "guitarra-neo-soul-hendrix",
    title: "Riff Neo-Soul / Hendrix Adornments",
    instrument: "guitar_6",
    tuning: "E A D G B E",
    category: "Licks & Riffs",
    difficulty: "Intermedio",
    bpmDefault: 85,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Estilo Jimi Hendrix / Mateus Asato: combinación de notas graves en tiempo fuerte con dobles cuerdas (double stops), hammer-ons y slides que decoran acordes mayores y menores.",
    tabData: [
      // Acorde base bajo en E
      { step: 0, string: 6, fret: 0, finger: "0", technique: "normal", velocity: 0.9 },
      // Doble cuerda en G y B
      { step: 2, string: 3, fret: 1, finger: "1", technique: "normal", velocity: 0.8 },
      { step: 2, string: 2, fret: 0, finger: "0", technique: "normal", velocity: 0.8 },
      // Hammer on
      { step: 4, string: 3, fret: 2, finger: "2", technique: "hammer", velocity: 0.95 },
      // Pull off / slide
      { step: 6, string: 3, fret: 1, finger: "1", technique: "slide", velocity: 0.75 },
      // Bajo en B
      { step: 8, string: 5, fret: 2, finger: "1", technique: "normal", velocity: 0.85 },
      // Hammer on a C#
      { step: 10, string: 5, fret: 4, finger: "3", technique: "hammer", velocity: 0.9 },
      // Nota de paso E
      { step: 12, string: 4, fret: 2, finger: "1", technique: "normal", velocity: 0.8 },
      // Slide hacia G# agudo
      { step: 14, string: 4, fret: 6, finger: "3", technique: "slide", velocity: 0.9 },
    ]
  },
  {
    id: "str_guitar_fingerpicking",
    slug: "guitarra-fingerpicking-folk",
    title: "Fingerpicking Acústico Folclórico",
    instrument: "guitar_6",
    tuning: "E A D G B E",
    category: "Fingerpicking",
    difficulty: "Básico",
    bpmDefault: 92,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Patrón clásico de Travis Picking en C mayor: el pulgar alterna de forma independiente los bajos entre las cuerdas 5 y 4 mientras los dedos índice y medio tejen la melodía aguda.",
    tabData: [
      { step: 0, string: 5, fret: 3, finger: "3", technique: "normal", velocity: 0.95 },
      { step: 2, string: 1, fret: 0, finger: "0", technique: "normal", velocity: 0.75 },
      { step: 4, string: 4, fret: 2, finger: "2", technique: "normal", velocity: 0.9 },
      { step: 6, string: 2, fret: 1, finger: "1", technique: "normal", velocity: 0.8 },
      { step: 8, string: 5, fret: 3, finger: "3", technique: "normal", velocity: 0.95 },
      { step: 10, string: 3, fret: 0, finger: "0", technique: "normal", velocity: 0.75 },
      { step: 12, string: 4, fret: 2, finger: "2", technique: "normal", velocity: 0.9 },
      { step: 14, string: 1, fret: 0, finger: "0", technique: "normal", velocity: 0.8 },
    ]
  },
  {
    id: "str_guitar_blues_lead",
    slug: "guitarra-blues-pentatonico-licks",
    title: "Lick Solista Blues Pentatónico con Slides",
    instrument: "guitar_6",
    tuning: "E A D G B E",
    category: "Licks & Riffs",
    difficulty: "Avanzado",
    bpmDefault: 105,
    timeSignature: "4/4",
    totalSteps: 16,
    description: "Fraseo expresivo en la caja pentatónica de La menor con nota de blues (Eb), ligaduras descendentes rápidas y vibrato amplio para control de expresividad y dinámica.",
    tabData: [
      { step: 0, string: 3, fret: 2, finger: "1", technique: "normal", velocity: 0.85 },
      { step: 2, string: 2, fret: 1, finger: "1", technique: "normal", velocity: 0.8 },
      { step: 4, string: 2, fret: 3, finger: "3", technique: "hammer", velocity: 0.95 },
      { step: 6, string: 2, fret: 4, finger: "2", technique: "slide", velocity: 0.85 },
      { step: 7, string: 2, fret: 5, finger: "3", technique: "slide", velocity: 0.9 },
      { step: 8, string: 1, fret: 3, finger: "1", technique: "normal", velocity: 0.85 },
      { step: 10, string: 1, fret: 5, finger: "3", technique: "vibrato", velocity: 1.0 },
      { step: 12, string: 1, fret: 3, finger: "1", technique: "pull", velocity: 0.8 },
      { step: 14, string: 2, fret: 5, finger: "3", technique: "vibrato", velocity: 0.9 },
    ]
  }
];
