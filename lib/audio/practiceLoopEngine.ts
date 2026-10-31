// Motor de Práctica en Bucle (Loop de Escalas, Arpegios y Rasgueos con Metrónomo)
// Basado en Web Audio API de Alta Precisión Temporal

import { midiToFrequency } from '@/lib/music-theory/fretboard';

export interface LoopNoteItem {
  midi: number;
  stringIndex: number;
  fret: number;
  duration?: number;
  noteName?: string;
  isRoot?: boolean;
}

export type ScaleLoopPattern = 'asc' | 'pendulum';
export type ChordLoopPattern = 'arpeggio' | 'strum';

export interface LoopEngineConfig {
  bpm: number;
  mode: 'scale' | 'chord_arpeggio' | 'chord_strum';
  notes: LoopNoteItem[];
  scalePattern?: ScaleLoopPattern;
  onStepNote?: (noteIndex: number, currentNote: LoopNoteItem | null) => void;
}

export class PracticeLoopEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isRunning: boolean = false;
  private currentStepIndex: number = 0;
  private timerId: number | null = null;
  private config: LoopEngineConfig | null = null;
  private generatedSequence: LoopNoteItem[] = [];

  constructor() {}

  private initAudio() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  private buildSequence(): LoopNoteItem[] {
    if (!this.config || !this.config.notes || this.config.notes.length === 0) {
      return [];
    }

    const rawNotes = [...this.config.notes];

    if (this.config.mode === 'chord_strum') {
      // En rasgueo, ordenar cuerdas de grave a aguda (mayor stringIndex a menor stringIndex)
      return rawNotes.sort((a, b) => b.stringIndex - a.stringIndex);
    }

    if (this.config.mode === 'chord_arpeggio') {
      // En arpegio de acorde, de cuerda grave a aguda
      return rawNotes.sort((a, b) => b.stringIndex - a.stringIndex);
    }

    // Modo Escalas: ordenar ascendentemente por altura tonal (MIDI)
    const sorted = rawNotes.sort((a, b) => {
      if (a.midi !== b.midi) return a.midi - b.midi;
      return b.stringIndex - a.stringIndex;
    });

    if (this.config.scalePattern === 'pendulum') {
      if (sorted.length <= 1) return sorted;
      const asc = [...sorted];
      const desc = sorted.slice(1, -1).reverse();
      return [...asc, ...desc];
    }

    // Ascendente por defecto
    return sorted;
  }

  public start(config: LoopEngineConfig) {
    this.stop();
    this.initAudio();

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.config = { ...config };
    this.generatedSequence = this.buildSequence();

    if (this.generatedSequence.length === 0) {
      return;
    }

    this.isRunning = true;
    this.currentStepIndex = 0;

    this.scheduleNextTick();
  }

  public setBpm(newBpm: number) {
    if (this.config) {
      this.config.bpm = Math.max(40, Math.min(240, newBpm));
    }
  }

  public updateConfig(newConfig: Partial<LoopEngineConfig>) {
    if (!this.config) return;
    this.config = { ...this.config, ...newConfig };
    this.generatedSequence = this.buildSequence();
    if (this.currentStepIndex >= this.generatedSequence.length) {
      this.currentStepIndex = 0;
    }
  }

  private scheduleNextTick() {
    if (!this.isRunning || !this.ctx || !this.config) return;

    const bpm = this.config.bpm || 80;

    // Duración de paso:
    // - Rasgueo: cada 2 tiempos (blanca) = (60 / bpm) * 2 * 1000 ms
    // - Escalas y Arpegios: cada corchea (medio tiempo) = (60 / bpm) * 0.5 * 1000 ms
    const stepIntervalMs =
      this.config.mode === 'chord_strum'
        ? (60 / bpm) * 1.5 * 1000
        : (60 / bpm) * 0.5 * 1000;

    const tick = () => {
      if (!this.isRunning || !this.ctx || !this.config) return;

      if (this.config.mode === 'chord_strum') {
        // Rasguear acorde completo con micro-desfase realista entre cuerdas
        const chordNotes = this.generatedSequence;
        const now = this.ctx.currentTime;
        const strumDurationSec = 1.6;

        chordNotes.forEach((n, idx) => {
          const noteTime = now + idx * 0.035;
          this.playSynthesizedNote(n.midi, noteTime, strumDurationSec, 0.75);
        });

        if (this.config.onStepNote) {
          // -1 indica todo el acorde sonando
          this.config.onStepNote(-1, null);
        }
      } else {
        // Modo Nota individual (Arpegio o Escala)
        if (this.generatedSequence.length > 0) {
          const itemIndex = this.currentStepIndex % this.generatedSequence.length;
          const currentNote = this.generatedSequence[itemIndex];
          const now = this.ctx.currentTime;
          const noteDurationSec = Math.min(1.2, (stepIntervalMs / 1000) * 1.8);

          this.playSynthesizedNote(currentNote.midi, now, noteDurationSec, 0.85);

          if (this.config.onStepNote) {
            this.config.onStepNote(itemIndex, currentNote);
          }

          this.currentStepIndex = (this.currentStepIndex + 1) % this.generatedSequence.length;
        }
      }

      this.timerId = window.setTimeout(tick, stepIntervalMs);
    };

    tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.config && this.config.onStepNote) {
      this.config.onStepNote(-1, null);
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private playSynthesizedNote(
    midi: number,
    startTime: number,
    durationSec: number,
    velocity: number = 0.8
  ) {
    if (!this.ctx || !this.compressor) return;

    const freq = midiToFrequency(midi);
    const isBass = midi < 50;
    const decay = isBass ? durationSec * 1.3 : durationSec;

    // Oscilador 1: Onda triangular cálida (cuerpo acústico)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Oscilador 2: Armónicos brillantes de cuerda
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, startTime);

    // Filtro dinámico paso-bajo
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const initCutoff = isBass ? Math.min(2600, freq * 7) : Math.min(4800, freq * 6);
    filter.frequency.setValueAtTime(initCutoff, startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 1.2), startTime + decay * 0.85);
    filter.Q.setValueAtTime(isBass ? 2.2 : 1.6, startTime);

    // Envolvente de ganancia
    const gainNode = this.ctx.createGain();
    const peakGain = velocity * (isBass ? 0.9 : 0.65);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    // Conectar osciladores y filtro
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.compressor);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + decay + 0.05);
    osc2.stop(startTime + decay + 0.05);

    // Transitorio acústico de púa/dedo
    this.playPluckTransient(startTime, freq, isBass ? 0.3 : 0.22);
  }

  private playPluckTransient(startTime: number, noteFreq: number, intensity: number) {
    if (!this.ctx || !this.compressor) return;

    const pluckOsc = this.ctx.createOscillator();
    const pluckGain = this.ctx.createGain();

    pluckOsc.type = 'triangle';
    pluckOsc.frequency.setValueAtTime(Math.min(1600, noteFreq * 2.8), startTime);
    pluckOsc.frequency.exponentialRampToValueAtTime(75, startTime + 0.02);

    pluckGain.gain.setValueAtTime(intensity, startTime);
    pluckGain.gain.exponentialRampToValueAtTime(0.0008, startTime + 0.025);

    pluckOsc.connect(pluckGain);
    pluckGain.connect(this.compressor);

    pluckOsc.start(startTime);
    pluckOsc.stop(startTime + 0.03);
  }
}

export const practiceLoopEngine = new PracticeLoopEngine();

