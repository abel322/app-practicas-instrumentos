'use client';

import React, { useState } from 'react';
import { MasteryInstrument, MasterySkillNode } from '@/types/mastery';
import { MASTERY_SKILL_NODES } from '@/lib/mastery/masteryData';
import { useMasteryProgress } from '@/lib/mastery/useMasteryProgress';
import { MasteryHeader } from '@/components/mastery/MasteryHeader';
import { DailyWarmupBar } from '@/components/mastery/DailyWarmupBar';
import { SkillTreePath } from '@/components/mastery/SkillTreePath';
import { PracticeExecutionModal } from '@/components/mastery/PracticeExecutionModal';
import { MasteryCelebrationModal } from '@/components/mastery/MasteryCelebrationModal';
import { WarmupSessionModal } from '@/components/mastery/WarmupSessionModal';

export default function MasteryPage() {
  const [selectedInstrument, setSelectedInstrument] = useState<MasteryInstrument>('guitar');
  const [activePracticeSkill, setActivePracticeSkill] = useState<MasterySkillNode | null>(null);
  const [celebrationSkill, setCelebrationSkill] = useState<MasterySkillNode | null>(null);
  const [warmupSkill, setWarmupSkill] = useState<MasterySkillNode | null>(null);

  const {
    progress,
    isLoaded,
    isLevelCompleted,
    graduateLevel,
    resetInstrumentProgress,
  } = useMasteryProgress();

  const currentSkills = MASTERY_SKILL_NODES[selectedInstrument] || [];
  const instrumentData = progress[selectedInstrument];

  const completedLevels = instrumentData?.completedLevels || [];
  const activeLevel = instrumentData?.activeLevel || 1;
  const totalMinutes = instrumentData?.totalPracticeMinutes || 0;

  // Filtrar habilidades completadas para la barra de mantenimiento diario
  const completedSkills = currentSkills.filter((s) => completedLevels.includes(s.level));

  // Manejador para iniciar práctica de un nivel
  const handleOpenPractice = (skill: MasterySkillNode) => {
    setActivePracticeSkill(skill);
  };

  // Manejador para graduar y validar un nivel
  const handleGraduate = (skill: MasterySkillNode) => {
    graduateLevel(skill.instrument, skill.level);
    setActivePracticeSkill(null);
    setCelebrationSkill(skill);
  };

  // Avanzar directamente al siguiente nivel desde el modal de celebración
  const handleContinueNextLevel = () => {
    if (!celebrationSkill) return;
    const nextLevelNum = celebrationSkill.level + 1;
    const nextSkill = currentSkills.find((s) => s.level === nextLevelNum);
    if (nextSkill) {
      setActivePracticeSkill(nextSkill);
    }
  };

  return (
    <main className="w-full min-h-[calc(100vh-4rem)] bg-[#0B131F] text-slate-100 flex flex-col justify-between">
      {/* Contenedor Central */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8">
        {/* Cabecera & Selector de Instrumentos */}
        <MasteryHeader
          currentInstrument={selectedInstrument}
          onSelectInstrument={(inst) => setSelectedInstrument(inst)}
          completedCount={completedLevels.length}
          totalLevels={currentSkills.length}
          totalMinutes={totalMinutes}
          onResetProgress={() => resetInstrumentProgress(selectedInstrument)}
        />

        {/* Modo de Mantenimiento Diario (2 min) */}
        <section>
          <DailyWarmupBar
            completedSkills={completedSkills}
            onLaunchWarmup={(skill) => setWarmupSkill(skill)}
          />
        </section>

        {/* Árbol de Habilidades Secuencial (Nivel 1 al 5) */}
        <section>
          <SkillTreePath
            skills={currentSkills}
            activeLevel={activeLevel}
            completedLevels={completedLevels}
            onOpenPractice={handleOpenPractice}
          />
        </section>
      </div>

      {/* Modal de Entorno de Práctica (15 min + Metrónomo + Criterio) */}
      {activePracticeSkill && (
        <PracticeExecutionModal
          skill={activePracticeSkill}
          isOpen={!!activePracticeSkill}
          onClose={() => setActivePracticeSkill(null)}
          onGraduate={handleGraduate}
          isAlreadyCompleted={isLevelCompleted(
            activePracticeSkill.instrument,
            activePracticeSkill.level
          )}
        />
      )}

      {/* Modal de Celebración de Nivel Conquistado */}
      {celebrationSkill && (
        <MasteryCelebrationModal
          skill={celebrationSkill}
          isOpen={!!celebrationSkill}
          onClose={() => setCelebrationSkill(null)}
          onContinueNextLevel={handleContinueNextLevel}
          hasNextLevel={celebrationSkill.level < 5}
        />
      )}

      {/* Modal de Calentamiento Express (2 min) */}
      {warmupSkill && (
        <WarmupSessionModal
          skill={warmupSkill}
          isOpen={!!warmupSkill}
          onClose={() => setWarmupSkill(null)}
        />
      )}

      {/* Footer Minimalista */}
      <footer className="mt-12 py-6 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto px-4 w-full gap-2 select-none">
        <p>SoundLab Studio &bull; Ruta Técnica por Niveles (Mastery Path)</p>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>Web Audio Clock Preciso</span>
          <span>&bull;</span>
          <span>15 Min Session Box</span>
          <span>&bull;</span>
          <span>Daily Maintenance 2 Min</span>
        </div>
      </footer>
    </main>
  );
}

