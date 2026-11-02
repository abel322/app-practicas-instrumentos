'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StringExerciseData, StringInstrument } from '@/types/strings';
import { StringExerciseCard } from './StringExerciseCard';
import { Search, Music } from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { toast } from '@/components/ui/ToastNotification';
import { deleteExerciseAction } from '@/app/actions/save-exercise';
import {
  getDeletedExerciseSlugs,
  markExerciseAsDeleted,
  getLocalExercises,
} from '@/lib/exercises/customExercisesStorage';

interface StringsCatalogViewProps {
  initialExercises: StringExerciseData[];
}

const CATEGORIES = [
  'Todas',
  'Slap & Pop',
  'Walking Bass',
  'Escalas & Arpegios',
  'Licks & Riffs',
  'Fingerpicking',
];

export const StringsCatalogView: React.FC<StringsCatalogViewProps> = ({ initialExercises }) => {
  const router = useRouter();
  const [exercises, setExercises] = useState<StringExerciseData[]>(initialExercises);
  const [selectedInstrument, setSelectedInstrument] = useState<'all' | StringInstrument>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');

  // Modal de confirmación de eliminación
  const [exerciseToDelete, setExerciseToDelete] = useState<StringExerciseData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sincronizar en el cliente con ejercicios locales modificados y omitir los eliminados
  useEffect(() => {
    try {
      const deletedSlugs = getDeletedExerciseSlugs();
      const localCustom = getLocalExercises().filter(
        (ex) =>
          ex.instrumentType !== 'drums' &&
          ex.instrumentType !== 'piano' &&
          ex.instrument !== 'piano' &&
          (ex.tabData || ex.instrument)
      );

      setExercises((prev) => {
        let list = prev.filter((ex) => !deletedSlugs.includes(ex.slug));

        localCustom.forEach((customEx) => {
          if (deletedSlugs.includes(customEx.slug)) return;

          const idx = list.findIndex((e) => e.slug === customEx.slug);
          const mappedEx: StringExerciseData = {
            id: customEx.id || customEx.slug,
            slug: customEx.slug,
            title: customEx.title,
            instrument:
              customEx.instrument ||
              (customEx.instrumentType === 'bass'
                ? 'bass_4'
                : customEx.instrumentType === 'piano'
                ? ('piano' as any)
                : 'guitar_6'),
            tuning:
              customEx.tuning ||
              (customEx.instrumentType === 'bass' ? 'E A D G' : 'E A D G B E'),
            category: customEx.category,
            difficulty: customEx.difficulty,
            bpmDefault: customEx.bpmDefault || customEx.bpm || 90,
            timeSignature: customEx.timeSignature || '4/4',
            totalSteps: customEx.totalSteps || (customEx.tabData ? customEx.tabData.length : 32),
            tabData: Array.isArray(customEx.tabData)
              ? customEx.tabData
              : Array.isArray(customEx.data)
              ? customEx.data
              : [],
            description: customEx.description || '',
          };

          if (idx !== -1) {
            list[idx] = mappedEx;
          } else {
            list = [mappedEx, ...list];
          }
        });

        return list;
      });
    } catch (err) {
      console.warn('Error sincronizando ejercicios locales de cuerdas:', err);
    }
  }, []);

  const handleEdit = (ex: StringExerciseData) => {
    const instType =
      ex.instrument === 'bass_4'
        ? 'bass'
        : ex.instrument === ('piano' as any)
        ? 'piano'
        : 'guitar';
    try {
      sessionStorage.setItem(
        'soundlab_editing_exercise',
        JSON.stringify({ ...ex, instrumentType: instType, subdivision: ex.subdivision || (ex.totalSteps === 8 ? '1/8' : '1/16') })
      );
    } catch (_) {}
    router.push(`/admin/builder?editSlug=${ex.slug}&instrument=${instType}`);
  };

  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);

    const instType =
      exerciseToDelete.instrument === 'bass_4'
        ? 'bass'
        : exerciseToDelete.instrument === ('piano' as any)
        ? 'piano'
        : 'guitar';

    try {
      // 1. Notificar a Prisma vía server action
      await deleteExerciseAction(exerciseToDelete.slug, instType);

      // 2. Persistir eliminación localmente
      markExerciseAsDeleted(exerciseToDelete.slug);

      // 3. Actualizar estado reactivo sin recargar
      setExercises((prev) => prev.filter((e) => e.slug !== exerciseToDelete.slug));

      toast.success(`Ejercicio "${exerciseToDelete.title}" eliminado con éxito.`);
      setExerciseToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar el ejercicio.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrado de ejercicios
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesInstrument =
        selectedInstrument === 'all' || ex.instrument === selectedInstrument;

      const matchesCategory =
        selectedCategory === 'Todas' || ex.category === selectedCategory;

      const matchesDifficulty =
        selectedDifficulty === 'Todas' || ex.difficulty === selectedDifficulty;

      const matchesSearch =
        searchQuery.trim() === '' ||
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesInstrument && matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [exercises, selectedInstrument, selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 1. Selector Superior de Instrumento: [Todos] / [Bajo] / [Guitarra] */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-[#dce2ec]/80 dark:bg-slate-900/80 border border-slate-300/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-zinc-900/60 border border-slate-300/70 dark:border-white/5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedInstrument('all')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'all' ? 'text-white dark:text-zinc-950 font-bold' : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {selectedInstrument === 'all' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-[#0891b2] dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Todos los Instrumentos</span>
          </button>

          <button
            onClick={() => setSelectedInstrument('bass_4')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'bass_4' ? 'text-white dark:text-zinc-950 font-bold' : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {selectedInstrument === 'bass_4' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-[#0891b2] dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Bajo (4 Cuerdas)</span>
          </button>

          <button
            onClick={() => setSelectedInstrument('guitar_6')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'guitar_6' ? 'text-white dark:text-zinc-950 font-bold' : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {selectedInstrument === 'guitar_6' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-[#0891b2] dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Guitarra (6 Cuerdas)</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros, Categorías y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Píldoras de Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-[#0891b2] text-white border-[#0891b2] shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50'
                  : 'bg-slate-200/80 text-slate-700 border-slate-300/80 hover:bg-slate-300 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-white/5 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Buscador y filtro de dificultad */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por técnica o título..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-900/80 border border-slate-300/80 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-zinc-500 focus:outline-none focus:border-[#0891b2] dark:focus:border-cyan-400 focus:ring-1 focus:ring-[#0891b2] dark:focus:ring-cyan-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-900/80 border border-slate-300/80 dark:border-white/10 text-xs text-slate-800 dark:text-zinc-300 focus:outline-none focus:border-[#0891b2] dark:focus:border-cyan-400 transition-all cursor-pointer font-medium"
          >
            <option value="Todas">Todas las dificultades</option>
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>
      </div>

      {/* 3. Grid de Ejercicios */}
      <AnimatePresence mode="popLayout">
        {filteredExercises.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredExercises.map((exercise, index) => (
              <StringExerciseCard
                key={exercise.id || exercise.slug}
                exercise={exercise}
                index={index}
                onEdit={handleEdit}
                onRequestDelete={(ex) => setExerciseToDelete(ex)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 px-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3 shadow-sm"
          >
            <Music className="w-12 h-12 text-slate-400 dark:text-zinc-600 mb-2" />
            <h4 className="text-base font-bold text-slate-800 dark:text-zinc-300">
              No se encontraron ejercicios de cuerdas
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-500 max-w-sm">
              Prueba cambiando el instrumento o limpiando los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSelectedInstrument('all');
                setSelectedCategory('Todas');
                setSelectedDifficulty('Todas');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500/10 dark:border dark:border-cyan-500/30 dark:text-cyan-400 text-xs font-bold hover:bg-[#0e7490] dark:hover:bg-cyan-500/20 transition-colors"
            >
              Restablecer filtros
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Estás seguro de eliminar este ejercicio?"
        itemName={exerciseToDelete ? `${exerciseToDelete.title} (${exerciseToDelete.category})` : undefined}
        description="Esta acción eliminará el ejercicio de cuerdas de la biblioteca y de la base de datos permanentemente."
        isDeleting={isDeleting}
      />
    </div>
  );
};
