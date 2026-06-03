import type {
  CountyDetailRecord,
  CountySummaryRecord,
  RiskLevel,
  ShapBreakdownRecord,
} from "../types/dataTypes";

type SummaryInput = {
  countyName: string;
  countyFips: string;
  year: number;
  predictedEdRate: number;
  observedEdRate: number;
  riskLevel: RiskLevel;
};

type DetailInput = {
  countyName: string;
  countyFips: string;
  year: number;
  predictedEdRate: number;
  observedEdRate: number;
  climateFeatures: Record<string, number>;
  vulnerabilityFeatures: Record<string, number>;
};

type ShapInput = {
  countyName: string;
  countyFips: string;
  year: number;
  baseValue: number;
  prediction: number;
  shapValues: ShapBreakdownRecord["shapValues"];
};

function makeSummary(input: SummaryInput): CountySummaryRecord {
  return input;
}

function makeDetail(input: DetailInput): CountyDetailRecord {
  return input;
}

function makeShap(input: ShapInput): ShapBreakdownRecord {
  return input;
}

// I kept a small mock set around so the UI can still run even without the API.
export const countySummariesMock: CountySummaryRecord[] = [
  makeSummary({
    countyName: "Sacramento",
    countyFips: "06067",
    year: 2021,
    predictedEdRate: 12.9,
    observedEdRate: 12.4,
    riskLevel: "medium",
  }),
  makeSummary({
    countyName: "Sacramento",
    countyFips: "06067",
    year: 2022,
    predictedEdRate: 14.2,
    observedEdRate: 13.8,
    riskLevel: "high",
  }),
  makeSummary({
    countyName: "Yolo",
    countyFips: "06113",
    year: 2021,
    predictedEdRate: 9.8,
    observedEdRate: 9.4,
    riskLevel: "medium",
  }),
  makeSummary({
    countyName: "Yolo",
    countyFips: "06113",
    year: 2022,
    predictedEdRate: 10.9,
    observedEdRate: 10.5,
    riskLevel: "medium",
  }),
  makeSummary({
    countyName: "Imperial",
    countyFips: "06025",
    year: 2021,
    predictedEdRate: 16.7,
    observedEdRate: 17.0,
    riskLevel: "high",
  }),
  makeSummary({
    countyName: "Imperial",
    countyFips: "06025",
    year: 2022,
    predictedEdRate: 18.4,
    observedEdRate: 18.9,
    riskLevel: "high",
  }),
  makeSummary({
    countyName: "Los Angeles",
    countyFips: "06037",
    year: 2021,
    predictedEdRate: 13.7,
    observedEdRate: 13.3,
    riskLevel: "medium",
  }),
  makeSummary({
    countyName: "Los Angeles",
    countyFips: "06037",
    year: 2022,
    predictedEdRate: 15.5,
    observedEdRate: 15.1,
    riskLevel: "high",
  }),
  makeSummary({
    countyName: "Alameda",
    countyFips: "06001",
    year: 2021,
    predictedEdRate: 8.7,
    observedEdRate: 8.4,
    riskLevel: "low",
  }),
  makeSummary({
    countyName: "Alameda",
    countyFips: "06001",
    year: 2022,
    predictedEdRate: 9.6,
    observedEdRate: 9.2,
    riskLevel: "medium",
  }),
  makeSummary({
    countyName: "San Diego",
    countyFips: "06073",
    year: 2021,
    predictedEdRate: 11.8,
    observedEdRate: 11.4,
    riskLevel: "medium",
  }),
  makeSummary({
    countyName: "San Diego",
    countyFips: "06073",
    year: 2022,
    predictedEdRate: 12.7,
    observedEdRate: 12.5,
    riskLevel: "medium",
  }),
  makeSummary({
    countyName: "Fresno",
    countyFips: "06019",
    year: 2021,
    predictedEdRate: 15.3,
    observedEdRate: 15.0,
    riskLevel: "high",
  }),
  makeSummary({
    countyName: "Fresno",
    countyFips: "06019",
    year: 2022,
    predictedEdRate: 16.8,
    observedEdRate: 16.4,
    riskLevel: "high",
  }),
  makeSummary({
    countyName: "Kern",
    countyFips: "06029",
    year: 2021,
    predictedEdRate: 14.4,
    observedEdRate: 14.1,
    riskLevel: "high",
  }),
  makeSummary({
    countyName: "Kern",
    countyFips: "06029",
    year: 2022,
    predictedEdRate: 15.9,
    observedEdRate: 15.6,
    riskLevel: "high",
  }),
];

export const countyDetailsMock: CountyDetailRecord[] = [
  makeDetail({
    countyName: "Sacramento",
    countyFips: "06067",
    year: 2021,
    predictedEdRate: 12.9,
    observedEdRate: 12.4,
    climateFeatures: {
      summerAvgMax: 94.8,
      heatwaveDays: 14,
      consecutiveHotDays: 5,
      warmNightCount: 20,
      tailPercentileTemp: 99.2,
    },
    vulnerabilityFeatures: {
      elderlyPct: 14.4,
      povertyPct: 11.5,
      acCoverage: 77.4,
      treeCanopy: 19.1,
    },
  }),
  makeDetail({
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
  }),
  makeDetail({
    countyName: "Yolo",
    countyFips: "06113",
    year: 2021,
    predictedEdRate: 9.8,
    observedEdRate: 9.4,
    climateFeatures: {
      summerAvgMax: 92.6,
      heatwaveDays: 10,
      consecutiveHotDays: 4,
      warmNightCount: 16,
      tailPercentileTemp: 97.3,
    },
    vulnerabilityFeatures: {
      elderlyPct: 13.1,
      povertyPct: 10.4,
      acCoverage: 75.8,
      treeCanopy: 16.9,
    },
  }),
  makeDetail({
    countyName: "Yolo",
    countyFips: "06113",
    year: 2022,
    predictedEdRate: 10.9,
    observedEdRate: 10.5,
    climateFeatures: {
      summerAvgMax: 94.0,
      heatwaveDays: 13,
      consecutiveHotDays: 5,
      warmNightCount: 18,
      tailPercentileTemp: 99.1,
    },
    vulnerabilityFeatures: {
      elderlyPct: 13.3,
      povertyPct: 10.1,
      acCoverage: 76.1,
      treeCanopy: 17.2,
    },
  }),
  makeDetail({
    countyName: "Imperial",
    countyFips: "06025",
    year: 2021,
    predictedEdRate: 16.7,
    observedEdRate: 17.0,
    climateFeatures: {
      summerAvgMax: 103.5,
      heatwaveDays: 28,
      consecutiveHotDays: 11,
      warmNightCount: 30,
      tailPercentileTemp: 108.6,
    },
    vulnerabilityFeatures: {
      elderlyPct: 12.8,
      povertyPct: 18.9,
      acCoverage: 70.4,
      treeCanopy: 8.4,
    },
  }),
  makeDetail({
    countyName: "Imperial",
    countyFips: "06025",
    year: 2022,
    predictedEdRate: 18.4,
    observedEdRate: 18.9,
    climateFeatures: {
      summerAvgMax: 104.8,
      heatwaveDays: 31,
      consecutiveHotDays: 13,
      warmNightCount: 33,
      tailPercentileTemp: 110.2,
    },
    vulnerabilityFeatures: {
      elderlyPct: 12.9,
      povertyPct: 18.7,
      acCoverage: 70.9,
      treeCanopy: 8.2,
    },
  }),
  makeDetail({
    countyName: "Los Angeles",
    countyFips: "06037",
    year: 2021,
    predictedEdRate: 13.7,
    observedEdRate: 13.3,
    climateFeatures: {
      summerAvgMax: 91.9,
      heatwaveDays: 12,
      consecutiveHotDays: 4,
      warmNightCount: 19,
      tailPercentileTemp: 97.8,
    },
    vulnerabilityFeatures: {
      elderlyPct: 13.5,
      povertyPct: 13.8,
      acCoverage: 79.2,
      treeCanopy: 12.4,
    },
  }),
  makeDetail({
    countyName: "Los Angeles",
    countyFips: "06037",
    year: 2022,
    predictedEdRate: 15.5,
    observedEdRate: 15.1,
    climateFeatures: {
      summerAvgMax: 94.2,
      heatwaveDays: 16,
      consecutiveHotDays: 6,
      warmNightCount: 23,
      tailPercentileTemp: 100.2,
    },
    vulnerabilityFeatures: {
      elderlyPct: 13.7,
      povertyPct: 13.4,
      acCoverage: 79.8,
      treeCanopy: 12.1,
    },
  }),
  makeDetail({
    countyName: "Alameda",
    countyFips: "06001",
    year: 2021,
    predictedEdRate: 8.7,
    observedEdRate: 8.4,
    climateFeatures: {
      summerAvgMax: 85.1,
      heatwaveDays: 6,
      consecutiveHotDays: 2,
      warmNightCount: 11,
      tailPercentileTemp: 90.4,
    },
    vulnerabilityFeatures: {
      elderlyPct: 14.1,
      povertyPct: 9.3,
      acCoverage: 73.6,
      treeCanopy: 18.7,
    },
  }),
  makeDetail({
    countyName: "Alameda",
    countyFips: "06001",
    year: 2022,
    predictedEdRate: 9.6,
    observedEdRate: 9.2,
    climateFeatures: {
      summerAvgMax: 87.3,
      heatwaveDays: 8,
      consecutiveHotDays: 3,
      warmNightCount: 13,
      tailPercentileTemp: 92.1,
    },
    vulnerabilityFeatures: {
      elderlyPct: 14.2,
      povertyPct: 9.1,
      acCoverage: 74.0,
      treeCanopy: 18.4,
    },
  }),
  makeDetail({
    countyName: "San Diego",
    countyFips: "06073",
    year: 2021,
    predictedEdRate: 11.8,
    observedEdRate: 11.4,
    climateFeatures: {
      summerAvgMax: 88.5,
      heatwaveDays: 9,
      consecutiveHotDays: 3,
      warmNightCount: 15,
      tailPercentileTemp: 93.7,
    },
    vulnerabilityFeatures: {
      elderlyPct: 15.0,
      povertyPct: 11.4,
      acCoverage: 76.8,
      treeCanopy: 14.5,
    },
  }),
  makeDetail({
    countyName: "San Diego",
    countyFips: "06073",
    year: 2022,
    predictedEdRate: 12.7,
    observedEdRate: 12.5,
    climateFeatures: {
      summerAvgMax: 90.2,
      heatwaveDays: 11,
      consecutiveHotDays: 4,
      warmNightCount: 17,
      tailPercentileTemp: 95.5,
    },
    vulnerabilityFeatures: {
      elderlyPct: 15.2,
      povertyPct: 11.0,
      acCoverage: 77.1,
      treeCanopy: 14.1,
    },
  }),
  makeDetail({
    countyName: "Fresno",
    countyFips: "06019",
    year: 2021,
    predictedEdRate: 15.3,
    observedEdRate: 15.0,
    climateFeatures: {
      summerAvgMax: 100.1,
      heatwaveDays: 22,
      consecutiveHotDays: 8,
      warmNightCount: 27,
      tailPercentileTemp: 105.9,
    },
    vulnerabilityFeatures: {
      elderlyPct: 12.5,
      povertyPct: 16.2,
      acCoverage: 72.9,
      treeCanopy: 10.6,
    },
  }),
  makeDetail({
    countyName: "Fresno",
    countyFips: "06019",
    year: 2022,
    predictedEdRate: 16.8,
    observedEdRate: 16.4,
    climateFeatures: {
      summerAvgMax: 101.8,
      heatwaveDays: 25,
      consecutiveHotDays: 10,
      warmNightCount: 29,
      tailPercentileTemp: 107.6,
    },
    vulnerabilityFeatures: {
      elderlyPct: 12.7,
      povertyPct: 15.9,
      acCoverage: 73.4,
      treeCanopy: 10.3,
    },
  }),
  makeDetail({
    countyName: "Kern",
    countyFips: "06029",
    year: 2021,
    predictedEdRate: 14.4,
    observedEdRate: 14.1,
    climateFeatures: {
      summerAvgMax: 99.3,
      heatwaveDays: 20,
      consecutiveHotDays: 8,
      warmNightCount: 25,
      tailPercentileTemp: 104.4,
    },
    vulnerabilityFeatures: {
      elderlyPct: 11.6,
      povertyPct: 15.1,
      acCoverage: 71.8,
      treeCanopy: 9.2,
    },
  }),
  makeDetail({
    countyName: "Kern",
    countyFips: "06029",
    year: 2022,
    predictedEdRate: 15.9,
    observedEdRate: 15.6,
    climateFeatures: {
      summerAvgMax: 101.0,
      heatwaveDays: 23,
      consecutiveHotDays: 9,
      warmNightCount: 28,
      tailPercentileTemp: 106.0,
    },
    vulnerabilityFeatures: {
      elderlyPct: 11.7,
      povertyPct: 14.8,
      acCoverage: 72.2,
      treeCanopy: 9.0,
    },
  }),
];

export const shapBreakdownsMock: ShapBreakdownRecord[] = [
  makeShap({
    countyName: "Sacramento",
    countyFips: "06067",
    year: 2021,
    baseValue: 9.1,
    prediction: 12.9,
    shapValues: [
      { feature: "heatwaveDays", value: 14, shapContribution: 1.7 },
      { feature: "warmNightCount", value: 20, shapContribution: 1.1 },
      { feature: "acCoverage", value: 77.4, shapContribution: -0.6 },
    ],
  }),
  makeShap({
    countyName: "Sacramento",
    countyFips: "06067",
    year: 2022,
    baseValue: 9.4,
    prediction: 14.2,
    shapValues: [
      { feature: "heatwaveDays", value: 18, shapContribution: 2.1 },
      { feature: "warmNightCount", value: 24, shapContribution: 1.4 },
      { feature: "acCoverage", value: 78.0, shapContribution: -0.8 },
    ],
  }),
  makeShap({
    countyName: "Yolo",
    countyFips: "06113",
    year: 2021,
    baseValue: 8.5,
    prediction: 9.8,
    shapValues: [
      { feature: "heatwaveDays", value: 10, shapContribution: 0.9 },
      { feature: "povertyPct", value: 10.4, shapContribution: 0.4 },
      { feature: "treeCanopy", value: 16.9, shapContribution: -0.3 },
    ],
  }),
  makeShap({
    countyName: "Yolo",
    countyFips: "06113",
    year: 2022,
    baseValue: 8.7,
    prediction: 10.9,
    shapValues: [
      { feature: "heatwaveDays", value: 13, shapContribution: 1.1 },
      { feature: "warmNightCount", value: 18, shapContribution: 0.6 },
      { feature: "treeCanopy", value: 17.2, shapContribution: -0.4 },
    ],
  }),
  makeShap({
    countyName: "Imperial",
    countyFips: "06025",
    year: 2021,
    baseValue: 10.2,
    prediction: 16.7,
    shapValues: [
      { feature: "heatwaveDays", value: 28, shapContribution: 2.8 },
      { feature: "povertyPct", value: 18.9, shapContribution: 1.4 },
      { feature: "treeCanopy", value: 8.4, shapContribution: 0.9 },
    ],
  }),
  makeShap({
    countyName: "Imperial",
    countyFips: "06025",
    year: 2022,
    baseValue: 10.4,
    prediction: 18.4,
    shapValues: [
      { feature: "heatwaveDays", value: 31, shapContribution: 3.2 },
      { feature: "warmNightCount", value: 33, shapContribution: 1.7 },
      { feature: "treeCanopy", value: 8.2, shapContribution: 1.0 },
    ],
  }),
  makeShap({
    countyName: "Los Angeles",
    countyFips: "06037",
    year: 2021,
    baseValue: 9.6,
    prediction: 13.7,
    shapValues: [
      { feature: "heatwaveDays", value: 12, shapContribution: 1.2 },
      { feature: "warmNightCount", value: 19, shapContribution: 1.0 },
      { feature: "povertyPct", value: 13.8, shapContribution: 0.8 },
    ],
  }),
  makeShap({
    countyName: "Los Angeles",
    countyFips: "06037",
    year: 2022,
    baseValue: 9.8,
    prediction: 15.5,
    shapValues: [
      { feature: "heatwaveDays", value: 16, shapContribution: 1.7 },
      { feature: "warmNightCount", value: 23, shapContribution: 1.3 },
      { feature: "treeCanopy", value: 12.1, shapContribution: 0.7 },
    ],
  }),
  makeShap({
    countyName: "Alameda",
    countyFips: "06001",
    year: 2021,
    baseValue: 8.1,
    prediction: 8.7,
    shapValues: [
      { feature: "heatwaveDays", value: 6, shapContribution: 0.4 },
      { feature: "treeCanopy", value: 18.7, shapContribution: -0.4 },
      { feature: "povertyPct", value: 9.3, shapContribution: 0.2 },
    ],
  }),
  makeShap({
    countyName: "Alameda",
    countyFips: "06001",
    year: 2022,
    baseValue: 8.3,
    prediction: 9.6,
    shapValues: [
      { feature: "heatwaveDays", value: 8, shapContribution: 0.6 },
      { feature: "warmNightCount", value: 13, shapContribution: 0.4 },
      { feature: "treeCanopy", value: 18.4, shapContribution: -0.3 },
    ],
  }),
  makeShap({
    countyName: "San Diego",
    countyFips: "06073",
    year: 2021,
    baseValue: 8.9,
    prediction: 11.8,
    shapValues: [
      { feature: "heatwaveDays", value: 9, shapContribution: 0.9 },
      { feature: "warmNightCount", value: 15, shapContribution: 0.7 },
      { feature: "acCoverage", value: 76.8, shapContribution: -0.3 },
    ],
  }),
  makeShap({
    countyName: "San Diego",
    countyFips: "06073",
    year: 2022,
    baseValue: 9.1,
    prediction: 12.7,
    shapValues: [
      { feature: "heatwaveDays", value: 11, shapContribution: 1.0 },
      { feature: "warmNightCount", value: 17, shapContribution: 0.8 },
      { feature: "treeCanopy", value: 14.1, shapContribution: 0.3 },
    ],
  }),
  makeShap({
    countyName: "Fresno",
    countyFips: "06019",
    year: 2021,
    baseValue: 9.9,
    prediction: 15.3,
    shapValues: [
      { feature: "heatwaveDays", value: 22, shapContribution: 2.3 },
      { feature: "povertyPct", value: 16.2, shapContribution: 1.0 },
      { feature: "treeCanopy", value: 10.6, shapContribution: 0.6 },
    ],
  }),
  makeShap({
    countyName: "Fresno",
    countyFips: "06019",
    year: 2022,
    baseValue: 10.0,
    prediction: 16.8,
    shapValues: [
      { feature: "heatwaveDays", value: 25, shapContribution: 2.6 },
      { feature: "warmNightCount", value: 29, shapContribution: 1.3 },
      { feature: "povertyPct", value: 15.9, shapContribution: 0.9 },
    ],
  }),
  makeShap({
    countyName: "Kern",
    countyFips: "06029",
    year: 2021,
    baseValue: 9.7,
    prediction: 14.4,
    shapValues: [
      { feature: "heatwaveDays", value: 20, shapContribution: 2.0 },
      { feature: "povertyPct", value: 15.1, shapContribution: 0.9 },
      { feature: "acCoverage", value: 71.8, shapContribution: 0.5 },
    ],
  }),
  makeShap({
    countyName: "Kern",
    countyFips: "06029",
    year: 2022,
    baseValue: 9.9,
    prediction: 15.9,
    shapValues: [
      { feature: "heatwaveDays", value: 23, shapContribution: 2.2 },
      { feature: "warmNightCount", value: 28, shapContribution: 1.2 },
      { feature: "treeCanopy", value: 9.0, shapContribution: 0.6 },
    ],
  }),
];
