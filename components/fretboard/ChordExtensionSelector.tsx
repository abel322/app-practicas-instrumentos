'use client';

import React, { useRef } from 'react';
import { ChordExtensionFamily } from '@/lib/music-theory/cagedHarmonics';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface ExtensionFamilyItem {
  id: ChordExtensionFamily;
  label: string;
  badge: string;
  description: string;
  harmonicRole: string;
}

export const EXTENSION_FAMILIES_LIST: ExtensionFamilyItem[] = [
  {
    id: 'triad',
    label: 'Tríadas',
    badge: 'R-3-5',
    description: 'Armonía básica de 3 notas: Tónica, Tercera y Quinta',
    harmonicRole: 'Básico',
  },
  {
    id: 'seventh',
    label: 'Séptimas',
    badge: 'Maj7 / m7 / 7',
    description: 'Tétradas con 7ª diatónica (Maj7, m7, Dominante 7, m7b5)',
    harmonicRole: 'Tétradas',
  },
  {
    id: 'ninth',
    label: 'Novenas',
    badge: 'Maj9 / m9 / 9',
    description: 'Extensiones armónicas con 9ª (tensión melódica sin choque)',
    harmonicRole: 'Color',
  },
  {
    id: 'eleventh',
    label: 'Oncenas',
    badge: '11 / #11',
    description: 'Voicings ergonómicos con 5ª omitida (Maj11, m11, Maj7(#11) Lidio, 9sus4)',
    harmonicRole: '5ª Omitida',
  },
  {
    id: 'thirteenth',
    label: 'Trecenas',
    badge: '13 / b13',
    description: 'Shell & Drop voicings cómodos de Jazz y Funk con 5ª omitida',
    harmonicRole: 'Shell (5ª Omitida)',
  },
  {
    id: 'added',
    label: 'Agregados',
    badge: 'add9 / add11',
    description: 'Tríadas con tensión agregada directa sin 7ª (add9, add11)',
    harmonicRole: 'Sin 7ª',
  },
  {
    id: 'suspended',
    label: 'Suspendidos',
    badge: 'sus2 / sus4',
    description: 'Variaciones con 3ª sustituida por 2ª o 4ª',
    harmonicRole: 'Suspensión',
  },
];

interface ChordExtensionSelectorProps {
  activeFamily: ChordExtensionFamily;
  onSelectFamily: (family: ChordExtensionFamily) => void;
}

export const ChordExtensionSelector: React.FC<ChordExtensionSelectorProps> = ({
  activeFamily,
  onSelectFamily,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5 py-1.5 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="text-[11px] font-mono uppercase font-black text-slate-700 dark:text-slate-300 tracking-wider">
            7 Familias Armónicas Diatónicas:
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold">
            Drop & Shell Voicings (5ª Omitida en 11 / 13)
          </span>
        </div>

        {/* Flechas para scroll suave en pantallas estrechas */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Desplazar a la izquierda"
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Desplazar a la derecha"
            aria-label="Desplazar derecha"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slider táctil horizontal con 7 opciones */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {EXTENSION_FAMILIES_LIST.map((item, idx) => {
          const isSelected = activeFamily === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFamily(item.id)}
              className={`group shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-300 font-black ring-2 ring-amber-300/50 shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
              title={item.description}
            >
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono opacity-60 font-bold">{idx + 1}.</span>
                  <span className="font-bold tracking-tight">{item.label}</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-normal truncate max-w-[120px] ${
                    isSelected ? 'text-slate-900/80 font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.harmonicRole}
                </span>
              </div>

              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md shrink-0 font-bold ${
                  isSelected
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
