import React from 'react';
import type { Metadata } from 'next';
import { getPianoExercises } from '@/lib/prisma';
import { PianoCatalogView } from '@/components/piano/PianoCatalogView';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Piano Lab — Teclas & Runway Polifónico para Piano | SoundLab Studio',
  description:
    'Biblioteca didáctica interactiva de piano con visualizador de teclas, independencia a dos manos y escaneo Runway en tiempo real.',
};

export default async function PianoPage() {
  const exercises = await getPianoExercises();

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-start">
      <PianoCatalogView initialExercises={exercises} />
    </main>
  );
}

