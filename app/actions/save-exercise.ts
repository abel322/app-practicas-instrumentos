'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface SaveExercisePayload {
  instrumentType: 'drums' | 'bass' | 'guitar';
  title: string;
  category: string;
  difficulty: string;
  bpm: number;
  timeSignature: string;
  totalMeasures: number;
  stepsPerMeasure: number;
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

    const baseSlug = slugify(formData.title) || `ejercicio-${Date.now()}`;
    const totalSteps = formData.totalMeasures * formData.stepsPerMeasure;

    if (formData.instrumentType === 'drums') {
      // Guardar en tabla DrumExercise
      let slug = baseSlug;
      // Verificar si ya existe con slug idéntico para no colisionar en caso de título duplicado
      const existing = await prisma.drumExercise.findUnique({ where: { slug } }).catch(() => null);
      if (existing) {
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
      };
    } else {
      // Guardar en tabla StringExercise (Bajo o Guitarra)
      const instrument = formData.instrumentType === 'bass' ? 'bass_4' : 'guitar_6';
      const tuning = formData.instrumentType === 'bass' ? 'E A D G' : 'E A D G B E';

      let slug = baseSlug;
      const existing = await prisma.stringExercise.findUnique({ where: { slug } }).catch(() => null);
      if (existing) {
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

      // Revalidar rutas de cuerdas
      revalidatePath('/strings');
      revalidatePath(`/strings/practice/${exercise.slug}`);

      return {
        success: true,
        slug: exercise.slug,
        instrument: formData.instrumentType,
        url: `/strings/practice/${exercise.slug}`,
      };
    }
  } catch (error: any) {
    console.error('❌ Error al guardar ejercicio en DB:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido al guardar en la base de datos.',
    };
  }
}
