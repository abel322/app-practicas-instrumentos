import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getExercises, getExerciseBySlug } from '@/lib/prisma';
import { PracticePlayer } from '@/components/practice/PracticePlayer';

interface PracticePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const exercises = await getExercises();
  return exercises.map((ex) => ({
    slug: ex.slug,
  }));
}

export async function generateMetadata({ params }: PracticePageProps): Promise<Metadata> {
  const { slug } = await params;
  const exercise = await getExerciseBySlug(slug);

  if (!exercise) {
    return {
      title: 'Ejercicio No Encontrado — Drum Lab',
    };
  }

  return {
    title: `${exercise.title} — Práctica Runway | Drum Lab`,
    description: exercise.description || `Estudio interactivo de ${exercise.title} con pentagrama formal de batería de 5 líneas y escaneo Runway a tiempo real.`,
  };
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { slug } = await params;
  const exercise = await getExerciseBySlug(slug);

  if (!exercise) {
    notFound();
  }

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
      <PracticePlayer exercise={exercise} />
    </main>
  );
}
