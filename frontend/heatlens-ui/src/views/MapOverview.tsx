import CountyMap from "../components/CountyMap";
import type { CountySummaryRecord } from "../types/dataTypes";

type MapOverviewProps = {
  countySummaries: CountySummaryRecord[];
  selectedCountyFips: string;
  selectedYear: number;
  onCountyChange: (countyFips: string) => void;
};

function MapOverview(props: MapOverviewProps) {
  const { countySummaries, selectedCountyFips, selectedYear, onCountyChange } =
    props;

  const visibleCounties = countySummaries.filter((county) => {
    return county.year === selectedYear;
  });

  return (
    <section className="view-panel">
      <div className="panel-header">
        <div>
          <p className="panel-tag">View 1</p>
          <h2>Map Overview</h2>
          <p className="panel-copy">
            Select a county from the map to update the detail panels on the
            right and the simulator below.
          </p>
        </div>
      </div>

      <CountyMap
        countySummaries={countySummaries}
        selectedCountyFips={selectedCountyFips}
        selectedYear={selectedYear}
        onCountyChange={onCountyChange}
      />

      <div className="county-list">
        {visibleCounties.map((county) => {
          const isSelected = county.countyFips === selectedCountyFips;

          return (
            <button
              key={`${county.countyFips}-${county.year}`}
              type="button"
              className={isSelected ? "county-row selected" : "county-row"}
              onClick={() => onCountyChange(county.countyFips)}
            >
              <div>
                <strong>{county.countyName}</strong>
                <p>{county.riskLevel} risk</p>
              </div>
              <span>{county.predictedEdRate.toFixed(1)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MapOverview;
