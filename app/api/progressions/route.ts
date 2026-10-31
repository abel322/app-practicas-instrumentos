import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = await (prisma as any).customProgression.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al obtener progresiones:', error);
    return NextResponse.json({ error: 'Error al consultar progresiones' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, chords } = body;

    if (!name || !chords || !Array.isArray(chords) || chords.length === 0) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await (prisma as any).customProgression.create({
      data: {
        name,
        category: category || 'Personalizada',
        chordsJson: chords,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error al guardar progresión:', error);
    return NextResponse.json({ error: 'Error al guardar progresión' }, { status: 500 });
  }
}
