'use client';

import React, { useState } from 'react';
import {
  Code2,
  Check,
  Sparkles,
  RotateCcw,
  Trash2,
  Eye,
  X,
  FileJson,
  Hand,
  Target,
} from 'lucide-react';

export interface ScalePatternExportBarProps {
  isEditorActive: boolean;
  onToggleEditor: () => void;
  patternName: string;
  minFret: number;
  maxFret: number;
  stringsFrets: Record<
    number,
    { fret: number; finger: number; isRoot?: boolean; isStretch?: boolean }[]
  >;
  onClearGrid?: () => void;
  onResetGrid?: () => void;
  touchMode?: 'cycle' | 'root';
  onTouchModeChange?: (mode: 'cycle' | 'root') => void;
}

export function ScalePatternExportBar({
  isEditorActive,
  onToggleEditor,
  patternName,
  minFret,
  maxFret,
  stringsFrets,
  onClearGrid,
  onResetGrid,
  touchMode = 'cycle',
  onTouchModeChange,
}: ScalePatternExportBarProps) {
  const [copiedTs, setCopiedTs] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<'ts' | 'json'>('ts');

  // Generador de Código TypeScript formateado
  const generateTypeScriptCode = () => {
    const formattedStrings: Record<number, string> = {};

    [5, 4, 3, 2, 1, 0].forEach((strIdx) => {
      const notes = stringsFrets[strIdx] || [];
      const notesString = notes
        .map(
          (n) =>
            `{ fret: ${n.fret}, finger: ${n.finger}${n.isRoot ? ', isRoot: true' : ''}${
              n.isStretch ? ', isStretch: true' : ''
            } }`
        )
        .join(', ');
      formattedStrings[strIdx] = `[${notesString}]`;
    });

    return `  // ${patternName}
  {
    name: '${patternName}',
    shortLabel: '${patternName}',
    description: 'Patrón de trastes ${minFret} al ${maxFret} generado interactivamente.',
    minFret: ${minFret},
    maxFret: ${maxFret},
    stringsFrets: {
      5: ${formattedStrings[5] || '[]'}, // 6ª cuerda (grave)
      4: ${formattedStrings[4] || '[]'}, // 5ª cuerda
      3: ${formattedStrings[3] || '[]'}, // 4ª cuerda
      2: ${formattedStrings[2] || '[]'}, // 3ª cuerda
      1: ${formattedStrings[1] || '[]'}, // 2ª cuerda
      0: ${formattedStrings[0] || '[]'}, // 1ª cuerda (aguda)
    }
  },`;
  };

  // Generador de JSON estructurado
  const generateJsonCode = () => {
    const cleaned: Record<number, { fret: number; finger: number; isRoot?: boolean; isStretch?: boolean }[]> = {};
    [5, 4, 3, 2, 1, 0].forEach((strIdx) => {
      cleaned[strIdx] = (stringsFrets[strIdx] || []).map((n) => ({
        fret: n.fret,
        finger: n.finger,
        ...(n.isRoot ? { isRoot: true } : {}),
        ...(n.isStretch ? { isStretch: true } : {}),
      }));
    });

    return JSON.stringify(
      {
        name: patternName,
        minFret,
        maxFret,
        stringsFrets: cleaned,
      },
      null,
      2
    );
  };

  const handleCopyTs = async () => {
    const code = generateTypeScriptCode();
    await navigator.clipboard.writeText(code);
    setCopiedTs(true);
    setTimeout(() => setCopiedTs(false), 2500);
  };

  const handleCopyJson = async () => {
    const code = generateJsonCode();
    await navigator.clipboard.writeText(code);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  // Conteo total de notas activas en la cuadrícula
  const totalNotesCount = Object.values(stringsFrets).reduce(
    (sum, list) => sum + (list ? list.length : 0),
    0
  );

  return (
    <div className="w-full my-2.5 flex flex-col gap-2">
      {/* Barra de Acciones Principal */}
      <div
        className={`w-full p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 shadow-xl flex flex-wrap items-center justify-between gap-2.5 ${
          isEditorActive
            ? 'bg-slate-900/95 dark:bg-slate-950/95 border-amber-500/50 ring-2 ring-amber-400/20 shadow-amber-500/10'
            : 'bg-slate-900/80 dark:bg-slate-950/80 border-slate-800'
        }`}
      >
        {/* Izquierda: Botón de Toggle del Editor + Estado */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleEditor}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95 ${
              isEditorActive
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-black shadow-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 ${isEditorActive ? 'text-slate-950 animate-spin-slow' : 'text-amber-400'}`}
            />
            <span>{isEditorActive ? 'Finalizar Edición' : '🛠️ Abrir Editor de Notas'}</span>
          </button>

          {isEditorActive && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{totalNotesCount} notas</span>
              <span className="text-amber-400/60">•</span>
              <span>Trastes {minFret}-{maxFret}</span>
            </div>
          )}
        </div>

        {/* Centro / Instrucción contextual cuando está activo */}
        {isEditorActive && (
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-300 font-mono bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-cyan-400 font-bold">Clic:</span>
            <span>Añadir / Cambiar dedo (1→2→3→4→Eliminar)</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-bold">Clic Secundario (Derecho):</span>
            <span>Marcar Tónica (Root)</span>
          </div>
        )}

        {/* Derecha: Botones de Acción (Copiar TS, Copiar JSON, Modal y Reset) */}
        {isEditorActive && (
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {/* Alternador Táctil para Móviles / Tablets */}
            {onTouchModeChange && (
              <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs sm:hidden">
                <button
                  type="button"
                  onClick={() => onTouchModeChange('cycle')}
                  className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[10px] ${
                    touchMode === 'cycle'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Modo Clic: Cambiar Dedo"
                >
                  <Hand className="w-3 h-3" />
                  <span>Dedo</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTouchModeChange('root')}
                  className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[10px] ${
                    touchMode === 'root'
                      ? 'bg-cyan-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Modo Clic: Marcar Tónica (Root)"
                >
                  <Target className="w-3 h-3" />
                  <span>Tónica</span>
                </button>
              </div>
            )}

            {/* Botón Ver Código */}
            <button
              type="button"
              onClick={() => setShowCodePreview((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                showCodePreview
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Previsualizar Código TS / JSON"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Botón Reiniciar a Escala Original */}
            {onResetGrid && (
              <button
                type="button"
                onClick={onResetGrid}
                className="p-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-all"
                title="Restablecer a la escala original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Botón Limpiar Todo */}
            {onClearGrid && (
              <button
                type="button"
                onClick={onClearGrid}
                className="p-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all"
                title="Limpiar todas las notas del diapasón"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Botón Copiar JSON */}
            <button
              type="button"
              onClick={handleCopyJson}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                copiedJson
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              title="Copiar definición en JSON"
            >
              {copiedJson ? (
                <Check className="w-3.5 h-3.5 text-slate-950" />
              ) : (
                <FileJson className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span className="hidden sm:inline">JSON</span>
            </button>

            {/* Botón Copiar TypeScript (Protagonista) */}
            <button
              type="button"
              onClick={handleCopyTs}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 border ${
                copiedTs
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black ring-2 ring-emerald-300/40'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 font-black ring-2 ring-cyan-400/20'
              }`}
              title="Copiar código TypeScript listo para scaleSystems.ts"
            >
              {copiedTs ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Código TS Copiado!</span>
                </>
              ) : (
                <>
                  <Code2 className="w-3.5 h-3.5" />
                  <span>📋 Copiar Código TS</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Pestaña Expansible de Previsualización de Código */}
      {isEditorActive && showCodePreview && (
        <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 shadow-2xl flex flex-col gap-2 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300">
                Previsualización de Exportación:
              </span>
              <div className="inline-flex p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('ts')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    previewTab === 'ts'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TypeScript (.ts)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('json')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    previewTab === 'json'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON (.json)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCodePreview(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <pre className="text-[11px] font-mono text-cyan-300 bg-slate-900/90 p-3 rounded-xl overflow-x-auto max-h-60 border border-slate-800/80 select-all leading-relaxed">
            {previewTab === 'ts' ? generateTypeScriptCode() : generateJsonCode()}
          </pre>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>
              Pega este bloque en{' '}
              <code className="text-amber-400 font-mono">lib/music-theory/scaleSystems.ts</code>
            </span>
            <button
              type="button"
              onClick={previewTab === 'ts' ? handleCopyTs : handleCopyJson}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 transition-all text-xs flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Copiar al Portapapeles</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
