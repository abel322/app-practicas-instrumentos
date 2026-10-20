'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrumExerciseData, ExerciseCategory } from '@/types/drum';
import { CategoryFilter } from './CategoryFilter';
import { ExerciseCard } from './ExerciseCard';
import { Search, SlidersHorizontal, Drum, Sparkles } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');

  // Conteo de ejercicios por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Todos: initialExercises.length,
    };
    initialExercises.forEach((ex) => {
      counts[ex.category] = (counts[ex.category] || 0) + 1;
    });
    return counts;
  }, [initialExercises]);

  // Filtrado reactivo de ejercicios
  const filteredExercises = useMemo(() => {
    return initialExercises.filter((ex) => {
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
  }, [initialExercises, selectedCategory, selectedDifficulty, searchQuery]);

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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ejercicios..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de dificultad */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
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
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 px-4 rounded-2xl glass-panel border border-white/5 flex flex-col items-center justify-center gap-3"
          >
            <Drum className="w-12 h-12 text-zinc-600 mb-2" />
            <h4 className="text-base font-semibold text-zinc-300">
              No se encontraron ejercicios con estos criterios
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm">
              Prueba cambiando la categoría seleccionada o limpiando el campo de búsqueda.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchQuery('');
                setSelectedDifficulty('Todas');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
            >
              Restablecer filtros
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
