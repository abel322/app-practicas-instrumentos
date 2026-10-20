import { StringInstrument, StringTechnique } from '@/types/strings';

// Frecuencias base de cuerdas al aire (Standard Tuning)
// Cuerda 1 = más aguda, Cuerda 4/6 = más grave
const BASS_TUNING_FREQS: Record<number, number> = {
  1: 97.999,  // G2
  2: 73.416,  // D2
  3: 55.000,  // A1
  4: 41.203,  // E1
};

const GUITAR_TUNING_FREQS: Record<number, number> = {
  1: 329.628, // E4
  2: 246.942, // B3
  3: 196.000, // G3
  4: 146.832, // D3
  5: 110.000, // A2
  6: 82.407,  // E2
};

export class StringsAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private metronomeGain: GainNode | null = null;
  private metronomeEnabled: boolean = true;

  constructor() {}

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
    this.metronomeGain.connect(this.ctx.destination);
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioContext(): AudioContext | null {
    if (!this.ctx) this.init();
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

  /**
   * Calcula la frecuencia exacta en Hertz dado el instrumento, cuerda y traste
   */
  public getNoteFrequency(instrument: StringInstrument, stringNum: number, fret: number): number {
    const baseTable = instrument === 'bass_4' ? BASS_TUNING_FREQS : GUITAR_TUNING_FREQS;
    const baseFreq = baseTable[stringNum] || (instrument === 'bass_4' ? 55.0 : 196.0);
    // Fórmula temperada: f = f0 * 2^(fret / 12)
    return baseFreq * Math.pow(2, fret / 12);
  }

  /**
   * Dispara una nota de cuerda con modelado de técnica (Slap, Pop, Ghost, Slide, etc.)
   */
  public triggerNote(
    instrument: StringInstrument,
    stringNum: number,
    fret: number,
    time?: number,
    technique: StringTechnique = 'normal',
    velocity: number = 0.8
  ) {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.masterGain) return;

    const playTime = time ?? this.ctx.currentTime;
    const freq = this.getNoteFrequency(instrument, stringNum, fret);

    // Ajuste de duración y filtro según técnica e instrumento
    const isBass = instrument === 'bass_4';
    let duration = isBass ? 0.65 : 0.5;
    let initialFilterCutoff = isBass ? 1800 : 3500;
    let gainLevel = velocity * (isBass ? 0.9 : 0.75);

    if (technique === 'ghost') {
      duration = 0.08;
      initialFilterCutoff = 450;
      gainLevel *= 0.55;
    } else if (technique === 'slap') {
      duration = 0.35;
      initialFilterCutoff = 4000;
      gainLevel = Math.min(1.0, gainLevel * 1.3);
    } else if (technique === 'pop') {
      duration = 0.28;
      initialFilterCutoff = 5500;
      gainLevel = Math.min(1.0, gainLevel * 1.35);
    } else if (technique === 'vibrato') {
      duration = 0.85;
    }

    // 1. Oscilador 1: Onda triangular cálida (cuerpo fundamental)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, playTime);

    // 2. Oscilador 2: Diente de sierra sutil (brillo metálico de la cuerda entorchada)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, playTime);

    // Si es técnica vibrato, modulamos la frecuencia suavemente
    if (technique === 'vibrato') {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, playTime); // 5.5 Hz vibrato
      lfoGain.gain.setValueAtTime(freq * 0.02, playTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);
      lfo.start(playTime);
      lfo.stop(playTime + duration);
    }

    // 3. Filtro Biquad Paso-Bajo Dinámico (simula el decaimiento natural de armónicos)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(initialFilterCutoff, playTime);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(80, freq * 1.2),
      playTime + duration * 0.75
    );
    filter.Q.setValueAtTime(isBass ? 3.0 : 2.0, playTime);

    // 4. Envolvente de Ganancia (Attack rápido, Decay orgánico)
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, playTime);
    noteGain.gain.linearRampToValueAtTime(gainLevel, playTime + 0.005);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, playTime + duration);

    // Conexiones de audio
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(playTime);
    osc2.start(playTime);

    osc1.stop(playTime + duration);
    osc2.stop(playTime + duration);

    // Si es Slap o Pop, agregamos un transitorio percusivo de impacto
    if (technique === 'slap' || technique === 'pop') {
      this.playPluckTransient(playTime, technique === 'pop' ? 1800 : 600, velocity);
    }
  }

  // Click percusivo de ataque para Slap y Pop
  private playPluckTransient(time: number, freq: number, velocity: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.02);

    gain.gain.setValueAtTime(0.35 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  /**
   * Clics de metrónomo acústico de alta precisión
   */
  public playMetronome(time: number, isDownbeat: boolean = false) {
    if (!this.metronomeEnabled || !this.ctx || !this.metronomeGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1500 : 880, time);

    const baseVol = isDownbeat ? 0.8 : 0.4;
    gain.gain.setValueAtTime(baseVol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (isDownbeat ? 0.04 : 0.025));

    osc.connect(gain);
    gain.connect(this.metronomeGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

let globalStringsEngine: StringsAudioEngine | null = null;

export function getStringsAudioEngine(): StringsAudioEngine {
  if (typeof window === 'undefined') {
    return new StringsAudioEngine();
  }
  if (!globalStringsEngine) {
    globalStringsEngine = new StringsAudioEngine();
  }
  return globalStringsEngine;
}
