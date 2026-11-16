'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { DrumExerciseData, DrumHit } from '@/types/drum';
import { getAudioEngine } from '@/lib/drumAudioEngine';
import { drumSampler, playDrumHit } from '@/lib/audio/drumSynth';
import { DrumScoreRenderer } from './DrumScoreSVG';
import { TransportBar } from './TransportBar';
import { StickingLegend } from './StickingLegend';
import { getLocalExercises } from '@/lib/exercises/customExercisesStorage';
import {
  analyzeMeasureDuplicates,
  extractPatternBankFromMeasures,
  getPatternStyle,
  inferSubdivisionFromSteps,
} from '@/lib/music/measureFingerprint';
import {
  normalizeSubdivisionKey,
  getStepsForSubdivision,
  getSubdivisionConfig,
} from '@/lib/music-theory/rhythmSubdivisions';
import { ArrowLeft, Drum, Sparkles, Keyboard, Maximize2, Minimize2 } from 'lucide-react';

interface PracticePlayerProps {
  exercise: DrumExerciseData;
}

export const PracticePlayer: React.FC<PracticePlayerProps> = ({ exercise }) => {
  // Estado local del ejercicio con hidratación reactiva si existe una versión actualizada en localStorage
  const [activeExercise, setActiveExercise] = useState<DrumExerciseData>(exercise);

  useEffect(() => {
    try {
      // 1. Revisar si hay datos en sessionStorage de una sesión reciente de edición
      const sessionRaw = sessionStorage.getItem('soundlab_editing_exercise');
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        if (parsed.slug === exercise.slug) {
          setActiveExercise((prev) => ({ ...prev, ...parsed }));
          return;
        }
      }

      // 2. Revisar si el ejercicio fue guardado en localStorage
      const localList = getLocalExercises();
      const found = localList.find((e: any) => e.slug === exercise.slug);
      if (found) {
        setActiveExercise((prev) => ({ ...prev, ...found }));
        return;
      }

      // 3. Consultar a la API en segundo plano para obtener siempre los compases y patternBank más recientes de PostgreSQL
      fetch(`/api/exercises/${exercise.slug}?instrument=drums`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.exercise) {
            setActiveExercise((prev) => ({
              ...prev,
              ...data.exercise,
            }));
          }
        })
        .catch((e) => {
          console.warn('API fetch fallback en PracticePlayer:', e);
        });
    } catch (e) {
      console.warn('Error sincronizando ejercicio local en PracticePlayer:', e);
    }
  }, [exercise.slug]);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(activeExercise.bpmDefault || 100);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Pantalla Completa con Orientación Forzada Apaisada
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscapeCSS, setIsForceLandscapeCSS] = useState<boolean>(false);
  const drumFullscreenRef = useRef<HTMLDivElement | null>(null);

  // Referencias para el scheduler de Web Audio API (Chris Wilson lookahead pattern con anclaje de fase continua)
  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(activeExercise.bpmDefault || 100);
  const audioStartTimeRef = useRef<number>(0);
  const nextNoteTimeRef = useRef<number>(0);
  const schedulerStepRef = useRef<number>(0);
  const anchorStepRef = useRef<number>(0);
  const anchorAudioTimeRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastStickingByInstrumentRef = useRef<Record<string, { sticking: string; step: number; accent: boolean }>>({});

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Precarga de muestras de batería acústica real
  useEffect(() => {
    drumSampler.preloadSamples();
  }, []);

  // ==============================================================
  // 1. LECTURA DINÁMICA DE SUBDIVISIÓN Y PASOS POR COMPÁS
  // ==============================================================
  const rawSubdivision =
    activeExercise?.subdivision ||
    (activeExercise?.totalSteps === 8
      ? '1/8'
      : activeExercise?.totalSteps === 4
      ? '1/4'
      : activeExercise?.totalSteps === 12 && activeExercise?.timeSignature === '4/4'
      ? '1/8T'
      : '1/16');

  const normalizedSub = normalizeSubdivisionKey(rawSubdivision);
  const stepsPerMeasure =
    activeExercise?.stepsPerMeasure ||
    getStepsForSubdivision(normalizedSub, activeExercise?.timeSignature); // 8 para 1/8, 16 para 1/16

  const subConfig = useMemo(() => {
    return getSubdivisionConfig(normalizedSub, activeExercise?.timeSignature, stepsPerMeasure);
  }, [normalizedSub, activeExercise?.timeSignature, stepsPerMeasure]);

  // ==============================================================
  // 1B. BANCO DE PATRONES Y MODO DE PRÁCTICA (SECUENCIA COMPLETA VS PATRÓN EN BUCLE)
  // ==============================================================
  const [selectedPatternFilter, setSelectedPatternFilter] = useState<string>('ALL');

  const fullTotalMeasures =
    (activeExercise as any).measures?.length ||
    Math.max(1, Math.ceil((activeExercise?.totalSteps || stepsPerMeasure) / stepsPerMeasure));

  // Compases completos de la secuencia con metadatos de patrón (patternCode, patternName, patternColor, subdivision, stepsPerMeasure)
  const fullMeasures = useMemo(() => {
    if (
      Array.isArray((activeExercise as any).measures) &&
      (activeExercise as any).measures.length > 0
    ) {
      let runningStep = 0;
      return (activeExercise as any).measures.map((m: any, idx: number) => {
        const rawNotes = m.notes || m.hits || [];
        const firstNoteWithMeta = rawNotes.find(
          (n: any) => n?.patternCode || n?.subdivision || n?.stepsPerMeasure
        );
        const mSub = normalizeSubdivisionKey(
          m.subdivision ||
            firstNoteWithMeta?.subdivision ||
            inferSubdivisionFromSteps(
              m.stepsPerMeasure || firstNoteWithMeta?.stepsPerMeasure || 16,
              normalizedSub
            )
        );
        const mSteps =
          Number(m.stepsPerMeasure || firstNoteWithMeta?.stepsPerMeasure) ||
          getStepsForSubdivision(mSub, activeExercise?.timeSignature) ||
          stepsPerMeasure;
        const startStep = runningStep;
        const endStep = startStep + mSteps;
        runningStep = endStep;

        return {
          measureIndex: idx,
          measureNumber: idx + 1,
          patternCode: m.patternCode || firstNoteWithMeta?.patternCode,
          patternName: m.patternName || firstNoteWithMeta?.patternName,
          patternColor: m.patternColor || firstNoteWithMeta?.patternColor,
          subdivision: mSub,
          stepsPerMeasure: mSteps,
          startStep,
          endStep,
          notes: rawNotes.map((n: any) => {
            const inst =
              n.instrument || n.drumVoice || n.drumType || n.instrumentKey || 'snare';
            const isKick =
              String(inst).toLowerCase().trim() === 'kick' ||
              String(inst).toLowerCase().trim() === 'bombo';
            const rel =
              n.stepIndex !== undefined
                ? n.stepIndex
                : n.step !== undefined
                ? n.step % mSteps
                : 0;
            return {
              ...n,
              stepIndex: rel,
              step: startStep + rel,
              instrument: inst,
              accent: Boolean(n.accent && !n.ghost),
              ghost: Boolean(n.ghost),
              syncopated: Boolean(n.syncopated),
              sticking: isKick ? 'K' : (n.sticking || 'R'),
              velocity: n.ghost ? 0.32 : (n.velocity ?? 0.8),
              subdivision: mSub,
              stepsPerMeasure: mSteps,
            };
          }),
        };
      });
    }

    const hits = activeExercise.hitsData || (activeExercise as any).data || [];
    let runningStep = 0;
    return Array.from({ length: fullTotalMeasures }).map((_, mIdx) => {
      const mStartDefault = mIdx * stepsPerMeasure;
      const mEndDefault = mStartDefault + stepsPerMeasure;
      const rawMeasNotes = hits.filter((h: any) => {
        if (h.measureIndex !== undefined) {
          return Number(h.measureIndex) === mIdx;
        }
        const s =
          h.step !== undefined
            ? h.step
            : h.stepIndex !== undefined
            ? h.stepIndex
            : 0;
        return s >= mStartDefault && s < mEndDefault;
      });

      const firstWithMeta = rawMeasNotes.find(
        (n: any) => n?.patternCode || n?.subdivision || n?.stepsPerMeasure
      );
      const mSub = normalizeSubdivisionKey(
        firstWithMeta?.subdivision ||
          inferSubdivisionFromSteps(firstWithMeta?.stepsPerMeasure ?? 16, normalizedSub)
      );
      const mSteps =
        Number(firstWithMeta?.stepsPerMeasure) ||
        getStepsForSubdivision(mSub, activeExercise?.timeSignature) ||
        stepsPerMeasure;
      const startStep = runningStep;
      const endStep = startStep + mSteps;
      runningStep = endStep;

      const mNotes = rawMeasNotes.map((h: any) => {
        const s =
          h.step !== undefined
            ? h.step
            : h.stepIndex !== undefined
            ? h.stepIndex
            : 0;
        const rel =
          h.stepIndex !== undefined ? h.stepIndex : (s - mStartDefault + mSteps) % mSteps;
        const inst =
          h.instrument || h.drumVoice || h.drumType || h.instrumentKey || 'snare';
        const isKick =
          String(inst).toLowerCase().trim() === 'kick' ||
          String(inst).toLowerCase().trim() === 'bombo';
        return {
          ...h,
          step: startStep + rel,
          stepIndex: rel,
          instrument: inst,
          accent: Boolean(h.accent && !h.ghost),
          ghost: Boolean(h.ghost),
          syncopated: Boolean(h.syncopated),
          sticking: isKick ? 'K' : (h.sticking || 'R'),
          velocity: h.ghost ? 0.32 : (h.velocity ?? 0.8),
          subdivision: mSub,
          stepsPerMeasure: mSteps,
        };
      });

      return {
        measureIndex: mIdx,
        measureNumber: mIdx + 1,
        patternCode: firstWithMeta?.patternCode,
        patternName: firstWithMeta?.patternName,
        patternColor: firstWithMeta?.patternColor,
        subdivision: mSub,
        stepsPerMeasure: mSteps,
        startStep,
        endStep,
        notes: mNotes,
      };
    });
  }, [activeExercise, fullTotalMeasures, stepsPerMeasure, normalizedSub]);

  // Extraer banco de patrones únicos (P1..Pn) preservando su subdivisión propia
  const patternBank = useMemo(() => {
    if (
      Array.isArray((activeExercise as any).patternBank) &&
      (activeExercise as any).patternBank.length > 0
    ) {
      return (activeExercise as any).patternBank.map((p: any) => {
        const pSub = normalizeSubdivisionKey(
          p.subdivision ||
            inferSubdivisionFromSteps(p.stepsPerMeasure ?? 16, normalizedSub)
        );
        const pSteps =
          Number(p.stepsPerMeasure) ||
          getStepsForSubdivision(pSub, activeExercise?.timeSignature) ||
          stepsPerMeasure;
        return {
          ...p,
          subdivision: pSub,
          stepsPerMeasure: pSteps,
        };
      });
    }
    return extractPatternBankFromMeasures(
      fullMeasures,
      normalizedSub,
      stepsPerMeasure
    );
  }, [activeExercise, fullMeasures, normalizedSub, stepsPerMeasure]);

  // Compases activos según si el alumno eligió practicar la secuencia completa o un patrón individual en bucle
  const measures = useMemo(() => {
    if (selectedPatternFilter === 'ALL') {
      return fullMeasures;
    }
    const targetPat = patternBank.find((p: any) => p.code === selectedPatternFilter);
    if (!targetPat) {
      return fullMeasures;
    }
    const patSub = normalizeSubdivisionKey(
      targetPat.subdivision ||
        inferSubdivisionFromSteps(targetPat.stepsPerMeasure ?? 16, normalizedSub)
    );
    const patSteps =
      Number(targetPat.stepsPerMeasure) ||
      getStepsForSubdivision(patSub, activeExercise?.timeSignature) ||
      stepsPerMeasure;

    return [
      {
        measureIndex: 0,
        measureNumber: 1,
        patternCode: targetPat.code,
        patternName: targetPat.name,
        patternColor: targetPat.color,
        subdivision: patSub,
        stepsPerMeasure: patSteps,
        startStep: 0,
        endStep: patSteps,
        notes: (targetPat.notes || []).map((n: any) => {
          const relStep =
            n.stepIndex !== undefined
              ? n.stepIndex
              : (n.step ?? 0) % patSteps;
          const inst =
            n.instrument || n.drumVoice || n.drumType || n.instrumentKey || 'snare';
          const isKick =
            String(inst).toLowerCase().trim() === 'kick' ||
            String(inst).toLowerCase().trim() === 'bombo';
          return {
            ...n,
            step: relStep,
            stepIndex: relStep,
            instrument: inst,
            accent: Boolean(n.accent && !n.ghost),
            ghost: Boolean(n.ghost),
            syncopated: Boolean(n.syncopated),
            sticking: isKick ? 'K' : (n.sticking || 'R'),
            velocity: n.ghost ? 0.32 : (n.velocity ?? 0.8),
            patternCode: targetPat.code,
            patternName: targetPat.name,
            patternColor: targetPat.color,
            subdivision: patSub,
            stepsPerMeasure: patSteps,
          };
        }),
      },
    ];
  }, [
    selectedPatternFilter,
    fullMeasures,
    patternBank,
    normalizedSub,
    activeExercise?.timeSignature,
    stepsPerMeasure,
  ]);

  const measuresRef = useRef(measures);
  useEffect(() => {
    measuresRef.current = measures;
  }, [measures]);

  const totalMeasures = measures.length;
  const totalSteps = useMemo(() => {
    if (measures.length === 0) return stepsPerMeasure;
    return measures[measures.length - 1].endStep || totalMeasures * stepsPerMeasure;
  }, [measures, stepsPerMeasure, totalMeasures]);

  const getMeasureForGlobalStep = useCallback(
    (globalStep: number) => {
      const list = measuresRef.current;
      if (!list || list.length === 0) return null;
      const found = list.find(
        (m: any) => globalStep >= m.startStep && globalStep < m.endStep
      );
      return found || list[0];
    },
    []
  );

  const activeMeasureObj = useMemo(() => {
    const found = measures.find(
      (m: any) => activeStep >= m.startStep && activeStep < m.endStep
    );
    return found || measures[0];
  }, [measures, activeStep]);

  const activeMeasureIndex = activeMeasureObj?.measureIndex ?? 0;
  const activeMeasureSteps = activeMeasureObj?.stepsPerMeasure || stepsPerMeasure;
  const activeMeasureSub = activeMeasureObj?.subdivision || normalizedSub;
  const stepInMeasure = Math.max(
    0,
    activeStep - (activeMeasureObj?.startStep || 0)
  );

  const activeSubConfig = useMemo(() => {
    return getSubdivisionConfig(
      activeMeasureSub as any,
      activeExercise?.timeSignature,
      activeMeasureSteps
    );
  }, [activeMeasureSub, activeExercise?.timeSignature, activeMeasureSteps]);

  // Pulsos por compás según métrica
  const beatsPerMeasure =
    activeExercise.timeSignature === '6/8'
      ? 2
      : activeExercise.timeSignature === '3/4'
      ? 3
      : 4;

  // ==============================================================
  // 2. SINCRONIZACIÓN DE TIEMPO DEL SECUENCIADOR WEB AUDIO (MULTI-SUBDIVISIÓN)
  // ==============================================================
  const getMeasureDuration = useCallback(
    (currentBpm: number) => {
      if (activeExercise.timeSignature === '6/8') {
        return (60 / currentBpm) * 3;
      }
      if (activeExercise.timeSignature === '3/4') {
        return (60 / currentBpm) * 3;
      }
      return (60 / currentBpm) * 4;
    },
    [activeExercise.timeSignature]
  );

  // La duración total del compás se mantiene constante ((60 / bpm) * 4); cada paso dura measureDurationSec / mSteps
  const getSecondsPerStep = useCallback(
    (currentBpm: number, forGlobalStep?: number) => {
      const measureDurationSec = getMeasureDuration(currentBpm);
      const targetStep =
        forGlobalStep !== undefined ? forGlobalStep : schedulerStepRef.current;
      const mObj = getMeasureForGlobalStep(targetStep);
      const mSteps = Math.max(
        1,
        mObj?.stepsPerMeasure || stepsPerMeasure || 16
      );
      return measureDurationSec / mSteps;
    },
    [getMeasureDuration, getMeasureForGlobalStep, stepsPerMeasure]
  );

  // Sincronizar BPM en caliente sin reiniciar el scheduler
  useEffect(() => {
    const prevBpm = bpmRef.current;
    bpmRef.current = bpm;

    if (isPlaying && bpm > prevBpm) {
      const engine = getAudioEngine();
      const ctx = engine.getAudioContext();
      if (ctx) {
        const newSecondsPerStep = getSecondsPerStep(bpm, schedulerStepRef.current);
        if (nextNoteTimeRef.current > ctx.currentTime + newSecondsPerStep) {
          nextNoteTimeRef.current = ctx.currentTime + newSecondsPerStep;
        }
      }
    }
  }, [bpm, isPlaying, getSecondsPerStep]);

  // Indexar hits por paso temporal desde los compases activos (secuencia completa o patrón individual en bucle)
  const hitsByStep = useRef<Map<number, DrumHit[]>>(new Map());
  useEffect(() => {
    const map = new Map<number, DrumHit[]>();
    for (let i = 0; i < totalSteps; i++) {
      map.set(i, []);
    }

    measures.forEach((m: any) => {
      const mStart = m.startStep || 0;
      const mSteps = m.stepsPerMeasure || stepsPerMeasure;
      (m.notes || []).forEach((hit: any) => {
        const relStep =
          hit.stepIndex !== undefined
            ? hit.stepIndex
            : (hit.step ?? 0) % mSteps;
        const globalStep = mStart + relStep;
        if (globalStep >= 0 && globalStep < totalSteps) {
          map.get(globalStep)?.push({
            step: globalStep,
            instrument:
              hit.instrument ||
              hit.drumVoice ||
              hit.drumType ||
              hit.instrumentKey ||
              'snare',
            accent: Boolean(hit.accent && !hit.ghost),
            ghost: Boolean(hit.ghost),
            syncopated: Boolean(hit.syncopated),
            sticking: hit.sticking || 'R',
            velocity: hit.ghost ? 0.32 : (hit.velocity ?? 0.8),
          });
        }
      });
    });

    hitsByStep.current = map;
  }, [measures, totalSteps, stepsPerMeasure]);

  // Planificador (Scheduler) de notas de Web Audio API con detección de rebote doble, sticking estéreo y metrónomo por compás
  const scheduleNote = useCallback(
    (stepNumber: number, time: number) => {
      const engine = getAudioEngine();

      // 1. Disparar los instrumentos en este paso
      const hits = hitsByStep.current.get(stepNumber) || [];
      hits.forEach((hit) => {
        const isFoot = hit.instrument === 'kick' || (hit.instrument as string) === 'bombo';
        const lastInfo = lastStickingByInstrumentRef.current[hit.instrument];
        const stepDiff = lastInfo ? (stepNumber - lastInfo.step + totalSteps) % totalSteps : 999;
        const isDoubleRebound =
          !isFoot &&
          Boolean(hit.sticking) &&
          lastInfo?.sticking === hit.sticking &&
          !hit.accent &&
          stepDiff <= 2;

        lastStickingByInstrumentRef.current[hit.instrument] = {
          sticking: hit.sticking || 'R',
          step: stepNumber,
          accent: !!hit.accent,
        };

        const targetInstrument = hit.instrument === 'hihat' ? 'hihat_closed' : hit.instrument;
        playDrumHit({
          instrument: targetInstrument,
          time,
          velocity:
            hit.ghost
              ? 32
              : hit.velocity !== undefined
              ? hit.velocity > 1
                ? hit.velocity
                : hit.velocity * 100
              : 80,
          accent: Boolean(hit.accent && !hit.ghost),
          ghost: Boolean(hit.ghost),
          syncopated: Boolean(hit.syncopated),
          sticking: isFoot ? null : (hit.sticking as 'R' | 'L') || 'R',
          isDoubleRebound,
        });
      });

      // 2. Metrónomo sincronizado en los tiempos de negra/pulso fuerte usando el stepsPerMeasure propio del compás
      const mObj = getMeasureForGlobalStep(stepNumber);
      const mStart = mObj?.startStep || 0;
      const mSteps = Math.max(1, mObj?.stepsPerMeasure || stepsPerMeasure || 16);
      const relStep = stepNumber - mStart;
      const mStepsPerBeat = Math.max(1, Math.round(mSteps / beatsPerMeasure));

      if (metronomeEnabled && relStep % mStepsPerBeat === 0) {
        const isDownbeat = relStep === 0;
        engine.playMetronome(time, isDownbeat);
      }
    },
    [
      metronomeEnabled,
      beatsPerMeasure,
      stepsPerMeasure,
      totalSteps,
      getMeasureForGlobalStep,
    ]
  );

  // Bucle lookahead de Web Audio con ventana de agendado de 80ms y anclaje de fase continua
  const scheduler = useCallback(() => {
    const engine = getAudioEngine();
    const ctx = engine.getAudioContext();
    if (!ctx) return;

    const scheduleAheadTime = 0.08;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const globalStep = schedulerStepRef.current;
      const hitTime = nextNoteTimeRef.current;

      // Actualizar anclaje de fase para el escáner visual
      anchorStepRef.current = globalStep;
      anchorAudioTimeRef.current = hitTime;

      scheduleNote(globalStep, hitTime);

      const stepDuration = getSecondsPerStep(bpmRef.current, globalStep);
      nextNoteTimeRef.current += stepDuration;

      schedulerStepRef.current = (schedulerStepRef.current + 1) % totalSteps;
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(scheduler, 20);
    }
  }, [totalSteps, getSecondsPerStep, scheduleNote]);

  // Bucle visual a 60/120 FPS anclado al último golpe de hardware (fase continua sin desfase al cambiar BPM o subdivisión)
  const updateVisualProgress = useCallback(() => {
    if (!isPlayingRef.current) return;

    const engine = getAudioEngine();
    const ctx = engine.getAudioContext();

    if (ctx && anchorAudioTimeRef.current > 0) {
      const currentBpm = bpmRef.current;
      const stepDuration = getSecondsPerStep(currentBpm, anchorStepRef.current);

      // Diferencia de tiempo respecto al golpe de referencia más reciente agendado (< 80ms)
      const deltaFromAnchor = ctx.currentTime - anchorAudioTimeRef.current;
      const exactStep = anchorStepRef.current + deltaFromAnchor / stepDuration;

      const normalizedStep =
        ((Math.floor(exactStep) % totalSteps) + totalSteps) % totalSteps;

      const mObj = getMeasureForGlobalStep(normalizedStep);
      const mStart = mObj?.startStep || 0;
      const mSteps = Math.max(1, mObj?.stepsPerMeasure || stepsPerMeasure || 16);

      // Progreso continuo dentro del compás activo para la animación del cabezal
      const stepInMeas = Math.max(0, exactStep - mStart);
      const normalizedProgress = Math.max(0, Math.min(1, stepInMeas / mSteps));

      setProgress(normalizedProgress);
      setActiveStep(normalizedStep);
    }

    rafIdRef.current = requestAnimationFrame(updateVisualProgress);
  }, [totalSteps, stepsPerMeasure, getSecondsPerStep, getMeasureForGlobalStep]);

  // Play / Pause con sincronización estricta AudioContext + 30ms lead-in
  const handlePlayPause = useCallback(() => {
    const engine = getAudioEngine();
    engine.init();
    engine.resume();

    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      const ctx = engine.getAudioContext();
      // Lookahead lead-in de 30ms para que Web Audio tenga tiempo de programar
      const startTime = (ctx ? ctx.currentTime : 0) + 0.03;
      audioStartTimeRef.current = startTime;
      nextNoteTimeRef.current = startTime;
      schedulerStepRef.current = 0;
      anchorStepRef.current = 0;
      anchorAudioTimeRef.current = startTime;
      lastStickingByInstrumentRef.current = {};

      setActiveStep(0);
      setProgress(0);

      scheduler();
      rafIdRef.current = requestAnimationFrame(updateVisualProgress);
    }
  }, [isPlaying, scheduler, updateVisualProgress]);

  // Detener y reiniciar compás
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    schedulerStepRef.current = 0;
    anchorStepRef.current = 0;
    anchorAudioTimeRef.current = 0;
    audioStartTimeRef.current = 0;
    lastStickingByInstrumentRef.current = {};
    setActiveStep(0);
    setProgress(0);
  }, []);

  // Metrónomo
  const handleToggleMetronome = useCallback(() => {
    const nextState = !metronomeEnabled;
    setMetronomeEnabled(nextState);
    getAudioEngine().setMetronomeEnabled(nextState);
  }, [metronomeEnabled]);

  // Control de Pantalla Completa
  const handleToggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      const elem = drumFullscreenRef.current;
      if (elem) {
        try {
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen no disponible o bloqueado:', err);
        }
      }

      let orientationLocked = false;
      try {
        const orientation =
          ((screen as any)?.orientation ||
            (screen as any)?.mozOrientation ||
            (screen as any)?.msOrientation) as any;
        if (orientation && typeof orientation.lock === 'function') {
          await orientation.lock('landscape');
          orientationLocked = true;
        }
      } catch (err) {
        console.warn('Orientación nativa no admitida o bloqueada:', err);
      }

      const isPortrait = window.innerHeight > window.innerWidth;
      setIsForceLandscapeCSS(!orientationLocked && isPortrait);
      setIsFullscreen(true);
    } else {
      try {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {}

      try {
        const orientation =
          ((screen as any)?.orientation ||
            (screen as any)?.mozOrientation ||
            (screen as any)?.msOrientation) as any;
        if (orientation && typeof orientation.unlock === 'function') {
          orientation.unlock();
        }
      } catch (err) {}

      setIsForceLandscapeCSS(false);
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Monitoreo de eventos de pantalla completa y redimensionado
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        setIsForceLandscapeCSS(window.innerHeight > window.innerWidth);
      }
    };

    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsForceLandscapeCSS(false);
        const orientation =
          ((screen as any)?.orientation ||
            (screen as any)?.mozOrientation ||
            (screen as any)?.msOrientation) as any;
        if (orientation && typeof orientation.unlock === 'function') {
          try {
            orientation.unlock();
          } catch (e) {}
        }
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isFullscreen) {
          handleToggleFullscreen();
        } else {
          handleStop();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMetronome();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setBpm((prev) => Math.min(240, prev + 5));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setBpm((prev) => Math.max(40, prev - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, handleStop, handleToggleMetronome, isFullscreen, handleToggleFullscreen]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const measureAnalysis = useMemo(() => {
    return analyzeMeasureDuplicates(
      measures,
      normalizedSub,
      stepsPerMeasure
    );
  }, [measures, normalizedSub, stepsPerMeasure]);

  const handleSelectMeasure = useCallback(
    (measureIdx: number) => {
      const targetMeas = measures[measureIdx];
      const newStep = targetMeas ? targetMeas.startStep || 0 : 0;
      setActiveStep(newStep);
      schedulerStepRef.current = newStep;
      anchorStepRef.current = newStep;
      setProgress(0);
    },
    [measures]
  );

  const handleSelectPatternMode = useCallback((mode: string) => {
    setSelectedPatternFilter(mode);
    setActiveStep(0);
    setProgress(0);
    schedulerStepRef.current = 0;
    anchorStepRef.current = 0;
    const ctx = getAudioEngine().getAudioContext();
    if (ctx && isPlayingRef.current) {
      anchorAudioTimeRef.current = ctx.currentTime;
      nextNoteTimeRef.current = ctx.currentTime + 0.02;
    }
  }, []);

  // Hits filtrados y normalizados para el compás activo (0 a activeMeasureSteps - 1)
  const activeMeasureHits = useMemo(() => {
    return measures[activeMeasureIndex]?.notes || [];
  }, [measures, activeMeasureIndex]);

  return (
    <div
      ref={drumFullscreenRef}
      className={`transition-all duration-200 ${
        isFullscreen
          ? isForceLandscapeCSS
            ? 'fixed inset-0 z-[9999] bg-[#0c0e14] w-[100vh] h-[100vw] origin-top-left rotate-90 translate-x-[100vw] flex flex-col justify-between p-3 sm:p-4 overflow-hidden select-none'
            : 'fixed inset-0 z-[9999] bg-[#0c0e14] flex flex-col justify-between p-3 sm:p-4 w-screen h-screen overflow-hidden select-none'
          : 'relative w-full max-w-6xl mx-auto flex flex-col gap-4'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. MODO PANTALLA COMPLETA                                       */}
      {/* ============================================================== */}
      {isFullscreen ? (
        <>
          {/* Cabecera con Controles Flotantes Permanentes */}
          <header className="w-full h-12 px-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg select-none">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs sm:text-sm font-black text-cyan-400 truncate max-w-[200px] sm:max-w-md">
                {activeExercise.title}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono shrink-0">
                Compás {activeMeasureIndex + 1} de {totalMeasures} • {activeSubConfig.name} ({activeMeasureSteps} pasos)
              </span>

              {patternBank.length >= 2 && (
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectPatternMode('ALL')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                      selectedPatternFilter === 'ALL'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    🔥 Secuencia ({fullMeasures.length}c)
                  </button>
                  {patternBank.map((pat: any) => {
                    const style = getPatternStyle(pat.color);
                    const isSelected = selectedPatternFilter === pat.code;
                    return (
                      <button
                        key={`fs-pat-${pat.code}`}
                        type="button"
                        onClick={() => handleSelectPatternMode(pat.code)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                          isSelected
                            ? `${style.badge} ring-1 ring-white/50`
                            : 'bg-slate-800/80 text-slate-400 border-slate-700'
                        }`}
                      >
                        [{pat.code} • {pat.name} • {pat.subdivision || '1/16'}]
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>✕ Salir</span>
              </button>
            </div>
          </header>

          {/* Lienzo de Cinta Horizontal Continua de Batería */}
          <main className="w-full flex-1 min-h-0 flex flex-col justify-center items-stretch bg-[#10131c] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl my-2 p-2 sm:p-4 relative">
            <div className="w-full h-full relative flex flex-col justify-center">
              <DrumScoreRenderer
                measures={measures}
                hits={activeMeasureHits}
                totalMeasures={totalMeasures}
                activeMeasureIndex={activeMeasureIndex}
                stepsPerMeasure={activeMeasureSteps}
                currentStepInMeasure={stepInMeasure}
                progress={progress}
                timeSignature={activeExercise.timeSignature}
                isPlaying={isPlaying}
                onSelectMeasure={handleSelectMeasure}
                isFullscreen={true}
              />
            </div>
          </main>

          {/* Barra Inferior Unificada (Play, Tempo, Metrónomo) */}
          <footer className="w-full h-14 px-4 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg select-none">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{isPlaying ? '⏸ Pausar' : '▶ Iniciar Práctica'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-amber-400 font-black">{bpm} BPM</span>
              <input
                type="range"
                min={40}
                max={220}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-20 sm:w-32 h-1 bg-slate-800 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleMetronome}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                metronomeEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              🔔 Metrónomo {metronomeEnabled ? 'ON' : 'OFF'}
            </button>
          </footer>
        </>
      ) : (
        /* ============================================================== */
        /* 2. MODO NORMAL (ESTÁNDAR)                                       */
        /* ============================================================== */
        <>
          {/* Header Superior del Ejercicio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Link
                href="/drums"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Volver al catálogo"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
                    {activeExercise.category}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{activeExercise.timeSignature}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Compás {activeMeasureIndex + 1} de {totalMeasures} • {activeSubConfig.name} ({activeMeasureSteps} pasos)
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeExercise.title}
                </h1>
              </div>
            </div>

            {/* Acciones y Dificultad */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Activar Pantalla Completa Apaisada"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pantalla Completa</span>
              </button>

              <span className="text-xs px-3 py-1 rounded-full font-semibold border bg-white/5 border-white/10 text-zinc-300">
                {activeExercise.difficulty}
              </span>
            </div>
          </div>

          {/* Barra de Calentamiento por Patrones (antes de tocar la secuencia completa) */}
          {patternBank.length >= 2 && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg select-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mr-1">
                  Practicar:
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectPatternMode('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedPatternFilter === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <span>🔥 Secuencia Completa ({fullMeasures.length} Compases)</span>
                </button>

                {patternBank.map((pat: any) => {
                  const style = getPatternStyle(pat.color);
                  const isSelected = selectedPatternFilter === pat.code;
                  return (
                    <button
                      key={`warmup-pat-${pat.code}`}
                      type="button"
                      onClick={() => handleSelectPatternMode(pat.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? `${style.badge} ring-2 ring-white/40 scale-105 shadow-md font-black`
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                      title={`Practicar únicamente ${pat.code} (${pat.name} • ${pat.subdivision || '1/16'}) en bucle continuo`}
                    >
                      <span>[{pat.code} • {pat.name} • {pat.subdivision || '1/16'}]</span>
                      <span className="text-[10px] opacity-75">({pat.usageCount}c)</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-mono text-cyan-400/90">
                {selectedPatternFilter === 'ALL'
                  ? `Secuencia completa activa (${fullMeasures.length} compases)`
                  : `🔁 Bucle individual activo: [${selectedPatternFilter}] (${activeMeasureSub} • Loop = ON)`}
              </span>
            </div>
          )}

          {/* Pentagrama de Batería en Cinta Horizontal Continua (Compás Actual + Siguiente) */}
          <div className="w-full relative overflow-hidden rounded-2xl glass-panel p-3 sm:p-5 border border-white/10 shadow-2xl">
            <DrumScoreRenderer
              measures={measures}
              hits={activeMeasureHits}
              totalMeasures={totalMeasures}
              activeMeasureIndex={activeMeasureIndex}
              stepsPerMeasure={activeMeasureSteps}
              currentStepInMeasure={stepInMeasure}
              progress={progress}
              timeSignature={activeExercise.timeSignature}
              isPlaying={isPlaying}
              onSelectMeasure={handleSelectMeasure}
              isFullscreen={false}
            />

            {/* Indicador de posición visual y estado del compás */}
            <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-zinc-500 font-mono border-t border-white/5 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>RUNWAY SCANNER:</span>
                <span className="text-zinc-300 font-medium">
                  {isPlaying
                    ? `Paso ${stepInMeasure + 1} / ${activeMeasureSteps} (Compás ${activeMeasureIndex + 1}/${totalMeasures})`
                    : `Compás ${activeMeasureIndex + 1}/${totalMeasures} • En pausa`}
                </span>
                {measureAnalysis[activeMeasureIndex]?.isDuplicate && (
                  <span className="text-amber-300 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                    ↻ =C.{measureAnalysis[activeMeasureIndex].sourceMeasureNumber} (
                    {measureAnalysis[activeMeasureIndex].occurrenceIndex}/
                    {measureAnalysis[activeMeasureIndex].totalOccurrences})
                  </span>
                )}
                {measureAnalysis[activeMeasureIndex]?.isPatternChange && (
                  <span className="text-fuchsia-300 border border-fuchsia-500/40 bg-fuchsia-950/60 px-1.5 py-0.5 rounded text-[10px]">
                    ⚡ CAMBIO DE PATRÓN
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span>SUBDIVISIÓN: {activeSubConfig.name} ({activeMeasureSteps}p)</span>
                <span className="text-zinc-400 font-semibold">{bpm} BPM</span>
              </div>
            </div>
          </div>

          {/* Barra de Transporte (Play, Stop, BPM, Metrónomo) */}
          <div className="w-full">
            <TransportBar
              isPlaying={isPlaying}
              bpm={bpm}
              metronomeEnabled={metronomeEnabled}
              onPlayPause={handlePlayPause}
              onStop={handleStop}
              onBpmChange={setBpm}
              onToggleMetronome={handleToggleMetronome}
              onResetBpm={() => setBpm(activeExercise.bpmDefault || 100)}
              defaultBpm={activeExercise.bpmDefault || 100}
            />
          </div>

          {/* Leyenda de Sticking y Notación Musical */}
          <div className="w-full">
            <StickingLegend />
          </div>

          {/* Atajos de Teclado y Descripción */}
          <div className="mt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 px-2">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
              <span>Atajos:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Espacio</kbd>
              <span>Play/Pausa</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Esc</kbd>
              <span>Stop/Salir</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">M</kbd>
              <span>Metrónomo</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">↑/↓</kbd>
              <span>BPM</span>
            </div>

            {activeExercise.description && (
              <p className="text-zinc-400 text-center sm:text-right italic max-w-md">
                "{activeExercise.description}"
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
