// Motor de articulación para bajo eléctrico usando Web Audio API pura

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
  targetMidi?: number; // Para slides de traste
  scheduleTime?: number; // Tiempo opcional de programación en AudioContext
}

// Mapa MIDI para bajo estándar de 4 cuerdas:
// Soporta numeración 1..4 (1=G2, 2=D2, 3=A1, 4=E1) y 0..3 (0=G2, 1=D2, 2=A1, 3=E1)
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

class BassArticulatedSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Compresor de bus master para pegada y control de picos en Slap/Pop
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(15, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Generador de ruido filtrado para el click de cuerdas o Ghost Notes
   */
  private triggerNoiseClick(
    time: number,
    centerFreq: number,
    duration: number,
    gainLevel: number
  ) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, time);
    filter.Q.setValueAtTime(3.0, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(Math.max(0.0001, gainLevel), time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + duration);
  }

  /**
   * Dispara una nota aplicando modelado de articulación real
   */
  public playNote(event: BassNoteEvent) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now =
      event.scheduleTime !== undefined
        ? Math.max(this.ctx.currentTime, event.scheduleTime)
        : this.ctx.currentTime;

    const {
      midi,
      duration = 0.8,
      velocity = 100,
      technique = 'normal',
      targetMidi,
    } = event;

    const safeDuration = Math.max(0.08, duration);
    const freq = this.midiToFreq(midi);
    const velNormalized =
      velocity <= 1.0
        ? Math.min(1, Math.max(0.1, velocity))
        : Math.min(1, Math.max(0.1, velocity / 127));

    // =========================================================================
    // 1. TÉCNICA: GHOST NOTE (Nota muerta / X)
    // Sin oscilador tonal, solo chasquido de cuerda apagada contra el mástil
    // =========================================================================
    if (technique === 'ghost') {
      this.triggerNoiseClick(now, 450, 0.05, 0.5 * velNormalized);
      this.triggerNoiseClick(now, 1800, 0.03, 0.3 * velNormalized);
      return;
    }

    // Configuración base de osciladores para bajo eléctrico
    const oscMain = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    oscMain.type = 'sawtooth'; // Armónicos ricos de bajo
    oscSub.type = 'triangle'; // Graves fundamentales limpios

    oscMain.frequency.setValueAtTime(freq, now);
    oscSub.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';

    // =========================================================================
    // 2. PARÁMETROS ESPECÍFICOS SEGÚN LA TÉCNICA
    // =========================================================================
    let peakVolume = 0.45 * velNormalized;
    let attackTime = 0.004;
    let decayDuration = safeDuration;
    let initialFilterCutoff = 1200;
    let endFilterCutoff = 250;

    switch (technique) {
      case 'slap': {
        // Golpe con el pulgar: ataque percusivo agresivo con chasquido de traste
        peakVolume = 0.6 * velNormalized;
        attackTime = 0.002;
        initialFilterCutoff = 4200; // Mucho brillo inicial (cuerda chocando)
        endFilterCutoff = 350;
        decayDuration = Math.min(safeDuration, 0.5); // Decay percusivo más rápido

        // Click percusivo de traste (Fret Buzz Attack)
        this.triggerNoiseClick(now, 3200, 0.02, 0.45 * velNormalized);
        this.triggerNoiseClick(now, 180, 0.04, 0.6 * velNormalized);
        break;
      }

      case 'pop': {
        // Tirón de cuerda con dedo índice/medio: ataque cortante y twang metálico
        peakVolume = 0.65 * velNormalized;
        attackTime = 0.0015;
        initialFilterCutoff = 5500; // Pico agudo extremo
        endFilterCutoff = 400;
        decayDuration = Math.min(safeDuration, 0.4);

        // Chasquido seco agudo de cuerda liberada
        this.triggerNoiseClick(now, 4200, 0.025, 0.55 * velNormalized);
        break;
      }

      case 'hammer': {
        // Ligado ascendente: la nota entra sin golpe de púa/dedo de mano derecha
        peakVolume = 0.38 * velNormalized;
        attackTime = 0.02; // Ataque suave, sin transitorio de golpe
        initialFilterCutoff = 900;
        endFilterCutoff = 220;
        break;
      }

      case 'pulloff':
      case 'pull': {
        // Ligado descendente: ataque sutil con cuerda liberada por mano izquierda
        peakVolume = 0.4 * velNormalized;
        attackTime = 0.012;
        initialFilterCutoff = 1100;
        endFilterCutoff = 240;
        break;
      }

      case 'slide': {
        // Arrastre continuo de traste (Pitch Glide)
        const destinationMidi = targetMidi ?? midi + 2;
        const destinationFreq = this.midiToFreq(destinationMidi);
        oscMain.frequency.linearRampToValueAtTime(destinationFreq, now + safeDuration * 0.7);
        oscSub.frequency.linearRampToValueAtTime(destinationFreq, now + safeDuration * 0.7);
        initialFilterCutoff = 1800;
        endFilterCutoff = 300;
        break;
      }

      case 'vibrato': {
        // LFO que modula suavemente el tono tras un retardo de 80ms
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        lfo.frequency.setValueAtTime(5.8, now); // 5.8 Hz de velocidad de vibrato
        lfoGain.gain.setValueAtTime(0, now);
        lfoGain.gain.setValueAtTime(0, now + 0.08);
        lfoGain.gain.linearRampToValueAtTime(30, now + 0.25); // Amplitud en Cents

        lfo.connect(lfoGain);
        lfoGain.connect(oscMain.detune);
        lfoGain.connect(oscSub.detune);

        lfo.start(now);
        lfo.stop(now + safeDuration);
        initialFilterCutoff = 1400;
        break;
      }

      case 'normal':
      default: {
        initialFilterCutoff = 1600;
        endFilterCutoff = 280;
        break;
      }
    }

    // Envolvente de filtro dinámico
    filter.frequency.setValueAtTime(initialFilterCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(80, endFilterCutoff),
      now + decayDuration * 0.85
    );

    // Envolvente de ganancia (ADSR de bajo eléctrico)
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakVolume, now + attackTime);
    noteGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, peakVolume * 0.5),
      now + attackTime + 0.12
    );
    noteGain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + Math.max(attackTime + 0.15, decayDuration)
    );

    // Ruteo de audio
    oscMain.connect(filter);
    oscSub.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    // Iniciar y finalizar osciladores
    oscMain.start(now);
    oscSub.start(now);

    const stopTime = now + Math.max(attackTime + 0.15, decayDuration) + 0.05;
    oscMain.stop(stopTime);
    oscSub.stop(stopTime);
  }
}

export const bassPreviewSynth = new BassArticulatedSynth();

