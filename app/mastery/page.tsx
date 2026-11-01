'use client';

import React, { useState } from 'react';
import { MasteryInstrument, MasterySkillNode, CustomLevelInput } from '@/types/mastery';
import { useMasteryProgress } from '@/lib/mastery/useMasteryProgress';
import { MasteryHeader } from '@/components/mastery/MasteryHeader';
import { DailyWarmupBar } from '@/components/mastery/DailyWarmupBar';
import { SkillTreePath } from '@/components/mastery/SkillTreePath';
import { PracticeExecutionModal } from '@/components/mastery/PracticeExecutionModal';
import { MasteryCelebrationModal } from '@/components/mastery/MasteryCelebrationModal';
import { WarmupSessionModal } from '@/components/mastery/WarmupSessionModal';
import { AddLevelModal } from '@/components/mastery/AddLevelModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { toast } from '@/components/ui/ToastNotification';

export default function MasteryPage() {
  const [selectedInstrument, setSelectedInstrument] = useState<MasteryInstrument>('guitar');
  const [activePracticeSkill, setActivePracticeSkill] = useState<MasterySkillNode | null>(null);
  const [celebrationSkill, setCelebrationSkill] = useState<MasterySkillNode | null>(null);
  const [warmupSkill, setWarmupSkill] = useState<MasterySkillNode | null>(null);

  // Estados de creación y edición dinámica de niveles
  const [isAddLevelOpen, setIsAddLevelOpen] = useState<boolean>(false);
  const [editingCustomSkill, setEditingCustomSkill] = useState<MasterySkillNode | null>(null);

  // Estado de eliminación de nivel
  const [levelToDelete, setLevelToDelete] = useState<MasterySkillNode | null>(null);
  const [isDeletingLevel, setIsDeletingLevel] = useState<boolean>(false);

  const {
    progress,
    isLoaded,
    getSkills,
    isLevelCompleted,
    graduateLevel,
    resetInstrumentProgress,
    addCustomLevel,
    editCustomLevel,
    deleteLevelAndReindex,
  } = useMasteryProgress();

  const currentSkills = getSkills(selectedInstrument);
  const instrumentData = progress[selectedInstrument];

  const completedLevels = instrumentData?.completedLevels || [];
  const activeLevel = instrumentData?.activeLevel || 1;
  const totalMinutes = instrumentData?.totalPracticeMinutes || 0;

  // Filtrar habilidades completadas para la barra de mantenimiento diario
  const completedSkills = currentSkills.filter((s) => completedLevels.includes(s.level));

  // Práctica
  const handleOpenPractice = (skill: MasterySkillNode) => {
    setActivePracticeSkill(skill);
  };

  // Graduar nivel
  const handleGraduate = (skill: MasterySkillNode) => {
    graduateLevel(skill.instrument, skill.level);
    setActivePracticeSkill(null);
    setCelebrationSkill(skill);
  };

  // Avanzar directamente al siguiente nivel desde la celebración
  const handleContinueNextLevel = () => {
    if (!celebrationSkill) return;
    const nextLevelNum = celebrationSkill.level + 1;
    const nextSkill = currentSkills.find((s) => s.level === nextLevelNum);
    if (nextSkill) {
      setActivePracticeSkill(nextSkill);
    }
  };

  // Creación dinámica
  const handleOpenAddModal = () => {
    setEditingCustomSkill(null);
    setIsAddLevelOpen(true);
  };

  const handleEditSkill = (skill: MasterySkillNode) => {
    setEditingCustomSkill(skill);
    setIsAddLevelOpen(true);
  };

  const handleSaveQuickLevel = (input: CustomLevelInput) => {
    addCustomLevel(selectedInstrument, input);
    toast.success(`Nivel agregado exitosamente a la ruta técnica.`);
  };

  const handleUpdateLevel = (skillId: string, input: Partial<CustomLevelInput>) => {
    editCustomLevel(selectedInstrument, skillId, input);
    toast.success(`Nivel actualizado con éxito.`);
  };

  const handleRequestDeleteSkill = (skill: MasterySkillNode) => {
    setLevelToDelete(skill);
  };

  const handleConfirmDeleteLevel = () => {
    if (!levelToDelete) return;
    setIsDeletingLevel(true);

    try {
      const deletedNumber = levelToDelete.level;
      deleteLevelAndReindex(selectedInstrument, levelToDelete.id);
      toast.success(
        `Nivel ${deletedNumber} eliminado con éxito. Los niveles posteriores han sido reindexados automáticamente.`
      );
      setLevelToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar el nivel.');
    } finally {
      setIsDeletingLevel(false);
    }
  };

  const nextAvailableLevel =
    currentSkills.length > 0 ? Math.max(...currentSkills.map((s) => s.level)) + 1 : 1;

  return (
    <main className="w-full min-h-[calc(100vh-4rem)] bg-slate-100 text-slate-900 dark:bg-[#080d16] dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Contenedor Central */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8">
        {/* Cabecera & Selector de Instrumentos */}
        <MasteryHeader
          currentInstrument={selectedInstrument}
          onSelectInstrument={(inst) => setSelectedInstrument(inst)}
          completedCount={completedLevels.length}
          totalLevels={currentSkills.length}
          totalMinutes={totalMinutes}
          onResetProgress={() => {
            resetInstrumentProgress(selectedInstrument);
            toast.info(`Progreso de ${selectedInstrument} reiniciado.`);
          }}
        />

        {/* Modo de Mantenimiento Diario (2 min) */}
        <section>
          <DailyWarmupBar
            completedSkills={completedSkills}
            onLaunchWarmup={(skill) => setWarmupSkill(skill)}
          />
        </section>

        {/* Árbol de Habilidades Dinámico */}
        <section>
          <SkillTreePath
            skills={currentSkills}
            activeLevel={activeLevel}
            completedLevels={completedLevels}
            onOpenPractice={handleOpenPractice}
            onAddNewLevel={handleOpenAddModal}
            onEditSkill={handleEditSkill}
            onDeleteSkill={handleRequestDeleteSkill}
          />
        </section>
      </div>

      {/* Modal de Entorno de Práctica (15 min + Visor Interactivo + Metrónomo + Validación) */}
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
          hasNextLevel={celebrationSkill.level < currentSkills.length}
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

      {/* Modal de Añadir / Editar Nivel Dinámico */}
      <AddLevelModal
        isOpen={isAddLevelOpen}
        onClose={() => {
          setIsAddLevelOpen(false);
          setEditingCustomSkill(null);
        }}
        instrument={selectedInstrument}
        nextLevelNumber={nextAvailableLevel}
        onSaveQuickLevel={handleSaveQuickLevel}
        editingSkill={editingCustomSkill}
        onUpdateLevel={handleUpdateLevel}
      />

      {/* Modal de Confirmación de Eliminación de Nivel */}
      <ConfirmDeleteModal
        isOpen={!!levelToDelete}
        onClose={() => setLevelToDelete(null)}
        onConfirm={handleConfirmDeleteLevel}
        title={levelToDelete ? `¿Eliminar el Nivel ${levelToDelete.level} de la ruta técnica?` : '¿Eliminar nivel?'}
        itemName={levelToDelete ? `${levelToDelete.title} (${levelToDelete.difficultyLabel} - ${levelToDelete.targetBpm} BPM)` : undefined}
        description="Al eliminar este nivel, los niveles posteriores se reordenarán secuencialmente (el nivel posterior ocupará este número) y tu progreso se recalculará de forma consistente."
        confirmText="Eliminar Nivel"
        isDeleting={isDeletingLevel}
      />

      {/* Footer Minimalista */}
      <footer className="mt-12 py-6 border-t border-slate-300 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto px-4 w-full gap-2 select-none transition-colors">
        <p>SoundLab Studio &bull; Ruta Técnica por Niveles (Dinámica &amp; Studio Builder)</p>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <span>Web Audio Clock Preciso</span>
          <span>&bull;</span>
          <span>Studio Builder Sync</span>
          <span>&bull;</span>
          <span>Daily Maintenance 2 Min</span>
        </div>
      </footer>
    </main>
  );
}
