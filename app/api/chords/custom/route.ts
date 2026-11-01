import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeInstrument(inst?: string | null): string {
  if (!inst) return 'guitar_6c';
  if (inst === 'guitar_6') return 'guitar_6c';
  if (inst === 'bass_4') return 'bass_4c';
  if (inst === 'bass_5') return 'bass_5c';
  return inst;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instrument = normalizeInstrument(searchParams.get('instrument'));
    const root = searchParams.get('root');
    const chordType = searchParams.get('chordType');
    const shape = searchParams.get('shape');

    if (root && chordType && shape) {
      const customVoicing = await prisma.customChordVoicing.findUnique({
        where: {
          chord_unique_identifier: { instrument, root, chordType, shape },
        },
      });
      return NextResponse.json({ voicing: customVoicing });
    }

    const allCustoms = await prisma.customChordVoicing.findMany({
      where: { instrument },
    });
    return NextResponse.json({ voicings: allCustoms });
  } catch (error) {
    console.error('Error al obtener voicings personalizados:', error);
    return NextResponse.json({ error: 'Error al consultar voicings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instrument: rawInstrument, root, chordType, shape, frets } = body;
    const instrument = normalizeInstrument(rawInstrument);

    if (!root || !chordType || !shape || !frets) {
      return NextResponse.json({ error: 'Faltan parámetros del acorde' }, { status: 400 });
    }

    const savedVoicing = await prisma.customChordVoicing.upsert({
      where: {
        chord_unique_identifier: {
          instrument,
          root,
          chordType,
          shape,
        },
      },
      update: {
        fretsJson: frets,
      },
      create: {
        instrument,
        root,
        chordType,
        shape,
        fretsJson: frets,
      },
    });

    return NextResponse.json({ success: true, savedVoicing });
  } catch (error) {
    console.error('Error al guardar voicing en BD:', error);
    return NextResponse.json({ error: 'Error al persistir en base de datos' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let instrument = normalizeInstrument(searchParams.get('instrument'));
    let root = searchParams.get('root');
    let chordType = searchParams.get('chordType');
    let shape = searchParams.get('shape');

    if (!root || !chordType || !shape) {
      try {
        const body = await req.json();
        if (body.instrument) instrument = normalizeInstrument(body.instrument);
        if (body.root) root = body.root;
        if (body.chordType) chordType = body.chordType;
        if (body.shape) shape = body.shape;
      } catch {
        // ignore if not json body
      }
    }

    if (root && chordType && shape) {
      await prisma.customChordVoicing.deleteMany({
        where: {
          instrument,
          root,
          chordType,
          shape,
        },
      });
      return NextResponse.json({ success: true, message: 'Voicing restablecido en base de datos' });
    }

    return NextResponse.json({ error: 'Faltan parámetros para restablecer el voicing' }, { status: 400 });
  } catch (error) {
    console.error('Error al restablecer voicing personalizado:', error);
    return NextResponse.json({ error: 'Error al restablecer voicing' }, { status: 500 });
  }
}

