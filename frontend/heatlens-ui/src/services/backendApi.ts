import type {
  CounterfactualRecord,
  CountyDetailRecord,
  CountySummaryRecord,
  ShapBreakdownRecord,
} from "../types/dataTypes";
import type { AppSelection } from "../types/stateTypes";

type BackendHealth = {
  counterfactualAvailable?: boolean;
  status?: string;
};

type BackendFeatureRow = {
  countyFips?: string;
  county_name?: string;
  countyName?: string;
  year?: number;
  heat_ed_rate?: number | null;
  avg_summer_tmax_f?: number;
  heatwave_days?: number;
  max_consecutive_hot_days?: number;
  hot_nights?: number;
  p99_tmax_f?: number;
  pct_65_plus?: number;
  pct_poverty?: number;
  ac_coverage_pct?: number;
  tree_canopy_pct?: number;
};

type LiveDashboardData = {
  selectedCounty: CountySummaryRecord;
  selectedCountyDetail: CountyDetailRecord;
  selectedShapBreakdown: ShapBreakdownRecord;
};

// Keep the API base flexible so local dev can use Vite proxying without hardcoding URLs.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getBackendHealth(): Promise<BackendHealth> {
  return fetchJson<BackendHealth>("/api/health");
}

export async function getPrediction(
  countyFips: string,
  year: number
): Promise<CountySummaryRecord> {
  // View 1 and the summary chips both depend on this county-year prediction record.
  return fetchJson<CountySummaryRecord>(`/api/prediction/${countyFips}/${year}`);
}

export async function getShap(
  countyFips: string,
  year: number
): Promise<ShapBreakdownRecord> {
  // View 3 reads the backend SHAP export through this route.
  return fetchJson<ShapBreakdownRecord>(`/api/shap/${countyFips}/${year}`);
}

export async function getFeatures(
  countyFips: string,
  year: number
): Promise<BackendFeatureRow> {
  // View 2 uses the flatter backend feature row and then reshapes it for the UI.
  return fetchJson<BackendFeatureRow>(`/api/features/${countyFips}/${year}`);
}

function toNumber(value: number | undefined | null): number {
  return typeof value === "number" ? value : 0;
}

function buildCountyDetail(
  summary: CountySummaryRecord,
  featureRow: BackendFeatureRow
): CountyDetailRecord {
  // The backend returns one flatter row here, so map it back into the view shape the UI already uses.
  return {
    countyName: featureRow.countyName ?? featureRow.county_name ?? summary.countyName,
    countyFips: summary.countyFips,
    year: summary.year,
    predictedEdRate: summary.predictedEdRate,
    observedEdRate:
      summary.observedEdRate ?? (featureRow.heat_ed_rate ?? null),
    climateFeatures: {
      summerAvgMax: toNumber(featureRow.avg_summer_tmax_f),
      heatwaveDays: toNumber(featureRow.heatwave_days),
      consecutiveHotDays: toNumber(featureRow.max_consecutive_hot_days),
      warmNightCount: toNumber(featureRow.hot_nights),
      tailPercentileTemp: toNumber(featureRow.p99_tmax_f),
    },
    vulnerabilityFeatures: {
      elderlyPct: toNumber(featureRow.pct_65_plus),
      povertyPct: toNumber(featureRow.pct_poverty),
      acCoverage: toNumber(featureRow.ac_coverage_pct),
      treeCanopy: toNumber(featureRow.tree_canopy_pct),
    },
  };
}

export async function getLiveDashboardData(
  selection: AppSelection
): Promise<LiveDashboardData> {
  // These three requests describe the same selected county-year, so fetch them together.
  const [summary, featureRow, shapBreakdown] = await Promise.all([
    getPrediction(selection.selectedCountyFips, selection.selectedYear),
    getFeatures(selection.selectedCountyFips, selection.selectedYear),
    getShap(selection.selectedCountyFips, selection.selectedYear),
  ]);

  return {
    selectedCounty: summary,
    selectedCountyDetail: buildCountyDetail(summary, featureRow),
    selectedShapBreakdown: shapBreakdown,
  };
}

export async function runWhatIf(payload: {
  countyFips: string;
  year: number;
  interventions: {
    acCoverageChange: number;
    treeCanopyChange: number;
  };
}): Promise<CounterfactualRecord> {
  // The simulator uses a POST so the backend can read both the county and the intervention values.
  // This is the live counterfactual call behind View 4.
  const response = await fetch(`${API_BASE}/api/whatif`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`What-if request failed: ${response.status}`);
  }

  return response.json() as Promise<CounterfactualRecord>;
}
