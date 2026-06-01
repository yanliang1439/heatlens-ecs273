import { useEffect, useState } from "react";
import { runWhatIf } from "../services/backendApi";
import type {
  CounterfactualRecord,
  CountyDetailRecord,
  ShapBreakdownRecord,
} from "../types/dataTypes";
import { formatFeatureLabel, formatSignedNumber } from "../utils/formatters";

type WhatIfSimulatorProps = {
  countyDetail: CountyDetailRecord;
  shapBreakdown: ShapBreakdownRecord;
  useLiveWhatIf: boolean;
};

function WhatIfSimulator(props: WhatIfSimulatorProps) {
  const { countyDetail, shapBreakdown, useLiveWhatIf } = props;

  const [acCoverageChange, setAcCoverageChange] = useState(0);
  const [treeCanopyChange, setTreeCanopyChange] = useState(0);
  const [liveSimulation, setLiveSimulation] = useState<CounterfactualRecord | null>(null);
  const [whatIfError, setWhatIfError] = useState("");
  const [isLoadingWhatIf, setIsLoadingWhatIf] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadWhatIf() {
      if (!useLiveWhatIf) {
        setLiveSimulation(null);
        setWhatIfError("");
        return;
      }

      setIsLoadingWhatIf(true);
      setWhatIfError("");

      try {
        const result = await runWhatIf({
          countyFips: countyDetail.countyFips,
          year: countyDetail.year,
          interventions: {
            acCoverageChange,
            treeCanopyChange,
          },
        });

        if (isCancelled) {
          return;
        }

        setLiveSimulation(result);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setLiveSimulation(null);
        setWhatIfError("Live what-if request failed. Showing local estimate instead.");
      } finally {
        if (!isCancelled) {
          setIsLoadingWhatIf(false);
        }
      }
    }

    loadWhatIf();

    return () => {
      isCancelled = true;
    };
  }, [
    acCoverageChange,
    countyDetail.countyFips,
    countyDetail.year,
    treeCanopyChange,
    useLiveWhatIf,
  ]);

  const predictionDrop = acCoverageChange * 0.12 + treeCanopyChange * 0.09;
  const localUpdatedPrediction = Math.max(
    0,
    countyDetail.predictedEdRate - predictionDrop
  );

  const localSimulation = {
    updatedPrediction: localUpdatedPrediction,
    predictionChange: localUpdatedPrediction - countyDetail.predictedEdRate,
    shapDelta: [
      {
        feature: "acCoverage",
        delta: -(acCoverageChange * 0.12),
      },
      {
        feature: "treeCanopy",
        delta: -(treeCanopyChange * 0.09),
      },
    ],
  };

  const simulation = liveSimulation
    ? {
        updatedPrediction: liveSimulation.updatedPrediction,
        predictionChange: liveSimulation.predictionDelta,
        shapDelta: liveSimulation.shapDelta,
      }
    : localSimulation;

  const maxDelta = Math.max(
    ...simulation.shapDelta.map((item) => Math.abs(item.delta)),
    0.01
  );

  return (
    <section className="view-panel">
      <div className="simulator-shell">
        <div className="panel-header">
          <div>
            <p className="panel-tag">View 4</p>
            <h2>What-If Simulator</h2>
          </div>
        </div>

        <p className="panel-copy">
          This panel answers the intervention question: if we improve AC
          coverage or tree canopy, how might the prediction change?
        </p>

        {whatIfError ? <p className="panel-copy muted-copy">{whatIfError}</p> : null}

        <div className="summary-strip">
          <div className="summary-chip">
            <span>Starting county</span>
            <strong>{countyDetail.countyName}</strong>
          </div>
          <div className="summary-chip">
            <span>Current base value</span>
            <strong>{shapBreakdown.baseValue.toFixed(1)}</strong>
          </div>
        </div>

        <div className="simulator-grid">
          <div className="simulator-controls">
            <label className="slider-group">
              <span>AC coverage change</span>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={acCoverageChange}
                onChange={(event) =>
                  setAcCoverageChange(Number(event.target.value))
                }
              />
              <strong>+{acCoverageChange}%</strong>
            </label>

            <label className="slider-group">
              <span>Tree canopy change</span>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={treeCanopyChange}
                onChange={(event) =>
                  setTreeCanopyChange(Number(event.target.value))
                }
              />
              <strong>+{treeCanopyChange}%</strong>
            </label>
          </div>

          <div className="simulator-results">
            <div className="before-after-grid">
              <div className="summary-box">
                <span>Original prediction</span>
                <strong>{countyDetail.predictedEdRate.toFixed(1)}</strong>
              </div>
              <div className="summary-box emphasis-box">
                <span>Updated prediction</span>
                <strong>
                  {isLoadingWhatIf ? "..." : simulation.updatedPrediction.toFixed(1)}
                </strong>
              </div>
            </div>

            <div className="summary-box">
              <span>Prediction change</span>
              <strong>
                {isLoadingWhatIf ? "..." : formatSignedNumber(simulation.predictionChange)}
              </strong>
            </div>

            <div className="delta-list">
              {simulation.shapDelta.map((item) => {
                const directionClass =
                  item.delta >= 0 ? "delta-row positive" : "delta-row negative";
                const barWidth = `${(Math.abs(item.delta) / maxDelta) * 100}%`;

                return (
                  <div key={item.feature} className={directionClass}>
                    <div className="delta-copy">
                      <span>{formatFeatureLabel(item.feature)}</span>
                      <div className="delta-meter">
                        <div
                          className="delta-meter-fill"
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>
                    <strong>{formatSignedNumber(item.delta)}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhatIfSimulator;
