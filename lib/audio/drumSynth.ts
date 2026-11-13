// lib/audio/drumSynth.ts
// Motor de Batería Acústica Limpio (Sin saturación de EQ/Reverb, con Hi-Hat Cerrado/Abierto diferenciados y Sticking R/L)

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
  urls: string[];
  pan: number;
  baseGain: number;
  maxDuration: number;
  isFootPiece?: boolean;
}

const DRUM_SAMPLE_MAP: Record<string, SampleConfig> = {
  kick: {
    key: 'kick',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/kick.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/C2.mp3',
    ],
    pan: 0.0,
    baseGain: 1.15,
    maxDuration: 1.1,
    isFootPiece: true,
  },
  snare: {
    key: 'snare',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/snare.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/D2.mp3',
    ],
    pan: 0.0,
    baseGain: 1.05,
    maxDuration: 1.3,
  },
  snare_accent: {
    key: 'snare_accent',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/E2.mp3',
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/snare.mp3',
    ],
    pan: 0.0,
    baseGain: 1.15,
    maxDuration: 1.45,
  },
  hihat_closed: {
    key: 'hihat_closed',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/hihat.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/Gb2.mp3',
    ],
    pan: -0.35,
    baseGain: 0.9,
    maxDuration: 0.22,
  },
  hihat_open: {
    key: 'hihat_open',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/Bb2.mp3',
    ],
    pan: -0.35,
    baseGain: 0.85,
    maxDuration: 1.45,
  },
  tom1: {
    key: 'tom1',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom1.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/C3.mp3',
    ],
    pan: -0.22,
    baseGain: 1.05,
    maxDuration: 1.45,
  },
  tom2: {
    key: 'tom2',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom2.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/A2.mp3',
    ],
    pan: 0.16,
    baseGain: 1.05,
    maxDuration: 1.65,
  },
  floor: {
    key: 'floor',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom3.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/F2.mp3',
    ],
    pan: 0.38,
    baseGain: 1.1,
    maxDuration: 1.9,
  },
  ride: {
    key: 'ride',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/Eb3.mp3',
    ],
    pan: 0.36,
    baseGain: 0.82,
    maxDuration: 2.4,
  },
  crash: {
    key: 'crash',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/Db3.mp3',
    ],
    pan: -0.34,
    baseGain: 0.82,
    maxDuration: 2.8,
  },
};

export class CleanAcousticDrumEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading = false;
  private isLoaded = false;
  private activeOpenHiHatNodes: { gain: GainNode; source: AudioBufferSourceNode }[] = [];

  public getContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.0, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.preloadSamples();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx!;
  }

  private async fetchFirstAvailableBuffer(urls: string[], ctx: AudioContext): Promise<AudioBuffer | null> {
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuf = await res.arrayBuffer();
        return await ctx.decodeAudioData(arrayBuf);
      } catch {
        continue;
      }
    }
    return null;
  }

  public async preloadSamples(): Promise<void> {
    if (this.isLoaded || this.isPreloading || typeof window === 'undefined') return;
    this.isPreloading = true;

    const ctx = this.getContext();
    const entries = Object.values(DRUM_SAMPLE_MAP);

    try {
      await Promise.all(
        entries.map(async (item) => {
          if (this.sampleBuffers.has(item.key)) return;
          const buffer = await this.fetchFirstAvailableBuffer(item.urls, ctx);
          if (buffer) {
            this.sampleBuffers.set(item.key, buffer);
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

    if (
      norm === 'hihat_open' ||
      norm === 'open_hihat' ||
      norm === 'hh_open' ||
      norm.includes('open') ||
      norm.includes('abierto')
    ) {
      return DRUM_SAMPLE_MAP.hihat_open;
    }

    if (
      norm === 'hihat' ||
      norm === 'hihat_closed' ||
      norm === 'hh' ||
      norm.includes('hihat') ||
      norm.includes('cerrado')
    ) {
      return DRUM_SAMPLE_MAP.hihat_closed;
    }

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

    // Choke: al golpear Hi-Hat Cerrado, silencia suavemente cualquier Hi-Hat Abierto activo
    if (config.key === 'hihat_closed' && this.activeOpenHiHatNodes.length > 0) {
      this.activeOpenHiHatNodes.forEach(({ gain, source }) => {
        try {
          gain.gain.cancelScheduledValues(hitTime);
          gain.gain.setValueAtTime(Math.max(0.001, gain.gain.value), hitTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.03);
          source.stop(hitTime + 0.035);
        } catch {}
      });
      this.activeOpenHiHatNodes = [];
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';

    const gainNode = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    const velNorm =
      options.velocity !== undefined
        ? options.velocity > 1.0
          ? Math.min(1.15, Math.max(0.2, options.velocity / 100))
          : Math.min(1.15, Math.max(0.2, options.velocity))
        : 1.0;

    let finalGain = config.baseGain * velNorm;
    let panValue = config.pan;
    let playbackRate = 1.0;
    let lowpassFreq = 18000;
    let duration = config.maxDuration;

    // Diferenciación limpia de Sticking (R vs L vs Acento >) para todos los cuerpos excepto Bombo
    if (!config.isFootPiece) {
      if (isAccented) {
        finalGain *= 1.22;
        lowpassFreq = 19000;
        playbackRate *= 1.01;
        panValue = Math.max(-0.55, Math.min(0.55, config.pan + (isRight ? 0.08 : isLeft ? -0.08 : 0)));
      } else if (isRight) {
        finalGain *= 1.0;
        lowpassFreq = 16500;
        playbackRate *= 1.018;
        panValue = Math.max(-0.6, Math.min(0.6, config.pan + 0.12));
      } else if (isLeft) {
        finalGain *= 0.72;
        lowpassFreq = 8200;
        playbackRate *= 0.98;
        panValue = Math.max(-0.6, Math.min(0.6, config.pan - 0.12));
        if (config.key !== 'hihat_open') {
          duration *= 0.9;
        }
      }

      if (options.isDoubleRebound && !isAccented) {
        finalGain *= 0.84;
        playbackRate *= 0.992;
      }
    }

    source.playbackRate.setValueAtTime(playbackRate, hitTime);
    lowpass.frequency.setValueAtTime(lowpassFreq, hitTime);
    if (panner) {
      panner.pan.setValueAtTime(panValue, hitTime);
    }

    gainNode.gain.setValueAtTime(finalGain, hitTime);
    if (config.key === 'hihat_open') {
      gainNode.gain.setValueAtTime(finalGain, hitTime + 0.35);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + duration);
      const nodeRecord = { gain: gainNode, source };
      this.activeOpenHiHatNodes.push(nodeRecord);
      source.onended = () => {
        const idx = this.activeOpenHiHatNodes.indexOf(nodeRecord);
        if (idx !== -1) {
          this.activeOpenHiHatNodes.splice(idx, 1);
        }
      };
    } else {
      gainNode.gain.setValueAtTime(finalGain, hitTime + duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + duration);
    }

    source.connect(lowpass);
    lowpass.connect(gainNode);
    if (panner) {
      gainNode.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gainNode.connect(this.masterGain);
    }

    source.start(hitTime);
    source.stop(hitTime + duration + 0.05);
  }

  // Respaldo auditivo inmediato mientras se descargan las muestras por primera vez
  private playFallbackTransient(ctx: AudioContext, time: number, key: string, accented: boolean) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = key === 'kick' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(key === 'kick' ? 110 : 185, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
    gain.gain.setValueAtTime(accented ? 0.4 : 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.13);
  }
}

export const drumSampler = new CleanAcousticDrumEngine();
export { CleanAcousticDrumEngine as YamahaStudioDrumEngine };

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
