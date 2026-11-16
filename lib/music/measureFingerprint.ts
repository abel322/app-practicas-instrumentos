/**
 * Utilidad de Detección de Compases Duplicados, Banco de Patrones (P1..Pn)
 * y Análisis de Secuencias Multi-Compás.
 * Ignora campos volátiles (id, createdAt) para generar una huella canónica exacta.
 */

export interface PatternSummary {
  code: string; // "P1", "P2", ...
  name: string; // Ej: "Paradiddle", "Patrón 1"
  color: string; // Clave de color ("cyan", "emerald", "amber", "violet", "rose", "sky", "orange", "fuchsia")
  sampleMeasureIndex: number;
  usageCount: number;
  notes: any[];
}

export interface MeasureAnalysis {
  measureIndex: number;
  measureNumber: number;
  patternCode: string;
  patternName: string;
  patternColor: string;
  fingerprint: string;
  isDuplicate: boolean;
  sourceMeasureNumber: number;
  occurrenceIndex: number;
  totalOccurrences: number;
  isPatternChange: boolean;
  isSamePatternAsNext: boolean;
}

export const PATTERN_PALETTE = [
  {
    key: 'cyan',
    label: 'Cian',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    dot: '#22d3ee',
  },
  {
    key: 'emerald',
    label: 'Esmeralda',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    dot: '#34d399',
  },
  {
    key: 'amber',
    label: 'Ámbar',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    dot: '#fbbf24',
  },
  {
    key: 'violet',
    label: 'Violeta',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/50',
    dot: '#a78bfa',
  },
  {
    key: 'rose',
    label: 'Rosa',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    dot: '#fb7185',
  },
  {
    key: 'sky',
    label: 'Azul',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
    dot: '#38bdf8',
  },
  {
    key: 'orange',
    label: 'Naranja',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    dot: '#fb923c',
  },
  {
    key: 'fuchsia',
    label: 'Fucsia',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50',
    dot: '#e879f9',
  },
];

export function getPatternStyle(colorKey?: string) {
  return PATTERN_PALETTE.find((c) => c.key === colorKey) || PATTERN_PALETTE[0];
}

export function computeMeasureFingerprint(measure: any): string {
  const rawNotes = measure?.notes || measure?.hits || [];
  const activeNotes = (Array.isArray(rawNotes) ? rawNotes : [])
    .filter((n: any) => !n.isRest)
    .map((n: any) => ({
      s: Number(n.stepIndex ?? (n.step !== undefined ? n.step : 0)),
      m: Number(n.midiNumber ?? 0),
      i: String(
        n.instrument || n.drumVoice || n.drumType || n.instrumentKey || 'snare'
      )
        .toLowerCase()
        .trim(),
      k: String(n.sticking || '').toUpperCase().trim(),
      a: Boolean(n.accent),
      t: String(n.technique || ''),
    }))
    .sort(
      (a: any, b: any) =>
        a.s - b.s || a.m - b.m || a.i.localeCompare(b.i)
    );

  return JSON.stringify(activeNotes);
}

export function analyzeMeasureDuplicates(measures: any[]): MeasureAnalysis[] {
  if (!Array.isArray(measures) || measures.length === 0) return [];

  const fingerprints = measures.map((m) => computeMeasureFingerprint(m));
  const totalCounts = new Map<string, number>();
  fingerprints.forEach((fp) =>
    totalCounts.set(fp, (totalCounts.get(fp) || 0) + 1)
  );

  const firstSeenMeasure = new Map<string, number>();
  const autoCodeByFp = new Map<
    string,
    { code: string; name: string; color: string }
  >();
  const seenSoFar = new Map<string, number>();
  let autoCounter = 1;

  // Asignar códigos P1, P2... si no vienen guardados explícitamente
  measures.forEach((m, idx) => {
    const fp = fingerprints[idx];
    const firstNoteWithMeta = (m?.notes || m?.hits || []).find(
      (n: any) => n?.patternCode
    );
    const explicitCode = m?.patternCode || firstNoteWithMeta?.patternCode;
    const explicitName = m?.patternName || firstNoteWithMeta?.patternName;
    const explicitColor = m?.patternColor || firstNoteWithMeta?.patternColor;

    if (!autoCodeByFp.has(fp)) {
      const code = explicitCode || `P${autoCounter}`;
      const name = explicitName || `Patrón ${autoCounter}`;
      const color =
        explicitColor ||
        PATTERN_PALETTE[(autoCounter - 1) % PATTERN_PALETTE.length].key;
      autoCodeByFp.set(fp, { code, name, color });
      autoCounter++;
    }
  });

  const base = fingerprints.map((fp, idx) => {
    const m = measures[idx];
    const measureNumber = idx + 1;
    if (!firstSeenMeasure.has(fp)) {
      firstSeenMeasure.set(fp, measureNumber);
    }
    const occurrenceIndex = (seenSoFar.get(fp) || 0) + 1;
    seenSoFar.set(fp, occurrenceIndex);

    const firstNoteWithMeta = (m?.notes || m?.hits || []).find(
      (n: any) => n?.patternCode
    );
    const autoInfo = autoCodeByFp.get(fp)!;
    const patternCode =
      m?.patternCode || firstNoteWithMeta?.patternCode || autoInfo.code;
    const patternName =
      m?.patternName || firstNoteWithMeta?.patternName || autoInfo.name;
    const patternColor =
      m?.patternColor || firstNoteWithMeta?.patternColor || autoInfo.color;

    const sourceMeasureNumber = firstSeenMeasure.get(fp)!;
    const totalOccurrences = totalCounts.get(fp) || 1;
    const isDuplicate = occurrenceIndex > 1;
    const isPatternChange =
      idx > 0 &&
      (fp !== fingerprints[idx - 1] ||
        patternCode !==
          (measures[idx - 1]?.patternCode ||
            (measures[idx - 1]?.notes || measures[idx - 1]?.hits || []).find(
              (n: any) => n?.patternCode
            )?.patternCode ||
            autoCodeByFp.get(fingerprints[idx - 1])?.code));

    return {
      measureIndex: idx,
      measureNumber,
      patternCode,
      patternName,
      patternColor,
      fingerprint: fp,
      isDuplicate,
      sourceMeasureNumber,
      occurrenceIndex,
      totalOccurrences,
      isPatternChange,
      isSamePatternAsNext: false,
    };
  });

  return base.map((item, idx) => ({
    ...item,
    isSamePatternAsNext:
      idx < base.length - 1 &&
      base[idx + 1].fingerprint === item.fingerprint &&
      base[idx + 1].patternCode === item.patternCode,
  }));
}

export function extractPatternBankFromMeasures(
  measures: any[]
): PatternSummary[] {
  const analysis = analyzeMeasureDuplicates(measures);
  const bankMap = new Map<string, PatternSummary>();

  analysis.forEach((item, idx) => {
    const key = `${item.patternCode}::${item.fingerprint}`;
    if (!bankMap.has(key)) {
      const rawNotes = measures[idx]?.notes || measures[idx]?.hits || [];
      bankMap.set(key, {
        code: item.patternCode,
        name: item.patternName,
        color: item.patternColor,
        sampleMeasureIndex: idx,
        usageCount: 1,
        notes: JSON.parse(JSON.stringify(rawNotes)),
      });
    } else {
      bankMap.get(key)!.usageCount += 1;
    }
  });

  return Array.from(bankMap.values());
}
