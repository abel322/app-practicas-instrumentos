/**
 * Utilidad de Detección de Compases Duplicados, Banco de Patrones (P1..Pn),
 * Subdivisiones Independientes por Patrón/Compás y Análisis de Secuencias Multi-Compás.
 * Ignora campos volátiles (id, createdAt) para generar una huella canónica exacta.
 */

export interface PatternSummary {
  code: string; // "P1", "P2", ...
  name: string; // Ej: "Paradiddle", "Patrón 1"
  color: string; // Clave de color ("cyan", "emerald", "amber", "violet", "rose", "sky", "orange", "fuchsia")
  timeSignature?: string; // Ej: '4/4', '6/8', '7/8', '3/4', etc.
  subdivision: string; // Ej: '1/16', '1/8T', '1/16T', '1/8', '1/4', '1/32', 'quintillo', 'septillo'
  stepsPerMeasure: number; // Ej: 16, 12, 24, 8, 4, 32, 20, 28
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
  timeSignature?: string;
  subdivision: string;
  stepsPerMeasure: number;
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

export function inferSubdivisionFromSteps(
  steps?: number,
  fallback: string = '1/16'
): string {
  if (steps === undefined || steps === null || isNaN(steps)) {
    return fallback;
  }
  switch (steps) {
    case 4:
      return '1/4';
    case 8:
      return '1/8';
    case 12:
      return '1/8T';
    case 16:
      return '1/16';
    case 20:
      return 'quintillo';
    case 24:
      return '1/16T';
    case 28:
      return 'septillo';
    case 32:
      return '1/32';
    default:
      return fallback;
  }
}

export function remapNotesToNewSubdivision(
  notes: any[],
  oldSteps: number,
  newSteps: number
): any[] {
  if (!Array.isArray(notes) || oldSteps === newSteps || oldSteps <= 0 || newSteps <= 0) {
    return Array.isArray(notes) ? notes : [];
  }
  const seen = new Set<string>();
  const remapped: any[] = [];

  for (const note of notes) {
    const rawStep =
      note.stepIndex !== undefined
        ? note.stepIndex
        : note.step !== undefined
          ? note.step % oldSteps
          : 0;
    const newStep = Math.min(
      newSteps - 1,
      Math.max(0, Math.round((rawStep / oldSteps) * newSteps))
    );
    const voiceKey =
      note.instrument ||
      note.drumVoice ||
      note.string ||
      note.midiNumber ||
      'snare';
    const key = `${voiceKey}::${newStep}`;
    if (!seen.has(key)) {
      seen.add(key);
      remapped.push({
        ...note,
        stepIndex: newStep,
        step: newStep,
      });
    }
  }
  return remapped;
}

export function computeMeasureFingerprint(measure: any): string {
  const rawNotes = measure?.notes || measure?.hits || [];
  const firstWithMeta = (Array.isArray(rawNotes) ? rawNotes : []).find(
    (n: any) => n?.stepsPerMeasure || n?.subdivision || n?.timeSignature
  );
  const mTimeSig = String(
    measure?.timeSignature || firstWithMeta?.timeSignature || '4/4'
  );
  const mSteps = Number(
    measure?.stepsPerMeasure || firstWithMeta?.stepsPerMeasure || 16
  );
  const mSub = String(
    measure?.subdivision ||
    firstWithMeta?.subdivision ||
    inferSubdivisionFromSteps(mSteps)
  );

  const activeNotes = (Array.isArray(rawNotes) ? rawNotes : [])
    .filter((n: any) => !n.isRest)
    .map((n: any) => {
      const inst = String(
        n.instrument || n.drumVoice || n.drumType || n.instrumentKey || 'snare'
      )
        .toLowerCase()
        .trim();
      const isKick = inst === 'kick' || inst === 'bombo';
      return {
        s: Number(n.stepIndex ?? (n.step !== undefined ? n.step : 0)),
        m: Number(n.midiNumber ?? 0),
        i: inst,
        k: isKick ? 'K' : String(n.sticking || '').toUpperCase().trim(),
        a: Boolean(n.accent),
        g: Boolean(n.ghost),
        sy: Boolean(n.syncopated),
        t: String(n.technique || ''),
      };
    })
    .sort(
      (a: any, b: any) =>
        a.s - b.s || a.m - b.m || a.i.localeCompare(b.i)
    );

  return `${mTimeSig}:${mSub}:${mSteps}::${JSON.stringify(activeNotes)}`;
}

export function analyzeMeasureDuplicates(
  measures: any[],
  defaultSubdivision: string = '1/16',
  defaultSteps: number = 16,
  defaultTimeSignature: string = '4/4'
): MeasureAnalysis[] {
  if (!Array.isArray(measures) || measures.length === 0) return [];

  const fingerprints = measures.map((m) => computeMeasureFingerprint(m));
  const totalCounts = new Map<string, number>();
  fingerprints.forEach((fp) =>
    totalCounts.set(fp, (totalCounts.get(fp) || 0) + 1)
  );

  const firstSeenMeasure = new Map<string, number>();
  const autoCodeByFp = new Map<
    string,
    {
      code: string;
      name: string;
      color: string;
      timeSignature: string;
      subdivision: string;
      stepsPerMeasure: number;
    }
  >();
  const seenSoFar = new Map<string, number>();
  let autoCounter = 1;

  // Asignar códigos P1, P2... si no vienen guardados explícitamente
  measures.forEach((m, idx) => {
    const fp = fingerprints[idx];
    const firstNoteWithMeta = (m?.notes || m?.hits || []).find(
      (n: any) => n?.patternCode || n?.subdivision || n?.stepsPerMeasure || n?.timeSignature
    );
    const explicitCode = m?.patternCode || firstNoteWithMeta?.patternCode;
    const explicitName = m?.patternName || firstNoteWithMeta?.patternName;
    const explicitColor = m?.patternColor || firstNoteWithMeta?.patternColor;
    const explicitTimeSig =
      m?.timeSignature || firstNoteWithMeta?.timeSignature || defaultTimeSignature;
    const explicitSteps = Number(
      m?.stepsPerMeasure || firstNoteWithMeta?.stepsPerMeasure || defaultSteps
    );
    const explicitSub =
      m?.subdivision ||
      firstNoteWithMeta?.subdivision ||
      inferSubdivisionFromSteps(explicitSteps, defaultSubdivision);

    if (!autoCodeByFp.has(fp)) {
      const code = explicitCode || `P${autoCounter}`;
      const name = explicitName || `Patrón ${autoCounter}`;
      const color =
        explicitColor ||
        PATTERN_PALETTE[(autoCounter - 1) % PATTERN_PALETTE.length].key;
      autoCodeByFp.set(fp, {
        code,
        name,
        color,
        timeSignature: explicitTimeSig,
        subdivision: explicitSub,
        stepsPerMeasure: explicitSteps,
      });
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
      (n: any) => n?.patternCode || n?.subdivision || n?.stepsPerMeasure || n?.timeSignature
    );
    const autoInfo = autoCodeByFp.get(fp)!;
    const patternCode =
      m?.patternCode || firstNoteWithMeta?.patternCode || autoInfo.code;
    const patternName =
      m?.patternName || firstNoteWithMeta?.patternName || autoInfo.name;
    const patternColor =
      m?.patternColor || firstNoteWithMeta?.patternColor || autoInfo.color;
    const timeSignature =
      m?.timeSignature || firstNoteWithMeta?.timeSignature || autoInfo.timeSignature || defaultTimeSignature;
    const stepsPerMeasure = Number(
      m?.stepsPerMeasure ||
      firstNoteWithMeta?.stepsPerMeasure ||
      autoInfo.stepsPerMeasure ||
      defaultSteps
    );
    const subdivision =
      m?.subdivision ||
      firstNoteWithMeta?.subdivision ||
      inferSubdivisionFromSteps(
        stepsPerMeasure,
        autoInfo.subdivision || defaultSubdivision
      );

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
      timeSignature,
      subdivision,
      stepsPerMeasure,
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
  measures: any[],
  defaultSubdivision: string = '1/16',
  defaultSteps: number = 16,
  defaultTimeSignature: string = '4/4'
): PatternSummary[] {
  const analysis = analyzeMeasureDuplicates(
    measures,
    defaultSubdivision,
    defaultSteps,
    defaultTimeSignature
  );
  const bankMap = new Map<string, PatternSummary>();

  analysis.forEach((item, idx) => {
    const key = `${item.patternCode}::${item.fingerprint}`;
    if (!bankMap.has(key)) {
      const rawNotes = measures[idx]?.notes || measures[idx]?.hits || [];
      bankMap.set(key, {
        code: item.patternCode,
        name: item.patternName,
        color: item.patternColor,
        timeSignature: item.timeSignature || defaultTimeSignature,
        subdivision: item.subdivision,
        stepsPerMeasure: item.stepsPerMeasure,
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
