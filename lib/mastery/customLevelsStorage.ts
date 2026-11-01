import {
  MasteryInstrument,
  MasterySkillNode,
  CustomLevelInput,
  InteractiveNoteStep,
  MasteryProgressState,
} from '@/types/mastery';
import { MASTERY_SKILL_NODES } from './masteryData';

export const MASTERY_TREE_STORAGE_KEY = 'soundlab_mastery_skills_tree_v2';
export const LEGACY_CUSTOM_LEVELS_KEY = 'soundlab_custom_mastery_nodes_v1';

/**
 * Obtiene el árbol completo de habilidades por instrumento.
 * Si es la primera vez, inicializa con los nodos de maestría por defecto más niveles personalizados previos.
 */
export function getMasterySkillsTree(): Record<MasteryInstrument, MasterySkillNode[]> {
  if (typeof window === 'undefined') {
    return {
      guitar: MASTERY_SKILL_NODES.guitar || [],
      piano: MASTERY_SKILL_NODES.piano || [],
      bass: MASTERY_SKILL_NODES.bass || [],
      drums: MASTERY_SKILL_NODES.drums || [],
    };
  }

  try {
    const raw = localStorage.getItem(MASTERY_TREE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          guitar: Array.isArray(parsed.guitar) ? parsed.guitar : MASTERY_SKILL_NODES.guitar,
          piano: Array.isArray(parsed.piano) ? parsed.piano : MASTERY_SKILL_NODES.piano,
          bass: Array.isArray(parsed.bass) ? parsed.bass : MASTERY_SKILL_NODES.bass,
          drums: Array.isArray(parsed.drums) ? parsed.drums : MASTERY_SKILL_NODES.drums,
        };
      }
    }

    // Inicializar fusionando predeterminados y cualquier custom legacy
    const legacyRaw = localStorage.getItem(LEGACY_CUSTOM_LEVELS_KEY);
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : {};

    const initialTree: Record<MasteryInstrument, MasterySkillNode[]> = {
      guitar: [...MASTERY_SKILL_NODES.guitar, ...(Array.isArray(legacy.guitar) ? legacy.guitar : [])].sort((a, b) => a.level - b.level),
      piano: [...MASTERY_SKILL_NODES.piano, ...(Array.isArray(legacy.piano) ? legacy.piano : [])].sort((a, b) => a.level - b.level),
      bass: [...MASTERY_SKILL_NODES.bass, ...(Array.isArray(legacy.bass) ? legacy.bass : [])].sort((a, b) => a.level - b.level),
      drums: [...MASTERY_SKILL_NODES.drums, ...(Array.isArray(legacy.drums) ? legacy.drums : [])].sort((a, b) => a.level - b.level),
    };

    localStorage.setItem(MASTERY_TREE_STORAGE_KEY, JSON.stringify(initialTree));
    return initialTree;
  } catch (err) {
    console.warn('Error reading mastery skills tree from localStorage:', err);
    return {
      guitar: MASTERY_SKILL_NODES.guitar || [],
      piano: MASTERY_SKILL_NODES.piano || [],
      bass: MASTERY_SKILL_NODES.bass || [],
      drums: MASTERY_SKILL_NODES.drums || [],
    };
  }
}

/**
 * Guarda el árbol completo de habilidades en localStorage.
 */
export function saveMasterySkillsTree(data: Record<MasteryInstrument, MasterySkillNode[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MASTERY_TREE_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving mastery skills tree to localStorage:', err);
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
 * Obtiene todas las habilidades para un instrumento
 */
export function getMergedSkillsForInstrument(
  instrument: MasteryInstrument,
  _customLevels?: MasterySkillNode[]
): MasterySkillNode[] {
  const tree = getMasterySkillsTree();
  return tree[instrument] || [];
}

/**
 * Añade un nivel a un instrumento
 */
export function addCustomMasteryLevel(
  instrument: MasteryInstrument,
  input: CustomLevelInput
): MasterySkillNode {
  const currentTree = getMasterySkillsTree();
  const list = [...(currentTree[instrument] || [])];

  const nextLevelNumber =
    input.level && input.level > 0
      ? input.level
      : list.length > 0
      ? Math.max(...list.map((s) => s.level)) + 1
      : 1;

  const generatedSteps = generateInteractiveStepsFromText(instrument, input.tabOrNotation);

  const newSkill: MasterySkillNode = {
    id: `level-${instrument}-lvl-${nextLevelNumber}-${Date.now()}`,
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
      description: input.description?.trim() || 'Micro-ejercicio creado en la ruta técnica.',
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

  list.push(newSkill);
  list.sort((a, b) => a.level - b.level);
  currentTree[instrument] = list;
  saveMasterySkillsTree(currentTree);

  return newSkill;
}

/**
 * Actualiza cualquier nivel de la ruta técnica (del Nivel 1 en adelante)
 */
export function updateCustomMasteryLevel(
  instrument: MasteryInstrument,
  skillId: string,
  input: Partial<CustomLevelInput>
): MasterySkillNode | null {
  const currentTree = getMasterySkillsTree();
  const list = currentTree[instrument] || [];
  const idx = list.findIndex((s) => s.id === skillId || s.level === Number(skillId));
  if (idx === -1) return null;

  const target = list[idx];
  const tabChanged = input.tabOrNotation && input.tabOrNotation !== target.microExercise.tabOrNotation;
  const interactiveSteps = tabChanged
    ? generateInteractiveStepsFromText(instrument, input.tabOrNotation!)
    : target.microExercise.interactiveSteps;

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
      interactiveSteps,
    },
  };

  list[idx] = updatedSkill;
  currentTree[instrument] = list;
  saveMasterySkillsTree(currentTree);
  return updatedSkill;
}

/**
 * Elimina cualquier nivel de la ruta técnica (Nivel 1 en adelante) y
 * REINDEXA automáticamente los niveles posteriores (el Nivel 4 pasa a ser 3, etc.)
 * recalculando el progreso del usuario sin corromperlo.
 */
export function deleteMasteryLevelAndReindex(
  instrument: MasteryInstrument,
  skillId: string,
  currentProgress: MasteryProgressState
): { updatedSkills: MasterySkillNode[]; updatedProgress: MasteryProgressState } {
  const currentTree = getMasterySkillsTree();
  const list = [...(currentTree[instrument] || [])];
  const targetIdx = list.findIndex((s) => s.id === skillId || s.level === Number(skillId));

  if (targetIdx === -1) {
    return { updatedSkills: list, updatedProgress: currentProgress };
  }

  const deletedLevelNumber = list[targetIdx].level;

  // 1. Remover el nodo de nivel
  list.splice(targetIdx, 1);

  // 2. Reindexación secuencial estricta: 1, 2, 3...
  for (let i = 0; i < list.length; i++) {
    list[i] = {
      ...list[i],
      level: i + 1,
    };
  }

  currentTree[instrument] = list;
  saveMasterySkillsTree(currentTree);

  // 3. Recalcular el progreso del usuario de forma coherente
  const instProgress = currentProgress[instrument] || {
    completedLevels: [],
    activeLevel: 1,
    cleanRepsCount: {},
    totalPracticeMinutes: 0,
  };

  // 3a. Niveles completados: descartar el eliminado y re-mapear niveles superiores
  const nextCompleted = instProgress.completedLevels
    .filter((lvl) => lvl !== deletedLevelNumber)
    .map((lvl) => (lvl > deletedLevelNumber ? lvl - 1 : lvl));
  const uniqueCompleted = Array.from(new Set(nextCompleted)).sort((a, b) => a - b);

  // 3b. Nivel activo: ajustar según la posición eliminada
  let nextActive = instProgress.activeLevel;
  if (instProgress.activeLevel > deletedLevelNumber) {
    nextActive = Math.max(1, instProgress.activeLevel - 1);
  } else if (instProgress.activeLevel === deletedLevelNumber) {
    const maxCompleted = uniqueCompleted.length > 0 ? Math.max(...uniqueCompleted) : 0;
    nextActive = Math.min(list.length || 1, maxCompleted + 1);
  } else {
    nextActive = Math.min(list.length || 1, instProgress.activeLevel);
  }

  // 3c. Repeticiones limpias (cleanRepsCount): reindexar claves numéricas
  const nextReps: Record<number, number> = {};
  if (instProgress.cleanRepsCount) {
    Object.entries(instProgress.cleanRepsCount).forEach(([k, reps]) => {
      const lvl = parseInt(k, 10);
      if (lvl < deletedLevelNumber) {
        nextReps[lvl] = reps;
      } else if (lvl > deletedLevelNumber) {
        nextReps[lvl - 1] = reps;
      }
    });
  }

  const nextProgressState: MasteryProgressState = {
    ...currentProgress,
    [instrument]: {
      ...instProgress,
      completedLevels: uniqueCompleted,
      activeLevel: nextActive,
      cleanRepsCount: nextReps,
    },
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('soundlab_mastery_v1', JSON.stringify(nextProgressState));
    } catch (_) {}
  }

  return {
    updatedSkills: list,
    updatedProgress: nextProgressState,
  };
}

/**
 * Función legacy para mantener compatibilidad
 */
export function getStoredCustomLevels(): Record<MasteryInstrument, MasterySkillNode[]> {
  const tree = getMasterySkillsTree();
  return {
    guitar: tree.guitar.filter((s) => s.isCustom),
    piano: tree.piano.filter((s) => s.isCustom),
    bass: tree.bass.filter((s) => s.isCustom),
    drums: tree.drums.filter((s) => s.isCustom),
  };
}

export function deleteCustomMasteryLevel(
  instrument: MasteryInstrument,
  skillId: string
): boolean {
  const currentTree = getMasterySkillsTree();
  const initialLength = currentTree[instrument].length;
  currentTree[instrument] = currentTree[instrument].filter((s) => s.id !== skillId);

  if (currentTree[instrument].length !== initialLength) {
    saveMasterySkillsTree(currentTree);
    return true;
  }
  return false;
}
