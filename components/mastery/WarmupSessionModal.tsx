'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MasterySkillNode } from '@/types/mastery';
import { getMasteryAudioEngine } from '@/lib/audio/masteryAudioService';
import {
  X,
  Play,
  Square,
  RotateCcw,
  Flame,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';

interface WarmupSessionModalProps {
  skill: MasterySkillNode;
  isOpen: boolean;
  onClose: () => void;
}

export const WarmupSessionModal: React.FC<WarmupSessionModalProps> = ({
  skill,
  isOpen,
  onClose,
}) => {
  const [remainingSec, setRemainingSec] = useState<number>(120); // 2 minutos = 120s
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(true);
  const [activeBeat, setActiveBeat] = useState<number>(0);

  const audioService = useRef(getMasteryAudioEngine());

  useEffect(() => {
    if (isOpen) {
      setRemainingSec(120);
      setIsRunning(true);
      setIsMetronomeActive(true);
      audioService.current.playWarmupStartSound();
      audioService.current.startMetronome(skill.warmupBpm, (beat) => {
        setActiveBeat(beat);
      });
    }
  }, [isOpen, skill]);

  // Temporizador de 2 minutos
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSec > 0) {
      interval = setInterval(() => {
        setRemainingSec((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            audioService.current.stopMetronome();
            audioService.current.playVictoryChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSec]);

  // Manejo de Metrónomo
  useEffect(() => {
    if (isMetronomeActive && isRunning) {
      audioService.current.startMetronome(skill.warmupBpm, (b) => setActiveBeat(b));
    } else {
      audioService.current.stopMetronome();
    }
  }, [isMetronomeActive, isRunning, skill.warmupBpm]);

  const handleClose = () => {
    audioService.current.stopMetronome();
    setIsRunning(false);
    onClose();
  };

  if (!isOpen) return null;

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isFinished = remainingSec === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 dark:bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors"
      >
        {/* Cabecera */}
        <header className="px-5 py-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold uppercase">
                Calentamiento Express
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {skill.technique} (Nivel {skill.level})
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Contenido */}
        <div className="p-6 flex flex-col items-center gap-5 text-center">
          {/* Reloj de 2 min */}
          <div className="space-y-1">
            <div className="text-5xl font-mono font-black text-amber-600 dark:text-amber-300 tracking-tight">
              {timeFormatted}
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Tempo Calentamiento: <span className="font-bold text-slate-900 dark:text-white">{skill.warmupBpm} BPM</span>
            </p>
          </div>

          {/* Indicadores visuales de compás */}
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((b) => (
              <div
                key={b}
                className={`w-3 h-3 rounded-full transition-all ${
                  isMetronomeActive && activeBeat === b
                    ? b === 0
                      ? 'bg-amber-500 scale-125 shadow-[0_0_10px_rgba(245,158,11,0.9)]'
                      : 'bg-amber-400 scale-110 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000"
              style={{ width: `${((120 - remainingSec) / 120) * 100}%` }}
            />
          </div>

          {/* Tablatura / Notación compacta */}
          <div className="w-full p-3 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-[11px] text-cyan-300 whitespace-pre overflow-x-auto text-left shadow-inner">
            {skill.microExercise.tabOrNotation}
          </div>

          {isFinished && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Calentamiento de 2 minutos completado con éxito!</span>
            </div>
          )}

          {/* Controles de Reproducción */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-2 shadow-md transition-all"
            >
              {isRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reanudar</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsMetronomeActive(!isMetronomeActive)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              title="Activar/Silenciar metrónomo"
            >
              {isMetronomeActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                setRemainingSec(120);
                setIsRunning(true);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              title="Reiniciar 2 minutos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
