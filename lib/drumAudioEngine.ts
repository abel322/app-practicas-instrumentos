// lib/drumAudioEngine.ts
// Motor Integrado de Batería Acústica y Metrónomo para Práctica y Secuenciadores

import { DrumVoice } from '@/types/drum';
import {
  drumSampler,
  DrumHitOptions,
  playDrumHit,
  getDrumAudioContext,
  drumSynth,
  DrumPiece,
} from './audio/drumSynth';

export type { DrumHitOptions, DrumPiece };
export { drumSampler, playDrumHit, drumSynth, getDrumAudioContext };

export class DrumAudioEngine {
  private metronomeEnabled: boolean = true;
  private metronomeGain: GainNode | null = null;

  constructor() {}

  public init() {
    drumSampler.getContext();
    this.ensureMetronomeGain();
  }

  public resume() {
    const ctx = drumSampler.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext {
    return drumSampler.getContext();
  }

  public getCurrentTime(): number {
    return drumSampler.getContext().currentTime;
  }

  public setMetronomeEnabled(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public isMetronomeEnabled(): boolean {
    return this.metronomeEnabled;
  }

  private ensureMetronomeGain(): GainNode | null {
    const ctx = drumSampler.getContext();
    if (!ctx) return null;
    if (!this.metronomeGain) {
      this.metronomeGain = ctx.createGain();
      this.metronomeGain.gain.setValueAtTime(0.6, ctx.currentTime);
      this.metronomeGain.connect(ctx.destination);
    }
    return this.metronomeGain;
  }

  /**
   * Dispara el instrumento especificado en el tiempo exacto de Web Audio
   * mediante el motor de muestras acústicas reales (Drum Sampler)
   */
  public trigger(
    instrumentOrOptions: DrumVoice | 'pad' | DrumHitOptions,
    time?: number,
    velocity: number = 0.8,
    isAccent: boolean = false,
    sticking?: 'R' | 'L' | null,
    isDoubleRebound: boolean = false
  ) {
    if (typeof instrumentOrOptions === 'object' && instrumentOrOptions !== null) {
      drumSampler.playHit(instrumentOrOptions);
    } else {
      drumSampler.playHit({
        instrument: instrumentOrOptions,
        time,
        velocity,
        accent: isAccent,
        sticking,
        isDoubleRebound,
      });
    }
  }

  /**
   * Clic del metrónomo sintetizado nítido y preciso (independiente de los samples)
   */
  public playMetronome(time: number, isDownbeat: boolean = false) {
    if (!this.metronomeEnabled) return;
    const ctx = drumSampler.getContext();
    if (!ctx) return;

    const metroGain = this.ensureMetronomeGain();
    if (!metroGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Downbeat agudo (1600 Hz), beats secundarios (920 Hz)
    osc.frequency.setValueAtTime(isDownbeat ? 1600 : 920, time);

    const baseVol = isDownbeat ? 0.85 : 0.45;
    gain.gain.setValueAtTime(baseVol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (isDownbeat ? 0.045 : 0.03));

    osc.connect(gain);
    gain.connect(metroGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

// Singleton global para todo el ciclo de vida del cliente
let globalEngineInstance: DrumAudioEngine | null = null;

export function getAudioEngine(): DrumAudioEngine {
  if (typeof window === 'undefined') {
    return new DrumAudioEngine();
  }
  if (!globalEngineInstance) {
    globalEngineInstance = new DrumAudioEngine();
  }
  return globalEngineInstance;
}
