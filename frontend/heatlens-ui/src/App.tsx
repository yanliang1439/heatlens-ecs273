import { useState } from "react";
import CountySelect from "./components/CountySelect";
import HelpPanel from "./components/HelpPanel";
import YearSelect from "./components/YearSelect";
import {
  getAvailableYears,
  getCountyOptions,
  getCountySummaries,
  getCurrentDataSource,
  getDashboardData,
  getDefaultSelection,
  getFirstCountyForYear,
  isCountyAvailable,
} from "./services/mockDataService";
import type { AppSelection } from "./types/stateTypes";
import FeatureDetail from "./views/FeatureDetail";
import MapOverview from "./views/MapOverview";
import ShapBreakdown from "./views/ShapBreakdown";
import WhatIfSimulator from "./views/WhatIfSimulator";

function App() {
  const defaultSelection = getDefaultSelection();

  const [selection, setSelection] = useState<AppSelection>(defaultSelection);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const dashboardData = getDashboardData(selection);

  if (!dashboardData) {
    return <main className="app-shell">Mock dashboard data could not be loaded.</main>;
  }

  const { selectedCounty, selectedCountyDetail, selectedShapBreakdown } =
    dashboardData;

  const yearOptions = getAvailableYears();
  const countyOptions = getCountyOptions(selection.selectedYear);
  const visibleCountySummaries = getCountySummaries(selectedCounty.year);
  const currentDataSource = getCurrentDataSource();

  function handleCountyChange(nextCountyFips: string) {
    if (!isCountyAvailable(nextCountyFips, selection.selectedYear)) {
      return;
    }

    setSelection((currentSelection) => ({
      ...currentSelection,
      selectedCountyFips: nextCountyFips,
    }));
  }

  function handleYearChange(nextYear: number) {
    const firstCountyInYear = getFirstCountyForYear(nextYear);

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
              selectedCountyFips={selectedCounty.countyFips}
              onChange={handleCountyChange}
            />
            <button
              type="button"
              className="help-button"
              onClick={() => setIsHelpOpen(true)}
            >
              Help
            </button>
          </div>

          <div className="toolbar-summary">
            <span>
              Source <strong>{currentDataSource === "mlExport" ? "ML export" : "Mock data"}</strong>
            </span>
            <span>
              County <strong>{selectedCounty.countyName}</strong>
            </span>
            <span>
              Year <strong>{selectedCounty.year}</strong>
            </span>
            <span>
              Predicted ED rate{" "}
              <strong>{selectedCounty.predictedEdRate.toFixed(1)}</strong>
            </span>
          </div>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="workspace-pane map-pane">
          <MapOverview
            countySummaries={visibleCountySummaries}
            selectedCountyFips={selectedCounty.countyFips}
            selectedYear={selectedCounty.year}
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

      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
        }}
      />
    </main>
  );
}

export default App;
