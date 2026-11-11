'use client';

// Validador de notas previas en la misma cuerda para ligaduras
export function validateLegatoTechnique(
  notes: any[],
  targetNote: any,
  intendedTechnique: 'hammer' | 'pulloff' | 'pull' | string
): { isValid: boolean; message?: string; suggestedTechnique?: 'hammer' | 'pulloff' } {
  const normTech = intendedTechnique === 'pull' ? 'pulloff' : intendedTechnique;
  const targetString =
    targetNote.stringIndex !== undefined ? targetNote.stringIndex : targetNote.string;
  const targetStep =
    targetNote.stepIndex !== undefined ? targetNote.stepIndex : targetNote.step;
  const targetFret = targetNote.fret ?? 0;

  // Buscar notas previas en la misma cuerda dentro del compás
  const previousNotesOnString = (notes || [])
    .filter((n) => {
      const nString = n.stringIndex !== undefined ? n.stringIndex : n.string;
      const nStep = n.stepIndex !== undefined ? n.stepIndex : n.step;
      return nString === targetString && nStep < targetStep;
    })
    .sort((a, b) => {
      const aStep = a.stepIndex !== undefined ? a.stepIndex : a.step;
      const bStep = b.stepIndex !== undefined ? b.stepIndex : b.step;
      return bStep - aStep;
    });

  const prevNote = previousNotesOnString[0];

  if (!prevNote) {
    return {
      isValid: false,
      message: `⚠️ No se puede aplicar ${intendedTechnique.toUpperCase()}: no existe una nota previa en esta cuerda para ligar.`,
    };
  }

  // Validación musical de dirección:
  // Hammer-on: traste destino > traste origen (ascendente)
  // Pull-off: traste destino < traste origen (descendente)
  const prevFret = prevNote.fret ?? 0;
  const isAscending = targetFret > prevFret;

  if (normTech === 'hammer' && !isAscending) {
    return {
      isValid: true,
      suggestedTechnique: 'pulloff',
      message: `Nota: Traste ${prevFret} a ${targetFret} es descendente. Se ajustará a PULL-OFF.`,
    };
  }

  if (normTech === 'pulloff' && isAscending) {
    return {
      isValid: true,
      suggestedTechnique: 'hammer',
      message: `Nota: Traste ${prevFret} a ${targetFret} es ascendente. Se ajustará a HAMMER-ON.`,
    };
  }

  return { isValid: true };
}

import { ExerciseBuilder } from './ExerciseBuilder';

export { useWebMidi } from '@/lib/midi/useWebMidi';
export type { MidiDeviceState } from '@/lib/midi/useWebMidi';
export { QUANTIZE_OPTIONS, getQuantizedStep } from './PianoRollBuilder';
export type { QuantizeValue, QuantizeOption } from './PianoRollBuilder';
export { ExtendedScoreView } from '@/components/studio/ExtendedScoreView';
export type { ScoreMeasure, ScoreNote, ExtendedScoreViewProps } from '@/components/studio/ExtendedScoreView';
export { PrintableScoreModal } from '@/components/studio/PrintableScoreModal';
export type { PrintableScoreModalProps } from '@/components/studio/PrintableScoreModal';
export { pianoPreviewSynth } from '@/lib/audio/pianoPreviewSynth';

export const StudioBuilderView = ExerciseBuilder;
export default ExerciseBuilder;
