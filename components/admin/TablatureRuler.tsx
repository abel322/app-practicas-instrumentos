import React from 'react';

/**
 * Retorna la etiqueta rítmica y si es pulso a tierra (beat)
 * según el índice del paso y el total de pasos del compás.
 */
export function getStepRhythmLabel(stepIndex: number, totalSteps: number = 16): { label: string; isBeat: boolean } {
  if (totalSteps === 4) {
    return {
      label: (stepIndex + 1).toString(),
      isBeat: true,
    };
  }

  if (totalSteps === 8) {
    // 4/4 en corcheas (8 pasos: 1 y 2 y 3 y 4 y)
    const beatNumber = Math.floor(stepIndex / 2) + 1;
    const subIndex = stepIndex % 2;
    return {
      label: subIndex === 0 ? beatNumber.toString() : 'y',
      isBeat: subIndex === 0,
    };
  }

  if (totalSteps === 12) {
    // 4/4 en tresillos de corchea (12 pasos: 1 tri ple 2 tri ple...)
    const beatNumber = Math.floor(stepIndex / 3) + 1;
    const subIndex = stepIndex % 3;
    const subLabels = [beatNumber.toString(), 'tri', 'ple'];
    return {
      label: subLabels[subIndex],
      isBeat: subIndex === 0,
    };
  }

  if (totalSteps === 16) {
    // 4/4 en semicorcheas (16 pasos: 1 e y a 2 e y a...)
    const beatNumber = Math.floor(stepIndex / 4) + 1;
    const subIndex = stepIndex % 4;
    const subLabels = [beatNumber.toString(), 'e', 'y', 'a'];
    return {
      label: subLabels[subIndex],
      isBeat: subIndex === 0,
    };
  }

  if (totalSteps === 20) {
    // Quintillos (5:4 - 20 pasos: 1 • • • • 2 • • • •)
    const beatNumber = Math.floor(stepIndex / 5) + 1;
    const subIndex = stepIndex % 5;
    return {
      label: subIndex === 0 ? beatNumber.toString() : '•',
      isBeat: subIndex === 0,
    };
  }

  if (totalSteps === 24) {
    // Tresillos de semicorchea (24 pasos: 6 por tiempo)
    const beatNumber = Math.floor(stepIndex / 6) + 1;
    const subIndex = stepIndex % 6;
    return {
      label: subIndex === 0 ? beatNumber.toString() : '•',
      isBeat: subIndex === 0,
    };
  }

  if (totalSteps === 28) {
    // Septillos (7:4 - 28 pasos: 7 por tiempo)
    const beatNumber = Math.floor(stepIndex / 7) + 1;
    const subIndex = stepIndex % 7;
    return {
      label: subIndex === 0 ? beatNumber.toString() : '•',
      isBeat: subIndex === 0,
    };
  }

  if (totalSteps === 32) {
    // Fusas (32 pasos: 8 por tiempo)
    const beatNumber = Math.floor(stepIndex / 8) + 1;
    const subIndex = stepIndex % 8;
    return {
      label: subIndex === 0 ? beatNumber.toString() : '•',
      isBeat: subIndex === 0,
    };
  }

  // Por defecto
  return {
    label: (stepIndex + 1).toString(),
    isBeat: stepIndex % 4 === 0,
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
