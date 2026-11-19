'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Si se ejecuta fuera del contexto de una petición Next.js, ignorar de forma segura
  }
}

export interface SaveExercisePayload {
  id?: string;
  slug?: string;
  instrumentType: 'drums' | 'bass' | 'guitar' | 'piano';
  title: string;
  category: string;
  difficulty: string;
  bpm: number;
  timeSignature: string;
  totalMeasures: number;
  stepsPerMeasure: number;
  subdivision?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  measures?: any[];
  patternBank?: any[];
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .replace(/\s+/g, '-')           // Espacios a guiones
    .replace(/[^\w\-]+/g, '')       // Elimina caracteres especiales
    .replace(/\-\-+/g, '-')         // Múltiples guiones a uno
    .replace(/^-+/, '')             // Quita guiones iniciales
    .replace(/-+$/, '');            // Quita guiones finales
}

export async function saveExerciseAction(formData: SaveExercisePayload) {
  try {
    if (!formData.title || formData.title.trim().length === 0) {
      return { success: false, error: 'El título del ejercicio es obligatorio.' };
    }

    const baseSlug = formData.slug ? formData.slug.trim() : slugify(formData.title) || `ejercicio-${Date.now()}`;
    const totalSteps = formData.totalMeasures * formData.stepsPerMeasure;

    if (formData.instrumentType === 'drums') {
      let slug = baseSlug;

      const hitsPayload = {
        hits: Array.isArray(formData.data) ? formData.data : [],
        data: Array.isArray(formData.data) ? formData.data : [],
        measures: Array.isArray(formData.measures) ? formData.measures : [],
        patternBank: Array.isArray(formData.patternBank) ? formData.patternBank : [],
      };

      if (formData.id || formData.slug) {
        // Modo edición o sobreescritura
        const existing = await prisma.drumExercise
          .findFirst({
            where: {
              OR: [
                ...(formData.id ? [{ id: formData.id }] : []),
                ...(formData.slug ? [{ slug: formData.slug }] : []),
              ],
            },
          })
          .catch(() => null);

        if (existing) {
          const updated = await prisma.drumExercise.update({
            where: { id: existing.id },
            data: {
              title: formData.title.trim(),
              instrument: 'drums',
              category: formData.category,
              difficulty: formData.difficulty,
              bpmDefault: Number(formData.bpm) || 100,
              timeSignature: formData.timeSignature,
              subdivision: formData.subdivision || '1/16',
              stepsPerMeasure: formData.stepsPerMeasure || (formData.timeSignature === '6/8' ? 12 : 16),
              totalSteps: totalSteps,
              hitsData: hitsPayload,
            },
          });

          safeRevalidatePath('/');
          safeRevalidatePath('/drums');
          safeRevalidatePath(`/practice/${updated.slug}`);
          safeRevalidatePath(`/drums/practice/${updated.slug}`);

          return {
            success: true,
            id: updated.id,
            slug: updated.slug,
            instrument: 'drums',
            url: `/practice/${updated.slug}`,
            isUpdate: true,
          };
        }
      }

      // Si no existe o no tiene slug/id previo, verificar colisión
      const existingCollision = await prisma.drumExercise.findUnique({ where: { slug } }).catch(() => null);
      if (existingCollision) {
        slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const exercise = await prisma.drumExercise.create({
        data: {
          slug,
          title: formData.title.trim(),
          instrument: 'drums',
          category: formData.category,
          difficulty: formData.difficulty,
          bpmDefault: Number(formData.bpm) || 100,
          timeSignature: formData.timeSignature,
          subdivision: formData.subdivision || '1/16',
          stepsPerMeasure: formData.stepsPerMeasure || (formData.timeSignature === '6/8' ? 12 : 16),
          totalSteps: totalSteps,
          hitsData: hitsPayload,
        },
      });

      // Revalidar rutas para que aparezca de inmediato en el catálogo y reproductor
      safeRevalidatePath('/');
      safeRevalidatePath('/drums');
      safeRevalidatePath(`/practice/${exercise.slug}`);
      safeRevalidatePath(`/drums/practice/${exercise.slug}`);

      return {
        success: true,
        id: exercise.id,
        slug: exercise.slug,
        instrument: 'drums',
        url: `/practice/${exercise.slug}`,
        isUpdate: false,
      };
    } else {
      // Guardar en tabla StringExercise (Bajo, Guitarra o Piano)
      const instrument =
        formData.instrumentType === 'piano'
          ? 'piano'
          : formData.instrumentType === 'bass'
          ? 'bass_4'
          : 'guitar_6';
      const tuning =
        formData.instrumentType === 'piano'
          ? '88 Keys Standard'
          : formData.instrumentType === 'bass'
          ? 'E A D G'
          : 'E A D G B E';

      const tabPayload = {
        tabNotes: Array.isArray(formData.data) ? formData.data : [],
        notes: Array.isArray(formData.data) ? formData.data : [],
        data: Array.isArray(formData.data) ? formData.data : [],
        measures: Array.isArray(formData.measures) ? formData.measures : [],
        patternBank: Array.isArray(formData.patternBank) ? formData.patternBank : [],
      };

      if (formData.id || formData.slug) {
        // Modo edición o sobreescritura
        const existing = await prisma.stringExercise
          .findFirst({
            where: {
              OR: [
                ...(formData.id ? [{ id: formData.id }] : []),
                ...(formData.slug ? [{ slug: formData.slug }] : []),
              ],
            },
          })
          .catch(() => null);

        if (existing) {
          const updated = await prisma.stringExercise.update({
            where: { id: existing.id },
            data: {
              title: formData.title.trim(),
              instrument,
              tuning,
              category: formData.category,
              difficulty: formData.difficulty,
              bpmDefault: Number(formData.bpm) || 90,
              timeSignature: formData.timeSignature,
              subdivision: formData.subdivision || '1/16',
              stepsPerMeasure: formData.stepsPerMeasure || (formData.timeSignature === '6/8' ? 12 : 16),
              totalSteps: totalSteps,
              tabData: tabPayload,
            },
          });

          const isPiano = formData.instrumentType === 'piano';
          const targetPracticeUrl = isPiano
            ? `/piano/practice/${updated.slug}`
            : `/strings/practice/${updated.slug}`;

          safeRevalidatePath('/');
          if (isPiano) {
            safeRevalidatePath('/piano');
            safeRevalidatePath(`/piano/practice/${updated.slug}`);
          } else {
            safeRevalidatePath('/strings');
            safeRevalidatePath(`/strings/practice/${updated.slug}`);
          }

          return {
            success: true,
            id: updated.id,
            slug: updated.slug,
            instrument: formData.instrumentType,
            url: targetPracticeUrl,
            isUpdate: true,
          };
        }
      }

      let slug = baseSlug;
      const existingCollision = await prisma.stringExercise.findUnique({ where: { slug } }).catch(() => null);
      if (existingCollision) {
        slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const exercise = await prisma.stringExercise.create({
        data: {
          slug,
          title: formData.title.trim(),
          instrument,
          tuning,
          category: formData.category,
          difficulty: formData.difficulty,
          bpmDefault: Number(formData.bpm) || 90,
          timeSignature: formData.timeSignature,
          subdivision: formData.subdivision || '1/16',
          stepsPerMeasure: formData.stepsPerMeasure || (formData.timeSignature === '6/8' ? 12 : 16),
          totalSteps: totalSteps,
          tabData: tabPayload,
        },
      });

      // Revalidar rutas
      const isPiano = formData.instrumentType === 'piano';
      const targetPracticeUrl = isPiano
        ? `/piano/practice/${exercise.slug}`
        : `/strings/practice/${exercise.slug}`;

      safeRevalidatePath('/');
      if (isPiano) {
        safeRevalidatePath('/piano');
        safeRevalidatePath(`/piano/practice/${exercise.slug}`);
      } else {
        safeRevalidatePath('/strings');
        safeRevalidatePath(`/strings/practice/${exercise.slug}`);
      }

      return {
        success: true,
        id: exercise.id,
        slug: exercise.slug,
        instrument: formData.instrumentType,
        url: targetPracticeUrl,
        isUpdate: false,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ [saveExerciseAction] Error crítico persistiendo en PostgreSQL:', error?.message || error);
    return {
      success: false,
      error: `Error al guardar en PostgreSQL: ${error?.message || 'Error de conexión con la base de datos'}`,
    };
  }
}

export async function deleteExerciseAction(
  slug: string,
  instrumentType: 'drums' | 'bass' | 'guitar' | 'piano'
) {
  try {
    if (!slug) {
      return { success: false, error: 'Slug de ejercicio no especificado.' };
    }

    if (instrumentType === 'drums') {
      await prisma.drumExercise.delete({ where: { slug } }).catch((err) => {
        console.warn('Prisma drum delete info (probablemente ya eliminado o en memoria):', err?.message || err);
      });
      safeRevalidatePath('/');
      safeRevalidatePath('/drums');
      return { success: true };
    } else {
      await prisma.stringExercise.delete({ where: { slug } }).catch((err) => {
        console.warn('Prisma string/piano delete info (probablemente ya eliminado o en memoria):', err?.message || err);
      });
      safeRevalidatePath('/');
      if (instrumentType === 'piano') {
        safeRevalidatePath('/piano');
      } else {
        safeRevalidatePath('/strings');
      }
      return { success: true };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Error al eliminar ejercicio en DB:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido al eliminar de la base de datos.',
    };
  }
}
