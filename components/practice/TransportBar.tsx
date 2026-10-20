'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Minus, 
  Plus, 
  RotateCcw 
} from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  bpm: number;
  minBpm?: number;
  maxBpm?: number;
  metronomeEnabled: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onBpmChange: (newBpm: number) => void;
  onToggleMetronome: () => void;
  onResetBpm?: () => void;
  defaultBpm?: number;
  backHref?: string;
  backLabel?: string;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  bpm,
  minBpm = 40,
  maxBpm = 240,
  metronomeEnabled,
  onPlayPause,
  onStop,
  onBpmChange,
  onToggleMetronome,
  onResetBpm,
  defaultBpm = 100,
  backHref = '/',
  backLabel = 'Catálogo',
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBpmChange(Number(e.target.value));
  };

  const handleStepBpm = (delta: number) => {
    const nextBpm = Math.min(maxBpm, Math.max(minBpm, bpm + delta));
    onBpmChange(nextBpm);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-3 sm:p-4 border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4">
      {/* 1. Botón Volver al Catálogo */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-sm font-medium"
          title={`Volver a ${backLabel}`}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
      </div>

      {/* 2. Controles de Transporte Primarios: Play / Pause & Stop */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Play / Pause Principal */}
        <button
          onClick={onPlayPause}
          className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 shadow-lg ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)]'
          }`}
          title={isPlaying ? 'Pausar (Barra Espaciadora)' : 'Reproducir (Barra Espaciadora)'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Práctica</span>
            </>
          )}
        </button>

        {/* Botón Stop / Reiniciar compás */}
        <button
          onClick={onStop}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
          title="Detener y volver al inicio (Esc)"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Control de Tempo (BPM) con Slider y Micro-Pasos */}
      <div className="flex items-center gap-3 bg-zinc-900/60 border border-white/5 px-3 py-1.5 rounded-xl">
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">TEMPO</span>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-cyan-400 font-bold text-base">{bpm}</span>
              <span className="text-[11px] text-zinc-400">BPM</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => handleStepBpm(-5)}
              className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="-5 BPM"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={minBpm}
              max={maxBpm}
              value={bpm}
              onChange={handleSliderChange}
              className="w-24 sm:w-32 h-1.5 bg-zinc-750 accent-cyan-400 rounded-lg cursor-pointer bg-zinc-800"
            />

            <button
              onClick={() => handleStepBpm(5)}
              className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="+5 BPM"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {onResetBpm && bpm !== defaultBpm && (
              <button
                onClick={onResetBpm}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-cyan-400 transition-colors ml-1"
                title={`Restablecer BPM por defecto (${defaultBpm})`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Conmutador de Metrónomo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMetronome}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
            metronomeEnabled
              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
              : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300'
          }`}
          title="Alternar Metrónomo (Tecla M)"
        >
          {metronomeEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Metrónomo ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-zinc-500" />
              <span>Metrónomo OFF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
