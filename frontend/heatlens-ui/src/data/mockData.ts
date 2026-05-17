import type {
  CountyDetailRecord,
  CountySummaryRecord,
  ShapBreakdownRecord,
} from "../types/dataTypes";

// These values are just placeholders for now so the UI can be built early.
// We can swap this file out later once the real API responses exist.
export const countySummariesMock: CountySummaryRecord[] = [
  {
    countyName: "Sacramento",
    countyFips: "06067",
    year: 2022,
    predictedEdRate: 14.2,
    observedEdRate: 13.8,
    riskLevel: "high",
  },
  {
    countyName: "Yolo",
    countyFips: "06113",
    year: 2022,
    predictedEdRate: 10.9,
    observedEdRate: 10.5,
    riskLevel: "medium",
  },
  {
    countyName: "Imperial",
    countyFips: "06025",
    year: 2022,
    predictedEdRate: 18.4,
    observedEdRate: 18.9,
    riskLevel: "high",
  },
];

export const countyDetailMock: CountyDetailRecord = {
  countyName: "Sacramento",
  countyFips: "06067",
  year: 2022,
  predictedEdRate: 14.2,
  observedEdRate: 13.8,
  climateFeatures: {
    summerAvgMax: 96.1,
    heatwaveDays: 18,
    consecutiveHotDays: 7,
    warmNightCount: 24,
    tailPercentileTemp: 101.4,
  },
  vulnerabilityFeatures: {
    elderlyPct: 14.7,
    povertyPct: 11.2,
    acCoverage: 78.0,
    treeCanopy: 19.5,
  },
};

export const shapBreakdownMock: ShapBreakdownRecord = {
  countyName: "Sacramento",
  countyFips: "06067",
  year: 2022,
  baseValue: 9.4,
  prediction: 14.2,
  shapValues: [
    {
      feature: "heatwaveDays",
      value: 18,
      shapContribution: 2.1,
    },
    {
      feature: "warmNightCount",
      value: 24,
      shapContribution: 1.4,
    },
    {
      feature: "acCoverage",
      value: 78.0,
      shapContribution: -0.8,
    },
  ],
};
