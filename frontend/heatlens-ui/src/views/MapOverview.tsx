import CountySelect from "../components/CountySelect";
import YearSelect from "../components/YearSelect";
import type { CountySummaryRecord } from "../types/dataTypes";

type MapOverviewProps = {
  countySummaries: CountySummaryRecord[];
  selectedCountyFips: string;
  selectedYear: number;
  onCountyChange: (countyFips: string) => void;
  onYearChange: (year: number) => void;
};

function MapOverview(props: MapOverviewProps) {
  const {
    countySummaries,
    selectedCountyFips,
    selectedYear,
    onCountyChange,
    onYearChange,
  } = props;

  const yearOptions = Array.from(
    new Set(countySummaries.map((county) => county.year))
  ).sort();

  const countyOptions = countySummaries
    .filter((county) => county.year === selectedYear)
    .map((county) => ({
      countyFips: county.countyFips,
      countyName: county.countyName,
    }));

  const visibleCounties = countySummaries.filter((county) => {
    return county.year === selectedYear;
  });

  return (
    <section className="view-panel">
      <div className="panel-header">
        <div>
          <p className="panel-tag">View 1</p>
          <h2>Map Overview</h2>
        </div>
        <div className="control-row">
          <YearSelect
            years={yearOptions}
            selectedYear={selectedYear}
            onChange={onYearChange}
          />
          <CountySelect
            counties={countyOptions}
            selectedCountyFips={selectedCountyFips}
            onChange={onCountyChange}
          />
        </div>
      </div>

      <div className="map-placeholder">
        <div>
          <h3>Map area placeholder</h3>
          <p>
            This box will be replaced by the California county map once the
            boundary data is added.
          </p>
        </div>
      </div>

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
              <span>{county.countyName}</span>
              <span>{county.predictedEdRate.toFixed(1)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MapOverview;
