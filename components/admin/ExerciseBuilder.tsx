'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DrumVoice, StickingType } from '@/types/drum';
import { StringTechnique } from '@/types/strings';
import { getAudioEngine } from '@/lib/drumAudioEngine';
import { getStringsAudioEngine } from '@/lib/stringsAudioEngine';
import { saveExerciseAction } from '@/app/actions/save-exercise';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Save, 
  Plus, 
  Copy, 
  Trash2, 
  ArrowLeft, 
  Drum, 
  Music, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { getStepRhythmLabel } from './TablatureRuler';
import { AVAILABLE_FRETS } from './NoteSelectorModal';

export { getStepRhythmLabel, AVAILABLE_FRETS };


type InstrumentCategory = 'drums' | 'bass' | 'guitar';

interface EditorNote {
  step: number;        // Global step index: measureIndex * stepsPerMeasure + stepInMeasure
  string?: number;     // 1 to 4/6 (para cuerdas)
  fret?: number;       // 0 to 24 (para cuerdas)
  technique?: StringTechnique | 'pm';
  finger?: string;     // '1', '2', '3', '4', 'T'
  drumVoice?: DrumVoice; // Para batería
  accent?: boolean;
  sticking?: StickingType;
}

const DRUM_CATEGORIES = ['Rudimentos', 'Grooves', 'Independencia', 'Acentos & Síncopas'];
const STRINGS_CATEGORIES = ['Slap & Pop', 'Walking Bass', 'Escalas & Arpegios', 'Licks & Riffs', 'Fingerpicking'];

const BASS_STRINGS = [
  { num: 1, label: 'G', name: '1ª Cuerda (Sol)' },
  { num: 2, label: 'D', name: '2ª Cuerda (Re)' },
  { num: 3, label: 'A', name: '3ª Cuerda (La)' },
  { num: 4, label: 'E', name: '4ª Cuerda (Mi)' },
];

const GUITAR_STRINGS = [
  { num: 1, label: 'e', name: '1ª Cuerda (Mi agudo)' },
  { num: 2, label: 'B', name: '2ª Cuerda (Si)' },
  { num: 3, label: 'G', name: '3ª Cuerda (Sol)' },
  { num: 4, label: 'D', name: '4ª Cuerda (Re)' },
  { num: 5, label: 'A', name: '5ª Cuerda (La)' },
  { num: 6, label: 'E', name: '6ª Cuerda (Mi grave)' },
];

const DRUM_ROWS: { voice: DrumVoice; label: string; sub: string }[] = [
  { voice: 'crash', label: 'Crash / Ride', sub: 'Platillos acento' },
  { voice: 'hihat', label: 'Hi-Hat', sub: 'Platillo rítmico' },
  { voice: 'tom1', label: 'High Tom', sub: 'Tom 1 agudo' },
  { voice: 'snare', label: 'Caja (Snare)', sub: 'Backbeat / ghost' },
  { voice: 'floor_tom', label: 'Floor Tom', sub: 'Tom base grave' },
  { voice: 'kick', label: 'Bombo (Kick)', sub: 'Pulso de pedal' },
];

export const ExerciseBuilder: React.FC = () => {
  // Configuración Principal del Ejercicio
  const [instrument, setInstrument] = useState<InstrumentCategory>('bass');
  const [title, setTitle] = useState('Nuevo Ejercicio Multicompás');
  const [category, setCategory] = useState('Slap & Pop');
  const [difficulty, setDifficulty] = useState<'Básico' | 'Intermedio' | 'Avanzado'>('Intermedio');
  const [bpm, setBpm] = useState(95);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '6/8' | '7/8'>('4/4');
  const [subdivision, setSubdivision] = useState<'1/16' | '1/8' | '1/4' | '1/8T'>('1/16');

  // Gestión de Compases (1 a 8 compases)
  const [totalMeasures, setTotalMeasures] = useState<number>(2);
  const [currentMeasure, setCurrentMeasure] = useState<number>(0);

  // Paleta de Articulación y Técnicas seleccionadas para nuevas notas
  const [selectedTechnique, setSelectedTechnique] = useState<StringTechnique | 'pm'>('normal');
  const [selectedFinger, setSelectedFinger] = useState<string>('1');
  const [selectedFret, setSelectedFret] = useState<number>(0);
  const [selectedDrumVoice, setSelectedDrumVoice] = useState<DrumVoice>('snare');
  const [selectedSticking, setSelectedSticking] = useState<StickingType>('R');
  const [selectedAccent, setSelectedAccent] = useState<boolean>(false);

  // Notas almacenadas del ejercicio
  const [notes, setNotes] = useState<EditorNote[]>([
    // Preset inicial de ejemplo en bajo
    { step: 0, string: 4, fret: 0, technique: 'slap', finger: 'T' },
    { step: 2, string: 2, fret: 2, technique: 'pop', finger: '1' },
    { step: 4, string: 4, fret: 0, technique: 'slap', finger: 'T' },
    { step: 6, string: 4, fret: 3, technique: 'slap', finger: '1' },
    { step: 8, string: 2, fret: 5, technique: 'pop', finger: '3' },
  ]);

  // Estado de Celda Activa / Modal de Edición Rápida de Traste
  const [activeCell, setActiveCell] = useState<{ step: number; string?: number; voice?: DrumVoice } | null>(null);

  // Estado del Motor de Audio & Previsualización
  const [isPlaying, setIsPlaying] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [playbackActiveStep, setPlaybackActiveStep] = useState(0);

  // Estado de Persistencia
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  // Pasos por compás según compás y subdivisión
  const stepsPerMeasure = useMemo(() => {
    if (timeSignature === '6/8') {
      return subdivision === '1/8' ? 6 : 12;
    }
    if (timeSignature === '7/8') {
      return subdivision === '1/8' ? 7 : 14;
    }
    // 4/4
    switch (subdivision) {
      case '1/4':
        return 4;
      case '1/8':
        return 8;
      case '1/8T':
        return 12;
      case '1/16':
      default:
        return 16;
    }
  }, [timeSignature, subdivision]);

  const totalSteps = totalMeasures * stepsPerMeasure;

  // Cambiar categorías automáticamente al alternar instrumento
  useEffect(() => {
    if (instrument === 'drums') {
      if (!DRUM_CATEGORIES.includes(category)) setCategory(DRUM_CATEGORIES[0]);
    } else {
      if (!STRINGS_CATEGORIES.includes(category)) setCategory(STRINGS_CATEGORIES[0]);
    }
  }, [instrument, category]);

  // ============================================================================
  // GESTIÓN DE COMPASES
  // ============================================================================
  const handleAddMeasure = () => {
    if (totalMeasures < 8) {
      setTotalMeasures((prev) => prev + 1);
      setCurrentMeasure(totalMeasures); // Ir al nuevo compás
    }
  };

  const handleDuplicateMeasure = () => {
    if (totalMeasures >= 8) return;

    const sourceStart = currentMeasure * stepsPerMeasure;
    const sourceEnd = sourceStart + stepsPerMeasure;
    const currentNotes = notes.filter((n) => n.step >= sourceStart && n.step < sourceEnd);

    const newMeasureIdx = totalMeasures;
    const targetStart = newMeasureIdx * stepsPerMeasure;

    const duplicatedNotes: EditorNote[] = currentNotes.map((n) => ({
      ...n,
      step: targetStart + (n.step - sourceStart),
    }));

    setTotalMeasures((prev) => prev + 1);
    setNotes((prev) => [...prev, ...duplicatedNotes]);
    setCurrentMeasure(newMeasureIdx);
  };

  const handleDeleteMeasure = (measureIdxToDelete: number) => {
    if (totalMeasures <= 1) return;

    const startStep = measureIdxToDelete * stepsPerMeasure;
    const endStep = startStep + stepsPerMeasure;

    // Eliminar notas del compás y desplazar hacia atrás las notas posteriores
    const updatedNotes = notes
      .filter((n) => n.step < startStep || n.step >= endStep)
      .map((n) => {
        if (n.step >= endStep) {
          return { ...n, step: n.step - stepsPerMeasure };
        }
        return n;
      });

    setNotes(updatedNotes);
    setTotalMeasures((prev) => prev - 1);
    if (currentMeasure >= totalMeasures - 1) {
      setCurrentMeasure(Math.max(0, totalMeasures - 2));
    }
  };

  // ============================================================================
  // MANIPULACIÓN DE NOTAS EN LA REJILLA
  // ============================================================================
  const handleCellClick = (stepInMeasure: number, stringNum?: number, drumVoice?: DrumVoice) => {
    const globalStep = currentMeasure * stepsPerMeasure + stepInMeasure;

    if (instrument === 'drums') {
      // Toggle drum note
      const existingIdx = notes.findIndex((n) => n.step === globalStep && n.drumVoice === drumVoice);
      if (existingIdx >= 0) {
        // Eliminar nota existente
        setNotes((prev) => prev.filter((_, idx) => idx !== existingIdx));
      } else {
        // Agregar nota de batería
        const newNote: EditorNote = {
          step: globalStep,
          drumVoice,
          accent: selectedAccent,
          sticking: selectedSticking,
        };
        setNotes((prev) => [...prev, newNote]);
        // Sonido de prueba inmediato
        const engine = getAudioEngine();
        engine.init();
        engine.trigger(drumVoice!, undefined, 0.85, selectedAccent);
      }
    } else {
      // Para cuerdas:
      const existingIdx = notes.findIndex((n) => n.step === globalStep && n.string === stringNum);
      if (existingIdx >= 0) {
        // Si ya existe nota, abrir selector o remover si es el mismo traste
        setActiveCell({ step: globalStep, string: stringNum });
      } else {
        // Agregar nota con el traste y técnica activos
        const newNote: EditorNote = {
          step: globalStep,
          string: stringNum,
          fret: selectedFret,
          technique: selectedTechnique,
          finger: selectedFinger,
        };
        setNotes((prev) => [...prev, newNote]);
        setActiveCell({ step: globalStep, string: stringNum });

        // Sonido de prueba inmediato
        const engine = getStringsAudioEngine();
        engine.init();
        engine.triggerNote(
          instrument === 'bass' ? 'bass_4' : 'guitar_6',
          stringNum!,
          selectedFret,
          undefined,
          selectedTechnique === 'pm' ? 'normal' : selectedTechnique,
          0.85
        );
      }
    }
  };

  const handleUpdateFret = (globalStep: number, stringNum: number, fret: number) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => !(n.step === globalStep && n.string === stringNum));
      if (fret < 0) return filtered; // -1 significa borrar
      return [
        ...filtered,
        {
          step: globalStep,
          string: stringNum,
          fret,
          technique: selectedTechnique,
          finger: selectedFinger,
        },
      ];
    });

    if (fret >= 0) {
      const engine = getStringsAudioEngine();
      engine.init();
      engine.triggerNote(
        instrument === 'bass' ? 'bass_4' : 'guitar_6',
        stringNum,
        fret,
        undefined,
        selectedTechnique === 'pm' ? 'normal' : selectedTechnique,
        0.85
      );
    }
  };

  const handleSelectFret = (fretNum: number) => {
    if (activeCell && activeCell.string !== undefined) {
      handleUpdateFret(activeCell.step, activeCell.string, fretNum);
    }
    setSelectedFret(fretNum);
  };

  const handleFretInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Permitir borrar todo para escribir limpio
    if (raw === '') {
      setSelectedFret(0);
      return;
    }

    // Remover cualquier carácter no numérico y quitar ceros a la izquierda
    const sanitized = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (sanitized === '') {
      setSelectedFret(0);
      return;
    }

    const parsed = parseInt(sanitized, 10);

    if (!isNaN(parsed) && parsed >= 0 && parsed <= 24) {
      setSelectedFret(parsed);
    }
  };

  const handleFretInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Auto-seleccionar todo el texto al hacer clic para que al teclear reemplace directamente
    e.target.select();
  };


  const handleClearNote = (globalStep: number, stringNum?: number, drumVoice?: DrumVoice) => {
    setNotes((prev) =>
      prev.filter((n) => {
        if (instrument === 'drums') {
          return !(n.step === globalStep && n.drumVoice === drumVoice);
        }
        return !(n.step === globalStep && n.string === stringNum);
      })
    );
    setActiveCell(null);
  };

  // ============================================================================
  // PREVISUALIZACIÓN DE AUDIO & RUNWAY EN TIEMPO REAL
  // ============================================================================
  const isPlayingRef = useRef(false);
  const nextNoteTimeRef = useRef(0);
  const playStepRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const getStepDuration = useCallback(() => {
    if (timeSignature === '6/8') {
      return (60 / bpmRef.current) / 2;
    }
    return (60 / bpmRef.current) / 4;
  }, [timeSignature]);

  const scheduleStep = useCallback(
    (stepNumber: number, time: number) => {
      if (instrument === 'drums') {
        const engine = getAudioEngine();
        const hits = notes.filter((n) => n.step === stepNumber && n.drumVoice);
        hits.forEach((h) => {
          engine.trigger(h.drumVoice!, time, 0.85, !!h.accent);
        });
        if (stepNumber % 4 === 0) {
          engine.playMetronome(time, stepNumber === 0);
        }
      } else {
        const engine = getStringsAudioEngine();
        const stringNotes = notes.filter((n) => n.step === stepNumber && n.string !== undefined && n.fret !== undefined);
        stringNotes.forEach((n) => {
          engine.triggerNote(
            instrument === 'bass' ? 'bass_4' : 'guitar_6',
            n.string!,
            n.fret!,
            time,
            n.technique === 'pm' ? 'normal' : n.technique || 'normal',
            0.85
          );
        });
        if (stepNumber % 4 === 0) {
          engine.playMetronome(time, stepNumber === 0);
        }
      }
    },
    [instrument, notes]
  );

  const schedulerLoop = useCallback(() => {
    const audioCtx =
      instrument === 'drums'
        ? getAudioEngine().getAudioContext()
        : getStringsAudioEngine().getAudioContext();

    if (!audioCtx) return;

    while (nextNoteTimeRef.current < audioCtx.currentTime + 0.12) {
      scheduleStep(playStepRef.current, nextNoteTimeRef.current);

      nextNoteTimeRef.current += getStepDuration();
      playStepRef.current += 1;
      if (playStepRef.current >= totalSteps) {
        playStepRef.current = 0;
      }
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(schedulerLoop, 25);
    }
  }, [getStepDuration, instrument, scheduleStep, totalSteps]);

  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;
    setPlaybackActiveStep(playStepRef.current);

    // Si el paso de reproducción está en otro compás, alternar visualmente el compás actual
    const currentPlayingMeasure = Math.floor(playStepRef.current / stepsPerMeasure);
    if (currentPlayingMeasure !== currentMeasure && currentPlayingMeasure < totalMeasures) {
      setCurrentMeasure(currentPlayingMeasure);
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [currentMeasure, stepsPerMeasure, totalMeasures]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;

      const engine = instrument === 'drums' ? getAudioEngine() : getStringsAudioEngine();
      engine.init();
      engine.resume();
      const ctx = engine.getAudioContext();
      const startTime = (ctx ? ctx.currentTime : 0) + 0.05;

      nextNoteTimeRef.current = startTime;
      playStepRef.current = currentMeasure * stepsPerMeasure;

      schedulerLoop();
      rafIdRef.current = requestAnimationFrame(updateVisualProgress);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    playStepRef.current = 0;
    setPlaybackActiveStep(0);
  };

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ============================================================================
  // GUARDAR EJERCICIO VÍA SERVER ACTION
  // ============================================================================
  const handlePublish = async () => {
    setIsSaving(true);
    setSaveResult(null);

    // Formatear datos para la base de datos
    let formattedData: any[] = [];
    if (instrument === 'drums') {
      formattedData = notes
        .filter((n) => n.drumVoice)
        .map((n) => ({
          step: n.step,
          instrument: n.drumVoice,
          accent: n.accent ?? false,
          sticking: n.sticking ?? 'R',
          velocity: n.accent ? 1.0 : 0.8,
        }));
    } else {
      formattedData = notes
        .filter((n) => n.string !== undefined && n.fret !== undefined)
        .map((n) => ({
          step: n.step,
          string: n.string,
          fret: n.fret,
          technique: n.technique ?? 'normal',
          finger: n.finger ?? '1',
          velocity: 0.85,
        }));
    }

    try {
      const res = await saveExerciseAction({
        instrumentType: instrument,
        title,
        category,
        difficulty,
        bpm,
        timeSignature,
        totalMeasures,
        stepsPerMeasure,
        data: formattedData,
      });

      setSaveResult(res);
    } catch (e: any) {
      setSaveResult({ success: false, error: e?.message || 'Error inesperado' });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================
  const activeMeasureStart = currentMeasure * stepsPerMeasure;

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto py-8 px-4 sm:px-6 select-none">
      {/* 1. Header Superior & Selector de Instrumento */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Volver al inicio"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Studio Builder
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {totalMeasures} {totalMeasures === 1 ? 'Compás' : 'Compases'} ({totalSteps} Pasos)
              </span>
            </div>

            {/* Título editable in-line */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-xl sm:text-2xl font-extrabold text-white tracking-tight border-b border-transparent hover:border-white/20 focus:border-cyan-400 focus:outline-none transition-colors w-full sm:w-[380px]"
              placeholder="Nombre del Ejercicio..."
            />
          </div>
        </div>

        {/* Selector de Instrumento */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center p-1 rounded-xl bg-zinc-900/80 border border-white/5">
            <button
              onClick={() => {
                setInstrument('drums');
                handleStop();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                instrument === 'drums'
                  ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Drum className="w-3.5 h-3.5" />
              <span>Batería</span>
            </button>

            <button
              onClick={() => {
                setInstrument('bass');
                handleStop();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                instrument === 'bass'
                  ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Bajo (4C)</span>
            </button>

            <button
              onClick={() => {
                setInstrument('guitar');
                handleStop();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                instrument === 'guitar'
                  ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guitarra (6C)</span>
            </button>
          </div>

          {/* Botón Publicar Ejercicio */}
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 font-bold text-xs hover:from-cyan-400 hover:to-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Publicar Ejercicio</span>
          </button>
        </div>
      </div>

      {/* Alerta de Resultado de Guardado */}
      <AnimatePresence>
        {saveResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              saveResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3 text-xs">
              {saveResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              <span>
                {saveResult.success
                  ? '¡Ejercicio publicado con éxito en la base de datos!'
                  : `Error: ${saveResult.error}`}
              </span>
            </div>

            {saveResult.url && (
              <Link
                href={saveResult.url}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-colors"
              >
                <span>Ver en Práctica</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Barra de Metadatos y Configuración Musical */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 rounded-2xl glass-panel border border-white/5 text-xs">
        {/* Métrica / Time Signature */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Métrica</label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value as any)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
          >
            <option value="4/4">4/4 (Cuaternario)</option>
            <option value="6/8">6/8 (Compuesto)</option>
            <option value="7/8">7/8 (Amorfo/Progresivo)</option>
          </select>
        </div>

        {/* Subdivisión */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Subdivisión</label>
          <select
            value={subdivision}
            onChange={(e) => setSubdivision(e.target.value as any)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
          >
            <option value="1/16">1/16 (Semicorcheas - 16p)</option>
            <option value="1/8">1/8 (Corcheas - 8p)</option>
            <option value="1/4">1/4 (Negras - 4p)</option>
            <option value="1/8T">1/8T (Tresillos - 12p)</option>
          </select>
        </div>

        {/* BPM */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-zinc-400 uppercase font-semibold">Tempo</label>
            <span className="text-cyan-400 font-mono font-bold">{bpm} BPM</span>
          </div>
          <input
            type="range"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Dificultad */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Dificultad</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:border-cyan-400 focus:outline-none"
          >
            {(instrument === 'drums' ? DRUM_CATEGORIES : STRINGS_CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Previsualización de Audio Rápida */}
        <div className="flex flex-col justify-end">
          <button
            onClick={handleTogglePlay}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar Loop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                <span>Probar Audio / Loop</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Gestor de Compases (Barra de Pestañas de Compás) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {Array.from({ length: totalMeasures }).map((_, mIdx) => {
            const isActive = currentMeasure === mIdx;
            const measureStart = mIdx * stepsPerMeasure;
            const measureEnd = measureStart + stepsPerMeasure;
            const notesInMeasure = notes.filter((n) => n.step >= measureStart && n.step < measureEnd).length;

            return (
              <button
                key={`measure-tab-${mIdx}`}
                onClick={() => setCurrentMeasure(mIdx)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>Compás {mIdx + 1}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-zinc-950/20 text-zinc-950' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {notesInMeasure} notas
                </span>
              </button>
            );
          })}
        </div>

        {/* Botones de gestión de compás */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddMeasure}
            disabled={totalMeasures >= 8}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold disabled:opacity-40 transition-colors"
            title="Añadir nuevo compás vacío"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Compás</span>
          </button>

          <button
            onClick={handleDuplicateMeasure}
            disabled={totalMeasures >= 8}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold disabled:opacity-40 transition-colors"
            title="Duplicar notas del compás actual en uno nuevo"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Duplicar Compás</span>
          </button>

          {totalMeasures > 1 && (
            <button
              onClick={() => handleDeleteMeasure(currentMeasure)}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-colors"
              title="Eliminar compás actual"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Paleta de Articulaciones y Técnicas */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-white/5 text-xs">
        {instrument === 'drums' ? (
          // Controles de Articulación para Batería
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Articulación:</span>

            {/* Acento */}
            <button
              onClick={() => setSelectedAccent(!selectedAccent)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                selectedAccent
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="text-sm font-black">&gt;</span>
              <span>Acento</span>
            </button>

            {/* Sticking R / L */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-zinc-900 border border-white/10 font-mono">
              <button
                onClick={() => setSelectedSticking('R')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                  selectedSticking === 'R'
                    ? 'bg-cyan-500 text-zinc-950 font-black'
                    : 'text-cyan-400 hover:bg-white/5'
                }`}
              >
                R (Der)
              </button>
              <button
                onClick={() => setSelectedSticking('L')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                  selectedSticking === 'L'
                    ? 'bg-fuchsia-500 text-zinc-950 font-black'
                    : 'text-fuchsia-400 hover:bg-white/5'
                }`}
              >
                L (Izq)
              </button>
            </div>
          </div>
        ) : (
          // Controles de Técnicas para Bajo y Guitarra
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mr-1">Técnica Activa:</span>

            {[
              { id: 'normal', label: 'Normal', badge: '•' },
              { id: 'slap', label: 'Slap', badge: 'S' },
              { id: 'pop', label: 'Pop', badge: 'P' },
              { id: 'ghost', label: 'Ghost', badge: 'X' },
              { id: 'hammer', label: 'Hammer', badge: 'H' },
              { id: 'pull', label: 'Pull-off', badge: 'P' },
              { id: 'slide', label: 'Slide', badge: '/' },
              { id: 'vibrato', label: 'Vibrato', badge: '~' },
            ].map((tech) => {
              const isSelected = selectedTechnique === tech.id;
              return (
                <button
                  key={tech.id}
                  onClick={() => setSelectedTechnique(tech.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold opacity-80">{tech.badge}</span>
                  <span>{tech.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Selector de Dedo */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Dedo:</span>
              {['1', '2', '3', '4', 'T'].map((f) => (
                <button
                  key={`finger-${f}`}
                  onClick={() => setSelectedFinger(f)}
                  className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold ${
                    selectedFinger === f
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Traste Rápido por defecto con sanitización */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800 ml-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Traste:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={selectedFret.toString()}
                onChange={handleFretInputChange}
                onFocus={handleFretInputFocus}
                className="w-10 text-center text-xs font-mono font-bold bg-slate-800 text-cyan-300 rounded-lg py-0.5 border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Rejilla Interactiva de Tablatura / Pentagrama */}
      <div className="w-full overflow-x-auto rounded-2xl glass-panel p-4 sm:p-6 border border-white/10 shadow-2xl relative">
        <div className="min-w-[760px] flex flex-col">
          {/* Cabecera de Pasos / Tiempos */}
          <div className="flex items-center border-b border-white/10 pb-2 mb-2 font-mono text-xs">
            <div className="w-24 shrink-0 text-[11px] text-zinc-400 font-bold uppercase">
              Compás {currentMeasure + 1}
            </div>

            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${stepsPerMeasure}, minmax(0, 1fr))` }}>
              {Array.from({ length: stepsPerMeasure }).map((_, stepIdx) => {
                const globalStep = activeMeasureStart + stepIdx;
                const isPlayback = isPlaying && playbackActiveStep === globalStep;
                const { label, isBeat } = getStepRhythmLabel(stepIdx, stepsPerMeasure);

                return (
                  <div
                    key={`step-head-${stepIdx}`}
                    className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                      isPlayback ? 'scale-110' : ''
                    }`}
                  >
                    <span
                      className={`text-xs font-mono font-bold transition-colors ${
                        isPlayback
                          ? 'text-cyan-300 font-black'
                          : isBeat
                          ? 'text-cyan-400 text-sm font-black'
                          : 'text-slate-400 dark:text-slate-500 font-semibold text-[11px]'
                      }`}
                    >
                      {label}
                    </span>
                    {/* Punto indicador de pulso a tierra */}
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 transition-colors ${
                        isPlayback
                          ? 'bg-cyan-300 ring-2 ring-cyan-300/50'
                          : isBeat
                          ? 'bg-cyan-400 ring-2 ring-cyan-400/30'
                          : 'bg-transparent'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filas de la Rejilla según el Instrumento */}
          {instrument === 'drums' ? (
            // Filas de Batería
            DRUM_ROWS.map((row) => (
              <div key={row.voice} className="flex items-center h-12 relative border-b border-white/5 group">
                <div className="w-24 shrink-0 flex flex-col pr-2">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {row.label}
                  </span>
                  <span className="text-[9px] text-zinc-400 truncate">{row.sub}</span>
                </div>

                {/* Línea horizontal continua de pentagrama */}
                <div className="absolute left-24 right-0 top-1/2 -translate-y-1/2 h-px bg-white/15 pointer-events-none" />

                {/* Celdas de paso */}
                <div className="flex-1 grid h-full relative z-10" style={{ gridTemplateColumns: `repeat(${stepsPerMeasure}, minmax(0, 1fr))` }}>
                  {Array.from({ length: stepsPerMeasure }).map((_, stepIdx) => {
                    const globalStep = activeMeasureStart + stepIdx;
                    const isPlayback = isPlaying && playbackActiveStep === globalStep;
                    const hit = notes.find((n) => n.step === globalStep && n.drumVoice === row.voice);

                    return (
                      <button
                        key={`drum-cell-${row.voice}-${stepIdx}`}
                        onClick={() => handleCellClick(stepIdx, undefined, row.voice)}
                        className={`h-full flex items-center justify-center transition-all relative ${
                          isPlayback ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        {hit ? (
                          <div className="relative flex flex-col items-center">
                            {hit.accent && (
                              <span className="absolute -top-3 text-[11px] font-black text-cyan-400">&gt;</span>
                            )}
                            <div className="w-6 h-6 rounded-full bg-cyan-400 text-zinc-950 font-bold flex items-center justify-center text-xs shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                              {hit.sticking || '•'}
                            </div>
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            // Filas de Bajo o Guitarra
            (instrument === 'bass' ? BASS_STRINGS : GUITAR_STRINGS).map((str) => (
              <div key={str.num} className="flex items-center h-12 relative border-b border-white/5 group">
                <div className="w-24 shrink-0 flex items-center gap-2 pr-2">
                  <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center">
                    {str.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate">{str.num}ª Cuerda</span>
                </div>

                {/* Línea de la cuerda */}
                <div className="absolute left-24 right-0 top-1/2 -translate-y-1/2 h-px bg-white/25 pointer-events-none" />

                {/* Celdas de paso */}
                <div className="flex-1 grid h-full relative z-10" style={{ gridTemplateColumns: `repeat(${stepsPerMeasure}, minmax(0, 1fr))` }}>
                  {Array.from({ length: stepsPerMeasure }).map((_, stepIdx) => {
                    const globalStep = activeMeasureStart + stepIdx;
                    const isPlayback = isPlaying && playbackActiveStep === globalStep;
                    const note = notes.find((n) => n.step === globalStep && n.string === str.num);

                    return (
                      <button
                        key={`string-cell-${str.num}-${stepIdx}`}
                        onClick={() => handleCellClick(stepIdx, str.num)}
                        className={`h-full flex items-center justify-center transition-all relative ${
                          isPlayback ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        {note ? (
                          <div className="relative flex flex-col items-center">
                            {/* Insignia de técnica */}
                            {note.technique && note.technique !== 'normal' && (
                              <span className="absolute -top-3.5 text-[9px] font-mono font-black text-fuchsia-400 bg-fuchsia-500/20 px-1 rounded">
                                {note.technique[0].toUpperCase()}
                              </span>
                            )}

                            {/* Píldora de traste enmascarando la línea */}
                            <div className="w-6 h-6 rounded-md bg-zinc-950 border border-cyan-400/80 text-cyan-300 font-bold font-mono text-xs flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                              {note.fret}
                            </div>

                            {/* Dedo sugerido */}
                            {note.finger && (
                              <span className="absolute -bottom-3 text-[8px] font-mono text-zinc-400">
                                {note.finger}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Panel Flotante / Diálogo de Edición Rápida de Traste */}
      {activeCell && activeCell.string !== undefined && (
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 overflow-hidden flex-1 min-w-0">
            <span className="text-xs text-zinc-400 font-medium shrink-0">
              Nota en Paso {(activeCell.step % stepsPerMeasure) + 1} (Cuerda {activeCell.string}):
            </span>

            {/* Escala Cromática Completa (0 al 22 consecutivos) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
              {AVAILABLE_FRETS.map((fretNum) => {
                const activeNote = notes.find((n) => n.step === activeCell.step && n.string === activeCell.string);
                const isSelected = (activeNote ? activeNote.fret : selectedFret) === fretNum;
                return (
                  <button
                    key={fretNum}
                    type="button"
                    onClick={() => handleSelectFret(fretNum)}
                    className={`shrink-0 min-w-[32px] h-8 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-lg ring-2 ring-cyan-300'
                        : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {fretNum}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleClearNote(activeCell.step, activeCell.string)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/25 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar Nota</span>
            </button>

            <button
              onClick={() => setActiveCell(null)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* 7. Guía Rápida */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Haz clic en cualquier celda para añadir o modificar trastes/golpes. Usa <strong>+ Compás</strong> para crear patrones largos de hasta 8 compases.</span>
        </div>
        <div className="text-zinc-400 font-mono text-[11px]">
          Total de notas en el ejercicio: <span className="text-cyan-400 font-bold">{notes.length}</span>
        </div>
      </div>
    </div>
  );
};
