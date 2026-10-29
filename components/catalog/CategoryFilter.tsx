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
    <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#dce2ec]/80 dark:bg-slate-900/80 border border-slate-300/80 dark:border-white/10 w-fit max-w-full overflow-x-auto shadow-sm">
      {categories.map((category) => {
        const isActive = activeCategory === category;
        const count = categoryCounts[category] ?? 0;

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm transition-all select-none flex items-center gap-2 ${
              isActive
                ? 'text-white dark:text-zinc-950 font-bold'
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300/60 font-semibold dark:bg-transparent dark:text-zinc-400 dark:border-transparent dark:hover:text-zinc-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 rounded-xl bg-[#0891b2] dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{category}</span>

            {count > 0 && (
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold transition-colors ${
                  isActive
                    ? 'bg-black/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950'
                    : 'bg-slate-300/70 text-slate-700 dark:bg-white/10 dark:text-zinc-400'
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
