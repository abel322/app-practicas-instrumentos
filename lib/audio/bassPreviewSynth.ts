// Motor de Audio Basado en Muestras Reales de Bajo Eléctrico (Sample-Based Engine)

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

  // URLs de grabaciones reales de bajo eléctrico (CDN público de alta velocidad y baja latencia)
  private sampleUrls: Record<string, string> = {
    // Slap real grabado (cuerda E1 / A1 con pulgar)
    slap: 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/slap_bass_1-mp3/E2.mp3',
    // Pop real grabado (cuerda D2 / G2 jalada)
    pop: 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/slap_bass_2-mp3/G3.mp3',
    // Bajo de dedos tradicional (Fingerstyle real)
    finger:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/electric_bass_finger-mp3/E2.mp3',
    fingerHigh:
      'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/electric_bass_finger-mp3/G3.mp3',
  };

  // Nota MIDI base de cada muestra de referencia
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

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(15, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

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

  /**
   * Pre-carga y decodifica las muestras reales en AudioBuffers en memoria
   */
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
            console.warn(`No se pudo cargar la muestra de bajo (${key}), usando fallback local`, e);
          }
        })
      );
      if (this.sampleCache.size > 0) {
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('Error precargando muestras de bajo:', err);
    } finally {
      this.isLoadingSamples = false;
    }
  }

  /**
   * Genera el impacto percusivo orgánico de Ghost Note real
   */
  private triggerAcousticGhost(time: number, velocityNorm: number) {
    if (!this.ctx || !this.masterGain) return;

    // Si hay muestra de slap cargada, reproducimos un fragmento ultracorto (30ms) con ataque amortiguado
    const slapBuf = this.sampleCache.get('slap');
    if (slapBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = slapBuf;
      src.playbackRate.setValueAtTime(0.7, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, time);
      filter.Q.setValueAtTime(2.5, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85 * velocityNorm, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      src.start(time);
      src.stop(time + 0.055);
      return;
    }

    // Fallback acústico percusivo de cuerda apagada (sin oscilador continuo)
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.04);

    g.gain.setValueAtTime(0.9 * velocityNorm, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Reproduce una nota con audio real muestreado
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
      targetMidi,
    } = event;

    const velNorm = Math.min(1.2, Math.max(0.2, velocity / 100));

    // =========================================================================
    // 1. GHOST NOTE
    // =========================================================================
    if (technique === 'ghost') {
      this.triggerAcousticGhost(now, velNorm);
      return;
    }

    // =========================================================================
    // 2. SELECCIÓN DE MUESTRA REAL SEGÚN TÉCNICA Y REGISTRO
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

    // Si aún se está descargando el primer buffer, esperamos o usamos tono acústico temporal
    if (!audioBuffer) {
      this.preloadSamples();
      return;
    }

    // =========================================================================
    // 3. REPRODUCCIÓN Y PITCH-SHIFTING CON MUESTRA REAL
    // =========================================================================
    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;

    // Cálculo del ratio de velocidad para afinar la muestra al traste exacto
    const semitoneDistance = midi - baseMidi;
    const initialPlaybackRate = Math.pow(2, semitoneDistance / 12);
    source.playbackRate.setValueAtTime(initialPlaybackRate, now);

    // Slide: Deslizar la afinación hacia el traste destino
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

    // Filtro y Envolvente dinámica según articulación
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const noteGain = this.ctx.createGain();

    let cutoff = 6500;
    let decayLength = duration;
    let peakVol = 0.9 * velNorm;

    if (technique === 'slap') {
      cutoff = 8500;
      decayLength = Math.min(duration, 0.6);
      peakVol = 1.1 * velNorm;
    } else if (technique === 'pop') {
      cutoff = 10000;
      decayLength = Math.min(duration, 0.45);
      peakVol = 1.15 * velNorm;
    } else if (technique === 'hammer' || technique === 'pulloff' || technique === 'pull') {
      cutoff = 4000;
      peakVol = 0.75 * velNorm;
    }

    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + decayLength * 0.8);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(peakVol, now + 0.005);
    noteGain.gain.exponentialRampToValueAtTime(peakVol * 0.6, now + 0.15);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayLength);

    source.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    source.start(now);
    source.stop(now + decayLength + 0.05);
  }
}

export const bassPreviewSynth = new SampledBassEngine();
