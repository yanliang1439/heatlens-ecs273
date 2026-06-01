type HelpPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function HelpPanel(props: HelpPanelProps) {
  const { isOpen, onClose } = props;

  // The help drawer is the lightweight explanation layer for model and health terms.
  if (!isOpen) {
    return null;
  }

  return (
    <div className="help-overlay" onClick={onClose}>
      <aside
        className="help-panel"
        onClick={(event) => {
          // Let the drawer stay open when the user clicks inside it.
          event.stopPropagation();
        }}
      >
        <div className="help-header">
          <div>
            <p className="panel-tag">Help</p>
            <h2>Glossary and Method Notes</h2>
          </div>
          <button type="button" className="help-close-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="help-content">
          <section className="help-section">
            <h3>Risk and ED Rate</h3>
            <p>
              <strong>ED rate</strong> means the rate of heat-related emergency
              department visits for a county-year record.
            </p>
            <p>
              <strong>Predicted ED rate</strong> is the model's estimate based
              on climate and vulnerability features.
            </p>
            <p>
              <strong>Low / Medium / High risk</strong> is a simple category
              based on where the predicted ED rate falls relative to the rest of
              the county-year records in the current dataset.
            </p>
          </section>

          <section className="help-section">
            <h3>Map Overview</h3>
            <p>
              The map is the overview view. It answers: which counties look
              riskier in the selected year, and which county should I inspect
              next?
            </p>
            <p>
              Clicking a county updates the other panels so the dashboard stays
              focused on one county-year at a time.
            </p>
          </section>

          <section className="help-section">
            <h3>Climate and Vulnerability Features</h3>
            <p>
              <strong>Climate features</strong> describe heat conditions such as
              average summer temperature, heatwave days, and warm nights.
            </p>
            <p>
              <strong>Vulnerability features</strong> describe county
              characteristics that may affect sensitivity to heat, such as
              elderly population share, poverty share, AC coverage, and tree
              canopy.
            </p>
            <p>
              Feature values are shown in their original units. Higher is not
              always better or worse by itself; the SHAP panel helps explain how
              each feature affects the prediction for the selected county.
            </p>
          </section>

          <section className="help-section">
            <h3>SHAP Breakdown</h3>
            <p>
              SHAP values explain how each feature pushes the selected
              prediction up or down relative to the model's base value.
            </p>
            <p>
              A positive SHAP value such as <strong>+2.1</strong> means that
              feature pushes the prediction higher. A negative value such as
              <strong> -0.8</strong> means it pushes the prediction lower.
            </p>
            <p>
              The feature value shown beside each SHAP contribution is the
              actual county value the model saw for that record.
            </p>
          </section>

          <section className="help-section">
            <h3>What-If Simulator</h3>
            <p>
              The simulator asks: if AC coverage or tree canopy increased, how
              might the predicted ED rate change?
            </p>
            <p>
              When the backend is available, the simulator sends the selected
              county, year, and intervention changes to the live counterfactual
              route and shows the returned prediction update.
            </p>
            <p>
              If that route is unavailable, the frontend falls back to a simple
              local estimate so the panel still stays usable during a demo.
            </p>
          </section>

          <section className="help-section">
            <h3>Current Data Source</h3>
            <p>
              When the backend is running, the selected county prediction,
              feature detail, SHAP breakdown, and what-if result come from the
              API.
            </p>
            <p>
              The map still relies on the exported county summary snapshot for
              its year-by-year overview, and the app can fall back to local
              files if the backend is down.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default HelpPanel;
