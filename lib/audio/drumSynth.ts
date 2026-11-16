// lib/audio/drumSynth.ts
// Motor de Batería Acústica Blindado con Respaldo en Memoria, Muestras Locales/CDN, Choke de Hi-Hat,
// Dinámicas Musicales (pp a ff) y Tipos de Golpe (Flam, Drag, Buzz, Rimshot, Cross-Stick, Choke)

import {
  DynamicMarking,
  DrumStrokeType,
  getDynamicSpec,
} from '@/lib/music/dynamicsAndStrokes';

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
  sticking?: 'R' | 'L' | 'K' | null;
  accent?: boolean;
  ghost?: boolean;
  syncopated?: boolean;
  isDoubleRebound?: boolean;
  dynamic?: DynamicMarking;
  strokeType?: DrumStrokeType;
  isGraceNote?: boolean;
  customLowpassHz?: number;
  customPan?: number;
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
    const isGhost = Boolean(options.ghost);
    const isSyncopated = Boolean(options.syncopated);
    const isAccented = Boolean(options.accent) && !isGhost;
    const isRight = options.sticking === 'R';
    const isLeft = options.sticking === 'L';

    // 1. Manejo especializado de Cross-Stick (sidestick de madera seco a 1.4 kHz)
    if (options.strokeType === 'cross_stick') {
      const osc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, hitTime);
      bp.Q.setValueAtTime(4.0, hitTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, hitTime);
      osc.frequency.exponentialRampToValueAtTime(750, hitTime + 0.045);

      const dynSpec = getDynamicSpec(options.dynamic);
      const rawV =
        options.velocity !== undefined
          ? options.velocity > 1
            ? options.velocity / 100
            : options.velocity
          : 0.9;
      const clickVel = isGhost ? 0.20 : rawV * dynSpec.gainScale;
      clickGain.gain.setValueAtTime(clickVel * 0.9, hitTime);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.045);

      osc.connect(bp);
      bp.connect(clickGain);
      clickGain.connect(this.masterGain);

      osc.start(hitTime);
      osc.stop(hitTime + 0.05);
      return;
    }

    const config = this.resolveConfig(options.instrument, isAccented);
    const isCymbal =
      config.key === 'hihat_closed' ||
      config.key === 'hihat_open' ||
      config.key === 'ride' ||
      config.key === 'crash';

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

    const rawVel =
      options.velocity !== undefined
        ? options.velocity > 1
          ? options.velocity / 100
          : options.velocity
        : 0.9;

    // 2. Manejo de Notas de Gracia para Flam, Drag y Buzz con tiempos estrictamente positivos
    if (options.strokeType === 'flam') {
      const now = ctx.currentTime;
      const startTime = Math.max(now, options.time ?? now);
      const isRightHand = options.sticking === 'R' || !options.sticking;
      const graceSticking = isRightHand ? 'L' : 'R';

      const dynSpec = getDynamicSpec(options.dynamic);
      const baseVel = rawVel * dynSpec.gainScale;

      const gracePan = isRightHand
        ? Math.max(-0.6, config.pan - 0.18)
        : Math.min(0.6, config.pan + 0.18);
      const mainPan = isRightHand
        ? Math.min(0.6, config.pan + 0.18)
        : Math.max(-0.6, config.pan - 0.18);

      // 1. Nota de gracia en startTime (mano opuesta, ganancia 42%, filtro 4800 Hz, paneo opuesto)
      this.playHit({
        ...options,
        time: startTime,
        velocity: baseVel * 0.42,
        sticking: graceSticking,
        strokeType: 'normal',
        accent: false,
        ghost: false,
        isGraceNote: true,
        customLowpassHz: 4800,
        customPan: gracePan,
      });

      // 2. Golpe principal en startTime + 0.032 (32 ms después, ganancia 105%, brillo completo, paneo principal)
      this.playHit({
        ...options,
        time: startTime + 0.032,
        velocity: baseVel * 1.05,
        sticking: isRightHand ? 'R' : 'L',
        strokeType: 'normal',
        accent: options.accent,
        ghost: false,
        customPan: mainPan,
      });

      return;
    } else if (options.strokeType === 'drag') {
      const now = ctx.currentTime;
      const startTime = Math.max(now, options.time ?? now);
      const isRightHand = options.sticking === 'R' || !options.sticking;
      const dragSticking = isRightHand ? 'L' : 'R';

      const dynSpec = getDynamicSpec(options.dynamic);
      const baseVel = rawVel * dynSpec.gainScale;

      const gracePan = isRightHand
        ? Math.max(-0.6, config.pan - 0.18)
        : Math.min(0.6, config.pan + 0.18);
      const mainPan = isRightHand
        ? Math.min(0.6, config.pan + 0.18)
        : Math.max(-0.6, config.pan - 0.18);

      // Gracia 1 en startTime (ganancia 34%, filtro 4500 Hz)
      this.playHit({
        ...options,
        time: startTime,
        velocity: baseVel * 0.34,
        sticking: dragSticking,
        strokeType: 'normal',
        accent: false,
        ghost: false,
        isGraceNote: true,
        customLowpassHz: 4500,
        customPan: gracePan,
      });

      // Gracia 2 en startTime + 0.028 (28 ms después, ganancia 38%, filtro 4800 Hz)
      this.playHit({
        ...options,
        time: startTime + 0.028,
        velocity: baseVel * 0.38,
        sticking: dragSticking,
        strokeType: 'normal',
        accent: false,
        ghost: false,
        isGraceNote: true,
        customLowpassHz: 4800,
        customPan: gracePan,
      });

      // Golpe principal en startTime + 0.058 (58 ms después, ganancia 108%, brillo completo)
      this.playHit({
        ...options,
        time: startTime + 0.058,
        velocity: baseVel * 1.08,
        sticking: isRightHand ? 'R' : 'L',
        strokeType: 'normal',
        accent: options.accent,
        ghost: false,
        customPan: mainPan,
      });

      return;
    } else if (options.strokeType === 'buzz') {
      const now = ctx.currentTime;
      const startTime = Math.max(now, options.time ?? now);
      const rebGains = [0.62, 0.38, 0.22];
      rebGains.forEach((gScale, idx) => {
        this.playHit({
          ...options,
          time: startTime + (idx + 1) * 0.024,
          velocity: rawVel * gScale,
          strokeType: 'normal',
          accent: false,
          isDoubleRebound: true,
        });
      });
      this.playHit({
        ...options,
        time: startTime,
        strokeType: 'normal',
      });
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';

    const gainNode = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    const velNorm = isGhost ? 0.22 : Math.min(1.2, Math.max(0.15, rawVel));

    let finalGain = config.baseGain * velNorm;
    let panValue = options.customPan !== undefined ? options.customPan : config.pan;
    let playbackRate = 1.0;
    let lowpassFreq = options.customLowpassHz ?? 18000;
    let duration = config.maxDuration;

    const isKickHit = Boolean(config.isFootPiece || options.sticking === 'K');

    // Diferencia entre mano derecha (R) e izquierda (L) en todos los elementos excepto Bombo (K)
    if (isKickHit) {
      panValue = 0.0;
      if (isAccented) {
        finalGain *= 1.15;
      }
    } else {
      if (isAccented) {
        finalGain *= 1.18;
        playbackRate = 1.01;
      } else if (options.customPan === undefined) {
        if (isRight) {
          finalGain *= 1.0;
          playbackRate = 1.018;
          panValue = Math.min(0.6, config.pan + 0.18);
        } else if (isLeft) {
          finalGain *= 0.72;
          lowpassFreq = options.customLowpassHz ?? 8500;
          playbackRate = 0.98;
          panValue = Math.max(-0.6, config.pan - 0.18);
        }
      }

      if (options.isDoubleRebound && !isAccented) {
        finalGain *= 0.85;
      }
    }

    // Calibración DSP para Ghost Note (prioridad absoluta a nivel pp real ~22% ganancia y ataque suave)
    if (isGhost) {
      finalGain = config.baseGain * 0.22;
      lowpassFreq = Math.min(lowpassFreq, isCymbal ? 4800 : 3400);
      duration *= 0.72;
    } else if (options.isGraceNote) {
      duration *= 0.65;
    } else {
      if (isSyncopated) {
        finalGain *= 1.14;
        lowpassFreq = Math.max(lowpassFreq, 18500);
      }
      // 3. Modulación por Dinámica (pp a ff) solo para notas no-fantasma
      const dynSpec = getDynamicSpec(options.dynamic);
      finalGain *= dynSpec.gainScale;
      lowpassFreq = Math.min(lowpassFreq, dynSpec.brightnessHz);
    }

    // 4. Modulación por Rimshot (transitorio metálico agudo de aro)
    if (options.strokeType === 'rimshot') {
      finalGain *= 1.22;
      playbackRate = 1.025;
      lowpassFreq = 20000;

      try {
        const rimOsc = ctx.createOscillator();
        const rimGain = ctx.createGain();
        const rimFilter = ctx.createBiquadFilter();
        rimFilter.type = 'bandpass';
        rimFilter.frequency.setValueAtTime(2200, hitTime);
        rimFilter.Q.setValueAtTime(3.2, hitTime);

        rimOsc.type = 'square';
        rimOsc.frequency.setValueAtTime(2200, hitTime);
        rimGain.gain.setValueAtTime(finalGain * 0.45, hitTime);
        rimGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.065);

        rimOsc.connect(rimFilter);
        rimFilter.connect(rimGain);
        rimGain.connect(this.masterGain);

        rimOsc.start(hitTime);
        rimOsc.stop(hitTime + 0.07);
      } catch {}
    }

    // 5. Choke de platos (silenciado rápido de la cola)
    const isChoke = options.strokeType === 'choke';
    if (isChoke) {
      duration = Math.min(duration, 0.22);
    }

    source.playbackRate.setValueAtTime(playbackRate, hitTime);
    lowpass.frequency.setValueAtTime(lowpassFreq, hitTime);
    if (panner) {
      panner.pan.setValueAtTime(panValue, hitTime);
    }

    gainNode.gain.setValueAtTime(finalGain, hitTime);
    if (isChoke) {
      gainNode.gain.setValueAtTime(finalGain * 0.9, hitTime + 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.22);
    } else if (config.key === 'hihat_open') {
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
