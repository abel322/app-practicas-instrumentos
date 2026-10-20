import { PrismaClient } from '@prisma/client';
import { DrumExerciseData } from '@/types/drum';
import { StringExerciseData, StringInstrument } from '@/types/strings';
import { INITIAL_EXERCISES } from './seedData';
import { STRINGS_INITIAL_EXERCISES } from './stringsSeedData';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

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
    const where = instrument ? { instrument } : undefined;
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

    if (dbEx) {
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
