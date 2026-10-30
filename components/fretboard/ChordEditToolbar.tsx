'use client';

import React from 'react';
import { Pencil, Save, RotateCcw } from 'lucide-react';

interface ChordEditToolbarProps {
  isEditing: boolean;
  onToggleEditing: () => void;
  onSaveToDB: () => void;
  onResetFactory: () => void;
  isSaving: boolean;
  isCustom: boolean;
  chordName: string;
}

export function ChordEditToolbar({
  isEditing,
  onToggleEditing,
  onSaveToDB,
  onResetFactory,
  isSaving,
  isCustom,
  chordName,
}: ChordEditToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/95 border border-slate-800 rounded-2xl my-2 text-xs">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleEditing}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            isEditing
              ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-lg'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Salir del Editor' : '🛠️ Editar Voicing del Acorde'}</span>
        </button>

        {isCustom && (
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold">
            Personalizado en BD
          </span>
        )}
      </div>

      {isEditing && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSaveToDB}
            disabled={isSaving}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1 shadow-md transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : `Guardar ${chordName} en BD`}</span>
          </button>

          {isCustom && (
            <button
              type="button"
              onClick={onResetFactory}
              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 font-bold rounded-xl flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          )}
        </div>
      )}

      {isEditing && (
        <div className="w-full text-[11px] text-amber-300/90 font-medium px-1 pt-1 border-t border-slate-800/60 flex items-center gap-1">
          <span>
            💡 <b>Clic</b> = Añadir nota / Cambiar dedo (1→4) / Quitar. <b>Clic derecho</b> = Alternar Fundamental (Root).
          </span>
        </div>
      )}
    </div>
  );
}
