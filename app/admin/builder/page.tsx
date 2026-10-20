import React from 'react';
import type { Metadata } from 'next';
import { ExerciseBuilder } from '@/components/admin/ExerciseBuilder';

export const metadata: Metadata = {
  title: 'Studio Builder — Creador Avanzado de Ejercicios Multicompás | SoundLab',
  description: 'Editor interactivo profesional para la creación y publicación de ejercicios de varios compases para bajo, guitarra y batería.',
};

export default function BuilderPage() {
  return (
    <main className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-start">
      <ExerciseBuilder />
    </main>
  );
}
