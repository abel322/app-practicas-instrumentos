import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { seedAlternatePicking20, ADVANCED_ALTERNATE_PICKING_20 } from '@/prisma/seeds/advancedAlternatePicking20';

export async function GET() {
  try {
    const slugs = await seedAlternatePicking20(prisma);
    return NextResponse.json({
      success: true,
      message: `✅ ${slugs.length} estudios de 32 compases (AP-01 a AP-20) guardados en la carpeta "Púa Alternada" en PostgreSQL.`,
      count: slugs.length,
      slugs,
    });
  } catch (error: any) {
    console.error('Error en GET /api/exercises/seed-alternate-picking:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error sembrando estudios de púa alternada' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
