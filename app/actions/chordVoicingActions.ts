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
  instrument?: string;
  root: string;
  chordType: string;
  shape: string;
  frets: ChordNotePayload[];
}

function normalizeInstrument(inst?: string | null): string {
  if (!inst) return 'guitar_6c';
  if (inst === 'guitar_6') return 'guitar_6c';
  if (inst === 'bass_4') return 'bass_4c';
  if (inst === 'bass_5') return 'bass_5c';
  return inst;
}

export async function saveChordVoicingAction(input: SaveChordVoicingInput) {
  try {
    const instrument = normalizeInstrument(input.instrument);
    const saved = await prisma.customChordVoicing.upsert({
      where: {
        chord_unique_identifier: {
          instrument,
          root: input.root,
          chordType: input.chordType,
          shape: input.shape,
        },
      },
      update: {
        fretsJson: input.frets as any,
      },
      create: {
        instrument,
        root: input.root,
        chordType: input.chordType,
        shape: input.shape,
        fretsJson: input.frets as any,
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
  instrument: string,
  root: string,
  chordType: string,
  shape: string
) {
  try {
    const inst = normalizeInstrument(instrument);
    const voicing = await prisma.customChordVoicing.findUnique({
      where: {
        chord_unique_identifier: {
          instrument: inst,
          root,
          chordType,
          shape,
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
  instrument: string,
  root: string,
  chordType: string,
  shape: string
) {
  try {
    const inst = normalizeInstrument(instrument);
    await prisma.customChordVoicing.deleteMany({
      where: {
        instrument: inst,
        root,
        chordType,
        shape,
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
