'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MasteryInstrument, MasterySkillNode, CustomLevelInput } from '@/types/mastery';
import {
  X,
  Plus,
  Wand2,
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Music,
  Gauge,
  Clock,
} from 'lucide-react';

interface AddLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: MasteryInstrument;
  nextLevelNumber: number;
  onSaveQuickLevel: (input: CustomLevelInput) => void;
  editingSkill?: MasterySkillNode | null;
  onUpdateLevel?: (skillId: string, input: Partial<CustomLevelInput>) => void;
}

export const AddLevelModal: React.FC<AddLevelModalProps> = ({
  isOpen,
  onClose,
  instrument,
  nextLevelNumber,
  onSaveQuickLevel,
  editingSkill,
  onUpdateLevel,
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'quick'>(editingSkill ? 'quick' : 'choose');

  // Form State
  const [title, setTitle] = useState('');
  const [technique, setTechnique] = useState('');
  const [tabOrNotation, setTabOrNotation] = useState('');
  const [description, setDescription] = useState('');
  const [initialBpm, setInitialBpm] = useState<number>(80);
  const [targetBpm, setTargetBpm] = useState<number>(110);
  const [targetReps, setTargetReps] = useState<number>(3);
  const [subdivision, setSubdivision] = useState<string>('1/16');
  const [passCriterion, setPassCriterion] = useState<string>('');
  const [difficultyLabel, setDifficultyLabel] = useState<
    'Fundamentos' | 'Básico-Medio' | 'Intermedio' | 'Intermedio-Alto' | 'Avanzado' | 'Virtuoso / Maestría'
  >('Avanzado');

  useEffect(() => {
    if (editingSkill) {
      setTitle(editingSkill.title);
      setTechnique(editingSkill.technique);
      setTabOrNotation(editingSkill.microExercise.tabOrNotation);
      setDescription(editingSkill.microExercise.description);
      setInitialBpm(editingSkill.initialBpm);
      setTargetBpm(editingSkill.targetBpm);
      setTargetReps(editingSkill.targetReps);
      setSubdivision(editingSkill.subdivision);
      setPassCriterion(editingSkill.passCriterion);
      setDifficultyLabel(editingSkill.difficultyLabel);
      setMode('quick');
    } else {
      const defaultLvl = nextLevelNumber;
      setTitle(`Estudio de Velocidad Nivel ${defaultLvl}`);
      setTechnique('Técnica de Precisión y Resistencia');
      setTabOrNotation(
        instrument === 'piano'
          ? 'MD: [C4-E4-G4-B4] [C5-B4-G4-E4]\nMI: [C3-G3-C4-G3]'
          : instrument === 'drums'
          ? 'HH: | x x x x x x x x |\nSD: | . . o . . . o . |\nBD: | o . . o . . o . |'
          : 'e|-----------------5-7-8-7-5-------|\nB|---------5-7-8-7-----------------|\nG|-5-7-8-7-------------------------|'
      );
      setDescription('Patrón técnico de agilidad y coordinación.');
      setInitialBpm(80);
      setTargetBpm(110);
      setTargetReps(3);
      setSubdivision('1/16');
      setPassCriterion(`3 repeticiones limpias consecutivas a 110 BPM sin tensión.`);
      setDifficultyLabel('Avanzado');
      setMode('choose');
    }
  }, [editingSkill, nextLevelNumber, instrument, isOpen]);

  if (!isOpen) return null;

  const handleLaunchStudioBuilder = () => {
    onClose();
    router.push(`/admin/builder?instrument=${instrument}&level=${nextLevelNumber}&target=mastery`);
  };

  const handleSubmitQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tabOrNotation.trim()) return;

    if (editingSkill && onUpdateLevel) {
      onUpdateLevel(editingSkill.id, {
        title,
        technique,
        tabOrNotation,
        description,
        initialBpm,
        targetBpm,
        targetReps,
        subdivision,
        passCriterion:
          passCriterion.trim() ||
          `3 repeticiones limpias consecutivas a ${targetBpm} BPM.`,
        difficultyLabel,
      });
    } else {
      onSaveQuickLevel({
        title,
        technique,
        tabOrNotation,
        description,
        initialBpm,
        targetBpm,
        targetReps,
        subdivision,
        passCriterion:
          passCriterion.trim() ||
          `3 repeticiones limpias consecutivas a ${targetBpm} BPM.`,
        difficultyLabel,
        level: nextLevelNumber,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 dark:bg-black/85 backdrop-blur-md overflow-y-auto select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors"
      >
        {/* Cabecera */}
        <header className="px-5 py-4 bg-slate-100 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                  {instrument.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {editingSkill ? `Editar Nivel ${editingSkill.level}` : `Nivel Siguiente: 0${nextLevelNumber}`}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {editingSkill ? 'Editar Nivel Personalizado' : 'Añadir Nivel a la Ruta Técnica'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Contenido según Modo */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {mode === 'choose' && !editingSkill ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Elige cómo deseas crear el <strong>Nivel {nextLevelNumber}</strong> para tu ruta de{' '}
                <span className="text-amber-600 dark:text-amber-400 font-bold uppercase">{instrument}</span>:
              </p>

              {/* Opción A: Diseñar en Studio Builder */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={handleLaunchStudioBuilder}
                className="group p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-slate-100 dark:to-slate-900/60 border-2 border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-all shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Wand2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-cyan-700 dark:text-cyan-400">
                      <span>Opción Recomendada</span>
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Diseñar en Studio Builder Interactivo
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Compón el ejercicio con el editor multicompás, Piano Roll, tablatura o entrada Web MIDI USB y vincúlalo directamente a la Ruta Técnica.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-cyan-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </motion.div>

              {/* Opción B: Crear Nivel Rápido */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setMode('quick')}
                className="group p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sliders className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-700 dark:text-amber-400">
                      Formulario Exprés
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Crear Nivel Rápido
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Escribe el título, tablatura/notación resumida y parámetros de tempo directamente en este modal sin salir de la vista.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </motion.div>
            </div>
          ) : (
            /* Formulario Exprés */
            <form onSubmit={handleSubmitQuick} className="space-y-4">
              {/* Título y Técnica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Título de la Técnica *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Sweep Picking en 5 Cuerdas"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Dificultad
                  </label>
                  <select
                    value={difficultyLabel}
                    onChange={(e) => setDifficultyLabel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Fundamentos">Fundamentos</option>
                    <option value="Básico-Medio">Básico-Medio</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Intermedio-Alto">Intermedio-Alto</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Virtuoso / Maestría">Virtuoso / Maestría</option>
                  </select>
                </div>
              </div>

              {/* Notación / Tablatura */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                  <span>Micro-ejercicio (Tablatura o Notas) *</span>
                  <span className="text-slate-400 text-[10px]">Genera el visor Runway interactivo</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={tabOrNotation}
                  onChange={(e) => setTabOrNotation(e.target.value)}
                  placeholder="Escribe la tablatura o notas separadas por espacios..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Parámetros de BPM */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Tempo Inicial (BPM)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={260}
                    value={initialBpm}
                    onChange={(e) => setInitialBpm(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Tempo Meta (BPM)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={260}
                    value={targetBpm}
                    onChange={(e) => setTargetBpm(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Subdivisión
                  </label>
                  <select
                    value={subdivision}
                    onChange={(e) => setSubdivision(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono"
                  >
                    <option value="1/4">1/4 (Negras)</option>
                    <option value="1/8">1/8 (Corcheas)</option>
                    <option value="1/16">1/16 (Semicorcheas)</option>
                    <option value="1/8T">1/8T (Tresillos)</option>
                    <option value="1/32">1/32 (Fusas)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Reps Meta
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={targetReps}
                    onChange={(e) => setTargetReps(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Criterio de Pase */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Criterio de Pase
                </label>
                <input
                  type="text"
                  value={passCriterion}
                  onChange={(e) => setPassCriterion(e.target.value)}
                  placeholder="3 repeticiones limpias consecutivas a tempo meta..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Botones de Envío */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                {!editingSkill && (
                  <button
                    type="button"
                    onClick={() => setMode('choose')}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    &larr; Volver a opciones
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingSkill ? 'Actualizar Nivel' : 'Guardar en Ruta Técnica'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

