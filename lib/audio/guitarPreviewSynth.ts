// Motor de Síntesis y Articulaciones Específicas para Guitarra Eléctrica/Acústica

export type GuitarTechnique =
  | 'normal'
  | 'hammer'
  | 'pulloff'
  | 'pull'
  | 'bend'
  | 'slide'
  | 'vibrato'
  | 'natural_harmonic'
  | 'pinch_harmonic'
  | 'pm';

export interface GuitarNoteEvent {
  midi: number;
  duration?: number;
  velocity?: number;
  technique?: GuitarTechnique | string;
  targetMidi?: number;
  stringIndex?: number;
  scheduleTime?: number;
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

class GuitarPreviewSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
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

  public playNote(event: GuitarNoteEvent) {
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

    const normTech = (technique || 'normal').toLowerCase();
    const velNorm = Math.min(1.2, Math.max(0.2, velocity / 100));
    let baseFreq = this.midiToFreq(midi);

    // Armónicos: alteran la frecuencia hacia el parcial armónico
    if (normTech === 'natural_harmonic') {
      baseFreq *= 2; // Armónico de octava cristalino
    } else if (normTech === 'pinch_harmonic') {
      baseFreq *= 3; // Quinto o tercer armónico agudo
    }

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    osc1.type = normTech === 'natural_harmonic' ? 'sine' : 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq, now);

    let attackTime = 0.003;
    let cutoff = normTech === 'pinch_harmonic' ? 9000 : 5500;
    let decayLength = duration;

    // ARTICULACIONES ESPECÍFICAS
    if (normTech === 'bend') {
      // Bending: rampa ascendente de 1 tono (+200 cents) a mitad de la nota
      osc1.detune.setValueAtTime(0, now);
      osc2.detune.setValueAtTime(0, now);
      osc1.detune.linearRampToValueAtTime(100, now + 0.08); // Inicio de subida
      osc1.detune.linearRampToValueAtTime(200, now + 0.28); // Cima del bend (+1 tono)
      osc2.detune.linearRampToValueAtTime(100, now + 0.08);
      osc2.detune.linearRampToValueAtTime(200, now + 0.28);
    } else if (normTech === 'vibrato') {
      // Vibrato de guitarra: rápido y expresivo
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.8, now);
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.setValueAtTime(0, now + 0.1);
      lfoGain.gain.linearRampToValueAtTime(75, now + 0.25);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.detune);
      lfoGain.connect(osc2.detune);
      lfo.start(now);
      lfo.stop(now + duration);
    } else if (normTech === 'hammer' || normTech === 'pulloff' || normTech === 'pull') {
      attackTime = 0.02; // Ataque amortiguado sin púa
      cutoff = 3200;
      decayLength = duration * 0.85;
    } else if (normTech === 'slide') {
      const destMidi = targetMidi || midi + 2;
      const destFreq = this.midiToFreq(destMidi);
      osc1.frequency.exponentialRampToValueAtTime(destFreq, now + duration * 0.6);
      osc2.frequency.exponentialRampToValueAtTime(destFreq, now + duration * 0.6);
    }

    filter.type = normTech === 'natural_harmonic' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.setValueAtTime(normTech === 'pinch_harmonic' ? 4.5 : 1.0, now);

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.7 * velNorm, now + attackTime);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayLength);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + decayLength + 0.05);
    osc2.stop(now + decayLength + 0.05);
  }
}

export const guitarPreviewSynth = new GuitarPreviewSynth();
