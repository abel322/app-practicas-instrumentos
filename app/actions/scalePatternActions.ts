'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface ScaleNotePayload {
  stringIndex: number;
  fret: number;
  finger: number;
  isRoot: boolean;
  isStretch?: boolean;
}

export interface SaveScalePatternInput {
  instrumentType: string;
  system: string;
  scaleKey: string;
  patternId: number;
  name: string;
  minFret: number;
  maxFret: number;
  notesData: ScaleNotePayload[];
}

/**
 * Guarda o actualiza (Upsert) el patrón modificado por el usuario en la base de datos
 */
export async function saveScalePatternAction(input: SaveScalePatternInput) {
  try {
    const saved = await prisma.customScalePattern.upsert({
      where: {
        pattern_unique_identifier: {
          instrumentType: input.instrumentType,
          system: input.system,
          scaleKey: input.scaleKey,
          patternId: input.patternId,
        },
      },
      update: {
        name: input.name,
        minFret: input.minFret,
        maxFret: input.maxFret,
        notesData: input.notesData as any,
      },
      create: {
        instrumentType: input.instrumentType,
        system: input.system,
        scaleKey: input.scaleKey,
        patternId: input.patternId,
        name: input.name,
        minFret: input.minFret,
        maxFret: input.maxFret,
        notesData: input.notesData as any,
      },
    });

    try {
      revalidatePath('/fretboard');
    } catch {
      // Ignorar si se ejecuta fuera del contexto HTTP
    }
    return { success: true, data: saved };
  } catch (error: any) {
    console.error('Error al guardar el patrón en BD:', error);
    return { success: false, error: error.message || 'Error al guardar en base de datos' };
  }
}

/**
 * Obtiene el patrón personalizado de la BD si existe
 */
export async function getCustomScalePatternAction(
  instrumentType: string,
  system: string,
  scaleKey: string,
  patternId: number
) {
  try {
    const pattern = await prisma.customScalePattern.findUnique({
      where: {
        pattern_unique_identifier: {
          instrumentType,
          system,
          scaleKey,
          patternId,
        },
      },
    });

    return { success: true, data: pattern };
  } catch (error: any) {
    console.error('Error al consultar patrón personalizado:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Restablece el patrón eliminando el registro de la BD para volver a la configuración matemática por defecto
 */
export async function resetScalePatternAction(
  instrumentType: string,
  system: string,
  scaleKey: string,
  patternId: number
) {
  try {
    await prisma.customScalePattern.deleteMany({
      where: {
        instrumentType,
        system,
        scaleKey,
        patternId,
      },
    });

    try {
      revalidatePath('/fretboard');
    } catch {
      // Ignorar si se ejecuta fuera del contexto HTTP
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error al restablecer patrón en BD:', error);
    return { success: false, error: error.message };
  }
}
