'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Music2 } from 'lucide-react';
import { getImprovOptionsForChord } from '@/lib/music-theory/chordImprovOptions';

export interface CustomChordStep {
  degreeLabel: string;
  bars: number;
  assignedImprovResourceId?: string;
}

const AVAILABLE_DEGREES = [
  { label: 'I', category: 'Diatónico' },
  { label: 'ii', category: 'Diatónico' },
  { label: 'iii', category: 'Diatónico' },
  { label: 'IV', category: 'Diatónico' },
  { label: 'V', category: 'Diatónico' },
  { label: 'vi', category: 'Diatónico' },
  { label: 'vii°', category: 'Diatónico' },
  { label: 'Imaj7', category: 'Séptimas' },
  { label: 'ii7', category: 'Séptimas' },
  { label: 'iii7', category: 'Séptimas' },
  { label: 'IVmaj7', category: 'Séptimas' },
  { label: 'V7', category: 'Séptimas' },
  { label: 'vi7', category: 'Séptimas' },
  { label: 'viiø7', category: 'Séptimas' },
  { label: 'iv', category: 'Intercambio' },
  { label: 'iv7', category: 'Intercambio' },
  { label: '♭VI', category: 'Intercambio' },
  { label: '♭VImaj7', category: 'Intercambio' },
  { label: '♭VII', category: 'Intercambio' },
  { label: '♭VII7', category: 'Intercambio' },
  { label: '♭III', category: 'Intercambio' },
  { label: '♭II', category: 'Intercambio' },
];

interface CreateProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newProgression: any) => void;
}

export function CreateProgressionModal({
  isOpen,
  onClose,
  onCreated,
}: CreateProgressionModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Personalizada');
  const [chords, setChords] = useState<CustomChordStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddDegree = (degreeLabel: string) => {
    setChords([...chords, { degreeLabel, bars: 2, assignedImprovResourceId: 'default' }]);
  };

  const handleRemoveChord = (index: number) => {
    setChords(chords.filter((_, i) => i !== index));
  };

  const handleUpdateBars = (index: number, bars: number) => {
    const updated = [...chords];
    updated[index].bars = bars;
    setChords(updated);
  };

  const handleUpdateImprov = (index: number, resourceId: string) => {
    const updated = [...chords];
    updated[index].assignedImprovResourceId = resourceId;
    setChords(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || chords.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/progressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category, chords }),
      });

      if (res.ok) {
        const created = await res.json();
        onCreated(created);
        onClose();
        setName('');
        setChords([]);
      } else {
        // Fallback local en caso de que la BD remota no esté conectada en ese instante
        const fallbackCreated = {
          id: `custom_${Date.now()}`,
          name: name.trim(),
          category,
          chordsJson: chords,
          createdAt: new Date().toISOString(),
        };
        onCreated(fallbackCreated);
        onClose();
        setName('');
        setChords([]);
      }
    } catch (err) {
      console.error(err);
      const fallbackCreated = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        category,
        chordsJson: chords,
        createdAt: new Date().toISOString(),
      };
      onCreated(fallbackCreated);
      onClose();
      setName('');
      setChords([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Music2 className="w-4 h-4" />
            <span>Crear Progresión & Asignar Improvisación</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nombre:</label>
              <input
                type="text"
                placeholder="Ej. Balada Neo-Soul, Jazz Turnaround..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Categoría:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Personalizada">Personalizada</option>
                <option value="Jazz / Blues">Jazz / Blues</option>
                <option value="Pop / Worship">Pop / Worship</option>
                <option value="Rock / Alternativo">Rock / Alternativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Secuencia Armónica ({chords.length} acordes):
            </label>
            {chords.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                Toca las etiquetas de grados abajo para agregar acordes a la progresión
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950 rounded-2xl border border-slate-800/80 min-h-[72px]">
                {chords.map((chord, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1.5 bg-slate-900 border border-cyan-800/60 p-2 rounded-xl shrink-0"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-sm font-black text-cyan-300 font-mono">
                        {chord.degreeLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChord(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <select
                      value={chord.bars}
                      onChange={(e) => handleUpdateBars(idx, Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 text-[10px] text-amber-400 font-mono rounded px-1.5 py-0.5 w-full"
                    >
                      <option value={1}>1 compás</option>
                      <option value={2}>2 compases</option>
                      <option value={4}>4 compases</option>
                    </select>

                    <select
                      value={chord.assignedImprovResourceId || 'default'}
                      onChange={(e) => handleUpdateImprov(idx, e.target.value)}
                      className="bg-slate-950 border border-cyan-900/60 text-[9px] text-cyan-300 font-bold rounded px-1 py-0.5 max-w-[125px]"
                    >
                      <option value="default">💡 Auto (Modo Diatónico)</option>
                      {getImprovOptionsForChord(chord.degreeLabel).map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.type === 'arpeggio'
                            ? '🎯'
                            : res.type === 'pentatonic'
                            ? '🎸'
                            : '🎼'}{' '}
                          {res.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/60">
            <label className="text-xs font-bold text-slate-400">
              Toca para agregar a la secuencia:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {AVAILABLE_DEGREES.map((deg) => (
                <button
                  key={deg.label}
                  type="button"
                  onClick={() => handleAddDegree(deg.label)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border transition-all active:scale-95 flex items-center gap-1 ${
                    deg.category === 'Intercambio'
                      ? 'bg-indigo-950/50 hover:bg-indigo-900 text-indigo-300 border-indigo-800/50'
                      : deg.category === 'Séptimas'
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700'
                  }`}
                >
                  <Plus className="w-3 h-3 opacity-60" />
                  <span>{deg.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || chords.length === 0 || !name.trim()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Progresión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProgressionModal;
