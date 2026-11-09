// Motor de Audio Polifónico de Piano Acústico para Práctica y Secuenciadores (Web Audio API)

export class PianoAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private metronomeGain: GainNode | null = null;

  constructor() {}

  public init() {
    if (typeof window === 'undefined') return;
    if (this.ctx && this.ctx.state !== 'closed') return;
    const AudioContextClass =
      window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Compresor de master para evitar saturación en acordes polifónicos de 4 o más notas
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(20, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    // Ganancia independiente de metrónomo
    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.metronomeGain.connect(this.ctx.destination);
  }

  public resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  public midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Dispara una nota polifónica con modelado de piano acústico (cuerdas al unísono + martillo de fieltro)
   */
  public triggerNote(
    midi: number,
    timeOffsetOrScheduleTime?: number,
    durationSec: number = 1.4,
    velocity: number = 0.85
  ) {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now =
      timeOffsetOrScheduleTime !== undefined
        ? Math.max(this.ctx.currentTime, timeOffsetOrScheduleTime)
        : this.ctx.currentTime;

    const freq = this.midiToFrequency(midi);
    // Soportar tanto velocidad normalizada (0..1) como MIDI (1..127)
    const velNormalized =
      velocity > 1.0
        ? Math.min(1, Math.max(0.1, velocity / 127))
        : Math.min(1, Math.max(0.1, velocity));

    const duration = Math.max(0.4, durationSec);

    // 1. Oscilador Principal (Cuerpo fundamental de la cuerda)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // 2. Oscilador Secundario (Armónicos y doble cuerda con leve desafinación / detune)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(midi < 48 ? 1.5 : 2.5, now);

    // 3. Golpe de Martillo / Transitorio de Ataque
    const hammer = this.ctx.createOscillator();
    hammer.type = 'sine';
    hammer.frequency.setValueAtTime(freq * 2.5, now);

    const hammerGain = this.ctx.createGain();
    hammerGain.gain.setValueAtTime(0.15 * velNormalized, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    // 4. Filtro Pasa-Bajas Dinámico (Dureza del fieltro del martillo)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCutoff = Math.min(8000, freq * 4 + 800 * velNormalized);
    filter.frequency.setValueAtTime(baseCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(250, freq * 1.5),
      now + duration * 0.8
    );

    // 5. Envolvente Principal de Amplitud (ADSR acústico)
    const noteGain = this.ctx.createGain();
    const peakVolume = 0.35 * velNormalized;

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakVolume, now + 0.004);
    noteGain.gain.exponentialRampToValueAtTime(peakVolume * 0.6, now + 0.15);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Conexiones de señal
    hammer.connect(hammerGain);
    hammerGain.connect(filter);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    // Inicio y parada de osciladores
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
  public triggerChord(
    midiNotes: number[],
    scheduleTime?: number,
    durationSec: number = 1.5,
    velocity: number = 90
  ) {
    if (!midiNotes || midiNotes.length === 0) return;
    const baseVel = velocity <= 1.0 ? velocity * 127 : velocity;
    const scaledVelocity = Math.max(50, baseVel - midiNotes.length * 4);

    midiNotes.forEach((midi) => {
      this.triggerNote(midi, scheduleTime, durationSec, scaledVelocity / 127);
    });
  }

  /**
   * Reproduce pulso de metrónomo sincronizado en el tiempo programado
   */
  public playMetronome(time: number, isDownbeat: boolean) {
    this.resume();
    if (!this.ctx || !this.metronomeGain) return;

    const startTime = Math.max(this.ctx.currentTime, time);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, startTime);

    gain.gain.setValueAtTime(isDownbeat ? 0.6 : 0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.04);

    osc.connect(gain);
    gain.connect(this.metronomeGain);

    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }
}

let pianoAudioInstance: PianoAudioEngine | null = null;

export function getPianoAudioEngine(): PianoAudioEngine {
  if (!pianoAudioInstance) {
    pianoAudioInstance = new PianoAudioEngine();
  }
  return pianoAudioInstance;
}
