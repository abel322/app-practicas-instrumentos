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
    stepLabels: ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'],
  },
  '1/8T': {
    id: '1/8T',
    name: 'Tresillos de Corchea',
    stepsPerMeasure: 12,
    stepLabels: ['1', 'ti', 'ta', '2', 'ti', 'ta', '3', 'ti', 'ta', '4', 'ti', 'ta'],
  },
  '1/32': {
    id: '1/32',
    name: 'Fusas',
    stepsPerMeasure: 32,
    stepLabels: Array.from({ length: 32 }, (_, i) => `${i + 1}`),
  },
};

export function getSubdivisionConfig(
  subdivisionKey?: string,
  timeSignature?: string,
  fallbackStepsPerMeasure?: number
): SubdivisionConfig {
  if (timeSignature === '6/8') {
    if (subdivisionKey?.includes('1/8') || fallbackStepsPerMeasure === 6) {
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

  // Si no se proporcionó subdivisionKey pero sí fallbackStepsPerMeasure (ej: guardado con totalSteps = 8)
  if (!subdivisionKey && fallbackStepsPerMeasure) {
    if (fallbackStepsPerMeasure === 8) return SUBDIVISION_CONFIGS['1/8'];
    if (fallbackStepsPerMeasure === 4) return SUBDIVISION_CONFIGS['1/4'];
    if (fallbackStepsPerMeasure === 12) return SUBDIVISION_CONFIGS['1/8T'];
    if (fallbackStepsPerMeasure === 32) return SUBDIVISION_CONFIGS['1/32'];
  }

  if (!subdivisionKey) return SUBDIVISION_CONFIGS['1/16'];

  // Limpieza defensiva por si viene como "1/8 (Corcheas - 8 pasos)" o "1/8"
  if (subdivisionKey.includes('1/8T')) return SUBDIVISION_CONFIGS['1/8T'];
  if (subdivisionKey.includes('1/8')) return SUBDIVISION_CONFIGS['1/8'];
  if (subdivisionKey.includes('1/4')) return SUBDIVISION_CONFIGS['1/4'];
  if (subdivisionKey.includes('1/32')) return SUBDIVISION_CONFIGS['1/32'];
  return SUBDIVISION_CONFIGS['1/16'];
}

