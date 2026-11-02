'use client';

import React from 'react';
import { TablatureRunway, TablatureRunwayProps } from './TablatureRunway';

export interface TablatureCanvasProps extends TablatureRunwayProps {
  currentStep?: number;
  stepsPerMeasure?: number;
  activeMeasureIndex?: number;
  totalMeasures?: number;
  subdivision?: string;
  measures?: any[];
  tuningNotes?: string[];
}

export const TablatureCanvas: React.FC<TablatureCanvasProps> = (props) => {
  return <TablatureRunway {...props} />;
};

export default TablatureCanvas;
