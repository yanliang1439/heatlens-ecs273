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
