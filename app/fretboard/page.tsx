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
  resolveProgressionChords,
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
} from '@/lib/music-theory/cagedHarmonics';
import { CagedHarmonicChordsView } from '@/components/fretboard/CagedHarmonicChordsView';
import { PositionMapBrackets } from '@/components/fretboard/PositionMapBrackets';
import {
  ScaleSystemType,
  NoteDisplayMode,
  calculateScaleSystemNotes,
  calculateFullNeckScaleNotes,
  getScalePositionZones,
  CAGED_BOXES,
  THREE_NPS_PATTERNS,
} from '@/lib/music-theory/scaleSystems';
import { ScaleSystemControls } from '@/components/fretboard/ScaleSystemControls';
import { ScalePatternExportBar } from '@/components/fretboard/ScalePatternExportBar';
import {
  getCustomScalePatternAction,
  saveScalePatternAction,
  resetScalePatternAction,
  ScaleNotePayload,
} from '@/app/actions/scalePatternActions';

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

  // Estado Modo 1: Laboratorio de Armonía Diatónica CAGED (7 Acordes por Forma)
  const [activeCagedBoxId, setActiveCagedBoxId] = useState<number>(1);
  const [activeChordDegreeIndex, setActiveChordDegreeIndex] = useState<number>(0);

  // Estado Modo 2: Escalas y Sistema Dual (CAGED vs 3NPS)
  const [scaleKey, setScaleKey] = useState<ScaleKey>('major');
  const [scaleSystem, setScaleSystem] = useState<ScaleSystemType>('caged');
  const [activePatternId, setActivePatternId] = useState<number>(1);
  const [scaleViewMode, setScaleViewMode] = useState<'single_box' | 'full_neck_map'>('single_box');

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

  // Estado Modo 3: Progresiones
  const [selectedProgressionId, setSelectedProgressionId] = useState<string>('ii_v_i');
  const [progressionPlaying, setProgressionPlaying] = useState<boolean>(false);
  const [currentProgressionStepIndex, setCurrentProgressionStepIndex] = useState<number>(0);
  const [bpm, setBpm] = useState<number>(85);

  const config = INSTRUMENTS[instrument];

  // Voicings de los 7 Acordes Diatónicos en CAGED
  const cagedChords: CagedChordVoicing[] = useMemo(() => {
    if (studyMode !== 'chords') return [];
    return getCagedDiatonicChords(rootNote, activeCagedBoxId, instrument);
  }, [studyMode, rootNote, activeCagedBoxId, instrument]);

  // Si cambia la caja o tonalidad, asegurar índice de grado seguro
  useEffect(() => {
    if (activeChordDegreeIndex >= 7) {
      setActiveChordDegreeIndex(0);
    }
  }, [activeChordDegreeIndex]);

  const activeCagedChord: CagedChordVoicing | undefined =
    cagedChords[activeChordDegreeIndex] || cagedChords[0];

  // Cálculo Teórico y Biomecánico del Sistema Dual de Escalas
  const scaleResult = useMemo(() => {
    if (studyMode !== 'scales') return null;
    return calculateScaleSystemNotes(
      instrument,
      rootNote,
      scaleKey,
      scaleSystem,
      activePatternId
    );
  }, [studyMode, instrument, rootNote, scaleKey, scaleSystem, activePatternId]);

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

  // Si se cambia de modo (ej. a acordes o progresiones), desactivar el editor
  useEffect(() => {
    if (studyMode !== 'scales' && isEditorActive) {
      setIsEditorActive(false);
    }
  }, [studyMode, isEditorActive]);

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
        else if (cn.intervalLabel === '5' || cn.intervalLabel === 'b5') role = 'fifth';
        else if (cn.intervalLabel === '7' || cn.intervalLabel === 'b7') role = 'seventh';

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
    // MODO 3: PROGRESIONES ARMÓNICAS
    // -------------------------------------------------------------
    if (studyMode === 'progressions') {
      const prog =
        PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
      const resolved = resolveProgressionChords(prog, rootNote);
      const currentStep = resolved[currentProgressionStepIndex] || resolved[0];

      const chordNotes = getChordNoteList(currentStep.rootNote, currentStep.chordKey);
      const chordNoteMap = new Map<string, { interval: string; role: any }>();
      chordNotes.forEach((cn) => {
        chordNoteMap.set(cn.note, {
          interval: cn.interval.label,
          role: cn.interval.role,
        });
      });

      const notes: ActiveFretNote[] = [];

      config.strings.forEach((str, sIdx) => {
        for (let fret = 0; fret <= config.totalFrets; fret++) {
          const fn = getFretNote(str.midi, fret);
          const found = chordNoteMap.get(fn.note);
          if (found) {
            notes.push({
              stringIndex: sIdx,
              fret,
              note: fn.note,
              interval: found.interval,
              role: found.role,
              fingerAssignment: { finger: 0, isStretch: false },
              midi: fn.midi,
            });
          }
        }
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
    selectedProgressionId,
    currentProgressionStepIndex,
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
    const prog =
      PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];

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
  }, [selectedProgressionId, rootNote]);

  const prevProgressionStep = useCallback(() => {
    const prog =
      PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId) || PROGRESSIONS_CATALOG[0];
    setCurrentProgressionStepIndex((prev) => (prev - 1 + prog.steps.length) % prog.steps.length);
  }, [selectedProgressionId]);

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
          currentProgressionStepIndex={currentProgressionStepIndex}
          bpm={bpm}
          onBpmChange={setBpm}
        />

        {/* 3.0 Laboratorio de Armonía Diatónica CAGED (Pestaña Acordes) */}
        {studyMode === 'chords' && (
          <CagedHarmonicChordsView
            selectedKeyRoot={rootNote}
            onKeyRootChange={setRootNote}
            activeCagedBoxId={activeCagedBoxId}
            onSelectCagedBoxId={setActiveCagedBoxId}
            activeChordDegreeIndex={activeChordDegreeIndex}
            onSelectChordDegreeIndex={setActiveChordDegreeIndex}
            onPlayStrum={handlePlayCagedStrum}
            onPlayArpeggio={handlePlayCagedArpeggio}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            instrumentType={instrument}
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
          fretFocusRange={fretFocusRange}
          viewMode={fretboardViewMode}
          onViewModeChange={setFretboardViewMode}
          isEditorActive={isEditorActive && studyMode === 'scales' && scaleViewMode === 'single_box'}
          onFretClickInEditor={handleFretClickInEditor}
          onToggleRootInEditor={handleToggleRootInEditor}
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
              ? `${rootNote} Mayor • ${activeCagedChord?.fullName || ''} (${CAGED_BOX_DEFINITIONS.find((b) => b.id === activeCagedBoxId)?.shortLabel || ''})`
              : studyMode === 'scales'
              ? `${scaleViewMode === 'full_neck_map' ? '🌐 [MÁSTIL COMPLETO] ' : ''}${isEditorActive ? '🛠️ [MODO EDITOR ACTIVO] ' : isCustomFromDb ? '☁️ [PERSONALIZADO EN NUBE] ' : ''}${rootNote} ${SCALES_CATALOG[scaleKey]?.name || ''} • ${scaleSystem === 'caged' ? 'CAGED' : '3NPS'} (${(scaleSystem === 'caged' ? CAGED_BOXES : THREE_NPS_PATTERNS).find((p) => p.id === activePatternId)?.shortLabel || ''})`
              : `${rootNote} ${PROGRESSIONS_CATALOG.find((p) => p.id === selectedProgressionId)?.name || ''}`
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
      </main>
    </div>
  );
}
