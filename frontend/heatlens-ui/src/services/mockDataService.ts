import countyDetailsMl from "../data/mlOutputs/county_details.json";
import countySummariesMl from "../data/mlOutputs/county_summaries.json";
import shapBreakdownsMl from "../data/mlOutputs/shap_breakdowns.json";
import {
  countyDetailsMock,
  countySummariesMock,
  shapBreakdownsMock,
} from "../data/mockData";
import type {
  CountyDetailRecord,
  CountySummaryRecord,
  ShapBreakdownRecord,
} from "../types/dataTypes";
import type { AppSelection } from "../types/stateTypes";

type CountyOption = {
  countyFips: string;
  countyName: string;
};

type DashboardData = {
  selectedCounty: CountySummaryRecord;
  selectedCountyDetail: CountyDetailRecord;
  selectedShapBreakdown: ShapBreakdownRecord;
};

type DataBundle = {
  countyDetails: CountyDetailRecord[];
  countySummaries: CountySummaryRecord[];
  shapBreakdowns: ShapBreakdownRecord[];
};

type DataSourceKey = "mock" | "mlExport";

const mockBundle: DataBundle = {
  countyDetails: countyDetailsMock,
  countySummaries: countySummariesMock,
  shapBreakdowns: shapBreakdownsMock,
};

const mlExportBundle: DataBundle = {
  countyDetails: countyDetailsMl as CountyDetailRecord[],
  countySummaries: countySummariesMl as CountySummaryRecord[],
  shapBreakdowns: shapBreakdownsMl as ShapBreakdownRecord[],
};

// This switch lets the same UI run on either the old mock set or the exported ML files.
const currentDataSource: DataSourceKey = "mlExport";

function getBundle(): DataBundle {
  // Keep this bundle lookup separate so App can swap sources without changing view code.
  if (currentDataSource === "mlExport") {
    return mlExportBundle;
  }

  return mockBundle;
}

export function getCurrentDataSource(): DataSourceKey {
  return currentDataSource;
}

export function getDefaultSelection(): AppSelection {
  const { countySummaries } = getBundle();

  return {
    selectedCountyFips: countySummaries[0].countyFips,
    selectedYear: countySummaries[0].year,
  };
}

export function getAvailableYears(): number[] {
  const { countySummaries } = getBundle();

  return Array.from(new Set(countySummaries.map((county) => county.year))).sort();
}

export function getCountyOptions(year: number): CountyOption[] {
  const { countySummaries } = getBundle();

  return countySummaries
    .filter((county) => county.year === year)
    .map((county) => ({
      countyFips: county.countyFips,
      countyName: county.countyName,
    }));
}

export function getCountySummaries(year: number): CountySummaryRecord[] {
  const { countySummaries } = getBundle();

  return countySummaries.filter((county) => county.year === year);
}

export function isCountyAvailable(countyFips: string, year: number): boolean {
  const { countySummaries } = getBundle();

  return countySummaries.some((county) => {
    return county.countyFips === countyFips && county.year === year;
  });
}

export function getFirstCountyForYear(year: number): CountySummaryRecord | undefined {
  const { countySummaries } = getBundle();

  return countySummaries.find((county) => county.year === year);
}

export function getDashboardData(selection: AppSelection): DashboardData | null {
  const { countyDetails, countySummaries, shapBreakdowns } = getBundle();

  // All local fallback data is resolved from the same county-year selection shape.
  const selectedCounty =
    countySummaries.find((county) => {
      return (
        county.countyFips === selection.selectedCountyFips &&
        county.year === selection.selectedYear
      );
    }) ?? getFirstCountyForYear(selection.selectedYear) ?? countySummaries[0];

  const selectedCountyDetail = countyDetails.find((county) => {
    return (
      county.countyFips === selectedCounty.countyFips &&
      county.year === selectedCounty.year
    );
  });

  const selectedShapBreakdown = shapBreakdowns.find((county) => {
    return (
      county.countyFips === selectedCounty.countyFips &&
      county.year === selectedCounty.year
    );
  });

  if (!selectedCountyDetail || !selectedShapBreakdown) {
    return null;
  }

  return {
    selectedCounty,
    selectedCountyDetail,
    selectedShapBreakdown,
  };
}
