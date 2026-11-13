// lib/audio/drumSynth.ts
// Motor de Batería Acústica Real basado en Muestras (Samplers Web Audio API)

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
  midiNote: number; // Estándar General MIDI Percussion (Channel 10)
  pan: number;      // Posición estéreo realista (-1 izquierda a +1 derecha, perspectiva baterista)
  baseGain: number;
  maxDuration: number;
}

// Mapeo acústico de los 8 cuerpos de la batería + variaciones
const DRUM_SAMPLE_MAP: Record<string, SampleConfig> = {
  kick: { key: 'kick', midiNote: 36, pan: 0.0, baseGain: 1.25, maxDuration: 1.2 },
  snare: { key: 'snare', midiNote: 38, pan: -0.05, baseGain: 1.15, maxDuration: 1.4 },
  snare_accent: { key: 'snare_accent', midiNote: 40, pan: 0.0, baseGain: 1.3, maxDuration: 1.6 },
  hihat_closed: { key: 'hihat_closed', midiNote: 42, pan: -0.45, baseGain: 0.85, maxDuration: 0.45 },
  hihat_open: { key: 'hihat_open', midiNote: 46, pan: -0.45, baseGain: 0.9, maxDuration: 1.8 },
  tom1: { key: 'tom1', midiNote: 48, pan: -0.22, baseGain: 1.1, maxDuration: 1.6 },
  tom2: { key: 'tom2', midiNote: 45, pan: 0.16, baseGain: 1.1, maxDuration: 1.8 },
  floor: { key: 'floor', midiNote: 41, pan: 0.42, baseGain: 1.2, maxDuration: 2.2 }, // Granadero
  ride: { key: 'ride', midiNote: 51, pan: 0.38, baseGain: 0.85, maxDuration: 2.8 },
  crash: { key: 'crash', midiNote: 49, pan: -0.38, baseGain: 0.95, maxDuration: 3.6 },
};

// Nombres de archivo estándar en Soundfont FluidR3_GM Percussion
const MIDI_TO_NOTE_NAME: Record<number, string> = {
  36: 'C2',  // Acoustic Bass Drum (Bombo)
  38: 'D2',  // Acoustic Snare (Redoblante)
  40: 'E2',  // Electric/Rim Snare (Acento)
  41: 'F2',  // Low Floor Tom (Granadero)
  42: 'Gb2', // Closed Hi-Hat
  45: 'A2',  // Low-Mid Tom (Tom 2)
  46: 'Bb2', // Open Hi-Hat
  48: 'C3',  // Hi-Mid Tom (Tom 1)
  49: 'Db3', // Crash Cymbal 1
  51: 'Eb3', // Ride Cymbal 1
};

export class AcousticDrumSampler {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading = false;
  private isLoaded = false;
  private activeOpenHiHatGain: GainNode | null = null;

  private sampleBaseUrl =
    'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/standard_drum_kit-mp3';

  public getContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Compresor de Bus de Batería para pegada acústica natural
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.15, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.preloadSamples();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx!;
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

          // Si ya está en caché, omitir
          if (this.sampleBuffers.has(item.key)) return;

          // Intentar primero desde /soundfonts/drums/${noteName}.mp3 (estático local Next.js con latencia 0)
          // Fallback a CDN raw github, y luego al baseUrl configurado
          const candidateUrls = [
            `/soundfonts/drums/${noteName}.mp3`,
            `https://raw.githubusercontent.com/dave4mpls/midi-js-soundfonts-with-drums/master/FluidR3_GM/drums-mp3/${noteName}.mp3`,
            `${this.sampleBaseUrl}/${noteName}.mp3`,
          ];

          for (const url of candidateUrls) {
            try {
              const response = await fetch(url);
              if (!response.ok) continue;
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
              this.sampleBuffers.set(item.key, audioBuffer);
              break;
            } catch (err) {
              // Probar siguiente origen
            }
          }
        })
      );
      this.isLoaded = true;
    } finally {
      this.isPreloading = false;
    }
  }

  // Normaliza alias en español/inglés hacia la clave interna del kit
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

    // Redoblante / Snare / Pad
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

    // Si aún no termina de descargar el MP3 en los primeros milisegundos, usar síntesis de respaldo
    if (!buffer) {
      this.preloadSamples();
      this.playFallbackTransient(ctx, hitTime, config.key, isAccented);
      return;
    }

    // Grupo de corte de Hi-Hat (Choke): el hi-hat cerrado apaga el abierto
    if (config.key === 'hihat_closed' && this.activeOpenHiHatGain) {
      try {
        this.activeOpenHiHatGain.gain.cancelScheduledValues(hitTime);
        this.activeOpenHiHatGain.gain.setValueAtTime(this.activeOpenHiHatGain.gain.value, hitTime);
        this.activeOpenHiHatGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.035);
      } catch (e) {}
      this.activeOpenHiHatGain = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Filtro de timbre para diferenciar zona de golpeo de mano derecha vs izquierda
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const gainNode = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    let velNorm = 1.0;
    if (options.velocity !== undefined) {
      if (options.velocity > 1.0) {
        velNorm = Math.min(1.2, Math.max(0.2, options.velocity / 100));
      } else {
        velNorm = Math.min(1.2, Math.max(0.2, options.velocity * 1.1));
      }
    }

    let finalGain = config.baseGain * velNorm;
    let panValue = config.pan;
    let playbackRate = 1.0;
    let filterFreq = 16000;

    // Diferenciación acústica para Sticking (R vs L vs Acento >) en redoblante/pads
    const isSnareOrPad = config.key === 'snare' || config.key === 'snare_accent';
    if (isSnareOrPad) {
      if (isAccented) {
        finalGain *= 1.15;
        filterFreq = 18000;
        playbackRate = 1.01;
        panValue = isRight ? 0.14 : isLeft ? -0.14 : 0.0;
      } else if (isRight) {
        // Mano derecha (R): ligera posición derecha, punta de baqueta más definida
        finalGain *= 0.68;
        panValue = 0.24;
        playbackRate = 1.018; // +30 cents aprox
        filterFreq = 7800;
      } else if (isLeft) {
        // Mano izquierda (L): ligera posición izquierda, cuerpo más redondo y cálido
        finalGain *= 0.6;
        panValue = -0.24;
        playbackRate = 0.982; // -31 cents aprox
        filterFreq = 5800;
      }

      // Rebote natural de doble golpe (RR o LL) sin acento
      if (options.isDoubleRebound && !isAccented) {
        finalGain *= 0.85;
      }
    }

    const isCymbalOrHiHat =
      config.key === 'hihat_closed' ||
      config.key === 'hihat_open' ||
      config.key === 'ride' ||
      config.key === 'crash';

    // Filtro de brillo (High-Shelf + Presencia) para eliminar el sonido opaco del Hi-Hat
    const sheenShelf = ctx.createBiquadFilter();
    sheenShelf.type = 'highshelf';
    sheenShelf.frequency.setValueAtTime(7500, hitTime);
    sheenShelf.gain.setValueAtTime(
      config.key === 'hihat_closed' || config.key === 'hihat_open' ? 9.0 : isCymbalOrHiHat ? 4.5 : 0,
      hitTime
    );

    const airPeak = ctx.createBiquadFilter();
    airPeak.type = 'peaking';
    airPeak.frequency.setValueAtTime(10500, hitTime);
    airPeak.Q.setValueAtTime(1.1, hitTime);
    airPeak.gain.setValueAtTime(
      config.key === 'hihat_closed' || config.key === 'hihat_open' ? 5.5 : 0,
      hitTime
    );

    // Ajustar ganancia y duración del Hi-Hat Cerrado (corto, nítido y brillante) y Abierto (largo con shimmer)
    if (config.key === 'hihat_closed') {
      finalGain *= 1.18;
      playbackRate = 1.03; // Ligero ajuste hacia arriba para mayor definición y brillo
    } else if (config.key === 'hihat_open') {
      finalGain *= 1.12;
      playbackRate = 1.01;
    }

    source.playbackRate.setValueAtTime(playbackRate, hitTime);
    filter.frequency.setValueAtTime(filterFreq, hitTime);

    if (panner) {
      panner.pan.setValueAtTime(panValue, hitTime);
    }

    gainNode.gain.setValueAtTime(finalGain, hitTime);
    gainNode.gain.setValueAtTime(finalGain, hitTime + config.maxDuration * 0.75);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + config.maxDuration);

    if (config.key === 'hihat_open') {
      this.activeOpenHiHatGain = gainNode;
    }

    // Conectar cadena: source -> filter -> sheenShelf -> airPeak -> gainNode -> panner -> masterGain
    source.connect(filter);
    filter.connect(sheenShelf);
    sheenShelf.connect(airPeak);
    airPeak.connect(gainNode);

    if (panner) {
      gainNode.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gainNode.connect(this.masterGain);
    }

    source.start(hitTime);
    source.stop(hitTime + config.maxDuration + 0.05);
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

export const drumSampler = new AcousticDrumSampler();

// Exports compatibles con todas las vistas existentes (PracticePage, DrumLab, StudioBuilderView)
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

