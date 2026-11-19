import React from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPianoExercises, getPianoExerciseBySlug, getStringExerciseBySlug, getExerciseBySlug } from '@/lib/prisma';
import { KeysPracticePlayer } from '@/components/piano/KeysPracticePlayer';
import { PianoExerciseData } from '@/types/piano';

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
      title: 'Ejercicio de Piano — SoundLab Studio',
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
  let exercise: any = await getPianoExerciseBySlug(slug);

  if (!exercise) {
    const stringEx = await getStringExerciseBySlug(slug);
    if (stringEx) {
      redirect(`/strings/practice/${stringEx.slug}`);
    }
    const drumEx = await getExerciseBySlug(slug);
    if (drumEx) {
      redirect(`/practice/${drumEx.slug}`);
    }
  }

  const safeExercise: PianoExerciseData = exercise ?? {
    id: `local_${slug}`,
    slug,
    title: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    instrument: 'piano',
    category: 'Clásico',
    difficulty: 'Intermedio',
    bpmDefault: 90,
    timeSignature: '4/4',
    totalSteps: 16,
    subdivision: '1/16',
    stepsPerMeasure: 16,
    notesData: [],
    description: `Ejercicio de piano: ${slug}`,
  };

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
      <KeysPracticePlayer exercise={safeExercise} />
    </main>
  );
}
