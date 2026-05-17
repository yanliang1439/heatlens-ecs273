import { geoMercator, geoPath } from "d3";
import { useEffect, useState } from "react";
import type { CountySummaryRecord } from "../types/dataTypes";

type CountyGeoFeature = {
  type: "Feature";
  properties: {
    countyName: string;
    countyFips: string;
  };
  geometry: unknown;
};

type CountyGeoCollection = {
  type: "FeatureCollection";
  features: CountyGeoFeature[];
};

type CountyMapProps = {
  countySummaries: CountySummaryRecord[];
  selectedCountyFips: string;
  selectedYear: number;
  onCountyChange: (countyFips: string) => void;
};

const mapWidth = 760;
const mapHeight = 430;

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
  const [countyGeoJson, setCountyGeoJson] = useState<CountyGeoCollection | null>(
    null
  );

  useEffect(() => {
    let ignore = false;

    async function loadCountyData() {
      const response = await fetch("/data/california-counties.json");
      const data = (await response.json()) as CountyGeoCollection;

      if (!ignore) {
        setCountyGeoJson(data);
      }
    }

    loadCountyData().catch((error) => {
      console.error("Could not load county boundary file.", error);
    });

    return () => {
      ignore = true;
    };
  }, []);

  if (!countyGeoJson) {
    return <div className="map-loading">Loading county boundaries...</div>;
  }

  const projection = geoMercator().fitExtent(
    [
      [18, 18],
      [mapWidth - 18, mapHeight - 18],
    ],
    countyGeoJson as never
  );

  const pathBuilder = geoPath(projection);

  return (
    <div className="county-map-shell">
      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="county-map"
        role="img"
        aria-label="California county heat risk map"
      >
        {countyGeoJson.features.map((feature) => {
          const pathValue = pathBuilder(feature as never);

          if (!pathValue) {
            return null;
          }

          const { countyFips, countyName } = feature.properties;
          const fill = getCountyFill(
            countyFips,
            selectedCountyFips,
            countySummaries,
            selectedYear
          );

          return (
            <path
              key={countyFips}
              d={pathValue}
              fill={fill}
              stroke="#0d1117"
              strokeWidth={1}
              className="county-shape"
              onClick={() => onCountyChange(countyFips)}
            >
              <title>{countyName}</title>
            </path>
          );
        })}
      </svg>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-swatch selected"></span>
          <span>Selected county</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch high"></span>
          <span>High risk</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch medium"></span>
          <span>Medium risk</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch low"></span>
          <span>Low risk</span>
        </div>
      </div>
    </div>
  );
}

export default CountyMap;
