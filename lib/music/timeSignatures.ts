/**
 * Catálogo Completo de Métricas Musicales (Simples, Compuestas e Irregulares / Amalgamadas)
 * Proporciona especificaciones de numerador, denominador, subdivisión por defecto,
 * pasos por compás y equivalencia en pulsos de negra (quarterNoteBeats) para cálculo
 * exacto de duración temporal con Web Audio API.
 */

export interface TimeSignatureSpec {
  value: string; // Ej: "4/4", "6/8", "7/8"
  label: string; // Ej: "6/8 (Compuesto Binario)"
  numerator: number; // Ej: 6
  denominator: number; // Ej: 4 u 8
  defaultSubdivision: string;
  defaultSteps: number; // Pasos por compás por defecto
  quarterNoteBeats: number; // Equivalencia en negras para calcular duración exacta según BPM
  accentBeats?: number[]; // Índices de corcheas/negras donde caen los acentos naturales (0-indexed)
}

export const TIME_SIGNATURE_OPTIONS: TimeSignatureSpec[] = [
  // --------------------------------------------------------------------------
  // Métricas Simples (denominador 4 - pulso de negra)
  // --------------------------------------------------------------------------
  {
    value: '2/4',
    label: '2/4 (Binario Simple)',
    numerator: 2,
    denominator: 4,
    defaultSubdivision: '1/16',
    defaultSteps: 8,
    quarterNoteBeats: 2,
    accentBeats: [0],
  },
  {
    value: '3/4',
    label: '3/4 (Ternario / Vals)',
    numerator: 3,
    denominator: 4,
    defaultSubdivision: '1/16',
    defaultSteps: 12,
    quarterNoteBeats: 3,
    accentBeats: [0],
  },
  {
    value: '4/4',
    label: '4/4 (Cuaternario)',
    numerator: 4,
    denominator: 4,
    defaultSubdivision: '1/16',
    defaultSteps: 16,
    quarterNoteBeats: 4,
    accentBeats: [0, 2],
  },
  {
    value: '5/4',
    label: '5/4 (Irregular 3+2 / 2+3)',
    numerator: 5,
    denominator: 4,
    defaultSubdivision: '1/16',
    defaultSteps: 20,
    quarterNoteBeats: 5,
    accentBeats: [0, 3],
  },
  {
    value: '6/4',
    label: '6/4 (Séxtuplo Simple)',
    numerator: 6,
    denominator: 4,
    defaultSubdivision: '1/8',
    defaultSteps: 12,
    quarterNoteBeats: 6,
    accentBeats: [0, 3],
  },
  {
    value: '7/4',
    label: '7/4 (Irregular 4+3 / 3+4)',
    numerator: 7,
    denominator: 4,
    defaultSubdivision: '1/8',
    defaultSteps: 14,
    quarterNoteBeats: 7,
    accentBeats: [0, 4],
  },

  // --------------------------------------------------------------------------
  // Métricas Compuestas (denominador 8 - pulso de negra con puntillo)
  // --------------------------------------------------------------------------
  {
    value: '6/8',
    label: '6/8 (Compuesto Binario - 2 grupos de 3)',
    numerator: 6,
    denominator: 8,
    defaultSubdivision: '1/8',
    defaultSteps: 6,
    quarterNoteBeats: 3,
    accentBeats: [0, 3], // Tiempos 1 y 4 (en corcheas)
  },
  {
    value: '9/8',
    label: '9/8 (Compuesto Ternario - 3 grupos de 3)',
    numerator: 9,
    denominator: 8,
    defaultSubdivision: '1/8',
    defaultSteps: 9,
    quarterNoteBeats: 4.5,
    accentBeats: [0, 3, 6], // Tiempos 1, 4 y 7
  },
  {
    value: '12/8',
    label: '12/8 (Compuesto Cuaternario - 4 grupos de 3)',
    numerator: 12,
    denominator: 8,
    defaultSubdivision: '1/8',
    defaultSteps: 12,
    quarterNoteBeats: 6,
    accentBeats: [0, 3, 6, 9], // Tiempos 1, 4, 7 y 10
  },

  // --------------------------------------------------------------------------
  // Métricas Irregulares / Amalgamadas (denominador 8)
  // --------------------------------------------------------------------------
  {
    value: '5/8',
    label: '5/8 (Irregular 3+2 / 2+3)',
    numerator: 5,
    denominator: 8,
    defaultSubdivision: '1/8',
    defaultSteps: 5,
    quarterNoteBeats: 2.5,
    accentBeats: [0, 3],
  },
  {
    value: '7/8',
    label: '7/8 (Irregular 2+2+3 / 3+2+2)',
    numerator: 7,
    denominator: 8,
    defaultSubdivision: '1/8',
    defaultSteps: 7,
    quarterNoteBeats: 3.5,
    accentBeats: [0, 2, 4],
  },
  {
    value: '10/8',
    label: '10/8 (Irregular 3+3+2+2)',
    numerator: 10,
    denominator: 8,
    defaultSubdivision: '1/8',
    defaultSteps: 10,
    quarterNoteBeats: 5,
    accentBeats: [0, 3, 6, 8],
  },
  {
    value: '11/8',
    label: '11/8 (Irregular 3+3+3+2)',
    numerator: 11,
    denominator: 8,
    defaultSubdivision: '1/8',
    defaultSteps: 11,
    quarterNoteBeats: 5.5,
    accentBeats: [0, 3, 6, 9],
  },
];

/**
 * Obtiene la especificación completa de una métrica dada (o 4/4 por defecto).
 */
export function getTimeSignatureSpec(ts?: string): TimeSignatureSpec {
  if (!ts) {
    return TIME_SIGNATURE_OPTIONS.find((item) => item.value === '4/4')!;
  }
  const clean = ts.trim();
  const found = TIME_SIGNATURE_OPTIONS.find((item) => item.value === clean);
  if (found) return found;

  // Si no está exactamente en el catálogo, parsear numerador/denominador dinámicamente
  const parts = clean.split('/');
  const num = parseInt(parts[0], 10) || 4;
  const den = parseInt(parts[1], 10) || 4;
  const isEighth = den === 8;
  const quarterNoteBeats = isEighth ? num * 0.5 : num * (4 / den);

  return {
    value: clean,
    label: `${clean} (${num} pulsos)`,
    numerator: num,
    denominator: den,
    defaultSubdivision: isEighth ? '1/8' : '1/16',
    defaultSteps: isEighth ? num : num * 4,
    quarterNoteBeats,
  };
}

/**
 * Calcula los pasos totales de un compás dada su métrica y subdivisión.
 */
export function calculateStepsForMeasure(timeSignature: string, subdivision: string): number {
  const spec = getTimeSignatureSpec(timeSignature);
  const sub = subdivision.trim();

  // Caso métricas de denominador 8 (ej. 6/8, 7/8, 9/8, 12/8, 5/8, 11/8)
  if (spec.denominator === 8) {
    if (sub === '1/8') return spec.numerator; // 1 paso por corchea (ej. 6 en 6/8, 7 en 7/8)
    if (sub === '1/16') return spec.numerator * 2; // 2 pasos por corchea (ej. 12 en 6/8, 14 en 7/8)
    if (sub === '1/32') return spec.numerator * 4; // 4 pasos por corchea (ej. 24 en 6/8)
    if (sub === '1/4') return Math.max(1, Math.floor(spec.numerator / 2));
    if (sub === '1/8T') return spec.numerator;
    if (sub === '1/16T') return spec.numerator * 3;
    return spec.defaultSteps;
  }

  // Caso métricas de denominador 4 (ej. 2/4, 3/4, 4/4, 5/4, 6/4, 7/4)
  const num = spec.numerator;
  switch (sub) {
    case '1/4':
      return num; // 1 paso por negra (4 en 4/4, 3 en 3/4, 2 en 2/4, 5 en 5/4)
    case '1/8':
      return num * 2; // 2 pasos por negra (8 en 4/4, 6 en 3/4, 4 en 2/4, 10 en 5/4)
    case '1/8T':
      return num * 3; // 3 pasos por negra (12 en 4/4, 9 en 3/4, 6 en 2/4, 15 en 5/4)
    case '1/16':
      return num * 4; // 4 pasos por negra (16 en 4/4, 12 en 3/4, 8 en 2/4, 20 en 5/4)
    case 'quintillo':
      return num * 5; // 5 pasos por negra
    case '1/16T':
      return num * 6; // 6 pasos por negra (24 en 4/4, 18 en 3/4, 12 en 2/4)
    case 'septillo':
      return num * 7; // 7 pasos por negra
    case '1/32':
      return num * 8; // 8 pasos por negra (32 en 4/4, 24 en 3/4)
    default:
      return num * 4;
  }
}

/**
 * Conteo rítmico estándar adaptado a métricas simples, compuestas e irregulares.
 * Para métricas en /8 (como 6/8, 7/8, 9/8, 12/8):
 * - En subdivisión 1/8 (corcheas): etiqueta directa "1", "2", "3", "4", "5", "6", destacando
 *   los acentos naturales del compás (ej. 1 y 4 en 6/8; 1, 4, 7 en 9/8).
 * - En subdivisión 1/16 (semicorcheas): etiqueta "1", "y", "2", "y", "3", "y"...
 */
export function getStepCountLabelForTimeSignature(
  stepIndex: number,
  stepsPerMeasure: number,
  subdivision: string = '1/16',
  timeSignature: string = '4/4'
): {
  label: string;
  isBeatStart: boolean;
  isBeat: boolean;
} {
  const spec = getTimeSignatureSpec(timeSignature);

  // 1. Métrica con denominador 8 (6/8, 7/8, 9/8, 12/8, 5/8, 10/8, 11/8)
  if (spec.denominator === 8) {
    // Caso A: 1 paso por corchea (stepsPerMeasure === spec.numerator)
    if (stepsPerMeasure === spec.numerator) {
      const eighthIndex = stepIndex;
      const isAccent = (spec.accentBeats || [0]).includes(eighthIndex);
      return {
        label: `${eighthIndex + 1}`,
        isBeatStart: isAccent || eighthIndex === 0,
        isBeat: true,
      };
    }

    // Caso B: 2 pasos por corchea (semicorcheas, stepsPerMeasure === spec.numerator * 2)
    if (stepsPerMeasure === spec.numerator * 2) {
      const eighthIndex = Math.floor(stepIndex / 2);
      const isSecondStep = stepIndex % 2 === 1;
      const isAccent = (spec.accentBeats || [0]).includes(eighthIndex) && !isSecondStep;
      return {
        label: isSecondStep ? 'y' : `${eighthIndex + 1}`,
        isBeatStart: isAccent,
        isBeat: !isSecondStep,
      };
    }

    // Caso C: 3 pasos por corchea
    if (stepsPerMeasure === spec.numerator * 3) {
      const eighthIndex = Math.floor(stepIndex / 3);
      const sub = stepIndex % 3;
      const syllables = [`${eighthIndex + 1}`, 'y', 'a'];
      const isAccent = (spec.accentBeats || [0]).includes(eighthIndex) && sub === 0;
      return {
        label: syllables[sub] || '·',
        isBeatStart: isAccent,
        isBeat: sub === 0,
      };
    }
  }

  // 2. Métrica con denominador 4 (2/4, 3/4, 4/4, 5/4, 6/4, 7/4)
  const quarterBeats = spec.numerator;
  const stepsPerQuarter = Math.max(1, Math.round(stepsPerMeasure / quarterBeats));
  const beatNumber = Math.floor(stepIndex / stepsPerQuarter) + 1;
  const subIndex = stepIndex % stepsPerQuarter;
  const isBeatStart = subIndex === 0;

  if (stepsPerQuarter === 1) {
    return { label: `${beatNumber}`, isBeatStart: true, isBeat: true };
  }

  if (stepsPerQuarter === 2) {
    return {
      label: subIndex === 0 ? `${beatNumber}` : 'y',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  if (stepsPerQuarter === 3) {
    const syllables = [`${beatNumber}`, 'y', 'a'];
    return {
      label: syllables[subIndex] ?? 'a',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  if (stepsPerQuarter === 4) {
    const syllables = [`${beatNumber}`, 'e', 'y', 'a'];
    return {
      label: syllables[subIndex] ?? 'a',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  if (stepsPerQuarter === 5) {
    const syllables = [`${beatNumber}`, 'e', 'y', 'a', 'u'];
    return {
      label: syllables[subIndex] ?? 'u',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  if (stepsPerQuarter === 6) {
    const syllables = [`${beatNumber}`, 'y', 'a', '+', 'y', 'a'];
    return {
      label: syllables[subIndex] ?? 'a',
      isBeatStart,
      isBeat: isBeatStart,
    };
  }

  if (stepsPerQuarter === 8) {
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
