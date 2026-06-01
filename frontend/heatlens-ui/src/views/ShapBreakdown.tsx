import type { ShapBreakdownRecord } from "../types/dataTypes";
import { formatFeatureLabel, formatSignedNumber } from "../utils/formatters";

type ShapBreakdownProps = {
  shapBreakdown: ShapBreakdownRecord;
};

function ShapBreakdown(props: ShapBreakdownProps) {
  const { shapBreakdown } = props;

  const orderedValues = [...shapBreakdown.shapValues].sort((left, right) => {
    return Math.abs(right.shapContribution) - Math.abs(left.shapContribution);
  });
  const maxContribution = Math.max(
    ...orderedValues.map((item) => Math.abs(item.shapContribution))
  );

  return (
    <section className="view-panel">
      <div className="shap-shell">
        <div className="panel-header">
          <div>
            <p className="panel-tag">View 3</p>
            <h2>SHAP Breakdown</h2>
          </div>
        </div>

        <div className="shap-summary">
          <div className="summary-box">
            <span>Base value</span>
            <strong>{shapBreakdown.baseValue.toFixed(1)}</strong>
          </div>
          <div className="summary-box">
            <span>Prediction</span>
            <strong>{shapBreakdown.prediction.toFixed(1)}</strong>
          </div>
        </div>

        <p className="panel-copy">
          Compare which features are pushing the selected county's prediction
          upward or downward the most.
        </p>

        <div className="shap-list">
          {orderedValues.map((item) => {
            const directionClass =
              item.shapContribution >= 0
                ? "shap-row positive"
                : "shap-row negative";
            const barWidth = `${(Math.abs(item.shapContribution) / maxContribution) * 100}%`;

            return (
              <div key={item.feature} className={directionClass}>
                <div className="shap-copy">
                  <strong>{formatFeatureLabel(item.feature)}</strong>
                  <p>Feature value: {item.value}</p>
                  <div className="shap-meter">
                    <div
                      className="shap-meter-fill"
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>
                <strong>{formatSignedNumber(item.shapContribution)}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ShapBreakdown;
