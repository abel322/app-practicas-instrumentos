// Servicio de Audio Web Audio API para el Módulo de Ruta Técnica (Mastery Path)
// Incluye: Metrónomo de Alta Precisión, Feedback Positivo de Graduación y Efectos Acústicos

export class MasteryAudioService {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private bpm: number = 100;
  private nextBeatTime: number = 0;
  private timerId: number | null = null;
  private currentBeat: number = 0; // 0, 1, 2, 3
  private onBeatCallback?: (beat: number) => void;
  private lookaheadMs: number = 25;
  private scheduleAheadSec: number = 0.1;

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
  }

  public getAudioContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(30, Math.min(280, newBpm));
  }

  public startMetronome(bpm: number, onBeat?: (beatNumber: number) => void) {
    this.stopMetronome();
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.bpm = bpm;
    this.onBeatCallback = onBeat;
    this.isRunning = true;
    this.currentBeat = 0;
    this.nextBeatTime = this.ctx.currentTime + 0.05;

    this.scheduler();
  }

  public stopMetronome() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public isMetronomeRunning(): boolean {
    return this.isRunning;
  }

  private scheduler = () => {
    if (!this.isRunning || !this.ctx) return;

    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleClick(this.currentBeat, this.nextBeatTime);
      this.advanceBeat();
    }

    this.timerId = window.setTimeout(this.scheduler, this.lookaheadMs);
  };

  private advanceBeat() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextBeatTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % 4;
  }

  private scheduleClick(beat: number, time: number) {
    if (!this.ctx) return;

    const isAccent = beat === 0;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isAccent ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);
    osc.frequency.exponentialRampToValueAtTime(isAccent ? 300 : 200, time + 0.035);

    gain.gain.setValueAtTime(isAccent ? 0.8 : 0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.045);

    // Notificar a la UI en el momento exacto
    const delay = Math.max(0, (time - this.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (this.isRunning && this.onBeatCallback) {
        this.onBeatCallback(beat);
      }
    }, delay);
  }

  /**
   * Ding sutil al sumar una repetición limpia
   */
  public playRepetitionTick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Chime positivo y triunfal al "Validar y Graduar Nivel"
   * Genera un arpegio ascendente brillante en Do Mayor (C5, E5, G5, B5, C6) con cola armónica
   */
  public playVictoryChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.6 }, // C5
      { freq: 659.25, time: 0.10, dur: 0.6 }, // E5
      { freq: 783.99, time: 0.20, dur: 0.7 }, // G5
      { freq: 987.77, time: 0.30, dur: 0.8 }, // B5
      { freq: 1046.50, time: 0.40, dur: 1.4 }, // C6
      { freq: 1318.51, time: 0.44, dur: 1.6 }, // E6 sparkle
    ];

    notes.forEach(({ freq, time, dur }) => {
      if (!this.ctx) return;
      const t = now + time;

      // Armónico 1 (Cálido)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, t);

      gain1.gain.setValueAtTime(0.0001, t);
      gain1.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(t);
      osc1.stop(t + dur + 0.05);

      // Armónico 2 (Brillo / Shimmer campana)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, t);

      gain2.gain.setValueAtTime(0.0001, t);
      gain2.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.7);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(t);
      osc2.stop(t + dur * 0.7 + 0.05);
    });
  }

  /**
   * Señal de inicio para el mantenimiento diario de 2 minutos
   */
  public playWarmupStartSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const tones = [
      { freq: 440, time: 0.00, dur: 0.12 },
      { freq: 880, time: 0.12, dur: 0.25 },
    ];

    tones.forEach(({ freq, time, dur }) => {
      if (!this.ctx) return;
      const t = now + time;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  }
}

// Singleton accesible globalmente
let masteryAudioInstance: MasteryAudioService | null = null;

export function getMasteryAudioEngine(): MasteryAudioService {
  if (!masteryAudioInstance) {
    masteryAudioInstance = new MasteryAudioService();
  }
  return masteryAudioInstance;
}

