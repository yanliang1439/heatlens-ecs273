import { useState } from "react";
import ViewCard from "./components/ViewCard";
import { countyDetailMock, countySummariesMock } from "./data/mockData";
import type { AppSelection } from "./types/stateTypes";
import type { ViewSummary } from "./types/viewTypes";

const plannedViews: ViewSummary[] = [
  {
    id: "map-overview",
    title: "Map Overview",
    status: "next up",
    description:
      "California county map with risk coloring, hover details, and year selection.",
  },
  {
    id: "feature-detail",
    title: "Feature Detail",
    status: "planned",
    description:
      "Bar chart for the selected county's main climate and vulnerability features.",
  },
  {
    id: "shap-breakdown",
    title: "SHAP Breakdown",
    status: "planned",
    description:
      "Simple explanation view for what is pushing the prediction up or down.",
  },
  {
    id: "what-if-simulator",
    title: "What-if Simulator",
    status: "planned",
    description:
      "Slider-based controls for testing changes like AC coverage and tree canopy.",
  },
];

function App() {
  const defaultSelection: AppSelection = {
    selectedCountyFips: countySummariesMock[0].countyFips,
    selectedYear: countySummariesMock[0].year,
  };

  const [selection] = useState<AppSelection>(defaultSelection);

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
              {Object.keys(countyDetailMock.climateFeatures).length +
                Object.keys(countyDetailMock.vulnerabilityFeatures).length}
            </strong>
          </p>
        </div>
      </section>

      <section className="views-panel">
        <div className="section-heading">
          <h2>Planned Views</h2>
          <p>
            These are the four main interface pieces we promised in the
            proposal and project plan.
          </p>
        </div>

        <div className="view-grid">
          {plannedViews.map((view) => (
            <ViewCard key={view.id} view={view} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
