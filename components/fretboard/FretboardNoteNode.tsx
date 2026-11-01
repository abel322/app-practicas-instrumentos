'use client';

import React from 'react';
import { NoteDisplayMode } from '@/lib/music-theory/scaleSystems';

export interface FretboardNoteNodeProps {
  noteName: string;
  degreeLabel: string;
  fingerNumber?: number;
  fingerAssignment?: { finger: number; isStretch?: boolean; stretchType?: 'backward' | 'forward' };
  isRoot: boolean;
  displayMode: NoteDisplayMode | 'intervals' | 'note' | 'degree' | 'finger';
  isInActiveBox?: boolean;
  isGhost?: boolean;
  isHighlighted?: boolean;
  isShiftPoint?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function FretboardNoteNode({
  noteName,
  degreeLabel,
  fingerNumber,
  fingerAssignment,
  isRoot,
  displayMode,
  isInActiveBox = true,
  isGhost = false,
  isHighlighted = false,
  isShiftPoint = false,
  onClick,
  onContextMenu,
}: FretboardNoteNodeProps) {
  const isFingerMode = displayMode === 'finger' || displayMode === 'fingers';
  const isDegreeMode = displayMode === 'degree' || displayMode === 'degrees' || displayMode === 'intervals';
  const resolvedFinger = fingerNumber ?? fingerAssignment?.finger;

  // Determinar el contenido textual interno:
  const displayText =
    isFingerMode && resolvedFinger !== undefined && resolvedFinger > 0
      ? resolvedFinger
      : isDegreeMode
      ? (degreeLabel || noteName)
      : noteName;

  if (isGhost) {
    // Modo referencia minimalista fuera de la caja activa
    return (
      <div className="flex items-center justify-center w-full h-full pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-slate-500/40" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="relative flex items-center justify-center cursor-pointer select-none group"
    >
      <div
        className={`w-[27px] h-[27px] sm:w-[29px] sm:h-[29px] rounded-full flex items-center justify-center transition-all shadow-sm ${
          isHighlighted
            ? isRoot
              ? 'bg-[#FFCC00] text-slate-950 font-black ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] scale-115 z-40 animate-pulse'
              : 'bg-cyan-400 text-slate-950 font-black ring-4 ring-cyan-300 shadow-[0_0_18px_rgba(34,211,238,1)] scale-115 z-40 animate-pulse'
            : isRoot
            ? 'bg-[#FFCC00] text-slate-950 font-black ring-2 ring-amber-300/70 scale-105 z-20 shadow-md'
            : isInActiveBox
            ? 'bg-slate-700/90 text-white font-bold border border-slate-500/50 hover:bg-slate-600 z-10'
            : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 text-[10px]'
        }`}
      >
        <span className="text-xs sm:text-[13px] leading-none tracking-tight font-sans font-black">
          {displayText}
        </span>
      </div>

      {isShiftPoint && (
        <span
          className="absolute -top-1.5 -right-1.5 px-1 py-0.2 text-[8px] font-black font-mono rounded bg-amber-400 text-slate-950 shadow-md border border-amber-300 z-30 flex items-center leading-tight pointer-events-none"
          title="Cambio de posición (Shift de mano)"
        >
          ↗
        </span>
      )}
    </div>
  );
}
