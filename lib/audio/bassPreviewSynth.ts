// Motor de Muestras Reales Calibrado para Bajo Eléctrico (E1 Base y Ghost Notes Cohesivas)

export type BassTechnique =
  | 'normal'
  | 'slap'
  | 'pop'
  | 'ghost'
  | 'hammer'
  | 'pulloff'
  | 'pull'
  | 'slide'
  | 'vibrato'
  | 'pm';

export interface BassNoteEvent {
  midi: number;
  duration?: number;
  velocity?: number;
  technique?: BassTechnique;
  targetMidi?: number;
  stringIndex?: number; // 0: G, 1: D, 2: A, 3: E
  scheduleTime?: number;
}

// Conversión de cuerda y traste a MIDI para bajo de 4 cuerdas (E1=28, A1=33, D2=38, G2=43)
export function getBassMidiFromString(
  stringNumOrIndex: number,
  fret: number = 0,
  isZeroIndexed: boolean = false
): number {
  const baseMidiByOneIndexed: Record<number, number> = {
    1: 43, // 1ª cuerda: G2
    2: 38, // 2ª cuerda: D2
    3: 33, // 3ª cuerda: A1
    4: 28, // 4ª cuerda: E1
  };
  const baseMidiByZeroIndexed: Record<number, number> = {
    0: 43, // 1ª cuerda: G2
    1: 38, // 2ª cuerda: D2
    2: 33, // 3ª cuerda: A1
    3: 28, // 4ª cuerda: E1
  };

  const baseMidi = isZeroIndexed
    ? baseMidiByZeroIndexed[stringNumOrIndex] ?? 28
    : baseMidiByOneIndexed[stringNumOrIndex] ?? baseMidiByZeroIndexed[stringNumOrIndex] ?? 28;

  return baseMidi + Math.max(0, fret);
}

class SampledBassEngine {
  private ctx: AudioContext | null = null;
  private sampleCache: Map<string, AudioBuffer> = new Map();
  private isLoadingSamples: boolean = false;
  private isLoaded: boolean = false;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Muestras calibradas a las octavas reales de un bajo de 4 cuerdas (E1 = MIDI 28, G2 = MIDI 43, G3 = MIDI 55)
  private sampleUrls: Record<string, string> = {
    // Slap en E1 real (la nota más grave de la 4ª cuerda)
    slapLow:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/slap_bass_1-mp3/E1.mp3',
    slapMid:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/slap_bass_1-mp3/E2.mp3',
    // Pop en cuerda aguda real (G3)
    pop: 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/slap_bass_2-mp3/G3.mp3',
    // Dedos en E1 y D2
    fingerLow:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/electric_bass_finger-mp3/E1.mp3',
    fingerMid:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/electric_bass_finger-mp3/D2.mp3',
  };

  private baseMidis: Record<string, number> = {
    slapLow: 28, // E1 (4ª cuerda al aire real)
    slapMid: 40, // E2 (traste 9 de la 3ª cuerda o 14 de la 4ª)
    pop: 55, // G3
    fingerLow: 28, // E1
    fingerMid: 38, // D2
  };

  public initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Compresor de master para empastar slap y pops con pegada consistente
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(14, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4.5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.1, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.preloadSamples();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  public async preloadSamples() {
    if (this.isLoadingSamples || this.isLoaded || !this.ctx) return;
    this.isLoadingSamples = true;

    try {
      const entries = Object.entries(this.sampleUrls);
      await Promise.all(
        entries.map(async ([key, url]) => {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
            this.sampleCache.set(key, audioBuffer);
          } catch (e) {
            console.warn(`Error precargando muestra: ${key}`, e);
          }
        })
      );
      if (this.sampleCache.size > 0) {
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('Error precargando banco de bajo:', err);
    } finally {
      this.isLoadingSamples = false;
    }
  }

  /**
   * Generador de Ghost Note Cohesiva y Homogénea:
   * Mantiene el mismo carácter percusivo orgánico (cuerpo de madera + golpe de traste)
   * variando la afinación de forma sutil según la cuerda, sin sonar como dos instrumentos distintos.
   */
  private triggerUnifiedGhost(
    time: number,
    midi: number,
    stringIndex: number | undefined,
    velNorm: number
  ) {
    if (!this.ctx || !this.masterGain) return;

    // Usar la muestra de slapLow como cuerpo percusivo base
    const baseBuffer = this.sampleCache.get('slapLow') || this.sampleCache.get('fingerLow');

    // Afinación relativa sutil: las cuerdas agudas son ligeramente más claras, pero dentro del mismo timbre
    const stringOffset = stringIndex !== undefined ? (3 - stringIndex) * 2 : (midi - 28) * 0.3;
    const playbackRate = Math.max(0.85, Math.min(1.35, 1.0 + stringOffset * 0.05));

    if (baseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = baseBuffer;
      src.playbackRate.setValueAtTime(playbackRate, time);

      // Filtro percusivo equilibrado: deja pasar el golpe de madera y el click metálico del traste
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + stringOffset * 150, time);
      filter.Q.setValueAtTime(1.8, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(1.5 * velNorm, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      src.start(time);
      src.stop(time + 0.06);
    }

    // Componente acústico sordo de diapasón (thump natural)
    const thump = this.ctx.createOscillator();
    const thumpG = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(90 + stringOffset * 8, time);
    thump.frequency.exponentialRampToValueAtTime(45, time + 0.035);

    thumpG.gain.setValueAtTime(0.7 * velNorm, time);
    thumpG.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    thump.connect(thumpG);
    thumpG.connect(this.masterGain);

    thump.start(time);
    thump.stop(time + 0.045);
  }

  /**
   * Reproducción articulada de notas
   */
  public playNote(event: BassNoteEvent) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now =
      event.scheduleTime !== undefined
        ? Math.max(this.ctx.currentTime, event.scheduleTime)
        : this.ctx.currentTime;

    const {
      midi,
      duration = 0.7,
      velocity = 100,
      technique = 'normal',
      stringIndex,
      targetMidi,
    } = event;

    const velNorm = Math.min(1.3, Math.max(0.2, velocity / 100));

    // =========================================================================
    // 1. GHOST NOTE (HOMOGÉNEA Y CON PRESENCIA)
    // =========================================================================
    if (technique === 'ghost') {
      this.triggerUnifiedGhost(now, midi, stringIndex, velNorm);
      return;
    }

    // =========================================================================
    // 2. SELECCIÓN DE LA MUESTRA MÁS CERCANA (Cero estiramiento de octava)
    // =========================================================================
    let sampleKey = 'fingerLow';
    let baseMidi = this.baseMidis.fingerLow;

    if (technique === 'slap') {
      // Si la nota es grave (4ª o 3ª cuerda: MIDI < 38), usar slapLow (E1 real)
      if (midi < 38) {
        sampleKey = 'slapLow';
        baseMidi = this.baseMidis.slapLow;
      } else {
        sampleKey = 'slapMid';
        baseMidi = this.baseMidis.slapMid;
      }
    } else if (technique === 'pop') {
      sampleKey = 'pop';
      baseMidi = this.baseMidis.pop;
    } else {
      // Normal / Legato
      if (midi >= 36) {
        sampleKey = 'fingerMid';
        baseMidi = this.baseMidis.fingerMid;
      } else {
        sampleKey = 'fingerLow';
        baseMidi = this.baseMidis.fingerLow;
      }
    }

    const audioBuffer =
      this.sampleCache.get(sampleKey) ||
      this.sampleCache.get('slapLow') ||
      this.sampleCache.get('fingerLow');
    if (!audioBuffer) {
      this.preloadSamples();
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;

    // Afinación de precisión
    const semitoneDistance = midi - baseMidi;
    const initialPlaybackRate = Math.pow(2, semitoneDistance / 12);
    source.playbackRate.setValueAtTime(initialPlaybackRate, now);

    // Slide continuo
    if (technique === 'slide') {
      const destMidi = targetMidi || midi + 2;
      const destDistance = destMidi - baseMidi;
      const targetRate = Math.pow(2, destDistance / 12);
      source.playbackRate.exponentialRampToValueAtTime(targetRate, now + duration * 0.7);
    }

    // =========================================================================
    // 3. ARTICULACIÓN DE VIBRATO ORGÁNICO MEDIANTE LFO SOBRE SOURCE.DETUNE
    // =========================================================================
    let decayLength = duration;

    if (technique === 'vibrato') {
      // Extender el sustain para que el vibrato cante en la cuerda
      decayLength = Math.max(duration * 1.25, 0.95);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.2, now); // 5.2 Hz: cadencia de vibrato manual natural

      // Retardo acústico: la nota arranca afinada y firme en 0 cents
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.setValueAtTime(0, now + 0.14); // 140ms de ataque plano
      // Entrada progresiva del vaivén hasta 38 cents de amplitud
      lfoGain.gain.linearRampToValueAtTime(38 * velNorm, now + 0.36);

      lfo.connect(lfoGain);
      lfoGain.connect(source.detune);

      lfo.start(now);
      lfo.stop(now + decayLength + 0.1);
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const noteGain = this.ctx.createGain();

    let cutoff = 6500;
    let peakVol = 1.05 * velNorm;
    let sampleOffset = 0;
    let attackTime = 0.003;

    if (technique === 'pulloff' || technique === 'pull' || technique === 'hammer') {
      // Descartar el ataque de dedo para legato auténtico
      sampleOffset = 0.032;
      cutoff = 2800;
      peakVol = 0.85 * velNorm;
      attackTime = 0.016;
      decayLength = duration * 0.85;
    } else if (technique === 'slap') {
      cutoff = 9000;
      peakVol = 1.3 * velNorm;
      decayLength = Math.min(duration, 0.55);
    } else if (technique === 'pop') {
      cutoff = 11000;
      peakVol = 1.35 * velNorm;
      decayLength = Math.min(duration, 0.42);
    } else if (technique === 'vibrato') {
      cutoff = 7500; // Abre los armónicos para que la modulación destaque con calidez
      peakVol = 1.1 * velNorm;
    }

    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(280, cutoff * 0.2),
      now + decayLength * 0.8
    );

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(peakVol, now + attackTime);
    noteGain.gain.exponentialRampToValueAtTime(peakVol * 0.65, now + 0.15);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayLength);

    source.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    source.start(now, sampleOffset);
    source.stop(now + decayLength + 0.05);
  }
}

export const bassPreviewSynth = new SampledBassEngine();
