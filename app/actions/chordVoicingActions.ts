'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface ChordNotePayload {
  stringIndex: number;
  fret: number;
  finger: number;
  intervalLabel: string;
  isRoot: boolean;
}

export interface SaveChordVoicingInput {
  instrumentType: string;
  keyRoot: string;
  cagedBoxId: number;
  extension: string;
  degreeIndex: number;
  chordName: string;
  notesData: ChordNotePayload[];
}

export async function saveChordVoicingAction(input: SaveChordVoicingInput) {
  try {
    const saved = await prisma.customChordVoicing.upsert({
      where: {
        voicing_unique_identifier: {
          instrumentType: input.instrumentType,
          keyRoot: input.keyRoot,
          cagedBoxId: input.cagedBoxId,
          extension: input.extension,
          degreeIndex: input.degreeIndex,
        },
      },
      update: {
        chordName: input.chordName,
        notesData: input.notesData as any,
      },
      create: {
        instrumentType: input.instrumentType,
        keyRoot: input.keyRoot,
        cagedBoxId: input.cagedBoxId,
        extension: input.extension,
        degreeIndex: input.degreeIndex,
        chordName: input.chordName,
        notesData: input.notesData as any,
      },
    });

    try {
      revalidatePath('/fretboard');
    } catch {
      // Ignorar si se ejecuta fuera de contexto HTTP
    }
    return { success: true, data: saved };
  } catch (error: any) {
    console.error('Error al guardar voicing:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomChordVoicingAction(
  instrumentType: string,
  keyRoot: string,
  cagedBoxId: number,
  extension: string,
  degreeIndex: number
) {
  try {
    const voicing = await prisma.customChordVoicing.findUnique({
      where: {
        voicing_unique_identifier: {
          instrumentType,
          keyRoot,
          cagedBoxId,
          extension,
          degreeIndex,
        },
      },
    });

    return { success: true, data: voicing };
  } catch (error: any) {
    console.error('Error al consultar voicing:', error);
    return { success: false, error: error.message };
  }
}

export async function resetChordVoicingAction(
  instrumentType: string,
  keyRoot: string,
  cagedBoxId: number,
  extension: string,
  degreeIndex: number
) {
  try {
    await prisma.customChordVoicing.deleteMany({
      where: {
        instrumentType,
        keyRoot,
        cagedBoxId,
        extension,
        degreeIndex,
      },
    });

    try {
      revalidatePath('/fretboard');
    } catch {
      // Ignorar si se ejecuta fuera de contexto HTTP
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error al restablecer voicing:', error);
    return { success: false, error: error.message };
  }
}
