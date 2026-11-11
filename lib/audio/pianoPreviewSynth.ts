// lib/audio/pianoPreviewSynth.ts
// Motor de Piano Acústico de Cola basado en Muestras Reales (Soundfonts FluidR3 / Steinway)

interface PianoVoice {
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
  private activeVoices: Map<number, PianoVoice[]> = new Map();
  private isSustainActive: boolean = false;

  // Anclas de afinación cromática real para cubrir todo el teclado con máxima fidelidad
  private sampleBaseUrl =
    'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3';

  // Nodos de muestra estratégicos para cada octava y terceras (cero desfase ni estiramiento artificial)
  private anchorNotes: { name: string; midi: number }[] = [
    { name: 'C1', midi: 24 },
    { name: 'G1', midi: 31 },
    { name: 'C2', midi: 36 },
    { name: 'E2', midi: 40 },
    { name: 'G2', midi: 43 },
    { name: 'C3', midi: 48 },
    { name: 'E3', midi: 52 },
    { name: 'G3', midi: 55 },
    { name: 'C4', midi: 60 }, // Do Central
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

      // Compresor de master cálido para empastar acordes y resonancias
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.15, this.ctx.currentTime);

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
            console.warn(`Error precargando muestra de piano: ${anchor.name}`, e);
          }
        })
      );
      this.isLoaded = true;
    } catch (err) {
      console.error('Error inicializando banco de piano acústico:', err);
    }
  }

  // Encuentra la muestra más cercana para mantener el timbre acústico intacto
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

  public setSustain(active: boolean) {
    this.isSustainActive = active;

    // Si se levanta el pedal de sustain, apagar todas las cuerdas cuyas teclas ya no estén presionadas
    if (!active && this.ctx) {
      const now = this.ctx.currentTime;
      this.activeVoices.forEach((voices) => {
        voices.forEach((voice) => {
          if (!voice.isKeyHeld) {
            this.silenceVoice(voice, now);
          }
        });
      });
      this.activeVoices.forEach((voices, midi) => {
        this.activeVoices.set(
          midi,
          voices.filter((v) => v.isKeyHeld)
        );
      });
    }
  }

  private silenceVoice(voice: PianoVoice, time: number) {
    try {
      // Atenuación natural de los apagadores de fieltro del piano (120ms)
      voice.gainNode.gain.cancelScheduledValues(time);
      voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, time);
      voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      setTimeout(() => {
        try {
          voice.source.stop();
        } catch (e) {}
      }, 140);
    } catch (e) {}
  }

  public noteOff(midi: number) {
    if (!this.ctx) return;
    const voices = this.activeVoices.get(midi);
    if (!voices || voices.length === 0) return;

    const now = this.ctx.currentTime;

    voices.forEach((voice) => {
      voice.isKeyHeld = false;
      // Si el pedal de sustain no está pisado, apagar la cuerda
      if (!this.isSustainActive) {
        this.silenceVoice(voice, now);
      }
    });

    if (!this.isSustainActive) {
      this.activeVoices.delete(midi);
    }
  }

  public playNote(
    midi: number,
    duration: number = 1.6,
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
      // Respaldo de emergencia si aún se están descargando las anclas
      buffer = this.sampleCache.get('C4');
      if (!buffer) {
        this.preloadSamples();
        return;
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Cálculo milimétrico de velocidad de reproducción según semitonos de distancia
    const semitoneDistance = midi - anchor.midi;
    const playbackRate = Math.pow(2, semitoneDistance / 12);
    source.playbackRate.setValueAtTime(playbackRate, now);

    const gainNode = this.ctx.createGain();
    const velNormalized = Math.min(1.25, Math.max(0.15, velocity / 100));

    // Curva acústica de volumen: impacto inmediato de martillo y caída armónica larga
    const initialPeak = 1.1 * velNormalized;
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(initialPeak, now + 0.003); // Ataque percusivo en 3ms

    // Resonancia natural de piano de cola:
    // La cuerda vibra libremente; si el sustain está encendido se expande la resonancia
    const decayDuration = this.isSustainActive ? Math.max(duration * 2.2, 3.5) : duration;
    gainNode.gain.exponentialRampToValueAtTime(initialPeak * 0.72, now + 0.18);
    gainNode.gain.exponentialRampToValueAtTime(initialPeak * 0.45, now + 0.7);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(now);
    source.stop(now + decayDuration + 0.08);

    const voice: PianoVoice = {
      midi,
      source,
      gainNode,
      isKeyHeld: true,
      startTime: now,
    };

    const currentList = this.activeVoices.get(midi) || [];
    this.activeVoices.set(midi, [...currentList, voice]);
  }

  // Reproducción polifónica de acordes sin cancelación de fases
  public playChord(
    midis: number[],
    duration: number = 1.6,
    velocity: number = 95,
    scheduleTime?: number
  ) {
    if (!midis || midis.length === 0) return;
    midis.forEach((midi) => {
      this.playNote(midi, duration, velocity, scheduleTime);
    });
  }
}

export const pianoPreviewSynth = new SampledPianoSynth();
