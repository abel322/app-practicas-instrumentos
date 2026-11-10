// Motor de Modelado Acústico y Articulaciones de Bajo Eléctrico (Web Audio API)

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

class RealisticBassSynth {
  private ctx: AudioContext | null = null;
  private cabinetInput: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // 1. Entrada al bus de cabina
      this.cabinetInput = this.ctx.createGain();
      this.cabinetInput.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // 2. Preamp: Saturación cálida a bulbos (WaveShaper)
      const saturator = this.ctx.createWaveShaper();
      saturator.curve = this.createSaturationCurve(1024);
      saturator.oversample = '2x';

      // 3. Simulación de Pantalla 4x10" (EQ de Altavoz de Bajo)
      const bassPunch = this.ctx.createBiquadFilter();
      bassPunch.type = 'lowshelf';
      bassPunch.frequency.setValueAtTime(90, this.ctx.currentTime);
      bassPunch.gain.setValueAtTime(3.5, this.ctx.currentTime);

      const midScoop = this.ctx.createBiquadFilter();
      midScoop.type = 'peaking';
      midScoop.frequency.setValueAtTime(450, this.ctx.currentTime);
      midScoop.gain.setValueAtTime(-2.5, this.ctx.currentTime);
      midScoop.Q.setValueAtTime(1.2, this.ctx.currentTime);

      const attackBite = this.ctx.createBiquadFilter();
      attackBite.type = 'peaking';
      attackBite.frequency.setValueAtTime(2400, this.ctx.currentTime);
      attackBite.gain.setValueAtTime(3.0, this.ctx.currentTime);
      attackBite.Q.setValueAtTime(1.8, this.ctx.currentTime);

      // Corte superior de cono de bajo (elimina el zumbido de sintetizador)
      const cabLowpass = this.ctx.createBiquadFilter();
      cabLowpass.type = 'lowpass';
      cabLowpass.frequency.setValueAtTime(4200, this.ctx.currentTime);
      cabLowpass.Q.setValueAtTime(0.7, this.ctx.currentTime);

      // 4. Compresor de estudio para bajo
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      // 5. Ganancia de salida general
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

      // Ruteo de la cadena de amplificación:
      this.cabinetInput
        .connect(saturator)
        .connect(bassPunch)
        .connect(midScoop)
        .connect(attackBite)
        .connect(cabLowpass)
        .connect(compressor)
        .connect(this.masterGain)
        .connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  // Curva de saturación analógica suave (función tanh)
  private createSaturationCurve(samples: number): Float32Array<ArrayBuffer> {
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * 1.6);
    }
    return curve;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Reproduce una nota con articulación y modelado acústico
   */
  public playNote(event: BassNoteEvent) {
    this.init();
    if (!this.ctx || !this.cabinetInput) return;

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

    const safeDuration = Math.max(0.08, duration);
    const freq = this.midiToFreq(midi);
    const velNorm =
      velocity <= 1.0
        ? Math.min(1, Math.max(0.15, velocity))
        : Math.min(1, Math.max(0.15, velocity / 127));

    // =========================================================================
    // 1. ARTICULACIÓN: GHOST NOTE (NOTA MUERTA / X) - CERO RUIDO BLANCO
    // Simula el golpe sordo de cuerda apagada contra madera y traste
    // =========================================================================
    if (technique === 'ghost') {
      // A. Cuerpo grave de la madera (Doppler percusivo de 135Hz a 48Hz)
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();

      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(135, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(48, now + 0.038);

      thumpGain.gain.setValueAtTime(0.75 * velNorm, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.cabinetInput);

      // B. Resonancia de traste y diapasón (Fret-thud a 850 Hz con Q pronunciado)
      const clackOsc = this.ctx.createOscillator();
      const clackGain = this.ctx.createGain();
      const clackFilter = this.ctx.createBiquadFilter();

      clackOsc.type = 'triangle';
      clackOsc.frequency.setValueAtTime(850, now);
      clackFilter.type = 'bandpass';
      clackFilter.frequency.setValueAtTime(850, now);
      clackFilter.Q.setValueAtTime(4.2, now);

      clackGain.gain.setValueAtTime(0.55 * velNorm, now);
      clackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

      clackOsc.connect(clackFilter);
      clackFilter.connect(clackGain);
      clackGain.connect(this.cabinetInput);

      thumpOsc.start(now);
      thumpOsc.stop(now + 0.05);
      clackOsc.start(now);
      clackOsc.stop(now + 0.04);
      return;
    }

    // =========================================================================
    // 2. CUERPO DE LA NOTA TONAL (NORMAL, SLAP, POP, LEGATO)
    // =========================================================================
    // Oscilador 1: Fundamental con peso orgánico
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // Oscilador 2: Armónicos entorchados (sawtooth suave con desafinación microtonal)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(1.8, now);

    // Filtro dinámico de cuerda
    const stringFilter = this.ctx.createBiquadFilter();
    stringFilter.type = 'lowpass';

    // Envolvente de volumen de la nota
    const noteGain = this.ctx.createGain();

    let peakGain = 0.5 * velNorm;
    let attackTime = 0.005;
    let decayTime = safeDuration;
    let initialFilterCutoff = 1500;
    let endFilterCutoff = 280;

    switch (technique) {
      case 'slap': {
        // Golpe de pulgar: pegada rápida, leve caída de tono inicial (15ms) y chasquido metálico
        peakGain = 0.65 * velNorm;
        attackTime = 0.002;
        initialFilterCutoff = 3600;
        endFilterCutoff = 320;
        decayTime = Math.min(safeDuration, 0.45);

        osc1.frequency.setValueAtTime(freq * 1.06, now);
        osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.015);
        osc2.frequency.setValueAtTime(freq * 1.06, now);
        osc2.frequency.exponentialRampToValueAtTime(freq, now + 0.015);

        // Golpe percusivo de traste (fret clack)
        const clack = this.ctx.createOscillator();
        const clackG = this.ctx.createGain();
        clack.type = 'triangle';
        clack.frequency.setValueAtTime(3200, now);
        clackG.gain.setValueAtTime(0.35 * velNorm, now);
        clackG.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
        clack.connect(clackG);
        clackG.connect(this.cabinetInput);
        clack.start(now);
        clack.stop(now + 0.025);
        break;
      }

      case 'pop': {
        // Tirón de cuerda: twang muy brillante y ataque seco
        peakGain = 0.7 * velNorm;
        attackTime = 0.0015;
        initialFilterCutoff = 4500;
        endFilterCutoff = 360;
        decayTime = Math.min(safeDuration, 0.38);

        // Chasquido metálico agudo de cuerda liberada contra el traste
        const popSnap = this.ctx.createOscillator();
        const popSnapG = this.ctx.createGain();
        popSnap.type = 'triangle';
        popSnap.frequency.setValueAtTime(3800, now);
        popSnap.frequency.exponentialRampToValueAtTime(1400, now + 0.018);
        popSnapG.gain.setValueAtTime(0.38 * velNorm, now);
        popSnapG.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
        popSnap.connect(popSnapG);
        popSnapG.connect(this.cabinetInput);
        popSnap.start(now);
        popSnap.stop(now + 0.022);
        break;
      }

      case 'hammer':
      case 'pulloff':
      case 'pull': {
        // Ligados: entrada amortiguada sin golpe de dedo
        peakGain = 0.42 * velNorm;
        attackTime = 0.018;
        initialFilterCutoff = 1100;
        endFilterCutoff = 240;
        break;
      }

      case 'slide': {
        const destMidi = targetMidi || midi + 2;
        const destFreq = this.midiToFreq(destMidi);
        osc1.frequency.exponentialRampToValueAtTime(destFreq, now + safeDuration * 0.65);
        osc2.frequency.exponentialRampToValueAtTime(destFreq, now + safeDuration * 0.65);
        initialFilterCutoff = 1800;
        break;
      }

      case 'vibrato': {
        const lfo = this.ctx.createOscillator();
        const lfoG = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, now);
        lfoG.gain.setValueAtTime(0, now);
        lfoG.gain.setValueAtTime(0, now + 0.09);
        lfoG.gain.linearRampToValueAtTime(32, now + 0.28);
        lfo.connect(lfoG);
        lfoG.connect(osc1.detune);
        lfoG.connect(osc2.detune);
        lfo.start(now);
        lfo.stop(now + safeDuration);
        initialFilterCutoff = 1600;
        break;
      }

      case 'normal':
      default: {
        initialFilterCutoff = 1700;
        endFilterCutoff = 290;
        break;
      }
    }

    // Envolvente del filtro
    stringFilter.frequency.setValueAtTime(initialFilterCutoff, now);
    stringFilter.frequency.exponentialRampToValueAtTime(
      Math.max(80, endFilterCutoff),
      now + decayTime * 0.75
    );

    // Envolvente de volumen (ADSR)
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
    noteGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, peakGain * 0.55),
      now + attackTime + 0.12
    );
    noteGain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + Math.max(attackTime + 0.15, decayTime)
    );

    // Conexión
    osc1.connect(stringFilter);
    osc2.connect(stringFilter);
    stringFilter.connect(noteGain);
    noteGain.connect(this.cabinetInput);

    osc1.start(now);
    osc2.start(now);

    const stopTime = now + Math.max(attackTime + 0.15, decayTime) + 0.04;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  }
}

export const bassPreviewSynth = new RealisticBassSynth();
