export type MidiEventCallback = (
  activeNotes: Set<number>,
  lastNote: { noteNumber: number; velocity: number; isNoteOn: boolean }
) => void;

export type MidiDeviceChangeCallback = (deviceName: string | null) => void;

class MidiInputService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private midiAccess: any = null;
  private listeners: MidiEventCallback[] = [];
  private deviceListeners: MidiDeviceChangeCallback[] = [];
  public connectedDeviceName: string | null = null;
  public currentlyHeldNotes: Set<number> = new Set();
  public isSupported: boolean = false;

  public async initialize(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.requestMIDIAccess) {
      console.warn('Web MIDI API no soportada en este entorno');
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
      console.error('Error al conectar Web MIDI:', err);
      return false;
    }
  }

  private setupInputs() {
    if (!this.midiAccess) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputs = Array.from(this.midiAccess.inputs.values()) as any[];
    if (inputs.length > 0) {
      this.connectedDeviceName = inputs[0].name || 'Dispositivo MIDI';
      inputs.forEach((input) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input.onmidimessage = (msg: any) => this.handleMidiMessage(msg);
      });
    } else {
      this.connectedDeviceName = null;
    }

    this.deviceListeners.forEach((cb) => cb(this.connectedDeviceName));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMidiMessage(event: any) {
    if (!event || !event.data) return;
    const [status, noteNumber, velocity] = event.data;
    const command = status >> 4;

    if (command === 9 && velocity > 0) {
      this.currentlyHeldNotes.add(noteNumber);
      this.notifyListeners({ noteNumber, velocity, isNoteOn: true });
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      this.currentlyHeldNotes.delete(noteNumber);
      this.notifyListeners({ noteNumber, velocity: 0, isNoteOn: false });
    }
  }

  private notifyListeners(lastNote: { noteNumber: number; velocity: number; isNoteOn: boolean }) {
    this.listeners.forEach((cb) => cb(new Set(this.currentlyHeldNotes), lastNote));
  }

  public subscribe(cb: MidiEventCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public onDeviceChange(cb: MidiDeviceChangeCallback) {
    this.deviceListeners.push(cb);
    cb(this.connectedDeviceName);
    return () => {
      this.deviceListeners = this.deviceListeners.filter((l) => l !== cb);
    };
  }
}

export const midiInputService = new MidiInputService();
