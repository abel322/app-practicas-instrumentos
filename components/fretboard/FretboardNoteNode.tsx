'use client';

import React from 'react';
import { NoteDisplayMode } from '@/lib/music-theory/scaleSystems';

export interface FretboardNoteNodeProps {
  noteName: string;
  degreeLabel: string;
  fingerAssignment: { finger: number; isStretch: boolean; stretchType?: 'backward' | 'forward' };
  isRoot: boolean;
  displayMode: NoteDisplayMode | 'intervals';
  onClick: () => void;
}

export function FretboardNoteNode({
  noteName,
  degreeLabel,
  fingerAssignment,
  isRoot,
  displayMode,
  onClick
}: FretboardNoteNodeProps) {
  const { finger, isStretch } = fingerAssignment;

  return (
    <div 
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none group"
    >
      {/* Nodo Principal */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform active:scale-90 shadow-md ${
          isRoot
            ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-400/40 font-black'
            : isStretch && displayMode === 'fingers'
            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300/80 font-black shadow-amber-500/20'
            : 'bg-slate-900/90 text-white border border-slate-600'
        }`}
      >
        {/* Contenido Principal según el modo */}
        {displayMode === 'fingers' ? (
          <div className="flex items-center justify-center font-mono font-black">
            <span>{finger > 0 ? finger : '0'}</span>
            {isStretch && <span className="text-[9px] -ml-0.5 text-amber-950 font-black">⚡</span>}
          </div>
        ) : displayMode === 'degrees' || displayMode === 'intervals' ? (
          <span className="font-mono">{degreeLabel}</span>
        ) : (
          <span>{noteName}</span>
        )}
      </div>

      {/* Micro-píldora con el Dedo y Alerta de Extensión (cuando no está en modo 'fingers') */}
      {displayMode !== 'fingers' && finger > 0 && (
        <div
          className={`absolute -top-1.5 -right-1.5 px-1 min-w-[16px] h-4 rounded-full font-mono text-[9px] font-black flex items-center justify-center border shadow-sm ${
            isStretch
              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-1 ring-amber-400/50'
              : 'bg-emerald-500 text-slate-950 border-slate-900'
          }`}
          title={isStretch ? `Dedo ${finger} (Requiere estiramiento / extensión)` : `Dedo ${finger}`}
        >
          {finger}
          {isStretch && <span className="text-[7px] ml-0.5">⚡</span>}
        </div>
      )}
    </div>
  );
}

