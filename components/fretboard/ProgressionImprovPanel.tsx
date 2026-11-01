'use client';

import React from 'react';
import { Sparkles, Target, Music } from 'lucide-react';
import { ChordImprovisationGuide } from '@/lib/music-theory/progressionImprovisationCatalog';
import {
  getImprovOptionsForChord,
  findImprovResourceById,
} from '@/lib/music-theory/chordImprovOptions';
import { THREE_TO_TWO_PATTERNS } from '@/lib/music-theory/threeToTwoSystem';

export type ImprovDisplayMode = 'chord_tones' | 'scale_mode' | 'both';

interface ProgressionImprovPanelProps {
  currentChord: ChordImprovisationGuide | null;
  improvMode: ImprovDisplayMode;
  onImprovModeChange: (mode: ImprovDisplayMode) => void;
  selectedResourceId?: string;
  onResourceIdChange?: (resourceId: string) => void;
  progressionSystem?: 'all' | 'caged' | '3nps' | 'three_to_two';
  onProgressionSystemChange?: (sys: 'all' | 'caged' | '3nps' | 'three_to_two') => void;
  selectedThreeToTwoPattern?: string;
  onSelectThreeToTwoPattern?: (id: string) => void;
}

export function ProgressionImprovPanel({
  currentChord,
  improvMode,
  onImprovModeChange,
  selectedResourceId = 'default',
  onResourceIdChange,
  progressionSystem = 'three_to_two',
  onProgressionSystemChange,
  selectedThreeToTwoPattern = '32_p1',
  onSelectThreeToTwoPattern,
}: ProgressionImprovPanelProps) {
  if (!currentChord) return null;

  const customResource = findImprovResourceById(selectedResourceId, currentChord.degreeRoman);
  const activeResourceName = customResource
    ? `${currentChord.chordRoot} ${customResource.name}`
    : currentChord.primaryMode.name;
  const activeDescription = customResource
    ? customResource.description
    : currentChord.primaryMode.description;

  return (
    <div className="w-full my-1.5 p-3 bg-slate-900/95 border border-cyan-900/40 rounded-2xl flex flex-col gap-2 shadow-lg select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-black text-slate-100">
            Improvisación sobre{' '}
            <span className="text-amber-400">{currentChord.chordName}</span> (
            {currentChord.degreeRoman})
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-bold">
            Recurso activo: {activeResourceName}
          </span>

          {onResourceIdChange && (
            <select
              value={selectedResourceId || 'default'}
              onChange={(e) => onResourceIdChange(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 text-[11px] text-amber-300 font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              title="Cambiar escala o arpegio para este acorde"
            >
              <option value="default">
                💡 Auto ({currentChord.primaryMode.name})
              </option>
              {getImprovOptionsForChord(currentChord.degreeRoman).map((res) => (
                <option key={res.id} value={res.id}>
                  {res.type === 'arpeggio' ? '🎯' : res.type === 'pentatonic' ? '🎸' : '🎼'}{' '}
                  {res.name} [{res.tag}]
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Sistema de Digitación (CAGED / 3NPS / 3 a 2 / Todo el Mástil) */}
          {onProgressionSystemChange && (
            <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] items-center">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 px-2">Sistema:</span>
              <button
                type="button"
                onClick={() => onProgressionSystemChange('all')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  progressionSystem === 'all'
                    ? 'bg-slate-700 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mástil
              </button>
              <button
                type="button"
                onClick={() => onProgressionSystemChange('caged')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  progressionSystem === 'caged'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CAGED
              </button>
              <button
                type="button"
                onClick={() => onProgressionSystemChange('3nps')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  progressionSystem === '3nps'
                    ? 'bg-purple-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3NPS
              </button>
              <button
                type="button"
                onClick={() => onProgressionSystemChange('three_to_two')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  progressionSystem === 'three_to_two'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <span>⚡ 3 a 2</span>
              </button>
            </div>
          )}

          {/* Selector de visualización en el diapasón */}
          <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] flex-wrap">
          <button
            type="button"
            onClick={() => onImprovModeChange('chord_tones')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              improvMode === 'chord_tones'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3 h-3" />
            <span>🎯 Notas Diana (Arpegio)</span>
          </button>

          <button
            type="button"
            onClick={() => onImprovModeChange('both')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              improvMode === 'both'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>🌟 Diana + Escala</span>
          </button>

          <button
            type="button"
            onClick={() => onImprovModeChange('scale_mode')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              improvMode === 'scale_mode'
                ? 'bg-indigo-600 text-white font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3 h-3" />
            <span>🎼 Escala Completa</span>
          </button>
        </div>
      </div>
    </div>

      {/* Selector de Patrones 3 a 2 si el sistema activo es 3 a 2 */}
      {progressionSystem === 'three_to_two' && onSelectThreeToTwoPattern && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider shrink-0">
            Patrón 3 a 2:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {THREE_TO_TWO_PATTERNS.map((p) => {
              const isSelected = (selectedThreeToTwoPattern || '32_p1') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectThreeToTwoPattern(p.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm ring-1 ring-amber-300'
                      : 'bg-slate-950/90 text-amber-300/80 hover:bg-slate-800 border border-amber-900/40 hover:text-white'
                  }`}
                  title={`${p.name}: ${p.description} (Distribución: ${p.stringDistribution.join('-')})`}
                >
                  {p.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Franja de Notas Diana del acorde activo */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
        <span className="text-slate-400 font-bold text-[11px]">Aterrizar frases en:</span>
        <div className="flex items-center gap-1.5 font-mono">
          {currentChord.chordTones.map((note: string, idx: number) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 font-extrabold text-[11px]"
            >
              {note}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-slate-400 ml-auto hidden sm:inline">
          {activeDescription}
        </span>
      </div>
    </div>
  );
}

export default ProgressionImprovPanel;
