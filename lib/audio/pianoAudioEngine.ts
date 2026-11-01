// Motor de Audio Polifónico para Piano / Teclado (Web Audio API)

export class PianoAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private metronomeGain: GainNode | null = null;

  constructor() {}

  public init() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Compresor para evitar distorsión en acordes polifónicos y pasajes densos
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Ganancia independiente de metrónomo
    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.metronomeGain.connect(this.ctx.destination);
  }

  public resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
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
   * Dispara una nota polifónica de piano acústico sintetizado
   */
  public triggerNote(
    midi: number,
    timeOffsetOrScheduleTime?: number,
    durationSec: number = 0.8,
    velocity: number = 0.85
  ) {
    this.resume();
    if (!this.ctx || !this.compressor) return;

    const isScheduledTime =
      timeOffsetOrScheduleTime !== undefined && timeOffsetOrScheduleTime > this.ctx.currentTime;
    const startTime = isScheduledTime
      ? timeOffsetOrScheduleTime
      : this.ctx.currentTime + (timeOffsetOrScheduleTime || 0);

    const freq = this.midiToFrequency(midi);
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    // Duración natural dependiente del registro: notas graves resuenan más tiempo
    const naturalDecay = midi < 48 ? durationSec * 1.6 : midi > 72 ? durationSec * 0.7 : durationSec;
    const stopTime = startTime + naturalDecay + 0.1;

    // Nodo de ganancia y envolvente ADSR de la nota
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    // Ataque rápido de martillo
    noteGain.gain.linearRampToValueAtTime(0.7 * vel, startTime + 0.003);
    // Decaimiento exponencial inicial
    noteGain.gain.exponentialRampToValueAtTime(0.4 * vel, startTime + 0.08);
    // Caída gradual hacia el silencio
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + naturalDecay);

    // Filtro Paso-Bajo que simula el apagado progresivo de armónicos en la cuerda de piano
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = Math.min(8000, freq * (3.5 + vel * 2.5));
    filter.frequency.setValueAtTime(cutoff, startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 1.1), startTime + naturalDecay);

    // Oscilador 1: Fundamental cálida (onda senoidal con ataque percusivo)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Oscilador 2: Armónicos metálicos y cuerpo de madera de piano (onda triangular)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.28 * vel, startTime);
    osc2Gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

    // Oscilador 3: Golpe percusivo de martillo (hammer click transitorio)
    const hammerOsc = this.ctx.createOscillator();
    hammerOsc.type = 'sine';
    hammerOsc.frequency.setValueAtTime(freq * 4.5, startTime);
    const hammerGain = this.ctx.createGain();
    hammerGain.gain.setValueAtTime(0.18 * vel, startTime);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025);

    // Conexiones de audio
    osc1.connect(noteGain);

    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);

    hammerOsc.connect(hammerGain);
    hammerGain.connect(noteGain);

    noteGain.connect(filter);
    filter.connect(this.compressor);

    // Inicio y parada de osciladores
    osc1.start(startTime);
    osc2.start(startTime);
    hammerOsc.start(startTime);

    osc1.stop(stopTime);
    osc2.stop(stopTime);
    hammerOsc.stop(startTime + 0.03);
  }

  /**
   * Reproduce pulso de metrónomo sincronizado en el tiempo programado
   */
  public playMetronome(time: number, isDownbeat: boolean) {
    this.resume();
    if (!this.ctx || !this.metronomeGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, time);

    gain.gain.setValueAtTime(isDownbeat ? 0.6 : 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.metronomeGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

let pianoAudioInstance: PianoAudioEngine | null = null;

export function getPianoAudioEngine(): PianoAudioEngine {
  if (!pianoAudioInstance) {
    pianoAudioInstance = new PianoAudioEngine();
  }
  return pianoAudioInstance;
}

