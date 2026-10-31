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
  size = 'md',
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
        className={`${
          size === 'sm' ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-7 h-7 sm:w-8 sm:h-8'
        } rounded-full flex items-center justify-center transition-all shadow-sm ${
          isHighlighted
            ? isRoot
              ? 'bg-[#FFCC00] text-slate-950 font-black ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] scale-125 z-40 animate-pulse'
              : 'bg-cyan-400 text-slate-950 font-black ring-4 ring-cyan-300 shadow-[0_0_18px_rgba(34,211,238,1)] scale-125 z-40 animate-pulse'
            : isRoot
            ? 'bg-[#FFCC00] text-slate-950 font-black ring-2 ring-amber-300/60 scale-105 z-20 shadow-md'
            : isInActiveBox
            ? 'bg-slate-700/90 text-white font-black border border-slate-500/50 hover:bg-slate-600 z-10'
            : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 text-[10px]'
        }`}
      >
        <span
          className={`${
            size === 'sm' ? 'text-[11px] sm:text-xs font-black' : 'text-xs sm:text-[13px] font-black'
          } leading-none tracking-tight font-sans`}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
}
