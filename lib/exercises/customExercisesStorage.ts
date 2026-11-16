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

/**
 * Sincroniza todos los ejercicios almacenados previamente en localStorage
 * hacia la base de datos PostgreSQL mediante el endpoint de la API.
 */
export async function syncLocalExercisesToDb(): Promise<{ synced: number; total: number }> {
  if (typeof window === 'undefined') return { synced: 0, total: 0 };
  const localList = getLocalExercises();
  if (!localList || localList.length === 0) return { synced: 0, total: 0 };

  const deletedSlugs = getDeletedExerciseSlugs();
  const eligible = localList.filter((e) => !deletedSlugs.includes(e.slug));
  if (eligible.length === 0) return { synced: 0, total: 0 };

  let synced = 0;
  for (const item of eligible) {
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          instrumentType: item.instrumentType || (item.instrument === 'drums' ? 'drums' : item.instrument === 'piano' ? 'piano' : item.instrument === 'bass_4' ? 'bass' : 'guitar'),
          data: item.hitsData || item.tabData || item.notesData || item.data || [],
          measures: item.measures,
          patternBank: item.patternBank,
        }),
      });
      if (res.ok) {
        synced++;
      }
    } catch (e) {
      console.warn(`[Sync] Error sincronizando ${item.slug} a la base de datos:`, e);
    }
  }

  return { synced, total: eligible.length };
}

