import { MasteryInstrument, MasterySkillNode, CustomLevelInput, InteractiveNoteStep } from '@/types/mastery';
import { MASTERY_SKILL_NODES } from './masteryData';

const CUSTOM_LEVELS_STORAGE_KEY = 'soundlab_custom_mastery_nodes_v1';

export function getStoredCustomLevels(): Record<MasteryInstrument, MasterySkillNode[]> {
  if (typeof window === 'undefined') {
    return { guitar: [], piano: [], bass: [], drums: [] };
  }
  try {
    const raw = localStorage.getItem(CUSTOM_LEVELS_STORAGE_KEY);
    if (!raw) return { guitar: [], piano: [], bass: [], drums: [] };
    const parsed = JSON.parse(raw);
    return {
      guitar: Array.isArray(parsed.guitar) ? parsed.guitar : [],
      piano: Array.isArray(parsed.piano) ? parsed.piano : [],
      bass: Array.isArray(parsed.bass) ? parsed.bass : [],
      drums: Array.isArray(parsed.drums) ? parsed.drums : [],
    };
  } catch (err) {
    console.warn('Error reading custom mastery levels from localStorage:', err);
    return { guitar: [], piano: [], bass: [], drums: [] };
  }
}

export function saveStoredCustomLevels(data: Record<MasteryInstrument, MasterySkillNode[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_LEVELS_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving custom mastery levels to localStorage:', err);
  }
}

/**
 * Genera pasos interactivos a partir de texto o tablatura simple
 */
export function generateInteractiveStepsFromText(
  instrument: MasteryInstrument,
  tabOrNotation: string
): InteractiveNoteStep[] {
  const steps: InteractiveNoteStep[] = [];
  const lines = tabOrNotation.split('\n').filter((l) => l.trim().length > 0);

  // Intentar extraer números o notas
  const tokens = tabOrNotation
    .replace(/[|:\-\[\]]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !['e', 'B', 'G', 'D', 'A', 'E', 'MD', 'MI', 'SD', 'HH', 'BD'].includes(t))
    .slice(0, 16);

  if (tokens.length >= 4) {
    tokens.forEach((token, idx) => {
      steps.push({
        step: idx,
        label: token,
        stringOrHand: instrument === 'piano' ? 'MD' : instrument === 'drums' ? 'SD' : '1ª',
        fretOrKey: token,
        finger: `${(idx % 4) + 1}`,
        pickDirection: idx % 2 === 0 ? 'down' : 'up',
        accent: idx === 0 || idx % 4 === 0,
      });
    });
    return steps;
  }

  // Fallback con 8 pasos estándar
  for (let i = 0; i < 8; i++) {
    steps.push({
      step: i,
      label: `Nota ${i + 1}`,
      stringOrHand: instrument === 'piano' ? 'MD' : 'Pos. V',
      fretOrKey: i + 5,
      finger: `${(i % 4) + 1}`,
      pickDirection: i % 2 === 0 ? 'down' : 'up',
      accent: i === 0,
    });
  }
  return steps;
}

/**
 * Obtiene todas las habilidades para un instrumento (predeterminadas + personalizadas ordenadas por nivel)
 */
export function getMergedSkillsForInstrument(
  instrument: MasteryInstrument,
  customLevels?: MasterySkillNode[]
): MasterySkillNode[] {
  const defaultList = MASTERY_SKILL_NODES[instrument] || [];
  const customList = customLevels || getStoredCustomLevels()[instrument] || [];

  const combined = [...defaultList, ...customList];
  // Ordenar por número de nivel
  return combined.sort((a, b) => a.level - b.level);
}

/**
 * Añade un nivel personalizado a un instrumento
 */
export function addCustomMasteryLevel(
  instrument: MasteryInstrument,
  input: CustomLevelInput
): MasterySkillNode {
  const currentStored = getStoredCustomLevels();
  const allCurrent = getMergedSkillsForInstrument(instrument, currentStored[instrument]);

  // Si no se especificó nivel, asignar el siguiente al más alto
  const nextLevelNumber =
    input.level && input.level > 0
      ? input.level
      : allCurrent.length > 0
      ? Math.max(...allCurrent.map((s) => s.level)) + 1
      : 11;

  const generatedSteps = generateInteractiveStepsFromText(instrument, input.tabOrNotation);

  const newSkill: MasterySkillNode = {
    id: `custom-${instrument}-lvl-${nextLevelNumber}-${Date.now()}`,
    instrument,
    level: nextLevelNumber,
    title: input.title.trim() || `Técnica Personalizada Nivel ${nextLevelNumber}`,
    technique: input.technique?.trim() || input.title.trim() || 'Técnica Avanzada de Estudio',
    category: input.category?.trim() || 'Nivel Personalizado (Studio)',
    difficultyLabel: input.difficultyLabel || 'Avanzado',
    badgeColor: 'rose',
    initialBpm: input.initialBpm || 80,
    targetBpm: input.targetBpm || 110,
    subdivision: input.subdivision || '1/16',
    subdivisionNote: input.subdivisionNote || 'Semicorcheas (4 notas por pulso)',
    timeSignature: '4/4',
    passCriterion:
      input.passCriterion?.trim() ||
      `3 repeticiones limpias consecutivas a ${input.targetBpm || 110} BPM sin errores métricos.`,
    targetReps: input.targetReps || 3,
    warmupBpm: Math.round((input.targetBpm || 110) * 0.75),
    microExercise: {
      title: input.microExerciseTitle?.trim() || input.title.trim(),
      tabOrNotation: input.tabOrNotation.trim(),
      description: input.description?.trim() || 'Micro-ejercicio compuesto por el usuario en Studio Builder.',
      fingering: 'Digitación personalizada',
      techniqueKey: 'custom_studio_exercise',
      instructions: [
        'Ejecuta con metrónomo a tempo inicial y sube gradualmente hasta la velocidad meta.',
        'Asegura la relajación muscular en hombros y muñeca.',
      ],
      interactiveSteps: generatedSteps,
    },
    proTips: [
      'Mantén la postura ergonómica y el tempo inmutable durante cada repetición.',
    ],
    anatomicalFocus: 'Economía de movimiento y respiración fluida en cada ciclo.',
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  currentStored[instrument] = [...currentStored[instrument], newSkill];
  saveStoredCustomLevels(currentStored);

  return newSkill;
}

/**
 * Actualiza un nivel personalizado
 */
export function updateCustomMasteryLevel(
  instrument: MasteryInstrument,
  skillId: string,
  input: Partial<CustomLevelInput>
): MasterySkillNode | null {
  const currentStored = getStoredCustomLevels();
  const list = currentStored[instrument];
  const idx = list.findIndex((s) => s.id === skillId);
  if (idx === -1) return null;

  const target = list[idx];
  const updatedSkill: MasterySkillNode = {
    ...target,
    title: input.title !== undefined ? input.title.trim() : target.title,
    technique: input.technique !== undefined ? input.technique.trim() : target.technique,
    category: input.category !== undefined ? input.category.trim() : target.category,
    difficultyLabel: input.difficultyLabel || target.difficultyLabel,
    initialBpm: input.initialBpm || target.initialBpm,
    targetBpm: input.targetBpm || target.targetBpm,
    targetReps: input.targetReps || target.targetReps,
    subdivision: input.subdivision || target.subdivision,
    passCriterion: input.passCriterion || target.passCriterion,
    microExercise: {
      ...target.microExercise,
      title: input.microExerciseTitle || target.microExercise.title,
      tabOrNotation: input.tabOrNotation || target.microExercise.tabOrNotation,
      description: input.description || target.microExercise.description,
    },
  };

  list[idx] = updatedSkill;
  saveStoredCustomLevels(currentStored);
  return updatedSkill;
}

/**
 * Elimina un nivel personalizado
 */
export function deleteCustomMasteryLevel(
  instrument: MasteryInstrument,
  skillId: string
): boolean {
  const currentStored = getStoredCustomLevels();
  const initialLength = currentStored[instrument].length;
  currentStored[instrument] = currentStored[instrument].filter((s) => s.id !== skillId);

  if (currentStored[instrument].length !== initialLength) {
    saveStoredCustomLevels(currentStored);
    return true;
  }
  return false;
}

