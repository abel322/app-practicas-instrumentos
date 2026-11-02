import { PrismaClient } from '@prisma/client';
import { DrumExerciseData } from '@/types/drum';
import { StringExerciseData, StringInstrument } from '@/types/strings';
import { PianoExerciseData } from '@/types/piano';
import { INITIAL_EXERCISES } from './seedData';
import { STRINGS_INITIAL_EXERCISES } from './stringsSeedData';
import { PIANO_INITIAL_EXERCISES } from './pianoSeedData';
import { normalizeSubdivisionKey, getStepsForSubdivision } from '@/lib/music-theory/rhythmSubdivisions';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// ============================================================================
// DRUM LAB HELPERS
// ============================================================================

/**
 * Obtiene todos los ejercicios de batería disponibles desde la base de datos con Prisma.
 * Si la base de datos no está disponible o está vacía, devuelve los ejercicios de seed estructurados.
 */
export async function getExercises(): Promise<DrumExerciseData[]> {
  try {
    const dbExercises = await prisma.drumExercise.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (dbExercises && dbExercises.length > 0) {
      return dbExercises.map((ex) => ({
        id: ex.id,
        slug: ex.slug,
        title: ex.title,
        category: ex.category as any,
        difficulty: ex.difficulty as any,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature as any,
        totalSteps: ex.totalSteps,
        subdivision: normalizeSubdivisionKey((ex as any).subdivision || (ex.totalSteps === 8 ? '1/8' : '1/16')),
        stepsPerMeasure: (ex as any).stepsPerMeasure || getStepsForSubdivision((ex as any).subdivision || (ex.totalSteps === 8 ? '1/8' : '1/16'), ex.timeSignature),
        hitsData: (Array.isArray(ex.hitsData) ? ex.hitsData : []) as any,
        createdAt: ex.createdAt,
      }));
    }
  } catch (error) {
    console.warn('⚠️ [Prisma Drum] Usando colección predefinida (fallback seguro a seedData):', (error as any)?.message || error);
  }

  return INITIAL_EXERCISES;
}

/**
 * Obtiene un ejercicio de batería por su slug.
 */
export async function getExerciseBySlug(slug: string): Promise<DrumExerciseData | null> {
  try {
    const dbEx = await prisma.drumExercise.findUnique({
      where: { slug },
    });

    if (dbEx) {
      return {
        id: dbEx.id,
        slug: dbEx.slug,
        title: dbEx.title,
        category: dbEx.category as any,
        difficulty: dbEx.difficulty as any,
        bpmDefault: dbEx.bpmDefault,
        timeSignature: dbEx.timeSignature as any,
        totalSteps: dbEx.totalSteps,
        subdivision: normalizeSubdivisionKey((dbEx as any).subdivision || (dbEx.totalSteps === 8 ? '1/8' : '1/16')),
        stepsPerMeasure: (dbEx as any).stepsPerMeasure || getStepsForSubdivision((dbEx as any).subdivision || (dbEx.totalSteps === 8 ? '1/8' : '1/16'), dbEx.timeSignature),
        hitsData: (Array.isArray(dbEx.hitsData) ? dbEx.hitsData : []) as any,
        createdAt: dbEx.createdAt,
      };
    }
  } catch (error) {
    console.warn(`⚠️ [Prisma Drum] Fallback local para slug "${slug}":`, (error as any)?.message || error);
  }

  const found = INITIAL_EXERCISES.find((e) => e.slug === slug);
  return found || null;
}

// ============================================================================
// STRINGS LAB HELPERS (BAJO & GUITARRA)
// ============================================================================

/**
 * Obtiene ejercicios de cuerdas (bajo o guitarra) con Prisma, o fallback a STRINGS_INITIAL_EXERCISES.
 */
export async function getStringExercises(instrument?: StringInstrument): Promise<StringExerciseData[]> {
  try {
    const where = instrument ? { instrument } : { instrument: { in: ['bass_4', 'guitar_6'] } };
    const dbExercises = await prisma.stringExercise.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    if (dbExercises && dbExercises.length > 0) {
      return dbExercises.map((ex) => ({
        id: ex.id,
        slug: ex.slug,
        title: ex.title,
        instrument: ex.instrument as any,
        tuning: ex.tuning,
        category: ex.category,
        difficulty: ex.difficulty as any,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature as any,
        totalSteps: ex.totalSteps,
        subdivision: (ex as any).subdivision || (ex.totalSteps === 8 ? '1/8' : ex.totalSteps === 4 ? '1/4' : ex.totalSteps === 12 && ex.timeSignature === '4/4' ? '1/8T' : '1/16'),
        stepsPerMeasure: (ex as any).stepsPerMeasure || (ex.totalSteps <= 16 ? ex.totalSteps : (ex.timeSignature === '6/8' ? 12 : 16)),
        tabData: (Array.isArray(ex.tabData) ? ex.tabData : []) as any,
        createdAt: ex.createdAt,
      }));
    }
  } catch (error) {
    console.warn('⚠️ [Prisma Strings] Usando colección predefinida (fallback a stringsSeedData):', (error as any)?.message || error);
  }

  if (instrument) {
    return STRINGS_INITIAL_EXERCISES.filter((e) => e.instrument === instrument);
  }
  return STRINGS_INITIAL_EXERCISES;
}

/**
 * Obtiene un ejercicio de cuerda por su slug.
 */
export async function getStringExerciseBySlug(slug: string): Promise<StringExerciseData | null> {
  try {
    const dbEx = await prisma.stringExercise.findUnique({
      where: { slug },
    });

    if (dbEx && dbEx.instrument !== 'piano') {
      return {
        id: dbEx.id,
        slug: dbEx.slug,
        title: dbEx.title,
        instrument: dbEx.instrument as any,
        tuning: dbEx.tuning,
        category: dbEx.category,
        difficulty: dbEx.difficulty as any,
        bpmDefault: dbEx.bpmDefault,
        timeSignature: dbEx.timeSignature as any,
        totalSteps: dbEx.totalSteps,
        subdivision: (dbEx as any).subdivision || (dbEx.totalSteps === 8 ? '1/8' : dbEx.totalSteps === 4 ? '1/4' : dbEx.totalSteps === 12 && dbEx.timeSignature === '4/4' ? '1/8T' : '1/16'),
        stepsPerMeasure: (dbEx as any).stepsPerMeasure || (dbEx.totalSteps <= 16 ? dbEx.totalSteps : (dbEx.timeSignature === '6/8' ? 12 : 16)),
        tabData: (Array.isArray(dbEx.tabData) ? dbEx.tabData : []) as any,
        createdAt: dbEx.createdAt,
      };
    }
  } catch (error) {
    console.warn(`⚠️ [Prisma Strings] Fallback local para slug "${slug}":`, (error as any)?.message || error);
  }

  const found = STRINGS_INITIAL_EXERCISES.find((e) => e.slug === slug);
  return found || null;
}

// ============================================================================
// PIANO LAB HELPERS (TECLAS & KEYS RUNWAY)
// ============================================================================

/**
 * Obtiene todos los ejercicios de piano disponibles desde PostgreSQL o fallback a PIANO_INITIAL_EXERCISES.
 */
export async function getPianoExercises(): Promise<PianoExerciseData[]> {
  try {
    const dbExercises = await prisma.stringExercise.findMany({
      where: { instrument: 'piano' },
      orderBy: { createdAt: 'asc' },
    });

    if (dbExercises && dbExercises.length > 0) {
      return dbExercises.map((ex) => ({
        id: ex.id,
        slug: ex.slug,
        title: ex.title,
        instrument: 'piano',
        category: ex.category,
        difficulty: ex.difficulty as any,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature as any,
        totalSteps: ex.totalSteps,
        subdivision: normalizeSubdivisionKey((ex as any).subdivision || (ex.totalSteps === 8 ? '1/8' : '1/16')),
        stepsPerMeasure: (ex as any).stepsPerMeasure || getStepsForSubdivision((ex as any).subdivision || (ex.totalSteps === 8 ? '1/8' : '1/16'), ex.timeSignature),
        notesData: (Array.isArray(ex.tabData) ? ex.tabData : []) as any,
        description: `Ejercicio de piano: ${ex.title}`,
        createdAt: ex.createdAt,
      }));
    }
  } catch (error) {
    console.warn('⚠️ [Prisma Piano] Usando colección predefinida (fallback a pianoSeedData):', (error as any)?.message || error);
  }

  return PIANO_INITIAL_EXERCISES;
}

/**
 * Obtiene un ejercicio de piano por su slug.
 */
export async function getPianoExerciseBySlug(slug: string): Promise<PianoExerciseData | null> {
  try {
    const dbEx = await prisma.stringExercise.findUnique({
      where: { slug },
    });

    if (dbEx && dbEx.instrument === 'piano') {
      return {
        id: dbEx.id,
        slug: dbEx.slug,
        title: dbEx.title,
        instrument: 'piano',
        category: dbEx.category,
        difficulty: dbEx.difficulty as any,
        bpmDefault: dbEx.bpmDefault,
        timeSignature: dbEx.timeSignature as any,
        totalSteps: dbEx.totalSteps,
        subdivision: normalizeSubdivisionKey((dbEx as any).subdivision || (dbEx.totalSteps === 8 ? '1/8' : '1/16')),
        stepsPerMeasure: (dbEx as any).stepsPerMeasure || getStepsForSubdivision((dbEx as any).subdivision || (dbEx.totalSteps === 8 ? '1/8' : '1/16'), dbEx.timeSignature),
        notesData: (Array.isArray(dbEx.tabData) ? dbEx.tabData : []) as any,
        description: `Ejercicio de piano: ${dbEx.title}`,
        createdAt: dbEx.createdAt,
      };
    }
  } catch (error) {
    console.warn(`⚠️ [Prisma Piano] Fallback local para slug "${slug}":`, (error as any)?.message || error);
  }

  const found = PIANO_INITIAL_EXERCISES.find((e) => e.slug === slug);
  return found || null;
}
