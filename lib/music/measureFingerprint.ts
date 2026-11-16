/**
 * Utilidad de Detección de Compases Duplicados y Análisis de Patrones Rítmicos
 * Genera huellas digitales canónicas para identificar compases repetidos,
 * variaciones y cambios de patrón en tiempo real.
 */

export interface MeasureAnalysis {
  measureIndex: number;
  measureNumber: number;
  fingerprint: string;
  isDuplicate: boolean;
  sourceMeasureNumber: number;
  occurrenceIndex: number;
  totalOccurrences: number;
  isPatternChange: boolean;
}

export function analyzeMeasureDuplicates(measures: any[]): MeasureAnalysis[] {
  if (!Array.isArray(measures) || measures.length === 0) return [];

  const fingerprints = measures.map((m) => {
    const rawNotes = m?.notes || m?.hits || [];
    const activeNotes = (Array.isArray(rawNotes) ? rawNotes : [])
      .filter((n: any) => !n.isRest)
      .map((n: any) => ({
        s: n.stepIndex !== undefined ? n.stepIndex : (n.step !== undefined ? n.step : 0),
        i: (n.instrument || n.drumType || n.instrumentKey || 'snare').toLowerCase().trim(),
        k: n.sticking || '',
        a: Boolean(n.accent),
      }))
      .sort((a: any, b: any) => a.s - b.s || a.i.localeCompare(b.i));

    return JSON.stringify(activeNotes);
  });

  // Contar ocurrencias totales de cada patrón
  const totalCounts = new Map<string, number>();
  fingerprints.forEach((fp) => {
    totalCounts.set(fp, (totalCounts.get(fp) || 0) + 1);
  });

  const firstSeenMeasure = new Map<string, number>();
  const seenSoFar = new Map<string, number>();

  return fingerprints.map((fp, idx) => {
    const measureNumber = idx + 1;
    if (!firstSeenMeasure.has(fp)) {
      firstSeenMeasure.set(fp, measureNumber);
    }
    const occurrenceIndex = (seenSoFar.get(fp) || 0) + 1;
    seenSoFar.set(fp, occurrenceIndex);

    const sourceMeasureNumber = firstSeenMeasure.get(fp)!;
    const totalOccurrences = totalCounts.get(fp) || 1;
    const isDuplicate = occurrenceIndex > 1;
    const isPatternChange = idx > 0 && fp !== fingerprints[idx - 1];

    return {
      measureIndex: idx,
      measureNumber,
      fingerprint: fp,
      isDuplicate,
      sourceMeasureNumber,
      occurrenceIndex,
      totalOccurrences,
      isPatternChange,
    };
  });
}
