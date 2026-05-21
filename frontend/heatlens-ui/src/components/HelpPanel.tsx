type HelpPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function HelpPanel(props: HelpPanelProps) {
  const { isOpen, onClose } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="help-overlay" onClick={onClose}>
      <aside
        className="help-panel"
        onClick={(event) => {
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
              In the current frontend, the simulator still uses placeholder
              local logic. The selected county context is real to the dashboard,
              but the intervention response is not yet a live backend
              counterfactual calculation.
            </p>
          </section>

          <section className="help-section">
            <h3>Current Data Source</h3>
            <p>
              The first three views currently use ML export snapshot files. That
              means the frontend is no longer using hand-written mock records
              for those panels.
            </p>
            <p>
              However, some upstream ML inputs may still be synthetic or
              provisional depending on the state of the team pipeline, so this
              dashboard should still be read as an in-progress project build.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default HelpPanel;
