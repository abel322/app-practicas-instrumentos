import React from 'react';
import type { Metadata } from 'next';
import { getExercises, getExerciseBySlug, getStringExerciseBySlug, getPianoExerciseBySlug } from '@/lib/prisma';
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
  let exercise: any = await getExerciseBySlug(slug);
  if (!exercise) {
    exercise = await getStringExerciseBySlug(slug);
  }
  if (!exercise) {
    exercise = await getPianoExerciseBySlug(slug);
  }

  if (!exercise) {
    return {
      title: 'Ejercicio — SoundLab Studio',
    };
  }

  return {
    title: `${exercise.title} — Práctica Runway | SoundLab`,
    description: exercise.description || `Estudio interactivo de ${exercise.title} con escaneo óptico Runway a tiempo real.`,
  };
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { slug } = await params;
  let exercise: any = await getExerciseBySlug(slug);
  if (!exercise) {
    exercise = await getStringExerciseBySlug(slug);
  }
  if (!exercise) {
    exercise = await getPianoExerciseBySlug(slug);
  }

  const safeExercise = exercise ?? {
    id: `local_${slug}`,
    slug,
    title: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    category: 'Rudimentos' as const,
    difficulty: 'Intermedio' as const,
    bpmDefault: 100,
    timeSignature: '4/4' as const,
    totalSteps: 16,
    subdivision: '1/16',
    stepsPerMeasure: 16,
    hitsData: [],
  };

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
      <PracticePlayer exercise={safeExercise} />
    </main>
  );
}
