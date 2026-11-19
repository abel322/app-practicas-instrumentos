// lib/audio/guitarPreviewSynth.ts
// Motor de Guitarra Eléctrica Limpia Real basado en Muestras (Soundfont FluidR3_GM)

export type BendType =
  | 'standard'
  | 'bend_release'
  | 'pre_bend'
  | 'half'
  | 'full'
  | 'tone_half'
  | 'release'
  | string;

export type BendAmount = '1/4' | '1/2' | '1' | '1.5' | number;

export type GuitarTechnique =
  | 'normal'
  | 'hammer'
  | 'pulloff'
  | 'pull'
  | 'bend'
  | 'slide'
  | 'slide_up'
  | 'slide_down'
  | 'vibrato'
  | 'natural_harmonic'
  | 'pinch_harmonic'
  | 'pm';

export interface GuitarNoteEvent {
  midi: number;
  duration?: number;
  velocity?: number;
  time?: number;
  scheduleTime?: number;
  technique?: GuitarTechnique | string;
  slideDirection?: 'up' | 'down' | null;
  targetMidi?: number;
  bendType?: BendType;
  bendAmount?: BendAmount;
  stringIndex?: number;
  string?: number;
  pickDirection?: 'down' | 'up' | 'm' | 'a' | null;
  palmMute?: boolean;
}

// Conversión de cuerda y traste a MIDI para guitarra de 6 cuerdas en afinación estándar
// 1ª cuerda: E4 (64), 2ª: B3 (59), 3ª: G3 (55), 4ª: D3 (50), 5ª: A2 (45), 6ª: E2 (40)
export function getGuitarMidiFromString(
  stringNumOrIndex: number,
  fret: number = 0,
  isZeroIndexed: boolean = false
): number {
  const baseMidiByOneIndexed: Record<number, number> = {
    1: 64, // 1ª cuerda: E4
    2: 59, // 2ª cuerda: B3
    3: 55, // 3ª cuerda: G3
    4: 50, // 4ª cuerda: D3
    5: 45, // 5ª cuerda: A2
    6: 40, // 6ª cuerda: E2
  };
  const baseMidiByZeroIndexed: Record<number, number> = {
    0: 64,
    1: 59,
    2: 55,
    3: 50,
    4: 45,
    5: 40,
  };

  const baseMidi = isZeroIndexed
    ? baseMidiByZeroIndexed[stringNumOrIndex] ?? 40
    : baseMidiByOneIndexed[stringNumOrIndex] ?? baseMidiByZeroIndexed[stringNumOrIndex] ?? 40;

  return baseMidi + Math.max(0, fret);
}

export class SampledElectricGuitarSynth {
  private ctx: AudioContext | null = null;
  private sampleCache: Map<string, AudioBuffer> = new Map();
  private masterGain: GainNode | null = null;
  private toneFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isPreloading = false;
  private isLoaded = false;

  // Banco de Guitarra Eléctrica Limpia (timbre real de pastilla y ampli limpio, sin distorsión pesada)
  private sampleBaseUrl =
    'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/electric_guitar_clean-mp3';

  // Anclas cromáticas reales para cubrir desde E2 (6ª cuerda al aire) hasta E6 (traste 24 en 1ª cuerda)
  private anchorNotes: { name: string; midi: number }[] = [
    { name: 'E2', midi: 40 },
    { name: 'A2', midi: 45 },
    { name: 'D3', midi: 50 },
    { name: 'G3', midi: 55 },
    { name: 'B3', midi: 59 },
    { name: 'E4', midi: 64 },
    { name: 'A4', midi: 69 },
    { name: 'D5', midi: 74 },
    { name: 'G5', midi: 79 },
    { name: 'B5', midi: 83 },
    { name: 'E6', midi: 88 },
  ];

  public init(): void {
    this.getContext();
  }

  public getAudioContext(): AudioContext | null {
    return this.getContext();
  }

  public getContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Ecualización cálida tipo amplificador limpio de guitarra (sin brillo metálico artificial)
      this.toneFilter = this.ctx.createBiquadFilter();
      this.toneFilter.type = 'lowpass';
      this.toneFilter.frequency.setValueAtTime(5200, this.ctx.currentTime);
      this.toneFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      // Compresor óptico suave para sustain natural y pegada uniforme
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(14, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.2, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.22, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.25, this.ctx.currentTime);

      this.toneFilter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.preloadSamples();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }

    return this.ctx!;
  }

  public async preloadSamples(): Promise<void> {
    if (this.isLoaded || this.isPreloading || typeof window === 'undefined') return;
    this.isPreloading = true;

    const ctx = this.getContext();

    try {
      await Promise.all(
        this.anchorNotes.map(async (anchor) => {
          if (this.sampleCache.has(anchor.name)) return;

          // Intentar local estático primero (latencia cero), luego raw GitHub, luego jsdelivr
          const candidateUrls = [
            `/soundfonts/guitar/${anchor.name}.mp3`,
            `https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/electric_guitar_clean-mp3/${anchor.name}.mp3`,
            `${this.sampleBaseUrl}/${anchor.name}.mp3`,
          ];

          for (const url of candidateUrls) {
            try {
              const response = await fetch(url);
              if (!response.ok) continue;
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
              this.sampleCache.set(anchor.name, audioBuffer);
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

  private findClosestAnchor(midi: number): { name: string; midi: number } {
    let closest = this.anchorNotes[0];
    let minDiff = Math.abs(midi - closest.midi);

    for (const anchor of this.anchorNotes) {
      const diff = Math.abs(midi - anchor.midi);
      if (diff < minDiff) {
        minDiff = diff;
        closest = anchor;
      }
    }
    return closest;
  }

  public playNote(
    eventOrMidi: GuitarNoteEvent | number,
    fallbackDuration = 1.1,
    fallbackVelocity = 95
  ): void {
    const ctx = this.getContext();
    if (!ctx || !this.toneFilter) return;

    const event: GuitarNoteEvent =
      typeof eventOrMidi === 'number'
        ? { midi: eventOrMidi, duration: fallbackDuration, velocity: fallbackVelocity }
        : eventOrMidi;

    const hitTime = Math.max(ctx.currentTime, event.time ?? event.scheduleTime ?? ctx.currentTime);
    const duration = Math.max(0.25, event.duration ?? 1.1);
    const velocity = event.velocity ?? 95;
    const rawTech = (event.technique || 'normal').toLowerCase();
    const technique = (rawTech === 'pull' ? 'pulloff' : rawTech) as GuitarTechnique;

    // Ajuste de octava si es armónico natural o artificial
    const effectiveMidi =
      technique === 'natural_harmonic' || technique === 'pinch_harmonic'
        ? event.midi + 12
        : event.midi;

    const anchor = this.findClosestAnchor(effectiveMidi);
    const buffer =
      this.sampleCache.get(anchor.name) ||
      this.sampleCache.get('E4') ||
      this.sampleCache.get('A3');

    // Si aún está descargando el sample en los primeros milisegundos, iniciar precarga y salir
    if (!buffer) {
      this.preloadSamples();
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const semitoneDistance = effectiveMidi - anchor.midi;
    const baseRate = Math.pow(2, semitoneDistance / 12);

    // 1. ARTICULACIONES DE AFINACIÓN (Bending, Slides ascendente/descendente/ligado)
    const isSlideUp = technique === 'slide_up' || event.slideDirection === 'up';
    const isSlideDown = technique === 'slide_down' || event.slideDirection === 'down';

    if (isSlideUp) {
      // Slide ascendente de entrada (/10): arranca 5 semitonos abajo y sube rápido al traste objetivo
      const startRate = Math.pow(2, (semitoneDistance - 5) / 12);
      const arriveTime = hitTime + Math.min(0.11, duration * 0.35);
      source.playbackRate.setValueAtTime(startRate, hitTime);
      source.playbackRate.exponentialRampToValueAtTime(baseRate, arriveTime);
    } else if (isSlideDown) {
      // Slide descendente de salida (8\): golpea afinado 55ms y desliza 6 semitonos hacia abajo
      const startDrop = hitTime + 0.055;
      const endRate = Math.pow(2, (semitoneDistance - 6) / 12);
      const endDrop = hitTime + Math.min(0.45, Math.max(0.22, duration * 0.85));
      source.playbackRate.setValueAtTime(baseRate, hitTime);
      source.playbackRate.setValueAtTime(baseRate, startDrop);
      source.playbackRate.exponentialRampToValueAtTime(endRate, endDrop);
    } else if (technique === 'slide' && event.targetMidi) {
      const targetRate = Math.pow(2, (event.targetMidi - anchor.midi) / 12);
      source.playbackRate.setValueAtTime(baseRate, hitTime);
      source.playbackRate.exponentialRampToValueAtTime(targetRate, hitTime + duration * 0.65);
    } else if (technique === 'bend') {
      let bendSemitones = 2; // Full bend por defecto
      if (typeof event.bendAmount === 'number') {
        bendSemitones = event.bendAmount;
      } else if (event.bendAmount === '1/4') {
        bendSemitones = 0.5;
      } else if (event.bendAmount === '1/2' || event.bendType === 'half') {
        bendSemitones = 1;
      } else if (event.bendAmount === '1.5' || event.bendType === 'tone_half') {
        bendSemitones = 3;
      } else if (event.bendAmount === '1' || event.bendType === 'full') {
        bendSemitones = 2;
      }

      const peakRate = Math.pow(2, (semitoneDistance + bendSemitones) / 12);
      const bendPeakTime = hitTime + Math.min(0.22, duration * 0.45);

      source.playbackRate.setValueAtTime(baseRate, hitTime);
      source.playbackRate.exponentialRampToValueAtTime(peakRate, bendPeakTime);

      if (event.bendType === 'release' || event.bendType === 'bend_release') {
        source.playbackRate.exponentialRampToValueAtTime(baseRate, hitTime + duration * 0.85);
      }
    } else {
      source.playbackRate.setValueAtTime(baseRate, hitTime);
    }

    // 2. VIBRATO REAL MEDIANTE LFO EN DETUNE
    let lfo: OscillatorNode | null = null;
    if (technique === 'vibrato') {
      lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.4, hitTime); // 5.4 Hz vibrato expresivo
      lfoGain.gain.setValueAtTime(0, hitTime);
      lfoGain.gain.linearRampToValueAtTime(26, hitTime + 0.12); // ±26 cents de profundidad

      lfo.connect(lfoGain);
      lfoGain.connect(source.detune);
      lfo.start(hitTime);
      lfo.stop(hitTime + duration + 0.25);
    }

    // 3. ENVOLVENTE DE ATAQUE Y CUERPO (Diferencia púa vs legato hammer/pull-off vs palm mute)
    const noteFilter = ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';

    const gainNode = ctx.createGain();
    const velNorm = Math.min(1.25, Math.max(0.2, velocity / 100));
    const isLegato = technique === 'hammer' || technique === 'pulloff';
    const isPalmMute = Boolean(event.palmMute || technique === 'pm');

    const peakGain = (isLegato ? 0.85 : 1.05) * velNorm;
    const attackTime = isLegato ? 0.018 : 0.004; // Legato sin golpe fuerte de púa
    // Palm Mute: decaimiento más corto para simular el apagado real de la palma derecha sobre el puente
    const releaseDuration = isPalmMute
      ? Math.min(0.22, duration * 0.35)
      : Math.max(0.9, duration * 1.45);

    // Palm Mute: filtro paso-bajo más cerrado (~1100 Hz)
    const initialFreq = isPalmMute ? 1100 : (isLegato ? 3600 : 5400);
    const finalFreq = isPalmMute ? 650 : 2600;

    noteFilter.frequency.setValueAtTime(initialFreq, hitTime);
    noteFilter.frequency.exponentialRampToValueAtTime(finalFreq, hitTime + releaseDuration);

    gainNode.gain.setValueAtTime(0.0001, hitTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, hitTime + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * (isPalmMute ? 0.35 : 0.65), hitTime + (isPalmMute ? 0.08 : 0.25));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, hitTime + releaseDuration);

    source.connect(noteFilter);
    noteFilter.connect(gainNode);
    gainNode.connect(this.toneFilter);

    source.start(hitTime);
    source.stop(hitTime + releaseDuration + 0.08);
  }

  /**
   * Dispara un chasquido percusivo corto sobre las cuerdas (~35 ms con filtro paso-banda)
   * para simular rasgueo apagado/muteado (×)
   */
  public playMutedStrum(time?: number, velocity = 90): void {
    const ctx = this.getContext();
    if (!ctx || !this.toneFilter) return;

    const hitTime = Math.max(ctx.currentTime, time ?? ctx.currentTime);
    const velNorm = Math.min(1.2, Math.max(0.3, velocity / 100));

    const bufferSize = Math.floor(ctx.sampleRate * 0.04); // ~40ms
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1150, hitTime);
    bandpass.Q.setValueAtTime(1.8, hitTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, hitTime);
    gain.gain.linearRampToValueAtTime(0.85 * velNorm, hitTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.035);

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.toneFilter);

    noiseSource.start(hitTime);
    noiseSource.stop(hitTime + 0.04);
  }

  /**
   * Disparo polifónico de acorde con soporte completo para dirección de rasgueo:
   * - 'down' (↓): Cuerdas de grave a aguda (6ª -> 1ª) con desfase de 14ms entre cuerdas
   * - 'up' (↑): Cuerdas de aguda a grave (1ª -> 6ª) con desfase de 14ms y brillo en agudos
   * - 'mute' (×): Chasquido percusivo corto sobre las cuerdas
   */
  public playChord(
    notesOrMidis: (number | { midi: number; string?: number; stringIndex?: number; technique?: string; palmMute?: boolean; velocity?: number })[],
    options?: {
      duration?: number;
      velocity?: number;
      time?: number;
      scheduleTime?: number;
      strumDirection?: 'down' | 'up' | 'mute' | null;
    } | number,
    fallbackVelocity = 90
  ): void {
    if (!notesOrMidis || notesOrMidis.length === 0) return;
    const ctx = this.getContext();
    const baseTime =
      typeof options === 'object' && options?.time !== undefined
        ? options.time
        : (typeof options === 'object' && options?.scheduleTime !== undefined ? options.scheduleTime : ctx.currentTime);
    const strumDir = typeof options === 'object' ? (options?.strumDirection ?? 'down') : 'down';
    const duration =
      typeof options === 'object' ? (options?.duration ?? 1.3) : (typeof options === 'number' ? options : 1.3);
    const velocity =
      typeof options === 'object' ? (options?.velocity ?? 90) : fallbackVelocity;

    // 1. Rasgueo percusivo muteado (×)
    if (strumDir === 'mute') {
      this.playMutedStrum(baseTime, velocity);
      return;
    }

    // Normalizar a lista de notas
    const normalizedNotes = notesOrMidis.map((item) => {
      if (typeof item === 'number') {
        return { midi: item, velocity };
      }
      return {
        midi: item.midi,
        string: item.string,
        technique: item.technique,
        palmMute: item.palmMute,
        velocity: item.velocity ?? velocity,
      };
    });

    // 2. Ordenar según la dirección del rasgueo:
    // 'down' (↓): de grave a aguda (MIDI ascendente)
    // 'up' (↑): de aguda a grave (MIDI descendente)
    const sorted = [...normalizedNotes].sort((a, b) => {
      if (strumDir === 'up') {
        return b.midi - a.midi;
      }
      return a.midi - b.midi;
    });

    sorted.forEach((note, idx) => {
      const isTopStringInUpstroke = strumDir === 'up' && idx <= 1;
      const noteVel = isTopStringInUpstroke ? Math.min(127, note.velocity + 6) : note.velocity;
      this.playNote({
        midi: note.midi,
        duration,
        velocity: noteVel,
        technique: note.technique,
        palmMute: note.palmMute,
        time: baseTime + idx * 0.014,
        scheduleTime: baseTime + idx * 0.014,
      });
    });
  }
}

export const guitarPreviewSynth = new SampledElectricGuitarSynth();
