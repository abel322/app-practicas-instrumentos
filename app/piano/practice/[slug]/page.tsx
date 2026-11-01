import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPianoExercises, getPianoExerciseBySlug } from '@/lib/prisma';
import { KeysPracticePlayer } from '@/components/piano/KeysPracticePlayer';

interface PianoPracticePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const exercises = await getPianoExercises();
  return exercises.map((ex) => ({
    slug: ex.slug,
  }));
}

export async function generateMetadata({ params }: PianoPracticePageProps): Promise<Metadata> {
  const { slug } = await params;
  const exercise = await getPianoExerciseBySlug(slug);

  if (!exercise) {
    return {
      title: 'Ejercicio de Piano No Encontrado — SoundLab Studio',
    };
  }

  return {
    title: `${exercise.title} — Keys Lab Runway para Piano | SoundLab Studio`,
    description:
      exercise.description ||
      `Práctica interactiva de piano con visualizador de teclas de 49 notas y escaneo rítmico Runway a tiempo real.`,
  };
}

export default async function PianoPracticePage({ params }: PianoPracticePageProps) {
  const { slug } = await params;
  const exercise = await getPianoExerciseBySlug(slug);

  if (!exercise) {
    notFound();
  }

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
      <KeysPracticePlayer exercise={exercise} />
    </main>
  );
}

