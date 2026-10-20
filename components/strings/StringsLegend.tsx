'use client';

import React from 'react';

export const StringsLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-3 px-4 rounded-xl glass-panel text-xs text-zinc-400 select-none">
      <div className="flex items-center gap-1.5 font-medium text-zinc-300">
        <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Técnicas:</span>
      </div>

      {/* Slap */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold text-[11px] shadow-[0_0_8px_rgba(34,211,238,0.25)]">
          S
        </span>
        <span className="text-zinc-300">Slap (Pulgar)</span>
      </div>

      {/* Pop */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 font-bold text-[11px] shadow-[0_0_8px_rgba(217,70,239,0.25)]">
          P
        </span>
        <span className="text-zinc-300">Pop (Tirón)</span>
      </div>

      {/* Hammer-on */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[11px]">
          H
        </span>
        <span className="text-zinc-300">Hammer-on</span>
      </div>

      {/* Slide */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
          /
        </span>
        <span className="text-zinc-300">Slide</span>
      </div>

      {/* Ghost */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white/10 border border-white/20 text-zinc-300 font-bold text-[11px]">
          X
        </span>
        <span className="text-zinc-400">Ghost Note</span>
      </div>

      {/* Vibrato */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px]">
          ~
        </span>
        <span className="text-zinc-400">Vibrato</span>
      </div>
    </div>
  );
};
