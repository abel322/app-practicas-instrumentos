export interface SubdivisionConfig {
  id: string;
  name: string;
  stepsPerMeasure: number;
  stepLabels: string[]; // Etiquetas visuales para la cabecera del compás
}

export const SUBDIVISION_CONFIGS: Record<string, SubdivisionConfig> = {
  '1/4': {
    id: '1/4',
    name: 'Negras',
    stepsPerMeasure: 4,
    stepLabels: ['1', '2', '3', '4'],
  },
  '1/8': {
    id: '1/8',
    name: 'Corcheas',
    stepsPerMeasure: 8,
    stepLabels: ['1', 'y', '2', 'y', '3', 'y', '4', 'y'],
  },
  '1/16': {
    id: '1/16',
    name: 'Semicorcheas',
    stepsPerMeasure: 16,
    stepLabels: ['1', 'e', 'y', 'a', '2', 'e', 'y', 'a', '3', 'e', 'y', 'a', '4', 'e', 'y', 'a'],
  },
  '1/8T': {
    id: '1/8T',
    name: 'Tresillos de Corchea',
    stepsPerMeasure: 12,
    stepLabels: ['1', 'y', 'a', '2', 'y', 'a', '3', 'y', 'a', '4', 'y', 'a'],
  },
  '1/16T': {
    id: '1/16T',
    name: 'Tresillos de Semicorchea',
    stepsPerMeasure: 24,
    stepLabels: [
      '1', 'y', 'a', '+', 'y', 'a',
      '2', 'y', 'a', '+', 'y', 'a',
      '3', 'y', 'a', '+', 'y', 'a',
      '4', 'y', 'a', '+', 'y', 'a',
    ],
  },
  'quintillo': {
    id: 'quintillo',
    name: 'Quintillo (5:4)',
    stepsPerMeasure: 20,
    stepLabels: [
      '1', 'e', 'y', 'a', 'u',
      '2', 'e', 'y', 'a', 'u',
      '3', 'e', 'y', 'a', 'u',
      '4', 'e', 'y', 'a', 'u',
    ],
  },
  'septillo': {
    id: 'septillo',
    name: 'Septillo (7:4)',
    stepsPerMeasure: 28,
    stepLabels: Array.from({ length: 28 }, (_, i) => `${i + 1}`),
  },
  '1/32': {
    id: '1/32',
    name: 'Fusas',
    stepsPerMeasure: 32,
    stepLabels: [
      '1', 'e', 'y', 'a', '+', 'e', 'y', 'a',
      '2', 'e', 'y', 'a', '+', 'e', 'y', 'a',
      '3', 'e', 'y', 'a', '+', 'e', 'y', 'a',
      '4', 'e', 'y', 'a', '+', 'e', 'y', 'a',
    ],
  },
};

export function normalizeSubdivisionKey(val?: string): string {
  if (!val) return '1/16';
  const clean = val.trim();
  if (clean.includes('1/8T')) return '1/8T';
  if (clean.includes('1/16T')) return '1/16T';
  if (clean.includes('1/8')) return '1/8';
  if (clean.includes('1/4')) return '1/4';
  if (clean.includes('1/32')) return '1/32';
  if (clean.includes('quintillo')) return 'quintillo';
  if (clean.includes('septillo')) return 'septillo';
  return '1/16';
}

export function getStepsForSubdivision(subdivisionKey: string, timeSignature: string = '4/4'): number {
  const key = normalizeSubdivisionKey(subdivisionKey);
  if (timeSignature === '6/8') {
    if (key === '1/8') return 6;
    if (key === '1/32') return 24;
    return 12;
  }
  if (timeSignature === '7/8') {
    return key === '1/8' ? 7 : 14;
  }
  switch (key) {
    case '1/4': return 4;
    case '1/8': return 8;
    case '1/8T': return 12;
    case '1/16T': return 24;
    case '1/32': return 32;
    case 'quintillo': return 20;
    case 'septillo': return 28;
    case '1/16':
    default:
      return 16;
  }
}

export function getSubdivisionConfig(
  subdivisionKey?: string,
  timeSignature?: string,
  fallbackStepsPerMeasure?: number
): SubdivisionConfig {
  const normalized = normalizeSubdivisionKey(subdivisionKey);

  if (timeSignature === '6/8') {
    if (normalized === '1/8' || fallbackStepsPerMeasure === 6) {
      return {
        id: '1/8',
        name: 'Corcheas',
        stepsPerMeasure: 6,
        stepLabels: ['1', '2', '3', '4', '5', '6'],
      };
    }
    return {
      id: '1/16',
      name: 'Semicorcheas',
      stepsPerMeasure: 12,
      stepLabels: ['1', '&', '2', '&', '3', '&', '4', '&', '5', '&', '6', '&'],
    };
  }

  if (SUBDIVISION_CONFIGS[normalized]) {
    return SUBDIVISION_CONFIGS[normalized];
  }

  // Si no se proporcionó subdivisionKey pero sí fallbackStepsPerMeasure (ej: guardado con totalSteps = 8)
  if (!subdivisionKey && fallbackStepsPerMeasure) {
    if (fallbackStepsPerMeasure === 8) return SUBDIVISION_CONFIGS['1/8'];
    if (fallbackStepsPerMeasure === 4) return SUBDIVISION_CONFIGS['1/4'];
    if (fallbackStepsPerMeasure === 12) return SUBDIVISION_CONFIGS['1/8T'];
    if (fallbackStepsPerMeasure === 24) return SUBDIVISION_CONFIGS['1/16T'];
    if (fallbackStepsPerMeasure === 32) return SUBDIVISION_CONFIGS['1/32'];
  }

  return SUBDIVISION_CONFIGS['1/16'];
}

/**
 * Retorna la etiqueta rítmica estándar de batería y si es inicio de pulso (isBeatStart)
 * para cualquier paso dentro de un compás.
 *
 * Mapeo canónico:
 * - 1/4 (1 paso/pulso):   1 | 2 | 3 | 4
 * - 1/8 (2 pasos/pulso):  1 y | 2 y | 3 y | 4 y
 * - 1/8T (3 pasos/pulso): 1 y a | 2 y a | 3 y a | 4 y a
 * - 1/16 (4 pasos/pulso): 1 e y a | 2 e y a | 3 e y a | 4 e y a
 * - 5:4 (5 pasos/pulso):  1 e y a u | 2 e y a u | 3 e y a u | 4 e y a u
 * - 1/16T (6 pasos/pulso): 1 y a + y a | 2 y a + y a | 3 y a + y a | 4 y a + y a
 * - 1/32 (8 pasos/pulso): 1 e y a + e y a | 2 e y a + e y a...
 */
export function getStepCountLabel(
  stepIndex: number,
  stepsPerMeasure: number,
  subdivision?: string,
  timeSignature?: string
): {
  label: string;
  isBeatStart: boolean;
  isBeat: boolean;
} {
  // Determinar pasos por pulso (asumiendo 4 tiempos por compás o métrica equivalente)
  const beatsPerBar =
    timeSignature === '6/8'
      ? 2
      : timeSignature === '7/8'
      ? 7
      : stepsPerMeasure === 20 && subdivision === '5/4'
      ? 5
      : stepsPerMeasure === 28 && subdivision === '7/4'
      ? 7
      : 4;

  const stepsPerBeat = Math.max(1, Math.round(stepsPerMeasure / beatsPerBar));
  const beatNumber = Math.floor(stepIndex / stepsPerBeat) + 1;
  const subIndex = stepIndex % stepsPerBeat;
  const isBeatStart = subIndex === 0;

  // 1. Negras (1/4 -> 1 paso por pulso): 1 | 2 | 3 | 4
  if (stepsPerBeat === 1) {
    return { label: `${beatNumber}`, isBeatStart: true, isBeat: true };
  }

  // 2. Corcheas (1/8 -> 2 pasos por pulso): 1 y | 2 y | 3 y | 4 y
  if (stepsPerBeat === 2) {
    return {
      label: subIndex === 0 ? `${beatNumber}` : 'y',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  // 3. Tresillos de Corcheas (1/8T -> 3 pasos por pulso): 1 y a | 2 y a | 3 y a | 4 y a
  if (stepsPerBeat === 3) {
    const syllables = [`${beatNumber}`, 'y', 'a'];
    return {
      label: syllables[subIndex] ?? 'a',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  // 4. Semicorcheas (1/16 -> 4 pasos por pulso): 1 e y a | 2 e y a | 3 e y a | 4 e y a
  if (stepsPerBeat === 4) {
    const syllables = [`${beatNumber}`, 'e', 'y', 'a'];
    return {
      label: syllables[subIndex] ?? 'a',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  // 5. Quintillos (5 pasos por pulso): 1 e y a u | 2 e y a u | 3 e y a u | 4 e y a u
  if (stepsPerBeat === 5) {
    const syllables = [`${beatNumber}`, 'e', 'y', 'a', 'u'];
    return {
      label: syllables[subIndex] ?? 'u',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  // 6. Seisillos (1/16T -> 6 pasos por pulso): 1 y a + y a | 2 y a + y a | 3 y a + y a | 4 y a + y a
  if (stepsPerBeat === 6) {
    const syllables = [`${beatNumber}`, 'y', 'a', '+', 'y', 'a'];
    return {
      label: syllables[subIndex] ?? 'a',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  // 7. Fusas (1/32 -> 8 pasos por pulso): 1 e y a + e y a | 2 e y a + e y a...
  if (stepsPerBeat === 8) {
    const syllables = [`${beatNumber}`, 'e', 'y', 'a', '+', 'e', 'y', 'a'];
    return {
      label: syllables[subIndex] ?? 'a',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  return {
    label: subIndex === 0 ? `${beatNumber}` : `·${subIndex + 1}`,
    isBeatStart,
    isBeat: isBeatStart,
  };
}
