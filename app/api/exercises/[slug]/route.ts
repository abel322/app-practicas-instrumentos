import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeSubdivisionKey } from '@/lib/music-theory/rhythmSubdivisions';
import { STRINGS_INITIAL_EXERCISES } from '@/lib/stringsSeedData';
import { INITIAL_EXERCISES } from '@/lib/seedData';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug requerido' }, { status: 400 });
    }

    // 1. Buscar en StringExercise (Bajo, Guitarra, Piano)
    try {
      const stringEx = await prisma.stringExercise.findUnique({
        where: { slug },
      });

      if (stringEx) {
        const sub = normalizeSubdivisionKey(
          (stringEx as any).subdivision ||
          (stringEx.totalSteps === 8 ? '1/8' : stringEx.totalSteps === 4 ? '1/4' : stringEx.totalSteps === 12 && stringEx.timeSignature === '4/4' ? '1/8T' : '1/16')
        );

        return NextResponse.json({
          success: true,
          exercise: {
            id: stringEx.id,
            slug: stringEx.slug,
            title: stringEx.title,
            instrument: stringEx.instrument,
            instrumentType:
              stringEx.instrument === 'piano'
                ? 'piano'
                : stringEx.instrument === 'bass_4'
                ? 'bass'
                : 'guitar',
            tuning: stringEx.tuning,
            category: stringEx.category,
            difficulty: stringEx.difficulty,
            bpm: stringEx.bpmDefault,
            bpmDefault: stringEx.bpmDefault,
            timeSignature: stringEx.timeSignature,
            subdivision: sub,
            stepsPerMeasure: (stringEx as any).stepsPerMeasure || (stringEx.totalSteps <= 16 ? stringEx.totalSteps : (stringEx.timeSignature === '6/8' ? 12 : 16)),
            totalSteps: stringEx.totalSteps,
            tabData: stringEx.tabData,
            createdAt: stringEx.createdAt,
          },
        });
      }
    } catch (e) {
      console.warn('StringExercise findUnique error:', e);
    }

    // 2. Buscar en DrumExercise (Batería)
    try {
      const drumEx = await prisma.drumExercise.findUnique({
        where: { slug },
      });

      if (drumEx) {
        const sub = normalizeSubdivisionKey(
          (drumEx as any).subdivision ||
          (drumEx.totalSteps === 8 ? '1/8' : drumEx.totalSteps === 4 ? '1/4' : drumEx.totalSteps === 12 && drumEx.timeSignature === '4/4' ? '1/8T' : '1/16')
        );

        return NextResponse.json({
          success: true,
          exercise: {
            id: drumEx.id,
            slug: drumEx.slug,
            title: drumEx.title,
            instrument: 'drums',
            instrumentType: 'drums',
            category: drumEx.category,
            difficulty: drumEx.difficulty,
            bpm: drumEx.bpmDefault,
            bpmDefault: drumEx.bpmDefault,
            timeSignature: drumEx.timeSignature,
            subdivision: sub,
            stepsPerMeasure: (drumEx as any).stepsPerMeasure || (drumEx.totalSteps <= 16 ? drumEx.totalSteps : (drumEx.timeSignature === '6/8' ? 12 : 16)),
            totalSteps: drumEx.totalSteps,
            hitsData: drumEx.hitsData,
            createdAt: drumEx.createdAt,
          },
        });
      }
    } catch (e) {
      console.warn('DrumExercise findUnique error:', e);
    }

    // 3. Fallback a ejercicios predeterminados en memoria
    const foundString = STRINGS_INITIAL_EXERCISES.find((e) => e.slug === slug);
    if (foundString) {
      return NextResponse.json({
        success: true,
        exercise: {
          ...foundString,
          bpm: foundString.bpmDefault,
          instrumentType:
            foundString.instrument === 'bass_4'
              ? 'bass'
              : (foundString.instrument as any) === 'piano'
              ? 'piano'
              : 'guitar',
          subdivision: normalizeSubdivisionKey(foundString.subdivision || (foundString.totalSteps === 8 ? '1/8' : '1/16')),
        },
      });
    }

    const foundDrum = INITIAL_EXERCISES.find((e) => e.slug === slug);
    if (foundDrum) {
      return NextResponse.json({
        success: true,
        exercise: {
          ...foundDrum,
          bpm: foundDrum.bpmDefault,
          instrumentType: 'drums',
          subdivision: normalizeSubdivisionKey((foundDrum as any).subdivision || (foundDrum.totalSteps === 8 ? '1/8' : '1/16')),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Ejercicio no encontrado' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error interno' }, { status: 500 });
  }
}

