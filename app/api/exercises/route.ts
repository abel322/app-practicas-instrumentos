import { NextResponse } from 'next/server';
import { getExercises, getStringExercises, getPianoExercises } from '@/lib/prisma';
import { saveExerciseAction } from '@/app/actions/save-exercise';
import { normalizeInstrumentKey } from '@/lib/music-theory/instrumentUtils';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawInstrument = (url.searchParams.get('instrument') || '').toLowerCase().trim();

    let exercises: any[] = [];
    let instrument = 'drums';

    if (rawInstrument === 'all') {
      instrument = 'all';
      const [drums, strings, piano] = await Promise.all([
        getExercises(),
        getStringExercises(),
        getPianoExercises(),
      ]);
      exercises = [...drums, ...strings, ...piano];
    } else if (
      rawInstrument === 'guitar,bass' ||
      rawInstrument === 'bass,guitar' ||
      rawInstrument === 'strings' ||
      rawInstrument === 'cuerdas'
    ) {
      instrument = 'strings';
      exercises = await getStringExercises();
    } else if (
      rawInstrument === 'guitar' ||
      rawInstrument === 'guitar_6' ||
      rawInstrument.includes('guitar')
    ) {
      instrument = 'guitar';
      exercises = await getStringExercises('guitar_6');
    } else if (
      rawInstrument === 'bass' ||
      rawInstrument === 'bass_4' ||
      rawInstrument.includes('bajo') ||
      rawInstrument.includes('bass')
    ) {
      instrument = 'bass';
      exercises = await getStringExercises('bass_4');
    } else if (
      rawInstrument === 'piano' ||
      rawInstrument.includes('tecl') ||
      rawInstrument.includes('key')
    ) {
      instrument = 'piano';
      exercises = await getPianoExercises();
    } else {
      instrument = 'drums';
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
    const normalizedInst = normalizeInstrumentKey(rawInst);

    const rawData =
      body.data ||
      body.grid ||
      (normalizedInst === 'drums'
        ? body.hitsData
        : normalizedInst === 'piano'
        ? body.pianoNotes || body.notesData || body.tabData
        : body.stringNotes || body.tabData || body.notesData) ||
      [];

    const result = await saveExerciseAction({
      id: body.id || undefined,
      slug: body.slug || undefined,
      instrumentType: normalizedInst,
      title: body.title,
      category: body.category || (normalizedInst === 'drums' ? 'Rudimentos' : normalizedInst === 'piano' ? 'Clásico' : 'Slap & Pop'),
      difficulty: body.difficulty || 'Intermedio',
      bpm: Number(body.bpm || body.bpmDefault) || 100,
      timeSignature: body.timeSignature || '4/4',
      totalMeasures: Number(body.totalMeasures) || (Array.isArray(body.measures) ? body.measures.length : 1),
      stepsPerMeasure: Number(body.stepsPerMeasure) || 16,
      subdivision: body.subdivision || '1/16',
      data: Array.isArray(rawData) ? rawData : [],
      measures: Array.isArray(body.measures) ? body.measures : Array.isArray(body.sequence) ? body.sequence : undefined,
      patternBank: Array.isArray(body.patternBank) ? body.patternBank : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        id: result.id,
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
