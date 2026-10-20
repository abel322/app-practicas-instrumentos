import { DrumVoice } from '@/types/drum';

export class DrumAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private metronomeEnabled: boolean = true;
  private masterGain: GainNode | null = null;
  private metronomeGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Metronome Gain
    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    this.metronomeGain.connect(this.ctx.destination);

    // Pre-generate 2 seconds of high quality white noise for cymbals and snare wire
    this.generateNoiseBuffer();
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioContext(): AudioContext | null {
    if (!this.ctx) {
      this.init();
    }
    return this.ctx;
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  public setMetronomeEnabled(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public isMetronomeEnabled(): boolean {
    return this.metronomeEnabled;
  }

  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Dispara el instrumento especificado en el tiempo exacto de Web Audio
   */
  public trigger(instrument: DrumVoice, time?: number, velocity: number = 0.8, isAccent: boolean = false) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const playTime = time ?? this.ctx.currentTime;
    const effectiveVelocity = isAccent ? Math.min(1.0, velocity * 1.35) : velocity;

    switch (instrument) {
      case 'kick':
        this.playKick(playTime, effectiveVelocity, isAccent);
        break;
      case 'snare':
        this.playSnare(playTime, effectiveVelocity, isAccent);
        break;
      case 'hihat':
        this.playHiHat(playTime, effectiveVelocity, false);
        break;
      case 'hihat_open':
        this.playHiHat(playTime, effectiveVelocity, true);
        break;
      case 'ride':
        this.playRide(playTime, effectiveVelocity, isAccent);
        break;
      case 'crash':
        this.playCrash(playTime, effectiveVelocity);
        break;
      case 'tom1':
        this.playTom(playTime, 185, 110, effectiveVelocity);
        break;
      case 'tom2':
        this.playTom(playTime, 140, 80, effectiveVelocity);
        break;
      case 'floor_tom':
        this.playTom(playTime, 95, 55, effectiveVelocity);
        break;
      default:
        this.playSnare(playTime, effectiveVelocity, isAccent);
        break;
    }
  }

  /**
   * Clic del metrónomo sintetizado nítido y preciso
   */
  public playMetronome(time: number, isDownbeat: boolean = false) {
    if (!this.metronomeEnabled || !this.ctx || !this.metronomeGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Downbeat agudo (1600 Hz), beats secundarios (900 Hz)
    osc.frequency.setValueAtTime(isDownbeat ? 1600 : 920, time);

    const baseVol = isDownbeat ? 0.85 : 0.45;
    gain.gain.setValueAtTime(baseVol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (isDownbeat ? 0.045 : 0.03));

    osc.connect(gain);
    gain.connect(this.metronomeGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  // SÍNTESIS DE BOMBO (KICK)
  private playKick(time: number, velocity: number, isAccent: boolean) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = isAccent ? 165 : 140;
    const endFreq = 42;
    const duration = isAccent ? 0.28 : 0.22;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.07);

    // Click sutil para ataque punchy
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(320, time);
    clickGain.gain.setValueAtTime(0.4 * velocity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(time);
    clickOsc.stop(time + 0.02);

    const peakGain = 0.95 * velocity;
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // SÍNTESIS DE CAJA (SNARE)
  private playSnare(time: number, velocity: number, isAccent: boolean) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    // 1. Tono de cuerpo (membrana)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    const fundamental = isAccent ? 205 : 185;
    osc.frequency.setValueAtTime(fundamental, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.08);

    oscGain.gain.setValueAtTime(0.7 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.16 : 0.12));

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.18);

    // 2. Ruido de bordonera (snare wires)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1400, time);

    const noiseGain = this.ctx.createGain();
    const noiseDuration = isAccent ? 0.22 : 0.15;
    noiseGain.gain.setValueAtTime(0.85 * velocity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDuration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(time);
    noiseSource.stop(time + noiseDuration);
  }

  // SÍNTESIS DE HI-HAT
  private playHiHat(time: number, velocity: number, isOpen: boolean) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    const duration = isOpen ? 0.38 : 0.045;

    gain.gain.setValueAtTime(0.65 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + duration);
  }

  // SÍNTESIS DE RIDE
  private playRide(time: number, velocity: number, isAccent: boolean) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    // Campana armónica
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 820 : 610, time);

    oscGain.gain.setValueAtTime(0.4 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.4);

    // Resonancia metálica
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5200, time);
    filter.Q.setValueAtTime(6.0, time);

    const gain = this.ctx.createGain();
    const duration = 0.55;
    gain.gain.setValueAtTime(0.5 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + duration);
  }

  // SÍNTESIS DE CRASH
  private playCrash(time: number, velocity: number) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, time);

    const gain = this.ctx.createGain();
    const duration = 1.1;

    gain.gain.setValueAtTime(0.85 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + duration);
  }

  // SÍNTESIS DE TOMS
  private playTom(time: number, startFreq: number, endFreq: number, velocity: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.15);

    const duration = 0.35;
    gain.gain.setValueAtTime(0.85 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
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
