// lib/audio/guitarSynth.ts
// Motor y sintetizador de Guitarra con articulaciones avanzadas de púa, palm mute y rasgueo de acordes

import {
  guitarPreviewSynth,
  SampledElectricGuitarSynth,
  GuitarNoteEvent,
  GuitarTechnique,
  BendType,
  BendAmount,
  getGuitarMidiFromString,
} from './guitarPreviewSynth';
import { PickDirection, PickingStyle, StrumDirection } from '@/types/strings';

export {
  guitarPreviewSynth,
  SampledElectricGuitarSynth,
  getGuitarMidiFromString,
};
export type { GuitarNoteEvent, GuitarTechnique, BendType, BendAmount, PickDirection, PickingStyle, StrumDirection };

export const guitarSynth = guitarPreviewSynth;
