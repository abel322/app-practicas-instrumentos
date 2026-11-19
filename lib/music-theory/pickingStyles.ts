// lib/music-theory/pickingStyles.ts
// Lógica de estilos de púa, auto-asignación y rasgueos de acordes para Guitarra y Bajo

import { PickDirection, PickingStyle, StrumDirection } from '@/types/strings';

export interface PickingStyleDefinition {
  id: PickingStyle;
  label: string;
  shortLabel: string;
  symbol: string;
  description: string;
}

export const PICKING_STYLES: PickingStyleDefinition[] = [
  {
    id: 'alternate',
    label: 'Alternate Picking (Π/V)',
    shortLabel: 'Π/V Alternate',
    symbol: 'Π/V',
    description: 'Alternate Picking estándar: Inicia con púa abajo (Π → V → Π → V).',
  },
  {
    id: 'alternate_up',
    label: 'Alternate Invertido (V/Π)',
    shortLabel: 'V/Π Invertido',
    symbol: 'V/Π',
    description: 'Alternate Picking Invertido (Inicia Arriba: V → Π → V → Π).',
  },
  {
    id: 'economy',
    label: 'Economy Picking',
    shortLabel: 'Economy',
    symbol: '↘',
    description: 'Mantiene púa abajo al bajar de cuerda (grave→aguda), púa arriba al subir (aguda→grave) y alterna en la misma cuerda.',
  },
  {
    id: 'sweep',
    label: 'Sweep Picking',
    shortLabel: 'Sweep',
    symbol: '⚡',
    description: 'Barrido continuo hacia abajo en sentido grave→aguda y barrido continuo arriba en sentido aguda→grave.',
  },
  {
    id: 'downpicking',
    label: 'Downpicking',
    shortLabel: 'Downpicking',
    symbol: 'Π',
    description: 'Ataque con púa hacia abajo (Π) en todas las notas para máxima contundencia.',
  },
  {
    id: 'uppicking',
    label: 'Uppicking',
    shortLabel: 'Uppicking',
    symbol: 'V',
    description: 'Ataque con púa hacia arriba (V) en todas las notas.',
  },
  {
    id: 'hybrid',
    label: 'Hybrid Picking',
    shortLabel: 'Hybrid',
    symbol: 'H.P.',
    description: 'Púa (Π) en cuerdas graves (6ª-4ª), dedo medio (m) en 3ª-2ª y dedo anular (a) en 1ª cuerda.',
  },
  {
    id: 'palm_mute',
    label: 'Palm Mute',
    shortLabel: 'Palm Mute',
    symbol: 'P.M.',
    description: 'Apagado percusivo de la mano derecha sobre el puente con alternancia de púa.',
  },
];

/**
 * Calcula la dirección de púa para una nota según el estilo activo y la nota previa
 * @param currentString Número de cuerda (1 es la más aguda, 6 es la más grave en guitarra)
 * @param prevNote Nota previa cronológica
 * @param style Estilo de picking seleccionado
 */
export function calculatePickDirectionForNote(
  currentString: number,
  prevNote: { string: number; pickDirection?: PickDirection } | null,
  style: PickingStyle
): PickDirection {
  switch (style) {
    case 'downpicking':
      return 'down';

    case 'uppicking':
      return 'up';

    case 'hybrid':
      // Cuerdas 6ª, 5ª y 4ª: Púa abajo (Π)
      // Cuerdas 3ª y 2ª: Dedo medio (m)
      // Cuerda 1ª: Dedo anular (a)
      if (currentString <= 1) return 'a';
      if (currentString <= 3) return 'm';
      return 'down';

    case 'alternate':
    case 'alternate_down':
      if (!prevNote || !prevNote.pickDirection) return 'down';
      return prevNote.pickDirection === 'down' ? 'up' : 'down';

    case 'alternate_up':
      if (!prevNote || !prevNote.pickDirection) return 'up';
      return prevNote.pickDirection === 'up' ? 'down' : 'up';

    case 'economy': {
      if (!prevNote) return 'down';
      // En afinación estándar, string 6 = grave, string 1 = aguda.
      // Pasar de cuerda grave a más aguda -> el número de cuerda disminuye (ej: 6 a 5, o 4 a 3): mantiene 'down' (Π)
      if (currentString < prevNote.string) {
        return 'down';
      }
      // Pasar de cuerda aguda a más grave -> el número de cuerda aumenta (ej: 1 a 2, o 3 a 5): mantiene 'up' (V)
      if (currentString > prevNote.string) {
        return 'up';
      }
      // En la misma cuerda: alterna estrictamente
      return prevNote.pickDirection === 'down' ? 'up' : 'down';
    }

    case 'sweep': {
      if (!prevNote) return 'down';
      // Movimiento continuo grave -> aguda (string decreciente): 'down'
      if (currentString < prevNote.string) {
        return 'down';
      }
      // Movimiento continuo aguda -> grave (string creciente): 'up'
      if (currentString > prevNote.string) {
        return 'up';
      }
      return prevNote.pickDirection === 'down' ? 'up' : 'down';
    }

    case 'palm_mute':
      if (!prevNote || !prevNote.pickDirection) return 'down';
      return prevNote.pickDirection === 'down' ? 'up' : 'down';

    default:
      return 'down';
  }
}

/**
 * Aplica en bloque el estilo de picking a una lista de notas de guitarra o bajo
 */
export function applyPickingStyleToNotes<T extends {
  step: number;
  string?: number;
  id?: string;
  pickDirection?: PickDirection;
  palmMute?: boolean;
  strumDirection?: StrumDirection;
}>(
  notes: T[],
  style: PickingStyle,
  filterRange?: { startStep: number; endStep: number }
): T[] {
  // Ordenar cronológicamente por step, y dentro del mismo step de cuerda grave a aguda
  const sorted = [...notes].sort((a, b) => {
    if (a.step !== b.step) return a.step - b.step;
    return (b.string || 1) - (a.string || 1);
  });

  // Identificar pasos con 2 o más notas (acordes)
  const countByStep = new Map<number, number>();
  sorted.forEach((n) => {
    countByStep.set(n.step, (countByStep.get(n.step) || 0) + 1);
  });

  let prevNote: { string: number; pickDirection?: PickDirection } | null = null;
  const computedMap = new Map<string, { pickDirection: PickDirection; palmMute?: boolean; strumDirection?: StrumDirection }>();

  for (const n of sorted) {
    if (
      filterRange &&
      (n.step < filterRange.startStep || n.step >= filterRange.endStep)
    ) {
      continue;
    }

    const currentString = n.string || 1;
    const isChordStep = (countByStep.get(n.step) || 0) >= 2;

    const computedPick = calculatePickDirectionForNote(currentString, prevNote, style);
    const computedPalmMute = style === 'palm_mute' ? true : n.palmMute;
    const computedStrum = isChordStep ? (n.strumDirection || 'down') : null;

    prevNote = {
      string: currentString,
      pickDirection: computedPick,
    };

    const key = n.id ? n.id : `${n.step}-${n.string}`;
    computedMap.set(key, {
      pickDirection: computedPick,
      palmMute: computedPalmMute,
      strumDirection: computedStrum,
    });
  }

  return notes.map((original) => {
    const key = original.id ? original.id : `${original.step}-${original.string}`;
    const update = computedMap.get(key);
    if (!update) return original;
    return {
      ...original,
      ...update,
    };
  });
}
