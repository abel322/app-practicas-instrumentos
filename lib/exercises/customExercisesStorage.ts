'use client';

export const LOCAL_EXERCISES_KEY = 'soundlab_custom_exercises';
export const DELETED_EXERCISES_KEY = 'soundlab_deleted_exercises';

export function getDeletedExerciseSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_EXERCISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Error reading deleted exercises:', e);
    return [];
  }
}

export function markExerciseAsDeleted(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedExerciseSlugs();
    if (!current.includes(slug)) {
      current.push(slug);
      localStorage.setItem(DELETED_EXERCISES_KEY, JSON.stringify(current));
    }
    // También remover de ejercicios personalizados locales si estuviera ahí
    deleteLocalExercise(slug);
  } catch (e) {
    console.warn('Error saving deleted exercise:', e);
  }
}

export function getLocalExercises(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_EXERCISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Error reading local custom exercises:', e);
    return [];
  }
}

export function saveLocalExercise(exercise: any): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalExercises();
    const idx = list.findIndex((e) => e.slug === exercise.slug);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...exercise };
    } else {
      list.unshift(exercise);
    }
    localStorage.setItem(LOCAL_EXERCISES_KEY, JSON.stringify(list));

    // Si estaba marcado como eliminado anteriormente, quitarlo
    const deleted = getDeletedExerciseSlugs().filter((s) => s !== exercise.slug);
    localStorage.setItem(DELETED_EXERCISES_KEY, JSON.stringify(deleted));
  } catch (e) {
    console.warn('Error saving local exercise:', e);
  }
}

export function deleteLocalExercise(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalExercises().filter((e) => e.slug !== slug);
    localStorage.setItem(LOCAL_EXERCISES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error removing local exercise:', e);
  }
}

