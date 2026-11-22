'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StringExerciseData, StringInstrument } from '@/types/strings';
import { StringExerciseCard } from './StringExerciseCard';
import { Search, Music, FolderPlus, Folder, FolderCheck, Plus, X, Check } from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { toast } from '@/components/ui/ToastNotification';
import { deleteExerciseAction } from '@/app/actions/save-exercise';
import {
  getDeletedExerciseSlugs,
  markExerciseAsDeleted,
  getLocalExercises,
} from '@/lib/exercises/customExercisesStorage';

interface StringsCatalogViewProps {
  initialExercises: StringExerciseData[];
}

const CATEGORIES = [
  'Todas',
  'Slap & Pop',
  'Walking Bass',
  'Escalas & Arpegios',
  'Licks & Riffs',
  'Fingerpicking',
];

export const StringsCatalogView: React.FC<StringsCatalogViewProps> = ({ initialExercises }) => {
  const router = useRouter();
  const [exercises, setExercises] = useState<StringExerciseData[]>(initialExercises);
  const [selectedInstrument, setSelectedInstrument] = useState<'all' | StringInstrument>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');

  // Carpetas personalizadas creadas por el usuario
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [selectedExerciseSlugsForFolder, setSelectedExerciseSlugsForFolder] = useState<string[]>([]);
  const [isSavingFolder, setIsSavingFolder] = useState<boolean>(false);

  // Cargar carpetas personalizadas de localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem('soundlab_strings_custom_folders');
      if (stored) {
        setCustomFolders(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Modal de confirmación de eliminación
  const [exerciseToDelete, setExerciseToDelete] = useState<StringExerciseData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sincronizar en el cliente con ejercicios locales modificados y omitir los eliminados
  useEffect(() => {
    fetch('/api/exercises?instrument=guitar,bass', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.exercises)) {
          const deletedSlugs = getDeletedExerciseSlugs();
          const validStrings = data.exercises.filter((ex: any) => {
            if (deletedSlugs.includes(ex.slug)) return false;
            const inst = (ex.instrument || ex.instrumentType || '').toLowerCase();
            if (inst === 'drums' || inst.includes('bater') || inst === 'piano') return false;
            return true;
          });
          setExercises(validStrings);
        }
      })
      .catch(() => {});

    try {
      const deletedSlugs = getDeletedExerciseSlugs();
      const localCustom = getLocalExercises().filter((ex) => {
        const inst = (ex.instrument || ex.instrumentType || '').toLowerCase();
        return (
          inst !== 'drums' &&
          !inst.includes('bater') &&
          inst !== 'piano' &&
          (ex.tabData || ex.stringNotes || ex.instrument)
        );
      });

      setExercises((prev) => {
        let list = prev.filter((ex) => !deletedSlugs.includes(ex.slug));

        localCustom.forEach((customEx) => {
          if (deletedSlugs.includes(customEx.slug)) return;

          const idx = list.findIndex((e) => e.slug === customEx.slug);
          const mappedEx: StringExerciseData = {
            id: customEx.id || customEx.slug,
            slug: customEx.slug,
            title: customEx.title,
            instrument:
              customEx.instrument === 'bass' || customEx.instrument === 'bass_4' || customEx.instrumentType === 'bass'
                ? 'bass_4'
                : 'guitar_6',
            tuning:
              customEx.tuning ||
              (customEx.instrumentType === 'bass' ? 'E A D G' : 'E A D G B E'),
            category: customEx.category,
            difficulty: customEx.difficulty,
            bpmDefault: customEx.bpmDefault || customEx.bpm || 90,
            timeSignature: customEx.timeSignature || '4/4',
            totalSteps: customEx.totalSteps || (customEx.tabData ? customEx.tabData.length : 32),
            tabData: Array.isArray(customEx.tabData)
              ? customEx.tabData
              : Array.isArray(customEx.data)
              ? customEx.data
              : [],
            folder: customEx.folder || (customEx as any).collection || undefined,
            description: customEx.description || '',
          };

          if (idx !== -1) {
            list[idx] = mappedEx;
          } else {
            list = [mappedEx, ...list];
          }
        });

        return list;
      });
    } catch (err) {
      console.warn('Error sincronizando ejercicios locales de cuerdas:', err);
    }
  }, []);

  const handleEdit = (ex: StringExerciseData) => {
    const instType =
      ex.instrument === 'bass_4'
        ? 'bass'
        : ex.instrument === ('piano' as any)
        ? 'piano'
        : 'guitar';
    try {
      sessionStorage.setItem(
        'soundlab_editing_exercise',
        JSON.stringify({ ...ex, instrumentType: instType, subdivision: ex.subdivision || (ex.totalSteps === 8 ? '1/8' : '1/16') })
      );
    } catch (_) {}
    router.push(`/admin/builder?id=${ex.id}&editSlug=${ex.slug}&instrument=${instType}`);
  };

  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);

    const instType =
      exerciseToDelete.instrument === 'bass_4'
        ? 'bass'
        : exerciseToDelete.instrument === ('piano' as any)
        ? 'piano'
        : 'guitar';

    try {
      // 1. Notificar a Prisma vía server action
      await deleteExerciseAction(exerciseToDelete.slug, instType);

      // 2. Persistir eliminación localmente
      markExerciseAsDeleted(exerciseToDelete.slug);

      // 3. Actualizar estado reactivo sin recargar
      setExercises((prev) => prev.filter((e) => e.slug !== exerciseToDelete.slug));

      toast.success(`Ejercicio "${exerciseToDelete.title}" eliminado con éxito.`);
      setExerciseToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar el ejercicio.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Conteo de ejercicios por carpeta
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, 'Púa Alternada': 0 };
    exercises.forEach((ex) => {
      counts.all++;
      const isAP =
        ex.folder === 'Púa Alternada' ||
        ex.title.startsWith('AP-') ||
        ex.slug.includes('ap-') ||
        ex.slug.includes('alternate-picking');

      if (isAP) {
        counts['Púa Alternada'] = (counts['Púa Alternada'] || 0) + 1;
      }
      if (ex.folder && ex.folder !== 'Púa Alternada') {
        counts[ex.folder] = (counts[ex.folder] || 0) + 1;
      }
    });
    return counts;
  }, [exercises]);

  // Lista de todas las carpetas disponibles (además de Todos y Púa Alternada)
  const allAvailableFolders = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.folder && ex.folder !== 'Púa Alternada') {
        set.add(ex.folder);
      }
    });
    customFolders.forEach((f) => {
      if (f !== 'Púa Alternada') set.add(f);
    });
    return Array.from(set);
  }, [exercises, customFolders]);

  // Manejar creación de carpeta personalizada
  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      toast.error('El nombre de la carpeta no puede estar vacío.');
      return;
    }
    setIsSavingFolder(true);
    try {
      const updatedFolders = Array.from(new Set([...customFolders, trimmed]));
      setCustomFolders(updatedFolders);
      try {
        localStorage.setItem('soundlab_strings_custom_folders', JSON.stringify(updatedFolders));
      } catch {}

      if (selectedExerciseSlugsForFolder.length > 0) {
        for (const slug of selectedExerciseSlugsForFolder) {
          const ex = exercises.find((e) => e.slug === slug);
          if (ex) {
            await fetch(`/api/exercises/${slug}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...ex,
                folder: trimmed,
              }),
            }).catch(() => {});
          }
        }

        setExercises((prev) =>
          prev.map((e) =>
            selectedExerciseSlugsForFolder.includes(e.slug) ? { ...e, folder: trimmed } : e
          )
        );
      }

      setSelectedFolder(trimmed);
      setNewFolderName('');
      setSelectedExerciseSlugsForFolder([]);
      setIsNewFolderModalOpen(false);
      toast.success(`Carpeta "${trimmed}" creada.`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar carpeta.');
    } finally {
      setIsSavingFolder(false);
    }
  };

  // Filtrado de ejercicios
  const filteredExercises = useMemo(() => {
    const list = exercises.filter((ex) => {
      const rawInst = (ex.instrument || (ex as any).instrumentType || '').toLowerCase();
      // Excluir estrictamente batería y piano
      if (rawInst === 'drums' || rawInst.includes('bater') || rawInst === 'piano') {
        return false;
      }

      const isGuitar = rawInst === 'guitar_6' || rawInst === 'guitar';
      const isBass = rawInst === 'bass_4' || rawInst === 'bass';

      let matchesInstrument = true;
      if (selectedInstrument === 'guitar_6') {
        matchesInstrument = isGuitar;
      } else if (selectedInstrument === 'bass_4') {
        matchesInstrument = isBass;
      }

      // Filtro de carpeta
      let matchesFolder = true;
      if (selectedFolder === 'Púa Alternada') {
        matchesFolder =
          ex.folder === 'Púa Alternada' ||
          ex.title.startsWith('AP-') ||
          ex.slug.includes('ap-') ||
          ex.slug.includes('alternate-picking');
      } else if (selectedFolder !== 'all') {
        matchesFolder = ex.folder === selectedFolder;
      }

      const matchesCategory =
        selectedCategory === 'Todas' || ex.category === selectedCategory;

      const matchesDifficulty =
        selectedDifficulty === 'Todas' || ex.difficulty === selectedDifficulty;

      const matchesSearch =
        searchQuery.trim() === '' ||
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.folder && ex.folder.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesInstrument && matchesFolder && matchesCategory && matchesDifficulty && matchesSearch;
    });

    // Ordenar si la carpeta es Púa Alternada del #01 al #20
    if (selectedFolder === 'Púa Alternada') {
      return [...list].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true })
      );
    }

    if (selectedFolder === 'all') {
      const apExercises = list.filter(
        (e) => e.folder === 'Púa Alternada' || e.title.startsWith('AP-') || e.slug.startsWith('ap-')
      );
      apExercises.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      const otherExercises = list.filter(
        (e) => !(e.folder === 'Púa Alternada' || e.title.startsWith('AP-') || e.slug.startsWith('ap-'))
      );
      return [...apExercises, ...otherExercises];
    }

    return list;
  }, [exercises, selectedInstrument, selectedFolder, selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 1. Selector Superior de Instrumento: [Todos] / [Bajo] / [Guitarra] */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-[#dce2ec]/80 dark:bg-slate-900/80 border border-slate-300/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-zinc-900/60 border border-slate-300/70 dark:border-white/5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedInstrument('all')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'all' ? 'text-white dark:text-zinc-950 font-bold' : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {selectedInstrument === 'all' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-[#0891b2] dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Todos los Instrumentos</span>
          </button>

          <button
            onClick={() => setSelectedInstrument('bass_4')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'bass_4' ? 'text-white dark:text-zinc-950 font-bold' : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {selectedInstrument === 'bass_4' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-[#0891b2] dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Bajo (4 Cuerdas)</span>
          </button>

          <button
            onClick={() => setSelectedInstrument('guitar_6')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedInstrument === 'guitar_6' ? 'text-white dark:text-zinc-950 font-bold' : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {selectedInstrument === 'guitar_6' && (
              <motion.div
                layoutId="activeInstrumentTab"
                className="absolute inset-0 rounded-lg bg-[#0891b2] dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Guitarra (6 Cuerdas)</span>
          </button>
        </div>
      </div>

      {/* 1.5. Barra Superior de Carpetas / Colecciones de Estudio */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#dce2ec]/80 dark:bg-slate-900/80 border border-slate-300/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Carpeta: Todos */}
          <button
            type="button"
            onClick={() => setSelectedFolder('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
              selectedFolder === 'all'
                ? 'bg-[#0891b2] text-white border-[#0891b2] shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50'
                : 'bg-slate-200/80 text-slate-700 border-slate-300/80 hover:bg-slate-300 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-white/5 dark:hover:bg-zinc-800'
            }`}
          >
            <span>📚 Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 dark:bg-white/10 font-mono">
              {folderCounts.all || exercises.length}
            </span>
          </button>

          {/* Carpeta Destacada: 📂 Púa Alternada (20) */}
          <button
            type="button"
            onClick={() => setSelectedFolder('Púa Alternada')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
              selectedFolder === 'Púa Alternada'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-500 shadow-md scale-105'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <span>📂 Púa Alternada</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
              {folderCounts['Púa Alternada'] || 20}
            </span>
          </button>

          {/* Otras Carpetas creadas */}
          {allAvailableFolders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFolder(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                selectedFolder === f
                  ? 'bg-[#0891b2] text-white border-[#0891b2] shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50'
                  : 'bg-slate-200/80 text-slate-700 border-slate-300/80 hover:bg-slate-300 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-white/5 dark:hover:bg-zinc-800'
              }`}
            >
              <span>📂 {f}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 dark:bg-white/10 font-mono">
                {folderCounts[f] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Botón Rápido: + Carpeta */}
        <button
          type="button"
          onClick={() => setIsNewFolderModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-sm flex items-center justify-center gap-1 shrink-0 active:scale-95 cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ Carpeta</span>
        </button>
      </div>

      {/* 2. Barra de Filtros, Categorías y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Píldoras de Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-[#0891b2] text-white border-[#0891b2] shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50'
                  : 'bg-slate-200/80 text-slate-700 border-slate-300/80 hover:bg-slate-300 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-white/5 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Buscador y filtro de dificultad */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por técnica o título..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-900/80 border border-slate-300/80 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-zinc-500 focus:outline-none focus:border-[#0891b2] dark:focus:border-cyan-400 focus:ring-1 focus:ring-[#0891b2] dark:focus:ring-cyan-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-900/80 border border-slate-300/80 dark:border-white/10 text-xs text-slate-800 dark:text-zinc-300 focus:outline-none focus:border-[#0891b2] dark:focus:border-cyan-400 transition-all cursor-pointer font-medium"
          >
            <option value="Todas">Todas las dificultades</option>
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>
      </div>

      {/* 3. Grid de Ejercicios */}
      <AnimatePresence mode="popLayout">
        {filteredExercises.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredExercises.map((exercise, index) => (
              <StringExerciseCard
                key={exercise.id || exercise.slug}
                exercise={exercise}
                index={index}
                onEdit={handleEdit}
                onRequestDelete={(ex) => setExerciseToDelete(ex)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 px-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3 shadow-sm"
          >
            <Music className="w-12 h-12 text-slate-400 dark:text-zinc-600 mb-2" />
            <h4 className="text-base font-bold text-slate-800 dark:text-zinc-300">
              No se encontraron ejercicios de cuerdas
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-500 max-w-sm">
              Prueba cambiando el instrumento o limpiando los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSelectedInstrument('all');
                setSelectedCategory('Todas');
                setSelectedDifficulty('Todas');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500/10 dark:border dark:border-cyan-500/30 dark:text-cyan-400 text-xs font-bold hover:bg-[#0e7490] dark:hover:bg-cyan-500/20 transition-colors"
            >
              Restablecer filtros
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Estás seguro de eliminar este ejercicio?"
        itemName={exerciseToDelete ? `${exerciseToDelete.title} (${exerciseToDelete.category})` : undefined}
        description="Esta acción eliminará el ejercicio de cuerdas de la biblioteca y de la base de datos permanentemente."
        isDeleting={isDeleting}
      />

      {/* Modal para Crear Nueva Carpeta y Asignar Ejercicios */}
      <AnimatePresence>
        {isNewFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white">Nueva Carpeta de Estudio</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nombre de la Carpeta:
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ej. Sweep Picking, Rutina Diaria, Licks..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Asignar ejercicios a esta carpeta (opcional):
                </label>
                <div className="max-h-48 overflow-y-auto no-scrollbar border border-slate-800 rounded-xl p-2 bg-slate-950 flex flex-col gap-1">
                  {exercises.map((ex) => {
                    const isChecked = selectedExerciseSlugsForFolder.includes(ex.slug);
                    return (
                      <button
                        key={ex.slug}
                        type="button"
                        onClick={() => {
                          setSelectedExerciseSlugsForFolder((prev) =>
                            isChecked ? prev.filter((s) => s !== ex.slug) : [...prev, ex.slug]
                          );
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold'
                            : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                        }`}
                      >
                        <span className="truncate pr-2">{ex.title}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingFolder || !newFolderName.trim()}
                  onClick={handleCreateFolder}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingFolder ? 'Guardando...' : 'Crear Carpeta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
