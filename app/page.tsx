import React from 'react';
import Link from 'next/link';
import { getExercises } from '@/lib/prisma';
import { CatalogView } from '@/components/catalog/CatalogView';
import { Drum, Sparkles, Music, Activity, Target, ArrowRight } from 'lucide-react';

export const revalidate = 60; // Regenerar cada 60s si es aplicable

export default async function HomePage() {
  const exercises = await getExercises();

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col gap-10">
      {/* Hero Header Minimalista */}
      <header className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0891b2]/15 border border-[#0891b2]/30 text-[#0891b2] dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plataforma de Práctica &amp; Runway</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Drum Lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0891b2] to-cyan-600 dark:from-cyan-400 dark:to-cyan-200">Runway</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl font-medium">
          Entorno interactivo y minimalista para el estudio riguroso de rudimentos, grooves funk y coordinación de batería con pentagrama de 5 líneas y escaneo óptico a tiempo real.
        </p>

        {/* Indicadores rápidos */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-mono text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Drum className="w-4 h-4 text-[#0891b2] dark:text-cyan-400" />
            <span>{exercises.length} Ejercicios Disponibles</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
            <span>Notación Formal SVG</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Web Audio Clock Preciso</span>
          </div>
        </div>
      </header>

      {/* Banner Destacado: Ruta Técnica por Niveles (Mastery Path) */}
      <div className="w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900/95 via-[#0B131F] to-slate-900/95 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
            <Target className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Nuevo Módulo
              </span>
              <span className="text-xs font-mono text-slate-400">Guitarra &bull; Piano &bull; Bajo &bull; Batería</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Ruta Técnica por Niveles &bull; Mastery Path
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Rutinas acotadas de 15 a 20 minutos con metrónomo Web Audio, criterios de pase medibles y desbloqueo secuencial de 5 niveles por instrumento.
            </p>
          </div>
        </div>

        <Link
          href="/mastery"
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105 shrink-0"
        >
          <span>Explorar Árbol de Niveles</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Catálogo Interactivo con Filtros */}
      <section className="w-full">
        <CatalogView initialExercises={exercises} />
      </section>

      {/* Footer Minimalista */}
      <footer className="mt-16 pt-8 border-t border-slate-300/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-4">
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
