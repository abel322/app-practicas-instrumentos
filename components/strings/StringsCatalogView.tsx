'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StringExerciseData, StringInstrument } from '@/types/strings';
import { StringExerciseCard } from './StringExerciseCard';
import { Search, Music, Sparkles } from 'lucide-react';

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
  const [selectedInstrument, setSelectedInstrument] = useState<'all' | StringInstrument>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');

  // Filtrado de ejercicios
  const filteredExercises = useMemo(() => {
    return initialExercises.filter((ex) => {
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
  }, [initialExercises, selectedInstrument, selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 1. Selector Superior de Instrumento: [Todos] / [Bajo] / [Guitarra] */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/60 border border-white/5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedInstrument('all')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'all' ? 'text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {selectedInstrument === 'all' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Todos los Instrumentos</span>
          </button>

          <button
            onClick={() => setSelectedInstrument('bass_4')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'bass_4' ? 'text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {selectedInstrument === 'bass_4' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Bajo (4 Cuerdas)</span>
          </button>

          <button
            onClick={() => setSelectedInstrument('guitar_6')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'guitar_6' ? 'text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {selectedInstrument === 'guitar_6' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Guitarra (6 Cuerdas)</span>
          </button>
        </div>

        {/* Contador rápido */}
        <div className="text-xs text-zinc-400 font-mono px-3">
          {filteredExercises.length} {filteredExercises.length === 1 ? 'ejercicio' : 'ejercicios'} encontrados
        </div>
      </div>

      {/* 2. Filtros de Categorías y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Píldoras de Categoría */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-panel border border-white/10 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors select-none ${
                  isActive ? 'text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeStringCatPill"
                    className="absolute inset-0 rounded-xl bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Buscador & Dificultad */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por técnica o título..."
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

      {/* 3. Grid de Tarjetas */}
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
            <Music className="w-12 h-12 text-zinc-600 mb-2" />
            <h4 className="text-base font-semibold text-zinc-300">
              No se encontraron ejercicios de cuerdas
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm">
              Prueba cambiando el instrumento o limpiando los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSelectedInstrument('all');
                setSelectedCategory('Todas');
                setSelectedDifficulty('Todas');
                setSearchQuery('');
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
