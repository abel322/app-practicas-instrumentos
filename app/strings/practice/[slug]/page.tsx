import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStringExercises, getStringExerciseBySlug } from '@/lib/prisma';
import { StringsPracticePlayer } from '@/components/strings/StringsPracticePlayer';

interface StringsPracticePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const exercises = await getStringExercises();
  return exercises.map((ex) => ({
    slug: ex.slug,
  }));
}

export async function generateMetadata({ params }: StringsPracticePageProps): Promise<Metadata> {
  const { slug } = await params;
  const exercise = await getStringExerciseBySlug(slug);

  if (!exercise) {
    return {
      title: 'Ejercicio de Cuerdas No Encontrado — SoundLab',
    };
  }

  const instrLabel = exercise.instrument === 'bass_4' ? 'Bajo' : 'Guitarra';
  return {
    title: `${exercise.title} — Tablatura Runway de ${instrLabel} | SoundLab`,
    description: exercise.description || `Práctica interactiva de ${exercise.title} con tablatura profesional y escaneo Runway.`,
  };
}

export default async function StringsPracticePage({ params }: StringsPracticePageProps) {
  const { slug } = await params;
  const exercise = await getStringExerciseBySlug(slug);

  if (!exercise) {
    notFound();
  }

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
      <StringsPracticePlayer exercise={exercise} />
    </main>
  );
}
