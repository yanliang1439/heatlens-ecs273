export function formatFeatureLabel(featureName: string): string {
  return featureName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

export function formatSignedNumber(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }

  return value.toFixed(1);
}

export function formatFeatureValue(
  featureName: string,
  value: number
): string {
  // Group the known feature names here so the views do not each have to decide how to print them.
  const countFeatures = new Set([
    "consecutiveHotDays",
    "heatwaveDays",
    "warmNightCount",
  ]);

  const percentFeatures = new Set([
    "acCoverage",
    "elderlyPct",
    "povertyPct",
    "treeCanopy",
  ]);

  const temperatureFeatures = new Set([
    "summerAvgMax",
    "tailPercentileTemp",
  ]);

  if (countFeatures.has(featureName)) {
    if (featureName === "warmNightCount") {
      return `${value.toFixed(0)} nights`;
    }

    return `${value.toFixed(0)} days`;
  }

  if (percentFeatures.has(featureName)) {
    return `${value.toFixed(1)}%`;
  }

  if (temperatureFeatures.has(featureName)) {
    return `${value.toFixed(1)}°F`;
  }

  return value.toFixed(1);
}

export function getFeatureFillPercent(
  featureName: string,
  value: number
): number {
  // The bars in View 2 should read like rough context within a sensible range,
  // not compete against the single biggest raw number in the panel.
  const featureRanges: Record<string, { min: number; max: number }> = {
    summerAvgMax: { min: 60, max: 120 },
    tailPercentileTemp: { min: 80, max: 130 },
    heatwaveDays: { min: 0, max: 900 },
    warmNightCount: { min: 0, max: 800 },
    consecutiveHotDays: { min: 0, max: 120 },
    elderlyPct: { min: 0, max: 100 },
    povertyPct: { min: 0, max: 100 },
    acCoverage: { min: 0, max: 100 },
    treeCanopy: { min: 0, max: 100 },
  };

  const range = featureRanges[featureName];

  if (!range) {
    return Math.max(0, Math.min(value, 100));
  }

  const normalized = ((value - range.min) / (range.max - range.min)) * 100;
  return Math.max(0, Math.min(normalized, 100));
}
