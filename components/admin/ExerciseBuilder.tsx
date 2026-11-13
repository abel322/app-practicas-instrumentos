'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DrumVoice, StickingType } from '@/types/drum';
import { StringTechnique, BendType, BendAmount } from '@/types/strings';
import { getAudioEngine } from '@/lib/drumAudioEngine';
import { drumSampler, playDrumHit, drumSynth } from '@/lib/audio/drumSynth';
import { getStringsAudioEngine } from '@/lib/stringsAudioEngine';
import { getPianoAudioEngine } from '@/lib/audio/pianoAudioEngine';
import { pianoPreviewSynth } from '@/lib/audio/pianoPreviewSynth';
import { bassPreviewSynth, getBassMidiFromString, BassTechnique } from '@/lib/audio/bassPreviewSynth';
import { guitarPreviewSynth, getGuitarMidiFromString, GuitarTechnique } from '@/lib/audio/guitarPreviewSynth';
import { saveExerciseAction } from '@/app/actions/save-exercise';
import { addCustomMasteryLevel } from '@/lib/mastery/customLevelsStorage';
import { toast } from '@/components/ui/ToastNotification';
import { saveLocalExercise, getLocalExercises } from '@/lib/exercises/customExercisesStorage';
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
  Pencil,
  ArrowLeft, 
  Drum, 
  Music, 
  KeyboardMusic,
  Sparkles, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Target
} from 'lucide-react';
import { getStepRhythmLabel } from './TablatureRuler';
import { AVAILABLE_FRETS } from './NoteSelectorModal';
import {
  PianoRollBuilder,
  getStepLabel,
  QUANTIZE_OPTIONS,
  QuantizeValue,
  getQuantizedStep,
} from './PianoRollBuilder';
import { NoteDuration } from './PianoGrandStaffView';
import { normalizeSubdivisionKey, getStepsForSubdivision } from '@/lib/music-theory/rhythmSubdivisions';
import { normalizeInstrumentKey } from '@/lib/music-theory/instrumentUtils';
import { validateLegatoTechnique } from './StudioBuilderView';
import { PrintableScoreModal } from '@/components/studio/PrintableScoreModal';
import type { ScoreMeasure } from '@/components/studio/ExtendedScoreView';

export {
  getStepRhythmLabel,
  getStepLabel,
  AVAILABLE_FRETS,
  validateLegatoTechnique,
  QUANTIZE_OPTIONS,
  getQuantizedStep,
};
export type { QuantizeValue };


type InstrumentCategory = 'drums' | 'bass' | 'guitar' | 'piano';
type SubdivisionType = '1/4' | '1/8' | '1/16' | '1/32' | '1/8T' | '1/16T' | 'quintillo' | 'septillo';

interface EditorNote {
  step: number;        // Global step index: measureIndex * stepsPerMeasure + stepInMeasure
  stepIndex?: number;  // Local/global index alias
  string?: number;     // 1 to 4/6 (para cuerdas)
  fret?: number;       // 0 to 24 (para cuerdas)
  technique?: StringTechnique | 'pm';
  slideDirection?: 'up' | 'down' | null;
  bendType?: BendType;
  bendAmount?: BendAmount;
  finger?: string;     // '1', '2', '3', '4', 'T'
  drumVoice?: DrumVoice; // Para batería
  accent?: boolean;
  sticking?: StickingType;
  midiNumber?: number; // Para piano (24 a 108)
  velocity?: number;
  durationSteps?: number;
  duration?: NoteDuration;
  isRest?: boolean;
}

const DRUM_CATEGORIES = ['Rudimentos', 'Grooves', 'Independencia', 'Acentos & Síncopas'];
const STRINGS_CATEGORIES = ['Slap & Pop', 'Walking Bass', 'Escalas & Arpegios', 'Licks & Riffs', 'Fingerpicking'];
const PIANO_CATEGORIES = ['Clásico', 'Jazz & Baladas', 'Pop & Worship', 'Acordes & Arpegios', 'Independencia de Manos'];

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

export interface DrumTrackConfig {
  id: DrumVoice;
  voice: DrumVoice;
  label: string;
  sublabel: string;
  sub: string;
  padLabel: string;
  notation: string;
}

export const DRUM_TRACKS: DrumTrackConfig[] = [
  { id: 'crash', voice: 'crash', label: 'Crash', sublabel: 'Platillo Crash', sub: 'Platillo Crash', padLabel: 'Crash', notation: '×' },
  { id: 'ride', voice: 'ride', label: 'Ride', sublabel: 'Platillo Ride', sub: 'Platillo Ride', padLabel: 'Ride', notation: '×' },
  { id: 'hihat_open', voice: 'hihat_open', label: 'Hi-Hat Abierto', sublabel: 'Platos Abiertos (○)', sub: 'Platos Abiertos (○)', padLabel: 'HH Abierto', notation: '○' },
  { id: 'hihat', voice: 'hihat', label: 'Hi-Hat Cerrado', sublabel: 'Platos Cerrados (×)', sub: 'Platos Cerrados (×)', padLabel: 'HH Cerrado', notation: '×' },
  { id: 'tom1', voice: 'tom1', label: 'Tom 1', sublabel: 'Tom Aéreo Agudo', sub: 'Tom Aéreo Agudo', padLabel: 'Tom 1', notation: '●' },
  { id: 'tom2', voice: 'tom2', label: 'Tom 2', sublabel: 'Tom Aéreo Medio', sub: 'Tom Aéreo Medio', padLabel: 'Tom 2', notation: '●' },
  { id: 'snare', voice: 'snare', label: 'Snare', sublabel: 'Redoblante / Caja', sub: 'Redoblante / Caja', padLabel: 'Snare', notation: '●' },
  { id: 'floor_tom', voice: 'floor_tom', label: 'Granadero', sublabel: 'Tom de Piso / Floor', sub: 'Tom de Piso / Floor', padLabel: 'Granadero', notation: '●' },
  { id: 'kick', voice: 'kick', label: 'Bombo (Kick)', sublabel: 'Golpe de Pedal', sub: 'Golpe de Pedal', padLabel: 'Bombo', notation: '●' },
];

export const DRUM_ROWS = DRUM_TRACKS;

export const normalizeDrumVoice = (v: string): DrumVoice => {
  const norm = (v || '').toLowerCase().trim();
  if (
    norm === 'hihat_open' ||
    norm === 'open_hihat' ||
    norm === 'hh_open' ||
    norm.includes('open') ||
    norm.includes('abierto')
  ) {
    return 'hihat_open';
  }
  if (
    norm === 'hihat_closed' ||
    norm === 'hihat' ||
    norm === 'hh' ||
    norm.includes('hihat') ||
    norm.includes('cerrado')
  ) {
    return 'hihat';
  }
  if (norm === 'floor' || norm === 'granadero' || norm === 'tom3' || norm === 'floor_tom') return 'floor_tom';
  return (norm as DrumVoice) || 'snare';
};

const ACTIVE_INSTRUMENT_KEY = 'studio_builder_active_instrument';

export interface TechniqueOption {
  id: string;
  label: string;
  symbol: string;
  color: string;
}

export const GUITAR_TECHNIQUES: TechniqueOption[] = [
  { id: 'normal', label: 'Normal', symbol: '', color: 'bg-slate-800 text-white' },
  { id: 'hammer', label: 'Hammer-on', symbol: 'h', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { id: 'pulloff', label: 'Pull-off', symbol: 'p', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { id: 'bend', label: 'Bending', symbol: 'b', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { id: 'slide_up', label: 'Slide Asc. (/)', symbol: '/', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { id: 'slide_down', label: 'Slide Desc. (\\)', symbol: '\\', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
  { id: 'slide', label: 'Slide Legato', symbol: 's', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  { id: 'vibrato', label: 'Vibrato', symbol: '~', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
  { id: 'natural_harmonic', label: 'Armónico Nat.', symbol: 'N.H.', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { id: 'pinch_harmonic', label: 'Armónico Art.', symbol: 'A.H.', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
];

export const BASS_TECHNIQUES: TechniqueOption[] = [
  { id: 'normal', label: 'Normal', symbol: '', color: 'bg-slate-800 text-white' },
  { id: 'slap', label: 'Slap', symbol: 'T', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { id: 'pop', label: 'Pop', symbol: 'P', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { id: 'ghost', label: 'Ghost', symbol: 'X', color: 'bg-slate-700 text-slate-300' },
  { id: 'hammer', label: 'Hammer-on', symbol: 'h', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
  { id: 'pulloff', label: 'Pull-off', symbol: 'p', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { id: 'slide_up', label: 'Slide Asc. (/)', symbol: '/', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { id: 'slide_down', label: 'Slide Desc. (\\)', symbol: '\\', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
  { id: 'slide', label: 'Slide Legato', symbol: 's', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  { id: 'vibrato', label: 'Vibrato', symbol: 'v', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
];

export const getTechniqueBadge = (tech?: string, inst?: string): string | null => {
  if (!tech || tech === 'normal') return null;
  if (inst === 'guitar') {
    switch (tech) {
      case 'bend': return 'b';
      case 'slide_up': return '/';
      case 'slide_down': return '\\';
      case 'slide': return 's';
      case 'vibrato': return '~';
      case 'natural_harmonic': return 'N.H.';
      case 'pinch_harmonic': return 'A.H.';
      case 'hammer': return 'h';
      case 'pull':
      case 'pulloff': return 'p';
      default: return tech[0].toUpperCase();
    }
  } else {
    switch (tech) {
      case 'slap': return 'T';
      case 'pop': return 'P';
      case 'ghost': return 'X';
      case 'slide_up': return '/';
      case 'slide_down': return '\\';
      case 'slide': return 's';
      case 'vibrato': return 'v';
      case 'hammer': return 'h';
      case 'pull':
      case 'pulloff': return 'p';
      default: return tech[0].toUpperCase();
    }
  }
};

export const BEND_TYPES: { id: BendType; label: string; badge: string }[] = [
  { id: 'standard', label: 'Bend', badge: 'b' },
  { id: 'bend_release', label: 'Bend & Rel.', badge: 'b/r' },
  { id: 'pre_bend', label: 'Pre-Bend', badge: 'pb' },
];

export const BEND_AMOUNTS: { id: BendAmount; label: string; badge: string; cents: number }[] = [
  { id: '1/4', label: '1/4', badge: '¼', cents: 50 },
  { id: '1/2', label: '1/2', badge: '½', cents: 100 },
  { id: '1', label: 'Full (1)', badge: '1', cents: 200 },
  { id: '1.5', label: '1 1/2', badge: '1½', cents: 300 },
];

export const ExerciseBuilder: React.FC = () => {
  const searchParams = useSearchParams();

  // Configuración Principal del Ejercicio (Persistencia Inmediata por URL y LocalStorage)
  const [instrument, setInstrument] = useState<InstrumentCategory>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlInst = params.get('instrument');
      if (urlInst && ['drums', 'bass', 'guitar', 'piano'].includes(urlInst)) {
        return normalizeInstrumentKey(urlInst) as InstrumentCategory;
      }
      const saved = localStorage.getItem(ACTIVE_INSTRUMENT_KEY);
      if (saved && ['drums', 'bass', 'guitar', 'piano'].includes(saved)) {
        return normalizeInstrumentKey(saved) as InstrumentCategory;
      }
    }
    return 'guitar';
  });

  const [title, setTitle] = useState('Nuevo Ejercicio Multicompás');
  const [category, setCategory] = useState('Slap & Pop');
  const [difficulty, setDifficulty] = useState<'Básico' | 'Intermedio' | 'Avanzado'>('Intermedio');
  const [bpm, setBpm] = useState(95);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '6/8' | '7/8'>('4/4');
  const [subdivision, setSubdivision] = useState<SubdivisionType>('1/16');

  // Destino: Biblioteca General vs Asignar a Ruta Técnica
  const [destination, setDestination] = useState<'general' | 'mastery'>('general');
  const [masteryLevel, setMasteryLevel] = useState<number>(11);

  // Modo Edición de Ejercicio Existente
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editorViewMode, setEditorViewMode] = useState<'pianoroll' | 'sheet' | 'extended'>('extended');

  // Cambiar instrumento actualizando estado, URL y LocalStorage
  const handleSelectInstrument = (inst: InstrumentCategory) => {
    setInstrument(inst);
    handleStop();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACTIVE_INSTRUMENT_KEY, inst);
        const url = new URL(window.location.href);
        url.searchParams.set('instrument', inst);
        window.history.replaceState(null, '', url.toString());
      } catch (err) {
        console.warn('Error guardando instrumento activo:', err);
      }
    }
    if (inst === 'piano') {
      if (!notes.some((n) => n.midiNumber !== undefined)) {
        const presetPianoNotes: EditorNote[] = [
          { step: 0, midiNumber: 48, velocity: 90 }, // C3
          { step: 0, midiNumber: 55, velocity: 85 }, // G3
          { step: 0, midiNumber: 60, velocity: 95 }, // C4
          { step: 0, midiNumber: 64, velocity: 90 }, // E4
          { step: 4, midiNumber: 67, velocity: 90 }, // G4
          { step: 8, midiNumber: 71, velocity: 95 }, // B4
          { step: 12, midiNumber: 72, velocity: 100 }, // C5
        ];
        activeNotesRef.current = presetPianoNotes;
        setNotes(presetPianoNotes);
      }
    }
  };

  // Leer query params si viene derivado desde Ruta Técnica o en Modo Edición
  useEffect(() => {
    if (!searchParams) return;
    const target = searchParams.get('target');
    const queryInst = searchParams.get('instrument');
    const lvl = searchParams.get('level');
    const editSlug = searchParams.get('editSlug') || searchParams.get('id') || searchParams.get('slug');

    if (target === 'mastery') {
      setDestination('mastery');
    }
    if (queryInst) {
      const normalizedInitialInst = normalizeInstrumentKey(queryInst);
      setInstrument(normalizedInitialInst as InstrumentCategory);
      try {
        localStorage.setItem(ACTIVE_INSTRUMENT_KEY, normalizedInitialInst);
      } catch {}
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_INSTRUMENT_KEY);
      if (saved && ['drums', 'bass', 'guitar', 'piano'].includes(saved)) {
        const normSaved = normalizeInstrumentKey(saved) as InstrumentCategory;
        setInstrument(normSaved);
        const url = new URL(window.location.href);
        url.searchParams.set('instrument', normSaved);
        window.history.replaceState(null, '', url.toString());
      }
    }
    if (lvl) {
      setMasteryLevel(parseInt(lvl) || 11);
    }

    if (editSlug) {
      setEditingSlug(editSlug);

      const loadExerciseData = async () => {
        try {
          let exerciseData: any = null;
          const sessionRaw = sessionStorage.getItem('soundlab_editing_exercise');
          if (sessionRaw) {
            const parsed = JSON.parse(sessionRaw);
            if (parsed.slug === editSlug || parsed.id === editSlug) {
              exerciseData = parsed;
            }
          }
          if (!exerciseData) {
            const localList = getLocalExercises();
            const found = localList.find((e: any) => e.slug === editSlug || e.id === editSlug);
            if (found) exerciseData = found;
          }

          // Consultar a la API pasando el hint de instrumento si está presente
          try {
            const paramInst = searchParams.get('instrument');
            const apiRes = await fetch(
              `/api/exercises/${editSlug}${paramInst ? `?instrument=${paramInst}` : ''}`
            );
            if (apiRes.ok) {
              const json = await apiRes.json();
              if (json.success && json.exercise) {
                exerciseData = { ...exerciseData, ...json.exercise };
              }
            }
          } catch (apiErr) {
            console.warn('API fetch fallback en builder:', apiErr);
          }

          if (exerciseData) {
            if (exerciseData.title) setTitle(exerciseData.title);
            if (exerciseData.category) setCategory(exerciseData.category);
            if (exerciseData.difficulty) setDifficulty(exerciseData.difficulty);
            if (exerciseData.bpmDefault || exerciseData.bpm) {
              setBpm(Number(exerciseData.bpmDefault || exerciseData.bpm));
            }
            const loadedTimeSig = exerciseData.timeSignature || '4/4';
            if (exerciseData.timeSignature) setTimeSignature(exerciseData.timeSignature);

            // Cargar y forzar la subdivisión exacta guardada (normalizada)
            const loadedSubKey = normalizeSubdivisionKey(
              exerciseData.subdivision ||
              (exerciseData.totalSteps === 8 ? '1/8' : exerciseData.totalSteps === 4 ? '1/4' : exerciseData.totalSteps === 12 && loadedTimeSig === '4/4' ? '1/8T' : '1/16')
            );
            setSubdivision(loadedSubKey as SubdivisionType);

            const stepsInLoadedMeasure = getStepsForSubdivision(loadedSubKey, loadedTimeSig);

            // 1. Resolver el instrumento con prioridad absoluta a la URL y normalización
            const queryParamInstrument = searchParams.get('instrument');
            const resolvedInstrument = normalizeInstrumentKey(
              queryParamInstrument ||
              exerciseData.instrumentType ||
              exerciseData.instrument ||
              (exerciseData.category === 'Rudimentos' || exerciseData.category === 'Grooves' || exerciseData.hitsData ? 'drums' : 'bass')
            );
            setInstrument(resolvedInstrument as InstrumentCategory);

            let loadedNotes: EditorNote[] = [];
            if (resolvedInstrument === 'drums' && Array.isArray(exerciseData.hitsData || exerciseData.data)) {
              const hits = exerciseData.hitsData || exerciseData.data;
              loadedNotes = hits.map((h: any) => ({
                step: h.step !== undefined ? h.step : h.stepIndex !== undefined ? h.stepIndex : 0,
                drumVoice: normalizeDrumVoice(h.instrument || h.drumType || h.instrumentKey || 'snare'),
                accent: !!h.accent,
                sticking: h.sticking || 'R',
                velocity: h.velocity ?? 0.8,
              }));
            } else if (resolvedInstrument === 'piano' && Array.isArray(exerciseData.notesData || exerciseData.tabData || exerciseData.data)) {
              const pNotes = exerciseData.notesData || exerciseData.tabData || exerciseData.data;
              loadedNotes = pNotes.map((p: any) => ({
                step: p.step !== undefined ? p.step : p.stepIndex !== undefined ? p.stepIndex : 0,
                midiNumber: p.midiNumber ?? 60,
                velocity: p.velocity ?? 100,
                durationSteps: p.durationSteps || 1,
                duration: p.duration || 'quarter',
                isRest: !!p.isRest,
              }));
            } else if (Array.isArray(exerciseData.tabData || exerciseData.data)) {
              const sNotes = exerciseData.tabData || exerciseData.data;
              loadedNotes = sNotes.map((s: any) => ({
                step: s.step !== undefined ? s.step : s.stepIndex !== undefined ? s.stepIndex : 0,
                string: s.string,
                fret: s.fret,
                technique: s.technique || 'normal',
                bendType: s.bendType,
                bendAmount: s.bendAmount,
                finger: s.finger || '1',
                velocity: s.velocity ?? 0.85,
              }));
            }

            if (loadedNotes.length > 0) {
              activeNotesRef.current = loadedNotes;
              setNotes(loadedNotes);
              const maxStep = Math.max(...loadedNotes.map((n) => n.step), 0);
              const calculatedMeasures = Math.max(1, Math.ceil((maxStep + 1) / stepsInLoadedMeasure));
              setTotalMeasures(calculatedMeasures);
            }
          }
        } catch (err) {
          console.warn('Error loading exercise for editing:', err);
        }
      };

      loadExerciseData();
    }
  }, [searchParams]);

  // Gestión de Compases (Sin límite / Ilimitados)
  const [totalMeasures, setTotalMeasures] = useState<number>(1);
  const [currentMeasure, setCurrentMeasure] = useState<number>(0);

  // Paleta de Articulación y Técnicas seleccionadas para nuevas notas
  const [selectedTechnique, setSelectedTechnique] = useState<StringTechnique | 'pm'>('normal');
  const [selectedBendType, setSelectedBendType] = useState<BendType>('standard');
  const [selectedBendAmount, setSelectedBendAmount] = useState<BendAmount>('1');
  const [selectedFinger, setSelectedFinger] = useState<string>('1');
  const [selectedFret, setSelectedFret] = useState<number>(0);
  const [selectedDrumVoice, setSelectedDrumVoice] = useState<DrumVoice>('snare');
  const [selectedSticking, setSelectedSticking] = useState<StickingType>('R');
  const [selectedAccent, setSelectedAccent] = useState<boolean>(false);

  // Notas almacenadas del ejercicio (adaptadas por defecto al instrumento seleccionado)
  const [notes, setNotes] = useState<EditorNote[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem(`studio_builder_draft_${instrument}`);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.notes && Array.isArray(parsed.notes)) return parsed.notes;
        }
      } catch {}
    }
    if (instrument === 'bass') {
      return [
        { step: 0, string: 4, fret: 0, technique: 'slap', finger: 'T' },
        { step: 2, string: 2, fret: 2, technique: 'pop', finger: '1' },
        { step: 4, string: 4, fret: 0, technique: 'slap', finger: 'T' },
        { step: 6, string: 4, fret: 3, technique: 'slap', finger: '1' },
        { step: 8, string: 2, fret: 5, technique: 'pop', finger: '3' },
      ];
    }
    if (instrument === 'guitar') {
      return [
        { step: 0, string: 6, fret: 0, technique: 'normal', finger: '1' },
        { step: 2, string: 5, fret: 2, technique: 'hammer', finger: '2' },
        { step: 4, string: 4, fret: 2, technique: 'normal', finger: '2' },
        { step: 6, string: 3, fret: 0, technique: 'normal', finger: '1' },
        { step: 8, string: 2, fret: 3, technique: 'bend', bendType: 'standard', bendAmount: '1', finger: '3' },
      ];
    }
    return [];
  });

  // Referencia viva para el motor de audio en tiempo de ejecución (Hot-Updating Sequencer)
  const activeNotesRef = useRef<EditorNote[]>(notes);

  // Actualizar la referencia viva cada vez que cambien las notas
  useEffect(() => {
    activeNotesRef.current = notes;
  }, [notes]);

  // Inicializar y precargar el AudioContext de muestras de piano, bajo, guitarra y batería para latencia cero
  useEffect(() => {
    // Pre-cargar muestras de piano acústico y batería para disponibilidad inmediata sin latencia
    drumSampler.preloadSamples();
    pianoPreviewSynth.initContext();
    pianoPreviewSynth.preloadSamples();
    bassPreviewSynth.initContext();
    guitarPreviewSynth.init();
  }, []);

  useEffect(() => {
    if (instrument === 'drums') {
      drumSampler.preloadSamples();
    }
  }, [instrument]);

  // Estado de Celda Activa / Modal de Edición Rápida de Traste
  const [activeCell, setActiveCell] = useState<{ step: number; string?: number; voice?: DrumVoice } | null>(null);

  // Estado del Motor de Audio & Previsualización
  const [isPlaying, setIsPlaying] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [playbackActiveStep, setPlaybackActiveStep] = useState(0);

  // Estado de Persistencia
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  // Pasos por compás según compás y subdivisión normalizada
  const stepsPerMeasure = useMemo(() => {
    return getStepsForSubdivision(subdivision, timeSignature);
  }, [timeSignature, subdivision]);

  const totalSteps = totalMeasures * stepsPerMeasure;

  // Agrupación de notas por compás
  const measures = useMemo(() => {
    return Array.from({ length: totalMeasures }).map((_, mIdx) => {
      const mStart = mIdx * stepsPerMeasure;
      const mEnd = mStart + stepsPerMeasure;
      return {
        measureIndex: mIdx,
        notes: notes.filter((n) => n.step >= mStart && n.step < mEnd),
      };
    });
  }, [totalMeasures, stepsPerMeasure, notes]);

  // Modal de Exportación a PDF Editorial
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Mapeo de compases para exportación a partitura imprimible vectorial
  const printableMeasures: ScoreMeasure[] = useMemo(() => {
    return measures.map((m) => {
      const measureNotes = (m.notes || []).map((n) => {
        let midi = n.midiNumber;
        if (midi === undefined) {
          if (instrument === 'bass' && n.string !== undefined && n.fret !== undefined) {
            midi = getBassMidiFromString(n.string, n.fret);
          } else if (instrument === 'guitar' && n.string !== undefined && n.fret !== undefined) {
            midi = getGuitarMidiFromString(n.string, n.fret);
          }
        }
        return {
          stepIndex: n.step - m.measureIndex * stepsPerMeasure,
          midiNumber: midi ?? 60,
          duration: n.duration,
          velocity: n.velocity,
          isRest: !!n.isRest,
        };
      });
      return {
        measureIndex: m.measureIndex,
        notes: measureNotes,
      };
    });
  }, [measures, stepsPerMeasure, instrument]);

  // ============================================================================
  // AUTO-GUARDADO Y RESTAURACIÓN DE BORRADOR (LOCALSTORAGE)
  // ============================================================================
  const DRAFT_STORAGE_KEY = `studio_builder_draft_${instrument}`;
  const isDraftLoadedRef = useRef<boolean>(false);
  const [isDraftReady, setIsDraftReady] = useState<boolean>(false);

  // 1. Restauración automática al montar o cambiar de instrumento
  useEffect(() => {
    // Si estamos editando un ejercicio existente por ID/slug de la base de datos, no cargamos borrador nuevo
    if (editingSlug) {
      isDraftLoadedRef.current = true;
      setIsDraftReady(true);
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          let loadedNotes: EditorNote[] = [];

          if (parsed.notes && Array.isArray(parsed.notes)) {
            loadedNotes = parsed.notes;
          } else if (parsed.measures && Array.isArray(parsed.measures) && parsed.measures.length > 0) {
            loadedNotes = parsed.measures.flatMap((m: any, mIdx: number) => {
              const mStart = (m.measureIndex ?? mIdx) * stepsPerMeasure;
              return (m.notes || []).map((n: any) => ({
                ...n,
                step: n.step !== undefined ? n.step : mStart + (n.stepIndex ?? 0),
              }));
            });
          }

          if (loadedNotes.length > 0 || (parsed.title && parsed.title.trim() !== '')) {
            setNotes(loadedNotes);
            activeNotesRef.current = loadedNotes;
            if (parsed.totalMeasures) {
              setTotalMeasures(Math.max(1, parsed.totalMeasures));
            } else if (parsed.measures && Array.isArray(parsed.measures)) {
              setTotalMeasures(Math.max(1, parsed.measures.length));
            }
            if (parsed.title !== undefined) setTitle(parsed.title);
            if (parsed.tempo || parsed.bpm) setBpm(Number(parsed.tempo || parsed.bpm));
            if (parsed.subdivision) setSubdivision(parsed.subdivision as SubdivisionType);
            if (parsed.category) setCategory(parsed.category);
            if (parsed.difficulty) setDifficulty(parsed.difficulty);
            if (parsed.timeSignature) setTimeSignature(parsed.timeSignature);
          }
        }
      }
    } catch (err) {
      console.error('Error restaurando borrador de localStorage:', err);
    } finally {
      isDraftLoadedRef.current = true;
      setIsDraftReady(true);
    }
  }, [instrument, editingSlug]);

  // 2. Auto-guardado continuo en tiempo real
  useEffect(() => {
    // Evitar sobreescribir con estado inicial antes de restaurar o si estamos en modo edición
    if (!isDraftReady || !isDraftLoadedRef.current || editingSlug || isSaving) return;

    try {
      if (typeof window === 'undefined') return;
      const hasNotes = notes.length > 0;
      if (hasNotes || title.trim() !== '') {
        const draftPayload = {
          title,
          tempo: bpm,
          bpm,
          subdivision,
          category,
          difficulty,
          timeSignature,
          totalMeasures,
          measures,
          notes,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      }
    } catch (err) {
      console.error('Error auto-guardando borrador:', err);
    }
  }, [
    notes,
    measures,
    title,
    bpm,
    subdivision,
    category,
    difficulty,
    timeSignature,
    totalMeasures,
    instrument,
    isDraftReady,
    editingSlug,
    isSaving,
    DRAFT_STORAGE_KEY,
  ]);

  // 3. Alerta de confirmación al recargar o salir (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasNotes = notes.length > 0;
      if (hasNotes) {
        e.preventDefault();
        e.returnValue = ''; // Requerido por navegadores modernos para disparar el diálogo
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notes]);

  // Acción para vaciar el borrador y comenzar un ejercicio limpio
  const handleClearDraft = () => {
    if (confirm('¿Deseas descartar este borrador y empezar un ejercicio nuevo en blanco?')) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (err) {
        console.error('Error limpiando borrador:', err);
      }
      setNotes([]);
      activeNotesRef.current = [];
      setTotalMeasures(1);
      setCurrentMeasure(0);
      setTitle('');
      toast.info('Borrador descartado. Ejercicio nuevo en blanco.');
    }
  };

  // Cambiar categorías automáticamente al alternar instrumento
  useEffect(() => {
    if (instrument === 'drums') {
      if (!DRUM_CATEGORIES.includes(category)) setCategory(DRUM_CATEGORIES[0]);
    } else if (instrument === 'piano') {
      if (!PIANO_CATEGORIES.includes(category)) setCategory(PIANO_CATEGORIES[0]);
    } else {
      if (!STRINGS_CATEGORIES.includes(category)) setCategory(STRINGS_CATEGORIES[0]);
    }
  }, [instrument, category]);

  // ============================================================================
  // GESTIÓN DE COMPASES
  // ============================================================================
  const handleSelectMeasure = useCallback((mIdx: number) => {
    currentMeasureRef.current = mIdx;
    setCurrentMeasure(mIdx);
  }, []);

  const handleAddMeasure = useCallback(() => {
    const nextIdx = totalMeasuresRef.current;
    totalMeasuresRef.current = nextIdx + 1;
    currentMeasureRef.current = nextIdx;
    setTotalMeasures((prev) => prev + 1);
    setCurrentMeasure(nextIdx); // Ir al nuevo compás
  }, []);

  const handleDuplicateMeasure = () => {
    const sourceStart = currentMeasure * stepsPerMeasure;
    const sourceEnd = sourceStart + stepsPerMeasure;
    const currentNotes = notes.filter((n) => n.step >= sourceStart && n.step < sourceEnd);

    const newMeasureIdx = totalMeasures;
    const targetStart = newMeasureIdx * stepsPerMeasure;

    const duplicatedNotes: EditorNote[] = currentNotes.map((n) => ({
      ...n,
      step: targetStart + (n.step - sourceStart),
    }));

    totalMeasuresRef.current = newMeasureIdx + 1;
    currentMeasureRef.current = newMeasureIdx;
    setTotalMeasures((prev) => prev + 1);
    setNotes((prev) => {
      const next = [...prev, ...duplicatedNotes];
      activeNotesRef.current = next;
      return next;
    });
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

    totalMeasuresRef.current = Math.max(1, totalMeasures - 1);
    activeNotesRef.current = updatedNotes;
    setNotes(updatedNotes);
    setTotalMeasures((prev) => prev - 1);
    setCurrentMeasure((prev) => Math.max(0, Math.min(prev, totalMeasures - 2)));
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
        setNotes((prev) => {
          const next = prev.filter((_, idx) => idx !== existingIdx);
          activeNotesRef.current = next;
          return next;
        });
      } else {
        // Agregar nota de batería
        const newNote: EditorNote = {
          step: globalStep,
          drumVoice,
          accent: selectedAccent,
          sticking: selectedSticking,
        };
        setNotes((prev) => {
          const next = [...prev, newNote];
          activeNotesRef.current = next;
          return next;
        });
        // Sonido de prueba inmediato con muestras acústicas reales, panorama y sticking
        const isFoot = drumVoice === 'kick';
        const targetInstrument = drumVoice === 'hihat' ? 'hihat_closed' : drumVoice!;
        playDrumHit({
          instrument: targetInstrument,
          velocity: 90,
          accent: selectedAccent,
          sticking: isFoot ? null : (selectedSticking as 'R' | 'L') || 'R',
          isDoubleRebound: false,
        });
      }
    } else {
      // Para cuerdas:
      const existingIdx = notes.findIndex((n) => n.step === globalStep && n.string === stringNum);
      if (existingIdx >= 0) {
        const existingNote = notes[existingIdx];
        const targetFret = existingNote.fret ?? selectedFret;
        let noteTech = selectedTechnique;

        if (noteTech === 'hammer' || noteTech === 'pull' || (noteTech as any) === 'pulloff') {
          const currentNotes = activeNotesRef.current || notes;
          const validation = validateLegatoTechnique(
            currentNotes,
            { step: globalStep, string: stringNum, fret: targetFret },
            noteTech
          );

          if (!validation.isValid) {
            toast.error(validation.message || 'Ligadura inválida: se requiere una nota previa en la misma cuerda.');
            noteTech = existingNote.technique || 'normal';
          } else if (validation.suggestedTechnique) {
            toast.info(validation.message || 'Técnica ajustada a la dirección musical.');
            noteTech = validation.suggestedTechnique === 'pulloff' ? (instrument === 'guitar' ? 'pulloff' : 'pull') : 'hammer';
          }
        }

        const targetBendType = noteTech === 'bend' ? (existingNote.bendType || selectedBendType) : undefined;
        const targetBendAmount = noteTech === 'bend' ? (existingNote.bendAmount || selectedBendAmount) : undefined;
        const targetSlideDirection =
          noteTech === 'slide_up'
            ? 'up'
            : noteTech === 'slide_down'
            ? 'down'
            : existingNote.slideDirection;

        // Actualizar técnica/dedo si el usuario seleccionó otra articulación activa
        setNotes((prev) => {
          const next = prev.map((n, idx) =>
            idx === existingIdx
              ? {
                  ...n,
                  technique: noteTech,
                  slideDirection: targetSlideDirection,
                  bendType: targetBendType,
                  bendAmount: targetBendAmount,
                  finger: selectedFinger,
                }
              : n
          );
          activeNotesRef.current = next;
          return next;
        });
        setActiveCell({ step: globalStep, string: stringNum });
        if (existingNote.bendType) setSelectedBendType(existingNote.bendType);
        if (existingNote.bendAmount) setSelectedBendAmount(existingNote.bendAmount);

        // Pre-escucha inmediata con la técnica activa y motor dedicado
        if (instrument === 'bass') {
          const calculatedMidi = getBassMidiFromString(stringNum!, targetFret);
          const bassTech = (noteTech === 'pull' ? 'pulloff' : noteTech) as BassTechnique;
          bassPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: bassTech || 'normal',
            slideDirection: targetSlideDirection,
            stringIndex: Math.max(0, (stringNum || 4) - 1),
            duration: (60 / bpmRef.current) * 0.8,
            velocity: noteTech === 'pop' || noteTech === 'slap' ? 120 : 95,
          });
        } else if (instrument === 'guitar') {
          const calculatedMidi = getGuitarMidiFromString(stringNum!, targetFret);
          const guitarTech = (noteTech === 'pull' ? 'pulloff' : noteTech) as GuitarTechnique;
          guitarPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: guitarTech || 'normal',
            slideDirection: targetSlideDirection,
            bendType: guitarTech === 'bend' ? targetBendType : undefined,
            bendAmount: guitarTech === 'bend' ? targetBendAmount : undefined,
            duration: (60 / bpmRef.current) * 0.8,
            velocity: noteTech === 'natural_harmonic' || noteTech === 'pinch_harmonic' ? 115 : 100,
          });
        } else {
          const engine = getStringsAudioEngine();
          engine.init();
          engine.triggerNote(
            'guitar_6',
            stringNum!,
            targetFret,
            undefined,
            noteTech === 'pm' ? 'normal' : noteTech,
            0.85
          );
        }
      } else {
        let noteTech = selectedTechnique;
        if (noteTech === 'hammer' || noteTech === 'pull' || (noteTech as any) === 'pulloff') {
          const currentNotes = activeNotesRef.current || notes;
          const validation = validateLegatoTechnique(
            currentNotes,
            { step: globalStep, string: stringNum, fret: selectedFret },
            noteTech
          );

          if (!validation.isValid) {
            toast.error(validation.message || 'Ligadura inválida: se requiere una nota previa en la misma cuerda.');
            noteTech = 'normal';
          } else if (validation.suggestedTechnique) {
            toast.info(validation.message || 'Técnica ajustada a la dirección musical.');
            noteTech = validation.suggestedTechnique === 'pulloff' ? (instrument === 'guitar' ? 'pulloff' : 'pull') : 'hammer';
          }
        }

        const targetSlideDirection =
          noteTech === 'slide_up' ? 'up' : noteTech === 'slide_down' ? 'down' : undefined;

        // Agregar nota con el traste y técnica activos
        const newNote: EditorNote = {
          step: globalStep,
          string: stringNum,
          fret: selectedFret,
          technique: noteTech,
          slideDirection: targetSlideDirection,
          bendType: noteTech === 'bend' ? selectedBendType : undefined,
          bendAmount: noteTech === 'bend' ? selectedBendAmount : undefined,
          finger: selectedFinger,
        };
        setNotes((prev) => {
          const next = [...prev, newNote];
          activeNotesRef.current = next;
          return next;
        });
        setActiveCell({ step: globalStep, string: stringNum });

        // Sonido de prueba inmediato con motor articulado
        if (instrument === 'bass') {
          const calculatedMidi = getBassMidiFromString(stringNum!, selectedFret);
          const bassTech = (noteTech === 'pull' ? 'pulloff' : noteTech) as BassTechnique;
          bassPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: bassTech || 'normal',
            slideDirection: targetSlideDirection,
            stringIndex: Math.max(0, (stringNum || 4) - 1),
            duration: (60 / bpmRef.current) * 0.8,
            velocity: noteTech === 'pop' || noteTech === 'slap' ? 120 : 95,
          });
        } else if (instrument === 'guitar') {
          const calculatedMidi = getGuitarMidiFromString(stringNum!, selectedFret);
          const guitarTech = (noteTech === 'pull' ? 'pulloff' : noteTech) as GuitarTechnique;
          guitarPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: guitarTech || 'normal',
            slideDirection: targetSlideDirection,
            bendType: guitarTech === 'bend' ? selectedBendType : undefined,
            bendAmount: guitarTech === 'bend' ? selectedBendAmount : undefined,
            duration: (60 / bpmRef.current) * 0.8,
            velocity: noteTech === 'natural_harmonic' || noteTech === 'pinch_harmonic' ? 115 : 100,
          });
        } else {
          const engine = getStringsAudioEngine();
          engine.init();
          engine.triggerNote(
            'guitar_6',
            stringNum!,
            selectedFret,
            undefined,
            noteTech === 'pm' ? 'normal' : noteTech,
            0.85
          );
        }
      }
    }
  };

  const handleUpdateFret = (globalStep: number, stringNum: number, fret: number) => {
    let finalTech: string = selectedTechnique;
    setNotes((prev) => {
      const filtered = prev.filter((n) => !(n.step === globalStep && n.string === stringNum));
      const existing = prev.find((n) => n.step === globalStep && n.string === stringNum);
      let noteTech = existing?.technique || selectedTechnique;

      if (fret >= 0 && (noteTech === 'hammer' || noteTech === 'pull' || (noteTech as any) === 'pulloff')) {
        const validation = validateLegatoTechnique(
          filtered,
          { step: globalStep, string: stringNum, fret },
          noteTech
        );
        if (!validation.isValid) {
          noteTech = 'normal';
        } else if (validation.suggestedTechnique) {
          noteTech = validation.suggestedTechnique === 'pulloff' ? (instrument === 'guitar' ? 'pulloff' : 'pull') : 'hammer';
        }
      }
      finalTech = noteTech;
      const targetSlideDirection =
        existing?.slideDirection ?? (noteTech === 'slide_up' ? 'up' : noteTech === 'slide_down' ? 'down' : undefined);

      const next =
        fret < 0
          ? filtered
          : [
              ...filtered,
              {
                step: globalStep,
                string: stringNum,
                fret,
                technique: noteTech,
                slideDirection: targetSlideDirection,
                bendType: noteTech === 'bend' ? (existing?.bendType || selectedBendType) : undefined,
                bendAmount: noteTech === 'bend' ? (existing?.bendAmount || selectedBendAmount) : undefined,
                finger: existing?.finger || selectedFinger,
              },
            ];
      activeNotesRef.current = next;
      return next;
    });

    if (fret >= 0) {
      if (instrument === 'bass') {
        const calculatedMidi = getBassMidiFromString(stringNum, fret);
        const bassTech = (finalTech === 'pull' ? 'pulloff' : finalTech) as BassTechnique;
        bassPreviewSynth.playNote({
          midi: calculatedMidi,
          technique: bassTech || 'normal',
          slideDirection: finalTech === 'slide_up' ? 'up' : finalTech === 'slide_down' ? 'down' : undefined,
          stringIndex: Math.max(0, stringNum - 1),
          duration: (60 / bpmRef.current) * 0.8,
          velocity: finalTech === 'pop' || finalTech === 'slap' ? 120 : 95,
        });
      } else if (instrument === 'guitar') {
        const calculatedMidi = getGuitarMidiFromString(stringNum, fret);
        const guitarTech = (finalTech === 'pull' ? 'pulloff' : finalTech) as GuitarTechnique;
        guitarPreviewSynth.playNote({
          midi: calculatedMidi,
          technique: guitarTech || 'normal',
          slideDirection: finalTech === 'slide_up' ? 'up' : finalTech === 'slide_down' ? 'down' : undefined,
          bendType: guitarTech === 'bend' ? selectedBendType : undefined,
          bendAmount: guitarTech === 'bend' ? selectedBendAmount : undefined,
          duration: (60 / bpmRef.current) * 0.8,
          velocity: finalTech === 'natural_harmonic' || finalTech === 'pinch_harmonic' ? 115 : 100,
        });
      } else {
        const engine = getStringsAudioEngine();
        engine.init();
        engine.triggerNote(
          'guitar_6',
          stringNum,
          fret,
          undefined,
          finalTech === 'pm' ? 'normal' : (finalTech as StringTechnique),
          0.85
        );
      }
    }
  };

  const handleSetTechnique = (newTech: StringTechnique) => {
    let finalTech = newTech;

    if (activeCell && activeCell.string !== undefined) {
      const activeNote = notes.find(
        (n) => n.step === activeCell.step && n.string === activeCell.string
      );

      if (activeNote) {
        if (newTech === 'hammer' || newTech === 'pull' || (newTech as any) === 'pulloff') {
          const currentNotes = activeNotesRef.current || notes;
          const validation = validateLegatoTechnique(
            currentNotes,
            { ...activeNote, fret: activeNote.fret ?? selectedFret },
            newTech
          );

          if (!validation.isValid) {
            toast.error(validation.message || 'Ligadura inválida: se requiere una nota previa en la misma cuerda.');
            return;
          }

          if (validation.suggestedTechnique) {
            toast.info(validation.message || 'Técnica ajustada a la dirección musical.');
            finalTech = validation.suggestedTechnique === 'pulloff' ? (instrument === 'guitar' ? 'pulloff' : 'pull') : 'hammer';
          }
        }

        setSelectedTechnique(finalTech);

        const targetBendType = finalTech === 'bend' ? (activeNote.bendType || selectedBendType) : undefined;
        const targetBendAmount = finalTech === 'bend' ? (activeNote.bendAmount || selectedBendAmount) : undefined;
        if (activeNote.bendType) setSelectedBendType(activeNote.bendType);
        if (activeNote.bendAmount) setSelectedBendAmount(activeNote.bendAmount);

        const targetSlideDirection =
          finalTech === 'slide_up'
            ? 'up'
            : finalTech === 'slide_down'
            ? 'down'
            : activeNote.slideDirection;

        const previewFret = activeNote.fret ?? selectedFret;
        setNotes((prev) => {
          const next = prev.map((n) =>
            n.step === activeCell.step && n.string === activeCell.string
              ? {
                  ...n,
                  technique: finalTech,
                  slideDirection: targetSlideDirection,
                  bendType: targetBendType,
                  bendAmount: targetBendAmount,
                }
              : n
          );
          activeNotesRef.current = next;
          return next;
        });

        if (instrument === 'bass') {
          const calculatedMidi = getBassMidiFromString(activeCell.string, previewFret);
          const bassTech = (finalTech === 'pull' ? 'pulloff' : finalTech) as BassTechnique;
          bassPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: bassTech || 'normal',
            slideDirection: targetSlideDirection,
            stringIndex: Math.max(0, activeCell.string - 1),
            duration: (60 / bpmRef.current) * 0.8,
            velocity: finalTech === 'pop' || finalTech === 'slap' ? 120 : 95,
          });
        } else if (instrument === 'guitar') {
          const calculatedMidi = getGuitarMidiFromString(activeCell.string, previewFret);
          const guitarTech = (finalTech === 'pull' ? 'pulloff' : finalTech) as GuitarTechnique;
          guitarPreviewSynth.playNote({
            midi: calculatedMidi,
            technique: guitarTech,
            slideDirection: targetSlideDirection,
            bendType: guitarTech === 'bend' ? targetBendType : undefined,
            bendAmount: guitarTech === 'bend' ? targetBendAmount : undefined,
            duration: (60 / bpmRef.current) * 0.8,
            velocity: finalTech === 'natural_harmonic' || finalTech === 'pinch_harmonic' ? 115 : 100,
          });
        }
        return;
      }
    }

    setSelectedTechnique(finalTech);
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
    setNotes((prev) => {
      const next = prev.filter((n) => {
        if (instrument === 'drums') {
          return !(n.step === globalStep && n.drumVoice === drumVoice);
        }
        return !(n.step === globalStep && n.string === stringNum);
      });
      activeNotesRef.current = next;
      return next;
    });
    setActiveCell(null);
  };

  const handleUpdateNoteSlide = (globalStep: number, stringNum: number, dir: 'up' | 'down') => {
    let targetSlide: 'up' | 'down' | null = null;
    let targetFret = selectedFret;
    let targetTech: any = 'normal';

    setNotes((prev) => {
      const next = prev.map((n) => {
        if (n.step === globalStep && n.string === stringNum) {
          targetFret = n.fret ?? selectedFret;
          targetTech = n.technique || 'normal';
          const currentSlide =
            n.slideDirection ?? (n.technique === 'slide_up' ? 'up' : n.technique === 'slide_down' ? 'down' : null);
          targetSlide = currentSlide === dir ? null : dir;

          let newTech = n.technique;
          if (targetSlide === null && (n.technique === 'slide_up' || n.technique === 'slide_down')) {
            newTech = 'normal';
          } else if (targetSlide === 'up' && (!n.technique || n.technique === 'normal' || n.technique === 'slide_down')) {
            newTech = 'slide_up';
          } else if (targetSlide === 'down' && (!n.technique || n.technique === 'normal' || n.technique === 'slide_up')) {
            newTech = 'slide_down';
          }

          return {
            ...n,
            technique: newTech,
            slideDirection: targetSlide,
          };
        }
        return n;
      });
      activeNotesRef.current = next;
      return next;
    });

    // Vista previa con audio
    if (instrument === 'bass') {
      const calculatedMidi = getBassMidiFromString(stringNum, targetFret);
      const bassTech = (targetTech === 'pull' ? 'pulloff' : targetTech) as BassTechnique;
      bassPreviewSynth.playNote({
        midi: calculatedMidi,
        technique: bassTech || 'normal',
        slideDirection: targetSlide,
        stringIndex: Math.max(0, stringNum - 1),
        duration: (60 / bpmRef.current) * 0.8,
        velocity: targetTech === 'pop' || targetTech === 'slap' ? 120 : 95,
      });
    } else if (instrument === 'guitar') {
      const calculatedMidi = getGuitarMidiFromString(stringNum, targetFret);
      const guitarTech = (targetTech === 'pull' ? 'pulloff' : targetTech) as GuitarTechnique;
      guitarPreviewSynth.playNote({
        midi: calculatedMidi,
        technique: guitarTech || 'normal',
        slideDirection: targetSlide,
        duration: (60 / bpmRef.current) * 0.8,
        velocity: 100,
      });
    }
  };

  // Referencias vivas adicionales para el secuenciador en caliente
  const instrumentRef = useRef<InstrumentCategory>(instrument);
  const stepsPerMeasureRef = useRef<number>(stepsPerMeasure);
  const totalStepsRef = useRef<number>(totalSteps);
  const totalMeasuresRef = useRef<number>(totalMeasures);
  const currentMeasureRef = useRef<number>(currentMeasure);
  const timeSignatureRef = useRef<'4/4' | '6/8' | '7/8'>(timeSignature);
  const subdivisionRef = useRef<SubdivisionType>(subdivision);

  useEffect(() => {
    instrumentRef.current = instrument;
  }, [instrument]);

  useEffect(() => {
    stepsPerMeasureRef.current = stepsPerMeasure;
    totalStepsRef.current = totalSteps;
    totalMeasuresRef.current = totalMeasures;
    currentMeasureRef.current = currentMeasure;
    timeSignatureRef.current = timeSignature;
    subdivisionRef.current = subdivision;
  }, [stepsPerMeasure, totalSteps, totalMeasures, currentMeasure, timeSignature, subdivision]);

  const handleTogglePianoNote = useCallback(
    (
      stepInMeasure: number,
      midiNumber: number,
      velocity: number = 100,
      duration: NoteDuration = 'quarter'
    ) => {
      const globalStep = currentMeasureRef.current * stepsPerMeasureRef.current + stepInMeasure;
      const durationStepsMap: Record<NoteDuration, number> = {
        whole: 16,
        half: 8,
        quarter: 4,
        eighth: 2,
        sixteenth: 1,
      };
      setNotes((prev) => {
        const withoutRest = prev.filter((n) => !(n.step === globalStep && n.isRest));
        const existingIdx = withoutRest.findIndex(
          (n) => n.step === globalStep && n.midiNumber === midiNumber
        );
        const next =
          existingIdx >= 0
            ? withoutRest.filter((_, idx) => idx !== existingIdx)
            : [
                ...withoutRest,
                {
                  step: globalStep,
                  midiNumber,
                  velocity,
                  duration,
                  durationSteps: durationStepsMap[duration] || 1,
                  isRest: false,
                },
              ];
        activeNotesRef.current = next;
        return next;
      });
    },
    []
  );

  const handleAddPianoNote = useCallback(
    (
      stepInMeasure: number,
      midiNumber: number,
      velocity: number = 100,
      duration: NoteDuration = 'quarter'
    ) => {
      const globalStep = currentMeasureRef.current * stepsPerMeasureRef.current + stepInMeasure;
      const durationStepsMap: Record<NoteDuration, number> = {
        whole: 16,
        half: 8,
        quarter: 4,
        eighth: 2,
        sixteenth: 1,
      };
      setNotes((prev) => {
        const withoutRest = prev.filter((n) => !(n.step === globalStep && n.isRest));
        const alreadyExists = withoutRest.some(
          (n) => n.step === globalStep && n.midiNumber === midiNumber
        );
        if (alreadyExists) return prev;

        const next = [
          ...withoutRest,
          {
            step: globalStep,
            midiNumber,
            velocity,
            duration,
            durationSteps: durationStepsMap[duration] || 1,
            isRest: false,
          },
        ];
        activeNotesRef.current = next;
        return next;
      });
    },
    []
  );

  const handleTogglePianoRest = useCallback(
    (stepInMeasure: number, duration: NoteDuration = 'quarter') => {
      const globalStep = currentMeasureRef.current * stepsPerMeasureRef.current + stepInMeasure;
      setNotes((prev) => {
        const existingRestIdx = prev.findIndex((n) => n.step === globalStep && n.isRest);
        const next =
          existingRestIdx >= 0
            ? prev.filter((_, idx) => idx !== existingRestIdx)
            : [
                ...prev.filter((n) => n.step !== globalStep),
                {
                  step: globalStep,
                  isRest: true,
                  duration,
                },
              ];
        activeNotesRef.current = next;
        return next;
      });
    },
    []
  );

  const handleAddChordToPianoStep = useCallback(
    (
      stepInMeasure: number,
      midiNumbers: number[],
      velocity: number = 100,
      duration: NoteDuration = 'quarter'
    ) => {
      const globalStep = currentMeasureRef.current * stepsPerMeasureRef.current + stepInMeasure;
      const durationStepsMap: Record<NoteDuration, number> = {
        whole: 16,
        half: 8,
        quarter: 4,
        eighth: 2,
        sixteenth: 1,
      };
      setNotes((prev) => {
        const filtered = prev.filter(
          (n) => !(n.step === globalStep && (n.isRest || midiNumbers.includes(n.midiNumber || -1)))
        );
        const newNotes: EditorNote[] = midiNumbers.map((midiNumber) => ({
          step: globalStep,
          midiNumber,
          velocity,
          duration,
          durationSteps: durationStepsMap[duration] || 1,
          isRest: false,
        }));
        const next = [...filtered, ...newNotes];
        activeNotesRef.current = next;
        return next;
      });
    },
    []
  );

  const handleQuantizePianoMeasure = useCallback(
    (quantizeVal: QuantizeValue) => {
      const quantizeConfig =
        QUANTIZE_OPTIONS.find((q) => q.id === quantizeVal) || QUANTIZE_OPTIONS[4];
      const liveStepsPerMeasure = stepsPerMeasureRef.current;
      const liveMeasureStart = currentMeasureRef.current * liveStepsPerMeasure;
      const stepRatio = liveStepsPerMeasure / quantizeConfig.subdivisions;

      setNotes((prev) => {
        const next = prev.map((n) => {
          const stepNum = n.step !== undefined ? n.step : n.stepIndex ?? 0;
          if (
            stepNum >= liveMeasureStart &&
            stepNum < liveMeasureStart + liveStepsPerMeasure &&
            n.midiNumber !== undefined
          ) {
            const stepInMeasure = stepNum - liveMeasureStart;
            const gridIndex = Math.round(stepInMeasure / stepRatio);
            const newStepInMeasure = Math.min(
              liveStepsPerMeasure - 1,
              Math.max(0, Math.round(gridIndex * stepRatio))
            );
            return {
              ...n,
              step: liveMeasureStart + newStepInMeasure,
              stepIndex: newStepInMeasure,
            };
          }
          return n;
        });
        activeNotesRef.current = next;
        return next;
      });
    },
    []
  );

  // ============================================================================
  // PREVISUALIZACIÓN DE AUDIO & RUNWAY EN TIEMPO REAL (HOT-UPDATING SEQUENCER)
  // ============================================================================
  const isPlayingRef = useRef(false);
  const nextNoteTimeRef = useRef(0);
  const playStepRef = useRef(0);
  const audioStartTimeRef = useRef(0);
  const playStartStepRef = useRef(0);
  const anchorStepRef = useRef(0);
  const anchorAudioTimeRef = useRef(0);
  const lastDrumStickingRef = useRef<Record<string, { sticking: string; step: number; accent: boolean }>>({});
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);

  const isBeatStep = useCallback((stepNumber: number) => {
    const liveStepsPerMeasure = stepsPerMeasureRef.current;
    const liveTimeSig = timeSignatureRef.current;
    const stepInMeasure = stepNumber % liveStepsPerMeasure;
    if (liveTimeSig === '6/8') {
      const stepsPerDottedQuarter = liveStepsPerMeasure / 2;
      return stepInMeasure % stepsPerDottedQuarter === 0;
    }
    if (liveTimeSig === '7/8') {
      return stepInMeasure === 0;
    }
    const stepsPerBeat = Math.max(1, Math.round(liveStepsPerMeasure / 4));
    return stepInMeasure % stepsPerBeat === 0;
  }, []);

  const getStepDuration = useCallback(() => {
    const beatDuration = 60 / bpmRef.current;
    const liveTimeSig = timeSignatureRef.current;
    const liveSub = subdivisionRef.current;

    if (liveTimeSig === '6/8') {
      if (liveSub === '1/8') return beatDuration / 2;
      if (liveSub === '1/32') return beatDuration / 8;
      return beatDuration / 4;
    }
    if (liveTimeSig === '7/8') {
      if (liveSub === '1/8') return beatDuration / 2;
      return beatDuration / 4;
    }

    switch (liveSub) {
      case '1/4':
        return beatDuration;
      case '1/8':
        return beatDuration / 2;
      case '1/8T':
        return beatDuration / 3;
      case '1/16':
        return beatDuration / 4;
      case '1/16T':
        return beatDuration / 6;
      case 'quintillo':
        return beatDuration / 5;
      case 'septillo':
        return beatDuration / 7;
      case '1/32':
        return beatDuration / 8;
      default:
        return beatDuration / 4;
    }
  }, []);

  // Sincronizar BPM en caliente sin reiniciar el scheduler
  useEffect(() => {
    const prevBpm = bpmRef.current;
    bpmRef.current = bpm;

    // Si el usuario acelera los BPM en vivo y el próximo golpe estaba agendado muy lejos (tempo lento),
    // acercar el próximo golpe al intervalo del nuevo tempo para respuesta acústica inmediata
    if (isPlaying && bpm > prevBpm) {
      const liveInstrument = instrumentRef.current;
      const audioCtx =
        liveInstrument === 'drums'
          ? getAudioEngine().getAudioContext()
          : liveInstrument === 'piano'
          ? getPianoAudioEngine().getAudioContext()
          : getStringsAudioEngine().getAudioContext();

      if (audioCtx) {
        const newStepDuration = getStepDuration();
        if (nextNoteTimeRef.current > audioCtx.currentTime + newStepDuration) {
          nextNoteTimeRef.current = audioCtx.currentTime + newStepDuration;
        }
      }
    }
  }, [bpm, isPlaying, getStepDuration]);

  const playStepAudio = useCallback((stepIdx: number) => {
    // Obtener las notas en tiempo real sin importar si fueron añadidas durante la reproducción
    const notesNow = activeNotesRef.current || [];

    // Filtrar notas pertenecientes a este paso rítmico
    const notesToPlay = notesNow
      .filter(
        (n: any) =>
          (n.step === stepIdx || n.stepIndex === stepIdx) &&
          !n.isRest &&
          n.midiNumber !== undefined
      )
      .map((n: any) => n.midiNumber as number);

    if (notesToPlay.length > 0) {
      // Si es un acorde o nota individual, disparar con el sintetizador acústico
      pianoPreviewSynth.playChord(notesToPlay, 1.2, 90);
    }
  }, []);

  const playBassStep = useCallback((stepIndex: number, hitTime?: number) => {
    const currentStepNotes =
      activeNotesRef.current?.filter(
        (n: any) =>
          (n.step === stepIndex || n.stepIndex === stepIndex) &&
          (n.string !== undefined || n.stringIndex !== undefined) &&
          n.fret !== undefined
      ) || [];

    currentStepNotes.forEach((note: any) => {
      // Convertir cuerda y traste a número MIDI (para bajo estándar de 4 cuerdas: E1, A1, D2, G2)
      const baseMidiByString: Record<number, number> = {
        0: 43, // 1ª cuerda: G2 (0-indexed)
        1: 43, // 1ª cuerda: G2 (1-indexed)
        2: 38, // 2ª cuerda: D2
        3: 33, // 3ª cuerda: A1
        4: 28, // 4ª cuerda: E1
      };

      const isZeroIndexed = note.string === undefined && note.stringIndex !== undefined;
      const resolvedStringIndex = isZeroIndexed
        ? note.stringIndex
        : Math.max(0, (note.string || 4) - 1); // 0 = G, 1 = D, 2 = A, 3 = E
      const stringBase = isZeroIndexed
        ? getBassMidiFromString(note.stringIndex, 0, true)
        : baseMidiByString[note.string] ?? 28;
      const calculatedMidi = stringBase + (note.fret || 0);
      const tech = ((note.technique || 'normal').toLowerCase()) as BassTechnique;
      const stepDuration = getStepDuration();

      bassPreviewSynth.playNote({
        midi: calculatedMidi,
        technique: tech,
        slideDirection: note.slideDirection,
        stringIndex: resolvedStringIndex,
        duration: stepDuration * 3.8, // Permitir que las notas con espacio resuenen
        velocity: tech === 'pop' || tech === 'slap' ? 120 : 105,
        scheduleTime: hitTime,
      });
    });
  }, [getStepDuration]);

  const playGuitarStep = useCallback((stepIndex: number, hitTime?: number) => {
    const currentStepNotes =
      activeNotesRef.current?.filter(
        (n: any) =>
          (n.step === stepIndex || n.stepIndex === stepIndex) &&
          (n.string !== undefined || n.stringIndex !== undefined) &&
          n.fret !== undefined
      ) || [];

    currentStepNotes.forEach((note: any) => {
      const isZeroIndexed = note.string === undefined && note.stringIndex !== undefined;
      const strVal = isZeroIndexed ? note.stringIndex : note.string;
      const calculatedMidi = getGuitarMidiFromString(strVal, note.fret || 0, isZeroIndexed);
      const rawTech = (note.technique || 'normal').toLowerCase();
      const tech = (rawTech === 'pull' ? 'pulloff' : rawTech) as GuitarTechnique;
      const stepDuration = getStepDuration();

      guitarPreviewSynth.playNote({
        midi: calculatedMidi,
        technique: tech,
        slideDirection: note.slideDirection,
        bendType: note.bendType,
        bendAmount: note.bendAmount,
        duration: stepDuration * 3.5,
        velocity: tech === 'natural_harmonic' || tech === 'pinch_harmonic' ? 115 : 100,
        time: hitTime,
        scheduleTime: hitTime,
      });
    });
  }, [getStepDuration]);

  const scheduleStep = useCallback(
    (stepNumber: number, time: number) => {
      const liveInstrument = instrumentRef.current;
      const liveStepsPerMeasure = stepsPerMeasureRef.current;
      const notesNow = activeNotesRef.current || [];

      if (liveInstrument === 'drums') {
        const engine = getAudioEngine();
        const hits = notesNow.filter((n) => n.step === stepNumber && n.drumVoice);
        const liveTotalSteps = Math.max(1, totalStepsRef.current);
        hits.forEach((h) => {
          const isFoot = h.drumVoice === 'kick';
          const lastInfo = lastDrumStickingRef.current[h.drumVoice!];
          const stepDiff = lastInfo ? (stepNumber - lastInfo.step + liveTotalSteps) % liveTotalSteps : 999;
          const isDoubleRebound =
            !isFoot &&
            Boolean(h.sticking) &&
            lastInfo?.sticking === h.sticking &&
            !h.accent &&
            stepDiff <= 2;

          lastDrumStickingRef.current[h.drumVoice!] = {
            sticking: h.sticking || 'R',
            step: stepNumber,
            accent: !!h.accent,
          };

          engine.trigger({
            instrument: h.drumVoice!,
            time,
            velocity: 0.85,
            accent: !!h.accent,
            sticking: isFoot ? null : (h.sticking as 'R' | 'L') || 'R',
            isDoubleRebound,
          });
        });
        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, stepNumber % liveStepsPerMeasure === 0);
        }
      } else if (liveInstrument === 'piano') {
        const engine = getPianoAudioEngine();
        const ctx = engine.getAudioContext();
        const delayMs = ctx ? Math.max(0, (time - ctx.currentTime) * 1000) : 0;

        if (delayMs <= 15) {
          playStepAudio(stepNumber);
        } else {
          window.setTimeout(() => {
            if (isPlayingRef.current) {
              playStepAudio(stepNumber);
            }
          }, delayMs);
        }

        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, stepNumber % liveStepsPerMeasure === 0);
        }
      } else if (liveInstrument === 'bass') {
        const engine = getStringsAudioEngine();
        playBassStep(stepNumber, time);

        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, stepNumber % liveStepsPerMeasure === 0);
        }
      } else if (liveInstrument === 'guitar') {
        const engine = getStringsAudioEngine();
        playGuitarStep(stepNumber, time);

        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, stepNumber % liveStepsPerMeasure === 0);
        }
      } else {
        const engine = getStringsAudioEngine();
        const stringNotes = notesNow.filter(
          (n) => n.step === stepNumber && n.string !== undefined && n.fret !== undefined
        );
        stringNotes.forEach((n) => {
          engine.triggerNote(
            'guitar_6',
            n.string!,
            n.fret!,
            time,
            n.technique === 'pm' ? 'normal' : n.technique || 'normal',
            0.85
          );
        });
        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, stepNumber % liveStepsPerMeasure === 0);
        }
      }
    },
    [isBeatStep, playBassStep, playGuitarStep, playStepAudio]
  );

  const schedulerLoop = useCallback(() => {
    const liveInstrument = instrumentRef.current;
    const liveTotalSteps = Math.max(1, totalStepsRef.current);

    const audioCtx =
      liveInstrument === 'drums'
        ? getAudioEngine().getAudioContext()
        : liveInstrument === 'piano'
        ? getPianoAudioEngine().getAudioContext()
        : getStringsAudioEngine().getAudioContext();

    if (!audioCtx) return;

    while (nextNoteTimeRef.current < audioCtx.currentTime + 0.08) {
      const currentStep = playStepRef.current;
      const hitTime = nextNoteTimeRef.current;

      anchorStepRef.current = currentStep;
      anchorAudioTimeRef.current = hitTime;

      scheduleStep(currentStep, hitTime);

      nextNoteTimeRef.current += getStepDuration();
      playStepRef.current += 1;
      if (playStepRef.current >= liveTotalSteps) {
        playStepRef.current = 0;
      }
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(schedulerLoop, 20);
    }
  }, [getStepDuration, scheduleStep]);

  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;

    const liveInstrument = instrumentRef.current;
    const audioCtx =
      liveInstrument === 'drums'
        ? getAudioEngine().getAudioContext()
        : liveInstrument === 'piano'
        ? getPianoAudioEngine().getAudioContext()
        : getStringsAudioEngine().getAudioContext();

    const liveTotalSteps = Math.max(1, totalStepsRef.current);
    const liveStepsPerMeasure = Math.max(1, stepsPerMeasureRef.current);
    const liveTotalMeasures = Math.max(1, totalMeasuresRef.current);

    if (audioCtx && anchorAudioTimeRef.current > 0) {
      const stepDuration = getStepDuration();
      const deltaFromAnchor = audioCtx.currentTime - anchorAudioTimeRef.current;
      const exactStep = anchorStepRef.current + deltaFromAnchor / stepDuration;

      const currentGlobalStep =
        ((Math.floor(exactStep) % liveTotalSteps) + liveTotalSteps) % liveTotalSteps;

      setPlaybackActiveStep(currentGlobalStep);

      const currentPlayingMeasure = Math.floor(currentGlobalStep / liveStepsPerMeasure);
      if (
        currentPlayingMeasure !== currentMeasureRef.current &&
        currentPlayingMeasure < liveTotalMeasures
      ) {
        currentMeasureRef.current = currentPlayingMeasure;
        setCurrentMeasure(currentPlayingMeasure);
      }
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [getStepDuration]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;

      if (instrument === 'piano') {
        pianoPreviewSynth.getAudioContext();
      } else if (instrument === 'bass') {
        bassPreviewSynth.getAudioContext();
      }

      const engine =
        instrument === 'drums'
          ? getAudioEngine()
          : instrument === 'piano'
          ? getPianoAudioEngine()
          : getStringsAudioEngine();
      engine.init();
      engine.resume();
      const ctx = engine.getAudioContext();
      const startTime = (ctx ? ctx.currentTime : 0) + 0.03;

      audioStartTimeRef.current = startTime;
      nextNoteTimeRef.current = startTime;
      const initialStep = currentMeasure * stepsPerMeasure;
      playStepRef.current = initialStep;
      playStartStepRef.current = initialStep;
      anchorStepRef.current = initialStep;
      anchorAudioTimeRef.current = startTime;
      lastDrumStickingRef.current = {};
      setPlaybackActiveStep(initialStep);

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
    playStartStepRef.current = 0;
    audioStartTimeRef.current = 0;
    anchorStepRef.current = 0;
    anchorAudioTimeRef.current = 0;
    lastDrumStickingRef.current = {};
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
    } else if (instrument === 'piano') {
      const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      formattedData = notes
        .filter((n) => n.midiNumber !== undefined || n.isRest)
        .map((n) => {
          const midi = n.midiNumber ?? 60;
          const noteName = `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
          const hand = midi < 60 ? 'left' : 'right';
          return {
            step: n.step,
            midiNumber: midi,
            noteName,
            velocity: n.velocity ?? 100,
            durationSteps: n.durationSteps ?? 1,
            duration: n.duration ?? 'quarter',
            isRest: !!n.isRest,
            hand,
            finger: n.finger ? parseInt(n.finger, 10) : undefined,
          };
        });
    } else {
      formattedData = notes
        .filter((n) => n.string !== undefined && n.fret !== undefined)
        .map((n) => ({
          step: n.step,
          string: n.string,
          fret: n.fret,
          technique: n.technique ?? 'normal',
          slideDirection: n.slideDirection,
          bendType: n.bendType,
          bendAmount: n.bendAmount,
          finger: n.finger ?? '1',
          velocity: 0.85,
        }));
    }

    try {
      if (destination === 'mastery') {
        let tabString = '';
        if (instrument === 'piano') {
          const sorted = [...notes].filter((n) => n.midiNumber !== undefined).sort((a, b) => a.step - b.step);
          const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const names = sorted.map((n) => `${NOTE_NAMES[n.midiNumber! % 12]}${Math.floor(n.midiNumber! / 12) - 1}`);
          tabString = `MD: [${names.slice(0, 16).join(' - ')}]`;
        } else if (instrument === 'drums') {
          const sorted = [...notes].filter((n) => n.drumVoice !== undefined).sort((a, b) => a.step - b.step);
          tabString = `SD: | ${sorted.map((n) => (n.drumVoice === 'snare' ? 'o' : n.drumVoice === 'kick' ? 'B' : 'x')).slice(0, 16).join(' ')} |`;
        } else {
          const sorted = [...notes].filter((n) => n.string !== undefined && n.fret !== undefined).sort((a, b) => a.step - b.step);
          tabString = sorted
            .map((n) => {
              const hasUp = n.technique === 'slide_up' || n.slideDirection === 'up';
              const hasDown = n.technique === 'slide_down' || n.slideDirection === 'down';
              return `C${n.string}:${hasUp ? '/' : ''}${n.fret}${hasDown ? '\\' : ''}`;
            })
            .slice(0, 16)
            .join(' ');
          if (!tabString) tabString = `e|---5-7-8---|\nB|---5-7-8---|`;
        }

        addCustomMasteryLevel(instrument, {
          title,
          technique: category,
          initialBpm: Math.round(bpm * 0.75),
          targetBpm: bpm,
          targetReps: 3,
          subdivision,
          tabOrNotation: tabString,
          level: masteryLevel,
          description: `Ejercicio compuesto en Studio Builder: ${title}`,
          difficultyLabel: difficulty === 'Básico' ? 'Básico-Medio' : difficulty === 'Intermedio' ? 'Intermedio' : 'Avanzado',
        });

        // Intentar guardar también en BD
        const normalizedSub = normalizeSubdivisionKey(subdivision);
        saveExerciseAction({
          instrumentType: instrument,
          title,
          category,
          difficulty,
          bpm,
          timeSignature,
          totalMeasures,
          stepsPerMeasure,
          subdivision: normalizedSub,
          data: formattedData,
        }).catch(() => {});
 
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (err) {
          console.error('Error eliminando borrador tras guardar en mastery:', err);
        }

        setSaveResult({
          success: true,
          url: '/mastery',
        });
        return;
      }

      const normalizedSub = normalizeSubdivisionKey(subdivision);
      const res = await saveExerciseAction({
        slug: editingSlug || undefined,
        instrumentType: instrument,
        title,
        category,
        difficulty,
        bpm,
        timeSignature,
        totalMeasures,
        stepsPerMeasure,
        subdivision: normalizedSub,
        data: formattedData,
      });

      if (res.success) {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (err) {
          console.error('Error eliminando borrador tras publicar:', err);
        }

        saveLocalExercise({
          slug: res.slug,
          instrumentType: instrument,
          title,
          category,
          difficulty,
          bpmDefault: bpm,
          bpm,
          timeSignature,
          subdivision: normalizedSub,
          totalSteps,
          totalMeasures,
          stepsPerMeasure,
          hitsData: instrument === 'drums' ? formattedData : undefined,
          tabData: instrument !== 'drums' ? formattedData : undefined,
          instrument: instrument === 'drums' ? 'drums' : instrument === 'bass' ? 'bass_4' : instrument === 'piano' ? 'piano' : 'guitar_6',
        });

        if (editingSlug) {
          toast.success(`Ejercicio "${title}" actualizado con éxito.`);
        } else {
          toast.success(`Ejercicio "${title}" publicado con éxito.`);
        }
      }

      const practiceUrl =
        res.url ||
        (instrument === 'piano'
          ? `/piano/practice/${res.slug}`
          : instrument === 'drums'
          ? `/drums/practice/${res.slug}`
          : `/strings/practice/${res.slug}`);

      setSaveResult({ ...res, url: practiceUrl });
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Volver al inicio"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0891b2]/15 text-[#0891b2] border border-[#0891b2]/30 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
                Studio Builder
              </span>
              {editingSlug && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" />
                  Modo Edición
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                {totalMeasures} {totalMeasures === 1 ? 'Compás' : 'Compases'} ({totalSteps} Pasos)
              </span>
            </div>

            {/* Título editable in-line */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#0891b2] dark:focus:border-cyan-500 focus:outline-none transition-colors w-full sm:w-[380px]"
              placeholder="Nombre del Ejercicio..."
            />
          </div>
        </div>

        {/* Selector de Instrumento */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-zinc-900/80 border border-slate-300/80 dark:border-white/5">
            <button
              onClick={() => handleSelectInstrument('drums')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                instrument === 'drums'
                  ? 'bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950 dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Drum className="w-3.5 h-3.5" />
              <span>Batería</span>
            </button>

            <button
              onClick={() => handleSelectInstrument('bass')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                instrument === 'bass'
                  ? 'bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950 dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Bajo (4C)</span>
            </button>

            <button
              onClick={() => handleSelectInstrument('guitar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                instrument === 'guitar'
                  ? 'bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950 dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guitarra (6C)</span>
            </button>

            <button
              onClick={() => handleSelectInstrument('piano')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                instrument === 'piano'
                  ? 'bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950 dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <KeyboardMusic className="w-3.5 h-3.5" />
              <span>Piano</span>
            </button>
          </div>

          {/* Botón Limpiar / Nuevo Ejercicio */}
          <button
            onClick={handleClearDraft}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 dark:bg-white/5 dark:hover:bg-rose-500/15 dark:text-zinc-400 dark:hover:text-rose-300 dark:border-white/10 dark:hover:border-rose-500/30 font-semibold text-xs transition-colors"
            title="Descartar borrador y empezar un ejercicio nuevo en blanco"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo / Limpiar</span>
          </button>

          {/* Botón Exportar PDF */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 transition-all shadow-sm"
            title="Abrir vista previa y exportar a PDF para impresión"
          >
            <span>📄 Exportar PDF</span>
          </button>

          {/* Botón Guardar / Publicar Ejercicio */}
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-cyan-400 dark:text-zinc-950 font-bold text-xs dark:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : editingSlug ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{editingSlug ? 'Guardar Cambios' : 'Publicar Ejercicio'}</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 rounded-2xl glass-panel border border-slate-200 dark:border-white/5 text-xs shadow-sm">
        {/* Métrica / Time Signature */}
        <div>
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold block mb-1">Métrica</label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value as any)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="4/4">4/4 (Cuaternario)</option>
            <option value="6/8">6/8 (Compuesto)</option>
            <option value="7/8">7/8 (Amorfo/Progresivo)</option>
          </select>
        </div>

        {/* Subdivisión */}
        <div>
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold block mb-1">Subdivisión</label>
          <select
            value={normalizeSubdivisionKey(subdivision)}
            onChange={(e) => setSubdivision(normalizeSubdivisionKey(e.target.value) as any)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <optgroup label="── SUBDIVISIONES REGULARES ──" className="bg-slate-950 text-slate-400 font-bold">
              <option value="1/4">1/4 (Negras - 4 pasos)</option>
              <option value="1/8">1/8 (Corcheas - 8 pasos)</option>
              <option value="1/16">1/16 (Semicorcheas - 16 pasos)</option>
              <option value="1/32">1/32 (Fusas - 32 pasos)</option>
            </optgroup>
            <optgroup label="── SUBDIVISIONES IRREGULARES (TRESILLOS / POLIRRITMIA) ──" className="bg-slate-950 text-amber-400 font-bold">
              <option value="1/8T">1/8T (Tresillos de Corchea - 12 pasos)</option>
              <option value="1/16T">1/16T (Tresillos de Semicorchea - 24 pasos)</option>
              <option value="quintillo">Quintillo (5:4 - 20 pasos)</option>
              <option value="septillo">Septillo (7:4 - 28 pasos)</option>
            </optgroup>
          </select>
        </div>

        {/* BPM */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">Tempo</label>
            <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{bpm} BPM</span>
          </div>
          <input
            type="range"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Dificultad */}
        <div>
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold block mb-1">Dificultad</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold block mb-1">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
          >
            {(instrument === 'drums'
              ? DRUM_CATEGORIES
              : instrument === 'piano'
              ? PIANO_CATEGORIES
              : STRINGS_CATEGORIES
            ).map((cat) => (
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
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar Loop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-cyan-600 dark:text-cyan-400" />
                <span>Probar Audio / Loop</span>
              </>
            )}
          </button>
        </div>

        {/* Destino del Ejercicio: Biblioteca General vs Asignar a Ruta Técnica */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-6 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[11px] font-mono font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" />
              Destino del Ejercicio:
            </span>

            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-zinc-900/90 p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDestination('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  destination === 'general'
                    ? 'bg-slate-900 dark:bg-zinc-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Biblioteca General
              </button>

              <button
                type="button"
                onClick={() => setDestination('mastery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  destination === 'mastery'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Asignar a Ruta Técnica</span>
              </button>
            </div>
          </div>

          {destination === 'mastery' && (
            <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-amber-500/40">
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                Nivel Asignado:
              </span>
              <input
                type="number"
                min={1}
                max={99}
                value={masteryLevel}
                onChange={(e) => setMasteryLevel(parseInt(e.target.value) || 11)}
                className="w-16 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-white/20 text-xs font-mono font-bold text-center text-slate-900 dark:text-white"
              />
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                ({instrument.toUpperCase()})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Gestor de Compases (Barra de Pestañas de Compás Ilimitada) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        {/* Contenedor flexible de pestañas de compases */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {measures.map((m, idx) => {
            const isSelected = currentMeasure === idx;
            const noteCount = m.notes?.length || 0;

            return (
              <button
                key={`measure-tab-${idx}`}
                type="button"
                onClick={() => {
                  setCurrentMeasure(idx);
                  setActiveCell(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <span>Compás {idx + 1}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  {noteCount} {noteCount === 1 ? 'nota' : 'notas'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barra de acciones de compás (Sin límites) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddMeasure}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-slate-700 hover:border-cyan-400 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Compás</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicateMeasure}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>❐ Duplicar Compás</span>
            </button>

            {measures.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteMeasure(currentMeasure)}
                className="p-2 rounded-xl text-xs font-bold bg-rose-950/50 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-900/60 transition-all cursor-pointer"
                title={`Eliminar Compás ${currentMeasure + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Total: <strong className="text-cyan-400">{measures.length}</strong> {measures.length === 1 ? 'compás' : 'compases'}
          </span>
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

            {/* Separador vertical */}
            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            {/* Pads de Pre-escucha Rápida Acústica */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mr-1">Pads:</span>
              {[
                { voice: 'kick', label: 'Bombo', color: 'hover:border-amber-400 hover:text-amber-300' },
                { voice: 'snare', label: 'Snare', color: 'hover:border-cyan-400 hover:text-cyan-300' },
                { voice: 'hihat_closed', label: 'HH Cerrado', color: 'hover:border-yellow-400 hover:text-yellow-300' },
                { voice: 'hihat_open', label: 'HH Abierto', color: 'hover:border-amber-400 hover:text-amber-300' },
                { voice: 'tom1', label: 'Tom 1', color: 'hover:border-emerald-400 hover:text-emerald-300' },
                { voice: 'tom2', label: 'Tom 2', color: 'hover:border-teal-400 hover:text-teal-300' },
                { voice: 'floor_tom', label: 'Granadero', color: 'hover:border-orange-400 hover:text-orange-300' },
                { voice: 'ride', label: 'Ride', color: 'hover:border-indigo-400 hover:text-indigo-300' },
                { voice: 'crash', label: 'Crash', color: 'hover:border-pink-400 hover:text-pink-300' },
              ].map((pad) => (
                <button
                  key={`audition-pad-${pad.voice}`}
                  type="button"
                  onClick={() => {
                    const isFoot = pad.voice === 'kick';
                    playDrumHit({
                      instrument: pad.voice,
                      velocity: 95,
                      accent: selectedAccent,
                      sticking: isFoot ? null : (selectedSticking as 'R' | 'L') || 'R',
                    });
                  }}
                  className={`px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 text-[11px] font-semibold text-zinc-300 active:scale-95 transition-all ${pad.color}`}
                  title={`Probar sonido de ${pad.label}`}
                >
                  {pad.label}
                </button>
              ))}
            </div>
          </div>
        ) : instrument === 'piano' ? (
          // Controles para Piano / Teclado
          <div className="flex flex-wrap items-center justify-between w-full gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Modo Teclado:</span>
              <span className="px-2.5 py-1 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <KeyboardMusic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rango C2 - C6 (49 Teclas Polifónicas)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const sourceStart = currentMeasure * stepsPerMeasure;
                  const sourceEnd = sourceStart + stepsPerMeasure;
                  setNotes((prev) => {
                    const next = prev.filter((n) => n.step < sourceStart || n.step >= sourceEnd);
                    activeNotesRef.current = next;
                    return next;
                  });
                }}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 text-[11px] font-medium transition-colors"
                title="Limpiar todas las notas de este compás"
              >
                Limpiar Compás {currentMeasure + 1}
              </button>
            </div>
          </div>
        ) : (
          // Controles de Técnicas para Bajo y Guitarra
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mr-1">Técnica Activa:</span>

            {(instrument === 'guitar' ? GUITAR_TECHNIQUES : BASS_TECHNIQUES).map((tech) => {
              const isSelected =
                selectedTechnique === tech.id ||
                (selectedTechnique === 'pull' && tech.id === 'pulloff') ||
                (selectedTechnique === 'pulloff' && tech.id === 'pull');
              return (
                <button
                  key={tech.id}
                  onClick={() => {
                    handleSetTechnique(tech.id as StringTechnique);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tech.symbol ? (
                    <span className="text-[10px] font-mono font-black opacity-85 px-1 py-0.5 rounded bg-black/30">
                      {tech.symbol}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold opacity-70">•</span>
                  )}
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
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-300 dark:border-slate-800 ml-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Traste:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={selectedFret.toString()}
                onChange={handleFretInputChange}
                onFocus={handleFretInputFocus}
                className="w-10 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 text-teal-800 dark:text-cyan-300 rounded-lg py-0.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Sub-Barra Contextual de Bending para Guitarra */}
            {instrument === 'guitar' && selectedTechnique === 'bend' && (
              <div className="w-full flex flex-wrap items-center gap-3 bg-slate-950/95 px-3 py-2 rounded-xl border border-emerald-500/30 mt-2">
                {/* Selector de Modo de Bend */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mr-1">
                    MODO:
                  </span>
                  {BEND_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setSelectedBendType(type.id);
                        if (activeCell && activeCell.string !== undefined) {
                          setNotes((prev) => {
                            const next: EditorNote[] = prev.map((n) =>
                              n.step === activeCell.step && n.string === activeCell.string
                                ? { ...n, technique: 'bend' as StringTechnique, bendType: type.id }
                                : n
                            );
                            activeNotesRef.current = next;
                            return next;
                          });
                          const activeNote = notes.find(n => n.step === activeCell.step && n.string === activeCell.string);
                          if (activeNote) {
                            const calculatedMidi = getGuitarMidiFromString(activeCell.string, activeNote.fret ?? selectedFret);
                            guitarPreviewSynth.playNote({
                              midi: calculatedMidi,
                              technique: 'bend',
                              bendType: type.id,
                              bendAmount: activeNote.bendAmount || selectedBendAmount,
                              duration: (60 / bpmRef.current) * 0.8,
                              velocity: 100,
                            });
                          }
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedBendType === type.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-800" />

                {/* Selector de Recorrido / Tono */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider mr-1">
                    TONO:
                  </span>
                  {BEND_AMOUNTS.map((amt) => (
                    <button
                      key={amt.id}
                      type="button"
                      onClick={() => {
                        setSelectedBendAmount(amt.id);
                        if (activeCell && activeCell.string !== undefined) {
                          setNotes((prev) => {
                            const next: EditorNote[] = prev.map((n) =>
                              n.step === activeCell.step && n.string === activeCell.string
                                ? { ...n, technique: 'bend' as StringTechnique, bendAmount: amt.id }
                                : n
                            );
                            activeNotesRef.current = next;
                            return next;
                          });
                          const activeNote = notes.find(n => n.step === activeCell.step && n.string === activeCell.string);
                          if (activeNote) {
                            const calculatedMidi = getGuitarMidiFromString(activeCell.string, activeNote.fret ?? selectedFret);
                            guitarPreviewSynth.playNote({
                              midi: calculatedMidi,
                              technique: 'bend',
                              bendType: activeNote.bendType || selectedBendType,
                              bendAmount: amt.id,
                              duration: (60 / bpmRef.current) * 0.8,
                              velocity: 100,
                            });
                          }
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedBendAmount === amt.id
                          ? 'bg-teal-400 text-slate-950 border-teal-300 font-black shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {amt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Rejilla Interactiva según el Instrumento */}
      {instrument === 'piano' ? (
        <PianoRollBuilder
          currentMeasure={currentMeasure}
          totalMeasures={totalMeasures}
          totalSteps={stepsPerMeasure}
          activeSubdivision={subdivision}
          notes={notes}
          onToggleNote={handleTogglePianoNote}
          onToggleSingleNote={handleTogglePianoNote}
          onAddNote={handleAddPianoNote}
          onToggleRest={handleTogglePianoRest}
          onAddChordToStep={handleAddChordToPianoStep}
          isPlaying={isPlaying}
          playbackActiveStep={playbackActiveStep}
          measureStartStep={activeMeasureStart}
          timeSignature={timeSignature}
          editorViewMode={editorViewMode}
          onViewModeChange={setEditorViewMode}
          tempo={bpm}
          onTogglePlay={handleTogglePlay}
          onStartPlayback={() => {
            if (!isPlayingRef.current) handleTogglePlay();
          }}
          onStopPlayback={() => {
            if (isPlayingRef.current) handleTogglePlay();
          }}
          onQuantizeMeasure={handleQuantizePianoMeasure}
          onSelectMeasure={handleSelectMeasure}
          onAddMeasure={handleAddMeasure}
        />
      ) : (
      <div 
        className={`w-full overflow-x-auto rounded-2xl p-4 sm:p-6 transition-all relative ${
          instrument === 'drums'
            ? 'glass-panel border border-slate-200 dark:border-white/10 shadow-xl'
            : 'border-2 border-[#2b1810] shadow-2xl'
        }`}
        style={
          instrument !== 'drums'
            ? {
                background: 'linear-gradient(180deg, #1c0e08 0%, #2e170d 25%, #3d1f11 50%, #2e170d 75%, #180c07 100%)',
                boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.3)',
              }
            : undefined
        }
      >
        <div className="min-w-[760px] flex flex-col">
          {/* Cabecera de Pasos / Tiempos */}
          <div className={`flex items-center pb-2 mb-2 font-mono text-xs ${
            instrument === 'drums' ? 'border-b border-white/10' : 'border-b border-[#4d2817]'
          }`}>
            <div className={`w-24 shrink-0 text-[11px] font-bold uppercase ${
              instrument === 'drums' ? 'text-slate-500 dark:text-zinc-400' : 'text-amber-200/90'
            }`}>
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
                          ? instrument === 'drums'
                            ? 'text-cyan-500 dark:text-cyan-400 text-sm font-black'
                            : 'text-amber-300 text-sm font-black'
                          : instrument === 'drums'
                          ? 'text-slate-400 dark:text-slate-500 font-semibold text-[11px]'
                          : 'text-amber-200/50 font-semibold text-[11px]'
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
                          ? instrument === 'drums'
                            ? 'bg-cyan-400 ring-2 ring-cyan-400/30'
                            : 'bg-amber-400 ring-2 ring-amber-400/30'
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
                <button
                  type="button"
                  onClick={() => {
                    const isFoot = row.voice === 'kick';
                    const targetInstrument = row.voice === 'hihat' ? 'hihat_closed' : row.voice;
                    playDrumHit({
                      instrument: targetInstrument,
                      velocity: 95,
                      accent: selectedAccent,
                      sticking: isFoot ? null : (selectedSticking as 'R' | 'L') || 'R',
                    });
                  }}
                  title={`Probar sonido de ${row.label}`}
                  className="w-24 shrink-0 flex flex-col pr-2 text-left hover:opacity-80 active:scale-95 transition-all cursor-pointer group/label"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover/label:text-cyan-500 dark:group-hover/label:text-cyan-400 transition-colors">
                    {row.label}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-zinc-400 truncate">{row.sub}</span>
                </button>

                {/* Línea horizontal continua de pentagrama */}
                <div className="absolute left-24 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-300 dark:bg-white/15 pointer-events-none" />

                {/* Celdas de paso */}
                <div className="flex-1 grid h-full relative z-10" style={{ gridTemplateColumns: `repeat(${stepsPerMeasure}, minmax(0, 1fr))` }}>
                  {Array.from({ length: stepsPerMeasure }).map((_, stepIdx) => {
                    const globalStep = activeMeasureStart + stepIdx;
                    const isPlayback = isPlaying && playbackActiveStep === globalStep;
                    const hit = notes.find((n) => n.step === globalStep && (n.drumVoice === row.voice || (row.voice === 'hihat' && n.drumVoice === 'hihat_closed') || (row.voice === 'floor_tom' && n.drumVoice === 'granadero')));

                    return (
                      <button
                        key={`drum-cell-${row.voice}-${stepIdx}`}
                        onClick={() => handleCellClick(stepIdx, undefined, row.voice)}
                        className={`h-full flex items-center justify-center transition-all relative ${
                          isPlayback ? 'bg-cyan-500/15' : 'hover:bg-slate-100/50 dark:hover:bg-white/5'
                        }`}
                      >
                        {hit ? (
                          <div className="relative flex flex-col items-center">
                            {hit.accent && (
                              <span className="absolute -top-3 text-[11px] font-black text-cyan-500 dark:text-cyan-400">&gt;</span>
                            )}
                            {row.voice === 'hihat_open' || hit.drumVoice === 'hihat_open' ? (
                              <div className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center text-xs shadow-[0_0_14px_rgba(251,191,36,0.7)] ring-2 ring-amber-300 ring-offset-1 ring-offset-black">
                                {hit.sticking || '○'}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-cyan-400 text-zinc-950 font-bold flex items-center justify-center text-xs shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                                {hit.sticking || (row.voice === 'hihat' ? '×' : '•')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/10 group-hover:bg-slate-400 dark:group-hover:bg-white/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            // Filas de Bajo o Guitarra con Mástil Realista de Palisandro
            (instrument === 'bass' ? BASS_STRINGS : GUITAR_STRINGS).map((str) => (
              <div key={str.num} className="flex items-center h-12 relative border-b border-[#3d1f11]/60 group">
                <div className="w-24 shrink-0 flex items-center gap-2 pr-2">
                  <span className="w-5 h-5 rounded-md bg-[#140804] border border-[#5c3a28] text-amber-200 font-mono font-black text-xs flex items-center justify-center shadow-sm">
                    {str.label}
                  </span>
                  <span className="text-[10px] text-amber-200/70 truncate font-mono">{str.num}ª Cuerda</span>
                </div>

                {/* Sombra de la cuerda sobre la madera noble */}
                <div className="absolute left-24 right-0 top-1/2 translate-y-[2px] h-[2px] bg-black/60 pointer-events-none" />

                {/* Alambre metálico de acero/níquel con relieve */}
                <div 
                  className="absolute left-24 right-0 top-1/2 -translate-y-1/2 pointer-events-none" 
                  style={{
                    height: `${Math.max(1.8, (instrument === 'bass' ? (5 - str.num) * 1.0 : (7 - str.num) * 0.6))}px`,
                    background: 'linear-gradient(180deg, #f3f4f6 0%, #cbd5e1 35%, #94a3b8 70%, #475569 100%)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.8)'
                  }}
                />

                {/* Celdas de paso interactivas */}
                <div className="flex-1 grid h-full relative z-10" style={{ gridTemplateColumns: `repeat(${stepsPerMeasure}, minmax(0, 1fr))` }}>
                  {/* Capa SVG de Arcos de Ligadura en la Cuerda (Hammer-on / Pull-off) */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
                    viewBox={`0 0 ${stepsPerMeasure * 100} 48`}
                    preserveAspectRatio="none"
                  >
                    {notes
                      .filter(
                        (n) =>
                          n.string === str.num &&
                          n.step >= activeMeasureStart &&
                          n.step < activeMeasureStart + stepsPerMeasure &&
                          (n.technique === 'hammer' || n.technique === 'pull' || (n.technique as any) === 'pulloff')
                      )
                      .map((note, idx) => {
                        // Buscar la nota precedente en la misma cuerda en este compás
                        const prevNote = notes
                          .filter(
                            (n) =>
                              n.string === str.num &&
                              n.step >= activeMeasureStart &&
                              n.step < note.step
                          )
                          .sort((a, b) => b.step - a.step)[0];

                        if (!prevNote) return null;

                        const step1 = prevNote.step - activeMeasureStart;
                        const step2 = note.step - activeMeasureStart;

                        const x1 = (step1 + 0.5) * 100;
                        const x2 = (step2 + 0.5) * 100;
                        const y = 8;
                        const midX = (x1 + x2) / 2;
                        const arcControlY = y - Math.min(18, Math.abs(x2 - x1) * 0.12);

                        const isHammer = note.technique === 'hammer';
                        const color = isHammer ? '#38bdf8' : '#fbbf24'; // Cyan para Hammer, Ámbar para Pull-off

                        return (
                          <g key={`string-slur-${str.num}-${idx}`} className="select-none pointer-events-none">
                            {/* Arco Curvo de Ligadura */}
                            <path
                              d={`M ${x1} ${y} Q ${midX} ${arcControlY} ${x2} ${y}`}
                              fill="none"
                              stroke={color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Insignia tipográfica 'h' o 'p' */}
                            <text
                              x={midX}
                              y={arcControlY - 3}
                              textAnchor="middle"
                              fill={color}
                              fontSize="12"
                              fontWeight="900"
                              fontFamily="ui-monospace, monospace"
                            >
                              {isHammer ? 'h' : 'p'}
                            </text>
                          </g>
                        );
                      })}

                    {/* Capa SVG de Bending (Standard Bend, Bend & Release, Pre-Bend) */}
                    {notes
                      .filter(
                        (n) =>
                          n.string === str.num &&
                          n.step >= activeMeasureStart &&
                          n.step < activeMeasureStart + stepsPerMeasure &&
                          n.technique === 'bend'
                      )
                      .map((note, idx) => {
                        const stepInMeasure = note.step - activeMeasureStart;
                        const cx = (stepInMeasure + 0.5) * 100;
                        const cy = 24;
                        const isRelease = note.bendType === 'bend_release';
                        const isPreBend = note.bendType === 'pre_bend';
                        const amountLabel =
                          note.bendAmount === '1/4'
                            ? '¼'
                            : note.bendAmount === '1/2'
                            ? '½'
                            : note.bendAmount === '1.5'
                            ? '1½'
                            : 'Full';

                        return (
                          <g key={`bend-svg-${str.num}-${idx}`} className="pointer-events-none select-none">
                            {/* 1. Standard Bend (Flecha Curva Ascendente) */}
                            {!isRelease && !isPreBend && (
                              <>
                                <path
                                  d={`M ${cx + 10} ${cy} Q ${cx + 16} ${cy - 14} ${cx + 14} ${cy - 22}`}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                />
                                <polygon
                                  points={`${cx + 14},${cy - 26} ${cx + 11},${cy - 20} ${cx + 17},${cy - 20}`}
                                  fill="#10b981"
                                />
                              </>
                            )}

                            {/* 2. Bend & Release (Curva Parabólica Subida y Bajada) */}
                            {isRelease && (
                              <>
                                <path
                                  d={`M ${cx + 6} ${cy} Q ${cx + 14} ${cy - 26} ${cx + 22} ${cy}`}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                />
                                <polygon
                                  points={`${cx + 22},${cy + 2} ${cx + 19},${cy - 4} ${cx + 25},${cy - 4}`}
                                  fill="#10b981"
                                />
                              </>
                            )}

                            {/* 3. Pre-Bend (Flecha Vertical con Caída) */}
                            {isPreBend && (
                              <>
                                <line
                                  x1={cx + 12}
                                  y1={cy - 24}
                                  x2={cx + 12}
                                  y2={cy}
                                  stroke="#10b981"
                                  strokeWidth="2"
                                  strokeDasharray="3 3"
                                />
                                <polygon
                                  points={`${cx + 12},${cy + 2} ${cx + 9},${cy - 4} ${cx + 15},${cy - 4}`}
                                  fill="#10b981"
                                />
                              </>
                            )}

                            {/* Insignia tipográfica superior con el valor */}
                            <rect
                              x={cx - 16}
                              y={cy - 34}
                              width="32"
                              height="14"
                              rx="3"
                              fill="#022c22"
                              stroke="#10b981"
                              strokeWidth="1"
                            />
                            <text
                              x={cx}
                              y={cy - 24}
                              textAnchor="middle"
                              fill="#6ee7b7"
                              fontSize="9"
                              fontWeight="900"
                              fontFamily="ui-monospace, monospace"
                            >
                              {isPreBend ? `pb ${amountLabel}` : isRelease ? `b/r ${amountLabel}` : amountLabel}
                            </text>
                          </g>
                        );
                      })}
                  </svg>

                  {Array.from({ length: stepsPerMeasure }).map((_, stepIdx) => {
                    const globalStep = activeMeasureStart + stepIdx;
                    const isPlayback = isPlaying && playbackActiveStep === globalStep;
                    const note = notes.find((n) => n.step === globalStep && n.string === str.num);

                    return (
                      <button
                        key={`string-cell-${str.num}-${stepIdx}`}
                        onClick={() => handleCellClick(stepIdx, str.num)}
                        className={`h-full flex items-center justify-center transition-all relative ${
                          isPlayback ? 'bg-cyan-400/20 shadow-[inset_0_0_8px_rgba(34,211,238,0.4)]' : 'hover:bg-white/5'
                        }`}
                      >
                        {note ? (
                          <div className="relative flex flex-col items-center">
                            {/* Insignia de técnica */}
                            {note.technique &&
                              note.technique !== 'normal' &&
                              note.technique !== 'hammer' &&
                              note.technique !== 'pull' &&
                              (note.technique as any) !== 'pulloff' &&
                              note.technique !== 'bend' &&
                              note.technique !== 'slide_up' &&
                              note.technique !== 'slide_down' && (
                                <span className="absolute -top-3.5 text-[9px] font-mono font-black text-amber-300 bg-amber-500/30 px-1 rounded border border-amber-400/40 shadow-sm whitespace-nowrap">
                                  {getTechniqueBadge(note.technique, instrument)}
                                </span>
                              )}

                            {(() => {
                              const hasSlideUp = note.technique === 'slide_up' || note.slideDirection === 'up';
                              const hasSlideDown = note.technique === 'slide_down' || note.slideDirection === 'down';
                              const displayFretText =
                                note.technique === 'ghost'
                                  ? 'X'
                                  : `${hasSlideUp ? '/' : ''}${note.fret}${hasSlideDown ? '\\' : ''}`;

                              return (
                                <div className="relative flex items-center justify-center">
                                  {/* Trazo diagonal de entrada hacia la izquierda si es slide ascendente (/10) */}
                                  {hasSlideUp && (
                                    <span
                                      className="absolute -left-3 w-3 h-[2px] bg-emerald-400 -rotate-45 transform origin-right shadow-[0_0_6px_rgba(52,211,153,0.9)] pointer-events-none"
                                      title="Slide Ascendente de Entrada"
                                    />
                                  )}

                                  {/* Píldora de traste enmascarando la línea con alto contraste sobre la madera */}
                                  <div
                                    className={`min-w-[24px] px-1 h-6 rounded-md bg-[#0a0402] border-2 ${
                                      hasSlideUp
                                        ? 'border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                                        : hasSlideDown
                                        ? 'border-rose-400 text-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.6)]'
                                        : 'border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                                    } font-black font-mono text-xs flex items-center justify-center tracking-tighter`}
                                  >
                                    {displayFretText}
                                  </div>

                                  {/* Trazo diagonal de salida hacia la derecha si es slide descendente (8\) */}
                                  {hasSlideDown && (
                                    <span
                                      className="absolute -right-3 w-3 h-[2px] bg-rose-400 rotate-45 transform origin-left shadow-[0_0_6px_rgba(251,113,133,0.9)] pointer-events-none"
                                      title="Slide Descendente de Salida"
                                    />
                                  )}
                                </div>
                              );
                            })()}

                            {/* Dedo sugerido */}
                            {note.finger && (
                              <span className="absolute -bottom-3 text-[8px] font-mono text-amber-300 font-bold">
                                {note.finger}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-200/20 group-hover:bg-amber-200/45 transition-colors" />
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
      )}

      {/* 6. Panel Flotante / Diálogo de Edición Rápida de Traste */}
      {activeCell && activeCell.string !== undefined && instrument !== 'piano' && (
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

            {/* Selector de Slide de Entrada / Salida con Toggle */}
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-3 shrink-0">
              <span className="text-[11px] text-zinc-400 font-medium mr-1">Slide:</span>
              {(() => {
                const activeNote = notes.find((n) => n.step === activeCell.step && n.string === activeCell.string);
                const isSlideUpActive = activeNote?.slideDirection === 'up' || activeNote?.technique === 'slide_up';
                const isSlideDownActive = activeNote?.slideDirection === 'down' || activeNote?.technique === 'slide_down';

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateNoteSlide(activeCell.step, activeCell.string!, 'up')}
                      title="Slide Ascendente de Entrada (/10)"
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1 ${
                        isSlideUpActive
                          ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/50'
                      }`}
                    >
                      <span className="font-black text-sm leading-none">/</span>
                      <span>Asc.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateNoteSlide(activeCell.step, activeCell.string!, 'down')}
                      title="Slide Descendente de Salida (8\)"
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1 ${
                        isSlideDownActive
                          ? 'bg-rose-500/30 text-rose-300 border-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.4)]'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-rose-500/50'
                      }`}
                    >
                      <span className="font-black text-sm leading-none">\</span>
                      <span>Desc.</span>
                    </button>
                  </>
                );
              })()}
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
          <span>Haz clic en cualquier celda para añadir o modificar trastes/golpes. Usa <strong>+ Compás</strong> para crear patrones y obras sin límite de compases.</span>
        </div>
        <div className="text-zinc-400 font-mono text-[11px]">
          Total de notas en el ejercicio: <span className="text-cyan-400 font-bold">{notes.length}</span>
        </div>
      </div>

      {/* Modal de Exportación a PDF Editorial */}
      <PrintableScoreModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={title || 'Ejercicio de Estudio'}
        instrument={instrument}
        tempo={bpm}
        subdivision={subdivision}
        measures={printableMeasures}
      />
    </div>
  );
};
