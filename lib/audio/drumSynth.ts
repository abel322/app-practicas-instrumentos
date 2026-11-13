// lib/audio/drumSynth.ts
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
  // Tambores intactos (mismo sonido que ya funcionaba bien)
  kick: {
    key: 'kick',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/kick.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/C2.mp3',
    ],
    pan: 0.0,
    baseGain: 1.05,
    maxDuration: 1.0,
    isFootPiece: true,
  },
  snare: {
    key: 'snare',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/snare.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/D2.mp3',
    ],
    pan: 0.0,
    baseGain: 0.95,
    maxDuration: 1.2,
  },
  snare_accent: {
    key: 'snare_accent',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/E2.mp3',
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/snare.mp3',
    ],
    pan: 0.0,
    baseGain: 1.05,
    maxDuration: 1.35,
  },
  tom1: {
    key: 'tom1',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom1.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/C3.mp3',
    ],
    pan: -0.2,
    baseGain: 0.95,
    maxDuration: 1.35,
  },
  tom2: {
    key: 'tom2',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom2.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/A2.mp3',
    ],
    pan: 0.15,
    baseGain: 0.95,
    maxDuration: 1.5,
  },
  floor: {
    key: 'floor',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom3.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/F2.mp3',
    ],
    pan: 0.35,
    baseGain: 1.0,
    maxDuration: 1.8,
  },

  // Hi-Hat Cerrado y Abierto acústicos reales (carpeta percussion-mp3 verificada)
  hihat_closed: {
    key: 'hihat_closed',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/percussion-mp3/Gb2.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/Gb2.mp3',
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/hihat.mp3',
    ],
    pan: -0.32,
    baseGain: 0.92,
    maxDuration: 0.24,
  },
  hihat_open: {
    key: 'hihat_open',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/percussion-mp3/Bb2.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/Bb2.mp3',
    ],
    pan: -0.32,
    baseGain: 0.9,
    maxDuration: 1.4,
  },

  // Ride y Crash restaurados desde percussion-mp3
  ride: {
    key: 'ride',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/Eb3.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/percussion-mp3/Eb3.mp3',
    ],
    pan: 0.34,
    baseGain: 0.85,
    maxDuration: 2.2,
  },
  crash: {
    key: 'crash',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/percussion-mp3/Db3.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/percussion-mp3/Db3.mp3',
    ],
    pan: -0.32,
    baseGain: 0.85,
    maxDuration: 2.6,
  },
};

class AcousticDrumEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading = false;
  private isLoaded = false;
  private activeOpenHiHatNodes: { gain: GainNode; source: AudioBufferSourceNode }[] = [];

  public getContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.95, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.preloadSamples();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx!;
  }

  private async fetchFirstBuffer(urls: string[], ctx: AudioContext): Promise<AudioBuffer | null> {
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        return await ctx.decodeAudioData(buf);
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

    try {
      await Promise.all(
        Object.values(DRUM_SAMPLE_MAP).map(async (item) => {
          if (this.sampleBuffers.has(item.key)) return;
          const buffer = await this.fetchFirstBuffer(item.urls, ctx);
          if (buffer) this.sampleBuffers.set(item.key, buffer);
        })
      );
      this.isLoaded = true;
    } finally {
      this.isPreloading = false;
    }
  }

  public resolveConfig(instrument: string, accent?: boolean): SampleConfig {
    const norm = (instrument || 'snare').toLowerCase().trim();
    if (norm === 'kick' || norm === 'bombo') return DRUM_SAMPLE_MAP.kick;
    if (norm.includes('open') || norm.includes('abierto')) return DRUM_SAMPLE_MAP.hihat_open;
    if (norm.includes('hihat') || norm.includes('cerrado') || norm === 'hh') return DRUM_SAMPLE_MAP.hihat_closed;
    if (norm === 'tom1') return DRUM_SAMPLE_MAP.tom1;
    if (norm === 'tom2') return DRUM_SAMPLE_MAP.tom2;
    if (norm === 'floor' || norm === 'granadero' || norm === 'tom3' || norm === 'floor_tom') return DRUM_SAMPLE_MAP.floor;
    if (norm === 'ride') return DRUM_SAMPLE_MAP.ride;
    if (norm === 'crash') return DRUM_SAMPLE_MAP.crash;
    return accent ? DRUM_SAMPLE_MAP.snare_accent : DRUM_SAMPLE_MAP.snare;
  }

  public playHit(options: DrumHitOptions) {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const hitTime = Math.max(ctx.currentTime, options.time ?? ctx.currentTime);
    const isAccented = Boolean(options.accent);
    const isRight = options.sticking === 'R';
    const isLeft = options.sticking === 'L';

    const config = this.resolveConfig(options.instrument, isAccented);
    const buffer =
      this.sampleBuffers.get(config.key) ||
      (config.key === 'snare_accent' ? this.sampleBuffers.get('snare') : undefined);

    if (!buffer) {
      this.preloadSamples();
      return;
    }

    // Choke: al golpear Hi-Hat Cerrado, cierra suavemente el Hi-Hat Abierto
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
      options.velocity !== undefined ? Math.min(1.1, Math.max(0.2, options.velocity / 100)) : 1.0;

    let finalGain = config.baseGain * velNorm;
    let panValue = config.pan;
    let playbackRate = 1.0;
    let lowpassFreq = 18000;
    let duration = config.maxDuration;

    // Diferencia entre mano derecha (R) e izquierda (L) en todos los elementos excepto Bombo
    if (!config.isFootPiece) {
      if (isAccented) {
        finalGain *= 1.18;
        playbackRate = 1.01;
      } else if (isRight) {
        finalGain *= 1.0;
        playbackRate = 1.018;
        panValue = Math.min(0.6, config.pan + 0.12);
      } else if (isLeft) {
        finalGain *= 0.72;
        lowpassFreq = 8500;
        playbackRate = 0.98;
        panValue = Math.max(-0.6, config.pan - 0.12);
      }

      if (options.isDoubleRebound && !isAccented) {
        finalGain *= 0.85;
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
      this.activeOpenHiHatNodes.push({ gain: gainNode, source });
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
}

export const drumSampler = new AcousticDrumEngine();
export { AcousticDrumEngine as CleanAcousticDrumEngine, AcousticDrumEngine as YamahaStudioDrumEngine };

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
