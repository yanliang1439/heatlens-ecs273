# Frontend Data Contract

Working draft for Team C mock data and early UI development.

## 1. Purpose

This document describes the temporary data shapes used by the frontend while backend and ML components are still being built. The goal is to let the React/D3 frontend move forward with mock data first, then swap in real API responses later with minimal UI rewrites.

This is not meant to be a strict backend spec. It is a lightweight contract for frontend development and integration.

## 2. Why This Exists

- The proposal commits us to 4 linked views, a what-if simulator, and counterfactual SHAP.
- The 14-day plan has Team C starting UI work before all live endpoints and model outputs are ready.
- Because of that, the frontend needs a simple mock-data structure that is close to the expected final outputs.

If backend or ML outputs use different field names later, Team C can add a small transform layer instead of rewriting the views.

## 3. Shared Assumptions

- Primary geographic unit is `county`.
- Time unit is `year`.
- County records should include both a readable county name and a stable ID when possible.
- Numeric values should be plain numbers, not formatted strings.
- Missing values should be `null`.
- Frontend mock values may be placeholders during early development.

## 4. View-Level Data Shapes

### 4.1 Map Overview Data

Used for the county choropleth, hover tooltip, and year filtering.

Suggested fields:

- `countyName`
- `countyFips`
- `year`
- `predictedEdRate`
- `observedEdRate`
- `riskLevel`

Example:

```json
{
  "countyName": "Sacramento",
  "countyFips": "06067",
  "year": 2022,
  "predictedEdRate": 14.2,
  "observedEdRate": 13.8,
  "riskLevel": "high"
}
```

### 4.2 County Detail Data

Used when a county is selected. This supports the climate-feature detail view and the selected county summary.

Suggested fields:

- `countyName`
- `countyFips`
- `year`
- `predictedEdRate`
- `observedEdRate`
- `climateFeatures`
- `vulnerabilityFeatures`

`climateFeatures` may include:

- `summerAvgMax`
- `heatwaveDays`
- `consecutiveHotDays`
- `warmNightCount`
- `tailPercentileTemp`

`vulnerabilityFeatures` may include:

- `elderlyPct`
- `povertyPct`
- `acCoverage`
- `treeCanopy`

Example:

```json
{
  "countyName": "Sacramento",
  "countyFips": "06067",
  "year": 2022,
  "predictedEdRate": 14.2,
  "observedEdRate": 13.8,
  "climateFeatures": {
    "summerAvgMax": 96.1,
    "heatwaveDays": 18,
    "consecutiveHotDays": 7,
    "warmNightCount": 24,
    "tailPercentileTemp": 101.4
  },
  "vulnerabilityFeatures": {
    "elderlyPct": 14.7,
    "povertyPct": 11.2,
    "acCoverage": 78.0,
    "treeCanopy": 19.5
  }
}
```

### 4.3 SHAP Breakdown Data

Used for the vulnerability/feature contribution view. The proposal and README describe this as a SHAP-based explanation view.

Suggested fields:

- `countyName`
- `countyFips`
- `year`
- `baseValue`
- `prediction`
- `shapValues`

Each item in `shapValues`:

- `feature`
- `value`
- `shapContribution`

Example:

```json
{
  "countyName": "Sacramento",
  "countyFips": "06067",
  "year": 2022,
  "baseValue": 9.4,
  "prediction": 14.2,
  "shapValues": [
    {
      "feature": "heatwaveDays",
      "value": 18,
      "shapContribution": 2.1
    },
    {
      "feature": "warmNightCount",
      "value": 24,
      "shapContribution": 1.4
    },
    {
      "feature": "acCoverage",
      "value": 78.0,
      "shapContribution": -0.8
    }
  ]
}
```

### 4.4 Counterfactual Simulator Data

Used for the what-if simulator. This should show the original prediction, the updated prediction, and how SHAP contributions change after an intervention.

Suggested fields:

- `countyName`
- `countyFips`
- `year`
- `originalPrediction`
- `updatedPrediction`
- `interventions`
- `originalShapValues`
- `updatedShapValues`
- `shapDelta`

`interventions` may include:

- `acCoverageChange`
- `treeCanopyChange`

Each item in `shapDelta`:

- `feature`
- `delta`

Example:

```json
{
  "countyName": "Sacramento",
  "countyFips": "06067",
  "year": 2022,
  "originalPrediction": 14.2,
  "updatedPrediction": 12.9,
  "interventions": {
    "acCoverageChange": 5,
    "treeCanopyChange": 3
  },
  "shapDelta": [
    {
      "feature": "acCoverage",
      "delta": -0.6
    },
    {
      "feature": "treeCanopy",
      "delta": -0.4
    }
  ]
}
```

## 5. Temporary Frontend Liberties

While backend and ML are still in progress, Team C may:

- use handcrafted mock values
- use only a subset of counties for testing
- use placeholder SHAP values with realistic positive and negative ranges
- simulate counterfactual updates locally before the real endpoint exists

These are temporary development choices and should be replaced during integration.

## 6. Integration Preference

Preferred outcome:

- backend and ML outputs stay close to these field names and shapes

Fallback outcome:

- Team C writes a small adapter layer between API/model output and UI components

## 7. Expected Change Areas

The following may still change later:

- exact feature list
- exact SHAP formatting
- final intervention parameter names
- whether some values come from one combined endpoint or multiple smaller endpoints

## 8. Main Goal

The main goal of this contract is to let frontend development continue in parallel without waiting on every backend or ML dependency first.
