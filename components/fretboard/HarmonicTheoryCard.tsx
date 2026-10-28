'use client';

import React from 'react';
import { ChordTheoryAccordion } from './ChordTheoryAccordion';
import { StudyMode } from './FretboardToolbar';
import { InstrumentType, ChordKey, ScaleKey } from '@/lib/music-theory/fretboard';

interface HarmonicTheoryCardProps {
  studyMode: StudyMode;
  instrument: InstrumentType;
  rootNote: string;
  chordKey: ChordKey;
  scaleKey: ScaleKey;
  selectedProgressionId: string;
  currentProgressionStepIndex: number;
}

export const HarmonicTheoryCard: React.FC<HarmonicTheoryCardProps> = (props) => {
  return <ChordTheoryAccordion {...props} />;
};

export default HarmonicTheoryCard;
