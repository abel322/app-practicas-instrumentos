// lib/audio/drumSynth.ts
// Motor de Batería Acústica Blindado con Respaldo en Memoria, Muestras Locales/CDN y Choke de Hi-Hat

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
  noteName: string;
  pan: number;
  baseGain: number;
  maxDuration: number;
  isFootPiece?: boolean;
}

const DRUM_SAMPLE_MAP: Record<string, SampleConfig> = {
  kick: { key: 'kick', noteName: 'C2', pan: 0.0, baseGain: 1.15, maxDuration: 1.1, isFootPiece: true },
  snare: { key: 'snare', noteName: 'D2', pan: 0.0, baseGain: 1.05, maxDuration: 1.3 },
  snare_accent: { key: 'snare_accent', noteName: 'E2', pan: 0.0, baseGain: 1.15, maxDuration: 1.4 },
  hihat_closed: { key: 'hihat_closed', noteName: 'Gb2', pan: -0.32, baseGain: 0.9, maxDuration: 0.25 },
  hihat_open: { key: 'hihat_open', noteName: 'Bb2', pan: -0.32, baseGain: 0.88, maxDuration: 1.45 },
  tom1: { key: 'tom1', noteName: 'C3', pan: -0.2, baseGain: 1.05, maxDuration: 1.4 },
  tom2: { key: 'tom2', noteName: 'A2', pan: 0.15, baseGain: 1.05, maxDuration: 1.6 },
  floor: { key: 'floor', noteName: 'F2', pan: 0.35, baseGain: 1.1, maxDuration: 1.85 },
  ride: { key: 'ride', noteName: 'Eb3', pan: 0.34, baseGain: 0.85, maxDuration: 2.4 },
  crash: { key: 'crash', noteName: 'Db3', pan: -0.32, baseGain: 0.85, maxDuration: 2.8 },
};

class AcousticDrumEngine {
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
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      // 1. Inyectar inmediatamente síntesis acústica en memoria: CERO SILENCIOS desde el milisegundo 0
      this.ensureAllBuffersExist(this.ctx);

      // 2. Cargar en segundo plano las muestras MP3 reales (local y CDNs)
      this.preloadSamples();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx!;
  }

  // Respaldo acústico sintetizado en memoria para disponibilidad instantánea sin depender de la red
  public ensureAllBuffersExist(ctx: AudioContext) {
    const requiredKeys = ['kick', 'snare', 'hihat_closed', 'hihat_open', 'tom1', 'tom2', 'floor', 'ride', 'crash'];
    for (const key of requiredKeys) {
      if (!this.sampleBuffers.has(key)) {
        this.sampleBuffers.set(key, this.synthesizeCleanAcousticBuffer(ctx, key));
      }
    }
  }

  public synthesizeCleanAcousticBuffer(ctx: AudioContext, key: string): AudioBuffer {
    const sr = ctx.sampleRate;
    const durations: Record<string, number> = {
      kick: 0.45,
      snare: 0.35,
      hihat_closed: 0.14,
      hihat_open: 0.95,
      tom1: 0.45,
      tom2: 0.55,
      floor: 0.7,
      ride: 1.6,
      crash: 2.1,
    };
    const dur = durations[key] || 0.5;
    const len = Math.floor(sr * dur);
    const buffer = ctx.createBuffer(1, len, sr);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const env = Math.exp(-t / (dur * 0.28));

      if (key === 'hihat_closed' || key === 'hihat_open' || key === 'ride' || key === 'crash') {
        // Textura metálica limpia de platillo (banda alta filtrada sin distorsión)
        const white = Math.random() * 2 - 1;
        const metallic =
          Math.sin(2 * Math.PI * 3420 * t) * 0.25 +
          Math.sin(2 * Math.PI * 5180 * t) * 0.25 +
          Math.sin(2 * Math.PI * 7840 * t) * 0.2 +
          white * 0.55;
        const attack = Math.min(1, t / 0.003);
        data[i] = metallic * env * attack * 0.42;
      } else if (key === 'kick') {
        const freq = 135 * Math.exp(-t * 28) + 46;
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 7) * 0.85;
      } else if (key === 'snare') {
        const tone = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 16) * 0.45;
        const wires = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.45;
        data[i] = tone + wires;
      } else {
        const baseFreq = key === 'tom1' ? 165 : key === 'tom2' ? 128 : 92;
        const pitch = baseFreq * (1 + 0.35 * Math.exp(-t * 22));
        data[i] = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t * 6.5) * 0.7;
      }
    }
    return buffer;
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
          // Candidatos en orden: 1. Archivos estáticos locales en /public/soundfonts/drums/, 2. CDN Tonejs, 3. CDNs respaldo
          const candidateUrls = [
            `/soundfonts/drums/${item.noteName}.mp3`,
            `https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples/acoustic-kit/${item.key === 'floor' ? 'tom3' : item.key}.mp3`,
            `https://raw.githubusercontent.com/dave4mpls/midi-js-soundfonts-with-drums/master/FluidR3_GM/drums-mp3/${item.noteName}.mp3`,
            `https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3/${item.noteName}.mp3`,
            `https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/standard_drum_kit-mp3/${item.noteName}.mp3`,
          ];

          const buffer = await this.fetchFirstBuffer(candidateUrls, ctx);
          if (buffer) {
            this.sampleBuffers.set(item.key, buffer);
          }
        })
      );
      this.isLoaded = true;
    } finally {
      this.isPreloading = false;
      this.ensureAllBuffersExist(ctx);
    }
  }

  public resolveConfig(instrument: string, accent?: boolean): SampleConfig {
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

    // Asegurar que exista un buffer (de samples descargados o síntesis acústica en memoria)
    let buffer =
      this.sampleBuffers.get(config.key) ||
      (config.key === 'snare_accent' ? this.sampleBuffers.get('snare') : undefined);

    if (!buffer) {
      this.ensureAllBuffersExist(ctx);
      buffer = this.sampleBuffers.get(config.key);
      if (!buffer) return;
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
      options.velocity !== undefined ? Math.min(1.15, Math.max(0.2, options.velocity / 100)) : 1.0;

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
