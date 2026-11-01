'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface SaveExercisePayload {
  slug?: string;
  instrumentType: 'drums' | 'bass' | 'guitar' | 'piano';
  title: string;
  category: string;
  difficulty: string;
  bpm: number;
  timeSignature: string;
  totalMeasures: number;
  stepsPerMeasure: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
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

      if (formData.slug) {
        // Modo edición o sobreescritura
        const existing = await prisma.drumExercise.findUnique({ where: { slug: formData.slug } }).catch(() => null);
        if (existing) {
          const updated = await prisma.drumExercise.update({
            where: { slug: formData.slug },
            data: {
              title: formData.title.trim(),
              category: formData.category,
              difficulty: formData.difficulty,
              bpmDefault: Number(formData.bpm) || 100,
              timeSignature: formData.timeSignature,
              totalSteps: totalSteps,
              hitsData: formData.data,
            },
          });

          revalidatePath('/');
          revalidatePath('/drums');
          revalidatePath(`/practice/${updated.slug}`);

          return {
            success: true,
            slug: updated.slug,
            instrument: 'drums',
            url: `/practice/${updated.slug}`,
            isUpdate: true,
          };
        }
      }

      // Si no existe o no tiene slug previo, verificar colisión
      const existingCollision = await prisma.drumExercise.findUnique({ where: { slug } }).catch(() => null);
      if (existingCollision) {
        slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const exercise = await prisma.drumExercise.create({
        data: {
          slug,
          title: formData.title.trim(),
          category: formData.category,
          difficulty: formData.difficulty,
          bpmDefault: Number(formData.bpm) || 100,
          timeSignature: formData.timeSignature,
          totalSteps: totalSteps,
          hitsData: formData.data,
        },
      });

      // Revalidar rutas para que aparezca de inmediato en el catálogo y reproductor
      revalidatePath('/');
      revalidatePath('/drums');
      revalidatePath(`/practice/${exercise.slug}`);

      return {
        success: true,
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

      if (formData.slug) {
        // Modo edición o sobreescritura
        const existing = await prisma.stringExercise.findUnique({ where: { slug: formData.slug } }).catch(() => null);
        if (existing) {
          const updated = await prisma.stringExercise.update({
            where: { slug: formData.slug },
            data: {
              title: formData.title.trim(),
              instrument,
              tuning,
              category: formData.category,
              difficulty: formData.difficulty,
              bpmDefault: Number(formData.bpm) || 90,
              timeSignature: formData.timeSignature,
              totalSteps: totalSteps,
              tabData: formData.data,
            },
          });

          revalidatePath('/');
          revalidatePath('/strings');
          revalidatePath(`/strings/practice/${updated.slug}`);

          return {
            success: true,
            slug: updated.slug,
            instrument: formData.instrumentType,
            url: `/strings/practice/${updated.slug}`,
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
          totalSteps: totalSteps,
          tabData: formData.data,
        },
      });

      // Revalidar rutas
      revalidatePath('/');
      revalidatePath('/strings');
      revalidatePath(`/strings/practice/${exercise.slug}`);

      return {
        success: true,
        slug: exercise.slug,
        instrument: formData.instrumentType,
        url: `/strings/practice/${exercise.slug}`,
        isUpdate: false,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Error al guardar ejercicio en DB:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido al guardar en la base de datos.',
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
      revalidatePath('/');
      revalidatePath('/drums');
      return { success: true };
    } else {
      await prisma.stringExercise.delete({ where: { slug } }).catch((err) => {
        console.warn('Prisma string delete info (probablemente ya eliminado o en memoria):', err?.message || err);
      });
      revalidatePath('/');
      revalidatePath('/strings');
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
