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
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function FretboardNoteNode({
  noteName,
  degreeLabel,
  fingerAssignment,
  isRoot,
  displayMode,
  onClick,
  onContextMenu,
}: FretboardNoteNodeProps) {
  const { finger, isStretch } = fingerAssignment;

  // Detección de intervalos armónicos
  const isThird = degreeLabel === '3' || degreeLabel === 'b3';
  const isFifth = degreeLabel === '5' || degreeLabel === 'b5';
  const isSeventh = degreeLabel === '7' || degreeLabel === 'b7' || degreeLabel === 'bb7';
  const isAlteredTension =
    degreeLabel === '#9' ||
    degreeLabel === 'b9' ||
    degreeLabel === '#11' ||
    degreeLabel === 'b13' ||
    degreeLabel === '7alt';
  const isSixthOrExtension =
    degreeLabel === '6' ||
    degreeLabel === '9' ||
    degreeLabel === 'add9' ||
    degreeLabel === '11' ||
    degreeLabel === '13' ||
    degreeLabel === '4';

  // Estilo visual del círculo de nota
  let nodeStyle = 'bg-slate-900/90 text-white border border-slate-600';
  if (isRoot || degreeLabel === 'R') {
    nodeStyle =
      'bg-cyan-400 text-slate-950 ring-4 ring-cyan-300/50 font-black shadow-[0_0_12px_rgba(34,211,238,0.7)]';
  } else if (isStretch && displayMode === 'fingers') {
    nodeStyle =
      'bg-amber-400 text-slate-950 ring-2 ring-amber-300/80 font-black shadow-amber-500/20';
  } else if (isAlteredTension) {
    nodeStyle =
      'bg-rose-500 text-white ring-2 ring-rose-400/80 font-black shadow-[0_0_10px_rgba(244,63,94,0.6)]';
  } else if (isSixthOrExtension) {
    nodeStyle =
      'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300/80 font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]';
  } else if (isThird) {
    nodeStyle =
      'bg-fuchsia-600 text-white ring-2 ring-fuchsia-400/50 font-black shadow-[0_0_8px_rgba(217,70,239,0.5)]';
  } else if (isFifth) {
    nodeStyle =
      'bg-amber-400 text-slate-950 ring-2 ring-amber-300/60 font-black shadow-[0_0_8px_rgba(251,191,36,0.5)]';
  } else if (isSeventh) {
    nodeStyle =
      'bg-purple-600 text-white ring-2 ring-purple-400/50 font-black shadow-[0_0_8px_rgba(168,85,247,0.4)]';
  }

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="relative flex items-center justify-center cursor-pointer select-none group"
    >
      {/* Nodo Principal con Relieve y Brillo */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-transform active:scale-90 shadow-md ${nodeStyle}`}
      >
        {/* Contenido Principal según el modo */}
        {displayMode === 'fingers' ? (
          <div className="flex items-center justify-center font-mono font-black">
            <span>{finger > 0 ? finger : '0'}</span>
            {isStretch && <span className="text-[9px] -ml-0.5 text-amber-950 font-black">⚡</span>}
          </div>
        ) : displayMode === 'degrees' || displayMode === 'intervals' ? (
          <span className="font-mono font-black">{degreeLabel || noteName}</span>
        ) : (
          <span className="font-bold">{noteName}</span>
        )}
      </div>

      {/* Micro-píldora con el Dedo y Alerta de Extensión (en esquina superior derecha) */}
      {displayMode !== 'fingers' && finger > 0 && (
        <div
          className={`absolute -top-1.5 -right-1.5 px-1 min-w-[16px] h-4 rounded-full font-mono text-[9px] font-black flex items-center justify-center border shadow-sm ${
            isStretch
              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-1 ring-amber-400/50'
              : 'bg-emerald-500 text-slate-950 border-slate-900'
          }`}
          title={
            isStretch
              ? `Dedo ${finger} (Requiere estiramiento / extensión)`
              : `Dedo ${finger}`
          }
        >
          {finger}
          {isStretch && <span className="text-[7px] ml-0.5">⚡</span>}
        </div>
      )}
    </div>
  );
}
