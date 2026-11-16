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
  PATTERN_PALETTE,
  getPatternStyle,
  extractPatternBankFromMeasures,
  analyzeMeasureDuplicates,
  computeMeasureFingerprint,
  remapNotesToNewSubdivision,
  inferSubdivisionFromSteps,
  PatternSummary,
} from '@/lib/music/measureFingerprint';
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
import {
  normalizeSubdivisionKey,
  getStepsForSubdivision,
  getStepCountLabel,
} from '@/lib/music-theory/rhythmSubdivisions';
import {
  TIME_SIGNATURE_OPTIONS,
  getTimeSignatureSpec,
  calculateStepsForMeasure,
  getStepCountLabelForTimeSignature,
} from '@/lib/music/timeSignatures';
import { normalizeInstrumentKey } from '@/lib/music-theory/instrumentUtils';
import { validateLegatoTechnique } from './StudioBuilderView';
import { PrintableScoreModal } from '@/components/studio/PrintableScoreModal';
import type { ScoreMeasure } from '@/components/studio/ExtendedScoreView';

export {
  getStepRhythmLabel,
  getStepCountLabel,
  getStepLabel,
  AVAILABLE_FRETS,
  validateLegatoTechnique,
  QUANTIZE_OPTIONS,
  getQuantizedStep,
};
export type { QuantizeValue };


type InstrumentCategory = 'drums' | 'bass' | 'guitar' | 'piano';
type SubdivisionType = '1/4' | '1/8' | '1/16' | '1/32' | '1/8T' | '1/16T' | 'quintillo' | 'septillo';

export interface MeasureConfigItem {
  measureIndex: number;
  patternCode: string;
  patternName: string;
  patternColor: string;
  timeSignature?: string;
  subdivision: SubdivisionType | string;
  stepsPerMeasure: number;
  startStep: number;
  endStep: number;
  notes?: any[];
}

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
  ghost?: boolean;
  syncopated?: boolean;
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
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
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
      } catch { }
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
              loadedNotes = hits.map((h: any) => {
                const voice = normalizeDrumVoice(h.instrument || h.drumType || h.instrumentKey || 'snare');
                const isKick = voice === 'kick' || (voice as string) === 'bombo';
                return {
                  step: h.step !== undefined ? h.step : h.stepIndex !== undefined ? h.stepIndex : 0,
                  drumVoice: voice,
                  accent: !!h.accent && !h.ghost,
                  ghost: !!h.ghost,
                  syncopated: !!h.syncopated,
                  sticking: isKick ? 'K' : (h.sticking || 'R'),
                  velocity: h.ghost ? 0.32 : (h.velocity ?? 0.8),
                };
              });
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

            // Restaurar Banco de Patrones Completo (sin perder patrones P2, P3, P4... creados con 0x usos en secuencia)
            let restoredBank: PatternSummary[] = [];
            if (Array.isArray(exerciseData.patternBank) && exerciseData.patternBank.length > 0) {
              restoredBank = exerciseData.patternBank.map((p: any) => ({
                code: p.code || 'P1',
                name: p.name || `Patrón ${p.code || '1'}`,
                color: p.color || 'cyan',
                timeSignature: p.timeSignature || loadedTimeSig,
                subdivision: normalizeSubdivisionKey(p.subdivision || loadedSubKey),
                stepsPerMeasure: p.stepsPerMeasure || calculateStepsForMeasure(p.timeSignature || loadedTimeSig, p.subdivision || loadedSubKey),
                sampleMeasureIndex: p.sampleMeasureIndex ?? 0,
                usageCount: p.usageCount ?? 0,
                notes: Array.isArray(p.notes) ? p.notes : [],
              }));
            }

            // Extraer y combinar con cualquier patrón referenciado en compases
            if (Array.isArray(exerciseData.measures) && exerciseData.measures.length > 0) {
              const bankFromMeasures = extractPatternBankFromMeasures(
                exerciseData.measures,
                loadedSubKey,
                stepsInLoadedMeasure
              );

              bankFromMeasures.forEach((mPat) => {
                const existingIdx = restoredBank.findIndex((p) => p.code === mPat.code);
                if (existingIdx === -1) {
                  restoredBank.push(mPat);
                } else {
                  restoredBank[existingIdx].usageCount = mPat.usageCount;
                  if ((!restoredBank[existingIdx].notes || restoredBank[existingIdx].notes.length === 0) && mPat.notes && mPat.notes.length > 0) {
                    restoredBank[existingIdx].notes = mPat.notes;
                  }
                }
              });

              const analyzed = analyzeMeasureDuplicates(
                exerciseData.measures,
                loadedSubKey,
                stepsInLoadedMeasure
              );
              const nextAssign: Record<
                number,
                {
                  patternCode: string;
                  patternName: string;
                  patternColor: string;
                  timeSignature?: string;
                  subdivision?: string;
                  stepsPerMeasure?: number;
                }
              > = {};
              analyzed.forEach((item) => {
                nextAssign[item.measureIndex] = {
                  patternCode: item.patternCode,
                  patternName: item.patternName,
                  patternColor: item.patternColor,
                  timeSignature: item.timeSignature || loadedTimeSig,
                  subdivision: item.subdivision,
                  stepsPerMeasure: item.stepsPerMeasure,
                };
              });
              setMeasureAssignments(nextAssign);
              setTotalMeasures(Math.max(1, exerciseData.measures.length));
            }

            if (restoredBank.length > 0) {
              setPatternBank(restoredBank);
            }

            if (loadedNotes.length > 0) {
              activeNotesRef.current = loadedNotes;
              setNotes(loadedNotes);
              if (!Array.isArray(exerciseData.measures) || exerciseData.measures.length === 0) {
                const maxStep = Math.max(...loadedNotes.map((n) => n.step), 0);
                const calculatedMeasures = Math.max(
                  1,
                  Math.ceil((maxStep + 1) / stepsInLoadedMeasure)
                );
                setTotalMeasures(calculatedMeasures);
              }
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
  const [selectedGhost, setSelectedGhost] = useState<boolean>(false);
  const [selectedSyncopated, setSelectedSyncopated] = useState<boolean>(false);

  // Atajos de teclado rápidos para articulación de batería (G = Ghost Note, S = Sincopado)
  useEffect(() => {
    if (instrument !== 'drums') return;
    const handleArticulationHotkeys = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.code === 'KeyG' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSelectedGhost((prev) => {
          const next = !prev;
          if (next) setSelectedAccent(false);
          return next;
        });
      } else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSelectedSyncopated((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleArticulationHotkeys);
    return () => window.removeEventListener('keydown', handleArticulationHotkeys);
  }, [instrument]);

  // Notas almacenadas del ejercicio (adaptadas por defecto al instrumento seleccionado)
  const [notes, setNotes] = useState<EditorNote[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem(`studio_builder_draft_${instrument}`);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.notes && Array.isArray(parsed.notes)) return parsed.notes;
        }
      } catch { }
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

  // ============================================================================
  // BANCO DE PATRONES (P1..P12) & ARREGLADOR DE SECUENCIA MULTI-COMPÁS (40 COMPASES)
  // CON SUBDIVISIÓN Y PASOS INDEPENDIENTES POR PATRÓN Y POR COMPÁS
  // ============================================================================
  const [measureEditMode, setMeasureEditMode] = useState<'patterns' | 'direct'>('patterns');
  const [patternBank, setPatternBank] = useState<PatternSummary[]>([
    {
      code: 'P1',
      name: 'Patrón 1',
      color: 'cyan',
      subdivision: '1/16',
      stepsPerMeasure: 16,
      sampleMeasureIndex: 0,
      usageCount: 1,
      notes: [],
    },
  ]);
  const [measureAssignments, setMeasureAssignments] = useState<
    Record<
      number,
      {
        patternCode: string;
        patternName: string;
        patternColor: string;
        timeSignature?: string;
        subdivision?: string;
        stepsPerMeasure?: number;
      }
    >
  >({
    0: {
      patternCode: 'P1',
      patternName: 'Patrón 1',
      patternColor: 'cyan',
      timeSignature: '4/4',
      subdivision: '1/16',
      stepsPerMeasure: 16,
    },
  });
  const [editingPatternCode, setEditingPatternCode] = useState<string>('P1');
  const [activeBrushPatternCode, setActiveBrushPatternCode] = useState<string>('P1');
  const [targetSequenceLength, setTargetSequenceLength] = useState<number>(40);
  const [previewingPatternCode, setPreviewingPatternCode] = useState<string | null>(null);
  const loopSingleMeasureRef = useRef<number | null>(null);

  // Construir configuración por compás con métrica, subdivisión, stepsPerMeasure, startStep y endStep acumulativos
  const buildMeasureConfigList = useCallback(
    (
      count: number,
      assignmentsMap: Record<
        number,
        {
          patternCode: string;
          patternName: string;
          patternColor: string;
          timeSignature?: string;
          subdivision?: string;
          stepsPerMeasure?: number;
        }
      >,
      bank: PatternSummary[],
      fallbackSub: string,
      timeSig: string
    ): MeasureConfigItem[] => {
      let cursor = 0;
      return Array.from({ length: Math.max(1, count) }).map((_, mIdx): MeasureConfigItem => {
        const assign = assignmentsMap[mIdx];
        const pat =
          bank.find((p) => p.code === assign?.patternCode) ||
          (mIdx === 0 ? bank[0] : undefined);
        const resolvedTimeSig =
          assign?.timeSignature || pat?.timeSignature || timeSig || '4/4';
        const resolvedSub = normalizeSubdivisionKey(
          assign?.subdivision || pat?.subdivision || fallbackSub || '1/16'
        );
        const resolvedSteps =
          assign?.stepsPerMeasure ||
          pat?.stepsPerMeasure ||
          calculateStepsForMeasure(resolvedTimeSig, resolvedSub);
        const startStep = cursor;
        const endStep = cursor + resolvedSteps;
        cursor = endStep;
        return {
          measureIndex: mIdx,
          patternCode: assign?.patternCode || pat?.code || 'P1',
          patternName: assign?.patternName || pat?.name || 'Patrón 1',
          patternColor: assign?.patternColor || pat?.color || 'cyan',
          timeSignature: resolvedTimeSig,
          subdivision: resolvedSub,
          stepsPerMeasure: resolvedSteps,
          startStep,
          endStep,
        };
      });
    },
    []
  );

  const extractRelativeNotesByMeasure = useCallback(
    (
      flatNotes: EditorNote[],
      configList: MeasureConfigItem[] | Array<{
        measureIndex: number;
        startStep: number;
        endStep: number;
        stepsPerMeasure: number;
      }>
    ): Record<number, EditorNote[]> => {
      const byMeasure: Record<number, EditorNote[]> = {};
      configList.forEach((cfg) => {
        byMeasure[cfg.measureIndex] = flatNotes
          .filter((n) => n.step >= cfg.startStep && n.step < cfg.endStep)
          .map((n) => {
            const rel = n.step - cfg.startStep;
            return {
              ...n,
              step: rel,
              stepIndex: rel,
            };
          });
      });
      return byMeasure;
    },
    []
  );

  const flattenMeasureNotes = useCallback(
    (
      byMeasure: Record<number, EditorNote[]>,
      configList: MeasureConfigItem[] | Array<{
        measureIndex: number;
        startStep: number;
        endStep: number;
        stepsPerMeasure: number;
      }>
    ): EditorNote[] => {
      const flat: EditorNote[] = [];
      configList.forEach((cfg) => {
        const mNotes = byMeasure[cfg.measureIndex] || [];
        mNotes.forEach((n) => {
          const rel = n.stepIndex !== undefined ? n.stepIndex : n.step ?? 0;
          if (rel >= 0 && rel < cfg.stepsPerMeasure) {
            flat.push({
              ...n,
              step: cfg.startStep + rel,
              stepIndex: rel,
            });
          }
        });
      });
      return flat;
    },
    []
  );

  const measureConfigList = useMemo(() => {
    return buildMeasureConfigList(
      totalMeasures,
      measureAssignments,
      patternBank,
      subdivision,
      timeSignature
    );
  }, [
    buildMeasureConfigList,
    totalMeasures,
    measureAssignments,
    patternBank,
    subdivision,
    timeSignature,
  ]);

  const measureConfigListRef = useRef<MeasureConfigItem[]>(measureConfigList);
  useEffect(() => {
    measureConfigListRef.current = measureConfigList;
  }, [measureConfigList]);

  const activeMeasureConfig: MeasureConfigItem =
    measureConfigList[currentMeasure] ||
    measureConfigList[0] || {
      measureIndex: 0,
      patternCode: 'P1',
      patternName: 'Patrón 1',
      patternColor: 'cyan',
      subdivision: normalizeSubdivisionKey(subdivision),
      stepsPerMeasure: getStepsForSubdivision(subdivision, timeSignature),
      startStep: 0,
      endStep: getStepsForSubdivision(subdivision, timeSignature),
    };

  // Pasos y subdivisión propios del compás/patrón actualmente activo
  const stepsPerMeasure = activeMeasureConfig.stepsPerMeasure;
  const activeMeasureSubdivision = activeMeasureConfig.subdivision;
  const activeMeasureStart = activeMeasureConfig.startStep;

  const totalSteps = useMemo(() => {
    if (measureConfigList.length === 0) return stepsPerMeasure;
    return measureConfigList[measureConfigList.length - 1].endStep;
  }, [measureConfigList, stepsPerMeasure]);

  // Agrupación de notas por compás con metadatos de patrón (patternCode, patternName, patternColor, timeSignature, subdivision, stepsPerMeasure)
  const measures = useMemo(() => {
    return measureConfigList.map((cfg) => {
      return {
        measureIndex: cfg.measureIndex,
        measureNumber: cfg.measureIndex + 1,
        patternCode: cfg.patternCode,
        patternName: cfg.patternName,
        patternColor: cfg.patternColor,
        timeSignature: cfg.timeSignature || timeSignature,
        subdivision: cfg.subdivision,
        stepsPerMeasure: cfg.stepsPerMeasure,
        startStep: cfg.startStep,
        endStep: cfg.endStep,
        notes: notes
          .filter((n) => n.step >= cfg.startStep && n.step < cfg.endStep)
          .map((n) => {
            const inst = n.drumVoice || (n as any).instrument || 'snare';
            const isKick = inst === 'kick' || (inst as string) === 'bombo';
            return {
              ...n,
              stepIndex: n.step - cfg.startStep,
              instrument: inst,
              sticking: isKick ? ('K' as StickingType) : n.sticking,
              patternCode: cfg.patternCode,
              patternName: cfg.patternName,
              patternColor: cfg.patternColor,
              subdivision: cfg.subdivision,
              stepsPerMeasure: cfg.stepsPerMeasure,
            };
          }),
      };
    });
  }, [measureConfigList, notes]);

  // Mantener sincronizadas las notas del patrón activo en el banco cuando se edita en la cuadrícula
  useEffect(() => {
    const mStart = activeMeasureConfig.startStep;
    const mEnd = activeMeasureConfig.endStep;
    const mSteps = activeMeasureConfig.stepsPerMeasure;
    const mSub = activeMeasureConfig.subdivision;
    const relNotes = notes
      .filter((n) => n.step >= mStart && n.step < mEnd)
      .map((n) => {
        const inst = n.drumVoice || (n as any).instrument || 'snare';
        const isKick = inst === 'kick' || (inst as string) === 'bombo';
        return {
          ...n,
          step: n.step - mStart,
          stepIndex: n.step - mStart,
          instrument: inst,
          sticking: isKick ? ('K' as StickingType) : n.sticking,
        };
      });

    const assignedCode =
      activeMeasureConfig.patternCode || editingPatternCode || 'P1';

    setPatternBank((prevBank) => {
      const idx = prevBank.findIndex((p) => p.code === assignedCode);
      if (idx === -1) return prevBank;
      const oldFp = computeMeasureFingerprint({
        subdivision: prevBank[idx].subdivision,
        stepsPerMeasure: prevBank[idx].stepsPerMeasure,
        notes: prevBank[idx].notes,
      });
      const newFp = computeMeasureFingerprint({
        subdivision: mSub,
        stepsPerMeasure: mSteps,
        notes: relNotes,
      });
      if (oldFp === newFp) return prevBank;
      const next = [...prevBank];
      next[idx] = {
        ...next[idx],
        subdivision: mSub,
        stepsPerMeasure: mSteps,
        notes: JSON.parse(JSON.stringify(relNotes)),
      };
      return next;
    });
  }, [notes, activeMeasureConfig, editingPatternCode]);

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
          stepIndex: n.stepIndex !== undefined ? n.stepIndex : n.step - m.startStep,
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
  }, [measures, instrument]);

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
          const defaultSub = normalizeSubdivisionKey(parsed.subdivision || '1/16');
          const defaultTimeSig = parsed.timeSignature || '4/4';
          const defaultSteps = getStepsForSubdivision(defaultSub, defaultTimeSig);

          if (parsed.notes && Array.isArray(parsed.notes)) {
            loadedNotes = parsed.notes.map((n: any) => {
              const voice = n.drumVoice || n.instrument;
              const isKick = voice === 'kick' || voice === 'bombo';
              return isKick ? { ...n, sticking: 'K' } : n;
            });
          } else if (parsed.measures && Array.isArray(parsed.measures) && parsed.measures.length > 0) {
            let runningStep = 0;
            loadedNotes = parsed.measures.flatMap((m: any) => {
              const mSub = normalizeSubdivisionKey(m.subdivision || defaultSub);
              const mSteps = Number(m.stepsPerMeasure) || getStepsForSubdivision(mSub, defaultTimeSig);
              const mStart = runningStep;
              runningStep += mSteps;
              return (m.notes || []).map((n: any) => {
                const voice = n.drumVoice || n.instrument;
                const isKick = voice === 'kick' || voice === 'bombo';
                const rel = n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % mSteps;
                return {
                  ...n,
                  step: mStart + rel,
                  stepIndex: rel,
                  sticking: isKick ? 'K' : n.sticking,
                };
              });
            });
          }

          if (loadedNotes.length > 0 || (parsed.title && parsed.title.trim() !== '')) {
            setNotes(loadedNotes);
            activeNotesRef.current = loadedNotes;
            const resolvedMeasuresCount = parsed.totalMeasures
              ? Math.max(1, parsed.totalMeasures)
              : parsed.measures && Array.isArray(parsed.measures)
                ? Math.max(1, parsed.measures.length)
                : 1;
            setTotalMeasures(resolvedMeasuresCount);

            if (parsed.patternBank && Array.isArray(parsed.patternBank) && parsed.patternBank.length > 0) {
              setPatternBank(
                parsed.patternBank.map((p: any) => {
                  const pTimeSig = p.timeSignature || defaultTimeSig;
                  const pSub = normalizeSubdivisionKey(
                    p.subdivision || inferSubdivisionFromSteps(p.stepsPerMeasure ?? 16, defaultSub)
                  );
                  const pSteps =
                    Number(p.stepsPerMeasure) || calculateStepsForMeasure(pTimeSig, pSub);
                  return {
                    ...p,
                    timeSignature: pTimeSig,
                    subdivision: pSub,
                    stepsPerMeasure: pSteps,
                  };
                })
              );
            } else if (parsed.measures && Array.isArray(parsed.measures) && parsed.measures.length > 0) {
              const extracted = extractPatternBankFromMeasures(
                parsed.measures,
                defaultSub,
                defaultSteps
              );
              if (extracted.length > 0) setPatternBank(extracted);
            }

            if (parsed.measureAssignments && typeof parsed.measureAssignments === 'object') {
              setMeasureAssignments(parsed.measureAssignments);
            } else if (parsed.measures && Array.isArray(parsed.measures) && parsed.measures.length > 0) {
              const analyzed = analyzeMeasureDuplicates(
                parsed.measures,
                defaultSub,
                defaultSteps
              );
              const nextAssign: Record<
                number,
                {
                  patternCode: string;
                  patternName: string;
                  patternColor: string;
                  timeSignature?: string;
                  subdivision?: string;
                  stepsPerMeasure?: number;
                }
              > = {};
              analyzed.forEach((item) => {
                nextAssign[item.measureIndex] = {
                  patternCode: item.patternCode,
                  patternName: item.patternName,
                  patternColor: item.patternColor,
                  timeSignature: item.timeSignature || defaultTimeSig,
                  subdivision: item.subdivision,
                  stepsPerMeasure: item.stepsPerMeasure,
                };
              });
              setMeasureAssignments(nextAssign);
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
      const hasNotes = notes.length > 0 || patternBank.length > 1;
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
          patternBank,
          measureAssignments,
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
    patternBank,
    measureAssignments,
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
      setSubdivision('1/16');
      setPatternBank([
        {
          code: 'P1',
          name: 'Patrón 1',
          color: 'cyan',
          subdivision: '1/16',
          stepsPerMeasure: 16,
          sampleMeasureIndex: 0,
          usageCount: 1,
          notes: [],
        },
      ]);
      setMeasureAssignments({
        0: {
          patternCode: 'P1',
          patternName: 'Patrón 1',
          patternColor: 'cyan',
          subdivision: '1/16',
          stepsPerMeasure: 16,
        },
      });
      setEditingPatternCode('P1');
      setActiveBrushPatternCode('P1');
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
  // GESTIÓN DE COMPASES Y BANCO DE PATRONES (P1..P12 + ARREGLADOR 40 COMPASES)
  // ============================================================================
  const handleSelectMeasure = useCallback(
    (mIdx: number) => {
      currentMeasureRef.current = mIdx;
      setCurrentMeasure(mIdx);
      const assigned = measureAssignments[mIdx];
      if (assigned?.patternCode) {
        setEditingPatternCode(assigned.patternCode);
      }
    },
    [measureAssignments]
  );

  // Cambiar subdivisión de forma INDEPENDIENTE para el patrón/compás objetivo sin afectar otros patrones
  const handleChangeSubdivision = useCallback(
    (rawSubdivision: string, targetPatternCode?: string) => {
      const normalizedSub = normalizeSubdivisionKey(rawSubdivision);
      const targetCode =
        targetPatternCode ||
        activeMeasureConfig.patternCode ||
        editingPatternCode ||
        'P1';
      const targetPat = patternBank.find((p) => p.code === targetCode);
      const targetTimeSig = targetPat?.timeSignature || activeMeasureConfig.timeSignature || timeSignature || '4/4';
      const newSteps = calculateStepsForMeasure(targetTimeSig, normalizedSub);

      const byMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);

      if (measureEditMode === 'direct' && !targetPatternCode) {
        // En modo directo por compás, cambiar la subdivisión del compás actual (y su patrón asociado si aplica)
        const oldSteps = activeMeasureConfig.stepsPerMeasure;
        byMeasure[currentMeasure] = remapNotesToNewSubdivision(
          byMeasure[currentMeasure] || [],
          oldSteps,
          newSteps
        );
        const nextAssignments = {
          ...measureAssignments,
          [currentMeasure]: {
            ...(measureAssignments[currentMeasure] || {
              patternCode: targetCode,
              patternName: activeMeasureConfig.patternName,
              patternColor: activeMeasureConfig.patternColor,
            }),
            timeSignature: targetTimeSig,
            subdivision: normalizedSub,
            stepsPerMeasure: newSteps,
          },
        };
        const nextBank = patternBank.map((p) =>
          p.code === targetCode
            ? {
              ...p,
              timeSignature: targetTimeSig,
              subdivision: normalizedSub,
              stepsPerMeasure: newSteps,
              notes: remapNotesToNewSubdivision(
                p.notes || [],
                p.stepsPerMeasure || oldSteps,
                newSteps
              ),
            }
            : p
        );
        const newConfigList = buildMeasureConfigList(
          totalMeasures,
          nextAssignments,
          nextBank,
          normalizedSub,
          targetTimeSig
        );
        const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);
        activeNotesRef.current = rebuiltNotes;
        setPatternBank(nextBank);
        setMeasureAssignments(nextAssignments);
        setNotes(rebuiltNotes);
        setSubdivision(normalizedSub as SubdivisionType);
        return;
      }

      // En Modo Patrones + Arreglador: actualizar únicamente el patrón objetivo y los compases asignados a ese patrón
      const nextBank = patternBank.map((p) => {
        if (p.code !== targetCode) return p;
        const oldPatSteps =
          p.stepsPerMeasure ||
          calculateStepsForMeasure(p.timeSignature || targetTimeSig, p.subdivision || '1/16');
        return {
          ...p,
          timeSignature: targetTimeSig,
          subdivision: normalizedSub,
          stepsPerMeasure: newSteps,
          notes: remapNotesToNewSubdivision(p.notes || [], oldPatSteps, newSteps),
        };
      });

      const nextAssignments = { ...measureAssignments };
      measureConfigList.forEach((cfg) => {
        if (cfg.patternCode === targetCode) {
          byMeasure[cfg.measureIndex] = remapNotesToNewSubdivision(
            byMeasure[cfg.measureIndex] || [],
            cfg.stepsPerMeasure,
            newSteps
          );
          nextAssignments[cfg.measureIndex] = {
            patternCode: cfg.patternCode,
            patternName: cfg.patternName,
            patternColor: cfg.patternColor,
            timeSignature: targetTimeSig,
            subdivision: normalizedSub,
            stepsPerMeasure: newSteps,
          };
        } else if (!nextAssignments[cfg.measureIndex]) {
          nextAssignments[cfg.measureIndex] = {
            patternCode: cfg.patternCode,
            patternName: cfg.patternName,
            patternColor: cfg.patternColor,
            timeSignature: cfg.timeSignature,
            subdivision: cfg.subdivision,
            stepsPerMeasure: cfg.stepsPerMeasure,
          };
        }
      });

      const newConfigList = buildMeasureConfigList(
        totalMeasures,
        nextAssignments,
        nextBank,
        subdivision,
        timeSignature
      );
      const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);

      activeNotesRef.current = rebuiltNotes;
      setPatternBank(nextBank);
      setMeasureAssignments(nextAssignments);
      setNotes(rebuiltNotes);
      if (activeMeasureConfig.patternCode === targetCode) {
        setSubdivision(normalizedSub as SubdivisionType);
      }
      toast.info(
        `Subdivisión de ${targetCode} ajustada a ${normalizedSub} (${newSteps} pasos).`
      );
    },
    [
      timeSignature,
      extractRelativeNotesByMeasure,
      notes,
      measureConfigList,
      activeMeasureConfig,
      editingPatternCode,
      measureEditMode,
      currentMeasure,
      measureAssignments,
      patternBank,
      buildMeasureConfigList,
      totalMeasures,
      flattenMeasureNotes,
      subdivision,
    ]
  );

  // Cambiar métrica de forma INDEPENDIENTE para el patrón/compás objetivo sin alterar otros patrones
  const handleChangePatternTimeSignature = useCallback(
    (newTimeSig: string, targetPatternCode?: string) => {
      const targetCode =
        targetPatternCode ||
        activeMeasureConfig.patternCode ||
        editingPatternCode ||
        'P1';

      const targetPat = patternBank.find((p) => p.code === targetCode);
      const patSub = normalizeSubdivisionKey(
        targetPat?.subdivision || activeMeasureConfig.subdivision || subdivision || '1/16'
      );
      const newSteps = calculateStepsForMeasure(newTimeSig, patSub);

      const byMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);

      if (measureEditMode === 'direct' && !targetPatternCode) {
        // En modo directo por compás, cambiar la métrica del compás actual
        const oldSteps = activeMeasureConfig.stepsPerMeasure;
        byMeasure[currentMeasure] = remapNotesToNewSubdivision(
          byMeasure[currentMeasure] || [],
          oldSteps,
          newSteps
        );
        const nextAssignments = {
          ...measureAssignments,
          [currentMeasure]: {
            ...(measureAssignments[currentMeasure] || {
              patternCode: targetCode,
              patternName: activeMeasureConfig.patternName,
              patternColor: activeMeasureConfig.patternColor,
            }),
            timeSignature: newTimeSig,
            subdivision: patSub,
            stepsPerMeasure: newSteps,
          },
        };
        const nextBank = patternBank.map((p) =>
          p.code === targetCode
            ? {
              ...p,
              timeSignature: newTimeSig,
              subdivision: patSub,
              stepsPerMeasure: newSteps,
              notes: remapNotesToNewSubdivision(
                p.notes || [],
                p.stepsPerMeasure || oldSteps,
                newSteps
              ),
            }
            : p
        );
        const newConfigList = buildMeasureConfigList(
          totalMeasures,
          nextAssignments,
          nextBank,
          patSub,
          newTimeSig
        );
        const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);
        activeNotesRef.current = rebuiltNotes;
        setPatternBank(nextBank);
        setMeasureAssignments(nextAssignments);
        setNotes(rebuiltNotes);
        setTimeSignature(newTimeSig);
        toast.info(
          `Métrica de C.${currentMeasure + 1} (${targetCode}) cambiada a ${newTimeSig} (${newSteps} pasos).`
        );
        return;
      }

      // En Modo Patrones: actualizar únicamente el patrón objetivo y los compases asignados a él
      const nextBank = patternBank.map((p) => {
        if (p.code !== targetCode) return p;
        const oldPatSteps =
          p.stepsPerMeasure ||
          calculateStepsForMeasure(p.timeSignature || timeSignature, p.subdivision || '1/16');
        return {
          ...p,
          timeSignature: newTimeSig,
          subdivision: patSub,
          stepsPerMeasure: newSteps,
          notes: remapNotesToNewSubdivision(p.notes || [], oldPatSteps, newSteps),
        };
      });

      const nextAssignments = { ...measureAssignments };
      measureConfigList.forEach((cfg) => {
        if (cfg.patternCode === targetCode) {
          byMeasure[cfg.measureIndex] = remapNotesToNewSubdivision(
            byMeasure[cfg.measureIndex] || [],
            cfg.stepsPerMeasure,
            newSteps
          );
          nextAssignments[cfg.measureIndex] = {
            patternCode: cfg.patternCode,
            patternName: cfg.patternName,
            patternColor: cfg.patternColor,
            timeSignature: newTimeSig,
            subdivision: patSub,
            stepsPerMeasure: newSteps,
          };
        } else if (!nextAssignments[cfg.measureIndex]) {
          nextAssignments[cfg.measureIndex] = {
            patternCode: cfg.patternCode,
            patternName: cfg.patternName,
            patternColor: cfg.patternColor,
            timeSignature: cfg.timeSignature,
            subdivision: cfg.subdivision,
            stepsPerMeasure: cfg.stepsPerMeasure,
          };
        }
      });

      const newConfigList = buildMeasureConfigList(
        totalMeasures,
        nextAssignments,
        nextBank,
        subdivision,
        timeSignature
      );
      const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);

      activeNotesRef.current = rebuiltNotes;
      setPatternBank(nextBank);
      setMeasureAssignments(nextAssignments);
      setNotes(rebuiltNotes);

      if (
        activeMeasureConfig.patternCode === targetCode ||
        editingPatternCode === targetCode
      ) {
        setTimeSignature(newTimeSig);
      }
      toast.info(
        `Métrica de ${targetCode} ajustada a ${newTimeSig} (${newSteps} pasos).`
      );
    },
    [
      activeMeasureConfig,
      editingPatternCode,
      patternBank,
      subdivision,
      timeSignature,
      extractRelativeNotesByMeasure,
      notes,
      measureConfigList,
      measureEditMode,
      currentMeasure,
      measureAssignments,
      totalMeasures,
      buildMeasureConfigList,
      flattenMeasureNotes,
    ]
  );

  // Crear nuevo patrón en el banco (P2, P3... hasta P12+) con su propia subdivisión independiente (por defecto 1/16 = 16 pasos)
  const handleCreatePattern = useCallback(() => {
    const usedNums = patternBank
      .map((p) => parseInt(p.code.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = usedNums.length > 0 ? Math.max(...usedNums) + 1 : patternBank.length + 1;
    const newCode = `P${nextNum}`;
    const newName = `Patrón ${nextNum}`;
    const newColor = PATTERN_PALETTE[(nextNum - 1) % PATTERN_PALETTE.length].key;
    const newPatTimeSig = timeSignature || '4/4';
    const newPatSub = '1/16';
    const newPatSteps = calculateStepsForMeasure(newPatTimeSig, newPatSub);

    const newMeasureIdx = totalMeasuresRef.current;
    totalMeasuresRef.current = newMeasureIdx + 1;
    currentMeasureRef.current = newMeasureIdx;

    const newPattern: PatternSummary = {
      code: newCode,
      name: newName,
      color: newColor,
      timeSignature: newPatTimeSig,
      subdivision: newPatSub,
      stepsPerMeasure: newPatSteps,
      sampleMeasureIndex: newMeasureIdx,
      usageCount: 1,
      notes: [],
    };

    setPatternBank((prev) => [...prev, newPattern]);
    setMeasureAssignments((prev) => ({
      ...prev,
      [newMeasureIdx]: {
        patternCode: newCode,
        patternName: newName,
        patternColor: newColor,
        timeSignature: newPatTimeSig,
        subdivision: newPatSub,
        stepsPerMeasure: newPatSteps,
      },
    }));
    setTotalMeasures(newMeasureIdx + 1);
    setCurrentMeasure(newMeasureIdx);
    setEditingPatternCode(newCode);
    setActiveBrushPatternCode(newCode);
    toast.success(
      `✨ Patrón ${newCode} (${newPatTimeSig} • ${newPatSub} • ${newPatSteps} pasos) creado en el banco y listo para componer en C.${newMeasureIdx + 1}.`
    );
  }, [patternBank, timeSignature]);

  // Renombrar un patrón en línea y actualizar todos los compases que lo usan
  const handleRenamePattern = useCallback((code: string, newName: string) => {
    setPatternBank((prev) =>
      prev.map((p) => (p.code === code ? { ...p, name: newName } : p))
    );
    setMeasureAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const mIdx = Number(k);
        if (next[mIdx]?.patternCode === code) {
          next[mIdx] = { ...next[mIdx], patternName: newName };
        }
      });
      return next;
    });
  }, []);

  // Abrir un patrón en la cuadrícula de edición ("Editando Patrón P1 (1 Compás)")
  const handleEditPatternNotes = useCallback(
    (code: string): number => {
      const pat = patternBank.find((p) => p.code === code);
      if (!pat) return currentMeasureRef.current;

      setEditingPatternCode(code);
      setActiveBrushPatternCode(code);

      const patTimeSig = pat.timeSignature || timeSignature || '4/4';
      const patSub = normalizeSubdivisionKey(pat.subdivision || '1/16');
      const patSteps =
        pat.stepsPerMeasure || calculateStepsForMeasure(patTimeSig, patSub);

      setTimeSignature(patTimeSig);
      setSubdivision(patSub as SubdivisionType);

      // Buscar el primer compás que tenga asignado este patrón
      let targetIdx = -1;
      for (let i = 0; i < totalMeasuresRef.current; i++) {
        if (measureAssignments[i]?.patternCode === code) {
          targetIdx = i;
          break;
        }
      }

      const byMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);
      const nextAssignments = { ...measureAssignments };

      if (targetIdx === -1) {
        // Si ningún compás lo tiene asignado aún, asignarlo al compás actual y cargar sus notas
        targetIdx = currentMeasureRef.current;
        nextAssignments[targetIdx] = {
          patternCode: pat.code,
          patternName: pat.name,
          patternColor: pat.color,
          timeSignature: patTimeSig,
          subdivision: patSub,
          stepsPerMeasure: patSteps,
        };
        setMeasureAssignments(nextAssignments);
      } else {
        nextAssignments[targetIdx] = {
          ...nextAssignments[targetIdx],
          patternCode: pat.code,
          patternName: pat.name,
          patternColor: pat.color,
          timeSignature: patTimeSig,
          subdivision: patSub,
          stepsPerMeasure: patSteps,
        };
        setMeasureAssignments(nextAssignments);
      }

      if (
        (!byMeasure[targetIdx] || byMeasure[targetIdx].length === 0) &&
        pat.notes &&
        pat.notes.length > 0
      ) {
        byMeasure[targetIdx] = pat.notes.map((n: any) => {
          const relStep =
            n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % patSteps;
          return {
            ...JSON.parse(JSON.stringify(n)),
            step: relStep,
            stepIndex: relStep,
            drumVoice: n.drumVoice || n.instrument || 'snare',
          };
        });
      }

      const newConfigList = buildMeasureConfigList(
        totalMeasuresRef.current,
        nextAssignments,
        patternBank,
        subdivision,
        timeSignature
      );
      const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);
      activeNotesRef.current = rebuiltNotes;
      setNotes(rebuiltNotes);

      currentMeasureRef.current = targetIdx;
      setCurrentMeasure(targetIdx);
      return targetIdx;
    },
    [
      patternBank,
      timeSignature,
      measureAssignments,
      extractRelativeNotesByMeasure,
      notes,
      measureConfigList,
      buildMeasureConfigList,
      subdivision,
      flattenMeasureNotes,
    ]
  );

  // Sincronizar las notas, nombre y subdivisión de un patrón en todos los compases de la secuencia que lo tengan asignado
  const handleSyncPatternToSequence = useCallback(
    (code: string) => {
      const pat = patternBank.find((p) => p.code === code);
      if (!pat) return;

      const patTimeSig = pat.timeSignature || timeSignature || '4/4';
      const patSub = normalizeSubdivisionKey(
        activeMeasureConfig.patternCode === code
          ? activeMeasureConfig.subdivision
          : pat.subdivision || '1/16'
      );
      const patSteps =
        activeMeasureConfig.patternCode === code
          ? activeMeasureConfig.stepsPerMeasure
          : pat.stepsPerMeasure || calculateStepsForMeasure(patTimeSig, patSub);

      const byMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);

      // Si actualmente estamos editando un compás con este patrón, tomar sus notas vivas
      let sourceRelNotes: any[] = pat.notes || [];
      if (activeMeasureConfig.patternCode === code) {
        sourceRelNotes = (byMeasure[currentMeasure] || []).map((n) => ({
          ...JSON.parse(JSON.stringify(n)),
          step: n.stepIndex ?? n.step,
          stepIndex: n.stepIndex ?? n.step,
          drumVoice: n.drumVoice || (n as any).instrument || 'snare',
        }));
      }

      let syncedMeasuresCount = 0;
      const nextAssignments = { ...measureAssignments };

      for (let mIdx = 0; mIdx < totalMeasures; mIdx++) {
        const assignedCode =
          measureAssignments[mIdx]?.patternCode || (mIdx === 0 ? 'P1' : '');
        if (assignedCode === code) {
          syncedMeasuresCount++;
          nextAssignments[mIdx] = {
            patternCode: pat.code,
            patternName: pat.name,
            patternColor: pat.color,
            timeSignature: patTimeSig,
            subdivision: patSub,
            stepsPerMeasure: patSteps,
          };
          byMeasure[mIdx] = sourceRelNotes.map((n: any) => {
            const relStep =
              n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % patSteps;
            return {
              ...JSON.parse(JSON.stringify(n)),
              step: relStep,
              stepIndex: relStep,
              drumVoice: n.drumVoice || n.instrument || 'snare',
            };
          });
        }
      }

      const newConfigList = buildMeasureConfigList(
        totalMeasures,
        nextAssignments,
        patternBank,
        subdivision,
        timeSignature
      );
      const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);
      activeNotesRef.current = rebuiltNotes;
      setMeasureAssignments(nextAssignments);
      setNotes(rebuiltNotes);

      toast.success(
        `Patrón ${pat.code} ("${pat.name}" • ${patTimeSig} • ${patSub}) sincronizado en ${syncedMeasuresCount} ${syncedMeasuresCount === 1 ? 'compás' : 'compases'
        }.`
      );
    },
    [
      patternBank,
      activeMeasureConfig,
      timeSignature,
      extractRelativeNotesByMeasure,
      notes,
      measureConfigList,
      currentMeasure,
      measureAssignments,
      totalMeasures,
      buildMeasureConfigList,
      subdivision,
      flattenMeasureNotes,
    ]
  );

  // Añadir un nuevo compás al final de la secuencia usando este patrón (con su subdivisión propia)
  const handleAppendPatternMeasure = useCallback(
    (code: string) => {
      const pat = patternBank.find((p) => p.code === code) || patternBank[0];
      if (!pat) return;

      const patTimeSig = pat.timeSignature || timeSignature || '4/4';
      const patSub = normalizeSubdivisionKey(pat.subdivision || '1/16');
      const patSteps =
        pat.stepsPerMeasure || calculateStepsForMeasure(patTimeSig, patSub);

      const newIdx = totalMeasuresRef.current;
      const mStart = totalSteps;

      totalMeasuresRef.current = newIdx + 1;
      currentMeasureRef.current = newIdx;

      setMeasureAssignments((prev) => ({
        ...prev,
        [newIdx]: {
          patternCode: pat.code,
          patternName: pat.name,
          patternColor: pat.color,
          timeSignature: patTimeSig,
          subdivision: patSub,
          stepsPerMeasure: patSteps,
        },
      }));

      setNotes((prev) => {
        const cloned: EditorNote[] = (pat.notes || []).map((n: any) => {
          const relStep =
            n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % patSteps;
          return {
            ...JSON.parse(JSON.stringify(n)),
            step: mStart + relStep,
            stepIndex: relStep,
            drumVoice: n.drumVoice || n.instrument || 'snare',
          };
        });
        const next = [...prev, ...cloned];
        activeNotesRef.current = next;
        return next;
      });

      setTotalMeasures(newIdx + 1);
      setCurrentMeasure(newIdx);
      toast.info(
        `Compás C.${newIdx + 1} añadido al final con [${pat.code}] ${pat.name} (${patTimeSig} • ${patSub}).`
      );
    },
    [patternBank, timeSignature, totalSteps]
  );

  // Asignar un patrón a un compás específico (C.1..C.40) con el Pincel de Patrón Activo (preservando su subdivisión independiente)
  const handleAssignPatternToMeasure = useCallback(
    (mIdx: number, codeToAssign?: string) => {
      const targetCode = codeToAssign || activeBrushPatternCode || 'P1';
      const pat = patternBank.find((p) => p.code === targetCode) || patternBank[0];
      if (!pat) return;

      const patTimeSig = pat.timeSignature || timeSignature || '4/4';
      const patSub = normalizeSubdivisionKey(pat.subdivision || '1/16');
      const patSteps =
        pat.stepsPerMeasure || calculateStepsForMeasure(patTimeSig, patSub);

      const byMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);
      byMeasure[mIdx] = (pat.notes || []).map((n: any) => {
        const relStep =
          n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % patSteps;
        return {
          ...JSON.parse(JSON.stringify(n)),
          step: relStep,
          stepIndex: relStep,
          drumVoice: n.drumVoice || n.instrument || 'snare',
        };
      });

      const nextAssignments = {
        ...measureAssignments,
        [mIdx]: {
          patternCode: pat.code,
          patternName: pat.name,
          patternColor: pat.color,
          timeSignature: patTimeSig,
          subdivision: patSub,
          stepsPerMeasure: patSteps,
        },
      };

      const newConfigList = buildMeasureConfigList(
        totalMeasures,
        nextAssignments,
        patternBank,
        subdivision,
        timeSignature
      );
      const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);

      activeNotesRef.current = rebuiltNotes;
      setMeasureAssignments(nextAssignments);
      setNotes(rebuiltNotes);

      currentMeasureRef.current = mIdx;
      setCurrentMeasure(mIdx);
      setEditingPatternCode(pat.code);
      setTimeSignature(patTimeSig);
    },
    [
      activeBrushPatternCode,
      patternBank,
      timeSignature,
      extractRelativeNotesByMeasure,
      notes,
      measureConfigList,
      measureAssignments,
      buildMeasureConfigList,
      totalMeasures,
      subdivision,
      flattenMeasureNotes,
    ]
  );

  // Aplicar longitud de secuencia (ej. 40 compases) de golpe
  const handleApplySequenceLength = useCallback(
    (customLength?: number) => {
      const targetLen = Math.max(
        1,
        Math.min(200, Number(customLength ?? targetSequenceLength) || 40)
      );
      setTargetSequenceLength(targetLen);

      const byMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);
      const nextAssignments: Record<
        number,
        {
          patternCode: string;
          patternName: string;
          patternColor: string;
          subdivision?: string;
          stepsPerMeasure?: number;
        }
      > = {};

      for (let mIdx = 0; mIdx < targetLen; mIdx++) {
        if (measureAssignments[mIdx]) {
          nextAssignments[mIdx] = measureAssignments[mIdx];
        } else {
          const fallbackPat =
            patternBank.find((p) => p.code === activeBrushPatternCode) ||
            patternBank[mIdx % Math.max(1, patternBank.length)] ||
            patternBank[0];
          const pSub = normalizeSubdivisionKey(fallbackPat?.subdivision || '1/16');
          const pSteps =
            fallbackPat?.stepsPerMeasure ||
            getStepsForSubdivision(pSub, timeSignature);
          nextAssignments[mIdx] = {
            patternCode: fallbackPat?.code || 'P1',
            patternName: fallbackPat?.name || 'Patrón 1',
            patternColor: fallbackPat?.color || 'cyan',
            subdivision: pSub,
            stepsPerMeasure: pSteps,
          };
          byMeasure[mIdx] = (fallbackPat?.notes || []).map((n: any) => {
            const relStep =
              n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % pSteps;
            return {
              ...JSON.parse(JSON.stringify(n)),
              step: relStep,
              stepIndex: relStep,
              drumVoice: n.drumVoice || n.instrument || 'snare',
            };
          });
        }
      }

      const newConfigList = buildMeasureConfigList(
        targetLen,
        nextAssignments,
        patternBank,
        subdivision,
        timeSignature
      );
      const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);

      totalMeasuresRef.current = targetLen;
      activeNotesRef.current = rebuiltNotes;
      setMeasureAssignments(nextAssignments);
      setNotes(rebuiltNotes);
      setTotalMeasures(targetLen);
      if (currentMeasure >= targetLen) {
        currentMeasureRef.current = targetLen - 1;
        setCurrentMeasure(targetLen - 1);
      }
      toast.success(`Secuencia configurada a ${targetLen} compases.`);
    },
    [
      targetSequenceLength,
      extractRelativeNotesByMeasure,
      notes,
      measureConfigList,
      measureAssignments,
      patternBank,
      activeBrushPatternCode,
      timeSignature,
      buildMeasureConfigList,
      subdivision,
      flattenMeasureNotes,
      currentMeasure,
    ]
  );

  // Distribuir los patrones del banco (P1..Pk) en bloques equitativos a lo largo de la secuencia (ej. 40 compases)
  const handleDistributePatternsEqually = useCallback(() => {
    if (patternBank.length === 0) return;
    const targetLen = Math.max(totalMeasures, patternBank.length);

    const nextAssignments: Record<
      number,
      {
        patternCode: string;
        patternName: string;
        patternColor: string;
        subdivision?: string;
        stepsPerMeasure?: number;
      }
    > = {};
    const byMeasure: Record<number, EditorNote[]> = {};

    for (let mIdx = 0; mIdx < targetLen; mIdx++) {
      const patIdx = Math.min(
        patternBank.length - 1,
        Math.floor((mIdx * patternBank.length) / targetLen)
      );
      const pat = patternBank[patIdx];
      const pSub = normalizeSubdivisionKey(pat.subdivision || '1/16');
      const pSteps =
        pat.stepsPerMeasure || getStepsForSubdivision(pSub, timeSignature);

      nextAssignments[mIdx] = {
        patternCode: pat.code,
        patternName: pat.name,
        patternColor: pat.color,
        subdivision: pSub,
        stepsPerMeasure: pSteps,
      };

      byMeasure[mIdx] = (pat.notes || []).map((n: any) => {
        const relStep =
          n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % pSteps;
        return {
          ...JSON.parse(JSON.stringify(n)),
          step: relStep,
          stepIndex: relStep,
          drumVoice: n.drumVoice || n.instrument || 'snare',
        };
      });
    }

    const newConfigList = buildMeasureConfigList(
      targetLen,
      nextAssignments,
      patternBank,
      subdivision,
      timeSignature
    );
    const rebuiltNotes = flattenMeasureNotes(byMeasure, newConfigList);

    totalMeasuresRef.current = targetLen;
    activeNotesRef.current = rebuiltNotes;
    setTotalMeasures(targetLen);
    setMeasureAssignments(nextAssignments);
    setNotes(rebuiltNotes);
    toast.success(
      `${patternBank.length} patrones distribuidos equitativamente a lo largo de ${targetLen} compases.`
    );
  }, [
    patternBank,
    totalMeasures,
    timeSignature,
    buildMeasureConfigList,
    subdivision,
    flattenMeasureNotes,
  ]);

  // Eliminar un patrón del Banco de Patrones Reutilizables (P1, P2, P3, P4...) y limpiar la secuencia
  const handleDeletePattern = useCallback(
    (codeToDelete: string) => {
      if (patternBank.length <= 1) {
        // Si solo queda 1 patrón en el banco, limpiar sus notas
        setPatternBank((prev) =>
          prev.map((p) => (p.code === codeToDelete ? { ...p, notes: [] } : p))
        );
        setNotes([]);
        activeNotesRef.current = [];
        toast.info(`Notas de ${codeToDelete} limpiadas.`);
        return;
      }

      const remainingBank = patternBank.filter((p) => p.code !== codeToDelete);
      const fallbackPat = remainingBank[0];
      const oldByMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);

      // Identificar qué compases de la secuencia NO usaban el patrón eliminado
      const keptMeasureIndices: number[] = [];
      for (let mIdx = 0; mIdx < totalMeasures; mIdx++) {
        const assignedCode =
          measureAssignments[mIdx]?.patternCode ||
          (mIdx === 0 ? remainingBank[0].code : '');
        if (assignedCode !== codeToDelete) {
          keptMeasureIndices.push(mIdx);
        }
      }

      const nextAssignments: Record<
        number,
        {
          patternCode: string;
          patternName: string;
          patternColor: string;
          subdivision?: string;
          stepsPerMeasure?: number;
        }
      > = {};
      const nextByMeasure: Record<number, EditorNote[]> = {};
      let nextTotalMeasures = 1;

      if (keptMeasureIndices.length > 0) {
        nextTotalMeasures = keptMeasureIndices.length;
        keptMeasureIndices.forEach((oldIdx, newIdx) => {
          const oldCfg = measureConfigList[oldIdx];
          nextAssignments[newIdx] = measureAssignments[oldIdx] || {
            patternCode: oldCfg?.patternCode || fallbackPat.code,
            patternName: oldCfg?.patternName || fallbackPat.name,
            patternColor: oldCfg?.patternColor || fallbackPat.color,
            subdivision: oldCfg?.subdivision || fallbackPat.subdivision || '1/16',
            stepsPerMeasure:
              oldCfg?.stepsPerMeasure || fallbackPat.stepsPerMeasure || 16,
          };
          nextByMeasure[newIdx] = oldByMeasure[oldIdx] || [];
        });
      } else {
        // Si todos los compases usaban el patrón eliminado, dejar 1 compás con el primer patrón restante
        const fbSub = normalizeSubdivisionKey(fallbackPat.subdivision || '1/16');
        const fbSteps =
          fallbackPat.stepsPerMeasure || getStepsForSubdivision(fbSub, timeSignature);
        nextTotalMeasures = 1;
        nextAssignments[0] = {
          patternCode: fallbackPat.code,
          patternName: fallbackPat.name,
          patternColor: fallbackPat.color,
          subdivision: fbSub,
          stepsPerMeasure: fbSteps,
        };
        nextByMeasure[0] = (fallbackPat.notes || []).map((n: any) => {
          const relStep =
            n.stepIndex !== undefined ? n.stepIndex : (n.step ?? 0) % fbSteps;
          return {
            ...JSON.parse(JSON.stringify(n)),
            step: relStep,
            stepIndex: relStep,
            drumVoice: n.drumVoice || n.instrument || 'snare',
          };
        });
      }

      if (isPlaying && previewingPatternCode === codeToDelete) {
        handleStop();
      }

      const newConfigList = buildMeasureConfigList(
        nextTotalMeasures,
        nextAssignments,
        remainingBank,
        subdivision,
        timeSignature
      );
      const rebuiltNotes = flattenMeasureNotes(nextByMeasure, newConfigList);

      totalMeasuresRef.current = nextTotalMeasures;
      const nextCurrentMeasure = Math.max(
        0,
        Math.min(currentMeasure, nextTotalMeasures - 1)
      );
      currentMeasureRef.current = nextCurrentMeasure;
      activeNotesRef.current = rebuiltNotes;

      setPatternBank(remainingBank);
      setMeasureAssignments(nextAssignments);
      setTotalMeasures(nextTotalMeasures);
      setCurrentMeasure(nextCurrentMeasure);
      setNotes(rebuiltNotes);

      if (editingPatternCode === codeToDelete) {
        setEditingPatternCode(fallbackPat.code);
      }
      if (activeBrushPatternCode === codeToDelete) {
        setActiveBrushPatternCode(fallbackPat.code);
      }

      toast.info(`Patrón ${codeToDelete} eliminado del banco y de la secuencia.`);
    },
    [
      patternBank,
      extractRelativeNotesByMeasure,
      notes,
      measureConfigList,
      totalMeasures,
      measureAssignments,
      timeSignature,
      isPlaying,
      previewingPatternCode,
      buildMeasureConfigList,
      subdivision,
      flattenMeasureNotes,
      currentMeasure,
      editingPatternCode,
      activeBrushPatternCode,
    ]
  );

  // Aplicar síncopa automática con Ghost Notes en los contratiempos débiles ("e" y "a") del compás actual
  const handleApplySyncopation = useCallback(() => {
    const mStart = activeMeasureStart;
    const mEnd = mStart + stepsPerMeasure;

    setNotes((prev) => {
      const otherMeasuresNotes = prev.filter((n) => n.step < mStart || n.step >= mEnd);
      const currentNotes = prev.filter((n) => n.step >= mStart && n.step < mEnd);

      const syncSteps =
        stepsPerMeasure >= 16
          ? [1, 3, 6, 7, 11, 14]
          : stepsPerMeasure >= 8
            ? [1, 3, 5, 7]
            : [1, 3];
      const ghostSnareSteps =
        stepsPerMeasure >= 16 ? [1, 7, 9, 15] : [1, 5];

      // Marcar notas existentes en contratiempos como sincopadas
      const updatedExisting = currentNotes.map((n) => {
        const rel = n.step - mStart;
        if (syncSteps.includes(rel) || rel % 2 === 1) {
          return { ...n, syncopated: true };
        }
        return n;
      });

      const resultMeasureNotes = [...updatedExisting];

      // Si el compás estaba vacío, sembrar un groove base sincopado con bombo, caja y hi-hat
      if (resultMeasureNotes.length === 0 && stepsPerMeasure >= 8) {
        const baseGroove: EditorNote[] = [
          { step: mStart + 0, drumVoice: 'kick', sticking: 'K', accent: true, velocity: 1.0 },
          { step: mStart + 0, drumVoice: 'hihat', sticking: 'R', accent: true, velocity: 0.9 },
          { step: mStart + 3, drumVoice: 'kick', sticking: 'K', syncopated: true, velocity: 0.9 },
          { step: mStart + 4, drumVoice: 'snare', sticking: 'L', accent: true, velocity: 1.0 },
          { step: mStart + 6, drumVoice: 'hihat_open', sticking: 'R', syncopated: true, accent: true, velocity: 0.95 },
        ];
        if (stepsPerMeasure >= 16) {
          baseGroove.push(
            { step: mStart + 10, drumVoice: 'kick', sticking: 'K', syncopated: true, velocity: 0.9 },
            { step: mStart + 11, drumVoice: 'snare', sticking: 'L', syncopated: true, accent: true, velocity: 0.95 },
            { step: mStart + 12, drumVoice: 'hihat', sticking: 'R', accent: false, velocity: 0.8 },
            { step: mStart + 14, drumVoice: 'snare', sticking: 'R', syncopated: true, velocity: 0.85 }
          );
        }
        resultMeasureNotes.push(...baseGroove);
      }

      // Añadir Ghost Notes suaves en redoblante en los huecos débiles
      ghostSnareSteps.forEach((relStep) => {
        if (relStep < stepsPerMeasure) {
          const targetGlobal = mStart + relStep;
          const existsSnare = resultMeasureNotes.some(
            (n) => n.step === targetGlobal && n.drumVoice === 'snare'
          );
          if (!existsSnare) {
            resultMeasureNotes.push({
              step: targetGlobal,
              stepIndex: relStep,
              drumVoice: 'snare',
              sticking: 'L',
              ghost: true,
              accent: false,
              syncopated: true,
              velocity: 0.32,
            });
          }
        }
      });

      const next = [...otherMeasuresNotes, ...resultMeasureNotes];
      activeNotesRef.current = next;
      return next;
    });

    toast.success('⚡ Síncopa y Ghost Notes aplicadas en los contratiempos del compás.');
  }, [activeMeasureStart, stepsPerMeasure]);

  const handleAddMeasure = useCallback(() => {
    const nextIdx = totalMeasuresRef.current;
    const activePat =
      patternBank.find((p) => p.code === activeBrushPatternCode) || patternBank[0];
    totalMeasuresRef.current = nextIdx + 1;
    currentMeasureRef.current = nextIdx;
    if (activePat) {
      const pSub = normalizeSubdivisionKey(activePat.subdivision || '1/16');
      const pSteps =
        activePat.stepsPerMeasure || getStepsForSubdivision(pSub, timeSignature);
      setMeasureAssignments((prev) => ({
        ...prev,
        [nextIdx]: {
          patternCode: activePat.code,
          patternName: activePat.name,
          patternColor: activePat.color,
          subdivision: pSub,
          stepsPerMeasure: pSteps,
        },
      }));
    }
    setTotalMeasures((prev) => prev + 1);
    setCurrentMeasure(nextIdx); // Ir al nuevo compás
  }, [patternBank, activeBrushPatternCode, timeSignature]);

  const handleDuplicateMeasure = () => {
    const sourceStart = activeMeasureStart;
    const sourceEnd = sourceStart + stepsPerMeasure;
    const currentNotes = notes.filter((n) => n.step >= sourceStart && n.step < sourceEnd);

    const newMeasureIdx = totalMeasures;
    const targetStart = totalSteps;

    const duplicatedNotes: EditorNote[] = currentNotes.map((n) => ({
      ...n,
      step: targetStart + (n.step - sourceStart),
      stepIndex: n.step - sourceStart,
    }));

    const sourceAssign = measureAssignments[currentMeasure] || {
      patternCode: activeMeasureConfig.patternCode,
      patternName: activeMeasureConfig.patternName,
      patternColor: activeMeasureConfig.patternColor,
      subdivision: activeMeasureConfig.subdivision,
      stepsPerMeasure: activeMeasureConfig.stepsPerMeasure,
    };
    setMeasureAssignments((prev) => ({
      ...prev,
      [newMeasureIdx]: { ...sourceAssign },
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

    const oldByMeasure = extractRelativeNotesByMeasure(notes, measureConfigList);
    const nextAssignments: Record<
      number,
      {
        patternCode: string;
        patternName: string;
        patternColor: string;
        subdivision?: string;
        stepsPerMeasure?: number;
      }
    > = {};
    const nextByMeasure: Record<number, EditorNote[]> = {};

    for (let i = 0; i < totalMeasures; i++) {
      if (i < measureIdxToDelete) {
        if (measureAssignments[i]) nextAssignments[i] = measureAssignments[i];
        nextByMeasure[i] = oldByMeasure[i] || [];
      } else if (i > measureIdxToDelete) {
        if (measureAssignments[i]) nextAssignments[i - 1] = measureAssignments[i];
        nextByMeasure[i - 1] = oldByMeasure[i] || [];
      }
    }

    const nextTotalMeasures = Math.max(1, totalMeasures - 1);
    const newConfigList = buildMeasureConfigList(
      nextTotalMeasures,
      nextAssignments,
      patternBank,
      subdivision,
      timeSignature
    );
    const updatedNotes = flattenMeasureNotes(nextByMeasure, newConfigList);

    totalMeasuresRef.current = nextTotalMeasures;
    activeNotesRef.current = updatedNotes;
    setMeasureAssignments(nextAssignments);
    setNotes(updatedNotes);
    setTotalMeasures(nextTotalMeasures);
    setCurrentMeasure((prev) => Math.max(0, Math.min(prev, totalMeasures - 2)));
  };

  // ============================================================================
  // MANIPULACIÓN DE NOTAS EN LA REJILLA
  // ============================================================================
  const handleCellClick = (stepInMeasure: number, stringNum?: number, drumVoice?: DrumVoice) => {
    const globalStep = activeMeasureStart + stepInMeasure;

    if (instrument === 'drums') {
      const isKickTrack = drumVoice === 'kick' || (drumVoice as string) === 'bombo';
      const effectiveSticking: StickingType = isKickTrack ? 'K' : selectedSticking;

      // Buscar golpe existente en este paso y voz
      const existingIdx = notes.findIndex(
        (n) =>
          n.step === globalStep &&
          (n.drumVoice === drumVoice ||
            (drumVoice === 'hihat' && n.drumVoice === 'hihat_closed') ||
            (drumVoice === 'floor_tom' && n.drumVoice === 'granadero'))
      );

      if (existingIdx >= 0) {
        const existing = notes[existingIdx];
        // Si el usuario tiene activado Ghost Note o Sincopado y el golpe existente aún no tiene ese estado, alternarlo;
        // si ya coincide exactamente con las herramientas activas, eliminar el golpe.
        const shouldToggleGhost = selectedGhost && !existing.ghost;
        const shouldToggleSync = selectedSyncopated && !existing.syncopated;
        const shouldToggleAccent = selectedAccent && !existing.accent && !selectedGhost;

        if (shouldToggleGhost || shouldToggleSync || shouldToggleAccent) {
          const nextGhost = selectedGhost ? !existing.ghost : Boolean(existing.ghost && !selectedAccent);
          const nextAccent = nextGhost ? false : selectedAccent ? true : Boolean(existing.accent);
          const nextSync = selectedSyncopated ? !existing.syncopated : Boolean(existing.syncopated);

          setNotes((prev) => {
            const next = prev.map((n, idx) =>
              idx === existingIdx
                ? {
                  ...n,
                  ghost: nextGhost,
                  accent: nextAccent,
                  syncopated: nextSync,
                  sticking: effectiveSticking,
                  velocity: nextGhost ? 0.32 : nextAccent ? 1.0 : 0.8,
                }
                : n
            );
            activeNotesRef.current = next;
            return next;
          });

          const targetInstrument = drumVoice === 'hihat' ? 'hihat_closed' : drumVoice!;
          playDrumHit({
            instrument: targetInstrument,
            velocity: nextGhost ? 32 : nextAccent ? 100 : 85,
            accent: nextAccent,
            ghost: nextGhost,
            syncopated: nextSync,
            sticking: isKickTrack ? 'K' : (selectedSticking as 'R' | 'L') || 'R',
            isDoubleRebound: false,
          });
        } else {
          // Eliminar nota existente
          setNotes((prev) => {
            const next = prev.filter((_, idx) => idx !== existingIdx);
            activeNotesRef.current = next;
            return next;
          });
        }
      } else {
        // Agregar nueva nota de batería con soporte para Ghost Note, Acento, Sincopado y K automático en Bombo
        const isGhostNote = selectedGhost;
        const isAccentNote = isGhostNote ? false : selectedAccent;
        const isSyncNote = selectedSyncopated;

        const newNote: EditorNote = {
          step: globalStep,
          stepIndex: stepInMeasure,
          drumVoice,
          accent: isAccentNote,
          ghost: isGhostNote,
          syncopated: isSyncNote,
          sticking: effectiveSticking,
          velocity: isGhostNote ? 0.32 : isAccentNote ? 1.0 : 0.8,
        };
        setNotes((prev) => {
          const next = [...prev, newNote];
          activeNotesRef.current = next;
          return next;
        });

        // Sonido de prueba inmediato con DSP de Ghost Note / Sincopado / Acento
        const targetInstrument = drumVoice === 'hihat' ? 'hihat_closed' : drumVoice!;
        playDrumHit({
          instrument: targetInstrument,
          velocity: isGhostNote ? 32 : isAccentNote ? 100 : 85,
          accent: isAccentNote,
          ghost: isGhostNote,
          syncopated: isSyncNote,
          sticking: isKickTrack ? 'K' : (selectedSticking as 'R' | 'L') || 'R',
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
  const timeSignatureRef = useRef<string>(timeSignature);
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
      const mStart =
        measureConfigListRef.current[currentMeasureRef.current]?.startStep ??
        currentMeasureRef.current * stepsPerMeasureRef.current;
      const globalStep = mStart + stepInMeasure;
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
      const mStart =
        measureConfigListRef.current[currentMeasureRef.current]?.startStep ??
        currentMeasureRef.current * stepsPerMeasureRef.current;
      const globalStep = mStart + stepInMeasure;
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
      const mStart =
        measureConfigListRef.current[currentMeasureRef.current]?.startStep ??
        currentMeasureRef.current * stepsPerMeasureRef.current;
      const globalStep = mStart + stepInMeasure;
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
      const mStart =
        measureConfigListRef.current[currentMeasureRef.current]?.startStep ??
        currentMeasureRef.current * stepsPerMeasureRef.current;
      const globalStep = mStart + stepInMeasure;
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
      const liveCfg = measureConfigListRef.current[currentMeasureRef.current];
      const liveStepsPerMeasure = liveCfg?.stepsPerMeasure ?? stepsPerMeasureRef.current;
      const liveMeasureStart =
        liveCfg?.startStep ?? currentMeasureRef.current * liveStepsPerMeasure;
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
  // SOPORTE MULTI-SUBDIVISIÓN POR COMPÁS (1/8T + 1/16 + 1/16T + 1/8...)
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

  // Obtener la configuración del compás que contiene un globalStep dado
  const getMeasureCfgForGlobalStep = useCallback(
    (stepNumber: number): MeasureConfigItem => {
      const list = measureConfigListRef.current;
      if (!list || list.length === 0) {
        const fallbackSteps = Math.max(1, stepsPerMeasureRef.current);
        const mIdx = Math.floor(stepNumber / fallbackSteps);
        return {
          measureIndex: mIdx,
          patternCode: 'P1',
          patternName: 'Patrón 1',
          patternColor: 'cyan',
          subdivision: subdivisionRef.current,
          stepsPerMeasure: fallbackSteps,
          startStep: mIdx * fallbackSteps,
          endStep: (mIdx + 1) * fallbackSteps,
        };
      }
      const found = list.find(
        (cfg) => stepNumber >= cfg.startStep && stepNumber < cfg.endStep
      );
      return found || list[0];
    },
    []
  );

  const isBeatStep = useCallback(
    (stepNumber: number) => {
      const cfg = getMeasureCfgForGlobalStep(stepNumber);
      const mSteps = Math.max(1, cfg.stepsPerMeasure);
      const stepInMeasure = stepNumber - cfg.startStep;
      const mTimeSig = cfg.timeSignature || timeSignatureRef.current || '4/4';
      const spec = getTimeSignatureSpec(mTimeSig);

      if (spec.denominator === 8) {
        const stepsPerEighth = Math.max(1, Math.round(mSteps / spec.numerator));
        const eighthIndex = Math.floor(stepInMeasure / stepsPerEighth);
        const isEighthStart = stepInMeasure % stepsPerEighth === 0;
        return isEighthStart && (spec.accentBeats || [0]).includes(eighthIndex);
      }

      const stepsPerBeat = Math.max(1, Math.round(mSteps / spec.numerator));
      return stepInMeasure % stepsPerBeat === 0;
    },
    [getMeasureCfgForGlobalStep]
  );

  const isDownbeatStep = useCallback(
    (stepNumber: number) => {
      const cfg = getMeasureCfgForGlobalStep(stepNumber);
      return stepNumber === cfg.startStep;
    },
    [getMeasureCfgForGlobalStep]
  );

  // Duración del paso en segundos según el stepsPerMeasure y métrica propios del compás actual
  const getStepDuration = useCallback(
    (forGlobalStep?: number) => {
      const beatDuration = 60 / bpmRef.current;
      const targetStep =
        forGlobalStep !== undefined ? forGlobalStep : playStepRef.current;
      const cfg = getMeasureCfgForGlobalStep(targetStep);
      const mSteps = Math.max(1, cfg.stepsPerMeasure);
      const mTimeSig = cfg.timeSignature || timeSignatureRef.current || '4/4';
      const spec = getTimeSignatureSpec(mTimeSig);

      const measureDurationSec = beatDuration * spec.quarterNoteBeats;
      return measureDurationSec / mSteps;
    },
    [getMeasureCfgForGlobalStep]
  );

  // Sincronizar BPM en caliente sin reiniciar el scheduler
  useEffect(() => {
    const prevBpm = bpmRef.current;
    bpmRef.current = bpm;

    if (isPlaying && bpm > prevBpm) {
      const liveInstrument = instrumentRef.current;
      const audioCtx =
        liveInstrument === 'drums'
          ? getAudioEngine().getAudioContext()
          : liveInstrument === 'piano'
            ? getPianoAudioEngine().getAudioContext()
            : getStringsAudioEngine().getAudioContext();

      if (audioCtx) {
        const newStepDuration = getStepDuration(playStepRef.current);
        if (nextNoteTimeRef.current > audioCtx.currentTime + newStepDuration) {
          nextNoteTimeRef.current = audioCtx.currentTime + newStepDuration;
        }
      }
    }
  }, [bpm, isPlaying, getStepDuration]);

  const playStepAudio = useCallback((stepIdx: number) => {
    const notesNow = activeNotesRef.current || [];
    const notesToPlay = notesNow
      .filter(
        (n: any) =>
          n.step === stepIdx && !n.isRest && n.midiNumber !== undefined
      )
      .map((n: any) => n.midiNumber as number);

    if (notesToPlay.length > 0) {
      pianoPreviewSynth.playChord(notesToPlay, 1.2, 90);
    }
  }, []);

  const playBassStep = useCallback(
    (stepIndex: number, hitTime?: number) => {
      const currentStepNotes =
        activeNotesRef.current?.filter(
          (n: any) =>
            n.step === stepIndex &&
            (n.string !== undefined || n.stringIndex !== undefined) &&
            n.fret !== undefined
        ) || [];

      currentStepNotes.forEach((note: any) => {
        const baseMidiByString: Record<number, number> = {
          0: 43,
          1: 43,
          2: 38,
          3: 33,
          4: 28,
        };

        const isZeroIndexed =
          note.string === undefined && note.stringIndex !== undefined;
        const resolvedStringIndex = isZeroIndexed
          ? note.stringIndex
          : Math.max(0, (note.string || 4) - 1);
        const stringBase = isZeroIndexed
          ? getBassMidiFromString(note.stringIndex, 0, true)
          : baseMidiByString[note.string] ?? 28;
        const calculatedMidi = stringBase + (note.fret || 0);
        const tech = (note.technique || 'normal').toLowerCase() as BassTechnique;
        const stepDuration = getStepDuration(stepIndex);

        bassPreviewSynth.playNote({
          midi: calculatedMidi,
          technique: tech,
          slideDirection: note.slideDirection,
          stringIndex: resolvedStringIndex,
          duration: stepDuration * 3.8,
          velocity: tech === 'pop' || tech === 'slap' ? 120 : 105,
          scheduleTime: hitTime,
        });
      });
    },
    [getStepDuration]
  );

  const playGuitarStep = useCallback(
    (stepIndex: number, hitTime?: number) => {
      const currentStepNotes =
        activeNotesRef.current?.filter(
          (n: any) =>
            n.step === stepIndex &&
            (n.string !== undefined || n.stringIndex !== undefined) &&
            n.fret !== undefined
        ) || [];

      currentStepNotes.forEach((note: any) => {
        const isZeroIndexed =
          note.string === undefined && note.stringIndex !== undefined;
        const strVal = isZeroIndexed ? note.stringIndex : note.string;
        const calculatedMidi = getGuitarMidiFromString(
          strVal,
          note.fret || 0,
          isZeroIndexed
        );
        const rawTech = (note.technique || 'normal').toLowerCase();
        const tech = (rawTech === 'pull' ? 'pulloff' : rawTech) as GuitarTechnique;
        const stepDuration = getStepDuration(stepIndex);

        guitarPreviewSynth.playNote({
          midi: calculatedMidi,
          technique: tech,
          slideDirection: note.slideDirection,
          bendType: note.bendType,
          bendAmount: note.bendAmount,
          duration: stepDuration * 3.5,
          velocity:
            tech === 'natural_harmonic' || tech === 'pinch_harmonic' ? 115 : 100,
          time: hitTime,
          scheduleTime: hitTime,
        });
      });
    },
    [getStepDuration]
  );

  const scheduleStep = useCallback(
    (stepNumber: number, time: number) => {
      const liveInstrument = instrumentRef.current;
      const notesNow = activeNotesRef.current || [];
      const downbeat = isDownbeatStep(stepNumber);

      if (liveInstrument === 'drums') {
        const engine = getAudioEngine();
        const hits = notesNow.filter((n) => n.step === stepNumber && n.drumVoice);
        const liveTotalSteps = Math.max(1, totalStepsRef.current);
        hits.forEach((h) => {
          const isFoot = h.drumVoice === 'kick';
          const lastInfo = lastDrumStickingRef.current[h.drumVoice!];
          const stepDiff = lastInfo
            ? (stepNumber - lastInfo.step + liveTotalSteps) % liveTotalSteps
            : 999;
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

          const targetInstrument =
            h.drumVoice === 'hihat' ? 'hihat_closed' : h.drumVoice!;
          playDrumHit({
            instrument: targetInstrument,
            time,
            velocity: h.ghost ? 32 : h.accent ? 100 : 85,
            accent: !!h.accent && !h.ghost,
            ghost: !!h.ghost,
            syncopated: !!h.syncopated,
            sticking: isFoot ? null : (h.sticking as 'R' | 'L') || 'R',
            isDoubleRebound,
          });
        });
        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, downbeat);
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
          engine.playMetronome(time, downbeat);
        }
      } else if (liveInstrument === 'bass') {
        const engine = getStringsAudioEngine();
        playBassStep(stepNumber, time);

        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, downbeat);
        }
      } else if (liveInstrument === 'guitar') {
        const engine = getStringsAudioEngine();
        playGuitarStep(stepNumber, time);

        if (isBeatStep(stepNumber)) {
          engine.playMetronome(time, downbeat);
        }
      } else {
        const engine = getStringsAudioEngine();
        const stringNotes = notesNow.filter(
          (n) =>
            n.step === stepNumber &&
            n.string !== undefined &&
            n.fret !== undefined
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
          engine.playMetronome(time, downbeat);
        }
      }
    },
    [isBeatStep, isDownbeatStep, playBassStep, playGuitarStep, playStepAudio]
  );

  const schedulerLoop = useCallback(() => {
    const liveInstrument = instrumentRef.current;
    const liveTotalSteps = Math.max(1, totalStepsRef.current);
    const lockedMeasure = loopSingleMeasureRef.current;

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

      nextNoteTimeRef.current += getStepDuration(currentStep);
      playStepRef.current += 1;

      if (lockedMeasure !== null) {
        const lockedCfg = measureConfigListRef.current[lockedMeasure];
        const minStep = lockedCfg ? lockedCfg.startStep : 0;
        const maxStep = lockedCfg
          ? lockedCfg.endStep
          : minStep + Math.max(1, stepsPerMeasureRef.current);
        if (playStepRef.current >= maxStep || playStepRef.current < minStep) {
          playStepRef.current = minStep;
        }
      } else if (playStepRef.current >= liveTotalSteps) {
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
    const liveTotalMeasures = Math.max(1, totalMeasuresRef.current);
    const lockedMeasure = loopSingleMeasureRef.current;

    if (audioCtx && anchorAudioTimeRef.current > 0) {
      const stepDuration = getStepDuration(anchorStepRef.current);
      const deltaFromAnchor = audioCtx.currentTime - anchorAudioTimeRef.current;
      const exactStep = anchorStepRef.current + deltaFromAnchor / stepDuration;

      let currentGlobalStep: number;
      if (lockedMeasure !== null) {
        const lockedCfg = measureConfigListRef.current[lockedMeasure];
        const minStep = lockedCfg ? lockedCfg.startStep : 0;
        const mSteps = lockedCfg
          ? Math.max(1, lockedCfg.stepsPerMeasure)
          : Math.max(1, stepsPerMeasureRef.current);
        const stepInLocked =
          ((Math.floor(exactStep - minStep) % mSteps) + mSteps) % mSteps;
        currentGlobalStep = minStep + stepInLocked;
      } else {
        currentGlobalStep =
          ((Math.floor(exactStep) % liveTotalSteps) + liveTotalSteps) %
          liveTotalSteps;
      }

      setPlaybackActiveStep(currentGlobalStep);

      const currentPlayingCfg = getMeasureCfgForGlobalStep(currentGlobalStep);
      const currentPlayingMeasure = currentPlayingCfg.measureIndex;
      if (
        currentPlayingMeasure !== currentMeasureRef.current &&
        currentPlayingMeasure < liveTotalMeasures
      ) {
        currentMeasureRef.current = currentPlayingMeasure;
        setCurrentMeasure(currentPlayingMeasure);
      }
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [getStepDuration, getMeasureCfgForGlobalStep]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      loopSingleMeasureRef.current = null;
      setPreviewingPatternCode(null);
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
      loopSingleMeasureRef.current = null;
      setPreviewingPatternCode(null);
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
      const initialStep = activeMeasureStart;
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

  // Probar un patrón individual de 1 compás en bucle ("▶ Probar P1")
  const handlePreviewPattern = (code: string) => {
    if (isPlaying && previewingPatternCode === code) {
      handleStop();
      return;
    }

    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const targetMeasureIdx = handleEditPatternNotes(code);
    loopSingleMeasureRef.current = targetMeasureIdx;
    setPreviewingPatternCode(code);
    setIsPlaying(true);
    isPlayingRef.current = true;

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

    const targetCfg = measureConfigListRef.current[targetMeasureIdx];
    const initialStep = targetCfg ? targetCfg.startStep : 0;
    audioStartTimeRef.current = startTime;
    nextNoteTimeRef.current = startTime;
    playStepRef.current = initialStep;
    playStartStepRef.current = initialStep;
    anchorStepRef.current = initialStep;
    anchorAudioTimeRef.current = startTime;
    lastDrumStickingRef.current = {};
    setPlaybackActiveStep(initialStep);

    schedulerLoop();
    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    loopSingleMeasureRef.current = null;
    setPreviewingPatternCode(null);
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

    // Formatear datos para la base de datos enriquecidos con metadatos de patrón y subdivisión por compás
    let formattedData: any[] = [];
    if (instrument === 'drums') {
      formattedData = notes
        .filter((n) => n.drumVoice)
        .map((n) => {
          const cfg = getMeasureCfgForGlobalStep(n.step);
          const isKick = n.drumVoice === 'kick' || (n.drumVoice as string) === 'bombo';
          return {
            step: n.step,
            stepIndex: n.step - cfg.startStep,
            measureIndex: cfg.measureIndex,
            instrument: n.drumVoice,
            accent: Boolean(n.accent && !n.ghost),
            ghost: Boolean(n.ghost),
            syncopated: Boolean(n.syncopated),
            sticking: isKick ? 'K' : (n.sticking ?? 'R'),
            velocity: n.ghost ? 0.32 : n.accent ? 1.0 : 0.8,
            patternCode: cfg.patternCode,
            patternName: cfg.patternName,
            patternColor: cfg.patternColor,
            subdivision: cfg.subdivision,
            stepsPerMeasure: cfg.stepsPerMeasure,
          };
        });
    } else if (instrument === 'piano') {
      const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      formattedData = notes
        .filter((n) => n.midiNumber !== undefined || n.isRest)
        .map((n) => {
          const cfg = getMeasureCfgForGlobalStep(n.step);
          const midi = n.midiNumber ?? 60;
          const noteName = `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
          const hand = midi < 60 ? 'left' : 'right';
          return {
            step: n.step,
            stepIndex: n.step - cfg.startStep,
            measureIndex: cfg.measureIndex,
            midiNumber: midi,
            noteName,
            velocity: n.velocity ?? 100,
            durationSteps: n.durationSteps ?? 1,
            duration: n.duration ?? 'quarter',
            isRest: !!n.isRest,
            hand,
            finger: n.finger ? parseInt(n.finger, 10) : undefined,
            patternCode: cfg.patternCode,
            patternName: cfg.patternName,
            patternColor: cfg.patternColor,
            subdivision: cfg.subdivision,
            stepsPerMeasure: cfg.stepsPerMeasure,
          };
        });
    } else {
      formattedData = notes
        .filter((n) => n.string !== undefined && n.fret !== undefined)
        .map((n) => {
          const cfg = getMeasureCfgForGlobalStep(n.step);
          return {
            step: n.step,
            stepIndex: n.step - cfg.startStep,
            measureIndex: cfg.measureIndex,
            string: n.string,
            fret: n.fret,
            technique: n.technique ?? 'normal',
            slideDirection: n.slideDirection,
            bendType: n.bendType,
            bendAmount: n.bendAmount,
            finger: n.finger ?? '1',
            velocity: 0.85,
            patternCode: cfg.patternCode,
            patternName: cfg.patternName,
            patternColor: cfg.patternColor,
            subdivision: cfg.subdivision,
            stepsPerMeasure: cfg.stepsPerMeasure,
          };
        });
    }

    // 1. Sincronizar previamente cualquier edición pendiente del patrón activo (editingPatternCode)
    const activeCode = editingPatternCode || activeMeasureConfig.patternCode || 'P1';
    const mStart = activeMeasureConfig.startStep;
    const mEnd = activeMeasureConfig.endStep;
    const mSub = activeMeasureSubdivision;
    const mSteps = activeMeasureConfig.stepsPerMeasure || stepsPerMeasure;

    const currentMeasureRelNotes = notes
      .filter((n) => n.step >= mStart && n.step < mEnd)
      .map((n) => {
        const inst = n.drumVoice || (n as any).instrument || 'snare';
        const isKick = inst === 'kick' || (inst as string) === 'bombo';
        return {
          ...n,
          step: n.step - mStart,
          stepIndex: n.step - mStart,
          instrument: inst,
          sticking: isKick ? ('K' as StickingType) : n.sticking,
        };
      });

    let currentBank = [...patternBank];
    const patIdx = currentBank.findIndex((p) => p.code === activeCode);
    const activeTimeSig = activeMeasureConfig.timeSignature || timeSignature || '4/4';
    if (patIdx !== -1) {
      currentBank[patIdx] = {
        ...currentBank[patIdx],
        timeSignature: activeTimeSig,
        subdivision: mSub,
        stepsPerMeasure: mSteps,
        notes: JSON.parse(JSON.stringify(currentMeasureRelNotes)),
      };
    } else {
      currentBank.push({
        code: activeCode,
        name: activeMeasureConfig.patternName || `Patrón ${activeCode.replace(/\D/g, '') || '1'}`,
        color: activeMeasureConfig.patternColor || 'cyan',
        timeSignature: activeTimeSig,
        subdivision: mSub,
        stepsPerMeasure: mSteps,
        sampleMeasureIndex: currentMeasure,
        usageCount: 1,
        notes: JSON.parse(JSON.stringify(currentMeasureRelNotes)),
      });
    }

    // 2. Construir copia profunda de measures con patternCode, patternName, patternColor, timeSignature, subdivision, stepsPerMeasure y notes
    const savedMeasures = measureConfigList.map((cfg) => {
      const mNotes = formattedData
        .filter((n) => n.step >= cfg.startStep && n.step < cfg.endStep)
        .map((n) => ({
          ...JSON.parse(JSON.stringify(n)),
          stepIndex: n.step - cfg.startStep,
          measureIndex: cfg.measureIndex,
          patternCode: cfg.patternCode,
          patternName: cfg.patternName,
          patternColor: cfg.patternColor,
          timeSignature: cfg.timeSignature || timeSignature || '4/4',
          subdivision: cfg.subdivision,
          stepsPerMeasure: cfg.stepsPerMeasure,
        }));
      return {
        measureIndex: cfg.measureIndex,
        measureNumber: cfg.measureIndex + 1,
        patternCode: cfg.patternCode,
        patternName: cfg.patternName,
        patternColor: cfg.patternColor,
        timeSignature: cfg.timeSignature || timeSignature || '4/4',
        subdivision: cfg.subdivision,
        stepsPerMeasure: cfg.stepsPerMeasure,
        notes: mNotes,
      };
    });

    // 3. Recalcular usageCount para todos los patrones (incluyendo patrones con 0x usos en secuencia)
    currentBank = currentBank.map((p) => ({
      ...p,
      usageCount: savedMeasures.filter((m) => m.patternCode === p.code).length,
    }));
    setPatternBank(currentBank);

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
          subdivision: activeMeasureSubdivision,
          tabOrNotation: tabString,
          level: masteryLevel,
          description: `Ejercicio compuesto en Studio Builder: ${title}`,
          difficultyLabel: difficulty === 'Básico' ? 'Básico-Medio' : difficulty === 'Intermedio' ? 'Intermedio' : 'Avanzado',
        });

        // Intentar guardar también en BD
        const normalizedSub = normalizeSubdivisionKey(activeMeasureSubdivision);
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
          measures: savedMeasures,
          patternBank: currentBank,
        }).catch(() => { });

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

      const normalizedSub = normalizeSubdivisionKey(activeMeasureSubdivision);
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
        measures: savedMeasures,
        patternBank: currentBank,
      });

      if (res.success) {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (err) {
          console.error('Error eliminando borrador tras publicar:', err);
        }

        const savedPayload = {
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
          measures: savedMeasures,
          patternBank: currentBank,
          hitsData: instrument === 'drums' ? formattedData : undefined,
          tabData: instrument !== 'drums' ? formattedData : undefined,
          instrument: instrument === 'drums' ? 'drums' : instrument === 'bass' ? 'bass_4' : instrument === 'piano' ? 'piano' : 'guitar_6',
        };

        saveLocalExercise(savedPayload);
        try {
          sessionStorage.setItem('soundlab_editing_exercise', JSON.stringify(savedPayload));
        } catch { }

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
            ? `/practice/${res.slug}`
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${instrument === 'drums'
                ? 'bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950 dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
            >
              <Drum className="w-3.5 h-3.5" />
              <span>Batería</span>
            </button>

            <button
              onClick={() => handleSelectInstrument('bass')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${instrument === 'bass'
                ? 'bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950 dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Bajo (4C)</span>
            </button>

            <button
              onClick={() => handleSelectInstrument('guitar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${instrument === 'guitar'
                ? 'bg-[#0891b2] text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950 dark:shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guitarra (6C)</span>
            </button>

            <button
              onClick={() => handleSelectInstrument('piano')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${instrument === 'piano'
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
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${saveResult.success
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
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold block mb-1">
            Métrica ({activeMeasureConfig.patternCode})
          </label>
          <select
            value={activeMeasureConfig.timeSignature || timeSignature}
            onChange={(e) => handleChangePatternTimeSignature(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <optgroup label="── MÉTRICAS SIMPLES ──" className="bg-slate-950 text-slate-400 font-bold">
              {TIME_SIGNATURE_OPTIONS.filter((o) => o.denominator === 4).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="── MÉTRICAS COMPUESTAS (/8) ──" className="bg-slate-950 text-cyan-400 font-bold">
              {TIME_SIGNATURE_OPTIONS.filter((o) => [6, 9, 12].includes(o.numerator) && o.denominator === 8).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="── MÉTRICAS IRREGULARES / AMALGAMADAS ──" className="bg-slate-950 text-amber-400 font-bold">
              {TIME_SIGNATURE_OPTIONS.filter((o) => ![6, 9, 12].includes(o.numerator) && o.denominator === 8).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Subdivisión (del patrón/compás activo en edición) */}
        <div>
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold block mb-1">
            Subdivisión ({activeMeasureConfig.patternCode})
          </label>
          <select
            value={normalizeSubdivisionKey(activeMeasureSubdivision)}
            onChange={(e) => handleChangeSubdivision(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <optgroup label="── SUBDIVISIONES REGULARES ──" className="bg-slate-950 text-slate-400 font-bold">
              <option value="1/4">1/4 (Negras - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, '1/4')} pasos)</option>
              <option value="1/8">1/8 (Corcheas - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, '1/8')} pasos)</option>
              <option value="1/16">1/16 (Semicorcheas - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, '1/16')} pasos)</option>
              <option value="1/32">1/32 (Fusas - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, '1/32')} pasos)</option>
            </optgroup>
            <optgroup label="── SUBDIVISIONES IRREGULARES (TRESILLOS / POLIRRITMIA) ──" className="bg-slate-950 text-amber-400 font-bold">
              <option value="1/8T">1/8T (Tresillos de Corchea - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, '1/8T')} pasos)</option>
              <option value="1/16T">1/16T (Tresillos de Semicorchea - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, '1/16T')} pasos)</option>
              <option value="quintillo">Quintillo (5:4 - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, 'quintillo')} pasos)</option>
              <option value="septillo">Septillo (7:4 - {calculateStepsForMeasure(activeMeasureConfig.timeSignature || timeSignature, 'septillo')} pasos)</option>
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
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${isPlaying
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${destination === 'general'
                  ? 'bg-slate-900 dark:bg-zinc-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Biblioteca General
              </button>

              <button
                type="button"
                onClick={() => setDestination('mastery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${destination === 'mastery'
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

      {/* 3. Gestor de Compases & Constructor de Patrones + Arreglador (40 Compases) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
        {/* Conmutador Superior: Modo Patrones + Arreglador vs Edición Directa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMeasureEditMode('patterns')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${measureEditMode === 'patterns'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>🧩 Modo Patrones + Arreglador (Multi-Compás)</span>
            </button>

            <button
              type="button"
              onClick={() => setMeasureEditMode('direct')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${measureEditMode === 'direct'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>📝 Edición Directa por Compás</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>
              Patrones en banco: <strong className="text-cyan-400">{patternBank.length}</strong>
            </span>
            <span>•</span>
            <span>
              Secuencia total: <strong className="text-cyan-400">{measures.length}</strong>{' '}
              {measures.length === 1 ? 'compás' : 'compases'}
            </span>
          </div>
        </div>

        {measureEditMode === 'patterns' ? (
          <div className="flex flex-col gap-5">
            {/* ============================================================ */}
            {/* SECCIÓN A — BANCO DE PATRONES (P1, P2, P3... HASTA P12+)      */}
            {/* ============================================================ */}
            <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <span>Sección A — Banco de Patrones Reutilizables (1 Compás c/u)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cada patrón tiene su propia subdivisión independiente (ej. P1 en 1/8T = 12 pasos, P2 en 1/16 = 16 pasos).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreatePattern}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Crear Patrón (P{patternBank.length + 1})</span>
                </button>
              </div>

              {/* Tarjetas de Patrones */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {patternBank.map((pat) => {
                  const style = getPatternStyle(pat.color);
                  const isEditingThis = editingPatternCode === pat.code;
                  const isPreviewingThis = isPlaying && previewingPatternCode === pat.code;
                  const assignedCount = measures.filter(
                    (m) => m.patternCode === pat.code
                  ).length;
                  const patNoteCount = pat.notes?.length || 0;
                  const patSubKey = normalizeSubdivisionKey(pat.subdivision || '1/16');
                  const patSteps =
                    pat.stepsPerMeasure || getStepsForSubdivision(patSubKey, timeSignature);

                  return (
                    <div
                      key={`bank-card-${pat.code}`}
                      className={`p-3 rounded-xl border transition-all flex flex-col gap-2.5 ${isEditingThis
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                      {/* Cabecera de la tarjeta: Badge P1 + Input Nombre + Uso + Eliminar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-black border shrink-0 ${style.badge}`}
                          >
                            {pat.code}
                          </span>
                          <input
                            type="text"
                            value={pat.name}
                            onChange={(e) => handleRenamePattern(pat.code, e.target.value)}
                            placeholder="Nombre del patrón..."
                            className="bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-lg px-2 py-1 text-xs font-bold text-white w-full focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {patNoteCount}n • {assignedCount}c
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeletePattern(pat.code)}
                            className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title={
                              patternBank.length > 1
                                ? `Eliminar ${pat.code} (${pat.name}) del banco y de la secuencia`
                                : `Limpiar las notas de ${pat.code}`
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{patternBank.length > 1 ? '🗑️ Eliminar' : 'Limpiar'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Mini-selector de Métrica Propia del Patrón */}
                      <div className="flex items-center justify-between gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          Métrica {pat.code}:
                        </span>
                        <select
                          value={pat.timeSignature || timeSignature}
                          onChange={(e) => handleChangePatternTimeSignature(e.target.value, pat.code)}
                          className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 rounded-md px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300 focus:outline-none cursor-pointer"
                          title={`Cambiar métrica independiente de ${pat.code}`}
                        >
                          <optgroup label="── SIMPLES (/4) ──" className="bg-slate-950 text-slate-400 font-bold">
                            {TIME_SIGNATURE_OPTIONS.filter((o) => o.denominator === 4).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.value}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="── COMPUESTAS (/8) ──" className="bg-slate-950 text-cyan-400 font-bold">
                            {TIME_SIGNATURE_OPTIONS.filter((o) => [6, 9, 12].includes(o.numerator) && o.denominator === 8).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.value}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="── IRREGULARES (/8) ──" className="bg-slate-950 text-amber-400 font-bold">
                            {TIME_SIGNATURE_OPTIONS.filter((o) => ![6, 9, 12].includes(o.numerator) && o.denominator === 8).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.value}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          {pat.timeSignature || timeSignature}
                        </span>
                      </div>

                      {/* Mini-selector de Subdivisión Propia del Patrón */}
                      <div className="flex items-center justify-between gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          Subdivisión {pat.code}:
                        </span>
                        <select
                          value={patSubKey}
                          onChange={(e) => handleChangeSubdivision(e.target.value, pat.code)}
                          className="bg-slate-900 border border-slate-700 hover:border-cyan-500/50 focus:border-cyan-400 rounded-md px-2 py-0.5 text-[11px] font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer"
                          title={`Cambiar subdivisión independiente de ${pat.code}`}
                        >
                          <option value="1/4">1/4 ({calculateStepsForMeasure(pat.timeSignature || timeSignature, '1/4')} pasos)</option>
                          <option value="1/8">1/8 ({calculateStepsForMeasure(pat.timeSignature || timeSignature, '1/8')} pasos)</option>
                          <option value="1/8T">1/8T ({calculateStepsForMeasure(pat.timeSignature || timeSignature, '1/8T')} pasos - Tresillos)</option>
                          <option value="1/16">1/16 ({calculateStepsForMeasure(pat.timeSignature || timeSignature, '1/16')} pasos)</option>
                          <option value="1/16T">1/16T ({calculateStepsForMeasure(pat.timeSignature || timeSignature, '1/16T')} pasos - Seisillos)</option>
                          <option value="quintillo">5:4 ({calculateStepsForMeasure(pat.timeSignature || timeSignature, 'quintillo')} pasos)</option>
                          <option value="septillo">7:4 ({calculateStepsForMeasure(pat.timeSignature || timeSignature, 'septillo')} pasos)</option>
                          <option value="1/32">1/32 ({calculateStepsForMeasure(pat.timeSignature || timeSignature, '1/32')} pasos)</option>
                        </select>
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                          {patSteps}p
                        </span>
                      </div>

                      {/* Botones de Acción del Patrón */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleEditPatternNotes(pat.code)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${isEditingThis
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                            }`}
                        >
                          <span>✏️ Editar Notas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePreviewPattern(pat.code)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${isPreviewingThis
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black animate-pulse'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                            }`}
                        >
                          <span>
                            {isPreviewingThis ? `⏸ Parar ${pat.code}` : `▶ Probar ${pat.code}`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSyncPatternToSequence(pat.code)}
                          className="px-2.5 py-1.5 rounded-lg font-bold bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title={`Propagar las notas de ${pat.code} a todos los compases asignados`}
                        >
                          <span>🔄 Sincronizar en Secuencia</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAppendPatternMeasure(pat.code)}
                          className="px-2.5 py-1.5 rounded-lg font-bold bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title={`Insertar un compás con ${pat.code} al final de la secuencia`}
                        >
                          <span>+ Añadir al Final</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================ */}
            {/* SECCIÓN B — ARREGLADOR DE SECUENCIA (C.1 HASTA C.40 O N)      */}
            {/* ============================================================ */}
            <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Sección B — Arreglador de Secuencia ({measures.length} Compases)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Define el largo total (ej. 40 compases), distribuye en bloques o selecciona un pincel de patrón y haz clic en cualquier compás C.1..C.{measures.length}.
                  </p>
                </div>

                {/* Herramientas de Distribución Rápida */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-mono text-slate-300">
                      Longitud de Secuencia (Compases):
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={targetSequenceLength}
                      onChange={(e) =>
                        setTargetSequenceLength(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplySequenceLength()}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all cursor-pointer"
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySequenceLength(40)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold transition-all cursor-pointer"
                      title="Configurar 40 compases de inmediato"
                    >
                      40 Compases
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDistributePatternsEqually}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    Distribuir Patrones Equitativamente
                  </button>
                </div>
              </div>

              {/* Barra de "Pincel de Patrón Activo" */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                  🖌️ Pincel de Patrón Activo (clic en C.1..C.{measures.length} para asignar):
                </span>
                {patternBank.map((pat) => {
                  const style = getPatternStyle(pat.color);
                  const isBrush = activeBrushPatternCode === pat.code;
                  const patSub = normalizeSubdivisionKey(pat.subdivision || '1/16');
                  const patSteps = pat.stepsPerMeasure || calculateStepsForMeasure(pat.timeSignature || timeSignature, patSub);
                  return (
                    <button
                      key={`brush-${pat.code}`}
                      type="button"
                      onClick={() => setActiveBrushPatternCode(pat.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${isBrush
                        ? `${style.badge} ring-2 ring-white/40 scale-105 shadow-md`
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      <span>[{pat.code}]</span>
                      <span>{pat.name}</span>
                      <span className="text-[10px] opacity-80">• {pat.timeSignature || timeSignature} • {patSub} ({patSteps}p)</span>
                    </button>
                  );
                })}
              </div>

              {/* Cuadrícula Compacta de los Compases (C.1 .. C.40) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                {measures.map((m, idx) => {
                  const style = getPatternStyle(m.patternColor);
                  const isSelected = currentMeasure === idx;
                  const noteCount = m.notes?.length || 0;

                  return (
                    <div
                      key={`arranger-cell-${idx}`}
                      onClick={() => handleAssignPatternToMeasure(idx, activeBrushPatternCode)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative group ${isSelected
                        ? 'bg-slate-800 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md'
                        : 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-800'
                        }`}
                      title={`Clic para asignar [${activeBrushPatternCode}] a Compás ${idx + 1} y editarlo`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-black text-white">
                          C.{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono text-amber-300/90 bg-slate-950 px-1 rounded">
                            {m.timeSignature || timeSignature} • {m.subdivision} ({m.stepsPerMeasure}p)
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {noteCount}n
                          </span>
                          {measures.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeasure(idx);
                              }}
                              className="w-4 h-4 rounded bg-rose-950/70 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                              title={`Eliminar Compás C.${idx + 1}`}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border truncate ${style.badge}`}
                      >
                        [{m.patternCode}] {m.patternName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Banner Indicador del Patrón actualmente abierto en la Cuadrícula */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono font-black">
                  Editando Patrón {measures[currentMeasure]?.patternCode || editingPatternCode} ({measures[currentMeasure]?.timeSignature || timeSignature} • {activeMeasureSubdivision} • {stepsPerMeasure} pasos)
                </span>
                <span className="font-bold text-cyan-200">
                  {measures[currentMeasure]?.patternName || 'Patrón Activo'}
                </span>
                <span className="text-slate-400 font-mono">
                  • Vista en Compás C.{currentMeasure + 1} de {measures.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {instrument === 'drums' && (
                  <button
                    type="button"
                    onClick={handleApplySyncopation}
                    className="px-3 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/50 text-violet-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                    title="Aplicar golpes sincopados en los contratiempos ('e' y 'a') con Ghost Notes en redoblante"
                  >
                    <span>⚡ Aplicar Síncopa</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleSyncPatternToSequence(
                      measures[currentMeasure]?.patternCode || editingPatternCode
                    )
                  }
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs transition-all cursor-pointer"
                >
                  🔄 Sincronizar {measures[currentMeasure]?.patternCode || editingPatternCode} en Secuencia
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Contenedor flexible de pestañas de compases (Modo Directo) */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                  >
                    <span>Compás {idx + 1}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isSelected
                        ? 'bg-slate-950/20 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400'
                        }`}
                    >
                      [{m.patternCode}] • {m.timeSignature || timeSignature} • {noteCount}n
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
                Total: <strong className="text-cyan-400">{measures.length}</strong>{' '}
                {measures.length === 1 ? 'compás' : 'compases'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 4. Paleta de Articulaciones y Técnicas */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-white/5 text-xs">
        {instrument === 'drums' ? (
          // Controles de Articulación para Batería
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Articulación:</span>

            {/* > Acento (mutuamente excluyente con Ghost Note) */}
            <button
              type="button"
              onClick={() => {
                const next = !selectedAccent;
                setSelectedAccent(next);
                if (next) setSelectedGhost(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${selectedAccent
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              title="Acento dinámico (>)"
            >
              <span className="text-sm font-black">&gt;</span>
              <span>Acento</span>
            </button>

            {/* ( ) Ghost Note (mutuamente excluyente con Acento, atajo G) */}
            <button
              type="button"
              onClick={() => {
                const next = !selectedGhost;
                setSelectedGhost(next);
                if (next) setSelectedAccent(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${selectedGhost
                ? 'border-slate-400 bg-slate-800/90 text-cyan-200 shadow-[0_0_10px_rgba(148,163,184,0.35)] ring-1 ring-cyan-400/40'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              title="Nota Fantasma suave a baja altura (Atajo: tecla G)"
            >
              <span className="font-mono font-black text-xs">( )</span>
              <span>Ghost Note</span>
            </button>

            {/* ⚡ Sincopado (atajo S) */}
            <button
              type="button"
              onClick={() => setSelectedSyncopated(!selectedSyncopated)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${selectedSyncopated
                ? 'border-violet-500/60 bg-violet-500/20 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              title="Marcar golpe como Sincopado en contratiempo (Atajo: tecla S)"
            >
              <span className="text-amber-300 font-black">⚡</span>
              <span>Sincopado</span>
            </button>

            {/* Sticking R / L */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-zinc-900 border border-white/10 font-mono">
              <button
                type="button"
                onClick={() => setSelectedSticking('R')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${selectedSticking === 'R'
                  ? 'bg-cyan-500 text-zinc-950 font-black'
                  : 'text-cyan-400 hover:bg-white/5'
                  }`}
              >
                R (Der)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSticking('L')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${selectedSticking === 'L'
                  ? 'bg-fuchsia-500 text-zinc-950 font-black'
                  : 'text-fuchsia-400 hover:bg-white/5'
                  }`}
              >
                L (Izq)
              </button>
            </div>

            {/* Botón rápido ⚡ Aplicar Síncopa al Compás */}
            <button
              type="button"
              onClick={handleApplySyncopation}
              className="px-2.5 py-1.5 rounded-xl font-bold bg-violet-950/60 hover:bg-violet-900/70 border border-violet-500/40 text-violet-200 flex items-center gap-1 transition-all cursor-pointer"
              title="Colocar/desplazar golpes sincopados en los contratiempos ('e' y 'a') con Ghost Notes"
            >
              <span>⚡ Aplicar Síncopa</span>
            </button>

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
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${isSelected
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
                  className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold ${selectedFinger === f
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
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all border ${selectedBendType === type.id
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
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all border ${selectedBendAmount === amt.id
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
          className={`w-full overflow-x-auto rounded-2xl p-4 sm:p-6 transition-all relative ${instrument === 'drums'
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
            <div className={`flex items-center pb-2 mb-2 font-mono text-xs ${instrument === 'drums' ? 'border-b border-white/10' : 'border-b border-[#4d2817]'
              }`}>
              <div className={`w-24 shrink-0 text-[11px] font-bold uppercase ${instrument === 'drums' ? 'text-slate-500 dark:text-zinc-400' : 'text-amber-200/90'
                }`}>
                Compás {currentMeasure + 1}
              </div>

              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${stepsPerMeasure}, minmax(0, 1fr))` }}>
                {Array.from({ length: stepsPerMeasure }).map((_, stepIdx) => {
                  const globalStep = activeMeasureStart + stepIdx;
                  const isPlayback = isPlaying && playbackActiveStep === globalStep;
                  const { label, isBeatStart } = getStepCountLabel(
                    stepIdx,
                    stepsPerMeasure,
                    activeMeasureSubdivision,
                    timeSignature
                  );

                  return (
                    <div
                      key={`step-head-${stepIdx}`}
                      className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${isPlayback ? 'scale-110' : ''
                        } ${isBeatStart && stepIdx > 0
                          ? instrument === 'drums'
                            ? 'border-l border-white/20'
                            : 'border-l border-amber-500/25'
                          : ''
                        }`}
                    >
                      <span
                        className={`font-mono transition-colors ${isPlayback
                          ? 'text-cyan-300 font-black text-xs'
                          : isBeatStart
                            ? instrument === 'drums'
                              ? 'text-cyan-400 font-bold text-xs'
                              : 'text-amber-300 font-black text-xs'
                            : instrument === 'drums'
                              ? 'text-slate-400 dark:text-slate-400 font-semibold text-[11px]'
                              : 'text-amber-200/50 font-semibold text-[11px]'
                          }`}
                      >
                        {label}
                      </span>
                      {/* Punto indicador de pulso a tierra */}
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 transition-colors ${isPlayback
                          ? 'bg-cyan-300 ring-2 ring-cyan-300/50'
                          : isBeatStart
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
                      const { isBeatStart } = getStepCountLabel(
                        stepIdx,
                        stepsPerMeasure,
                        activeMeasureSubdivision,
                        timeSignature
                      );
                      const hit = notes.find((n) => n.step === globalStep && (n.drumVoice === row.voice || (row.voice === 'hihat' && n.drumVoice === 'hihat_closed') || (row.voice === 'floor_tom' && n.drumVoice === 'granadero')));

                      const isKickTrack =
                        row.voice === 'kick' ||
                        (row.voice as string) === 'bombo' ||
                        hit?.drumVoice === 'kick' ||
                        (hit?.drumVoice as string) === 'bombo';
                      const displaySticking = isKickTrack
                        ? 'K'
                        : hit?.sticking || (row.voice === 'hihat' ? '×' : '•');

                      return (
                        <button
                          key={`drum-cell-${row.voice}-${stepIdx}`}
                          onClick={() => handleCellClick(stepIdx, undefined, row.voice)}
                          className={`h-full flex items-center justify-center transition-all relative ${isPlayback ? 'bg-cyan-500/15' : 'hover:bg-slate-100/50 dark:hover:bg-white/5'
                            } ${isBeatStart && stepIdx > 0 ? 'border-l border-white/10' : ''
                            }`}
                        >
                          {hit ? (
                            <div className="relative flex flex-col items-center">
                              {hit.accent && !hit.ghost && (
                                <span className="absolute -top-3.5 text-[11px] font-black text-cyan-500 dark:text-cyan-400">
                                  &gt;
                                </span>
                              )}
                              {hit.syncopated && (
                                <span
                                  className="absolute -top-3.5 -right-2 text-[10px] font-black text-violet-300 drop-shadow-[0_0_6px_rgba(139,92,246,0.8)]"
                                  title="Golpe Sincopado"
                                >
                                  ⚡
                                </span>
                              )}
                              {hit.ghost ? (
                                <div
                                  className="w-5 h-5 rounded-full bg-slate-800/90 border border-cyan-400/50 text-cyan-200 font-mono font-bold flex items-center justify-center text-[10px] opacity-75 shadow-inner"
                                  title="Ghost Note (Nota Fantasma)"
                                >
                                  ({isKickTrack ? 'K' : hit.sticking || '●'})
                                </div>
                              ) : row.voice === 'hihat_open' || hit.drumVoice === 'hihat_open' ? (
                                <div
                                  className={`w-7 h-7 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center text-xs shadow-[0_0_14px_rgba(251,191,36,0.7)] ring-2 ${hit.syncopated
                                    ? 'ring-violet-400 ring-offset-1 ring-offset-black'
                                    : 'ring-amber-300 ring-offset-1 ring-offset-black'
                                    }`}
                                >
                                  {displaySticking || '○'}
                                </div>
                              ) : (
                                <div
                                  className={`w-7 h-7 rounded-full bg-cyan-400 text-zinc-950 font-bold flex items-center justify-center text-xs shadow-[0_0_12px_rgba(34,211,238,0.5)] ${hit.syncopated ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-black' : ''
                                    }`}
                                >
                                  {displaySticking}
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
                          className={`h-full flex items-center justify-center transition-all relative ${isPlayback ? 'bg-cyan-400/20 shadow-[inset_0_0_8px_rgba(34,211,238,0.4)]' : 'hover:bg-white/5'
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
                                      className={`min-w-[24px] px-1 h-6 rounded-md bg-[#0a0402] border-2 ${hasSlideUp
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
                    className={`shrink-0 min-w-[32px] h-8 px-2 rounded-xl text-xs font-mono font-bold transition-all ${isSelected
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
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1 ${isSlideUpActive
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
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1 ${isSlideDownActive
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
