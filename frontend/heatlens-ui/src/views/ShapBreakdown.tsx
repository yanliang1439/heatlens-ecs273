import type { ShapBreakdownRecord } from "../types/dataTypes";

type ShapBreakdownProps = {
  shapBreakdown: ShapBreakdownRecord;
};

function ShapBreakdown(props: ShapBreakdownProps) {
  const { shapBreakdown } = props;

  const orderedValues = [...shapBreakdown.shapValues].sort((left, right) => {
    return Math.abs(right.shapContribution) - Math.abs(left.shapContribution);
  });

  return (
    <section className="view-panel">
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
        For now this is a simple ranked list. Later we can upgrade it into a
        more visual SHAP chart once the real outputs are stable.
      </p>

      <div className="shap-list">
        {orderedValues.map((item) => {
          const directionClass =
            item.shapContribution >= 0 ? "shap-row positive" : "shap-row negative";

          return (
            <div key={item.feature} className={directionClass}>
              <div>
                <strong>{item.feature}</strong>
                <p>Feature value: {item.value}</p>
              </div>
              <strong>{item.shapContribution.toFixed(1)}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ShapBreakdown;
