export type InstrumentKey = 'drums' | 'bass' | 'guitar' | 'piano';

export function normalizeInstrumentKey(
  rawInstrument?: string | null,
  fallback: InstrumentKey = 'drums'
): InstrumentKey {
  if (!rawInstrument) return fallback;
  const clean = rawInstrument.toLowerCase().trim();

  if (clean.includes('drum') || clean.includes('bater')) return 'drums';
  if (clean.includes('bass') || clean.includes('bajo')) return 'bass';
  if (clean.includes('guitar') || clean.includes('cuerda')) return 'guitar';
  if (clean.includes('piano') || clean.includes('tecl') || clean.includes('key')) return 'piano';

  return fallback;
}
