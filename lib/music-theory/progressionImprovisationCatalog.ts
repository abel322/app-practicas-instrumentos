import {
  CHROMATIC_NOTES,
  ChromaticNote,
  ChordKey,
  ScaleKey,
  SCALES_CATALOG,
  CHORDS_CATALOG,
} from './fretboard';

export interface ChordImprovisationGuide {
  chordName: string;            // ej: "Dm7"
  chordRoot: ChromaticNote;     // ej: "D"
  degreeRoman: string;          // ej: "ii7"
  chordTones: string[];         // ej: ["D", "F", "A", "C"]
  primaryMode: {
    name: string;               // ej: "D Dórico"
    scaleKey: ScaleKey;         // ej: "dorian"
    scaleNotes: string[];       // ej: ["D", "E", "F", "G", "A", "B", "C"]
    description: string;        // ej: "Sonido clásico de jazz y worship menor con 6ª mayor natural."
  };
  alternativeOptions: {
    name: string;               // ej: "Pentatónica Menor de D"
    scaleNotes: string[];
  }[];
}

function buildScaleNotes(root: ChromaticNote, intervals: number[]): string[] {
  const rootIdx = CHROMATIC_NOTES.indexOf(root);
  if (rootIdx === -1) return [];
  return intervals.map((semitones) => CHROMATIC_NOTES[(rootIdx + semitones) % 12]);
}

function extractRootFromSymbol(chordSymbol: string, fallbackRoot: string): ChromaticNote {
  const match = chordSymbol.match(/^([A-G]#?)/);
  if (match && CHROMATIC_NOTES.includes(match[1] as ChromaticNote)) {
    return match[1] as ChromaticNote;
  }
  return (CHROMATIC_NOTES.includes(fallbackRoot as ChromaticNote) ? fallbackRoot : 'C') as ChromaticNote;
}

function inferChordKey(chordSymbol: string, degreeLabel: string): ChordKey {
  if (chordSymbol.endsWith('m7b5') || degreeLabel.includes('ø')) return 'm7b5';
  if (chordSymbol.endsWith('dim7') || degreeLabel.includes('°')) return 'dim7';
  if (chordSymbol.endsWith('maj7') || degreeLabel.includes('maj7')) return 'maj7';
  if (chordSymbol.endsWith('m7') || /^(ii|iii|vi)7/.test(degreeLabel)) return 'm7';
  if (chordSymbol.endsWith('7') || degreeLabel.endsWith('7')) return 'dom7';
  if (chordSymbol.endsWith('m') || /^(ii|iii|vi)$/.test(degreeLabel)) return 'minor';
  return 'major';
}

export function getImprovisationGuide(
  keyRoot: string,
  chordSymbol: string,
  degreeLabel: string
): ChordImprovisationGuide {
  const chordRoot = extractRootFromSymbol(chordSymbol, keyRoot);
  const chordKey = inferChordKey(chordSymbol, degreeLabel);
  const chordFormula = CHORDS_CATALOG[chordKey]?.formula || [0, 4, 7];
  const chordTones = buildScaleNotes(chordRoot, chordFormula);

  const normalizedRoman = degreeLabel.trim();

  // Determinación del modo canónico según el grado armónico
  let scaleKey: ScaleKey = 'major';
  let modeLabel = `${chordRoot} Jónico (Mayor)`;
  let description =
    'Modo mayor luminoso y estable; enfatiza la 3ª mayor y 7ª mayor en resoluciones.';
  let alternatives: { name: string; scaleNotes: string[] }[] = [];

  if (/^ii/i.test(normalizedRoman)) {
    scaleKey = 'dorian';
    modeLabel = `${chordRoot} Dórico`;
    description = 'Sonido clásico de jazz y worship menor con 6ª mayor natural.';
    alternatives = [
      {
        name: `Pentatónica Menor de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.pentatonic_minor.intervals),
      },
      {
        name: `Escala de Blues de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.blues.intervals),
      },
    ];
  } else if (/^V/i.test(normalizedRoman)) {
    scaleKey = 'mixolydian';
    modeLabel = `${chordRoot} Mixolidio`;
    description =
      'Modo dominante con 7ª menor que impulsa la tensión cadencial hacia la tónica.';
    alternatives = [
      {
        name: `Pentatónica Mayor de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.pentatonic_major.intervals),
      },
      {
        name: `Blues Dominante de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.blues.intervals),
      },
    ];
  } else if (/^vi/i.test(normalizedRoman)) {
    scaleKey = 'minor_natural';
    modeLabel = `${chordRoot} Eólico (Menor Natural)`;
    description = 'Relativo menor expresivo y lírico; conecta con fluidez hacia el ii7 o IV.';
    alternatives = [
      {
        name: `Pentatónica Menor de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.pentatonic_minor.intervals),
      },
    ];
  } else if (/^IV/i.test(normalizedRoman)) {
    if (normalizedRoman.includes('7') && !normalizedRoman.includes('maj7')) {
      scaleKey = 'mixolydian';
      modeLabel = `${chordRoot} Mixolidio (Blues IV7)`;
      description = 'Subdominante dominante de Blues con 7ª menor característica.';
      alternatives = [
        {
          name: `Escala de Blues de ${chordRoot}`,
          scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.blues.intervals),
        },
      ];
    } else {
      scaleKey = 'lydian';
      modeLabel = `${chordRoot} Lidio`;
      description = 'Sonoridad abierta y moderna con 4ª aumentada (#11) sin notas evitadas.';
      alternatives = [
        {
          name: `Pentatónica Mayor de ${chordRoot}`,
          scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.pentatonic_major.intervals),
        },
      ];
    }
  } else if (/^iii/i.test(normalizedRoman)) {
    scaleKey = 'phrygian';
    modeLabel = `${chordRoot} Frigio`;
    description = 'Color modal con 2ª menor; funciona como sustituto expresivo de la tónica.';
    alternatives = [
      {
        name: `Pentatónica Menor de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.pentatonic_minor.intervals),
      },
    ];
  } else if (/^I7$/i.test(normalizedRoman)) {
    scaleKey = 'mixolydian';
    modeLabel = `${chordRoot} Mixolidio / Blues`;
    description = 'Tónica dominante de Blues; combina la 3ª mayor del acorde con fraseo Blues.';
    alternatives = [
      {
        name: `Escala de Blues de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.blues.intervals),
      },
      {
        name: `Pentatónica Menor de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.pentatonic_minor.intervals),
      },
    ];
  } else {
    // I / Imaj7 por defecto
    scaleKey = 'major';
    modeLabel = `${chordRoot} Jónico (Mayor)`;
    description =
      'Modo mayor estable de resolución tonal; aterriza frases sobre la 3ª (E) y 7ª mayor (B).';
    alternatives = [
      {
        name: `${chordRoot} Lidio (Color Moderno #11)`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.lydian.intervals),
      },
      {
        name: `Pentatónica Mayor de ${chordRoot}`,
        scaleNotes: buildScaleNotes(chordRoot, SCALES_CATALOG.pentatonic_major.intervals),
      },
    ];
  }

  const scaleNotes = buildScaleNotes(chordRoot, SCALES_CATALOG[scaleKey].intervals);

  return {
    chordName: chordSymbol,
    chordRoot,
    degreeRoman: degreeLabel,
    chordTones,
    primaryMode: {
      name: modeLabel,
      scaleKey,
      scaleNotes,
      description,
    },
    alternativeOptions: alternatives,
  };
}
