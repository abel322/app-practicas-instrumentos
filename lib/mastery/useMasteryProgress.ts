'use client';

import { useState, useEffect, useCallback } from 'react';
import { MasteryInstrument, MasteryProgressState } from '@/types/mastery';

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
    } catch (e) {
      console.warn('Error reading mastery state from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar en localStorage cada vez que cambia
  const saveState = useCallback((nextState: MasteryProgressState) => {
    setProgress(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {
      console.warn('Error saving mastery state to localStorage:', e);
    }
  }, []);

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

      const nextLevel = Math.min(10, level + 1);

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
    [progress, saveState]
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

  return {
    progress,
    isLoaded,
    isLevelUnlocked,
    isLevelCompleted,
    graduateLevel,
    incrementCleanRep,
    resetReps,
    resetInstrumentProgress,
  };
}

