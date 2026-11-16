import { NextResponse } from 'next/server';
import { getExercises, getStringExercises, getPianoExercises } from '@/lib/prisma';
import { saveExerciseAction } from '@/app/actions/save-exercise';
import { normalizeInstrumentKey } from '@/lib/music-theory/instrumentUtils';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawInstrument = url.searchParams.get('instrument') || 'drums';
    const instrument = normalizeInstrumentKey(rawInstrument);

    let exercises: any[] = [];

    if (instrument === 'drums') {
      exercises = await getExercises();
    } else if (instrument === 'bass' || instrument === 'guitar') {
      const stringInst = instrument === 'bass' ? 'bass_4' : 'guitar_6';
      exercises = await getStringExercises(stringInst);
    } else if (instrument === 'piano') {
      exercises = await getPianoExercises();
    } else if (rawInstrument === 'all') {
      const drums = await getExercises();
      const strings = await getStringExercises();
      const piano = await getPianoExercises();
      exercises = [...drums, ...strings, ...piano];
    } else {
      exercises = await getExercises();
    }

    return NextResponse.json(
      {
        success: true,
        instrument,
        count: exercises.length,
        exercises,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error en GET /api/exercises:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al obtener ejercicios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Título del ejercicio es requerido' },
        { status: 400 }
      );
    }

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
      slug: body.slug || undefined,
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

    return NextResponse.json(
      {
        success: true,
        slug: result.slug,
        url: result.url,
        isUpdate: result.isUpdate,
      },
      { status: result.isUpdate ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('❌ Error en POST /api/exercises:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al guardar ejercicio' },
      { status: 500 }
    );
  }
}
