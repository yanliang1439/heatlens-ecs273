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

  // Keeping this lookup close to App for now makes the early state flow easier
  // to follow before we split more logic into separate files.
  const selectedCounty = countySummariesMock.find((county) => {
    return (
      county.countyFips === selection.selectedCountyFips &&
      county.year === selection.selectedYear
    );
  });

  if (!selectedCounty) {
    return <main className="app-shell">Selection could not be loaded.</main>;
  }

  const selectedCountyDetail = countyDetailsMock.find((county) => {
    return (
      county.countyFips === selection.selectedCountyFips &&
      county.year === selection.selectedYear
    );
  });

  if (!selectedCountyDetail) {
    return <main className="app-shell">County detail could not be loaded.</main>;
  }

  const selectedShapBreakdown = shapBreakdownsMock.find((county) => {
    return (
      county.countyFips === selection.selectedCountyFips &&
      county.year === selection.selectedYear
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
      <section className="top-bar">
        <div>
          <p className="eyebrow">ECS 273 Final Project</p>
          <h1>HeatLens</h1>
          <p className="hero-copy">
            Mock frontend dashboard for exploring county heat-health risk,
            model explanations, and simple intervention scenarios.
          </p>
        </div>

        <div className="toolbar-card">
          <div className="control-row">
            <YearSelect
              years={yearOptions}
              selectedYear={selection.selectedYear}
              onChange={handleYearChange}
            />
            <CountySelect
              counties={countyOptions}
              selectedCountyFips={selection.selectedCountyFips}
              onChange={handleCountyChange}
            />
          </div>

          <div className="selection-summary">
            <div className="status-card">
              <h2>Selected County</h2>
              <p>
                <strong>{selectedCounty.countyName}</strong> in{" "}
                <strong>{selectedCounty.year}</strong>
              </p>
              <p>
                Predicted ED rate:{" "}
                <strong>{selectedCounty.predictedEdRate.toFixed(1)}</strong>
              </p>
            </div>

            <div className="status-card">
              <h2>How To Read This</h2>
              <p>1. Pick a county and year.</p>
              <p>2. Check its features and SHAP drivers.</p>
              <p>3. Try an intervention in the simulator.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="map-column">
          <MapOverview
            countySummaries={countySummariesMock}
            selectedCountyFips={selection.selectedCountyFips}
            selectedYear={selection.selectedYear}
            onCountyChange={handleCountyChange}
          />
        </div>

        <div className="side-column">
          <FeatureDetail countyDetail={selectedCountyDetail} />
          <ShapBreakdown shapBreakdown={selectedShapBreakdown} />
        </div>
      </section>

      <WhatIfSimulator
        countyDetail={selectedCountyDetail}
        shapBreakdown={selectedShapBreakdown}
      />
    </main>
  );
}

export default App;
