import { useEffect, useState, useRef, useCallback } from 'react';
import { pianoPreviewSynth } from '@/lib/audio/pianoPreviewSynth';

export interface MidiDeviceState {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  error: string | null;
}

export function useWebMidi(
  onNoteOn?: (midiNumber: number, velocity: number) => void,
  onNoteOff?: (midiNumber: number) => void,
  onControlChange?: (controller: number, value: number) => void
) {
  const [midiState, setMidiState] = useState<MidiDeviceState>({
    isSupported: true,
    isConnected: false,
    deviceName: null,
    error: null,
  });

  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  const onControlChangeRef = useRef(onControlChange);

  useEffect(() => {
    onNoteOnRef.current = onNoteOn;
  }, [onNoteOn]);

  useEffect(() => {
    onNoteOffRef.current = onNoteOff;
  }, [onNoteOff]);

  useEffect(() => {
    onControlChangeRef.current = onControlChange;
  }, [onControlChange]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const midiAccessRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMidiMessage = useCallback((event: any) => {
    if (!event || !event.data) return;
    const [status, noteNumber, velocity] = event.data;
    const command = status >> 4;

    // Comando 9 = Note On con velocidad > 0
    if (command === 9 && velocity > 0) {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(noteNumber);
        return next;
      });
      if (onNoteOnRef.current) {
        onNoteOnRef.current(noteNumber, velocity);
      }
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      // Note Off
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteNumber);
        return next;
      });
      if (onNoteOffRef.current) {
        onNoteOffRef.current(noteNumber);
      }
    } else if (command === 11) {
      // Control Change (CC)
      if (onControlChangeRef.current) {
        onControlChangeRef.current(noteNumber, velocity);
      } else if (noteNumber === 64) {
        // Fallback predeterminado para CC 64 (Sustain / Damper)
        pianoPreviewSynth.setSustain(velocity >= 64);
      }
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setupMidiInputs = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (midiAccess: any) => {
      midiAccessRef.current = midiAccess;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputs = Array.from(midiAccess.inputs.values()) as any[];

      if (inputs.length > 0) {
        const primaryInput = inputs[0];
        setMidiState({
          isSupported: true,
          isConnected: true,
          deviceName: primaryInput.name || 'Teclado MIDI USB',
          error: null,
        });

        // Asignar el listener de mensajes a todos los puertos de entrada detectados
        inputs.forEach((input) => {
          input.onmidimessage = handleMidiMessage;
        });
      } else {
        setMidiState({
          isSupported: true,
          isConnected: false,
          deviceName: null,
          error: null,
        });
      }

      // Escuchar conexión o desconexión física de cables USB en caliente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      midiAccess.onstatechange = (_e: any) => {
        setupMidiInputs(midiAccess);
      };
    },
    [handleMidiMessage]
  );

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('requestMIDIAccess' in navigator) ||
      typeof navigator.requestMIDIAccess !== 'function'
    ) {
      setMidiState((prev) => ({
        ...prev,
        isSupported: false,
        error: 'Web MIDI no soportado en este navegador',
      }));
      return;
    }

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((midiAccess) => {
        setupMidiInputs(midiAccess);
      })
      .catch((err) => {
        console.warn('Acceso MIDI denegado o no disponible:', err);
        setMidiState((prev) => ({
          ...prev,
          isConnected: false,
          error: 'Permiso MIDI denegado',
        }));
      });

    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Array.from(midiAccessRef.current.inputs.values()).forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [setupMidiInputs]);

  const requestMidiAgain = async () => {
    if (
      typeof window !== 'undefined' &&
      'requestMIDIAccess' in navigator &&
      typeof navigator.requestMIDIAccess === 'function'
    ) {
      try {
        const access = await navigator.requestMIDIAccess({ sysex: false });
        setupMidiInputs(access);
      } catch (e) {
        console.error('Error al solicitar acceso MIDI:', e);
        setMidiState((prev) => ({
          ...prev,
          isConnected: false,
          error: 'Permiso MIDI denegado',
        }));
      }
    }
  };

  return { midiState, requestMidiAgain, activeNotes };
}

