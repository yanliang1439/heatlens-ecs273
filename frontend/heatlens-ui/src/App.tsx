import { useState } from "react";
import {
  countyDetailsMock,
  countySummariesMock,
} from "./data/mockData";
import type { AppSelection } from "./types/stateTypes";
import FeatureDetail from "./views/FeatureDetail";
import MapOverview from "./views/MapOverview";

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
      <section className="hero-panel">
        <p className="eyebrow">ECS 273 Final Project</p>
        <h1>HeatLens Frontend</h1>
        <p className="hero-copy">
          This is the frontend workspace for the HeatLens visual analytics
          project. Right now this page is just a clean starting point so we can
          build each view one step at a time.
        </p>
      </section>

      <section className="status-grid">
        <div className="status-card">
          <h2>Current Selection</h2>
          <p>
            County: <strong>{selectedCounty.countyName}</strong>
          </p>
          <p>
            Year: <strong>{selectedCounty.year}</strong>
          </p>
          <p>
            Predicted ED visit rate:{" "}
            <strong>{selectedCounty.predictedEdRate.toFixed(1)}</strong>
          </p>
        </div>

        <div className="status-card">
          <h2>Data Shape Check</h2>
          <p>
            Mock county records loaded: <strong>{countySummariesMock.length}</strong>
          </p>
          <p>
            Detail view feature groups ready:{" "}
            <strong>
              {Object.keys(selectedCountyDetail.climateFeatures).length +
                Object.keys(selectedCountyDetail.vulnerabilityFeatures).length}
            </strong>
          </p>
        </div>
      </section>

      <MapOverview
        countySummaries={countySummariesMock}
        selectedCountyFips={selection.selectedCountyFips}
        selectedYear={selection.selectedYear}
        onCountyChange={handleCountyChange}
        onYearChange={handleYearChange}
      />

      <FeatureDetail countyDetail={selectedCountyDetail} />
    </main>
  );
}

export default App;
