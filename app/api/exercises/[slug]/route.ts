import { NextResponse } from 'next/server';
import prisma, { extractDrumPayload, extractStringPayload } from '@/lib/prisma';
import { normalizeSubdivisionKey, getStepsForSubdivision } from '@/lib/music-theory/rhythmSubdivisions';
import { normalizeInstrumentKey } from '@/lib/music-theory/instrumentUtils';
import { STRINGS_INITIAL_EXERCISES } from '@/lib/stringsSeedData';
import { INITIAL_EXERCISES } from '@/lib/seedData';
import { PIANO_INITIAL_EXERCISES } from '@/lib/pianoSeedData';
import { saveExerciseAction, deleteExerciseAction } from '@/app/actions/save-exercise';

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

          const payload = extractDrumPayload(drumEx.hitsData);

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
            stepsPerMeasure: (drumEx as any).stepsPerMeasure || getStepsForSubdivision(sub, drumEx.timeSignature),
            totalSteps: drumEx.totalSteps,
            hitsData: payload.hits,
            measures: payload.measures.length > 0 ? payload.measures : undefined,
            patternBank: payload.patternBank.length > 0 ? payload.patternBank : undefined,
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

          const payload = extractStringPayload(stringEx.tabData);

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
            tabData: payload.tabNotes,
            notesData: stringEx.instrument === 'piano' ? payload.tabNotes : undefined,
            measures: payload.measures.length > 0 ? payload.measures : undefined,
            patternBank: payload.patternBank.length > 0 ? payload.patternBank : undefined,
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

    const foundPiano = PIANO_INITIAL_EXERCISES.find((e) => e.slug === slug || e.id === slug);
    if (foundPiano && (instrumentHint === 'piano' || !instrumentHint)) {
      return NextResponse.json({
        success: true,
        exercise: {
          ...foundPiano,
          bpm: foundPiano.bpmDefault,
          instrumentType: 'piano',
          subdivision: normalizeSubdivisionKey(foundPiano.subdivision || (foundPiano.totalSteps === 8 ? '1/8' : '1/16')),
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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug requerido' }, { status: 400 });
    }

    const body = await request.json();
    const rawInst = body.instrumentType || body.instrument || 'drums';
    const normalizedInst =
      rawInst === 'piano'
        ? 'piano'
        : rawInst === 'bass' || rawInst === 'bass_4'
        ? 'bass'
        : rawInst === 'guitar' || rawInst === 'guitar_6'
        ? 'guitar'
        : 'drums';

    const rawData =
      body.data ||
      (normalizedInst === 'drums' ? body.hitsData : body.tabData || body.notesData) ||
      [];

    const result = await saveExerciseAction({
      slug,
      instrumentType: normalizedInst,
      title: body.title,
      category: body.category || 'Rudimentos',
      difficulty: body.difficulty || 'Intermedio',
      bpm: Number(body.bpm || body.bpmDefault) || 100,
      timeSignature: body.timeSignature || '4/4',
      totalMeasures: Number(body.totalMeasures) || (Array.isArray(body.measures) ? body.measures.length : 1),
      stepsPerMeasure: Number(body.stepsPerMeasure) || 16,
      subdivision: body.subdivision || '1/16',
      data: Array.isArray(rawData) ? rawData : [],
      measures: Array.isArray(body.measures) ? body.measures : undefined,
      patternBank: Array.isArray(body.patternBank) ? body.patternBank : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      slug: result.slug,
      url: result.url,
      isUpdate: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug requerido' }, { status: 400 });
    }

    const url = new URL(request.url);
    const rawInstrument = url.searchParams.get('instrument') || 'drums';
    const instrumentType =
      rawInstrument === 'piano'
        ? 'piano'
        : rawInstrument === 'bass' || rawInstrument === 'bass_4'
        ? 'bass'
        : rawInstrument === 'guitar' || rawInstrument === 'guitar_6'
        ? 'guitar'
        : 'drums';

    const res = await deleteExerciseAction(slug, instrumentType as any);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Ejercicio ${slug} eliminado con éxito` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al eliminar ejercicio' }, { status: 500 });
  }
}
