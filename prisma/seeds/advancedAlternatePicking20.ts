// ============================================================================
// 20 ESTUDIOS AVANZADOS DE PÚA ALTERNADA (AP-01 a AP-20) ESTILO GUITAR AEROBICS
// 32 Compases por Estudio • Cifrado por Compás (chordSymbol) • Dedos (1-4)
// Púa Alterna Estricta (down: Π / up: V) • Carpeta: "Púa Alternada"
// ============================================================================

import { StringExerciseData, StringMeasureData, StringTabNote } from '../../types/strings';
import { PrismaClient } from '@prisma/client';

export interface ExerciseBlueprint {
  code: string;
  slug: string;
  title: string;
  bpm: number;
  description: string;
  category: string;
  difficulty: 'Avanzado';
  progression: { chord: string; measures: number }[];
  generateNotes: (measureIndex: number, chord: string, globalStepOffset: number) => StringTabNote[];
}

/**
 * Helper para generar 16 semicorcheas con púa alternada estricta (down / up)
 */
function createMeasure16Notes(
  measureIndex: number,
  globalStepOffset: number,
  noteDefs: { string: number; fret: number; finger: string; pick?: 'down' | 'up' }[]
): StringTabNote[] {
  return noteDefs.map((def, stepInMeasure) => {
    const isEven = stepInMeasure % 2 === 0;
    const pickDirection = def.pick || (isEven ? 'down' : 'up');
    return {
      step: globalStepOffset + stepInMeasure,
      string: def.string,
      fret: def.fret,
      finger: def.finger,
      pickDirection,
      duration: '16n',
      velocity: isEven ? 0.95 : 0.85,
      technique: 'normal',
    };
  });
}

// ----------------------------------------------------------------------------
// DEFINICIÓN DE LOS 20 BLUEPRINTS MUSICALES DE 32 COMPASES
// ----------------------------------------------------------------------------

export const BLUEPRINTS: ExerciseBlueprint[] = [
  // AP-01 • Workout Blues en Sol (112 BPM)
  // G7 (8c) -> C7 (4c) -> G7 (4c) -> D7 (2c) -> C7 (2c) -> G7 (4c) -> D7 (4c) -> G7 (4c) = 32 compases
  {
    code: 'AP-01',
    slug: 'ap-01-workout-blues-sol-outside-inside',
    title: 'AP-01 • Workout Blues en Sol (Outside/Inside Picking) — 32 Compases',
    bpm: 112,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Estudio de resistencia en 32 compases sobre blues en Sol (G7, C7, D7). Motivo mixolidio con aproximaciones cromáticas combinando outside picking (cambio cuerda hacia afuera) e inside picking estricto.',
    progression: [
      { chord: 'G7', measures: 8 },
      { chord: 'C7', measures: 4 },
      { chord: 'G7', measures: 4 },
      { chord: 'D7', measures: 2 },
      { chord: 'C7', measures: 2 },
      { chord: 'G7', measures: 4 },
      { chord: 'D7', measures: 4 },
      { chord: 'G7', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      // Fraseo mixolidio según acorde
      const baseFret = chord === 'C7' ? 8 : chord === 'D7' ? 10 : 3;
      return createMeasure16Notes(mIdx, offset, [
        { string: 6, fret: baseFret, finger: '1' },
        { string: 6, fret: baseFret + 3, finger: '4' },
        { string: 5, fret: baseFret + 1, finger: '2' },
        { string: 5, fret: baseFret + 2, finger: '3' },
        { string: 4, fret: baseFret, finger: '1' },
        { string: 4, fret: baseFret + 2, finger: '3' },
        { string: 3, fret: baseFret, finger: '1' },
        { string: 3, fret: baseFret + 2, finger: '3' },
        { string: 2, fret: baseFret + 1, finger: '2' },
        { string: 2, fret: baseFret + 3, finger: '4' },
        { string: 1, fret: baseFret, finger: '1' },
        { string: 1, fret: baseFret + 3, finger: '4' },
        { string: 2, fret: baseFret + 3, finger: '4' },
        { string: 3, fret: baseFret + 2, finger: '3' },
        { string: 4, fret: baseFret + 2, finger: '3' },
        { string: 5, fret: baseFret + 2, finger: '3' },
      ]);
    },
  },

  // AP-02 • Permutación 1-2-4-3 Sobre Círculo I-VI-II-V (116 BPM)
  // Cmaj7 -> Am7 -> Dm7 -> G7 en 4 tonalidades (C, F, Bb, Eb) = 8x4 = 32 compases
  {
    code: 'AP-02',
    slug: 'ap-02-permutacion-1-2-4-3-circulo-armonico',
    title: 'AP-02 • Workout Permutación 1-2-4-3 Sobre Círculo I–VI–II–V — 32 Compases',
    bpm: 116,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Permutaciones digitales asimétricas 1-2-4-3 cruzando pares de cuerdas a través de progresiones I-VI-II-V en 4 tonalidades (Do, Fa, Si♭ y Mi♭). Púa alterna implacable.',
    progression: [
      { chord: 'Cmaj7', measures: 2 }, { chord: 'Am7', measures: 2 }, { chord: 'Dm7', measures: 2 }, { chord: 'G7', measures: 2 },
      { chord: 'Fmaj7', measures: 2 }, { chord: 'Dm7', measures: 2 }, { chord: 'Gm7', measures: 2 }, { chord: 'C7', measures: 2 },
      { chord: 'Bbmaj7', measures: 2 }, { chord: 'Gm7', measures: 2 }, { chord: 'Cm7', measures: 2 }, { chord: 'F7', measures: 2 },
      { chord: 'Ebmaj7', measures: 2 }, { chord: 'Cm7', measures: 2 }, { chord: 'Fm7', measures: 2 }, { chord: 'Bb7', measures: 2 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const fretMap: Record<string, number> = {
        Cmaj7: 8, Am7: 5, Dm7: 10, G7: 3,
        Fmaj7: 1, Gm7: 3, C7: 8,
        Bbmaj7: 6, Cm7: 8, F7: 1,
        Ebmaj7: 11, Fm7: 1, Bb7: 6,
      };
      const rootFret = fretMap[chord] || 8;
      return createMeasure16Notes(mIdx, offset, [
        { string: 3, fret: rootFret, finger: '1' },
        { string: 3, fret: rootFret + 2, finger: '2' },
        { string: 3, fret: rootFret + 5, finger: '4' },
        { string: 3, fret: rootFret + 3, finger: '3' },
        { string: 2, fret: rootFret, finger: '1' },
        { string: 2, fret: rootFret + 1, finger: '2' },
        { string: 2, fret: rootFret + 4, finger: '4' },
        { string: 2, fret: rootFret + 3, finger: '3' },
        { string: 1, fret: rootFret, finger: '1' },
        { string: 1, fret: rootFret + 2, finger: '2' },
        { string: 1, fret: rootFret + 5, finger: '4' },
        { string: 1, fret: rootFret + 3, finger: '3' },
        { string: 2, fret: rootFret + 4, finger: '4' },
        { string: 2, fret: rootFret + 3, finger: '3' },
        { string: 3, fret: rootFret + 5, finger: '4' },
        { string: 3, fret: rootFret + 2, finger: '2' },
      ]);
    },
  },

  // AP-03 • Secuencia Paul Gilbert (Grupos de 6) en Am / Dm / E7 (120 BPM)
  // Am (4c) -> Dm (4c) -> G (4c) -> C (4c) -> F (4c) -> Bdim (4c) -> E7 (4c) -> Am (4c) = 32 compases
  {
    code: 'AP-03',
    slug: 'ap-03-secuencia-paul-gilbert-grupos-de-6',
    title: 'AP-03 • Workout Secuencia Paul Gilbert (Grupos de 6) en Am / Dm / E7 — 32 Compases',
    bpm: 120,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'El clásico patrón en bucle de 6 notas de Paul Gilbert repetido a gran velocidad en dos cuerdas adyacentes, modulando por toda la progresión menor diatónica durante 32 compases.',
    progression: [
      { chord: 'Am', measures: 4 },
      { chord: 'Dm', measures: 4 },
      { chord: 'G', measures: 4 },
      { chord: 'C', measures: 4 },
      { chord: 'F', measures: 4 },
      { chord: 'Bdim', measures: 4 },
      { chord: 'E7', measures: 4 },
      { chord: 'Am', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const posMap: Record<string, { f1: number; f2: number; f3: number; f4: number; f5: number; f6: number }> = {
        Am: { f1: 5, f2: 7, f3: 8, f4: 5, f5: 7, f6: 8 },
        Dm: { f1: 10, f2: 12, f3: 13, f4: 10, f5: 12, f6: 13 },
        G: { f1: 3, f2: 5, f3: 7, f4: 3, f5: 5, f6: 7 },
        C: { f1: 8, f2: 10, f3: 12, f4: 8, f5: 10, f6: 12 },
        F: { f1: 1, f2: 3, f3: 5, f4: 1, f5: 3, f6: 5 },
        Bdim: { f1: 7, f2: 8, f3: 10, f4: 7, f5: 8, f6: 10 },
        E7: { f1: 7, f2: 9, f3: 10, f4: 7, f5: 9, f6: 10 },
      };
      const p = posMap[chord] || posMap.Am;
      return createMeasure16Notes(mIdx, offset, [
        { string: 2, fret: p.f1, finger: '1' },
        { string: 2, fret: p.f2, finger: '2' },
        { string: 2, fret: p.f3, finger: '4' },
        { string: 1, fret: p.f4, finger: '1' },
        { string: 2, fret: p.f3, finger: '4' },
        { string: 2, fret: p.f2, finger: '2' },
        { string: 2, fret: p.f1, finger: '1' },
        { string: 2, fret: p.f2, finger: '2' },
        { string: 2, fret: p.f3, finger: '4' },
        { string: 1, fret: p.f4, finger: '1' },
        { string: 2, fret: p.f3, finger: '4' },
        { string: 2, fret: p.f2, finger: '2' },
        { string: 2, fret: p.f1, finger: '1' },
        { string: 2, fret: p.f2, finger: '2' },
        { string: 2, fret: p.f3, finger: '4' },
        { string: 1, fret: p.f4, finger: '1' },
      ]);
    },
  },

  // AP-04 • Tres Notas por Cuerda (3NPS) Ascendente por Cuartas (124 BPM)
  // Em7 -> Am7 -> Dm7 -> G7 -> Cmaj7 -> Fmaj7 -> Bm7b5 -> E7 (4 compases c/u) = 32 compases
  {
    code: 'AP-04',
    slug: 'ap-04-tres-notas-por-cuerda-3nps-ascendente',
    title: 'AP-04 • Workout Tres Notas por Cuerda (3NPS) Ascendente por Cuartas — 32 Compases',
    bpm: 124,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Subida biomecánica 3NPS desde 6ª hasta 1ª cuerda sobre ciclo de cuartas (Em7, Am7, Dm7, G7, Cmaj7, Fmaj7, Bm7b5, E7). Golpe abajo en tiempos impares para sincronizar cruzadas.',
    progression: [
      { chord: 'Em7', measures: 4 },
      { chord: 'Am7', measures: 4 },
      { chord: 'Dm7', measures: 4 },
      { chord: 'G7', measures: 4 },
      { chord: 'Cmaj7', measures: 4 },
      { chord: 'Fmaj7', measures: 4 },
      { chord: 'Bm7b5', measures: 4 },
      { chord: 'E7', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const startFret = chord === 'Am7' ? 5 : chord === 'Dm7' ? 10 : chord === 'G7' ? 3 : 7;
      return createMeasure16Notes(mIdx, offset, [
        { string: 6, fret: startFret, finger: '1' },
        { string: 6, fret: startFret + 2, finger: '2' },
        { string: 6, fret: startFret + 3, finger: '3' },
        { string: 5, fret: startFret, finger: '1' },
        { string: 5, fret: startFret + 2, finger: '2' },
        { string: 5, fret: startFret + 3, finger: '3' },
        { string: 4, fret: startFret, finger: '1' },
        { string: 4, fret: startFret + 2, finger: '2' },
        { string: 4, fret: startFret + 4, finger: '4' },
        { string: 3, fret: startFret, finger: '1' },
        { string: 3, fret: startFret + 2, finger: '2' },
        { string: 3, fret: startFret + 4, finger: '4' },
        { string: 2, fret: startFret + 1, finger: '2' },
        { string: 2, fret: startFret + 3, finger: '3' },
        { string: 1, fret: startFret, finger: '1' },
        { string: 1, fret: startFret + 2, finger: '2' },
      ]);
    },
  },

  // AP-05 • 3NPS Descendente con Upstroke Inicial (V-Π-V-Π) (126 BPM)
  // Dm7 -> G7 -> Cmaj7 -> Am7 (8 compases c/u) = 32 compases
  {
    code: 'AP-05',
    slug: 'ap-05-3nps-descendente-upstroke-inicial',
    title: 'AP-05 • Workout 3NPS Descendente con Upstroke Inicial (V-Π-V-Π) — 32 Compases',
    bpm: 126,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Inversión de ataque de púa: cada compás inicia con golpe hacia arriba (V) en la 1ª cuerda y desciende fluidamente hasta la 6ª cuerda en el modo Re Dórico. Elimina la debilidad del upstroke.',
    progression: [
      { chord: 'Dm7', measures: 8 },
      { chord: 'G7', measures: 8 },
      { chord: 'Cmaj7', measures: 8 },
      { chord: 'Am7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'G7' ? 10 : chord === 'Cmaj7' ? 8 : chord === 'Am7' ? 5 : 10;
      // Invertir púa: inicia en up
      const notes = [
        { string: 1, fret: pos + 3, finger: '4', pick: 'up' as const },
        { string: 1, fret: pos + 1, finger: '2', pick: 'down' as const },
        { string: 1, fret: pos, finger: '1', pick: 'up' as const },
        { string: 2, fret: pos + 3, finger: '4', pick: 'down' as const },
        { string: 2, fret: pos + 1, finger: '2', pick: 'up' as const },
        { string: 2, fret: pos, finger: '1', pick: 'down' as const },
        { string: 3, fret: pos + 2, finger: '3', pick: 'up' as const },
        { string: 3, fret: pos, finger: '1', pick: 'down' as const },
        { string: 3, fret: pos - 1, finger: '1', pick: 'up' as const },
        { string: 4, fret: pos + 2, finger: '3', pick: 'down' as const },
        { string: 4, fret: pos, finger: '1', pick: 'up' as const },
        { string: 4, fret: pos - 1, finger: '1', pick: 'down' as const },
        { string: 5, fret: pos + 2, finger: '3', pick: 'up' as const },
        { string: 5, fret: pos, finger: '1', pick: 'down' as const },
        { string: 6, fret: pos + 3, finger: '4', pick: 'up' as const },
        { string: 6, fret: pos, finger: '1', pick: 'down' as const },
      ];
      return notes.map((def, stepInMeasure) => ({
        step: offset + stepInMeasure,
        string: def.string,
        fret: def.fret,
        finger: def.finger,
        pickDirection: def.pick,
        duration: '16n',
        velocity: 0.9,
        technique: 'normal',
      }));
    },
  },

  // AP-06 • Pedal Tone Neoclásico en La Menor Armónica (130 BPM)
  // Am (4c) -> Dm (4c) -> E7 (4c) -> Am (4c) -> F (4c) -> Bdim (4c) -> E7 (4c) -> Am (4c) = 32 compases
  {
    code: 'AP-06',
    slug: 'ap-06-pedal-tone-neoclasico-menor-armonica',
    title: 'AP-06 • Workout Pedal Tone Neoclásico en La Menor Armónica — 32 Compases',
    bpm: 130,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Estilo Yngwie Malmsteen / Bach: nota pedal aguda fija en la 1ª cuerda alternando con melodías descendentes en la 2ª cuerda con la sensible sol# (#7) sobre la progresión menor armónica.',
    progression: [
      { chord: 'Am', measures: 4 },
      { chord: 'Dm', measures: 4 },
      { chord: 'E7', measures: 4 },
      { chord: 'Am', measures: 4 },
      { chord: 'F', measures: 4 },
      { chord: 'Bdim', measures: 4 },
      { chord: 'E7', measures: 4 },
      { chord: 'Am', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pedalFret = 12; // Mi agudo en 1ª cuerda
      const melFrets = chord === 'E7' ? [13, 12, 10, 9] : chord === 'Dm' ? [13, 12, 10, 8] : [13, 12, 10, 8];
      return createMeasure16Notes(mIdx, offset, [
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 2, fret: melFrets[0], finger: '4' },
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 2, fret: melFrets[1], finger: '3' },
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 2, fret: melFrets[2], finger: '1' },
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 2, fret: melFrets[3], finger: '1' },
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 2, fret: melFrets[2], finger: '1' },
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 2, fret: melFrets[1], finger: '3' },
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 2, fret: melFrets[0], finger: '4' },
        { string: 1, fret: pedalFret, finger: '2' },
        { string: 1, fret: pedalFret + 5, finger: '4' },
      ]);
    },
  },

  // AP-07 • String Skipping de 1 Cuerda Sobre Arpegios Diatónicos (132 BPM)
  // Gmaj7 (8c) -> Em7 (8c) -> Am7 (8c) -> D7 (8c) = 32 compases
  {
    code: 'AP-07',
    slug: 'ap-07-string-skipping-arpegios-diatonicos',
    title: 'AP-07 • Workout String Skipping de 1 Cuerda Sobre Arpegios Diatónicos — 32 Compases',
    bpm: 132,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Saltos de cuerda salteando una cuerda intermedia (6ª->4ª->5ª->3ª y 4ª->2ª->3ª->1ª) en arpegios cuatríadas diatónicos de Sol Mayor (Gmaj7, Em7, Am7, D7). Resistencia angular de muñeca.',
    progression: [
      { chord: 'Gmaj7', measures: 8 },
      { chord: 'Em7', measures: 8 },
      { chord: 'Am7', measures: 8 },
      { chord: 'D7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const base = chord === 'Em7' ? 7 : chord === 'Am7' ? 5 : chord === 'D7' ? 10 : 3;
      return createMeasure16Notes(mIdx, offset, [
        { string: 6, fret: base, finger: '1' },
        { string: 4, fret: base + 2, finger: '3' },
        { string: 5, fret: base + 2, finger: '2' },
        { string: 3, fret: base + 1, finger: '1' },
        { string: 4, fret: base + 2, finger: '3' },
        { string: 2, fret: base + 2, finger: '2' },
        { string: 3, fret: base + 1, finger: '1' },
        { string: 1, fret: base + 2, finger: '3' },
        { string: 2, fret: base + 2, finger: '2' },
        { string: 4, fret: base + 2, finger: '3' },
        { string: 3, fret: base + 1, finger: '1' },
        { string: 5, fret: base + 2, finger: '2' },
        { string: 4, fret: base + 2, finger: '3' },
        { string: 6, fret: base + 3, finger: '4' },
        { string: 5, fret: base + 2, finger: '2' },
        { string: 6, fret: base, finger: '1' },
      ]);
    },
  },

  // AP-08 • Crosspicking Moderno Sobre Acordes Add9 / Sus2 (135 BPM)
  // Cadd9 (8c) -> G/B (8c) -> Am7 (8c) -> Fadd9 (8c) = 32 compases
  {
    code: 'AP-08',
    slug: 'ap-08-crosspicking-moderno-add9-sus2',
    title: 'AP-08 • Workout Crosspicking Moderno Sobre Acordes Add9 / Sus2 — 32 Compases',
    bpm: 135,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Técnica de bluegrass/fusion crosspicking en tres cuerdas continuas alternando púa hacia abajo y hacia arriba de manera estricta sobre acordes coloridos Cadd9, G/B, Am7 y Fadd9.',
    progression: [
      { chord: 'Cadd9', measures: 8 },
      { chord: 'G/B', measures: 8 },
      { chord: 'Am7', measures: 8 },
      { chord: 'Fadd9', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const f1 = chord === 'G/B' ? 2 : chord === 'Am7' ? 0 : chord === 'Fadd9' ? 3 : 3;
      return createMeasure16Notes(mIdx, offset, [
        { string: 5, fret: f1, finger: '2' },
        { string: 4, fret: 2, finger: '1' },
        { string: 3, fret: 0, finger: '0' },
        { string: 2, fret: 3, finger: '3' },
        { string: 3, fret: 0, finger: '0' },
        { string: 4, fret: 2, finger: '1' },
        { string: 5, fret: f1, finger: '2' },
        { string: 3, fret: 0, finger: '0' },
        { string: 2, fret: 3, finger: '3' },
        { string: 1, fret: 0, finger: '0' },
        { string: 2, fret: 3, finger: '3' },
        { string: 3, fret: 0, finger: '0' },
        { string: 4, fret: 2, finger: '1' },
        { string: 3, fret: 0, finger: '0' },
        { string: 2, fret: 3, finger: '3' },
        { string: 3, fret: 0, finger: '0' },
      ]);
    },
  },

  // AP-09 • Sextillos en Posición Extendida 1-2-4 (138 BPM)
  // F#m (8c) -> D (8c) -> A (8c) -> E (8c) = 32 compases
  {
    code: 'AP-09',
    slug: 'ap-09-sextillos-posicion-extendida-1-2-4',
    title: 'AP-09 • Workout Sextillos (Tresillos de Semicorchea) en Posición Extendida 1-2-4 — 32 Compases',
    bpm: 138,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Extensiones de 4 trastes con digitación 1-2-4 en progresión de rock progresivo (Fa# menor, Re, La, Mi). 16 semicorcheas y sextillos con cambios de acento y alta demanda muscular.',
    progression: [
      { chord: 'F#m', measures: 8 },
      { chord: 'D', measures: 8 },
      { chord: 'A', measures: 8 },
      { chord: 'E', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'D' ? 5 : chord === 'A' ? 7 : chord === 'E' ? 2 : 9;
      return createMeasure16Notes(mIdx, offset, [
        { string: 4, fret: pos, finger: '1' },
        { string: 4, fret: pos + 2, finger: '2' },
        { string: 4, fret: pos + 4, finger: '4' },
        { string: 3, fret: pos, finger: '1' },
        { string: 3, fret: pos + 2, finger: '2' },
        { string: 3, fret: pos + 4, finger: '4' },
        { string: 2, fret: pos, finger: '1' },
        { string: 2, fret: pos + 2, finger: '2' },
        { string: 2, fret: pos + 5, finger: '4' },
        { string: 1, fret: pos, finger: '1' },
        { string: 1, fret: pos + 2, finger: '2' },
        { string: 1, fret: pos + 5, finger: '4' },
        { string: 1, fret: pos + 2, finger: '2' },
        { string: 2, fret: pos + 5, finger: '4' },
        { string: 3, fret: pos + 4, finger: '4' },
        { string: 4, fret: pos + 4, finger: '4' },
      ]);
    },
  },

  // AP-10 • Arpegios Maj7 y m7 en 4 Cuerdas con Púa Alterna Pura (140 BPM)
  // Fmaj7 (8c) -> Em7 (8c) -> Dm7 (8c) -> Cmaj7 (8c) = 32 compases
  {
    code: 'AP-10',
    slug: 'ap-10-arpegios-maj7-m7-4-cuerdas-pua-pura',
    title: 'AP-10 • Workout Arpegios Maj7 y m7 en 4 Cuerdas con Púa Alterna Pura — 32 Compases',
    bpm: 140,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Prohibido el barrido (sweep): todos los arpegios de 4 cuerdas se ejecutan con púa alterna estricta (abajo-arriba-abajo-arriba), desarrollando sincronización milimétrica mano izquierda y derecha.',
    progression: [
      { chord: 'Fmaj7', measures: 8 },
      { chord: 'Em7', measures: 8 },
      { chord: 'Dm7', measures: 8 },
      { chord: 'Cmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'Em7' ? 7 : chord === 'Dm7' ? 5 : chord === 'Cmaj7' ? 3 : 8;
      return createMeasure16Notes(mIdx, offset, [
        { string: 4, fret: pos, finger: '2' },
        { string: 3, fret: pos - 1, finger: '1' },
        { string: 2, fret: pos - 2, finger: '1' },
        { string: 1, fret: pos - 3, finger: '1' },
        { string: 1, fret: pos + 1, finger: '4' },
        { string: 1, fret: pos - 3, finger: '1' },
        { string: 2, fret: pos - 2, finger: '1' },
        { string: 3, fret: pos - 1, finger: '1' },
        { string: 4, fret: pos, finger: '2' },
        { string: 3, fret: pos + 1, finger: '3' },
        { string: 2, fret: pos, finger: '2' },
        { string: 1, fret: pos, finger: '2' },
        { string: 2, fret: pos, finger: '2' },
        { string: 3, fret: pos + 1, finger: '3' },
        { string: 4, fret: pos, finger: '2' },
        { string: 5, fret: pos + 2, finger: '4' },
      ]);
    },
  },

  // AP-11 • Inside Picking de Alta Resistencia en Progresión Frigia (142 BPM)
  // Em (8c) -> Fmaj7 (8c) -> G6 (8c) -> Fmaj7 (8c) = 32 compases
  {
    code: 'AP-11',
    slug: 'ap-11-inside-picking-resistencia-frigia',
    title: 'AP-11 • Workout Inside Picking de Alta Resistencia en Progresión Frigia — 32 Compases',
    bpm: 142,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Cambios de cuerda ejecutados exclusivamente entre el espacio interno de dos cuerdas adyacentes (upstroke en cuerda inferior, downstroke en superior) en el modo Mi Frigio oscuro y tenso.',
    progression: [
      { chord: 'Em', measures: 8 },
      { chord: 'Fmaj7', measures: 8 },
      { chord: 'G6', measures: 8 },
      { chord: 'Fmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'Fmaj7' ? 8 : chord === 'G6' ? 10 : 7;
      return createMeasure16Notes(mIdx, offset, [
        { string: 3, fret: pos, finger: '1', pick: 'up' as const },
        { string: 2, fret: pos + 1, finger: '2', pick: 'down' as const },
        { string: 3, fret: pos + 2, finger: '3', pick: 'up' as const },
        { string: 2, fret: pos + 3, finger: '4', pick: 'down' as const },
        { string: 3, fret: pos, finger: '1', pick: 'up' as const },
        { string: 2, fret: pos + 1, finger: '2', pick: 'down' as const },
        { string: 3, fret: pos + 2, finger: '3', pick: 'up' as const },
        { string: 2, fret: pos + 3, finger: '4', pick: 'down' as const },
        { string: 2, fret: pos + 1, finger: '2', pick: 'up' as const },
        { string: 1, fret: pos, finger: '1', pick: 'down' as const },
        { string: 2, fret: pos + 3, finger: '4', pick: 'up' as const },
        { string: 1, fret: pos + 2, finger: '3', pick: 'down' as const },
        { string: 2, fret: pos + 1, finger: '2', pick: 'up' as const },
        { string: 1, fret: pos, finger: '1', pick: 'down' as const },
        { string: 2, fret: pos + 3, finger: '4', pick: 'up' as const },
        { string: 1, fret: pos + 3, finger: '4', pick: 'down' as const },
      ]);
    },
  },

  // AP-12 • Desplazamiento Diagonal de Octavas en Sextillos (144 BPM)
  // Gm7 (8c) -> C7 (8c) -> Fmaj7 (8c) -> Bbmaj7 (8c) = 32 compases
  {
    code: 'AP-12',
    slug: 'ap-12-desplazamiento-diagonal-octavas-sextillos',
    title: 'AP-12 • Workout Desplazamiento Diagonal de Octavas en Sextillos — 32 Compases',
    bpm: 144,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Subida y bajada por todo el mástil (trastes 3 al 17) uniendo octavas diagonales en Re menor / Fa mayor. Movimiento de brazo y muñeca perfectamente calibrado.',
    progression: [
      { chord: 'Gm7', measures: 8 },
      { chord: 'C7', measures: 8 },
      { chord: 'Fmaj7', measures: 8 },
      { chord: 'Bbmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const shift = (mIdx % 4) * 2;
      return createMeasure16Notes(mIdx, offset, [
        { string: 6, fret: 3 + shift, finger: '1' },
        { string: 6, fret: 5 + shift, finger: '3' },
        { string: 6, fret: 6 + shift, finger: '4' },
        { string: 5, fret: 3 + shift, finger: '1' },
        { string: 5, fret: 5 + shift, finger: '3' },
        { string: 4, fret: 5 + shift, finger: '2' },
        { string: 4, fret: 7 + shift, finger: '4' },
        { string: 3, fret: 5 + shift, finger: '1' },
        { string: 3, fret: 7 + shift, finger: '3' },
        { string: 2, fret: 6 + shift, finger: '2' },
        { string: 2, fret: 8 + shift, finger: '4' },
        { string: 1, fret: 5 + shift, finger: '1' },
        { string: 1, fret: 6 + shift, finger: '2' },
        { string: 1, fret: 8 + shift, finger: '4' },
        { string: 1, fret: 10 + shift, finger: '4' },
        { string: 1, fret: 8 + shift, finger: '2' },
      ]);
    },
  },

  // AP-13 • Secuencia Simétrica Disminuida Sobre Dominantes Alterados (146 BPM)
  // E7b9 (8c) -> A7b9 (8c) -> D7b9 (8c) -> G7b9 (8c) = 32 compases
  {
    code: 'AP-13',
    slug: 'ap-13-secuencia-simetrica-disminuida-dominantes',
    title: 'AP-13 • Workout Secuencia Simétrica Disminuida Sobre Dominantes Alterados — 32 Compases',
    bpm: 146,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Patrones simétricos tono-semitono y arpegios disminuidos cada 3 trastes aplicados sobre acordes 7(b9), generando tensión de jazz-fusion moderna a alta velocidad.',
    progression: [
      { chord: 'E7b9', measures: 8 },
      { chord: 'A7b9', measures: 8 },
      { chord: 'D7b9', measures: 8 },
      { chord: 'G7b9', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const base = chord === 'A7b9' ? 5 : chord === 'D7b9' ? 10 : chord === 'G7b9' ? 3 : 7;
      return createMeasure16Notes(mIdx, offset, [
        { string: 4, fret: base - 1, finger: '1' },
        { string: 4, fret: base + 2, finger: '4' },
        { string: 3, fret: base, finger: '2' },
        { string: 3, fret: base + 3, finger: '4' },
        { string: 2, fret: base + 1, finger: '2' },
        { string: 2, fret: base + 4, finger: '4' },
        { string: 1, fret: base + 2, finger: '2' },
        { string: 1, fret: base + 5, finger: '4' },
        { string: 1, fret: base + 2, finger: '2' },
        { string: 2, fret: base + 4, finger: '4' },
        { string: 2, fret: base + 1, finger: '2' },
        { string: 3, fret: base + 3, finger: '4' },
        { string: 3, fret: base, finger: '2' },
        { string: 4, fret: base + 2, finger: '4' },
        { string: 4, fret: base - 1, finger: '1' },
        { string: 5, fret: base + 1, finger: '3' },
      ]);
    },
  },

  // AP-14 • String Skipping de 2 Cuerdas (Intervalos de Décima) (148 BPM)
  // Bm7 (8c) -> Gmaj7 (8c) -> Dmaj7 (8c) -> A (8c) = 32 compases
  {
    code: 'AP-14',
    slug: 'ap-14-string-skipping-2-cuerdas-decimas',
    title: 'AP-14 • Workout String Skipping de 2 Cuerdas (Intervalos de Décima) — 32 Compases',
    bpm: 148,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Saltos de dos cuerdas completas (5ª cuerda a 2ª cuerda, y 4ª a 1ª) tocando intervalos de décima y sonoridades estilo Eric Johnson / Steve Morse con púa estricta.',
    progression: [
      { chord: 'Bm7', measures: 8 },
      { chord: 'Gmaj7', measures: 8 },
      { chord: 'Dmaj7', measures: 8 },
      { chord: 'A', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const root = chord === 'Gmaj7' ? 10 : chord === 'Dmaj7' ? 5 : chord === 'A' ? 12 : 7;
      return createMeasure16Notes(mIdx, offset, [
        { string: 5, fret: root, finger: '1' },
        { string: 2, fret: root + 2, finger: '3' },
        { string: 5, fret: root + 2, finger: '2' },
        { string: 2, fret: root + 3, finger: '4' },
        { string: 4, fret: root, finger: '1' },
        { string: 1, fret: root + 2, finger: '3' },
        { string: 4, fret: root + 2, finger: '2' },
        { string: 1, fret: root + 3, finger: '4' },
        { string: 4, fret: root, finger: '1' },
        { string: 1, fret: root + 2, finger: '3' },
        { string: 5, fret: root + 2, finger: '2' },
        { string: 2, fret: root + 3, finger: '4' },
        { string: 5, fret: root, finger: '1' },
        { string: 2, fret: root + 2, finger: '3' },
        { string: 5, fret: root - 2, finger: '1' },
        { string: 2, fret: root, finger: '2' },
      ]);
    },
  },

  // AP-15 • Grupos Polimétricos de 5 Notas (Quintillos) (150 BPM)
  // Cm7 (8c) -> Fm7 (8c) -> Bb7 (8c) -> Ebmaj7 (8c) = 32 compases
  {
    code: 'AP-15',
    slug: 'ap-15-polimetria-grupos-de-5-quintillos',
    title: 'AP-15 • Workout Grupos Polimétricos de 5 Notas (Quintillos en Semicorcheas) — 32 Compases',
    bpm: 150,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Desplazamiento métrico fascinante: agrupar patrones de 5 notas en semicorcheas estándar (4/4). Cada repetición de 5 notas invierte el acento de púa (abajo/arriba) exigiendo control total.',
    progression: [
      { chord: 'Cm7', measures: 8 },
      { chord: 'Fm7', measures: 8 },
      { chord: 'Bb7', measures: 8 },
      { chord: 'Ebmaj7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'Fm7' ? 8 : chord === 'Bb7' ? 6 : chord === 'Ebmaj7' ? 11 : 8;
      // 3 grupos de 5 notas + 1 nota resolutiva = 16
      const group5 = [
        { string: 3, fret: pos, finger: '1' },
        { string: 3, fret: pos + 2, finger: '2' },
        { string: 3, fret: pos + 3, finger: '3' },
        { string: 2, fret: pos + 1, finger: '1' },
        { string: 2, fret: pos + 4, finger: '4' },
      ];
      return createMeasure16Notes(mIdx, offset, [
        ...group5,
        ...group5,
        ...group5,
        { string: 1, fret: pos + 3, finger: '3' },
      ]);
    },
  },

  // AP-16 • Menor Melódica 3NPS (Lidio Dominante & Alterada) (152 BPM)
  // Dm9 (8c) -> G13#11 (8c) -> Cmaj9 (8c) -> A7alt (8c) = 32 compases
  {
    code: 'AP-16',
    slug: 'ap-16-menor-melodica-3nps-lidio-dominante',
    title: 'AP-16 • Workout Menor Melódica 3NPS (Lidio Dominante & Alterada) — 32 Compases',
    bpm: 152,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Sonoridad moderna de jazz-fusion usando los modos 4º (Lidio Dominante #11) y 7º (Alterada) de la escala Menor Melódica con patrones 3NPS fluidos a 152 BPM.',
    progression: [
      { chord: 'Dm9', measures: 8 },
      { chord: 'G13#11', measures: 8 },
      { chord: 'Cmaj9', measures: 8 },
      { chord: 'A7alt', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'G13#11' ? 9 : chord === 'Cmaj9' ? 12 : chord === 'A7alt' ? 6 : 10;
      return createMeasure16Notes(mIdx, offset, [
        { string: 4, fret: pos, finger: '1' },
        { string: 4, fret: pos + 2, finger: '3' },
        { string: 4, fret: pos + 4, finger: '4' },
        { string: 3, fret: pos - 1, finger: '1' },
        { string: 3, fret: pos + 1, finger: '2' },
        { string: 3, fret: pos + 3, finger: '4' },
        { string: 2, fret: pos, finger: '1' },
        { string: 2, fret: pos + 2, finger: '3' },
        { string: 2, fret: pos + 4, finger: '4' },
        { string: 1, fret: pos, finger: '1' },
        { string: 1, fret: pos + 2, finger: '3' },
        { string: 1, fret: pos + 3, finger: '4' },
        { string: 1, fret: pos + 2, finger: '3' },
        { string: 2, fret: pos + 4, finger: '4' },
        { string: 3, fret: pos + 3, finger: '4' },
        { string: 4, fret: pos + 4, finger: '4' },
      ]);
    },
  },

  // AP-17 • Arpegios Disminuidos con String Skipping y Upstroke Accent (155 BPM)
  // C#dim7 (8c) -> Dm7 (8c) -> D#dim7 (8c) -> Em7 (8c) = 32 compases
  {
    code: 'AP-17',
    slug: 'ap-17-arpegios-disminuidos-skipping-upstroke',
    title: 'AP-17 • Workout Arpegios Disminuidos con String Skipping y Upstroke Accent — 32 Compases',
    bpm: 155,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Movimiento simétrico en terceras menores que se desplaza 3 trastes adelante con acento de upstroke en la nota aguda. Gran demandante de resistencia física a 155 BPM.',
    progression: [
      { chord: 'C#dim7', measures: 8 },
      { chord: 'Dm7', measures: 8 },
      { chord: 'D#dim7', measures: 8 },
      { chord: 'Em7', measures: 8 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'C#dim7' ? 6 : chord === 'Dm7' ? 7 : chord === 'D#dim7' ? 8 : 9;
      return createMeasure16Notes(mIdx, offset, [
        { string: 5, fret: pos - 2, finger: '1' },
        { string: 3, fret: pos - 1, finger: '2' },
        { string: 5, fret: pos + 1, finger: '4' },
        { string: 3, fret: pos + 2, finger: '3' },
        { string: 4, fret: pos - 1, finger: '1' },
        { string: 2, fret: pos, finger: '2' },
        { string: 4, fret: pos + 2, finger: '4' },
        { string: 2, fret: pos + 3, finger: '3' },
        { string: 3, fret: pos - 1, finger: '1' },
        { string: 1, fret: pos, finger: '2' },
        { string: 3, fret: pos + 2, finger: '4' },
        { string: 1, fret: pos + 3, finger: '3' },
        { string: 1, fret: pos + 6, finger: '4', pick: 'up' as const },
        { string: 2, fret: pos + 3, finger: '2', pick: 'down' as const },
        { string: 3, fret: pos + 2, finger: '1', pick: 'up' as const },
        { string: 4, fret: pos + 2, finger: '1', pick: 'down' as const },
      ]);
    },
  },

  // AP-18 • Cascada Neoclásica en Sextillos (6 Cuerdas Continuas) (158 BPM)
  // Dm (4c) -> Gm (4c) -> A7 (4c) -> Dm (4c) -> Bb (4c) -> Gm (4c) -> A7 (4c) -> Dm (4c) = 32 compases
  {
    code: 'AP-18',
    slug: 'ap-18-cascada-neoclasica-6-cuerdas',
    title: 'AP-18 • Workout Cascada Neoclásica en Sextillos (6 Cuerdas Continuas) — 32 Compases',
    bpm: 158,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'Ráfaga continua barroca que cruza las 6 cuerdas de la guitarra ida y vuelta sin perder el pulso de púa alterna a 158 BPM sobre una progresión clásica en Re menor.',
    progression: [
      { chord: 'Dm', measures: 4 },
      { chord: 'Gm', measures: 4 },
      { chord: 'A7', measures: 4 },
      { chord: 'Dm', measures: 4 },
      { chord: 'Bb', measures: 4 },
      { chord: 'Gm', measures: 4 },
      { chord: 'A7', measures: 4 },
      { chord: 'Dm', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const p = chord === 'Gm' ? 10 : chord === 'A7' ? 12 : chord === 'Bb' ? 6 : 5;
      return createMeasure16Notes(mIdx, offset, [
        { string: 1, fret: p + 3, finger: '4' },
        { string: 1, fret: p + 1, finger: '2' },
        { string: 1, fret: p, finger: '1' },
        { string: 2, fret: p + 3, finger: '4' },
        { string: 2, fret: p + 1, finger: '2' },
        { string: 3, fret: p + 2, finger: '3' },
        { string: 3, fret: p, finger: '1' },
        { string: 4, fret: p + 2, finger: '3' },
        { string: 4, fret: p, finger: '1' },
        { string: 5, fret: p + 3, finger: '4' },
        { string: 5, fret: p + 1, finger: '2' },
        { string: 6, fret: p + 3, finger: '4' },
        { string: 6, fret: p + 1, finger: '2' },
        { string: 6, fret: p, finger: '1' },
        { string: 5, fret: p + 1, finger: '2' },
        { string: 5, fret: p + 3, finger: '4' },
      ]);
    },
  },

  // AP-19 • Fusion Chromatic Outside-In (160 BPM)
  // Am11 (8c) -> D13 (8c) -> Gmaj9 (8c) -> C#m7b5 (4c) -> F#7b9 (4c) = 32 compases
  {
    code: 'AP-19',
    slug: 'ap-19-fusion-chromatic-outside-in',
    title: 'AP-19 • Workout Fusion Chromatic Outside-In — 32 Compases',
    bpm: 160,
    category: 'Licks & Riffs',
    difficulty: 'Avanzado',
    description: 'Aproximaciones cromáticas de 4 notas por traste (1-2-3-4) intercaladas con notas objetivo diatónicas a 160 BPM estilo John McLaughlin / Frank Gambale con púa estricta.',
    progression: [
      { chord: 'Am11', measures: 8 },
      { chord: 'D13', measures: 8 },
      { chord: 'Gmaj9', measures: 8 },
      { chord: 'C#m7b5', measures: 4 },
      { chord: 'F#7b9', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const pos = chord === 'D13' ? 10 : chord === 'Gmaj9' ? 7 : chord === 'C#m7b5' ? 9 : chord === 'F#7b9' ? 8 : 5;
      return createMeasure16Notes(mIdx, offset, [
        { string: 3, fret: pos, finger: '1' },
        { string: 3, fret: pos + 1, finger: '2' },
        { string: 3, fret: pos + 2, finger: '3' },
        { string: 3, fret: pos + 3, finger: '4' },
        { string: 2, fret: pos, finger: '1' },
        { string: 2, fret: pos + 1, finger: '2' },
        { string: 2, fret: pos + 2, finger: '3' },
        { string: 2, fret: pos + 3, finger: '4' },
        { string: 1, fret: pos, finger: '1' },
        { string: 1, fret: pos + 1, finger: '2' },
        { string: 1, fret: pos + 2, finger: '3' },
        { string: 1, fret: pos + 3, finger: '4' },
        { string: 1, fret: pos + 2, finger: '3' },
        { string: 2, fret: pos + 3, finger: '4' },
        { string: 2, fret: pos + 1, finger: '2' },
        { string: 3, fret: pos + 2, finger: '3' },
      ]);
    },
  },

  // AP-20 • Boss Final: Maratón de Resistencia 32 Compases (164 BPM)
  // Em (4c) -> Cmaj7 (4c) -> Am7 (4c) -> B7alt (4c) -> Em (4c) -> Gmaj7 (4c) -> D7 (4c) -> B7 (4c) = 32 compases
  {
    code: 'AP-20',
    slug: 'ap-20-boss-final-maraton-resistencia-32c',
    title: 'AP-20 • Boss Final: Maratón de Resistencia 32 Compases (3NPS + Skipping + Pedal Tone) — 32 Compases',
    bpm: 164,
    category: 'Escalas & Arpegios',
    difficulty: 'Avanzado',
    description: 'La prueba cumbre del método: 32 compases continuos a 164 BPM que combinan 3NPS, saltos de cuerda, notas pedal y sextillos sobre una progresión armónica triunfal.',
    progression: [
      { chord: 'Em', measures: 4 },
      { chord: 'Cmaj7', measures: 4 },
      { chord: 'Am7', measures: 4 },
      { chord: 'B7alt', measures: 4 },
      { chord: 'Em', measures: 4 },
      { chord: 'Gmaj7', measures: 4 },
      { chord: 'D7', measures: 4 },
      { chord: 'B7', measures: 4 },
    ],
    generateNotes: (mIdx, chord, offset) => {
      const p = chord === 'Cmaj7' ? 8 : chord === 'Am7' ? 5 : chord === 'B7alt' ? 7 : chord === 'Gmaj7' ? 10 : chord === 'D7' ? 10 : chord === 'B7' ? 7 : 12;
      return createMeasure16Notes(mIdx, offset, [
        { string: 1, fret: p + 3, finger: '4' },
        { string: 1, fret: p, finger: '1' },
        { string: 2, fret: p + 2, finger: '3' },
        { string: 1, fret: p, finger: '1' },
        { string: 3, fret: p + 2, finger: '3' },
        { string: 1, fret: p, finger: '1' },
        { string: 2, fret: p + 2, finger: '3' },
        { string: 3, fret: p + 2, finger: '3' },
        { string: 4, fret: p + 2, finger: '3' },
        { string: 4, fret: p, finger: '1' },
        { string: 5, fret: p + 2, finger: '3' },
        { string: 5, fret: p, finger: '1' },
        { string: 6, fret: p + 3, finger: '4' },
        { string: 6, fret: p, finger: '1' },
        { string: 5, fret: p + 2, finger: '3' },
        { string: 1, fret: p + 7, finger: '4' },
      ]);
    },
  },
];

/**
 * Convierte un blueprint en un StringExerciseData completo y estructurado con 32 compases
 */
export function buildExerciseFromBlueprint(bp: ExerciseBlueprint): StringExerciseData {
  const allNotes: StringTabNote[] = [];
  const measuresData: StringMeasureData[] = [];
  let currentMeasureIndex = 0;

  bp.progression.forEach((block) => {
    for (let i = 0; i < block.measures; i++) {
      const globalStepOffset = currentMeasureIndex * 16;
      const mNotes = bp.generateNotes(currentMeasureIndex, block.chord, globalStepOffset);

      allNotes.push(...mNotes);

      measuresData.push({
        measureIndex: currentMeasureIndex,
        measureNumber: currentMeasureIndex + 1,
        patternCode: `P${(currentMeasureIndex % 8) + 1}`,
        patternName: `${block.chord} - C.${currentMeasureIndex + 1}`,
        patternColor: currentMeasureIndex % 2 === 0 ? 'amber' : 'rose',
        timeSignature: '4/4',
        subdivision: '1/16',
        stepsPerMeasure: 16,
        chordSymbol: block.chord,
        notes: mNotes,
      });

      currentMeasureIndex++;
    }
  });

  return {
    id: `str_${bp.slug.replace(/-/g, '_')}`,
    slug: bp.slug,
    title: bp.title,
    instrument: 'guitar_6',
    tuning: 'E A D G B E',
    category: bp.category,
    difficulty: bp.difficulty,
    bpmDefault: bp.bpm,
    timeSignature: '4/4',
    totalSteps: currentMeasureIndex * 16,
    subdivision: '1/16',
    stepsPerMeasure: 16,
    tabData: allNotes,
    measures: measuresData,
    pickingStyle: 'alternate',
    folder: 'Púa Alternada',
    description: bp.description,
  };
}

/**
 * Colección exportada de los 20 estudios completos (32 compases cada uno)
 */
export const ADVANCED_ALTERNATE_PICKING_20: StringExerciseData[] = BLUEPRINTS.map(buildExerciseFromBlueprint);

/**
 * Función para sembrar en PostgreSQL vía Prisma (idempotente)
 */
export async function seedAlternatePicking20(prismaClient?: PrismaClient) {
  const prisma = prismaClient || new PrismaClient();
  const results = [];

  for (const ex of ADVANCED_ALTERNATE_PICKING_20) {
    const tabPayload = {
      tabNotes: ex.tabData,
      notes: ex.tabData,
      data: ex.tabData,
      measures: ex.measures,
      patternBank: ex.patternBank || [],
      pickingStyle: ex.pickingStyle,
      folder: ex.folder,
    };

    const saved = await prisma.stringExercise.upsert({
      where: { slug: ex.slug },
      update: {
        title: ex.title,
        instrument: ex.instrument,
        tuning: ex.tuning,
        category: ex.category,
        difficulty: ex.difficulty,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature,
        subdivision: ex.subdivision,
        stepsPerMeasure: ex.stepsPerMeasure,
        totalSteps: ex.totalSteps,
        tabData: tabPayload as any,
        folder: ex.folder,
      },
      create: {
        slug: ex.slug,
        title: ex.title,
        instrument: ex.instrument,
        tuning: ex.tuning,
        category: ex.category,
        difficulty: ex.difficulty,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature,
        subdivision: ex.subdivision,
        stepsPerMeasure: ex.stepsPerMeasure,
        totalSteps: ex.totalSteps,
        tabData: tabPayload as any,
        folder: ex.folder,
      },
    });

    results.push(saved.slug);
  }

  return results;
}

// Ejecución directa si se corre desde CLI (npx tsx prisma/seeds/advancedAlternatePicking20.ts)
if (require.main === module) {
  const prisma = new PrismaClient();
  seedAlternatePicking20(prisma)
    .then((saved) => {
      console.log(`✅ ${saved.length} estudios de 32 compases (AP-01 a AP-20) guardados en la carpeta "Púa Alternada" en PostgreSQL.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error sembrando estudios de púa alternada:', err);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
