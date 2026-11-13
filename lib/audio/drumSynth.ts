// lib/audio/drumSynth.ts
// Motor de Batería Acústica Yamaha de Estudio (Samples Reales + Sala Acústica + Choke Real de Hi-Hat)

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

// Muestras reales de estudio (Acoustic Studio Kit + Platos de Bronce)
const DRUM_SAMPLE_MAP: Record<string, SampleConfig> = {
  kick: {
    key: 'kick',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/kick.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/C2.mp3',
    ],
    pan: 0.0,
    baseGain: 1.35,
    maxDuration: 1.1,
    isFootPiece: true,
  },
  snare: {
    key: 'snare',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/snare.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/D2.mp3',
    ],
    pan: 0.0,
    baseGain: 1.2,
    maxDuration: 1.3,
  },
  snare_accent: {
    key: 'snare_accent',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/snare.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/E2.mp3',
    ],
    pan: 0.0,
    baseGain: 1.42,
    maxDuration: 1.5,
  },
  hihat_closed: {
    key: 'hihat_closed',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/hihat.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/Gb2.mp3',
    ],
    pan: -0.35,
    baseGain: 1.05,
    maxDuration: 0.19, // Corto, seco y nítido (platos cerrados)
  },
  hihat_open: {
    key: 'hihat_open',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/Bb2.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/Bb2.mp3',
    ],
    pan: -0.35,
    baseGain: 1.15,
    maxDuration: 1.65, // Largo, abierto y con sizzle metálico real
  },
  tom1: {
    key: 'tom1',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom1.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/C3.mp3',
    ],
    pan: -0.22,
    baseGain: 1.2,
    maxDuration: 1.45,
  },
  tom2: {
    key: 'tom2',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom2.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/A2.mp3',
    ],
    pan: 0.16,
    baseGain: 1.2,
    maxDuration: 1.65,
  },
  floor: {
    key: 'floor',
    urls: [
      'https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/tom3.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/F2.mp3',
    ],
    pan: 0.38,
    baseGain: 1.28,
    maxDuration: 2.0,
  },
  ride: {
    key: 'ride',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/Eb3.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/Eb3.mp3',
    ],
    pan: 0.36,
    baseGain: 1.0,
    maxDuration: 2.6,
  },
  crash: {
    key: 'crash',
    urls: [
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/Db3.mp3',
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/Db3.mp3',
    ],
    pan: -0.34,
    baseGain: 1.05,
    maxDuration: 3.4,
  },
};

export class YamahaStudioDrumEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private roomConvolver: ConvolverNode | null = null;
  private roomWetGain: GainNode | null = null;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading = false;
  private isLoaded = false;
  private activeOpenHiHatNodes: { gain: GainNode; source: AudioBufferSourceNode }[] = [];

  public getContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Compresor de Bus Acústico de Estudio
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.18, this.ctx.currentTime);

      // Sala acústica corta de cabina de grabación (0.28s) para realismo orgánico
      try {
        this.roomConvolver = this.ctx.createConvolver();
        this.roomConvolver.buffer = this.createStudioRoomImpulse(this.ctx, 0.28, 3.2);
        this.roomWetGain = this.ctx.createGain();
        this.roomWetGain.gain.setValueAtTime(0.16, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.masterGain.connect(this.roomConvolver);
        this.roomConvolver.connect(this.roomWetGain);
        this.roomWetGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } catch {
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }

      this.preloadSamples();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx!;
  }

  private createStudioRoomImpulse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return impulse;
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

  // IMPORTANTE: Evaluar 'open' / 'abierto' ANTES de 'hihat' para no confundir ambos platos
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

    // CHOKE REAL DE PEDAL: Cuando golpea el Hi-Hat Cerrado, silencia en 25ms cualquier Hi-Hat Abierto sonando
    if (config.key === 'hihat_closed' && this.activeOpenHiHatNodes.length > 0) {
      this.activeOpenHiHatNodes.forEach(({ gain, source }) => {
        try {
          gain.gain.cancelScheduledValues(hitTime);
          gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), hitTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.025);
          source.stop(hitTime + 0.03);
        } catch {}
      });
      this.activeOpenHiHatNodes = [];
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(6500, hitTime);

    const bodyEq = ctx.createBiquadFilter();
    bodyEq.type = 'peaking';

    const gainNode = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    let velNorm = 1.0;
    if (options.velocity !== undefined) {
      velNorm =
        options.velocity > 1.0
          ? Math.min(1.25, Math.max(0.2, options.velocity / 100))
          : Math.min(1.25, Math.max(0.2, options.velocity * 1.1));
    }

    let finalGain = config.baseGain * velNorm;
    let panValue = config.pan;
    let playbackRate = 1.0;
    let lowpassFreq = 18500;
    let highShelfGain = 0;
    let duration = config.maxDuration;

    // Perfil acústico Yamaha Recording Custom / Zildjian Hats
    if (config.key === 'hihat_closed') {
      // Cerrado: corto, compacto, definición de punta de baqueta sin cola larga
      playbackRate = 1.04;
      highShelfGain = 5.0;
      bodyEq.frequency.setValueAtTime(4200, hitTime);
      bodyEq.gain.setValueAtTime(3.5, hitTime);
      duration = 0.18;
    } else if (config.key === 'hihat_open') {
      // Abierto: sizzle amplio y metálico entre platillos sueltos
      playbackRate = 0.98;
      highShelfGain = 6.5;
      bodyEq.frequency.setValueAtTime(2800, hitTime);
      bodyEq.gain.setValueAtTime(4.0, hitTime);
      duration = 1.6;
    } else if (config.key === 'snare' || config.key === 'snare_accent') {
      // Casco de abedul Yamaha: cuerpo en 215 Hz + bordona nítida
      bodyEq.frequency.setValueAtTime(215, hitTime);
      bodyEq.gain.setValueAtTime(isAccented ? 4.5 : 2.5, hitTime);
      highShelfGain = isAccented ? 4.0 : 2.0;
    } else {
      bodyEq.frequency.setValueAtTime(120, hitTime);
      bodyEq.gain.setValueAtTime(1.5, hitTime);
    }

    // Diferenciación realista de Sticking (R vs L vs Acento >) en todos los cuerpos excepto el Bombo
    if (!config.isFootPiece) {
      if (isAccented) {
        finalGain *= 1.26;
        lowpassFreq = 19500;
        highShelfGain += 2.5;
        playbackRate *= 1.012;
        panValue = Math.max(-0.6, Math.min(0.6, config.pan + (isRight ? 0.08 : isLeft ? -0.08 : 0)));
      } else if (isRight) {
        // Mano Derecha (R): golpe líder definido
        finalGain *= 1.0;
        lowpassFreq = 17000;
        highShelfGain += 1.8;
        playbackRate *= 1.02;
        panValue = Math.max(-0.65, Math.min(0.65, config.pan + 0.13));
      } else if (isLeft) {
        // Mano Izquierda (L): golpe de acompañamiento más suave y cálido
        finalGain *= 0.72;
        lowpassFreq = 7600;
        highShelfGain -= 2.2;
        playbackRate *= 0.978;
        panValue = Math.max(-0.65, Math.min(0.65, config.pan - 0.13));
        if (config.key !== 'hihat_open') {
          duration *= 0.88;
        }
      }

      // Rebote natural en golpes dobles consecutivos (RR o LL)
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

    // Envolvente diferenciada: el Hi-Hat Cerrado corta rápido; el Hi-Hat Abierto abre y sostiene
    gainNode.gain.setValueAtTime(0.0001, hitTime);
    if (config.key === 'hihat_open') {
      gainNode.gain.linearRampToValueAtTime(finalGain, hitTime + 0.014); // Bloom natural de apertura
      gainNode.gain.exponentialRampToValueAtTime(finalGain * 0.55, hitTime + 0.45);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + duration);
      const nodeRecord = { gain: gainNode, source };
      this.activeOpenHiHatNodes.push(nodeRecord);
      source.onended = () => {
        const idx = this.activeOpenHiHatNodes.indexOf(nodeRecord);
        if (idx !== -1) {
          this.activeOpenHiHatNodes.splice(idx, 1);
        }
      };
    } else if (config.key === 'hihat_closed') {
      gainNode.gain.linearRampToValueAtTime(finalGain, hitTime + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + duration);
    } else {
      gainNode.gain.linearRampToValueAtTime(finalGain, hitTime + 0.003);
      gainNode.gain.setValueAtTime(finalGain, hitTime + duration * 0.68);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + duration);
    }

    source.connect(bodyEq);
    bodyEq.connect(lowpass);
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

  // Respaldo acústico inmediato mientras se descargan las muestras por primera vez
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

export const drumSampler = new YamahaStudioDrumEngine();

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
