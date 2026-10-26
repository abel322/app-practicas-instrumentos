import React from 'react';

// Trastes completos: 0 al 22 consecutivos
export const AVAILABLE_FRETS = Array.from({ length: 23 }, (_, i) => i);
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]

interface NoteSelectorModalProps {
  selectedFret: number;
  onSelectFret: (fretNum: number) => void;
  className?: string;
}

export const NoteSelectorModal: React.FC<NoteSelectorModalProps> = ({
  selectedFret,
  onSelectFret,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full ${className}`}>
      {AVAILABLE_FRETS.map((fretNum) => {
        const isSelected = selectedFret === fretNum;
        return (
          <button
            key={fretNum}
            type="button"
            onClick={() => onSelectFret(fretNum)}
            className={`shrink-0 min-w-[32px] h-8 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
              isSelected
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg ring-2 ring-cyan-300'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            {fretNum}
          </button>
        );
      })}
    </div>
  );
};
