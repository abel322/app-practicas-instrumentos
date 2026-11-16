import React from 'react';
import { getStepCountLabel } from '@/lib/music-theory/rhythmSubdivisions';
export { getStepLabel, getStepsPerBeat, isStepMainBeat, isStepBeatEnd } from './PianoRollBuilder';
export { getStepCountLabel };

/**
 * Retorna la etiqueta rítmica estándar y si es pulso a tierra (beat)
 * según el índice del paso y el total de pasos del compás.
 */
export function getStepRhythmLabel(
  stepIndex: number,
  totalSteps: number = 16,
  subdivision?: string,
  timeSignature?: string
): { label: string; isBeat: boolean; isSubGroup?: boolean } {
  const info = getStepCountLabel(stepIndex, totalSteps, subdivision, timeSignature);
  return {
    label: info.label,
    isBeat: info.isBeatStart,
    isSubGroup: info.isSubGroupStart,
  };
}

interface TablatureRulerProps {
  totalSteps?: number;
  activeStep?: number;
  isPlaying?: boolean;
  className?: string;
}

export const TablatureRuler: React.FC<TablatureRulerProps> = ({
  totalSteps = 16,
  activeStep,
  isPlaying = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center w-full ${className}`}>
      {Array.from({ length: totalSteps }).map((_, stepIdx) => {
        const { label, isBeat } = getStepRhythmLabel(stepIdx, totalSteps);
        const isPlayback = isPlaying && activeStep === stepIdx;

        return (
          <div key={stepIdx} className="flex-1 flex flex-col items-center justify-center">
            <span
              className={`text-xs font-mono font-bold transition-colors ${
                isPlayback
                  ? 'text-cyan-300 font-black scale-110'
                  : isBeat
                  ? 'text-cyan-400 text-sm font-black'
                  : 'text-slate-400 dark:text-slate-500 font-semibold text-[11px]'
              }`}
            >
              {label}
            </span>
            {/* Punto indicador de pulso a tierra */}
            <span
              className={`w-1 h-1 rounded-full mt-0.5 transition-colors ${
                isPlayback
                  ? 'bg-cyan-300 ring-2 ring-cyan-300/50'
                  : isBeat
                  ? 'bg-cyan-400 ring-2 ring-cyan-400/30'
                  : 'bg-transparent'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};
