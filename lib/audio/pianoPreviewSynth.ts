// lib/audio/pianoPreviewSynth.ts
// Motor Acústico de Piano con Muestras Reales y Gestión Dinámica de Apagadores (Damper Pedal Real)

interface ActivePianoVoice {
  midi: number;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  isKeyHeld: boolean;
  startTime: number;
}

class SampledPianoSynth {
  private ctx: AudioContext | null = null;
  private sampleCache: Map<string, AudioBuffer> = new Map();
  private isLoaded: boolean = false;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeVoices: Map<number, ActivePianoVoice[]> = new Map();
  private isSustainActive: boolean = false;

  private sampleBaseUrl =
    'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3';

  private anchorNotes: { name: string; midi: number }[] = [
    { name: 'C1', midi: 24 },
    { name: 'G1', midi: 31 },
    { name: 'C2', midi: 36 },
    { name: 'E2', midi: 40 },
    { name: 'G2', midi: 43 },
    { name: 'C3', midi: 48 },
    { name: 'E3', midi: 52 },
    { name: 'G3', midi: 55 },
    { name: 'C4', midi: 60 },
    { name: 'E4', midi: 64 },
    { name: 'G4', midi: 67 },
    { name: 'C5', midi: 72 },
    { name: 'E5', midi: 76 },
    { name: 'G5', midi: 79 },
    { name: 'C6', midi: 84 },
    { name: 'G6', midi: 91 },
    { name: 'C7', midi: 96 },
  ];

  public initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(14, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.2, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.1, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.preloadSamples();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  public async preloadSamples() {
    if (typeof window === 'undefined') return;
    this.initContext();
    if (this.isLoaded || !this.ctx) return;

    try {
      await Promise.all(
        this.anchorNotes.map(async (anchor) => {
          try {
            const url = `${this.sampleBaseUrl}/${anchor.name}.mp3`;
            const res = await fetch(url);
            if (!res.ok) return;
            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
            this.sampleCache.set(anchor.name, audioBuffer);
          } catch (e) {
            console.warn(`Error precargando muestra: ${anchor.name}`, e);
          }
        })
      );
      this.isLoaded = true;
    } catch (err) {
      console.error('Error banco piano:', err);
    }
  }

  private findClosestAnchor(midi: number): { name: string; midi: number } {
    let closest = this.anchorNotes[0];
    let minDiff = Math.abs(midi - closest.midi);

    for (const anchor of this.anchorNotes) {
      const diff = Math.abs(midi - anchor.midi);
      if (diff < minDiff) {
        minDiff = diff;
        closest = anchor;
      }
    }
    return closest;
  }

  /**
   * Control Dinámico del Pedal de Sustain (Damper Pedal CC 64)
   * Admite pedaleo sincopado continuo
   */
  public setSustain(active: boolean) {
    this.isSustainActive = active;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Al liberar el pedal, apagar únicamente las notas cuyas teclas ya no están pulsadas con los dedos
    if (!active) {
      this.activeVoices.forEach((voices) => {
        voices.forEach((voice) => {
          if (!voice.isKeyHeld) {
            this.dampVoice(voice, now);
          }
        });
      });

      // Limpiar voces que fueron apagadas
      this.activeVoices.forEach((voices, midi) => {
        const remaining = voices.filter((v) => v.isKeyHeld);
        if (remaining.length > 0) {
          this.activeVoices.set(midi, remaining);
        } else {
          this.activeVoices.delete(midi);
        }
      });
    }
  }

  public getSustain(): boolean {
    return this.isSustainActive;
  }

  /**
   * Caída suave del apagador de fieltro (felt damper decay)
   */
  private dampVoice(voice: ActivePianoVoice, time: number) {
    try {
      voice.gainNode.gain.cancelScheduledValues(time);
      voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, time);
      // Apagado natural de cuerda de piano: 220 ms
      voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

      setTimeout(() => {
        try {
          voice.source.stop();
        } catch (e) {}
      }, 250);
    } catch (e) {}
  }

  /**
   * Liberación de tecla física (Note-Off)
   */
  public noteOff(midi: number) {
    if (!this.ctx) return;
    const voices = this.activeVoices.get(midi);
    if (!voices || voices.length === 0) return;

    const now = this.ctx.currentTime;

    voices.forEach((voice) => {
      voice.isKeyHeld = false;

      // Si el pedal de sustain NO está activo, la cuerda se apaga de inmediato
      if (!this.isSustainActive) {
        this.dampVoice(voice, now);
      }
      // Si el sustain SÍ está activo, la nota no se toca y sigue resonando libremente
    });

    if (!this.isSustainActive) {
      this.activeVoices.delete(midi);
    }
  }

  /**
   * Disparo de Nota Acústica Real (Note-On)
   * Sin corte programado: resuena con la física natural de la muestra
   */
  public playNote(
    midi: number,
    _unusedDuration: number = 2.0,
    velocity: number = 95,
    scheduleTime?: number
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now =
      scheduleTime !== undefined
        ? Math.max(this.ctx.currentTime, scheduleTime)
        : this.ctx.currentTime;
    const anchor = this.findClosestAnchor(midi);
    let buffer = this.sampleCache.get(anchor.name);

    if (!buffer) {
      buffer = this.sampleCache.get('C4');
      if (!buffer) {
        this.preloadSamples();
        return;
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Afinación precisa basada en la distancia de semitonos
    const semitoneDistance = midi - anchor.midi;
    const playbackRate = Math.pow(2, semitoneDistance / 12);
    source.playbackRate.setValueAtTime(playbackRate, now);

    const gainNode = this.ctx.createGain();
    const velNorm = Math.min(1.3, Math.max(0.2, velocity / 100));

    // Curva acústica: ataque en 3 ms, cuerpo en resonancia prolongada
    const peakGain = 1.05 * velNorm;
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.003);

    // Decaimiento natural y prolongado de la madera (12 segundos)
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.75, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.45, now + 2.5);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 12.0);

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // NO programar source.stop() prematuro. La muestra resuena libremente
    source.start(now);
    source.stop(now + 12.5);

    const voice: ActivePianoVoice = {
      midi,
      source,
      gainNode,
      isKeyHeld: true,
      startTime: now,
    };

    const currentVoices = this.activeVoices.get(midi) || [];
    this.activeVoices.set(midi, [...currentVoices, voice]);
  }

  public playChord(
    midis: number[],
    duration: number = 2.0,
    velocity: number = 95,
    scheduleTime?: number
  ) {
    if (!midis || midis.length === 0) return;
    midis.forEach((m) => this.playNote(m, duration, velocity, scheduleTime));
  }
}

export const pianoPreviewSynth = new SampledPianoSynth();
