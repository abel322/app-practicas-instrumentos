'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExerciseCategory } from '@/types/drum';

interface CategoryFilterProps {
  categories: ExerciseCategory[];
  activeCategory: ExerciseCategory;
  onSelectCategory: (category: ExerciseCategory) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-panel border border-slate-200 dark:border-white/10 w-fit max-w-full overflow-x-auto shadow-sm">
      {categories.map((category) => {
        const isActive = activeCategory === category;
        const count = categoryCounts[category] ?? 0;

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors select-none flex items-center gap-2 ${
              isActive
                ? 'text-zinc-950 font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 rounded-xl bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{category}</span>

            {count > 0 && (
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold transition-colors ${
                  isActive
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
