import { useState } from "react";
import {
  countyDetailsMock,
  countySummariesMock,
  shapBreakdownsMock,
} from "./data/mockData";
import CountySelect from "./components/CountySelect";
import YearSelect from "./components/YearSelect";
import type { AppSelection } from "./types/stateTypes";
import FeatureDetail from "./views/FeatureDetail";
import MapOverview from "./views/MapOverview";
import ShapBreakdown from "./views/ShapBreakdown";
import WhatIfSimulator from "./views/WhatIfSimulator";

function App() {
  const defaultSelection: AppSelection = {
    selectedCountyFips: countySummariesMock[0].countyFips,
    selectedYear: countySummariesMock[0].year,
  };

  const [selection, setSelection] = useState<AppSelection>(defaultSelection);

  // Keeping these lookups close to App is still the easiest way to follow the
  // shared selection flow while the data is mock-only.
  const selectedCounty = countySummariesMock.find((county) => {
    return (
      county.countyFips === selection.selectedCountyFips &&
      county.year === selection.selectedYear
    );
  });

  const fallbackCounty =
    selectedCounty ??
    countySummariesMock.find((county) => county.year === selection.selectedYear) ??
    countySummariesMock[0];

  const selectedCountyDetail = countyDetailsMock.find((county) => {
    return (
      county.countyFips === fallbackCounty.countyFips &&
      county.year === fallbackCounty.year
    );
  });

  if (!selectedCountyDetail) {
    return <main className="app-shell">County detail could not be loaded.</main>;
  }

  const selectedShapBreakdown = shapBreakdownsMock.find((county) => {
    return (
      county.countyFips === fallbackCounty.countyFips &&
      county.year === fallbackCounty.year
    );
  });

  if (!selectedShapBreakdown) {
    return <main className="app-shell">SHAP detail could not be loaded.</main>;
  }

  const yearOptions = Array.from(
    new Set(countySummariesMock.map((county) => county.year))
  ).sort();

  const countyOptions = countySummariesMock
    .filter((county) => county.year === selection.selectedYear)
    .map((county) => ({
      countyFips: county.countyFips,
      countyName: county.countyName,
    }));

  function handleCountyChange(nextCountyFips: string) {
    const countyExistsForYear = countySummariesMock.some((county) => {
      return (
        county.countyFips === nextCountyFips &&
        county.year === selection.selectedYear
      );
    });

    if (!countyExistsForYear) {
      return;
    }

    setSelection((currentSelection) => ({
      ...currentSelection,
      selectedCountyFips: nextCountyFips,
    }));
  }

  function handleYearChange(nextYear: number) {
    const firstCountyInYear = countySummariesMock.find((county) => {
      return county.year === nextYear;
    });

    setSelection({
      selectedYear: nextYear,
      selectedCountyFips:
        firstCountyInYear?.countyFips ?? defaultSelection.selectedCountyFips,
    });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-title">
          <p className="eyebrow">ECS 273 Final Project</p>
          <h1>HeatLens</h1>
          <p className="hero-copy">
            Explore county heat-health risk, explanation signals, and simple
            intervention scenarios in one workspace.
          </p>
        </div>

        <div className="header-controls">
          <div className="control-row">
            <YearSelect
              years={yearOptions}
              selectedYear={selection.selectedYear}
              onChange={handleYearChange}
            />
            <CountySelect
              counties={countyOptions}
              selectedCountyFips={fallbackCounty.countyFips}
              onChange={handleCountyChange}
            />
          </div>

          <div className="toolbar-summary">
            <span>
              County <strong>{fallbackCounty.countyName}</strong>
            </span>
            <span>
              Year <strong>{fallbackCounty.year}</strong>
            </span>
            <span>
              Predicted ED rate{" "}
              <strong>{fallbackCounty.predictedEdRate.toFixed(1)}</strong>
            </span>
          </div>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="workspace-pane map-pane">
          <MapOverview
            countySummaries={countySummariesMock}
            selectedCountyFips={fallbackCounty.countyFips}
            selectedYear={fallbackCounty.year}
            onCountyChange={handleCountyChange}
          />
        </div>

        <div className="workspace-pane feature-pane">
          <FeatureDetail countyDetail={selectedCountyDetail} />
        </div>

        <div className="workspace-pane shap-pane">
          <ShapBreakdown shapBreakdown={selectedShapBreakdown} />
        </div>

        <div className="workspace-pane simulator-pane">
          <WhatIfSimulator
            countyDetail={selectedCountyDetail}
            shapBreakdown={selectedShapBreakdown}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
