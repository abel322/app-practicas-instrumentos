'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PianoExerciseData, PianoCategory } from '@/types/piano';
import { PianoExerciseCard } from './PianoExerciseCard';
import { Search, KeyboardMusic, Sparkles } from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { toast } from '@/components/ui/ToastNotification';
import { deleteExerciseAction } from '@/app/actions/save-exercise';
import {
  getDeletedExerciseSlugs,
  markExerciseAsDeleted,
  getLocalExercises,
} from '@/lib/exercises/customExercisesStorage';

interface PianoCatalogViewProps {
  initialExercises: PianoExerciseData[];
}

const CATEGORIES: PianoCategory[] = [
  'Todas',
  'Clásico',
  'Hanon & Técnica',
  'Jazz & Voicings',
  'Pop & Worship',
  'Independencia de Manos',
  'Acordes & Arpegios',
];

export const PianoCatalogView: React.FC<PianoCatalogViewProps> = ({ initialExercises }) => {
  const router = useRouter();
  const [exercises, setExercises] = useState<PianoExerciseData[]>(initialExercises);
  const [selectedCategory, setSelectedCategory] = useState<PianoCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');

  // Modal de confirmación de eliminación
  const [exerciseToDelete, setExerciseToDelete] = useState<PianoExerciseData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sincronizar en el cliente con ejercicios locales modificados y omitir los eliminados
  useEffect(() => {
    try {
      const deletedSlugs = getDeletedExerciseSlugs();
      const localCustom = getLocalExercises().filter(
        (ex) => ex.instrumentType === 'piano' || ex.instrument === 'piano'
      );

      setExercises((prev) => {
        let list = prev.filter((ex) => !deletedSlugs.includes(ex.slug));

        localCustom.forEach((customEx) => {
          if (deletedSlugs.includes(customEx.slug)) return;

          const idx = list.findIndex((e) => e.slug === customEx.slug);
          const mappedEx: PianoExerciseData = {
            id: customEx.id || customEx.slug,
            slug: customEx.slug,
            title: customEx.title,
            instrument: 'piano',
            category: customEx.category,
            difficulty: customEx.difficulty,
            bpmDefault: customEx.bpmDefault || customEx.bpm || 90,
            timeSignature: customEx.timeSignature || '4/4',
            totalSteps: customEx.totalSteps || 32,
            notesData: Array.isArray(customEx.notesData)
              ? customEx.notesData
              : Array.isArray(customEx.tabData)
              ? customEx.tabData
              : Array.isArray(customEx.data)
              ? customEx.data
              : [],
            description: customEx.description || `Ejercicio de piano: ${customEx.title}`,
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
      console.warn('Error sincronizando ejercicios de piano:', err);
    }
  }, []);

  const handleEdit = (ex: PianoExerciseData) => {
    try {
      sessionStorage.setItem(
        'soundlab_editing_exercise',
        JSON.stringify({ ...ex, instrumentType: 'piano' })
      );
    } catch (_) {}
    router.push(`/admin/builder?editSlug=${ex.slug}&instrument=piano`);
  };

  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);

    try {
      await deleteExerciseAction(exerciseToDelete.slug, 'piano');
      markExerciseAsDeleted(exerciseToDelete.slug);
      setExercises((prev) => prev.filter((e) => e.slug !== exerciseToDelete.slug));
      toast.success(`Ejercicio "${exerciseToDelete.title}" eliminado con éxito.`);
      setExerciseToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar el ejercicio de piano.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Conteo de ejercicios por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Todas: exercises.length,
    };
    exercises.forEach((ex) => {
      counts[ex.category] = (counts[ex.category] || 0) + 1;
    });
    return counts;
  }, [exercises]);

  // Filtrado de ejercicios
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesCategory =
        selectedCategory === 'Todas' || ex.category === selectedCategory;

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
      {/* Banner / Cabecera de Keys Lab */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-cyan-500/10 border border-amber-500/30 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <KeyboardMusic className="w-3.5 h-3.5" />
                Keys Lab Runway
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Piano Polifónico &bull; Clave de Sol y Fa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Biblioteca de Piano &amp; Teclados
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mt-1 leading-relaxed">
              Explora estudios de Hanon, voicings de jazz modal, progresiones pop contemporáneas e independencia a dos manos con visualizador de teclas y escaneo rítmico a tiempo real.
            </p>
          </div>

          <button
            onClick={() => router.push('/admin/builder?instrument=piano')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Componer en Studio Builder</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros, Categorías y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Píldoras de Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-sm'
                  : 'bg-slate-200/80 text-slate-700 border-slate-300/80 hover:bg-slate-300 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-white/5 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{cat}</span>
              {categoryCounts[cat] !== undefined && (
                <span className="ml-1.5 opacity-70 text-[10px]">({categoryCounts[cat]})</span>
              )}
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
              placeholder="Buscar estudios de piano..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-900/80 border border-slate-300/80 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
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
            className="px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-900/80 border border-slate-300/80 dark:border-white/10 text-xs text-slate-800 dark:text-zinc-300 focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
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
              <PianoExerciseCard
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
            <KeyboardMusic className="w-12 h-12 text-slate-400 dark:text-zinc-600 mb-2" />
            <h4 className="text-base font-bold text-slate-800 dark:text-zinc-300">
              No se encontraron ejercicios de piano
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-500 max-w-sm">
              Prueba cambiando la categoría seleccionada o limpiando el campo de búsqueda.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todas');
                setSearchQuery('');
                setSelectedDifficulty('Todas');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
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
        title="¿Estás seguro de eliminar este ejercicio de piano?"
        itemName={exerciseToDelete ? `${exerciseToDelete.title} (${exerciseToDelete.category})` : undefined}
        description="Esta acción eliminará el ejercicio de piano de la biblioteca de manera permanente."
        isDeleting={isDeleting}
      />
    </div>
  );
};

