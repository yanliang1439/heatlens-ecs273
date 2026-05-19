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

export function getDefaultSelection(): AppSelection {
  return {
    selectedCountyFips: countySummariesMock[0].countyFips,
    selectedYear: countySummariesMock[0].year,
  };
}

export function getAvailableYears(): number[] {
  return Array.from(new Set(countySummariesMock.map((county) => county.year))).sort();
}

export function getCountyOptions(year: number): CountyOption[] {
  return countySummariesMock
    .filter((county) => county.year === year)
    .map((county) => ({
      countyFips: county.countyFips,
      countyName: county.countyName,
    }));
}

export function getCountySummaries(year: number): CountySummaryRecord[] {
  return countySummariesMock.filter((county) => county.year === year);
}

export function isCountyAvailable(countyFips: string, year: number): boolean {
  return countySummariesMock.some((county) => {
    return county.countyFips === countyFips && county.year === year;
  });
}

export function getFirstCountyForYear(year: number): CountySummaryRecord | undefined {
  return countySummariesMock.find((county) => county.year === year);
}

export function getDashboardData(selection: AppSelection): DashboardData | null {
  const selectedCounty =
    countySummariesMock.find((county) => {
      return (
        county.countyFips === selection.selectedCountyFips &&
        county.year === selection.selectedYear
      );
    }) ?? getFirstCountyForYear(selection.selectedYear) ?? countySummariesMock[0];

  const selectedCountyDetail = countyDetailsMock.find((county) => {
    return (
      county.countyFips === selectedCounty.countyFips &&
      county.year === selectedCounty.year
    );
  });

  const selectedShapBreakdown = shapBreakdownsMock.find((county) => {
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
