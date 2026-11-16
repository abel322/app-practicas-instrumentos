// lib/music/dynamicsAndStrokes.ts
/**
 * Modelo centralizado de Dinámicas Musicales (pp a ff) y Tipos de Golpe de Batería
 * Para control de expresividad en Studio Builder, renderizado en partituras y Web Audio DSP.
 */

export type DynamicMarking = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';

export type DrumStrokeType =
  | 'normal'
  | 'flam'
  | 'drag'
  | 'buzz'
  | 'rimshot'
  | 'cross_stick'
  | 'choke';

export interface DynamicSpec {
  id: DynamicMarking;
  label: string;
  velocity: number; // 0.0 a 1.0
  gainScale: number;
  brightnessHz: number;
  badgeColor: string;
}

export const DYNAMIC_LEVELS: DynamicSpec[] = [
  {
    id: 'pp',
    label: 'pp',
    velocity: 0.25,
    gainScale: 0.28,
    brightnessHz: 4200,
    badgeColor: 'text-slate-400 border-slate-600 bg-slate-800/70',
  },
  {
    id: 'p',
    label: 'p',
    velocity: 0.42,
    gainScale: 0.46,
    brightnessHz: 5800,
    badgeColor: 'text-sky-300 border-sky-600/50 bg-sky-500/10',
  },
  {
    id: 'mp',
    label: 'mp',
    velocity: 0.58,
    gainScale: 0.63,
    brightnessHz: 8200,
    badgeColor: 'text-cyan-300 border-cyan-500/50 bg-cyan-500/15',
  },
  {
    id: 'mf',
    label: 'mf',
    velocity: 0.75,
    gainScale: 0.8,
    brightnessHz: 11500,
    badgeColor: 'text-emerald-300 border-emerald-500/50 bg-emerald-500/15',
  },
  {
    id: 'f',
    label: 'f',
    velocity: 0.9,
    gainScale: 0.95,
    brightnessHz: 15500,
    badgeColor: 'text-amber-300 border-amber-500/60 bg-amber-500/15',
  },
  {
    id: 'ff',
    label: 'ff',
    velocity: 1.0,
    gainScale: 1.15,
    brightnessHz: 19500,
    badgeColor: 'text-rose-300 border-rose-500/70 bg-rose-500/20',
  },
];

export interface DrumStrokeSpec {
  id: DrumStrokeType;
  label: string;
  shortTag: string;
  description: string;
}

export const DRUM_STROKE_OPTIONS: DrumStrokeSpec[] = [
  { id: 'normal', label: 'Normal', shortTag: '', description: 'Golpe estándar limpio' },
  { id: 'flam', label: 'Flam', shortTag: 'fl', description: 'Nota de gracia previa con mano contraria (~28ms)' },
  { id: 'drag', label: 'Drag / Ruff', shortTag: 'dr', description: 'Doble nota de gracia rápida previa' },
  { id: 'buzz', label: 'Buzz (z)', shortTag: 'z', description: 'Rebote presionado / redoble cerrado' },
  { id: 'rimshot', label: 'Rimshot', shortTag: 'RS', description: 'Parche + aro simultáneo (ataque metálico)' },
  { id: 'cross_stick', label: 'Cross-Stick', shortTag: 'CS', description: 'Aro cruzado sobre el parche (sidestick)' },
  { id: 'choke', label: 'Choke', shortTag: 'Ch', description: 'Golpe de plato con ahogado rápido' },
];

export function getDynamicSpec(dynamic?: string): DynamicSpec {
  return DYNAMIC_LEVELS.find((d) => d.id === dynamic) || DYNAMIC_LEVELS[3]; // 'mf' por defecto
}

export function getDrumStrokeSpec(stroke?: string): DrumStrokeSpec {
  return DRUM_STROKE_OPTIONS.find((s) => s.id === stroke) || DRUM_STROKE_OPTIONS[0];
}
