'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MasteryInstrument,
  MasteryProgressState,
  MasterySkillNode,
  CustomLevelInput,
} from '@/types/mastery';
import {
  getStoredCustomLevels,
  getMergedSkillsForInstrument,
  addCustomMasteryLevel,
  updateCustomMasteryLevel,
  deleteCustomMasteryLevel,
} from './customLevelsStorage';

const STORAGE_KEY = 'soundlab_mastery_v1';

const INITIAL_STATE: MasteryProgressState = {
  guitar: {
    completedLevels: [],
    activeLevel: 1,
    cleanRepsCount: {},
    totalPracticeMinutes: 0,
  },
  piano: {
    completedLevels: [],
    activeLevel: 1,
    cleanRepsCount: {},
    totalPracticeMinutes: 0,
  },
  bass: {
    completedLevels: [],
    activeLevel: 1,
    cleanRepsCount: {},
    totalPracticeMinutes: 0,
  },
  drums: {
    completedLevels: [],
    activeLevel: 1,
    cleanRepsCount: {},
    totalPracticeMinutes: 0,
  },
};

export function useMasteryProgress() {
  const [progress, setProgress] = useState<MasteryProgressState>(INITIAL_STATE);
  const [customLevels, setCustomLevels] = useState<Record<MasteryInstrument, MasterySkillNode[]>>({
    guitar: [],
    piano: [],
    bass: [],
    drums: [],
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Cargar de localStorage en el cliente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProgress({
          guitar: { ...INITIAL_STATE.guitar, ...(parsed.guitar || {}) },
          piano: { ...INITIAL_STATE.piano, ...(parsed.piano || {}) },
          bass: { ...INITIAL_STATE.bass, ...(parsed.bass || {}) },
          drums: { ...INITIAL_STATE.drums, ...(parsed.drums || {}) },
        });
      }
      setCustomLevels(getStoredCustomLevels());
    } catch (e) {
      console.warn('Error reading mastery state from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar en localStorage cada vez que cambia el progreso
  const saveState = useCallback((nextState: MasteryProgressState) => {
    setProgress(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {
      console.warn('Error saving mastery state to localStorage:', e);
    }
  }, []);

  // Obtener lista completa de habilidades para un instrumento
  const getSkills = useCallback(
    (instrument: MasteryInstrument): MasterySkillNode[] => {
      return getMergedSkillsForInstrument(instrument, customLevels[instrument]);
    },
    [customLevels]
  );

  // Verificar si un nivel está desbloqueado
  const isLevelUnlocked = useCallback(
    (instrument: MasteryInstrument, level: number): boolean => {
      if (level === 1) return true;
      const instData = progress[instrument];
      if (!instData) return false;
      return instData.completedLevels.includes(level - 1);
    },
    [progress]
  );

  // Verificar si un nivel está completado
  const isLevelCompleted = useCallback(
    (instrument: MasteryInstrument, level: number): boolean => {
      const instData = progress[instrument];
      return instData?.completedLevels?.includes(level) ?? false;
    },
    [progress]
  );

  // Graduar y validar nivel
  const graduateLevel = useCallback(
    (instrument: MasteryInstrument, level: number) => {
      const instData = progress[instrument];
      const completed = new Set(instData.completedLevels);
      completed.add(level);

      const allSkills = getMergedSkillsForInstrument(instrument, customLevels[instrument]);
      const maxAvailableLevel = allSkills.length > 0 ? Math.max(...allSkills.map((s) => s.level)) : 10;
      const nextLevel = Math.min(maxAvailableLevel, level + 1);

      const nextState: MasteryProgressState = {
        ...progress,
        [instrument]: {
          ...instData,
          completedLevels: Array.from(completed).sort((a, b) => a - b),
          activeLevel: Math.max(instData.activeLevel, nextLevel),
          cleanRepsCount: {
            ...instData.cleanRepsCount,
            [level]: 3,
          },
          lastTrainedAt: new Date().toISOString(),
          totalPracticeMinutes: instData.totalPracticeMinutes + 15,
        },
      };

      saveState(nextState);
    },
    [progress, customLevels, saveState]
  );

  // Incrementar repetición limpia
  const incrementCleanRep = useCallback(
    (instrument: MasteryInstrument, level: number, targetReps: number = 3): number => {
      const instData = progress[instrument];
      const current = instData.cleanRepsCount[level] || 0;
      const nextReps = Math.min(targetReps, current + 1);

      const nextState: MasteryProgressState = {
        ...progress,
        [instrument]: {
          ...instData,
          cleanRepsCount: {
            ...instData.cleanRepsCount,
            [level]: nextReps,
          },
        },
      };

      saveState(nextState);
      return nextReps;
    },
    [progress, saveState]
  );

  // Resetear repeticiones de un nivel
  const resetReps = useCallback(
    (instrument: MasteryInstrument, level: number) => {
      const instData = progress[instrument];
      const nextState: MasteryProgressState = {
        ...progress,
        [instrument]: {
          ...instData,
          cleanRepsCount: {
            ...instData.cleanRepsCount,
            [level]: 0,
          },
        },
      };
      saveState(nextState);
    },
    [progress, saveState]
  );

  // Reiniciar progreso de un instrumento
  const resetInstrumentProgress = useCallback(
    (instrument: MasteryInstrument) => {
      const nextState: MasteryProgressState = {
        ...progress,
        [instrument]: {
          completedLevels: [],
          activeLevel: 1,
          cleanRepsCount: {},
          totalPracticeMinutes: 0,
          lastTrainedAt: undefined,
        },
      };
      saveState(nextState);
    },
    [progress, saveState]
  );

  // Añadir nivel personalizado
  const addCustomLevel = useCallback(
    (instrument: MasteryInstrument, input: CustomLevelInput): MasterySkillNode => {
      const created = addCustomMasteryLevel(instrument, input);
      setCustomLevels(getStoredCustomLevels());
      return created;
    },
    []
  );

  // Editar nivel personalizado
  const editCustomLevel = useCallback(
    (
      instrument: MasteryInstrument,
      skillId: string,
      input: Partial<CustomLevelInput>
    ): MasterySkillNode | null => {
      const updated = updateCustomMasteryLevel(instrument, skillId, input);
      if (updated) {
        setCustomLevels(getStoredCustomLevels());
      }
      return updated;
    },
    []
  );

  // Eliminar nivel personalizado
  const deleteCustomLevel = useCallback(
    (instrument: MasteryInstrument, skillId: string): boolean => {
      const ok = deleteCustomMasteryLevel(instrument, skillId);
      if (ok) {
        setCustomLevels(getStoredCustomLevels());
      }
      return ok;
    },
    []
  );

  return {
    progress,
    customLevels,
    isLoaded,
    getSkills,
    isLevelUnlocked,
    isLevelCompleted,
    graduateLevel,
    incrementCleanRep,
    resetReps,
    resetInstrumentProgress,
    addCustomLevel,
    editCustomLevel,
    deleteCustomLevel,
  };
}
