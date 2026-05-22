"""Compute SHAP values for the full panel and export three JSON files that
match the frontend's dataTypes.ts record shapes exactly.

Outputs (in ml/outputs/):
    county_summaries.json   CountySummaryRecord[]   <- Map overview view
    county_details.json     CountyDetailRecord[]    <- Feature Detail view
    shap_breakdowns.json    ShapBreakdownRecord[]   <- SHAP Breakdown view

After this runs, Pablo can replace the three exports in
frontend/heatlens-ui/src/data/mockData.ts with these files (drop them into
src/data/, fetch them, done).

Run from ml/:
    python shap_export.py
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import joblib
import numpy as np
import pandas as pd
import shap

from schema import (
    CLIMATE_FEATURES,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    VULNERABILITY_FEATURES,
)

PANEL_PATH = HERE / "data" / "panel.csv"
MODEL_PATH = HERE / "models" / "xgb_model.pkl"
OUT_DIR = HERE / "outputs"

# Risk-level cutoffs are percentile-based on predicted ED across the full panel,
# so a "high" county is one that's worse than 67% of all county-years. Global
# (not year-relative) so that 2022 heatwave shows up with more "high" counties.
LOW_PERCENTILE = 33
HIGH_PERCENTILE = 67


def _risk_level(p: float, low_cut: float, high_cut: float) -> str:
    if p < low_cut:
        return "low"
    if p < high_cut:
        return "medium"
    return "high"


def _round(x, n=2):
    """JSON-safe rounding that also strips numpy types. NaN -> None (JSON null)."""
    if pd.isna(x):
        return None
    return round(float(x), n)


def main():
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    model = joblib.load(MODEL_PATH)
    print(f"Loaded {len(df)} rows + model")

    X = df[FEATURE_COLUMNS]
    predicted = model.predict(X)

    # SHAP TreeExplainer is exact for tree ensembles. expected_value can be a
    # scalar or a 1-element array depending on XGBoost build; normalize.
    explainer = shap.TreeExplainer(model)
    shap_vals = explainer.shap_values(X)  # shape (n_obs, n_features)
    ev = explainer.expected_value
    base_value = float(ev[0]) if hasattr(ev, "__len__") else float(ev)

    # Sanity: prediction ~= base_value + sum(shap_values). SHAP property.
    reconstruction_err = float(np.max(np.abs(predicted - (base_value + shap_vals.sum(axis=1)))))
    print(f"SHAP additivity check: max |pred - (base + sum(shap))| = {reconstruction_err:.6f}")

    low_cut = float(np.percentile(predicted, LOW_PERCENTILE))
    high_cut = float(np.percentile(predicted, HIGH_PERCENTILE))
    print(f"Risk cutoffs (predicted ED rate): low<{low_cut:.2f}  medium<{high_cut:.2f}  else high")

    summaries = []
    details = []
    breakdowns = []

    for i, row in df.reset_index(drop=True).iterrows():
        pred = _round(predicted[i])
        observed = _round(row[TARGET_COLUMN])

        common = {
            "countyName": str(row["countyName"]),
            "countyFips": str(row["countyFips"]),
            "year": int(row["year"]),
        }

        # CountySummaryRecord
        summaries.append({
            **common,
            "predictedEdRate": pred,
            "observedEdRate":  observed,    # synthetic panel has no missing
            "riskLevel":       _risk_level(predicted[i], low_cut, high_cut),
        })

        # CountyDetailRecord — split features into the two groups the
        # frontend expects (CountyFeatureSet = Record<string, number>).
        details.append({
            **common,
            "predictedEdRate": pred,
            "observedEdRate":  observed,
            "climateFeatures": {f: _round(row[f]) for f in CLIMATE_FEATURES},
            "vulnerabilityFeatures": {f: _round(row[f]) for f in VULNERABILITY_FEATURES},
        })

        # ShapBreakdownRecord — all 9 features so the force plot has full data;
        # frontend can sort/filter to top-N for display.
        breakdowns.append({
            **common,
            "baseValue":  _round(base_value),
            "prediction": pred,
            "shapValues": [
                {
                    "feature":          feat,
                    "value":            _round(row[feat]),
                    "shapContribution": _round(shap_vals[i, j], 3),
                }
                for j, feat in enumerate(FEATURE_COLUMNS)
            ],
        })

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, payload in [
        ("county_summaries.json", summaries),
        ("county_details.json",   details),
        ("shap_breakdowns.json",  breakdowns),
    ]:
        path = OUT_DIR / name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"  wrote {len(payload):>4} records -> {path.name}")

    # Sanity print: anchor counties (cross-check vs frontend mockData.ts)
    print("\nAnchor SHAP values (top-3 |contribution| per row, vs mockData):")
    anchor_idx = df.index[
        df["countyFips"].isin(["06067", "06113", "06025"]) & df["year"].isin([2021, 2022])
    ].tolist()
    for i in anchor_idx:
        row = df.loc[i]
        contribs = [(FEATURE_COLUMNS[j], float(shap_vals[i, j])) for j in range(len(FEATURE_COLUMNS))]
        top3 = sorted(contribs, key=lambda kv: abs(kv[1]), reverse=True)[:3]
        top3_str = ", ".join(f"{f}={v:+.2f}" for f, v in top3)
        print(f"  {row['countyName']:<11} {int(row['year'])}  pred={predicted[i]:5.2f}  top3: {top3_str}")


if __name__ == "__main__":
    main()
