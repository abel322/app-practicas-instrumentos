// lib/audio/drumSynth.ts
// Motor de Batería Acústica de Estudio (Carácter Yamaha) con Sticking Universal R/L

export type DrumPiece =
  | 'kick'
  | 'bombo'
  | 'snare'
  | 'pad'
  | 'rim'
  | 'hihat'
  | 'hihat_closed'
  | 'hihat_open'
  | 'tom1'
  | 'tom2'
  | 'floor'
  | 'granadero'
  | 'tom3'
  | 'floor_tom'
  | 'ride'
  | 'crash';

export interface DrumHitOptions {
  instrument: DrumPiece | string;
  time?: number;
  velocity?: number;
  sticking?: 'R' | 'L' | null;
  accent?: boolean;
  isDoubleRebound?: boolean;
}

interface SampleConfig {
  key: string;
  midiNote: number;
  pan: number;
  baseGain: number;
  maxDuration: number;
  isFootPiece?: boolean; // True solo para el bombo
}

const DRUM_SAMPLE_MAP: Record<string, SampleConfig> = {
  kick: { key: 'kick', midiNote: 36, pan: 0.0, baseGain: 1.3, maxDuration: 1.15, isFootPiece: true },
  snare: { key: 'snare', midiNote: 38, pan: 0.0, baseGain: 1.15, maxDuration: 1.35 },
  snare_accent: { key: 'snare_accent', midiNote: 40, pan: 0.0, baseGain: 1.32, maxDuration: 1.55 },
  hihat_closed: { key: 'hihat_closed', midiNote: 42, pan: -0.36, baseGain: 1.05, maxDuration: 0.34 },
  hihat_open: { key: 'hihat_open', midiNote: 46, pan: -0.36, baseGain: 1.02, maxDuration: 1.65 },
  tom1: { key: 'tom1', midiNote: 48, pan: -0.2, baseGain: 1.15, maxDuration: 1.5 },
  tom2: { key: 'tom2', midiNote: 45, pan: 0.16, baseGain: 1.15, maxDuration: 1.7 },
  floor: { key: 'floor', midiNote: 41, pan: 0.38, baseGain: 1.22, maxDuration: 2.1 }, // Granadero
  ride: { key: 'ride', midiNote: 51, pan: 0.36, baseGain: 0.95, maxDuration: 2.6 },
  crash: { key: 'crash', midiNote: 49, pan: -0.34, baseGain: 1.0, maxDuration: 3.4 },
};

const MIDI_TO_NOTE_NAME: Record<number, string> = {
  36: 'C2',  // Bombo acústico
  38: 'D2',  // Snare acústico
  40: 'E2',  // Snare Rimshot / Acento
  41: 'F2',  // Granadero / Floor Tom
  42: 'Gb2', // Hi-Hat Cerrado
  45: 'A2',  // Tom 2
  46: 'Bb2', // Hi-Hat Abierto
  48: 'C3',  // Tom 1
  49: 'Db3', // Crash
  51: 'Eb3', // Ride
};

class YamahaAcousticDrumSampler {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading = false;
  private isLoaded = false;
  private activeOpenHiHatGain: GainNode | null = null;

  // Banco primario de alta definición acústica (timbre brillante y definido tipo Yamaha/Zildjian)
  private primarySampleBaseUrl =
    'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3';

  // Banco secundario de respaldo inmediato
  private fallbackSampleBaseUrl =
    'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3';

  public getContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.18, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.preloadSamples();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx!;
  }

  private async fetchAndDecode(url: string, ctx: AudioContext): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  }

  public async preloadSamples(): Promise<void> {
    if (this.isLoaded || this.isPreloading || typeof window === 'undefined') return;
    this.isPreloading = true;

    const ctx = this.getContext();
    const entries = Object.values(DRUM_SAMPLE_MAP);

    try {
      await Promise.all(
        entries.map(async (item) => {
          const noteName = MIDI_TO_NOTE_NAME[item.midiNote];
          if (!noteName) return;

          if (this.sampleBuffers.has(item.key)) return;

          // Intentar local -> primario MusyngKite -> secundario FluidR3_GM
          const candidateUrls = [
            `/soundfonts/drums/${noteName}.mp3`,
            `${this.primarySampleBaseUrl}/${noteName}.mp3`,
            `${this.fallbackSampleBaseUrl}/${noteName}.mp3`,
          ];

          for (const url of candidateUrls) {
            try {
              const buffer = await this.fetchAndDecode(url, ctx);
              this.sampleBuffers.set(item.key, buffer);
              break;
            } catch {
              // Probar siguiente
            }
          }
        })
      );
      this.isLoaded = true;
    } finally {
      this.isPreloading = false;
    }
  }

  public resolveSampleConfig(instrument: string, accent?: boolean): SampleConfig {
    const norm = (instrument || 'snare').toLowerCase().trim();

    if (norm === 'kick' || norm === 'bombo') return DRUM_SAMPLE_MAP.kick;
    if (norm === 'hihat_open' || norm === 'open_hihat') return DRUM_SAMPLE_MAP.hihat_open;
    if (norm === 'hihat' || norm === 'hihat_closed' || norm === 'hh') return DRUM_SAMPLE_MAP.hihat_closed;
    if (norm === 'tom1' || norm === 'high_tom') return DRUM_SAMPLE_MAP.tom1;
    if (norm === 'tom2' || norm === 'mid_tom') return DRUM_SAMPLE_MAP.tom2;
    if (norm === 'floor' || norm === 'granadero' || norm === 'tom3' || norm === 'floor_tom') {
      return DRUM_SAMPLE_MAP.floor;
    }
    if (norm === 'ride') return DRUM_SAMPLE_MAP.ride;
    if (norm === 'crash') return DRUM_SAMPLE_MAP.crash;

    if (accent) return DRUM_SAMPLE_MAP.snare_accent;
    return DRUM_SAMPLE_MAP.snare;
  }

  public playHit(options: DrumHitOptions) {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const hitTime = Math.max(ctx.currentTime, options.time ?? ctx.currentTime);
    const isAccented = Boolean(options.accent);
    const isRight = options.sticking === 'R';
    const isLeft = options.sticking === 'L';

    const config = this.resolveSampleConfig(options.instrument, isAccented);
    const buffer =
      this.sampleBuffers.get(config.key) ||
      (config.key === 'snare_accent' ? this.sampleBuffers.get('snare') : undefined);

    if (!buffer) {
      this.preloadSamples();
      this.playFallbackTransient(ctx, hitTime, config.key, isAccented);
      return;
    }

    // Choke Group: el Hi-Hat Cerrado corta de inmediato la cola del Hi-Hat Abierto
    if (config.key === 'hihat_closed' && this.activeOpenHiHatGain) {
      try {
        this.activeOpenHiHatGain.gain.cancelScheduledValues(hitTime);
        this.activeOpenHiHatGain.gain.setValueAtTime(this.activeOpenHiHatGain.gain.value, hitTime);
        this.activeOpenHiHatGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.03);
      } catch {}
      this.activeOpenHiHatGain = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(6800, hitTime);

    const gainNode = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    let velNorm = 1.0;
    if (options.velocity !== undefined) {
      if (options.velocity > 1.0) {
        velNorm = Math.min(1.25, Math.max(0.2, options.velocity / 100));
      } else {
        velNorm = Math.min(1.25, Math.max(0.2, options.velocity * 1.1));
      }
    }

    let finalGain = config.baseGain * velNorm;
    let panValue = config.pan;
    let playbackRate = 1.0;
    let lowpassFreq = 18000;
    let highShelfGain = 0;
    let duration = config.maxDuration;

    // Brillo acústico realista para Hi-Hats y Platos Yamaha
    if (config.key === 'hihat_closed') {
      highShelfGain = 6.5;
      playbackRate = 1.02;
    } else if (config.key === 'hihat_open') {
      highShelfGain = 5.5;
    } else if (config.key === 'ride' || config.key === 'crash') {
      highShelfGain = 3.5;
    }

    // Diferenciación real de Sticking (R vs L vs Acento >) para TODOS los elementos excepto el Bombo
    if (!config.isFootPiece) {
      if (isAccented) {
        // Golpe Acentuado (>): máxima energía, brillo abierto y ataque completo en cualquier mano
        finalGain *= 1.28;
        lowpassFreq = 19000;
        highShelfGain += 3.0;
        playbackRate *= 1.012;
        panValue = Math.max(-0.6, Math.min(0.6, config.pan + (isRight ? 0.08 : isLeft ? -0.08 : 0)));
      } else if (isRight) {
        // Mano Derecha (R): golpe líder definido, punta brillante, ligera apertura a la derecha
        finalGain *= 1.0;
        lowpassFreq = 16500;
        highShelfGain += 2.0;
        playbackRate *= 1.022; // +38 cents aprox (zona más cercana al borde/punta)
        panValue = Math.max(-0.65, Math.min(0.65, config.pan + 0.14));
      } else if (isLeft) {
        // Mano Izquierda (L): golpe de acompañamiento (~28% más suave), timbre más cálido y grave
        finalGain *= 0.72;
        lowpassFreq = 7800; // Punta de baqueta menos brillante que la mano derecha
        highShelfGain -= 2.5;
        playbackRate *= 0.976; // -42 cents aprox (golpe ligeramente más interno/cálido)
        panValue = Math.max(-0.65, Math.min(0.65, config.pan - 0.14));
        duration *= 0.88;
      }

      // Rebote natural en golpes dobles consecutivos (RR o LL) sin acento
      if (options.isDoubleRebound && !isAccented) {
        finalGain *= 0.82;
        playbackRate *= 0.99;
        duration *= 0.85;
      }
    }

    source.playbackRate.setValueAtTime(playbackRate, hitTime);
    lowpass.frequency.setValueAtTime(lowpassFreq, hitTime);
    highShelf.gain.setValueAtTime(highShelfGain, hitTime);
    if (panner) {
      panner.pan.setValueAtTime(panValue, hitTime);
    }

    gainNode.gain.setValueAtTime(finalGain, hitTime);
    gainNode.gain.setValueAtTime(finalGain, hitTime + duration * 0.72);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + duration);

    if (config.key === 'hihat_open') {
      this.activeOpenHiHatGain = gainNode;
    }

    source.connect(lowpass);
    lowpass.connect(highShelf);
    highShelf.connect(gainNode);

    if (panner) {
      gainNode.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gainNode.connect(this.masterGain);
    }

    source.start(hitTime);
    source.stop(hitTime + duration + 0.05);
  }

  // Respaldo inmediato mientras se descargan los samples por primera vez
  private playFallbackTransient(ctx: AudioContext, time: number, key: string, accented: boolean) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = key === 'kick' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(key === 'kick' ? 110 : 185, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
    gain.gain.setValueAtTime(accented ? 0.5 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.13);
  }
}

export const drumSampler = new YamahaAcousticDrumSampler();

export function getDrumAudioContext(): AudioContext {
  return drumSampler.getContext();
}

export function playDrumHit(options: DrumHitOptions): void {
  drumSampler.playHit(options);
}

export const drumSynth = {
  play: (options: DrumHitOptions) => drumSampler.playHit(options),
  preload: () => drumSampler.preloadSamples(),
};
