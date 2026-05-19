import { useEffect, useState } from "react";
import type { CountySummaryRecord } from "../types/dataTypes";

type CountyPathRecord = {
  countyName: string;
  countyFips: string;
  path: string;
};

type CountyPathCollection = {
  width: number;
  height: number;
  counties: CountyPathRecord[];
};

type CountyMapProps = {
  countySummaries: CountySummaryRecord[];
  selectedCountyFips: string;
  selectedYear: number;
  onCountyChange: (countyFips: string) => void;
};

type TooltipState = {
  countyName: string;
  predictedEdRate: number;
  riskLevel: string;
  x: number;
  y: number;
};

function getCountyFill(
  countyFips: string,
  selectedCountyFips: string,
  countySummaries: CountySummaryRecord[],
  selectedYear: number
) {
  if (countyFips === selectedCountyFips) {
    return "#2f81f7";
  }

  const countyRecord = countySummaries.find((county) => {
    return county.countyFips === countyFips && county.year === selectedYear;
  });

  if (!countyRecord) {
    return "#2d333b";
  }

  if (countyRecord.riskLevel === "high") {
    return "#f85149";
  }

  if (countyRecord.riskLevel === "medium") {
    return "#d29922";
  }

  return "#238636";
}

function CountyMap(props: CountyMapProps) {
  const { countySummaries, selectedCountyFips, selectedYear, onCountyChange } = props;
  const [countyPaths, setCountyPaths] = useState<CountyPathCollection | null>(
    null
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadCountyPaths() {
      const response = await fetch("/data/california-county-paths.json");
      const data = (await response.json()) as CountyPathCollection;

      if (!ignore) {
        setCountyPaths(data);
      }
    }

    loadCountyPaths().catch((error) => {
      console.error("Could not load county path file.", error);
    });

    return () => {
      ignore = true;
    };
  }, []);

  if (!countyPaths) {
    return <div className="map-loading">Loading county boundaries...</div>;
  }

  return (
    <div className="county-map-shell">
      <div className="county-map-frame">
        <svg
          viewBox={`0 0 ${countyPaths.width} ${countyPaths.height}`}
          className="county-map"
          role="img"
          aria-label="California county heat risk map"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setTooltip(null)}
        >
          {countyPaths.counties.map((county) => {
            const countyRecord = countySummaries.find((record) => {
              return (
                record.countyFips === county.countyFips &&
                record.year === selectedYear
              );
            });

            const fill = getCountyFill(
              county.countyFips,
              selectedCountyFips,
              countySummaries,
              selectedYear
            );

            return (
              <path
                key={county.countyFips}
                d={county.path}
                fill={fill}
                stroke="#0d1117"
                strokeWidth={0.8}
                className="county-shape"
                onClick={() => onCountyChange(county.countyFips)}
                onMouseMove={(event) => {
                  if (!countyRecord) {
                    setTooltip(null);
                    return;
                  }

                  setTooltip({
                    countyName: county.countyName,
                    predictedEdRate: countyRecord.predictedEdRate,
                    riskLevel: countyRecord.riskLevel,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              >
                <title>{county.countyName}</title>
              </path>
            );
          })}
        </svg>

        {tooltip ? (
          <div
            className="map-tooltip"
            style={{
              left: `${tooltip.x + 12}px`,
              top: `${tooltip.y + 12}px`,
            }}
          >
            <strong>{tooltip.countyName}</strong>
            <span>Predicted ED rate: {tooltip.predictedEdRate.toFixed(1)}</span>
            <span>Risk level: {tooltip.riskLevel}</span>
          </div>
        ) : null}
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-swatch selected"></span>
          <span>Selected county</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch high"></span>
          <span>High risk in current mock data</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch medium"></span>
          <span>Medium risk in current mock data</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch low"></span>
          <span>Low risk in current mock data</span>
        </div>
      </div>
    </div>
  );
}

export default CountyMap;
