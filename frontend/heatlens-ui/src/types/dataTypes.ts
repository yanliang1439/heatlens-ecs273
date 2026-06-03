// These types match the shared data shape used across the map, detail, SHAP, and simulator views.
export type RiskLevel = "low" | "medium" | "high";

export type CountySummaryRecord = {
  countyName: string;
  countyFips: string;
  year: number;
  predictedEdRate: number;
  observedEdRate: number | null;
  riskLevel: RiskLevel;
};

export type CountyFeatureSet = Record<string, number>;

export type CountyDetailRecord = {
  countyName: string;
  countyFips: string;
  year: number;
  predictedEdRate: number;
  observedEdRate: number | null;
  climateFeatures: CountyFeatureSet;
  vulnerabilityFeatures: CountyFeatureSet;
};

export type ShapValueRecord = {
  feature: string;
  value: number;
  shapContribution: number;
};

export type ShapBreakdownRecord = {
  countyName: string;
  countyFips: string;
  year: number;
  baseValue: number;
  prediction: number;
  shapValues: ShapValueRecord[];
};

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
