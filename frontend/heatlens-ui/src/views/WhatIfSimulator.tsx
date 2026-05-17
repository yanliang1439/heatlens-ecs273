import { useState } from "react";
import type { CountyDetailRecord, ShapBreakdownRecord } from "../types/dataTypes";

type WhatIfSimulatorProps = {
  countyDetail: CountyDetailRecord;
  shapBreakdown: ShapBreakdownRecord;
};

function WhatIfSimulator(props: WhatIfSimulatorProps) {
  const { countyDetail, shapBreakdown } = props;

  const [acCoverageChange, setAcCoverageChange] = useState(0);
  const [treeCanopyChange, setTreeCanopyChange] = useState(0);

  // This is only a temporary local calculation so we can test the panel
  // before the backend counterfactual route exists.
  const predictionDrop = acCoverageChange * 0.12 + treeCanopyChange * 0.09;
  const updatedPrediction = Math.max(
    0,
    countyDetail.predictedEdRate - predictionDrop
  );

  const simulation = {
    updatedPrediction,
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

  return (
    <section className="view-panel">
      <div className="panel-header">
        <div>
          <p className="panel-tag">View 4</p>
          <h2>What-If Simulator</h2>
        </div>
      </div>

      <p className="panel-copy">
        This panel answers the intervention question: if we improve AC coverage
        or tree canopy, how might the prediction change?
      </p>

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
              onChange={(event) => setAcCoverageChange(Number(event.target.value))}
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
              onChange={(event) => setTreeCanopyChange(Number(event.target.value))}
            />
            <strong>+{treeCanopyChange}%</strong>
          </label>
        </div>

        <div className="simulator-results">
          <div className="summary-box">
            <span>Original prediction</span>
            <strong>{countyDetail.predictedEdRate.toFixed(1)}</strong>
          </div>
          <div className="summary-box">
            <span>Updated prediction</span>
            <strong>{simulation.updatedPrediction.toFixed(1)}</strong>
          </div>
          <div className="summary-box">
            <span>Original base value</span>
            <strong>{shapBreakdown.baseValue.toFixed(1)}</strong>
          </div>

          <div className="delta-list">
            {simulation.shapDelta.map((item) => (
              <div key={item.feature} className="delta-row">
                <span>{item.feature}</span>
                <strong>{item.delta.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhatIfSimulator;
