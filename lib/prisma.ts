import { PrismaClient } from '@prisma/client';
import { DrumExerciseData } from '@/types/drum';
import { INITIAL_EXERCISES } from './seedData';

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

/**
 * Obtiene todos los ejercicios disponibles desde la base de datos con Prisma.
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
    // Si la base de datos no está levantada en local, usamos de manera segura los datos iniciales
    console.warn('⚠️ [Prisma] Usando colección predefinida (fallback seguro a seedData):', (error as any)?.message || error);
  }

  return INITIAL_EXERCISES;
}

/**
 * Obtiene un ejercicio por su slug.
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
    console.warn(`⚠️ [Prisma] Fallback local para slug "${slug}":`, (error as any)?.message || error);
  }

  const found = INITIAL_EXERCISES.find((e) => e.slug === slug);
  return found || null;
}
