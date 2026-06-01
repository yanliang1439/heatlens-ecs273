import type { CountyDetailRecord } from "../types/dataTypes";
import { formatFeatureLabel, formatFeatureValue } from "../utils/formatters";

type FeatureDetailProps = {
  countyDetail: CountyDetailRecord;
};

function FeatureDetail(props: FeatureDetailProps) {
  const { countyDetail } = props;

  const climateFeatures = Object.entries(countyDetail.climateFeatures).map(
    ([featureName, value]) => ({
      featureName,
      label: formatFeatureLabel(featureName),
      value,
    })
  );

  const vulnerabilityFeatures = Object.entries(
    countyDetail.vulnerabilityFeatures
  ).map(([featureName, value]) => ({
    featureName,
    label: formatFeatureLabel(featureName),
    value,
  }));

  // This panel splits the selected county into climate drivers and vulnerability drivers.
  const allFeatureValues = [...climateFeatures, ...vulnerabilityFeatures];
  // Use one scale so the bars stay visually comparable across both groups.
  const maxValue = Math.max(...allFeatureValues.map((feature) => feature.value));

  return (
    <section className="view-panel">
      <div className="feature-detail-shell">
        <div className="panel-header">
          <div>
            <p className="panel-tag">View 2</p>
            <h2>Feature Detail</h2>
          </div>
        </div>

        <p className="panel-copy">
          Review the climate and vulnerability values associated with the
          selected county.
        </p>

        <div className="summary-strip">
          <div className="summary-chip">
            <span>Observed ED rate</span>
            <strong>{countyDetail.observedEdRate?.toFixed(1) ?? "N/A"}</strong>
          </div>
          <div className="summary-chip">
            <span>Predicted ED rate</span>
            <strong>{countyDetail.predictedEdRate.toFixed(1)}</strong>
          </div>
        </div>

        <div className="feature-sections">
          <div className="feature-section">
            <p className="feature-group-label">Climate</p>
            <h3>Climate Features</h3>
            <div className="feature-list">
              {climateFeatures.map((feature) => (
                <div key={feature.featureName} className="feature-row">
                  <div className="feature-copy">
                    <div className="feature-row-top">
                      <span>{feature.label}</span>
                      <strong>
                        {formatFeatureValue(feature.featureName, feature.value)}
                      </strong>
                    </div>
                    <div className="feature-meter">
                      <div
                        className="feature-meter-fill climate-fill"
                        style={{
                          width: `${(feature.value / maxValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="feature-section">
            <p className="feature-group-label">Vulnerability</p>
            <h3>Vulnerability Features</h3>
            <div className="feature-list">
              {vulnerabilityFeatures.map((feature) => (
                <div key={feature.featureName} className="feature-row">
                  <div className="feature-copy">
                    <div className="feature-row-top">
                      <span>{feature.label}</span>
                      <strong>
                        {formatFeatureValue(feature.featureName, feature.value)}
                      </strong>
                    </div>
                    <div className="feature-meter">
                      <div
                        className="feature-meter-fill vulnerability-fill"
                        style={{
                          width: `${(feature.value / maxValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureDetail;
