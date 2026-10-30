'use client';

import React from 'react';
import { 
  ScaleSystemType, 
  NoteDisplayMode, 
  CAGED_BOXES, 
  THREE_NPS_PATTERNS 
} from '@/lib/music-theory/scaleSystems';

export interface ScaleSystemControlsProps {
  system: ScaleSystemType;
  onSystemChange: (system: ScaleSystemType) => void;
  activePatternId: number;
  onSelectPatternId: (id: number) => void;
  displayMode: NoteDisplayMode;
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  scaleViewMode?: 'single_box' | 'full_neck_map';
  onScaleViewModeChange?: (mode: 'single_box' | 'full_neck_map') => void;
}

export function ScaleSystemControls({
  system,
  onSystemChange,
  activePatternId,
  onSelectPatternId,
  displayMode,
  onDisplayModeChange,
  scaleViewMode = 'single_box',
  onScaleViewModeChange,
}: ScaleSystemControlsProps) {
  const patterns = system === 'caged' ? CAGED_BOXES : THREE_NPS_PATTERNS;

  return (
    <div className="flex flex-col gap-2.5 w-full my-3 px-1 sm:px-0">
      
      {/* Barra de Controles: Sistema + Triple Conmutador + Modo Mástil Completo */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 dark:bg-slate-950/90 p-2 sm:p-2.5 rounded-2xl border border-slate-800 shadow-md">
        
        {/* Selector de Sistema */}
        <div className="inline-flex p-1 bg-slate-950 dark:bg-slate-900 rounded-xl border border-slate-800 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => {
              onSystemChange('caged');
              onSelectPatternId(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              system === 'caged'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎸 CAGED (5 Cajas)
          </button>
          <button
            type="button"
            onClick={() => {
              onSystemChange('3nps');
              onSelectPatternId(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              system === '3nps'
                ? 'bg-purple-600 text-white font-black shadow-md ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ 3 Notas x Cuerda (7 Patrones)
          </button>
        </div>

        {/* Selector de Sub-Vista: Por Caja Individual vs Mástil Completo (Mapa de Posiciones) */}
        {onScaleViewModeChange && (
          <div className="inline-flex p-1 bg-slate-950 dark:bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onScaleViewModeChange('single_box')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                scaleViewMode === 'single_box'
                  ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-500 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📦 Por Caja Individual
            </button>
            <button
              type="button"
              onClick={() => onScaleViewModeChange('full_neck_map')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1.5 ${
                scaleViewMode === 'full_neck_map'
                  ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/40'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <span>🌐 Mástil Completo (Mapa de Posiciones)</span>
            </button>
          </div>
        )}

        {/* Triple Switch: Notas / Grados / Dedos */}
        <div className="inline-flex p-1 bg-slate-950 dark:bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onDisplayModeChange('notes')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              displayMode === 'notes' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Notas
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange('degrees')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              displayMode === 'degrees' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Grados
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange('fingers')}
            className={`px-2.5 py-1 rounded-lg font-black transition-all ${
              displayMode === 'fingers' 
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm ring-1 ring-emerald-300' 
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
            title="Ver qué dedo pisa: 1=Índice, 2=Medio, 3=Anular, 4=Meñique"
          >
            🖐️ Dedos (1-4)
          </button>
        </div>

      </div>

      {/* Botonera de Posiciones con Leyenda de Extensión */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0">
          {patterns.map((item) => {
            const isSelected = activePatternId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPatternId(item.id)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                  isSelected
                    ? system === 'caged'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/30 shadow-sm'
                      : 'bg-purple-600/30 border-purple-400 text-purple-200 ring-2 ring-purple-400/30 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/70'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Leyenda de Extensión de Dedo */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>⚡ = Extensión / Estiramiento</span>
        </div>
      </div>

    </div>
  );
}

