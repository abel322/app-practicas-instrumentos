import React from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getStringExercises, getStringExerciseBySlug, getExerciseBySlug, getPianoExerciseBySlug } from '@/lib/prisma';
import { StringsPracticePlayer } from '@/components/strings/StringsPracticePlayer';
import { StringExerciseData } from '@/types/strings';

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
      title: 'Ejercicio de Cuerdas — SoundLab Studio',
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
  let exercise: any = await getStringExerciseBySlug(slug);

  if (!exercise) {
    const drumEx = await getExerciseBySlug(slug);
    if (drumEx) {
      redirect(`/practice/${drumEx.slug}`);
    }
    const pianoEx = await getPianoExerciseBySlug(slug);
    if (pianoEx) {
      redirect(`/piano/practice/${pianoEx.slug}`);
    }
  }

  const safeExercise: StringExerciseData = exercise ?? {
    id: `local_${slug}`,
    slug,
    title: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    instrument: 'guitar_6',
    tuning: 'E A D G B E',
    category: 'Licks & Riffs',
    difficulty: 'Intermedio',
    bpmDefault: 95,
    timeSignature: '4/4',
    totalSteps: 16,
    subdivision: '1/16',
    stepsPerMeasure: 16,
    tabData: [],
  };

  if (safeExercise.instrument === ('piano' as any)) {
    redirect(`/piano/practice/${safeExercise.slug}`);
  }

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
      <StringsPracticePlayer exercise={safeExercise} />
    </main>
  );
}
