import { PrismaClient } from '@prisma/client';
import { INITIAL_EXERCISES } from '../lib/seedData';
import { STRINGS_INITIAL_EXERCISES } from '../lib/stringsSeedData';

const prisma = new PrismaClient();

async function main() {
  console.log('🥁 Sincronizando ejercicios de batería (Drum Lab)...');

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

    console.log(`✅ [Batería] ${upserted.title} (${upserted.slug})`);
  }

  console.log('🎸 Sincronizando ejercicios de cuerdas (Strings Lab: Bajo & Guitarra)...');

  for (const strEx of STRINGS_INITIAL_EXERCISES) {
    const upserted = await prisma.stringExercise.upsert({
      where: { slug: strEx.slug },
      update: {
        title: strEx.title,
        instrument: strEx.instrument,
        tuning: strEx.tuning,
        category: strEx.category,
        difficulty: strEx.difficulty,
        bpmDefault: strEx.bpmDefault,
        timeSignature: strEx.timeSignature,
        totalSteps: strEx.totalSteps,
        tabData: strEx.tabData as any,
      },
      create: {
        id: strEx.id,
        slug: strEx.slug,
        title: strEx.title,
        instrument: strEx.instrument,
        tuning: strEx.tuning,
        category: strEx.category,
        difficulty: strEx.difficulty,
        bpmDefault: strEx.bpmDefault,
        timeSignature: strEx.timeSignature,
        totalSteps: strEx.totalSteps,
        tabData: strEx.tabData as any,
      },
    });

    console.log(`✅ [${upserted.instrument}] ${upserted.title} (${upserted.slug})`);
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
