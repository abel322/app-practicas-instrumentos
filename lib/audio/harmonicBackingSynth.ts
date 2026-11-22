// ============================================================================
// MOTOR DE ACOMPAÑAMIENTO ARMÓNICO (🎹 Base Armónica - SoundLab Strings Lab)
// Síntesis Web Audio de alta fidelidad: Pad / Electric Piano cálido
// Volumen optimizado (~0.14) para colchón armónico suave sin tapar la guitarra
// ============================================================================

import { midiToFrequency } from '@/lib/music-theory/fretboard';

const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'E#': 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

/**
 * Convierte un cifrado (ej: "G7", "Cmaj7", "Am7", "Cadd9", "G/B", "E7b9", "Dm9")
 * a una disposición de notas MIDI equilibrada (voicing cerrado/abierto entre octavas 2 y 4).
 */
export function parseChordSymbolToMidis(chordSymbol: string): number[] {
  if (!chordSymbol || typeof chordSymbol !== 'string') return [48, 55, 60, 64]; // C mayor por defecto

  const clean = chordSymbol.trim();
  const slashParts = clean.split('/');
  const mainPart = slashParts[0].trim();
  const bassPart = slashParts[1] ? slashParts[1].trim() : null;

  // Extraer nota raíz (ej: "G", "C#", "Bb")
  const rootMatch = mainPart.match(/^([A-G][#b♯♭]?)/);
  if (!rootMatch) return [48, 52, 55, 60];

  const rootName = rootMatch[1].replace('♯', '#').replace('♭', 'b');
  const pitchClass = NOTE_TO_PITCH_CLASS[rootName] ?? 0;
  const quality = mainPart.substring(rootMatch[0].length).toLowerCase();

  // Elegir fórmula de intervalos según cualidad
  let intervals: number[] = [0, 4, 7]; // Mayor por defecto

  if (quality.includes('m7b5') || quality.includes('ø') || quality.includes('semidis')) {
    intervals = [0, 3, 6, 10]; // Semidisminuido
  } else if (quality.includes('dim7') || quality.includes('°7') || quality.includes('dis7')) {
    intervals = [0, 3, 6, 9]; // Disminuido 7
  } else if (quality.includes('dim') || quality.includes('°')) {
    intervals = [0, 3, 6]; // Tríada disminuida
  } else if (quality.includes('maj9') || quality.includes('ma9') || quality.includes('Δ9')) {
    intervals = [0, 4, 7, 11, 14]; // Maj9
  } else if (quality.includes('maj7') || quality.includes('ma7') || quality.includes('Δ')) {
    intervals = [0, 4, 7, 11]; // Maj7
  } else if (quality.includes('m9') || quality.includes('min9') || quality.includes('-9')) {
    intervals = [0, 3, 7, 10, 14]; // m9
  } else if (quality.includes('m7') || quality.includes('min7') || quality.includes('-7')) {
    intervals = [0, 3, 7, 10]; // m7
  } else if (quality.includes('m11') || quality.includes('min11')) {
    intervals = [0, 3, 7, 10, 14, 17]; // m11
  } else if (quality.includes('m') || quality.includes('min') || quality.includes('-')) {
    intervals = [0, 3, 7]; // Tríada menor
  } else if (quality.includes('13#11') || quality.includes('13(#11)')) {
    intervals = [0, 4, 10, 14, 18, 21]; // Dominante 13 (#11)
  } else if (quality.includes('13')) {
    intervals = [0, 4, 10, 14, 21]; // Dominante 13
  } else if (quality.includes('7b9') || quality.includes('7(b9)')) {
    intervals = [0, 4, 7, 10, 13]; // Dominante 7b9
  } else if (quality.includes('7#9') || quality.includes('7(#9)')) {
    intervals = [0, 4, 7, 10, 15]; // Dominante 7#9
  } else if (quality.includes('7alt') || quality.includes('alt')) {
    intervals = [0, 4, 10, 13, 15]; // Dominante alterado
  } else if (quality.includes('9')) {
    intervals = [0, 4, 7, 10, 14]; // Dominante 9
  } else if (quality.includes('7')) {
    intervals = [0, 4, 7, 10]; // Dominante 7
  } else if (quality.includes('add9')) {
    intervals = [0, 4, 7, 14]; // Add9
  } else if (quality.includes('sus4')) {
    intervals = [0, 5, 7]; // Sus4
  } else if (quality.includes('sus2')) {
    intervals = [0, 2, 7]; // Sus2
  } else if (quality.includes('6')) {
    intervals = [0, 4, 7, 9]; // 6
  }

  // Base octava 2 o 3 para bajo profundo y cuerpo cálido
  // Tónica de bajo entre MIDI 36 (C2) y 47 (B2)
  const baseBassMidi = 36 + pitchClass;
  // Acorde medio en octava 3/4 (entre 48 y 72)
  const midis: number[] = [];

  // Si hay nota de bajo explícita (ej: G/B)
  if (bassPart) {
    const bassMatch = bassPart.match(/^([A-G][#b♯♭]?)/);
    if (bassMatch) {
      const bName = bassMatch[1].replace('♯', '#').replace('♭', 'b');
      const bPitch = NOTE_TO_PITCH_CLASS[bName] ?? pitchClass;
      midis.push(36 + bPitch);
    } else {
      midis.push(baseBassMidi);
    }
  } else {
    midis.push(baseBassMidi);
  }

  // Voces superiores distribuidas armónicamente
  intervals.forEach((iv, idx) => {
    // Si es la tónica (iv === 0) y ya la tenemos en el bajo, la agregamos en octava 3 o 4
    if (iv === 0) {
      if (idx === 0) {
        midis.push(48 + pitchClass);
      }
    } else {
      // Disponer los intervalos en el registro medio cálido
      let noteMidi = 48 + pitchClass + iv;
      while (noteMidi > 76) {
        noteMidi -= 12;
      }
      while (noteMidi < 48) {
        noteMidi += 12;
      }
      if (!midis.includes(noteMidi)) {
        midis.push(noteMidi);
      }
    }
  });

  // Ordenar notas de grave a agudo
  midis.sort((a, b) => a - b);
  return midis;
}

export class HarmonicBackingSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeVoices: { stop: (time: number) => void }[] = [];
  private baseVolume: number = 0.14; // Nivel cálido y equilibrado para no tapar la guitarra

  constructor() {}

  public init(existingContext?: AudioContext | null) {
    if (this.ctx && this.ctx.state !== 'closed') return;

    if (existingContext) {
      this.ctx = existingContext;
    } else {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
    }

    // Compresor suave para unificar la dinámica del colchón armónico
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.baseVolume, this.ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  public setVolume(vol: number) {
    this.baseVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.baseVolume, this.ctx.currentTime, 0.05);
    }
  }

  public stopAllVoices(fadeDurationSec: number = 0.15) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const stopTime = now + fadeDurationSec;
    this.activeVoices.forEach((v) => {
      try {
        v.stop(stopTime);
      } catch {}
    });
    this.activeVoices = [];
  }

  /**
   * Toca un acorde de acompañamiento con sonido cálido (Pad / Electric Piano)
   * @param chordSymbol Cifrado armónico (ej. "G7", "Cmaj7", "Am7")
   * @param durationSec Duración del compás en segundos
   * @param scheduleTime Tiempo de agendado Web Audio (opcional)
   * @param customVolume Volumen personalizado (opcional, por defecto ~0.14)
   */
  public playChord(
    chordSymbol: string,
    durationSec: number = 2.0,
    scheduleTime?: number,
    customVolume?: number
  ) {
    if (!chordSymbol) return;

    if (!this.ctx || this.ctx.state === 'closed') {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ctx || !this.compressor || !this.masterGain) return;

    const startTime = scheduleTime !== undefined ? scheduleTime : this.ctx.currentTime;
    const effectiveDur = Math.max(0.6, durationSec);

    // Desvanecer voces anteriores con transición suave (crossfade de 120ms)
    const prevVoices = this.activeVoices;
    prevVoices.forEach((v) => {
      try {
        v.stop(startTime + 0.08);
      } catch {}
    });
    this.activeVoices = [];

    const midis = parseChordSymbolToMidis(chordSymbol);
    const newVoices: { stop: (time: number) => void }[] = [];

    // Nivel por voz según número de notas para no sobrecargar
    const voiceCount = Math.max(1, midis.length);
    const noteGainLevel = (customVolume ?? this.baseVolume) * (0.9 / Math.sqrt(voiceCount));

    midis.forEach((midi, idx) => {
      if (!this.ctx || !this.compressor) return;
      const freq = midiToFrequency(midi);
      const isBass = midi < 48;

      // Oscilador 1: Onda triangular pura (cuerpo acústico redondeado)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);
      // Sutil desafinación analógica (-2 cents)
      osc1.detune.setValueAtTime(-2.2, startTime);

      // Oscilador 2: Onda senoidal suave (+2.2 cents) para generar amplitud cálida
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq, startTime);
      osc2.detune.setValueAtTime(+2.2, startTime);

      // Filtro Lowpass cálido (1200 Hz - 1800 Hz) con caída suave
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const cutoff = isBass ? 650 : Math.min(1800, freq * 3.5);
      filter.frequency.setValueAtTime(cutoff * 1.3, startTime);
      filter.frequency.exponentialRampToValueAtTime(cutoff, startTime + 0.35);
      filter.Q.setValueAtTime(1.2, startTime);

      // Envolvente de Ganancia: Ataque suave (40ms), sostenido continuo y release suave
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, startTime);
      // Ataque dulce
      gainNode.gain.linearRampToValueAtTime(noteGainLevel, startTime + 0.05);
      // Sostenido a lo largo del compás
      gainNode.gain.setValueAtTime(noteGainLevel * 0.9, startTime + effectiveDur * 0.7);
      // Caída al final del compás
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + effectiveDur);

      // Conexiones
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.compressor);

      osc1.start(startTime);
      osc2.start(startTime);

      const endTime = startTime + effectiveDur + 0.1;
      osc1.stop(endTime);
      osc2.stop(endTime);

      newVoices.push({
        stop: (stopT: number) => {
          try {
            if (this.ctx && stopT > this.ctx.currentTime) {
              gainNode.gain.cancelScheduledValues(stopT);
              gainNode.gain.setValueAtTime(gainNode.gain.value, stopT);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, stopT + 0.08);
              osc1.stop(stopT + 0.09);
              osc2.stop(stopT + 0.09);
            }
          } catch {}
        },
      });
    });

    this.activeVoices = newVoices;
  }
}

// Singleton global
let globalHarmonicBacking: HarmonicBackingSynth | null = null;

export function getHarmonicBackingSynth(): HarmonicBackingSynth {
  if (typeof window === 'undefined') {
    return new HarmonicBackingSynth();
  }
  if (!globalHarmonicBacking) {
    globalHarmonicBacking = new HarmonicBackingSynth();
  }
  return globalHarmonicBacking;
}
