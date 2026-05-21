// Append to frontend/heatlens-ui/src/types/dataTypes.ts.
// Matches ml/counterfactual_shap.py output and frontend-data-contract.md §4.4.

export type ShapDeltaRecord = {
  feature: string;
  delta: number;
};

export type CounterfactualRecord = {
  countyName: string;
  countyFips: string;
  year: number;
  originalPrediction: number;
  updatedPrediction: number;
  predictionDelta: number;
  interventions: {
    acCoverageChange?: number;
    treeCanopyChange?: number;
  };
  baseValue: number;
  originalShapValues: ShapValueRecord[];
  updatedShapValues: ShapValueRecord[];
  shapDelta: ShapDeltaRecord[];
};
