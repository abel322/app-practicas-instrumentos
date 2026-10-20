import { PrismaClient } from '@prisma/client';
import { INITIAL_EXERCISES } from '../lib/seedData';

const prisma = new PrismaClient();

async function main() {
  console.log('🥁 Iniciando Seed de ejercicios de batería...');

  for (const ex of INITIAL_EXERCISES) {
    const upserted = await prisma.drumExercise.upsert({
      where: { slug: ex.slug },
      update: {
        title: ex.title,
        category: ex.category,
        difficulty: ex.difficulty,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature,
        totalSteps: ex.totalSteps,
        hitsData: ex.hitsData as any,
      },
      create: {
        id: ex.id,
        slug: ex.slug,
        title: ex.title,
        category: ex.category,
        difficulty: ex.difficulty,
        bpmDefault: ex.bpmDefault,
        timeSignature: ex.timeSignature,
        totalSteps: ex.totalSteps,
        hitsData: ex.hitsData as any,
      },
    });

    console.log(`✅ Ejercicio sincronizado: [${upserted.category}] ${upserted.title} (${upserted.slug})`);
  }

  console.log('✨ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
