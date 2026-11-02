import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeSubdivisionKey } from '@/lib/music-theory/rhythmSubdivisions';
import { normalizeInstrumentKey } from '@/lib/music-theory/instrumentUtils';
import { STRINGS_INITIAL_EXERCISES } from '@/lib/stringsSeedData';
import { INITIAL_EXERCISES } from '@/lib/seedData';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug o ID requerido' }, { status: 400 });
    }

    const url = new URL(request.url);
    const rawInstrument = url.searchParams.get('instrument');
    const instrumentHint = rawInstrument ? normalizeInstrumentKey(rawInstrument) : null;

    // Helper para buscar en Batería
    const findDrum = async () => {
      try {
        const drumEx = await prisma.drumExercise.findFirst({
          where: {
            OR: [{ slug }, { id: slug }],
          },
        });

        if (drumEx) {
          const sub = normalizeSubdivisionKey(
            (drumEx as any).subdivision ||
            (drumEx.totalSteps === 8 ? '1/8' : drumEx.totalSteps === 4 ? '1/4' : drumEx.totalSteps === 12 && drumEx.timeSignature === '4/4' ? '1/8T' : '1/16')
          );

          return {
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
          };
        }
      } catch (e) {
        console.warn('DrumExercise findFirst error:', e);
      }
      return null;
    };

    // Helper para buscar en Cuerdas / Piano
    const findString = async () => {
      try {
        const stringEx = await prisma.stringExercise.findFirst({
          where: {
            OR: [{ slug }, { id: slug }],
          },
        });

        if (stringEx) {
          const sub = normalizeSubdivisionKey(
            (stringEx as any).subdivision ||
            (stringEx.totalSteps === 8 ? '1/8' : stringEx.totalSteps === 4 ? '1/4' : stringEx.totalSteps === 12 && stringEx.timeSignature === '4/4' ? '1/8T' : '1/16')
          );

          const instType =
            stringEx.instrument === 'piano'
              ? 'piano'
              : stringEx.instrument === 'bass_4'
              ? 'bass'
              : 'guitar';

          return {
            id: stringEx.id,
            slug: stringEx.slug,
            title: stringEx.title,
            instrument: stringEx.instrument,
            instrumentType: instType,
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
            notesData: stringEx.instrument === 'piano' ? stringEx.tabData : undefined,
            createdAt: stringEx.createdAt,
          };
        }
      } catch (e) {
        console.warn('StringExercise findFirst error:', e);
      }
      return null;
    };

    // Si la petición indica explícitamente Batería, buscar en DrumExercise primero
    if (instrumentHint === 'drums') {
      const drumResult = await findDrum();
      if (drumResult) {
        return NextResponse.json({ success: true, exercise: drumResult });
      }
      const stringResult = await findString();
      if (stringResult) {
        return NextResponse.json({ success: true, exercise: stringResult });
      }
    } else {
      // De lo contrario, buscar primero en Cuerdas y luego en Batería
      const stringResult = await findString();
      if (stringResult) {
        return NextResponse.json({ success: true, exercise: stringResult });
      }
      const drumResult = await findDrum();
      if (drumResult) {
        return NextResponse.json({ success: true, exercise: drumResult });
      }
    }

    // Fallbacks en memoria si la BD no arrojó resultados
    const foundString = STRINGS_INITIAL_EXERCISES.find((e) => e.slug === slug || e.id === slug);
    if (foundString && instrumentHint !== 'drums') {
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

    const foundDrum = INITIAL_EXERCISES.find((e) => e.slug === slug || e.id === slug);
    if (foundDrum) {
      return NextResponse.json({
        success: true,
        exercise: {
          ...foundDrum,
          bpm: foundDrum.bpmDefault,
          instrument: 'drums',
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
