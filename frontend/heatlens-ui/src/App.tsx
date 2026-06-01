import { useEffect, useState } from "react";
import CountySelect from "./components/CountySelect";
import HelpPanel from "./components/HelpPanel";
import YearSelect from "./components/YearSelect";
import {
  getBackendHealth,
  getLiveDashboardData,
} from "./services/backendApi";
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

type BackendMode = "checking" | "available" | "fallback";

function App() {
  const defaultSelection = getDefaultSelection();
  const localDashboardData = getDashboardData(defaultSelection);

  const [selection, setSelection] = useState<AppSelection>(defaultSelection);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [backendMode, setBackendMode] = useState<BackendMode>("checking");
  const [counterfactualAvailable, setCounterfactualAvailable] = useState(false);
  const [dashboardData, setDashboardData] = useState(localDashboardData);

  if (!dashboardData) {
    return <main className="app-shell">Mock dashboard data could not be loaded.</main>;
  }

  const { selectedCounty, selectedCountyDetail, selectedShapBreakdown } =
    dashboardData;

  const yearOptions = getAvailableYears();
  const countyOptions = getCountyOptions(selection.selectedYear);
  const visibleCountySummaries = getCountySummaries(selectedCounty.year);
  const currentDataSource = getCurrentDataSource();

  // This is the API availability check behind the backend-connected version of the dashboard.
  useEffect(() => {
    let isCancelled = false;

    async function checkBackend() {
      try {
        const health = await getBackendHealth();

        if (isCancelled) {
          return;
        }

        setBackendMode("available");
        setCounterfactualAvailable(Boolean(health.counterfactualAvailable));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setBackendMode("fallback");
        setCounterfactualAvailable(false);
      }
    }

    // Start in backend mode when the API is up, but keep the app usable if it is not.
    checkBackend();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const fallbackDashboardData = getDashboardData(selection);

    if (!fallbackDashboardData) {
      return;
    }

    if (backendMode !== "available") {
      setDashboardData(fallbackDashboardData);
      return;
    }

    async function loadLiveSelection() {
      try {
        const liveData = await getLiveDashboardData(selection);

        if (isCancelled) {
          return;
        }

        setDashboardData(liveData);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setDashboardData(fallbackDashboardData);
        setBackendMode("fallback");
        setCounterfactualAvailable(false);
      }
    }

    // Pull the selected county from the API when possible, otherwise keep the local copy.
    loadLiveSelection();

    return () => {
      isCancelled = true;
    };
  }, [backendMode, selection]);

  function handleCountyChange(nextCountyFips: string) {
    if (!isCountyAvailable(nextCountyFips, selection.selectedYear)) {
      return;
    }

    // One county selection drives all four views so the dashboard stays linked.
    setSelection((currentSelection) => ({
      ...currentSelection,
      selectedCountyFips: nextCountyFips,
    }));
  }

  function handleYearChange(nextYear: number) {
    const firstCountyInYear = getFirstCountyForYear(nextYear);

    // Reset to a valid county when the year changes so the selection never points to missing data.
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
              Source{" "}
              <strong>
                {backendMode === "available"
                  ? "Backend + ML outputs"
                  : currentDataSource === "mlExport"
                    ? "ML export"
                    : "Mock data"}
              </strong>
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
            useLiveWhatIf={backendMode === "available" && counterfactualAvailable}
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
