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
