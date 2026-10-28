import React from 'react';
import { getExercises } from '@/lib/prisma';
import { CatalogView } from '@/components/catalog/CatalogView';
import { Drum, Sparkles, Music, Activity } from 'lucide-react';

export const revalidate = 60; // Regenerar cada 60s si es aplicable

export default async function HomePage() {
  const exercises = await getExercises();

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col gap-10">
      {/* Hero Header Minimalista */}
      <header className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plataforma de Práctica &amp; Runway</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Drum Lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-cyan-300 dark:from-cyan-400 dark:to-cyan-200">Runway</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          Entorno interactivo y minimalista para el estudio riguroso de rudimentos, grooves funk y coordinación de batería con pentagrama de 5 líneas y escaneo óptico a tiempo real.
        </p>

        {/* Indicadores rápidos */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-mono text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Drum className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span>{exercises.length} Ejercicios Disponibles</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
            <span>Notación Formal SVG</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Web Audio Clock Preciso</span>
          </div>
        </div>
      </header>

      {/* Catálogo Interactivo con Filtros */}
      <section className="w-full">
        <CatalogView initialExercises={exercises} />
      </section>

      {/* Footer Minimalista */}
      <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-4">
        <p>© {new Date().getFullYear()} Drum Lab — Diseñado para el estudio musical sin distracciones.</p>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 dark:text-zinc-400 font-mono">Web Audio API</span>
          <span>•</span>
          <span className="text-slate-600 dark:text-zinc-400 font-mono">Framer Motion</span>
          <span>•</span>
          <span className="text-slate-600 dark:text-zinc-400 font-mono">Prisma ORM</span>
        </div>
      </footer>
    </main>
  );
}
