// Sintetizador Polifónico Ultraligero para Pre-Escucha Inmediata de Notas (Web Audio API)

class PianoPreviewSynth {
  private ctx: AudioContext | null = null;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Reproduce instantáneamente una nota musical MIDI con envolvente natural de piano (300-400 ms)
   */
  public playNote(midiNumber: number, duration: number = 0.35, velocity: number = 90) {
    if (typeof window === 'undefined') return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Conversión MIDI a Frecuencia (Hz)
      const freq = 440 * Math.pow(2, (midiNumber - 69) / 12);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Segundo oscilador con armónico sutil para emular el brillo de la cuerda de piano
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2, now);

      // Envolvente de ataque ultra-rápido y decaimiento exponencial natural (Decay)
      const baseVolume = (velocity / 127) * 0.28;
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(baseVolume, now + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gainNode);
      oscHarmonic.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      oscHarmonic.start(now);

      osc.stop(now + duration);
      oscHarmonic.stop(now + duration);

      // Desconexión limpia de nodos de audio
      setTimeout(() => {
        try {
          osc.disconnect();
          oscHarmonic.disconnect();
          gainNode.disconnect();
        } catch {
          // Ya desconectado
        }
      }, (duration + 0.1) * 1000);
    } catch (err) {
      console.warn('Error en pianoPreviewSynth.playNote:', err);
    }
  }
}

export const pianoPreviewSynth = new PianoPreviewSynth();

