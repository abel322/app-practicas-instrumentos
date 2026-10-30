'use client';

import React from 'react';
import { ChordTensionVariation } from '@/lib/music-theory/chordVariationsCatalog';
import { Sliders } from 'lucide-react';

interface ChordVariationChipsProps {
  variations: ChordTensionVariation[];
  activeVariationId: string;
  onSelectVariation: (variation: ChordTensionVariation) => void;
  chordBaseLabel: string;
}

export function ChordVariationChips({
  variations,
  activeVariationId,
  onSelectVariation,
  chordBaseLabel,
}: ChordVariationChipsProps) {
  if (variations.length <= 1) return null;

  return (
    <div className="w-full my-2.5 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col gap-1.5 shadow-md">
      <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-amber-300">
        <Sliders className="w-3.5 h-3.5" />
        <span>Tensiones y Variaciones para {chordBaseLabel}:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {variations.map((v) => {
          const isSelected = activeVariationId === v.id;
          const isAltered = v.category === 'altered';
          const isSlash = v.category === 'slash';
          const isSixth = v.category === 'sixth';

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVariation(v)}
              className={`shrink-0 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border transition-all ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/40 shadow-sm font-black'
                  : isAltered
                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/40'
                  : isSlash
                  ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border-purple-800/40'
                  : isSixth
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border-emerald-800/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={v.description}
            >
              {v.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
