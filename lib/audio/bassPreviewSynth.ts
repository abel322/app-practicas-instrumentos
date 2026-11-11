// Motor de Audio de Muestras Reales con Articulación Avanzada para Bajo Eléctrico

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
  stringIndex?: number; // 0: Cuerda G, 1: D, 2: A, 3: E
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

  private sampleUrls: Record<string, string> = {
    slap: 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/slap_bass_1-mp3/E2.mp3',
    pop: 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/slap_bass_2-mp3/G3.mp3',
    finger:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/electric_bass_finger-mp3/E2.mp3',
    fingerHigh:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/electric_bass_finger-mp3/G3.mp3',
  };

  private baseMidis: Record<string, number> = {
    slap: 40, // E2
    pop: 55, // G3
    finger: 40, // E2
    fingerHigh: 55, // G3
  };

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Compresor de bus master para pegada sin saturación
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.16, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.15, this.ctx.currentTime);

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
            console.warn(`Error precargando muestra de bajo: ${key}`, e);
          }
        })
      );
      if (this.sampleCache.size > 0) {
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('Error precargando muestras:', err);
    } finally {
      this.isLoadingSamples = false;
    }
  }

  /**
   * Generador de Ghost Notes con pegada real y distinción acústica
   */
  private triggerGhostNote(time: number, isPopGhost: boolean, velNorm: number) {
    if (!this.ctx || !this.masterGain) return;

    const targetBuffer = isPopGhost
      ? this.sampleCache.get('pop') || this.sampleCache.get('fingerHigh')
      : this.sampleCache.get('slap') || this.sampleCache.get('finger');

    const filter = this.ctx.createBiquadFilter();
    const ghostGain = this.ctx.createGain();

    if (targetBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = targetBuffer;
      // Ajustar velocidad de reproducción para dar carácter de percusión apagada
      source.playbackRate.setValueAtTime(isPopGhost ? 1.2 : 0.85, time);

      if (isPopGhost) {
        // GHOST NOTE DE POP (Tirón en cuerdas agudas): Chasquido brillante y seco
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2800, time);
        filter.Q.setValueAtTime(2.2, time);

        ghostGain.gain.setValueAtTime(1.65 * velNorm, time);
        ghostGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
      } else {
        // GHOST NOTE DE SLAP (Pulgar en cuerdas graves): Golpe percusivo con peso y thud
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, time);
        filter.Q.setValueAtTime(1.5, time);

        ghostGain.gain.setValueAtTime(1.85 * velNorm, time);
        ghostGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

        // Añadir componente de cuerpo de madera subgrave
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(120, time);
        subOsc.frequency.exponentialRampToValueAtTime(45, time + 0.04);
        subGain.gain.setValueAtTime(1.1 * velNorm, time);
        subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(time);
        subOsc.stop(time + 0.055);
      }

      source.connect(filter);
      filter.connect(ghostGain);
      ghostGain.connect(this.masterGain);

      source.start(time);
      source.stop(time + (isPopGhost ? 0.05 : 0.07));
      return;
    }

    // Fallback inmediato si las muestras aún están descargando
    const fallbackOsc = this.ctx.createOscillator();
    const fallbackGain = this.ctx.createGain();
    fallbackOsc.type = isPopGhost ? 'triangle' : 'sine';
    fallbackOsc.frequency.setValueAtTime(isPopGhost ? 420 : 120, time);
    fallbackOsc.frequency.exponentialRampToValueAtTime(isPopGhost ? 140 : 45, time + 0.04);
    fallbackGain.gain.setValueAtTime(1.2 * velNorm, time);
    fallbackGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    fallbackOsc.connect(fallbackGain);
    fallbackGain.connect(this.masterGain);
    fallbackOsc.start(time);
    fallbackOsc.stop(time + 0.055);
  }

  /**
   * Reproduce notas con modelado de articulación real
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
    // 1. GHOST NOTE CON DISTINCIÓN SLAP VS POP
    // =========================================================================
    if (technique === 'ghost') {
      // Si la nota está en cuerdas 0 o 1 (G o D) o midi >= 50 -> Pop Ghost
      // Si está en cuerdas 2 o 3 (A o E) o midi < 50 -> Slap Ghost
      const isPopGhost = stringIndex !== undefined ? stringIndex <= 1 : midi >= 50;
      this.triggerGhostNote(now, isPopGhost, velNorm);
      return;
    }

    // =========================================================================
    // 2. SELECCIÓN DE BUFFER REAL
    // =========================================================================
    let sampleKey = 'finger';
    let baseMidi = this.baseMidis.finger;

    if (technique === 'slap') {
      sampleKey = 'slap';
      baseMidi = this.baseMidis.slap;
    } else if (technique === 'pop') {
      sampleKey = 'pop';
      baseMidi = this.baseMidis.pop;
    } else if (midi > 48) {
      sampleKey = 'fingerHigh';
      baseMidi = this.baseMidis.fingerHigh;
    }

    const audioBuffer = this.sampleCache.get(sampleKey) || this.sampleCache.get('finger');
    if (!audioBuffer) {
      this.preloadSamples();
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;

    const semitoneDistance = midi - baseMidi;
    const initialPlaybackRate = Math.pow(2, semitoneDistance / 12);
    source.playbackRate.setValueAtTime(initialPlaybackRate, now);

    // Slide continuo
    if (technique === 'slide') {
      const destMidi = targetMidi || midi + 2;
      const destDistance = destMidi - baseMidi;
      const targetRate = Math.pow(2, destDistance / 12);
      source.playbackRate.exponentialRampToValueAtTime(targetRate, now + duration * 0.7);
    } else if (technique === 'vibrato') {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, now);
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.setValueAtTime(0, now + 0.08);
      lfoGain.gain.linearRampToValueAtTime(28, now + 0.25);
      lfo.connect(lfoGain);
      lfoGain.connect(source.detune);
      lfo.start(now);
      lfo.stop(now + duration);
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const noteGain = this.ctx.createGain();

    // =========================================================================
    // 3. PARÁMETROS DINÁMICOS Y TRATAMIENTO DE PULL-OFF / HAMMER-ON
    // =========================================================================
    let cutoff = 6000;
    let peakVol = 1.0 * velNorm;
    let decayLength = duration;
    let sampleOffset = 0; // Descarte de transitorio de púa para ligados
    let attackTime = 0.004;

    if (technique === 'pulloff' || technique === 'pull' || technique === 'hammer') {
      // Ligados: La mano derecha NO pulsa la cuerda.
      // Descartamos los primeros 28ms del archivo para eliminar el ataque de dedo/púa.
      sampleOffset = 0.028;
      cutoff = 2600; // Tono más cálido y redondo
      peakVol = 0.85 * velNorm;
      attackTime = 0.018; // Envolvente suave sin click
      decayLength = duration * 0.85;
    } else if (technique === 'slap') {
      cutoff = 8500;
      peakVol = 1.25 * velNorm;
      decayLength = Math.min(duration, 0.55);
    } else if (technique === 'pop') {
      cutoff = 10500;
      peakVol = 1.35 * velNorm;
      decayLength = Math.min(duration, 0.42);
    }

    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(300, cutoff * 0.2),
      now + decayLength * 0.75
    );

    // Envolvente de Ganancia
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(peakVol, now + attackTime);
    noteGain.gain.exponentialRampToValueAtTime(peakVol * 0.6, now + 0.12);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayLength);

    source.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    // Arrancar la muestra descartando el transitorio en ligados
    source.start(now, sampleOffset);
    source.stop(now + decayLength + 0.05);
  }
}

export const bassPreviewSynth = new SampledBassEngine();
