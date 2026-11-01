import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ExerciseBuilder } from '@/components/admin/ExerciseBuilder';

export const metadata: Metadata = {
  title: 'Studio Builder — Creador Avanzado & Ruta Técnica | SoundLab',
  description: 'Editor interactivo profesional para la creación y publicación de ejercicios para bajo, guitarra, piano y batería.',
};

export default function StudioBuilderPage() {
  return (
    <main className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-start">
      <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-500">Cargando Studio Builder...</div>}>
        <ExerciseBuilder />
      </Suspense>
    </main>
  );
}
