import React from 'react';
import type { Metadata } from 'next';
import { getStringExercises } from '@/lib/prisma';
import { StringsCatalogView } from '@/components/strings/StringsCatalogView';
import { Music, Sparkles, Sliders, AudioLines } from 'lucide-react';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Strings Lab — Tablatura & Runway para Bajo y Guitarra | SoundLab',
  description: 'Catálogo interactivo de ejercicios de cuerda: Slap & Pop, Walking Bass, licks de blues y arpegios con tablatura profesional y cursor Runway.',
};

export default async function StringsPage() {
  const exercises = await getStringExercises();

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col gap-10">
      {/* Cabecera Hero */}
      <header className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Módulo Strings Lab</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Strings Lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Runway</span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
          Estudio de bajo eléctrico (4 cuerdas) y guitarra (6 cuerdas) con tablatura interactiva de alta resolución, digitación, técnicas percusivas y escaneo visual sincronizado.
        </p>

        {/* Indicadores rápidos */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-cyan-400" />
            <span>{exercises.length} Ejercicios de Cuerda</span>
          </div>
          <div className="h-3 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <AudioLines className="w-4 h-4 text-fuchsia-400" />
            <span>Síntesis Web Audio Pluck</span>
          </div>
          <div className="h-3 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>4 &amp; 6 Cuerdas Soportadas</span>
          </div>
        </div>
      </header>

      {/* Catálogo Interactivo */}
      <section className="w-full">
        <StringsCatalogView initialExercises={exercises} />
      </section>

      {/* Pie */}
      <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <p>© {new Date().getFullYear()} SoundLab Studio — Módulo Strings Lab.</p>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 font-mono">Bajo (4C)</span>
          <span>•</span>
          <span className="text-zinc-400 font-mono">Guitarra (6C)</span>
          <span>•</span>
          <span className="text-zinc-400 font-mono">Runway SVG</span>
        </div>
      </footer>
    </main>
  );
}
