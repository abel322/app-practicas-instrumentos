// Motor de Audio de Piano Acústico Polifónico optimizado para Web Audio API

class AcousticPianoSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Compresor de master para evitar saturación en acordes polifónicos de 4 o más notas
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(20, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  // Conversión MIDI a frecuencia en Hz (A4 = 440Hz)
  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Toca una nota individual con timbre de piano acústico
   * @param midi Número MIDI (ej. 60 = Do central)
   * @param duration Duración en segundos (default 1.4s)
   * @param velocity Velocidad/Intensidad de 1 a 127
   * @param scheduleTime Tiempo opcional de AudioContext para secuenciadores
   */
  public playNote(
    midi: number,
    duration: number = 1.4,
    velocity: number = 90,
    scheduleTime?: number
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now =
      scheduleTime !== undefined
        ? Math.max(this.ctx.currentTime, scheduleTime)
        : this.ctx.currentTime;
    const freq = this.midiToFreq(midi);
    const velNormalized = Math.min(1, Math.max(0.1, velocity / 127));

    // 1. Oscilador Principal (Cuerpo fundamental de la cuerda)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // 2. Oscilador Secundario (Armónicos y doble cuerda con leve desafinación / detune)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(midi < 48 ? 1.5 : 2.5, now); // Micro-detune acústico

    // 3. Golpe de Martillo / Transitorio de Ataque
    const hammer = this.ctx.createOscillator();
    hammer.type = 'sine';
    hammer.frequency.setValueAtTime(freq * 2.5, now);

    // Envolvente de Ganancia del Martillo (Click muy breve: 15ms)
    const hammerGain = this.ctx.createGain();
    hammerGain.gain.setValueAtTime(0.15 * velNormalized, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    // 4. Filtro Pasa-Bajas Dinámico (Dureza del fieltro del martillo)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // Notas más agudas abren más el filtro; mayor velocidad = sonido más brillante
    const baseCutoff = Math.min(8000, freq * 4 + 800 * velNormalized);
    filter.frequency.setValueAtTime(baseCutoff, now);
    // Decaimiento del brillo armónico típico de cuerdas de piano
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(250, freq * 1.5),
      now + duration * 0.8
    );

    // 5. Envolvente Principal de Amplitud (ADSR acústico)
    const noteGain = this.ctx.createGain();
    const peakVolume = 0.35 * velNormalized;

    // Ataque ultra rápido (2ms)
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakVolume, now + 0.004);

    // Decaimiento exponencial natural de piano
    noteGain.gain.exponentialRampToValueAtTime(peakVolume * 0.6, now + 0.15);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Conexiones de señal
    hammer.connect(hammerGain);
    hammerGain.connect(filter);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    // Disparo y parada
    osc1.start(now);
    osc2.start(now);
    hammer.start(now);

    const stopTime = now + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    hammer.stop(now + 0.03);
  }

  /**
   * Reproduce un acorde polifónico simultáneo equilibrando la ganancia
   */
  public playChord(
    midiNotes: number[],
    duration: number = 1.6,
    velocity: number = 85,
    scheduleTime?: number
  ) {
    if (!midiNotes || midiNotes.length === 0) return;

    // Escalar la velocidad para que un acorde de 4-5 notas no sature
    const scaledVelocity = Math.max(50, velocity - midiNotes.length * 4);

    midiNotes.forEach((midi) => {
      this.playNote(midi, duration, scaledVelocity, scheduleTime);
    });
  }
}

export const pianoPreviewSynth = new AcousticPianoSynth();
