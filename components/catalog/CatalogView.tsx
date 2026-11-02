'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DrumExerciseData, ExerciseCategory } from '@/types/drum';
import { CategoryFilter } from './CategoryFilter';
import { ExerciseCard } from './ExerciseCard';
import { Search, Drum } from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { toast } from '@/components/ui/ToastNotification';
import { deleteExerciseAction } from '@/app/actions/save-exercise';
import {
  getDeletedExerciseSlugs,
  markExerciseAsDeleted,
  getLocalExercises,
} from '@/lib/exercises/customExercisesStorage';

interface CatalogViewProps {
  initialExercises: DrumExerciseData[];
}

const CATEGORIES: ExerciseCategory[] = [
  'Todos',
  'Rudimentos',
  'Grooves',
  'Independencia',
  'Acentos & Síncopas',
];

export const CatalogView: React.FC<CatalogViewProps> = ({ initialExercises }) => {
  const router = useRouter();
  const [exercises, setExercises] = useState<DrumExerciseData[]>(initialExercises);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');

  // Modal de confirmación de eliminación
  const [exerciseToDelete, setExerciseToDelete] = useState<DrumExerciseData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sincronizar en el cliente con ejercicios locales modificados y omitir los eliminados
  useEffect(() => {
    try {
      const deletedSlugs = getDeletedExerciseSlugs();
      const localCustom = getLocalExercises().filter(
        (ex) => ex.instrumentType === 'drums' || ex.hitsData
      );

      setExercises((prev) => {
        // Excluir los eliminados
        let list = prev.filter((ex) => !deletedSlugs.includes(ex.slug));

        // Fusionar o anteponer ejercicios creados/actualizados en localStorage
        localCustom.forEach((customEx) => {
          if (deletedSlugs.includes(customEx.slug)) return;

          const idx = list.findIndex((e) => e.slug === customEx.slug);
          const mappedEx: DrumExerciseData = {
            id: customEx.id || customEx.slug,
            slug: customEx.slug,
            title: customEx.title,
            category: customEx.category,
            difficulty: customEx.difficulty,
            bpmDefault: customEx.bpmDefault || customEx.bpm || 100,
            timeSignature: customEx.timeSignature || '4/4',
            totalSteps: customEx.totalSteps || (customEx.hitsData ? customEx.hitsData.length : 32),
            hitsData: Array.isArray(customEx.hitsData)
              ? customEx.hitsData
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
      console.warn('Error sincronizando ejercicios locales:', err);
    }
  }, []);

  // Manejar edición: guardar en sessionStorage y navegar a Studio Builder
  const handleEdit = (ex: DrumExerciseData) => {
    try {
      sessionStorage.setItem(
        'soundlab_editing_exercise',
        JSON.stringify({ ...ex, instrumentType: 'drums', subdivision: ex.subdivision || (ex.totalSteps === 8 ? '1/8' : '1/16') })
      );
    } catch (_) {}
    router.push(`/admin/builder?editSlug=${ex.slug}&instrument=drums`);
  };

  // Manejar confirmación de eliminación
  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Notificar a la base de datos vía server action
      await deleteExerciseAction(exerciseToDelete.slug, 'drums');

      // 2. Persistir eliminación localmente para que no reaparezca
      markExerciseAsDeleted(exerciseToDelete.slug);

      // 3. Actualizar estado reactivo sin recargar la página
      setExercises((prev) => prev.filter((e) => e.slug !== exerciseToDelete.slug));

      toast.success(`Ejercicio "${exerciseToDelete.title}" eliminado con éxito.`);
      setExerciseToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar el ejercicio.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Conteo de ejercicios por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Todos: exercises.length,
    };
    exercises.forEach((ex) => {
      counts[ex.category] = (counts[ex.category] || 0) + 1;
    });
    return counts;
  }, [exercises]);

  // Filtrado reactivo de ejercicios
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesCategory =
        selectedCategory === 'Todos' || ex.category === selectedCategory;

      const matchesDifficulty =
        selectedDifficulty === 'Todas' || ex.difficulty === selectedDifficulty;

      const matchesSearch =
        searchQuery.trim() === '' ||
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [exercises, selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Barra de Filtros, Categorías y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Píldoras de Categoría */}
        <CategoryFilter
          categories={CATEGORIES}
          activeCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
        />

        {/* Buscador y filtro de dificultad */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Input de búsqueda */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ejercicios..."
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

          {/* Selector de dificultad */}
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

      {/* Grid de Ejercicios */}
      <AnimatePresence mode="popLayout">
        {filteredExercises.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredExercises.map((exercise, index) => (
              <ExerciseCard
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
            <Drum className="w-12 h-12 text-slate-400 dark:text-zinc-600 mb-2" />
            <h4 className="text-base font-bold text-slate-800 dark:text-zinc-300">
              No se encontraron ejercicios con estos criterios
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-500 max-w-sm">
              Prueba cambiando la categoría seleccionada o limpiando el campo de búsqueda.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchQuery('');
                setSelectedDifficulty('Todas');
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
        description="Esta acción eliminará el ejercicio de la biblioteca y de la base de datos de manera permanente."
        isDeleting={isDeleting}
      />
    </div>
  );
};
