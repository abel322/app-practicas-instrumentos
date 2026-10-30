'use client';

import React from 'react';

export interface PositionZone {
  id: number;
  label: string;
  shortLabel?: string;
  startFret: number;
  endFret: number;
  colorClass?: string;
  isOctaveUp?: boolean;
}

export interface PositionMapBracketsProps {
  zones: PositionZone[];
  activeZoneId: number | null;
  onSelectZone: (id: number) => void;
  totalFrets?: number;
}

export function PositionMapBrackets({
  zones,
  activeZoneId,
  onSelectZone,
  totalFrets = 24,
}: PositionMapBracketsProps) {
  return (
    <div className="w-full bg-[#180d07]/95 dark:bg-slate-950/95 border-b border-[#3d1f11] dark:border-slate-800/80 px-3 py-2 overflow-x-auto no-scrollbar backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-max">
        <div className="flex items-center gap-1.5 shrink-0 mr-1 text-[10px] uppercase font-bold text-amber-200/80 dark:text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span>Posiciones del Mástil:</span>
        </div>

        {zones.map((zone) => {
          const isSelected = activeZoneId === zone.id;
          return (
            <button
              key={`${zone.id}_${zone.startFret}`}
              type="button"
              onClick={() => onSelectZone(zone.id)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 active:scale-95 select-none ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/50 shadow-md font-black scale-105'
                  : 'bg-[#2a170e]/80 hover:bg-[#3a2013] text-amber-100/80 hover:text-white border-[#5c3a28]/70 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
              }`}
              title={`Ver ${zone.label} (Trastes ${zone.startFret} a ${zone.endFret})`}
            >
              <span>{zone.label}</span>
              <span
                className={`text-[10px] font-sans font-normal px-1.5 py-0.2 rounded ${
                  isSelected
                    ? 'bg-slate-950/20 text-slate-950 font-bold'
                    : 'text-amber-300/70 dark:text-slate-400'
                }`}
              >
                Tr. {zone.startFret}–{zone.endFret}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

