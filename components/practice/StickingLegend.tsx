'use client';

import React from 'react';

export const StickingLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-3 px-4 rounded-xl glass-panel text-xs text-zinc-400 select-none">
      <div className="flex items-center gap-1.5 font-medium text-zinc-300">
        <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Sticking:</span>
      </div>

      {/* R Hand */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold text-[11px] shadow-[0_0_8px_rgba(34,211,238,0.25)]">
          R
        </span>
        <span className="text-zinc-300">Mano Derecha</span>
      </div>

      {/* L Hand */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 font-bold text-[11px] shadow-[0_0_8px_rgba(217,70,239,0.25)]">
          L
        </span>
        <span className="text-zinc-300">Mano Izquierda</span>
      </div>

      {/* K Kick */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] shadow-[0_0_8px_rgba(16,185,129,0.25)]">
          K
        </span>
        <span className="text-zinc-300">Bombo / Pie</span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-white/10 mx-1" />

      {/* Acento */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white font-extrabold text-sm">
          &gt;
        </span>
        <span className="text-zinc-400">Acento</span>
      </div>

      {/* HiHat cross */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-bold text-xs">
          ✕
        </span>
        <span className="text-zinc-400">Platillo</span>
      </div>
    </div>
  );
};
