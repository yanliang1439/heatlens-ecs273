import { useEffect, useMemo, useState } from "react";
import {
  geoMercator,
  geoPath,
  scaleLinear,
  scaleOrdinal,
  scaleSqrt,
} from "d3";
import type { CountySummaryRecord } from "../types/dataTypes";

type CountyGeometry = {
  type: string;
  coordinates: unknown;
};

type CountyFeature = {
  type: string;
  properties: {
    countyName: string;
    countyFips: string;
  };
  geometry: CountyGeometry;
};

type CountyFeatureCollection = {
  type: string;
  features: CountyFeature[];
};

type CountyMapProps = {
  countySummaries: CountySummaryRecord[];
  selectedCountyFips: string;
  selectedYear: number;
  onCountyChange: (countyFips: string) => void;
  mapMode: "riskLevel" | "predictedEdRate";
};

type TooltipState = {
  countyName: string;
  predictedEdRate: number;
  riskLevel: string;
  x: number;
  y: number;
};

type ProjectedCounty = {
  countyName: string;
  countyFips: string;
  path: string;
};

type ProjectedMap = {
  counties: ProjectedCounty[];
  viewBox: string;
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 760;

// The map color scale matches the low / medium / high overview used in the county list.
function getCountyFill(
  countyFips: string,
  selectedCountyFips: string,
  countySummaries: CountySummaryRecord[],
  selectedYear: number,
  mapMode: "riskLevel" | "predictedEdRate",
  predictedScale: (value: number) => string
) {
  const riskColorScale = scaleOrdinal<string, string>()
    .domain(["high", "medium", "low"])
    .range(["#f85149", "#d29922", "#238636"]);

  if (countyFips === selectedCountyFips) {
    return "#2f81f7";
  }

  const countyRecord = countySummaries.find((county) => {
    return county.countyFips === countyFips && county.year === selectedYear;
  });

  // Gray means this county shape exists in the map file, but not in the current year data.
  if (!countyRecord) {
    return "#2d333b";
  }

  if (mapMode === "predictedEdRate") {
    return predictedScale(countyRecord.predictedEdRate);
  }

  return riskColorScale(countyRecord.riskLevel);
}

function CountyMap(props: CountyMapProps) {
  const {
    countySummaries,
    selectedCountyFips,
    selectedYear,
    onCountyChange,
    mapMode,
  } = props;
  const [countyFeatures, setCountyFeatures] = useState<CountyFeatureCollection | null>(
    null
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadCountyFeatures() {
      const response = await fetch("/data/california-counties.json");
      const data = (await response.json()) as CountyFeatureCollection;

      if (!ignore) {
        setCountyFeatures(data);
      }
    }

    // D3 builds the projected SVG paths from the raw county GeoJSON.
    loadCountyFeatures().catch((error) => {
      console.error("Could not load county GeoJSON file.", error);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const countySummaryLookup = useMemo(() => {
    const lookup = new Map<string, CountySummaryRecord>();

    countySummaries.forEach((county) => {
      lookup.set(`${county.countyFips}-${county.year}`, county);
    });

    return lookup;
  }, [countySummaries]);

  const visibleCountySummaries = useMemo(() => {
    return countySummaries.filter((county) => county.year === selectedYear);
  }, [countySummaries, selectedYear]);

  const predictedExtent = useMemo(() => {
    const predictedValues = visibleCountySummaries.map(
      (county) => county.predictedEdRate
    );
    const min = Math.min(...predictedValues);
    const max = Math.max(...predictedValues);
    const roundedMin = Math.floor(min / 10) * 10;
    const roundedMax = Math.ceil(max / 10) * 10;
    return {
      min,
      max,
      roundedMin,
      roundedMax,
    };
  }, [visibleCountySummaries]);

  // D3 implementation note: this optional choropleth view uses a sequential
  // color scale so the value-to-color mapping is explicit, not only categorical.
  const predictedRateScale = useMemo(() => {
    const safeMax =
      predictedExtent.roundedMax || predictedExtent.roundedMin + 1;
    const colorPosition = scaleSqrt()
      .domain([predictedExtent.roundedMin, safeMax])
      .range([0, 1]);
    const colorScale = scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(["#238636", "#d29922", "#f85149"]);

    return (value: number) => colorScale(colorPosition(value));
  }, [predictedExtent]);

  const projectedMap = useMemo<ProjectedMap>(() => {
    if (!countyFeatures) {
      return {
        counties: [],
        viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`,
      };
    }

    const projection = geoMercator().fitExtent(
      [
        [4, 4],
        [MAP_WIDTH - 4, MAP_HEIGHT - 4],
      ],
      countyFeatures as never
    );
    const pathGenerator = geoPath(projection);

    const counties = countyFeatures.features.map((county) => ({
      countyName: county.properties.countyName,
      countyFips: county.properties.countyFips,
      path: pathGenerator(county as never) ?? "",
    }));
    const [[minX, minY], [maxX, maxY]] = pathGenerator.bounds(
      countyFeatures as never
    );
    const padding = 6;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    return {
      counties,
      viewBox: `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`,
    };
  }, [countyFeatures]);

  if (!countyFeatures) {
    return <div className="map-loading">Loading county boundaries...</div>;
  }

  return (
    <div className="county-map-shell">
      <div className="county-map-frame">
        <svg
          viewBox={projectedMap.viewBox}
          className="county-map"
          role="img"
          aria-label="California county heat risk map"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Clicking the map is one of the main entry points into the linked dashboard workflow. */}
          {projectedMap.counties.map((county) => {
            const countyRecord = countySummaryLookup.get(
              `${county.countyFips}-${selectedYear}`
            );

            const fill = getCountyFill(
              county.countyFips,
              selectedCountyFips,
              countySummaries,
              selectedYear,
              mapMode,
              predictedRateScale
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
                onMouseEnter={(event) => {
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
                onMouseMove={(event) => {
                  if (!countyRecord) {
                    setTooltip(null);
                    return;
                  }

                  setTooltip((currentTooltip) => {
                    if (
                      currentTooltip &&
                      currentTooltip.countyName === county.countyName &&
                      currentTooltip.x === event.clientX &&
                      currentTooltip.y === event.clientY
                    ) {
                      return currentTooltip;
                    }

                    return {
                      countyName: county.countyName,
                      predictedEdRate: countyRecord.predictedEdRate,
                      riskLevel: countyRecord.riskLevel,
                      x: event.clientX,
                      y: event.clientY,
                    };
                  });
                }}
              />
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
        {mapMode === "riskLevel" ? (
          <>
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
          </>
        ) : (
          <div className="numeric-legend">
            <span>{predictedExtent.roundedMin.toFixed(0)}</span>
            <div className="numeric-legend-bar" />
            <span>{predictedExtent.roundedMax.toFixed(0)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CountyMap;
