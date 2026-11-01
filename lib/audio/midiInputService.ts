export type MidiNoteCallback = (
  noteNumber: number,
  noteName: string,
  velocity: number,
  isNoteOn: boolean
) => void;

export type MidiDeviceChangeCallback = (deviceName: string | null) => void;

class MidiInputService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private midiAccess: any = null;
  private listeners: MidiNoteCallback[] = [];
  private deviceListeners: MidiDeviceChangeCallback[] = [];
  public connectedDeviceName: string | null = null;
  public isSupported: boolean = false;

  public async initialize(): Promise<boolean> {
    if (typeof window === 'undefined' || !('requestMIDIAccess' in navigator)) {
      console.warn('Web MIDI API no soportada en este navegador');
      this.isSupported = false;
      return false;
    }

    try {
      this.isSupported = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.midiAccess = await (navigator as any).requestMIDIAccess();
      this.setupInputs();
      this.midiAccess.onstatechange = () => this.setupInputs();
      return true;
    } catch (err) {
      console.error('Error al inicializar Web MIDI:', err);
      return false;
    }
  }

  private setupInputs() {
    if (!this.midiAccess) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputs = Array.from(this.midiAccess.inputs.values()) as any[];
    if (inputs.length > 0) {
      this.connectedDeviceName = inputs[0].name || 'Dispositivo MIDI USB';
      inputs.forEach((input) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input.onmidimessage = (msg: any) => this.handleMidiMessage(msg);
      });
    } else {
      this.connectedDeviceName = null;
    }

    // Notificar a observadores de dispositivos
    this.deviceListeners.forEach((cb) => cb(this.connectedDeviceName));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMidiMessage(event: any) {
    if (!event || !event.data) return;
    const [status, noteNumber, velocity] = event.data;
    const command = status >> 4;
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = `${NOTE_NAMES[noteNumber % 12]}${Math.floor(noteNumber / 12) - 1}`;

    if (command === 9 && velocity > 0) {
      // Note ON
      this.listeners.forEach((cb) => cb(noteNumber, noteName, velocity, true));
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      // Note OFF
      this.listeners.forEach((cb) => cb(noteNumber, noteName, 0, false));
    }
  }

  public subscribe(cb: MidiNoteCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public onDeviceChange(cb: MidiDeviceChangeCallback) {
    this.deviceListeners.push(cb);
    // Emitir estado actual inmediatamente
    cb(this.connectedDeviceName);
    return () => {
      this.deviceListeners = this.deviceListeners.filter((l) => l !== cb);
    };
  }
}

export const midiInputService = new MidiInputService();

