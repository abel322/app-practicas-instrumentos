'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  InstrumentType,
  INSTRUMENTS,
  CHROMATIC_NOTES,
  ChromaticNote,
  ChordKey,
  ScaleKey,
  SCALES_CATALOG,
  CHORDS_CATALOG,
  getChordVoicings,
  getScaleNoteList,
  getChordNoteList,
  getFretNote,
  ChordVoicing,
  NoteRole,
  PROGRESSIONS_CATALOG,
  ProgressionDef,
  resolveProgressionChords,
  convertCustomProgressionToDef,
} from '@/lib/music-theory/fretboard';
import { getFretboardAudioEngine } from '@/lib/music-theory/fretboardAudio';
import { InteractiveFretboard, ActiveFretNote } from '@/components/fretboard/InteractiveFretboard';
import { FretboardToolbar, StudyMode } from '@/components/fretboard/FretboardToolbar';
import { ChordTheoryAccordion } from '@/components/fretboard/ChordTheoryAccordion';
import {
  CagedChordVoicing,
  CAGED_BOX_DEFINITIONS,
  getCagedDiatonicChords,
  getCagedBoxFretRange,
  ChordExtensionFamily,
  TonalityMode,
  TONALITY_MODE_LABELS,
  getFormulasForTonalityAndFamily,
  getIntervalLabel,
  HARMONIC_FAMILIES_CONFIG,
} from '@/lib/music-theory/cagedHarmonics';
import {
  ChordTensionVariation,
  getVariationsForDegree,
  applyChordTensionVariation,
  isStandardVariation,
} from '@/lib/music-theory/chordVariationsCatalog';
import { CagedHarmonicChordsView } from '@/components/fretboard/CagedHarmonicChordsView';
import { PositionMapBrackets } from '@/components/fretboard/PositionMapBrackets';
import {
  ScaleSystemType,
  NoteDisplayMode,
  calculateScaleSystemNotes,
  calculateFullNeckScaleNotes,
  getScalePositionZones,
  CAGED_BOXES,
  CAGED_BASE_BOXES,
  THREE_NPS_PATTERNS,
  THREE_NPS_BASE_PATTERNS,
  assignFingersToString,
  ThreeToTwoLayoutMode,
} from '@/lib/music-theory/scaleSystems';
import {
  THREE_TO_TWO_PATTERNS,
  getThreeToTwoPattern,
} from '@/lib/music-theory/threeToTwoSystem';
import { ScaleSystemControls } from '@/components/fretboard/ScaleSystemControls';
import { ScalePatternExportBar } from '@/components/fretboard/ScalePatternExportBar';
import { getImprovisationGuide } from '@/lib/music-theory/progressionImprovisationCatalog';
import { ProgressionImprovPanel, ImprovDisplayMode } from '@/components/fretboard/ProgressionImprovPanel';
import { findImprovResourceById } from '@/lib/music-theory/chordImprovOptions';
import { CreateProgressionModal } from '@/components/fretboard/CreateProgressionModal';
import {
  getCustomScalePatternAction,
  saveScalePatternAction,
  resetScalePatternAction,
  ScaleNotePayload,
} from '@/app/actions/scalePatternActions';
import {
  ChordNotePayload,
} from '@/app/actions/chordVoicingActions';

export interface EditableNote {
  fret: number;
  finger: number;
  isRoot?: boolean;
  isStretch?: boolean;
}

export default function FretboardPage() {
  // Estado General
  const [studyMode, setStudyMode] = useState<StudyMode>('chords');
  const [instrument, setInstrument] = useState<InstrumentType>('guitar_6');
  const [rootNote, setRootNote] = useState<string>('C');
  const [displayMode, setDisplayMode] = useState<NoteDisplayMode>('notes');
  const [fretboardViewMode, setFretboardViewMode] = useState<'scroll' | 'fit'>('scroll');

  // Estado Modo 1: Laboratorio de Armonía Diatónica CAGED
  const [tonalityMode, setTonalityMode] = useState<TonalityMode>('ionian');
  const [activeCagedBoxId, setActiveCagedBoxId] = useState<number>(1);
  const [activeChordDegreeIndex, setActiveChordDegreeIndex] = useState<number>(0);
  const [activeExtensionFamily, setActiveExtensionFamily] = useState<ChordExtensionFamily>('triad');
  const [activeVariationId, setActiveVariationId] = useState<string>('dom_std');

  // Estado Modo Editor Visual y Persistencia de Acordes en PostgreSQL
  const [isChordEditorActive, setIsChordEditorActive] = useState<boolean>(false);
  const [customChordNotes, setCustomChordNotes] = useState<ChordNotePayload[] | null>(null);
  const [isCustomChordFromDb, setIsCustomChordFromDb] = useState<boolean>(false);
  const [isSavingChordDb, setIsSavingChordDb] = useState<boolean>(false);
  const [customVoicingsMap, setCustomVoicingsMap] = useState<Record<string, ChordNotePayload[]>>({});
  const customVoicingsMapRef = useRef(customVoicingsMap);
  customVoicingsMapRef.current = customVoicingsMap;

  // Estado Modo 2: Escalas y Sistema Dual (CAGED vs 3NPS)
  const [scaleKey, setScaleKey] = useState<ScaleKey>('major');
  const [scaleSystem, setScaleSystem] = useState<ScaleSystemType>('caged');
  const [activePatternId, setActivePatternId] = useState<number>(1);
  const [scaleViewMode, setScaleViewMode] = useState<'single_box' | 'full_neck_map'>('single_box');
  const [threeToTwoLayout, setThreeToTwoLayout] = useState<ThreeToTwoLayoutMode>('vertical');

  // Estado de Persistencia en Base de Datos PostgreSQL
  const [customDbPattern, setCustomDbPattern] = useState<{
    minFret: number;
    maxFret: number;
    notesData: ScaleNotePayload[];
  } | null>(null);
  const [isCustomFromDb, setIsCustomFromDb] = useState<boolean>(false);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);

  // Estado Modo Editor Visual de Escalas / Patrones
  const [isEditorActive, setIsEditorActive] = useState<boolean>(false);
  const [editingGrid, setEditingGrid] = useState<Record<number, EditableNote[]>>({});
  const [editorTouchMode, setEditorTouchMode] = useState<'cycle' | 'root'>('cycle');

  // Estado Modo 3: Progresiones e Improvisación en Tiempo Real
  const [selectedProgressionId, setSelectedProgressionId] = useState<string>('ii_v_i');
  const [progressionPlaying, setProgressionPlaying] = useState<boolean>(false);
  const [currentProgressionStepIndex, setCurrentProgressionStepIndex] = useState<number>(0);
  const [bpm, setBpm] = useState<number>(85);
  const [improvMode, setImprovMode] = useState<ImprovDisplayMode>('both');
  const [progressionSystem, setProgressionSystem] = useState<'all' | 'caged' | '3nps' | 'three_to_two'>('three_to_two');
  const [selectedThreeToTwoPattern, setSelectedThreeToTwoPattern] = useState<string>('32_p1');
  const [customProgressions, setCustomProgressions] = useState<ProgressionDef[]>([]);
  const [isCreateProgModalOpen, setIsCreateProgModalOpen] = useState<boolean>(false);
  const [stepResourceOverrides, setStepResourceOverrides] = useState<Record<string, string>>({});

  // Cargar progresiones personalizadas de PostgreSQL al iniciar
  useEffect(() => {
    let isCancelled = false;
    fetch('/api/progressions')
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (isCancelled || !Array.isArray(list)) return;
        const converted = list
          .filter((item) => item && item.name && Array.isArray(item.chordsJson) && item.chordsJson.length > 0)
          .map((item) => convertCustomProgressionToDef(item));
        setCustomProgressions(converted);
      })
      .catch(() => {
        // Silencioso si no hay conexión a BD
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const allProgressions = useMemo(() => {
    return [...customProgressions, ...PROGRESSIONS_CATALOG];
  }, [customProgressions]);

  const activeProgression = useMemo(() => {
    return allProgressions.find((p) => p.id === selectedProgressionId) || allProgressions[0] || PROGRESSIONS_CATALOG[0];
  }, [allProgressions, selectedProgressionId]);

  const activeStepResourceId = useMemo(() => {
    const resolved = resolveProgressionChords(activeProgression, rootNote);
    const currentStep = resolved[currentProgressionStepIndex] || resolved[0];
    const overrideKey = `${selectedProgressionId}_${currentProgressionStepIndex}`;
    return stepResourceOverrides[overrideKey] || currentStep?.assignedImprovResourceId || 'default';
  }, [activeProgression, rootNote, currentProgressionStepIndex, selectedProgressionId, stepResourceOverrides]);

  const handleStepImprovResourceChange = useCallback(
    (stepIndex: number, resourceId: string) => {
      const overrideKey = `${selectedProgressionId}_${stepIndex}`;
      setStepResourceOverrides((prev) => ({
        ...prev,
        [overrideKey]: resourceId,
      }));
    },
    [selectedProgressionId]
  );

  const currentImprovGuide = useMemo(() => {
    const resolved = resolveProgressionChords(activeProgression, rootNote);
    const currentStep = resolved[currentProgressionStepIndex] || resolved[0];
    if (!currentStep) return null;
    const baseGuide = getImprovisationGuide(rootNote, currentStep.fullChordLabel, currentStep.roman);
    const customResource = findImprovResourceById(activeStepResourceId, currentStep.roman);
    if (!customResource) return baseGuide;

    const rootIdx = CHROMATIC_NOTES.indexOf(currentStep.rootNote);
    const safeRootIdx = rootIdx === -1 ? 0 : rootIdx;

    const customNotes = customResource.intervals.map((intervalItem) => {
      const semitoneValue = typeof intervalItem === 'number' ? intervalItem : intervalItem.semitones;
      return CHROMATIC_NOTES[(safeRootIdx + semitoneValue + 12) % 12];
    });

    const resourceTitle = customResource.name || customResource.label || '';

    return {
      ...baseGuide,
      primaryMode: {
        ...baseGuide.primaryMode,
        name: `${currentStep.rootNote} ${resourceTitle}`,
        scaleNotes: customNotes,
        character:
          customResource.type === 'arpeggio'
            ? `Arpegio asignado (${resourceTitle}) sobre ${currentStep.fullChordLabel}`
            : `Escala/Modo asignado (${resourceTitle}) sobre ${currentStep.fullChordLabel}`,
      },
    };
  }, [activeProgression, rootNote, currentProgressionStepIndex, activeStepResourceId]);

  const config = INSTRUMENTS[instrument];

  // Voicings de los 7 Acordes Diatónicos en CAGED con Selector de Modo y Extensiones
  const cagedChords: CagedChordVoicing[] = useMemo(() => {
    if (studyMode !== 'chords') return [];
    return getCagedDiatonicChords(
      rootNote,
      activeCagedBoxId,
      instrument,
      activeExtensionFamily,
      tonalityMode
    );
  }, [studyMode, rootNote, activeCagedBoxId, instrument, activeExtensionFamily, tonalityMode]);

  // Si cambia la caja o tonalidad, asegurar índice de grado seguro
  useEffect(() => {
    if (activeChordDegreeIndex >= 7) {
      setActiveChordDegreeIndex(0);
    }
  }, [activeChordDegreeIndex]);

  // Lista de Variaciones Armónicas Contextuales para el grado y modo activos
  const degreeVariations = useMemo(() => {
    return getVariationsForDegree(activeChordDegreeIndex, rootNote, tonalityMode);
  }, [activeChordDegreeIndex, rootNote, tonalityMode]);

  // Sincronizar activeVariationId cuando cambia el grado o modo
  useEffect(() => {
    if (!degreeVariations.some((v) => v.id === activeVariationId)) {
      setActiveVariationId(degreeVariations[0]?.id || 'std');
    }
  }, [degreeVariations, activeVariationId]);

  const activeVariation = useMemo(() => {
    return degreeVariations.find((v) => v.id === activeVariationId) || degreeVariations[0];
  }, [degreeVariations, activeVariationId]);

  // Helper para derivar el tipo de acorde armónico para persistencia (ej: "major", "m", "m7", "maj7", "7")
  const getVoicingChordType = useCallback((chord?: CagedChordVoicing): string => {
    if (!chord) return 'major';
    const name = chord.chordName || '';
    const root = chord.rootNote || '';
    if (name.startsWith(root)) {
      const suffix = name.slice(root.length).trim();
      if (!suffix) return 'major';
      return suffix;
    }
    if (chord.chordType === 'maj') return 'major';
    if (chord.chordType === 'min') return 'm';
    return chord.chordType || 'major';
  }, []);

  // Clave de extensión efectiva para variaciones
  const effectiveChordExtensionKey = useMemo(() => {
    const baseKey =
      !activeVariation || isStandardVariation(activeVariation.id)
        ? activeExtensionFamily
        : activeVariation.id;
    return tonalityMode === 'ionian' ? baseKey : `${tonalityMode}_${baseKey}`;
  }, [activeVariation, activeExtensionFamily, tonalityMode]);

  const activeCagedChord: CagedChordVoicing | undefined = useMemo(() => {
    const baseChord = cagedChords[activeChordDegreeIndex] || cagedChords[0];
    if (!baseChord) return undefined;
    if (customChordNotes !== null) {
      return {
        ...baseChord,
        notes: customChordNotes.map((n) => ({
          stringIndex: n.stringIndex,
          fret: n.fret,
          finger: n.finger,
          intervalLabel: n.intervalLabel,
          isRoot: n.isRoot,
        })),
      };
    }
    if (activeVariation) {
      return applyChordTensionVariation(
        baseChord,
        activeVariation,
        rootNote,
        activeCagedBoxId,
        instrument
      );
    }
    return baseChord;
  }, [
    tonalityMode,
    activeExtensionFamily,
    cagedChords,
    activeChordDegreeIndex,
    customChordNotes,
    activeVariation,
    rootNote,
    activeCagedBoxId,
    instrument,
  ]);

  // Cálculo Teórico y Biomecánico del Sistema Dual de Escalas
  const scaleResult = useMemo(() => {
    if (studyMode !== 'scales') return null;
    return calculateScaleSystemNotes(
      instrument,
      rootNote,
      scaleKey,
      scaleSystem,
      activePatternId,
      threeToTwoLayout
    );
  }, [studyMode, instrument, rootNote, scaleKey, scaleSystem, activePatternId, threeToTwoLayout]);

  // Zonas / Brackets de Posición a lo largo de todo el mástil (0 a 24 trastes)
  const positionZones = useMemo(() => {
    return getScalePositionZones(scaleSystem, rootNote, config.totalFrets);
  }, [scaleSystem, rootNote, config.totalFrets]);

  // Todas las notas de la escala en el mástil completo (0 a 24 trastes)
  const fullNeckScaleNotes = useMemo(() => {
    if (studyMode !== 'scales' || scaleViewMode !== 'full_neck_map') return [];
    return calculateFullNeckScaleNotes(instrument, rootNote, scaleKey);
  }, [studyMode, scaleViewMode, instrument, rootNote, scaleKey]);

  // Carga automática del patrón personalizado desde la Base de Datos PostgreSQL
  useEffect(() => {
    let isCancelled = false;

    if (studyMode === 'scales') {
      getCustomScalePatternAction(instrument, scaleSystem, scaleKey, activePatternId).then(
        (res) => {
          if (isCancelled) return;
          if (res.success && res.data && Array.isArray(res.data.notesData)) {
            setCustomDbPattern({
              minFret: res.data.minFret,
              maxFret: res.data.maxFret,
              notesData: res.data.notesData as unknown as ScaleNotePayload[],
            });
            setIsCustomFromDb(true);
          } else {
            setCustomDbPattern(null);
            setIsCustomFromDb(false);
          }
        }
      );
    } else {
      setCustomDbPattern(null);
      setIsCustomFromDb(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [studyMode, instrument, scaleSystem, scaleKey, activePatternId]);

  // Carga automática al seleccionar acorde o refrescar la página (Hydration desde PostgreSQL / Cache)
  useEffect(() => {
    let isCancelled = false;

    if (studyMode !== 'chords') {
      setCustomChordNotes(null);
      setIsCustomChordFromDb(false);
      return;
    }

    const baseChord = cagedChords[activeChordDegreeIndex] || cagedChords[0];
    const selectedInstrument =
      instrument === 'guitar_6'
        ? 'guitar_6c'
        : instrument === 'bass_4'
        ? 'bass_4c'
        : instrument === 'bass_5'
        ? 'bass_5c'
        : instrument;
    const selectedRoot = baseChord?.rootNote || rootNote;
    const selectedChordType = getVoicingChordType(baseChord);
    const selectedCagedShape =
      CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId)?.shapeLetter || 'C';

    const cacheKey = `${selectedInstrument}_${selectedRoot}_${selectedChordType}_${selectedCagedShape}`;

    // 1. Si ya está en la caché local en memoria, usarlo inmediatamente
    if (customVoicingsMapRef.current[cacheKey]) {
      setCustomChordNotes(customVoicingsMapRef.current[cacheKey]);
      setIsCustomChordFromDb(true);
      return;
    }

    // 2. Si no está en caché, consultar a la API de PostgreSQL
    const fetchCustomVoicing = async () => {
      try {
        const res = await fetch(
          `/api/chords/custom?instrument=${encodeURIComponent(
            selectedInstrument
          )}&root=${encodeURIComponent(selectedRoot)}&chordType=${encodeURIComponent(
            selectedChordType
          )}&shape=${encodeURIComponent(selectedCagedShape)}`
        );
        if (isCancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (
            data.voicing &&
            Array.isArray(data.voicing.fretsJson) &&
            data.voicing.fretsJson.length > 0
          ) {
            const frets = data.voicing.fretsJson as ChordNotePayload[];
            setCustomChordNotes(frets);
            setIsCustomChordFromDb(true);
            setCustomVoicingsMap((prev) => ({ ...prev, [cacheKey]: frets }));
            return;
          }
        }
        // Si no existe versión personalizada en BD, mantener preset calculado
        setCustomChordNotes(null);
        setIsCustomChordFromDb(false);
      } catch (e) {
        console.warn('No se pudo verificar voicing personalizado desde BD, usando preset:', e);
        if (!isCancelled) {
          setCustomChordNotes(null);
          setIsCustomChordFromDb(false);
        }
      }
    };

    fetchCustomVoicing();

    return () => {
      isCancelled = true;
    };
  }, [
    studyMode,
    instrument,
    rootNote,
    activeCagedBoxId,
    activeChordDegreeIndex,
    activeExtensionFamily,
    tonalityMode,
    activeVariationId,
    cagedChords,
    getVoicingChordType,
  ]);

  // Si se cambia de modo (ej. a acordes o progresiones), desactivar el editor de escalas
  useEffect(() => {
    if (studyMode !== 'scales' && isEditorActive) {
      setIsEditorActive(false);
    }
  }, [studyMode, isEditorActive]);

  // Si se cambia de modo (ej. a escalas o progresiones), desactivar el editor de acordes
  useEffect(() => {
    if (studyMode !== 'chords' && isChordEditorActive) {
      setIsChordEditorActive(false);
    }
  }, [studyMode, isChordEditorActive]);

  // Manejador para abrir/cerrar editor cargando las notas actuales de la caja
  const handleToggleEditor = useCallback(() => {
    setIsEditorActive((prev) => {
      const next = !prev;
      if (next) {
        const initialGrid: Record<number, EditableNote[]> = {};

        // Si existe un patrón guardado en BD, cargar ese; si no, el patrón teórico calculado
        if (customDbPattern && customDbPattern.notesData.length > 0) {
          const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
          const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
          const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

          customDbPattern.notesData.forEach((n) => {
            if (!initialGrid[n.stringIndex]) {
              initialGrid[n.stringIndex] = [];
            }
            let transposedFret = n.fret + shift;
            if (transposedFret > config.totalFrets) transposedFret -= 12;
            if (transposedFret < 0) transposedFret += 12;

            initialGrid[n.stringIndex].push({
              fret: transposedFret,
              finger: n.finger > 0 ? n.finger : 1,
              isRoot: !!n.isRoot,
              isStretch: !!n.isStretch,
            });
          });
        } else if (scaleResult && scaleResult.notes.length > 0) {
          scaleResult.notes.forEach((n) => {
            if (!initialGrid[n.stringIndex]) {
              initialGrid[n.stringIndex] = [];
            }
            const fingerNum =
              n.fingerAssignment?.finger || (n.finger ? parseInt(n.finger, 10) : 1) || 1;
            initialGrid[n.stringIndex].push({
              fret: n.fret,
              finger: fingerNum > 0 ? fingerNum : 1,
              isRoot: n.role === 'root',
              isStretch: n.fingerAssignment?.isStretch || false,
            });
          });
        }

        Object.keys(initialGrid).forEach((str) => {
          initialGrid[Number(str)].sort((a, b) => a.fret - b.fret);
        });

        setEditingGrid(initialGrid);
      }
      return next;
    });
  }, [scaleResult, customDbPattern, rootNote, config.totalFrets]);

  // Restablecer la cuadrícula a las notas teóricas de la escala
  const handleResetEditorGrid = useCallback(() => {
    const initialGrid: Record<number, EditableNote[]> = {};
    if (scaleResult && scaleResult.notes.length > 0) {
      scaleResult.notes.forEach((n) => {
        if (!initialGrid[n.stringIndex]) {
          initialGrid[n.stringIndex] = [];
        }
        const fingerNum =
          n.fingerAssignment?.finger || (n.finger ? parseInt(n.finger, 10) : 1) || 1;
        initialGrid[n.stringIndex].push({
          fret: n.fret,
          finger: fingerNum > 0 ? fingerNum : 1,
          isRoot: n.role === 'root',
          isStretch: n.fingerAssignment?.isStretch || false,
        });
      });
      Object.keys(initialGrid).forEach((str) => {
        initialGrid[Number(str)].sort((a, b) => a.fret - b.fret);
      });
    }
    setEditingGrid(initialGrid);
  }, [scaleResult]);

  // Limpiar toda la cuadrícula para construir un patrón desde cero
  const handleClearEditorGrid = useCallback(() => {
    setEditingGrid({});
  }, []);

  // Guardar el patrón editado en PostgreSQL a través de Server Action
  const handleSaveToDb = useCallback(async () => {
    setIsSavingDb(true);
    try {
      const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
      const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
      const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

      const flatNotes: ScaleNotePayload[] = [];
      const allFrets: number[] = [];

      Object.entries(editingGrid).forEach(([strIdxStr, list]) => {
        const sIdx = Number(strIdxStr);
        list.forEach((n) => {
          let baseFret = n.fret - shift;
          if (baseFret < 0) baseFret += 12;
          allFrets.push(baseFret);

          flatNotes.push({
            stringIndex: sIdx,
            fret: baseFret,
            finger: n.finger,
            isRoot: !!n.isRoot,
            isStretch: !!n.isStretch,
          });
        });
      });

      const patternName =
        scaleSystem === 'caged'
          ? `${SCALES_CATALOG[scaleKey]?.name || ''} - Caja ${activePatternId}`
          : `${SCALES_CATALOG[scaleKey]?.name || ''} - Patrón ${activePatternId}`;

      const minFret = allFrets.length > 0 ? Math.min(...allFrets) : 0;
      const maxFret = allFrets.length > 0 ? Math.max(...allFrets) : 12;

      const res = await saveScalePatternAction({
        instrumentType: instrument,
        system: scaleSystem,
        scaleKey,
        patternId: activePatternId,
        name: patternName,
        minFret,
        maxFret,
        notesData: flatNotes,
      });

      if (res.success && res.data) {
        setCustomDbPattern({
          minFret,
          maxFret,
          notesData: flatNotes,
        });
        setIsCustomFromDb(true);
      }
    } finally {
      setIsSavingDb(false);
    }
  }, [editingGrid, instrument, scaleSystem, scaleKey, activePatternId, rootNote]);

  // Restablecer el patrón eliminando el registro de PostgreSQL
  const handleResetDb = useCallback(async () => {
    await resetScalePatternAction(instrument, scaleSystem, scaleKey, activePatternId);
    setCustomDbPattern(null);
    setIsCustomFromDb(false);

    // Restablecer inmediatamente editingGrid a las notas teóricas
    const initialGrid: Record<number, EditableNote[]> = {};
    if (scaleResult && scaleResult.notes.length > 0) {
      scaleResult.notes.forEach((n) => {
        if (!initialGrid[n.stringIndex]) {
          initialGrid[n.stringIndex] = [];
        }
        const fingerNum =
          n.fingerAssignment?.finger || (n.finger ? parseInt(n.finger, 10) : 1) || 1;
        initialGrid[n.stringIndex].push({
          fret: n.fret,
          finger: fingerNum > 0 ? fingerNum : 1,
          isRoot: n.role === 'root',
          isStretch: n.fingerAssignment?.isStretch || false,
        });
      });
      Object.keys(initialGrid).forEach((str) => {
        initialGrid[Number(str)].sort((a, b) => a.fret - b.fret);
      });
    }
    setEditingGrid(initialGrid);
  }, [instrument, scaleSystem, scaleKey, activePatternId, scaleResult]);

  // Clic en traste durante el modo editor: añadir / ciclar dedo (1->2->3->4->eliminar)
  const handleFretClickInEditor = useCallback(
    (stringIndex: number, fret: number) => {
      if (!isEditorActive) return;

      setEditingGrid((prev) => {
        const currentStringNotes = prev[stringIndex] || [];
        const existingIndex = currentStringNotes.findIndex((n) => n.fret === fret);

        // Si el modo táctil es 'root' (marcar tónica en móviles/pantallas táctiles):
        if (editorTouchMode === 'root') {
          if (existingIndex === -1) {
            return {
              ...prev,
              [stringIndex]: [...currentStringNotes, { fret, finger: 1, isRoot: true }].sort(
                (a, b) => a.fret - b.fret
              ),
            };
          }
          const existing = currentStringNotes[existingIndex];
          const updated = [...currentStringNotes];
          updated[existingIndex] = { ...existing, isRoot: !existing.isRoot };
          return { ...prev, [stringIndex]: updated };
        }

        // 1. Si no existe la nota en ese traste -> Se añade con Dedo 1 por defecto
        if (existingIndex === -1) {
          return {
            ...prev,
            [stringIndex]: [...currentStringNotes, { fret, finger: 1, isRoot: false }].sort(
              (a, b) => a.fret - b.fret
            ),
          };
        }

        // 2. Si ya existe -> Se cicla el dedo: 1 -> 2 -> 3 -> 4 -> Eliminar
        const existing = currentStringNotes[existingIndex];
        if (existing.finger < 4) {
          const updated = [...currentStringNotes];
          updated[existingIndex] = { ...existing, finger: existing.finger + 1 };
          return { ...prev, [stringIndex]: updated };
        } else {
          // Elimina la nota al pasar del dedo 4
          return {
            ...prev,
            [stringIndex]: currentStringNotes.filter((n) => n.fret !== fret),
          };
        }
      });
    },
    [isEditorActive, editorTouchMode]
  );

  // Clic secundario (derecho) en traste: marcar / desmarcar Tónica (Root)
  const handleToggleRootInEditor = useCallback(
    (e: React.MouseEvent, stringIndex: number, fret: number) => {
      e.preventDefault(); // Evita el menú contextual del navegador
      if (!isEditorActive) return;

      setEditingGrid((prev) => {
        const currentStringNotes = prev[stringIndex] || [];
        const existingIndex = currentStringNotes.findIndex((n) => n.fret === fret);

        if (existingIndex === -1) {
          return {
            ...prev,
            [stringIndex]: [...currentStringNotes, { fret, finger: 1, isRoot: true }].sort(
              (a, b) => a.fret - b.fret
            ),
          };
        }

        const updated = currentStringNotes.map((n) =>
          n.fret === fret ? { ...n, isRoot: !n.isRoot } : n
        );
        return { ...prev, [stringIndex]: updated };
      });
    },
    [isEditorActive]
  );

  // Manejador para abrir/cerrar editor de acordes
  const handleToggleChordEditor = useCallback(() => {
    setIsChordEditorActive((prev) => {
      const next = !prev;
      if (next && customChordNotes === null && activeCagedChord) {
        setCustomChordNotes(
          activeCagedChord.notes.map((n) => ({
            stringIndex: n.stringIndex,
            fret: n.fret,
            finger: n.finger,
            intervalLabel: n.intervalLabel,
            isRoot: n.isRoot,
          }))
        );
      }
      return next;
    });
  }, [customChordNotes, activeCagedChord]);

  // Clic en traste durante la edición de acordes: añadir / ciclar dedo (1->2->3->4->eliminar)
  const handleChordFretClick = useCallback(
    (stringIndex: number, fret: number) => {
      if (!isChordEditorActive) return;

      setCustomChordNotes((prev) => {
        const currentNotes: ChordNotePayload[] =
          prev !== null
            ? prev
            : (activeCagedChord?.notes.map((n) => ({
                stringIndex: n.stringIndex,
                fret: n.fret,
                finger: n.finger,
                intervalLabel: n.intervalLabel,
                isRoot: n.isRoot,
              })) || []);

        const existingSameFretIndex = currentNotes.findIndex(
          (n) => n.stringIndex === stringIndex && n.fret === fret
        );

        if (existingSameFretIndex !== -1) {
          const existing = currentNotes[existingSameFretIndex];
          if (existing.finger < 4) {
            const updated = [...currentNotes];
            updated[existingSameFretIndex] = { ...existing, finger: existing.finger + 1 };
            return updated;
          } else {
            return currentNotes.filter((_, idx) => idx !== existingSameFretIndex);
          }
        } else {
          // Reemplaza cualquier otra nota en la misma cuerda (en acorde cada cuerda pulsa un solo traste)
          const filtered = currentNotes.filter((n) => n.stringIndex !== stringIndex);
          const str = config.strings[stringIndex];
          const fn = getFretNote(str?.midi ?? 40, fret);
          const chordRoot = activeCagedChord ? activeCagedChord.rootNote : rootNote;
          const formulaDef = getFormulasForTonalityAndFamily(
            tonalityMode,
            activeExtensionFamily
          )?.[activeChordDegreeIndex];
          const interval = getIntervalLabel(fn.note, chordRoot, formulaDef?.intervals);
          const isRoot = interval === 'R';
          return [
            ...filtered,
            {
              stringIndex,
              fret,
              finger: 1,
              intervalLabel: interval,
              isRoot,
            },
          ].sort((a, b) => b.stringIndex - a.stringIndex);
        }
      });
    },
    [isChordEditorActive, activeCagedChord, config.strings, rootNote, tonalityMode, activeExtensionFamily, activeChordDegreeIndex]
  );

  // Clic secundario (derecho) en traste durante la edición de acordes: alternar Fundamental (Root)
  const handleChordToggleRoot = useCallback(
    (e: React.MouseEvent, stringIndex: number, fret: number) => {
      e.preventDefault();
      if (!isChordEditorActive) return;

      setCustomChordNotes((prev) => {
        const currentNotes: ChordNotePayload[] =
          prev !== null
            ? prev
            : (activeCagedChord?.notes.map((n) => ({
                stringIndex: n.stringIndex,
                fret: n.fret,
                finger: n.finger,
                intervalLabel: n.intervalLabel,
                isRoot: n.isRoot,
              })) || []);

        const idx = currentNotes.findIndex((n) => n.stringIndex === stringIndex && n.fret === fret);
        if (idx === -1) return prev;

        const updated = [...currentNotes];
        const target = updated[idx];
        const newIsRoot = !target.isRoot;

        const str = config.strings[stringIndex];
        const fn = getFretNote(str?.midi ?? 40, fret);
        const chordRoot = activeCagedChord ? activeCagedChord.rootNote : rootNote;
        const formulaDef = getFormulasForTonalityAndFamily(
          tonalityMode,
          activeExtensionFamily
        )?.[activeChordDegreeIndex];
        const interval = newIsRoot ? 'R' : getIntervalLabel(fn.note, chordRoot, formulaDef?.intervals);

        updated[idx] = {
          ...target,
          isRoot: newIsRoot,
          intervalLabel: interval,
        };
        return updated;
      });
    },
    [isChordEditorActive, activeCagedChord, config.strings, rootNote, tonalityMode, activeExtensionFamily, activeChordDegreeIndex]
  );

  // Guardar acorde editado en PostgreSQL
  const handleSaveChordToDb = useCallback(async () => {
    const baseChord = cagedChords[activeChordDegreeIndex] || cagedChords[0];
    if (!baseChord) return;

    const selectedInstrument =
      instrument === 'guitar_6'
        ? 'guitar_6c'
        : instrument === 'bass_4'
        ? 'bass_4c'
        : instrument === 'bass_5'
        ? 'bass_5c'
        : instrument;
    const selectedRoot = baseChord?.rootNote || rootNote;
    const selectedChordType = getVoicingChordType(baseChord);
    const selectedCagedShape =
      CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId)?.shapeLetter || 'C';

    const notesToSave: ChordNotePayload[] = (
      customChordNotes !== null ? customChordNotes : activeCagedChord?.notes || baseChord.notes
    ).map((n) => ({
      stringIndex: n.stringIndex,
      fret: n.fret,
      finger: n.finger,
      intervalLabel: n.intervalLabel,
      isRoot: n.isRoot,
    }));

    if (notesToSave.length === 0) {
      alert('Debes agregar al menos una nota en el diapasón para guardar el voicing.');
      return;
    }

    setIsSavingChordDb(true);
    try {
      const payload = {
        instrument: selectedInstrument,
        root: selectedRoot,
        chordType: selectedChordType,
        shape: selectedCagedShape,
        frets: notesToSave,
      };

      const res = await fetch('/api/chords/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const cacheKey = `${selectedInstrument}_${selectedRoot}_${selectedChordType}_${selectedCagedShape}`;
        setCustomVoicingsMap((prev) => ({
          ...prev,
          [cacheKey]: notesToSave,
        }));
        setCustomChordNotes(notesToSave);
        setIsCustomChordFromDb(true);
        setIsChordEditorActive(false);
        alert(
          `¡Voicing de ${baseChord.chordName} (Forma ${selectedCagedShape}) guardado exitosamente en base de datos!`
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Error al guardar el voicing en el servidor.');
      }
    } catch (err) {
      console.error('Error al conectar con la API de acordes:', err);
      alert('Error de conexión al intentar guardar en base de datos.');
    } finally {
      setIsSavingChordDb(false);
    }
  }, [
    activeCagedChord,
    cagedChords,
    activeChordDegreeIndex,
    instrument,
    rootNote,
    activeCagedBoxId,
    customChordNotes,
    getVoicingChordType,
  ]);

  // Restablecer acorde eliminando el registro de PostgreSQL
  const handleResetChordDb = useCallback(async () => {
    const baseChord = cagedChords[activeChordDegreeIndex] || cagedChords[0];
    if (!baseChord) return;

    const selectedInstrument =
      instrument === 'guitar_6'
        ? 'guitar_6c'
        : instrument === 'bass_4'
        ? 'bass_4c'
        : instrument === 'bass_5'
        ? 'bass_5c'
        : instrument;
    const selectedRoot = baseChord?.rootNote || rootNote;
    const selectedChordType = getVoicingChordType(baseChord);
    const selectedCagedShape =
      CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId)?.shapeLetter || 'C';

    try {
      setIsSavingChordDb(true);
      const res = await fetch(
        `/api/chords/custom?instrument=${encodeURIComponent(
          selectedInstrument
        )}&root=${encodeURIComponent(selectedRoot)}&chordType=${encodeURIComponent(
          selectedChordType
        )}&shape=${encodeURIComponent(selectedCagedShape)}`,
        { method: 'DELETE' }
      );

      const cacheKey = `${selectedInstrument}_${selectedRoot}_${selectedChordType}_${selectedCagedShape}`;
      setCustomVoicingsMap((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });

      setCustomChordNotes(null);
      setIsCustomChordFromDb(false);
      setIsChordEditorActive(false);

      if (res.ok) {
        alert(
          `Voicing de ${baseChord.chordName} (Forma ${selectedCagedShape}) restablecido al preset por defecto.`
        );
      }
    } catch (err) {
      console.error('Error al restablecer voicing:', err);
      alert('Error de conexión al restablecer el voicing.');
    } finally {
      setIsSavingChordDb(false);
    }
  }, [
    cagedChords,
    activeChordDegreeIndex,
    instrument,
    rootNote,
    activeCagedBoxId,
    getVoicingChordType,
  ]);

  // Rango mínimo y máximo del patrón actualmente editado
  const { editorMinFret, editorMaxFret } = useMemo(() => {
    const frets: number[] = [];
    Object.values(editingGrid).forEach((list) => {
      list.forEach((n) => frets.push(n.fret));
    });
    if (frets.length > 0) {
      return {
        editorMinFret: Math.min(...frets),
        editorMaxFret: Math.max(...frets),
      };
    }
    return {
      editorMinFret: scaleResult?.fretRange[0] ?? 0,
      editorMaxFret: scaleResult?.fretRange[1] ?? 12,
    };
  }, [editingGrid, scaleResult]);

  // Cálculo de las notas activas que se mostrarán sobre el diapasón según el modo
  const activeNotes: ActiveFretNote[] = useMemo(() => {
    // -------------------------------------------------------------
    // MODO EDITOR DE PATRONES EN VIVO
    // -------------------------------------------------------------
    if (isEditorActive && studyMode === 'scales') {
      const notes: ActiveFretNote[] = [];
      Object.entries(editingGrid).forEach(([strIdxStr, noteList]) => {
        const sIdx = Number(strIdxStr);
        const str = config.strings[sIdx];
        if (!str) return;

        noteList.forEach((item) => {
          const fn = getFretNote(str.midi, item.fret);
          const isRoot = !!item.isRoot;
          notes.push({
            stringIndex: sIdx,
            fret: item.fret,
            note: fn.note,
            interval: isRoot ? 'R' : '',
            role: isRoot ? 'root' : 'other',
            finger: item.finger > 0 ? String(item.finger) : undefined,
            fingerAssignment: {
              finger: item.finger,
              isStretch: !!item.isStretch,
              stretchType: item.isStretch
                ? item.finger === 1
                  ? 'backward'
                  : 'forward'
                : undefined,
            },
            midi: fn.midi,
          });
        });
      });
      return notes;
    }

    // -------------------------------------------------------------
    // MODO 1: ACORDES Y POSICIONES (CAMPO ARMÓNICO DIATÓNICO CAGED)
    // -------------------------------------------------------------
    if (studyMode === 'chords') {
      if (!activeCagedChord) return [];
      return activeCagedChord.notes.map((cn) => {
        const str = config.strings[cn.stringIndex];
        const fn = getFretNote(str?.midi ?? 40, cn.fret);
        const isRoot = cn.isRoot;

        let role: NoteRole = 'other';
        if (isRoot) role = 'root';
        else if (cn.intervalLabel === '3' || cn.intervalLabel === 'b3') role = 'third';
        else if (
          cn.intervalLabel === '5' ||
          cn.intervalLabel === 'b5' ||
          cn.intervalLabel === '#5'
        )
          role = 'fifth';
        else if (
          cn.intervalLabel === '7' ||
          cn.intervalLabel === 'b7' ||
          cn.intervalLabel === 'bb7'
        )
          role = 'seventh';

        return {
          stringIndex: cn.stringIndex,
          fret: cn.fret,
          note: fn.note,
          interval: cn.intervalLabel,
          role,
          finger: cn.finger > 0 ? String(cn.finger) : undefined,
          fingerAssignment: {
            finger: cn.finger,
            isStretch: false,
          },
          midi: fn.midi,
        };
      });
    }

    // -------------------------------------------------------------
    // MODO 2: ESCALAS Y MODOS (SISTEMA DUAL: CAGED vs 3NPS)
    // -------------------------------------------------------------
    if (studyMode === 'scales') {
      let activeBoxNotes: ActiveFretNote[] = [];

      if (customDbPattern && customDbPattern.notesData.length > 0) {
        const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
        const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
        const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

        customDbPattern.notesData.forEach((item) => {
          const str = config.strings[item.stringIndex];
          if (!str) return;

          let f = item.fret + shift;
          if (f > config.totalFrets) f -= 12;
          if (f < 0) f += 12;

          const fn = getFretNote(str.midi, f);
          const isRoot = !!item.isRoot;

          activeBoxNotes.push({
            stringIndex: item.stringIndex,
            fret: f,
            note: fn.note,
            interval: isRoot ? 'R' : '',
            role: isRoot ? 'root' : 'other',
            finger: item.finger > 0 ? String(item.finger) : undefined,
            fingerAssignment: {
              finger: item.finger,
              isStretch: !!item.isStretch,
              stretchType: item.isStretch
                ? item.finger === 1
                  ? 'backward'
                  : 'forward'
                : undefined,
            },
            midi: fn.midi,
          });
        });
      } else if (scaleResult) {
        activeBoxNotes = scaleResult.notes;
      }

      // Si la vista es por caja individual, devolvemos las notas de la caja
      if (scaleViewMode === 'single_box') {
        return activeBoxNotes;
      }

      // Si la vista es Mástil Completo (Mapa de Posiciones):
      const activeMap = new Map<string, ActiveFretNote>();
      activeBoxNotes.forEach((n) => {
        activeMap.set(`${n.stringIndex}_${n.fret}`, n);
        if (n.fret + 12 <= config.totalFrets) {
          activeMap.set(`${n.stringIndex}_${n.fret + 12}`, {
            ...n,
            fret: n.fret + 12,
            midi: n.midi + 12,
          });
        }
      });

      return fullNeckScaleNotes.map((fn) => {
        const key = `${fn.stringIndex}_${fn.fret}`;
        const activeItem = activeMap.get(key);
        if (activeItem) {
          return {
            ...fn,
            finger: activeItem.finger,
            fingerAssignment: activeItem.fingerAssignment,
            isDimmed: false,
          };
        }
        return {
          ...fn,
          finger: undefined,
          fingerAssignment: { finger: 0, isStretch: false },
          isDimmed: true,
        };
      });
    }

    // -------------------------------------------------------------
    // MODO 3: PROGRESIONES ARMÓNICAS + GUÍA DE IMPROVISACIÓN
    // -------------------------------------------------------------
    if (studyMode === 'progressions') {
      const resolved = resolveProgressionChords(activeProgression, rootNote);
      const currentStep = resolved[currentProgressionStepIndex] || resolved[0];
      const guide = getImprovisationGuide(rootNote, currentStep.fullChordLabel, currentStep.roman);
      const customResource = findImprovResourceById(activeStepResourceId, currentStep.roman);

      const SEMITONE_INTERVAL_LABELS: Record<number, { label: string; role: NoteRole }> = {
        0: { label: 'R', role: 'root' },
        1: { label: 'b2', role: 'other' },
        2: { label: '2', role: 'other' },
        3: { label: 'b3', role: 'third' },
        4: { label: '3', role: 'third' },
        5: { label: '4', role: 'other' },
        6: { label: 'b5', role: 'fifth' },
        7: { label: '5', role: 'fifth' },
        8: { label: 'b6', role: 'fifth' },
        9: { label: '6', role: 'seventh' },
        10: { label: 'b7', role: 'seventh' },
        11: { label: '7', role: 'seventh' },
      };

      const chordNotes = getChordNoteList(currentStep.rootNote, currentStep.chordKey);
      const chordNoteMap = new Map<string, { interval: string; role: NoteRole }>();

      if (customResource && customResource.type === 'arpeggio') {
        const rootIdx = CHROMATIC_NOTES.indexOf(currentStep.rootNote);
        const safeRootIdx = rootIdx === -1 ? 0 : rootIdx;
        customResource.intervals.forEach((intervalItem) => {
          const semitoneValue = typeof intervalItem === 'number' ? intervalItem : intervalItem.semitones;
          const noteName = CHROMATIC_NOTES[(safeRootIdx + semitoneValue + 12) % 12];
          const meta = SEMITONE_INTERVAL_LABELS[((semitoneValue % 12) + 12) % 12] || { label: '', role: 'other' };
          const intervalLabel = typeof intervalItem === 'object' && intervalItem.label ? intervalItem.label : meta.label;
          chordNoteMap.set(noteName, {
            interval: intervalLabel,
            role: meta.role,
          });
        });
      } else {
        chordNotes.forEach((cn) => {
          chordNoteMap.set(cn.note, {
            interval: cn.interval.label,
            role: cn.interval.role,
          });
        });
      }

      const scaleNoteMap = new Map<string, { interval: string; role: NoteRole }>();
      if (customResource && customResource.type !== 'arpeggio') {
        const rootIdx = CHROMATIC_NOTES.indexOf(currentStep.rootNote);
        const safeRootIdx = rootIdx === -1 ? 0 : rootIdx;
        customResource.intervals.forEach((intervalItem) => {
          const semitoneValue = typeof intervalItem === 'number' ? intervalItem : intervalItem.semitones;
          const noteName = CHROMATIC_NOTES[(safeRootIdx + semitoneValue + 12) % 12];
          const meta = SEMITONE_INTERVAL_LABELS[((semitoneValue % 12) + 12) % 12] || { label: '', role: 'other' };
          const intervalLabel = typeof intervalItem === 'object' && intervalItem.label ? intervalItem.label : meta.label;
          scaleNoteMap.set(noteName, {
            interval: intervalLabel,
            role: meta.role,
          });
        });
      } else {
        const scaleNotes = getScaleNoteList(currentStep.rootNote, guide.primaryMode.scaleKey);
        scaleNotes.forEach((sn) => {
          scaleNoteMap.set(sn.note, {
            interval: sn.interval.label,
            role: sn.interval.role,
          });
        });
      }

      const notes: ActiveFretNote[] = [];

      // Determinar límites de trastes y distribución de cuerdas según progressionSystem
      let minFret = 0;
      let maxFret = config.totalFrets;
      let boxBaseFret = 1;
      let stringDistribution: (2 | 3)[] | null = null;

      if (progressionSystem === 'three_to_two') {
        const pat = getThreeToTwoPattern(selectedThreeToTwoPattern);
        stringDistribution = pat.stringDistribution;
        const targetRootIdx = CHROMATIC_NOTES.indexOf(currentStep.rootNote as ChromaticNote);
        const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
        const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

        minFret = pat.baseMinFret + shift;
        maxFret = pat.baseMaxFret + shift;
        if (maxFret > config.totalFrets) {
          minFret -= 12;
          maxFret -= 12;
        } else if (minFret < 0) {
          minFret += 12;
          maxFret += 12;
        }
        minFret = Math.max(0, minFret);
        maxFret = Math.min(config.totalFrets, maxFret);
        boxBaseFret = minFret === 0 ? 1 : minFret + pat.baseFretOffset;
      } else if (progressionSystem === 'caged') {
        const cagedBox = CAGED_BASE_BOXES.find((b) => b.id === activeCagedBoxId) || CAGED_BASE_BOXES[0];
        const targetRootIdx = CHROMATIC_NOTES.indexOf(currentStep.rootNote as ChromaticNote);
        const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
        const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

        minFret = cagedBox.baseMinFret + shift;
        maxFret = cagedBox.baseMaxFret + shift;
        if (maxFret > config.totalFrets) {
          minFret -= 12;
          maxFret -= 12;
        } else if (minFret < 0) {
          minFret += 12;
          maxFret += 12;
        }
        minFret = Math.max(0, minFret);
        maxFret = Math.min(config.totalFrets, maxFret);
        boxBaseFret = minFret === 0 ? 1 : minFret + cagedBox.baseFretOffset;
      } else if (progressionSystem === '3nps') {
        const npsBox = THREE_NPS_BASE_PATTERNS[0];
        const targetRootIdx = CHROMATIC_NOTES.indexOf(currentStep.rootNote as ChromaticNote);
        const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
        const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

        minFret = npsBox.baseMinFret + shift;
        maxFret = npsBox.baseMaxFret + shift;
        if (maxFret > config.totalFrets) {
          minFret -= 12;
          maxFret -= 12;
        } else if (minFret < 0) {
          minFret += 12;
          maxFret += 12;
        }
        minFret = Math.max(0, minFret);
        maxFret = Math.min(config.totalFrets, maxFret);
        boxBaseFret = minFret === 0 ? 1 : minFret;
      }

      config.strings.forEach((str, sIdx) => {
        const stringCandidates: {
          fret: number;
          fn: { note: string; midi: number };
          chordMatch?: { interval: string; role: NoteRole };
          scaleMatch?: { interval: string; role: NoteRole };
          isTargetTone: boolean;
          isDimmed: boolean;
          interval: string;
          role: NoteRole;
        }[] = [];

        for (let fret = minFret; fret <= maxFret; fret++) {
          const fn = getFretNote(str.midi, fret);
          const chordMatch = chordNoteMap.get(fn.note);
          const scaleMatch = scaleNoteMap.get(fn.note);

          if (improvMode === 'chord_tones' || (customResource && customResource.type === 'arpeggio' && improvMode !== 'both')) {
            if (chordMatch) {
              stringCandidates.push({
                fret,
                fn,
                chordMatch,
                isTargetTone: true,
                isDimmed: false,
                interval: chordMatch.interval,
                role: chordMatch.role,
              });
            }
          } else if (improvMode === 'both') {
            if (chordMatch) {
              stringCandidates.push({
                fret,
                fn,
                chordMatch,
                isTargetTone: true,
                isDimmed: false,
                interval: chordMatch.interval,
                role: chordMatch.role,
              });
            } else if (scaleMatch) {
              stringCandidates.push({
                fret,
                fn,
                scaleMatch,
                isTargetTone: false,
                isDimmed: true,
                interval: scaleMatch.interval,
                role: 'other',
              });
            }
          } else if (scaleMatch) {
            stringCandidates.push({
              fret,
              fn,
              scaleMatch,
              isTargetTone: scaleMatch.role === 'root',
              isDimmed: false,
              interval: scaleMatch.interval,
              role: scaleMatch.role,
            });
          }
        }

        // Si estamos en sistema 3 a 2, aplicamos la distribución de 2 o 3 notas por cuerda
        let chosenCandidates = stringCandidates;
        if (stringDistribution) {
          const distIdx = (config.strings.length - 1) - sIdx;
          const targetCount = stringDistribution[distIdx % stringDistribution.length] || 2;

          if (stringCandidates.length > targetCount) {
            const scored = stringCandidates.map((cand) => {
              const priority = cand.isTargetTone ? 0 : 1;
              const distFromBase = Math.abs(cand.fret - (boxBaseFret + 1.5));
              return { cand, score: priority * 100 + distFromBase };
            });
            scored.sort((a, b) => a.score - b.score);
            chosenCandidates = scored
              .slice(0, targetCount)
              .map((s) => s.cand)
              .sort((a, b) => a.fret - b.fret);
          }
        }

        // Asignar digitaciones ergonómicas
        const frets = chosenCandidates.map((c) => c.fret);
        const fingerMap = assignFingersToString(
          frets,
          boxBaseFret,
          progressionSystem === '3nps' ? '3nps' : 'caged'
        );

        chosenCandidates.forEach((cand) => {
          const fa = fingerMap.get(cand.fret) || { finger: 0, isStretch: false };
          notes.push({
            stringIndex: sIdx,
            fret: cand.fret,
            note: cand.fn.note,
            interval: cand.interval,
            role: cand.role,
            isTargetTone: cand.isTargetTone,
            isDimmed: cand.isDimmed,
            finger: fa.finger > 0 ? String(fa.finger) : undefined,
            fingerAssignment: fa,
            midi: cand.fn.midi,
          });
        });
      });

      return notes;
    }

    return [];
  }, [
    isEditorActive,
    editingGrid,
    customDbPattern,
    studyMode,
    scaleViewMode,
    fullNeckScaleNotes,
    activeCagedChord,
    rootNote,
    scaleResult,
    config,
    activeProgression,
    currentProgressionStepIndex,
    improvMode,
    activeStepResourceId,
    progressionSystem,
    selectedThreeToTwoPattern,
    activeCagedBoxId,
  ]);

  // Rango de trastes enfocado
  const fretFocusRange: [number, number] | null = useMemo(() => {
    if (isEditorActive && studyMode === 'scales') {
      const frets: number[] = [];
      Object.values(editingGrid).forEach((list) => {
        list.forEach((n) => frets.push(n.fret));
      });
      if (frets.length > 0) {
        return [Math.min(...frets), Math.max(...frets)];
      }
      return scaleResult ? scaleResult.fretRange : [0, 12];
    }
    if (studyMode === 'chords') {
      return getCagedBoxFretRange(activeCagedBoxId, rootNote);
    }
    if (studyMode === 'progressions') {
      if (progressionSystem === 'three_to_two') {
        const resolved = resolveProgressionChords(activeProgression, rootNote);
        const currentStep = resolved[currentProgressionStepIndex] || resolved[0];
        const chordRoot = currentStep ? currentStep.rootNote : rootNote;
        const targetRootIdx = CHROMATIC_NOTES.indexOf(chordRoot as ChromaticNote);
        const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
        const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;
        const pat = getThreeToTwoPattern(selectedThreeToTwoPattern);
        let minF = pat.baseMinFret + shift;
        let maxF = pat.baseMaxFret + shift;
        if (maxF > config.totalFrets) {
          minF -= 12;
          maxF -= 12;
        } else if (minF < 0) {
          minF += 12;
          maxF += 12;
        }
        return [Math.max(0, minF), Math.min(config.totalFrets, maxF)];
      }
      if (progressionSystem === 'caged') {
        return getCagedBoxFretRange(activeCagedBoxId, rootNote);
      }
      return null;
    }
    if (studyMode === 'scales') {
      if (scaleViewMode === 'full_neck_map') {
        return scaleResult ? scaleResult.fretRange : [0, 24];
      }
      if (customDbPattern && customDbPattern.notesData.length > 0) {
        const targetRootIdx = CHROMATIC_NOTES.indexOf(rootNote as ChromaticNote);
        const baseRootIdx = CHROMATIC_NOTES.indexOf('C');
        const shift = targetRootIdx === -1 ? 0 : (targetRootIdx - baseRootIdx + 12) % 12;

        let minF = customDbPattern.minFret + shift;
        let maxF = customDbPattern.maxFret + shift;
        if (maxF > config.totalFrets) {
          minF -= 12;
          maxF -= 12;
        } else if (minF < 0) {
          minF += 12;
          maxF += 12;
        }
        return [minF, maxF];
      }
      return scaleResult ? scaleResult.fretRange : null;
    }
    return null;
  }, [
    isEditorActive,
    editingGrid,
    customDbPattern,
    studyMode,
    scaleViewMode,
    activeCagedBoxId,
    progressionSystem,
    selectedThreeToTwoPattern,
    threeToTwoLayout,
    scaleSystem,
    activeProgression,
    currentProgressionStepIndex,
    scaleResult,
    rootNote,
    config.totalFrets,
  ]);

  // Audio: Rasguear Acorde CAGED (de grave a agudo)
  const handlePlayCagedStrum = useCallback(() => {
    if (!activeCagedChord || activeCagedChord.notes.length === 0) return;
    const sorted = [...activeCagedChord.notes].sort((a, b) => b.stringIndex - a.stringIndex);
    const midis = sorted.map((n) => {
      const str = config.strings[n.stringIndex];
      return (str?.midi ?? 40) + n.fret;
    });
    getFretboardAudioEngine().playChord(midis, 'strum');
  }, [activeCagedChord, config]);

  // Audio: Arpegiar Acorde CAGED
  const handlePlayCagedArpeggio = useCallback(() => {
    if (!activeCagedChord || activeCagedChord.notes.length === 0) return;
    const sorted = [...activeCagedChord.notes].sort((a, b) => b.stringIndex - a.stringIndex);
    const midis = sorted.map((n) => {
      const str = config.strings[n.stringIndex];
      return (str?.midi ?? 40) + n.fret;
    });
    getFretboardAudioEngine().playChord(midis, 'arpeggio');
  }, [activeCagedChord, config]);

  // Modo Progresiones: Secuenciador con reproducción continua
  const progTimerRef = useRef<NodeJS.Timeout | null>(null);

  const advanceProgressionStep = useCallback(() => {
    const prog = activeProgression;

    setCurrentProgressionStepIndex((prev) => {
      const nextIdx = (prev + 1) % prog.steps.length;

      const resolved = resolveProgressionChords(prog, rootNote);
      const stepChord = resolved[nextIdx];
      if (stepChord) {
        const chordNotes = getChordNoteList(stepChord.rootNote, stepChord.chordKey);
        const rootMidi = 40 + CHROMATIC_NOTES.indexOf(stepChord.rootNote);
        const midis = chordNotes.map((cn) => rootMidi + cn.interval.semitones);
        getFretboardAudioEngine().playChord(midis, 'strum', 0.05);
      }

      return nextIdx;
    });
  }, [activeProgression, rootNote]);

  const prevProgressionStep = useCallback(() => {
    const prog = activeProgression;
    setCurrentProgressionStepIndex((prev) => (prev - 1 + prog.steps.length) % prog.steps.length);
  }, [activeProgression]);

  useEffect(() => {
    if (progressionPlaying && studyMode === 'progressions') {
      const barDurationMs = (60 / bpm) * 4 * 1000;
      progTimerRef.current = setInterval(() => {
        advanceProgressionStep();
      }, barDurationMs);
    } else {
      if (progTimerRef.current) {
        clearInterval(progTimerRef.current);
        progTimerRef.current = null;
      }
    }
    return () => {
      if (progTimerRef.current) {
        clearInterval(progTimerRef.current);
      }
    };
  }, [progressionPlaying, studyMode, bpm, advanceProgressionStep]);

  useEffect(() => {
    setCurrentProgressionStepIndex(0);
  }, [selectedProgressionId, rootNote]);

  // Presets Rápidos
  const applyPreset = (preset: {
    instrument: InstrumentType;
    mode: StudyMode;
    root: string;
    cagedBoxId?: number;
    cagedDegreeIndex?: number;
    scale?: ScaleKey;
    progression?: string;
  }) => {
    setInstrument(preset.instrument);
    setStudyMode(preset.mode);
    setRootNote(preset.root);
    if (preset.cagedBoxId) setActiveCagedBoxId(preset.cagedBoxId);
    if (preset.cagedDegreeIndex !== undefined) setActiveChordDegreeIndex(preset.cagedDegreeIndex);
    if (preset.scale) setScaleKey(preset.scale);
    if (preset.progression) setSelectedProgressionId(preset.progression);
  };

  return (
    // 1. Contenedor Raíz Blindado contra Desbordamiento Horizontal
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#e5e9f0] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 flex flex-col gap-2 min-w-0 flex-1">
        {/* 2. Cabecera Ultra-Compacta (Mobile-First) */}
        <div className="flex flex-col gap-1.5 p-2.5 sm:p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shadow-sm backdrop-blur-xl w-full min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>🎸 Diapasón & Armonía</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0891b2]/15 dark:bg-cyan-500/15 text-[#0891b2] dark:text-cyan-400 border border-[#0891b2]/30 dark:border-cyan-500/30 shrink-0 font-bold">
                24 Trastes
              </span>
            </div>

            {/* Presets Rápidos en Chips Horizontales */}
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() =>
                  applyPreset({
                    instrument: 'guitar_6',
                    mode: 'chords',
                    root: 'C',
                    cagedBoxId: 4,
                    cagedDegreeIndex: 3,
                  })
                }
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0891b2] dark:text-cyan-300 border border-slate-300 dark:border-slate-700 transition-colors shrink-0"
                title="Guitarra: IV - F (Forma E)"
              >
                🎸 IV - F (Forma E)
              </button>
              <button
                onClick={() =>
                  applyPreset({
                    instrument: 'guitar_6',
                    mode: 'scales',
                    root: 'A',
                    scale: 'dorian',
                  })
                }
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-fuchsia-700 dark:text-fuchsia-300 border border-slate-300 dark:border-slate-700 transition-colors shrink-0"
                title="Guitarra A Dórica"
              >
                🎸 A Dórica
              </button>
              <button
                onClick={() =>
                  applyPreset({
                    instrument: 'bass_4',
                    mode: 'progressions',
                    root: 'C',
                    progression: 'ii_v_i',
                  })
                }
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 transition-colors shrink-0 hidden xs:inline-block"
                title="Bajo 4C II-V-I"
              >
                🎶 II-V-I
              </button>
            </div>
          </div>

          <p className="hidden sm:block text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Laboratorio interactivo de acordes diatónicos CAGED, escalas modales e inversiones armónicas para{' '}
            <strong className="text-slate-900 dark:text-white">Guitarra (6C)</strong>,{' '}
            <strong className="text-[#0891b2] dark:text-cyan-400">Bajo (4C)</strong> y{' '}
            <strong className="text-fuchsia-600 dark:text-fuchsia-400">Bajo (5C con Low B)</strong>.
          </p>
        </div>

        {/* 3. Barra de Herramientas Compacta (Controles Arriba) */}
        <FretboardToolbar
          studyMode={studyMode}
          onStudyModeChange={setStudyMode}
          instrument={instrument}
          onInstrumentChange={setInstrument}
          rootNote={rootNote}
          onRootNoteChange={setRootNote}
          scaleKey={scaleKey}
          onScaleKeyChange={setScaleKey}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          selectedProgressionId={selectedProgressionId}
          onProgressionIdChange={setSelectedProgressionId}
          progressionPlaying={progressionPlaying}
          onToggleProgressionPlay={() => setProgressionPlaying((prev) => !prev)}
          onNextProgressionStep={advanceProgressionStep}
          onPrevProgressionStep={prevProgressionStep}
          onSelectProgressionStep={setCurrentProgressionStepIndex}
          currentProgressionStepIndex={currentProgressionStepIndex}
          bpm={bpm}
          onBpmChange={setBpm}
          progressionsList={allProgressions}
          onOpenCreateModal={() => setIsCreateProgModalOpen(true)}
          activeStepImprovResourceId={activeStepResourceId}
          onStepImprovResourceChange={handleStepImprovResourceChange}
        />

        {/* 3.0.1 Panel de Guía de Improvisación en Tiempo Real (Pestaña Progresiones) */}
        {studyMode === 'progressions' && (
          <ProgressionImprovPanel
            currentChord={currentImprovGuide}
            improvMode={improvMode}
            onImprovModeChange={setImprovMode}
            selectedResourceId={activeStepResourceId}
            onResourceIdChange={(resId) =>
              handleStepImprovResourceChange(currentProgressionStepIndex, resId)
            }
            progressionSystem={progressionSystem}
            onProgressionSystemChange={setProgressionSystem}
            selectedThreeToTwoPattern={selectedThreeToTwoPattern}
            onSelectThreeToTwoPattern={setSelectedThreeToTwoPattern}
          />
        )}

        {/* 3.0 Laboratorio de Armonía Diatónica CAGED (Pestaña Acordes) */}
        {studyMode === 'chords' && (
          <CagedHarmonicChordsView
            selectedKeyRoot={rootNote}
            onKeyRootChange={setRootNote}
            tonalityMode={tonalityMode}
            onTonalityModeChange={(mode) => {
              setTonalityMode(mode);
              setCustomChordNotes(null);
            }}
            activeCagedBoxId={activeCagedBoxId}
            onSelectCagedBoxId={setActiveCagedBoxId}
            activeChordDegreeIndex={activeChordDegreeIndex}
            onSelectChordDegreeIndex={(degIdx) => {
              setActiveChordDegreeIndex(degIdx);
              setCustomChordNotes(null);
            }}
            activeExtensionFamily={activeExtensionFamily}
            onSelectExtensionFamily={(fam) => {
              setActiveExtensionFamily(fam);
              setCustomChordNotes(null);
            }}
            onPlayStrum={handlePlayCagedStrum}
            onPlayArpeggio={handlePlayCagedArpeggio}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            instrumentType={instrument}
            isEditing={isChordEditorActive}
            onToggleEditing={handleToggleChordEditor}
            onSaveToDB={handleSaveChordToDb}
            onResetFactory={handleResetChordDb}
            isSaving={isSavingChordDb}
            isCustom={isCustomChordFromDb}
            activeVariationId={activeVariationId}
            onSelectVariation={(v) => {
              setActiveVariationId(v.id);
              setCustomChordNotes(null);
            }}
            activeChordOverride={activeCagedChord}
          />
        )}

        {/* 3.1 Controles Biomecánicos del Sistema Dual de Escalas (CAGED vs 3NPS) */}
        {studyMode === 'scales' && (
          <ScaleSystemControls
            system={scaleSystem}
            onSystemChange={(sys) => {
              setScaleSystem(sys);
              setActivePatternId(1);
            }}
            activePatternId={activePatternId}
            onSelectPatternId={setActivePatternId}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            scaleViewMode={scaleViewMode}
            onScaleViewModeChange={setScaleViewMode}
            threeToTwoLayout={threeToTwoLayout}
            onThreeToTwoLayoutChange={setThreeToTwoLayout}
          />
        )}

        {/* 3.2 Barra del Editor Visual de Patrones y Generador de Código TS/JSON (solo en vista por caja) */}
        {studyMode === 'scales' && scaleViewMode === 'single_box' && (
          <ScalePatternExportBar
            isEditorActive={isEditorActive}
            onToggleEditor={handleToggleEditor}
            patternName={
              scaleSystem === 'caged'
                ? `${rootNote} ${SCALES_CATALOG[scaleKey]?.name || ''} - Caja ${activePatternId} (${CAGED_BOXES.find((p) => p.id === activePatternId)?.shortLabel || ''})`
                : `${rootNote} ${SCALES_CATALOG[scaleKey]?.name || ''} - Patrón ${activePatternId} (${THREE_NPS_PATTERNS.find((p) => p.id === activePatternId)?.shortLabel || ''})`
            }
            minFret={editorMinFret}
            maxFret={editorMaxFret}
            stringsFrets={editingGrid}
            onClearGrid={handleClearEditorGrid}
            onResetGrid={handleResetEditorGrid}
            touchMode={editorTouchMode}
            onTouchModeChange={setEditorTouchMode}
            isCustomFromDb={isCustomFromDb}
            isSavingDb={isSavingDb}
            onSaveToDb={handleSaveToDb}
            onResetDb={handleResetDb}
          />
        )}

        {/* 4. El Diapasón como Protagonista Central (Visible Inmediatamente) */}
        <InteractiveFretboard
          instrument={instrument}
          activeNotes={activeNotes}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          fretFocusRange={fretFocusRange}
          viewMode={fretboardViewMode}
          onViewModeChange={setFretboardViewMode}
          studyMode={studyMode}
          isEditorActive={
            (isEditorActive && studyMode === 'scales' && scaleViewMode === 'single_box') ||
            (isChordEditorActive && studyMode === 'chords')
          }
          onFretClickInEditor={studyMode === 'chords' ? handleChordFretClick : handleFretClickInEditor}
          onToggleRootInEditor={studyMode === 'chords' ? handleChordToggleRoot : handleToggleRootInEditor}
          topBanner={
            studyMode === 'scales' && scaleViewMode === 'full_neck_map' ? (
              <PositionMapBrackets
                zones={positionZones}
                activeZoneId={activePatternId}
                onSelectZone={setActivePatternId}
                totalFrets={config.totalFrets}
              />
            ) : undefined
          }
          title={
            studyMode === 'chords'
              ? `${rootNote} ${TONALITY_MODE_LABELS[tonalityMode]} • ${activeCagedChord?.fullName || ''} (${CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId)?.shortLabel || ''})`
              : studyMode === 'scales'
              ? `${scaleViewMode === 'full_neck_map' ? '🌐 [MÁSTIL COMPLETO] ' : ''}${isEditorActive ? '🛠️ [MODO EDITOR ACTIVO] ' : isCustomFromDb ? '☁️ [PERSONALIZADO EN NUBE] ' : ''}${rootNote} ${SCALES_CATALOG[scaleKey]?.name || ''} • ${scaleSystem === 'caged' ? 'CAGED' : '3NPS'} (${(scaleSystem === 'caged' ? CAGED_BOXES : THREE_NPS_PATTERNS).find((p) => p.id === activePatternId)?.shortLabel || ''})`
              : currentImprovGuide ? `${currentImprovGuide.chordName} (${currentImprovGuide.degreeRoman}) • ${currentImprovGuide.primaryMode.name}` : `${rootNote} ${PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId)?.name || ''}`
          }
        />

        {/* 5. Información Teórica en Acordeón Colapsable Abajo */}
        <ChordTheoryAccordion
          studyMode={studyMode}
          instrument={instrument}
          rootNote={rootNote}
          scaleKey={scaleKey}
          selectedProgressionId={selectedProgressionId}
          currentProgressionStepIndex={currentProgressionStepIndex}
          cagedChord={activeCagedChord}
          cagedBoxName={CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId)?.name}
        />

        {/* Modal Creador de Progresiones con Grados Táctiles */}
        <CreateProgressionModal
          isOpen={isCreateProgModalOpen}
          onClose={() => setIsCreateProgModalOpen(false)}
          onCreated={(created) => {
            const def = convertCustomProgressionToDef(created);
            setCustomProgressions((prev) => [def, ...prev]);
            setSelectedProgressionId(def.id);
            setCurrentProgressionStepIndex(0);
          }}
        />
      </main>
    </div>
  );
}
