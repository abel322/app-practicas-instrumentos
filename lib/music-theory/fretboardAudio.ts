// Motor de Síntesis Web Audio de Alta Fidelidad para Diapasón y Armonía (SoundLab)

import { midiToFrequency } from './fretboard';

export class FretboardAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  constructor() {}

  public init() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Compresor para evitar distorsión en acordes rasgueados y dar pegada analógica
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  public resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  /**
   * Toca una nota individual mediante modelado acústico de cuerda pulsada
   */
  public triggerNote(
    midi: number,
    timeOffset: number = 0,
    durationSec: number = 1.0,
    velocity: number = 0.85
  ) {
    this.resume();
    if (!this.ctx || !this.compressor) return;

    const startTime = this.ctx.currentTime + timeOffset;
    const freq = midiToFrequency(midi);

    const isBass = midi < 50; // Notas graves típicas de bajo
    const decayTime = isBass ? Math.min(2.5, durationSec * 1.5) : durationSec;

    // Oscilador 1: Cuerpo fundamental (onda triangular redondeada)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Oscilador 2: Armónicos metálicos y cuerda entorchada (onda diente de sierra filtrada)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, startTime);

    // Filtro Paso-Bajo dinámico (simula amortiguación física de armónicos superiores)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const initialCutoff = isBass ? Math.min(2800, freq * 8) : Math.min(5000, freq * 6);
    filter.frequency.setValueAtTime(initialCutoff, startTime);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(60, freq * 1.2),
      startTime + decayTime * 0.85
    );
    filter.Q.setValueAtTime(isBass ? 2.5 : 1.8, startTime);

    // Envolvente de Ganancia (Attack percusivo instantáneo, Decay orgánico)
    const noteGain = this.ctx.createGain();
    const peakGain = velocity * (isBass ? 0.95 : 0.7);
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.004);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTime);

    // Conexiones de audio
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.compressor);

    osc1.start(startTime);
    osc2.start(startTime);

    osc1.stop(startTime + decayTime + 0.05);
    osc2.stop(startTime + decayTime + 0.05);

    // Transitorio acústico de púa / dedo sobre la cuerda
    this.triggerPluckTransient(startTime, freq, isBass ? 0.35 : 0.25);
  }

  private triggerPluckTransient(startTime: number, noteFreq: number, intensity: number) {
    if (!this.ctx || !this.compressor) return;

    const pluck = this.ctx.createOscillator();
    const pluckGain = this.ctx.createGain();

    pluck.type = 'triangle';
    pluck.frequency.setValueAtTime(Math.min(1800, noteFreq * 3), startTime);
    pluck.frequency.exponentialRampToValueAtTime(80, startTime + 0.02);

    pluckGain.gain.setValueAtTime(intensity, startTime);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.025);

    pluck.connect(pluckGain);
    pluckGain.connect(this.compressor);

    pluck.start(startTime);
    pluck.stop(startTime + 0.03);
  }

  /**
   * Arpegiar o rasguear un conjunto de notas
   * @param midiNotes Lista de notas MIDI ordenadas (ej: de cuerda grave a aguda)
   * @param style 'strum' (rasgueo rápido) o 'arpeggio' (arpegio espaciado)
   */
  public playChord(
    midiNotes: number[],
    style: 'strum' | 'arpeggio' = 'strum',
    delayPerNoteSec?: number
  ) {
    if (!midiNotes || midiNotes.length === 0) return;
    this.resume();

    const interval =
      delayPerNoteSec !== undefined
        ? delayPerNoteSec
        : style === 'strum'
        ? 0.038 // 38ms de separación por cuerda para un rasgueo natural
        : 0.17;  // 170ms para un arpegio fluido

    const noteDuration = style === 'strum' ? 1.4 : 1.1;

    midiNotes.forEach((midi, index) => {
      this.triggerNote(midi, index * interval, noteDuration, 0.85);
    });
  }
}

let globalFretboardAudio: FretboardAudioEngine | null = null;

export function getFretboardAudioEngine(): FretboardAudioEngine {
  if (typeof window === 'undefined') {
    return new FretboardAudioEngine();
  }
  if (!globalFretboardAudio) {
    globalFretboardAudio = new FretboardAudioEngine();
  }
  return globalFretboardAudio;
}
