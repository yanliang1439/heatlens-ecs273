import type { CountyDetailRecord } from "../types/dataTypes";

type FeatureDetailProps = {
  countyDetail: CountyDetailRecord;
};

function FeatureDetail(props: FeatureDetailProps) {
  const { countyDetail } = props;

  const climateFeatures = Object.entries(countyDetail.climateFeatures);
  const vulnerabilityFeatures = Object.entries(
    countyDetail.vulnerabilityFeatures
  );

  return (
    <section className="view-panel">
      <div className="panel-header">
        <div>
          <p className="panel-tag">View 2</p>
          <h2>Feature Detail</h2>
        </div>
      </div>

      <p className="panel-copy">
        These values are coming from mock county detail records for now. Later
        this panel can turn into a chart, but right now it answers the simple
        question: what does the model know about this county?
      </p>

      <div className="feature-section">
        <p className="feature-group-label">Climate</p>
        <h3>Climate Features</h3>
        <div className="feature-list">
          {climateFeatures.map(([featureName, value]) => (
            <div key={featureName} className="feature-row">
              <span>{featureName}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="feature-section">
        <p className="feature-group-label">Vulnerability</p>
        <h3>Vulnerability Features</h3>
        <div className="feature-list">
          {vulnerabilityFeatures.map(([featureName, value]) => (
            <div key={featureName} className="feature-row">
              <span>{featureName}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureDetail;
