"""Counterfactual SHAP — the project's named novelty.

Given a (county, year) baseline row and an intervention dict like
{"acCoverageChange": +5, "treeCanopyChange": +3}, this module:

  1. Predicts ED rate on the original feature vector
  2. Applies the intervention deltas to the relevant features (clipped to
     valid ranges)
  3. Predicts ED rate on the modified vector
  4. Computes SHAP values on BOTH vectors via the same TreeExplainer
  5. Returns the per-feature SHAP delta (shapDelta = shap_modified - shap_original)

The output dict matches frontend-data-contract.md §4.4 ("Counterfactual
Simulator Data") so Pablo's WhatIfSimulator view can consume it directly,
replacing the temporary `predictionDrop = ac*0.12 + tree*0.09` formula.

Run from ml/:
    python counterfactual_shap.py
        -> generates ml/outputs/counterfactual_examples.json (canned scenarios)
        -> generates ml/outputs/counterfactual_types.ts (TS interface for Pablo)
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import joblib
import pandas as pd
import shap

from schema import FEATURE_COLUMNS

PANEL_PATH = HERE / "data" / "panel.csv"
MODEL_PATH = HERE / "models" / "xgb_model.pkl"
OUT_DIR = HERE / "outputs"

# Slider keys -> underlying feature column. Adding a new intervention slider
# (e.g. an "elderlyPctChange" slider for a demographic shift case study) only
# requires extending this map.
INTERVENTION_TO_FEATURE = {
    "acCoverageChange": "acCoverage",
    "treeCanopyChange": "treeCanopy",
}

# Realistic clip bounds per feature, so dragging a slider to extreme values
# doesn't produce impossible inputs (e.g. negative AC coverage).
FEATURE_BOUNDS = {
    "acCoverage": (0.0, 100.0),
    "treeCanopy": (0.0, 100.0),
}


def apply_interventions(feature_values: dict, interventions: dict) -> dict:
    """Return a new dict with intervention deltas applied (and clipped)."""
    out = dict(feature_values)
    for key, delta in interventions.items():
        if key not in INTERVENTION_TO_FEATURE:
            raise ValueError(
                f"Unknown intervention '{key}'. Add it to INTERVENTION_TO_FEATURE."
            )
        feat = INTERVENTION_TO_FEATURE[key]
        new_val = out[feat] + float(delta)
        if feat in FEATURE_BOUNDS:
            lo, hi = FEATURE_BOUNDS[feat]
            new_val = max(lo, min(hi, new_val))
        out[feat] = new_val
    return out


def _base_value(explainer) -> float:
    ev = explainer.expected_value
    return float(ev[0]) if hasattr(ev, "__len__") else float(ev)


def counterfactual_shap(model, explainer, county_row: pd.Series, interventions: dict) -> dict:
    """Core function. Returns a dict matching frontend-data-contract §4.4.

    Args:
        model:        Fitted XGBRegressor (or any sklearn-compatible regressor
                      whose .predict() takes a DataFrame).
        explainer:    shap.TreeExplainer wrapping `model`.
        county_row:   One row of the panel as a pandas Series. Must contain
                      countyFips, countyName, year, and all FEATURE_COLUMNS.
        interventions: dict like {"acCoverageChange": +5, "treeCanopyChange": +3}.
                      Keys must be in INTERVENTION_TO_FEATURE.
    """
    x_orig_vals = {f: float(county_row[f]) for f in FEATURE_COLUMNS}
    x_new_vals = apply_interventions(x_orig_vals, interventions)

    x_orig_df = pd.DataFrame([[x_orig_vals[f] for f in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
    x_new_df = pd.DataFrame([[x_new_vals[f] for f in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)

    pred_orig = float(model.predict(x_orig_df)[0])
    pred_new = float(model.predict(x_new_df)[0])

    # Same TreeExplainer for both -> same baseline -> deltas are directly
    # comparable. This is the entire mathematical claim of the method.
    shap_orig = explainer.shap_values(x_orig_df)[0]
    shap_new = explainer.shap_values(x_new_df)[0]

    base_value = _base_value(explainer)

    def _shap_records(values_dict, shap_row):
        return [
            {
                "feature": f,
                "value": round(values_dict[f], 2),
                "shapContribution": round(float(shap_row[i]), 3),
            }
            for i, f in enumerate(FEATURE_COLUMNS)
        ]

    return {
        "countyName":         str(county_row["countyName"]),
        "countyFips":         str(county_row["countyFips"]),
        "year":               int(county_row["year"]),
        "originalPrediction": round(pred_orig, 2),
        "updatedPrediction":  round(pred_new, 2),
        "predictionDelta":    round(pred_new - pred_orig, 2),
        "interventions":      {k: float(v) for k, v in interventions.items()},
        "baseValue":          round(base_value, 2),
        "originalShapValues": _shap_records(x_orig_vals, shap_orig),
        "updatedShapValues":  _shap_records(x_new_vals,  shap_new),
        "shapDelta": [
            {"feature": f, "delta": round(float(shap_new[i] - shap_orig[i]), 3)}
            for i, f in enumerate(FEATURE_COLUMNS)
        ],
    }


# ---- TypeScript type to drop into frontend/heatlens-ui/src/types/dataTypes.ts ----
TS_INTERFACE = """\
// Append to frontend/heatlens-ui/src/types/dataTypes.ts.
// Matches ml/counterfactual_shap.py output and frontend-data-contract.md §4.4.

export type ShapDeltaRecord = {
  feature: string;
  delta: number;
};

export type CounterfactualRecord = {
  countyName: string;
  countyFips: string;
  year: number;
  originalPrediction: number;
  updatedPrediction: number;
  predictionDelta: number;
  interventions: {
    acCoverageChange?: number;
    treeCanopyChange?: number;
  };
  baseValue: number;
  originalShapValues: ShapValueRecord[];
  updatedShapValues: ShapValueRecord[];
  shapDelta: ShapDeltaRecord[];
};
"""


def _load_artifacts():
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    model = joblib.load(MODEL_PATH)
    explainer = shap.TreeExplainer(model)
    return df, model, explainer


def _row(df, fips, year):
    rows = df[(df["countyFips"] == fips) & (df["year"] == year)]
    if rows.empty:
        raise KeyError(f"No panel row for fips={fips} year={year}")
    return rows.iloc[0]


# Canned scenarios for the What-if view to demo against without needing a
# running backend. Each scenario is chosen to tell a story for the report.
CANNED_SCENARIOS = [
    {
        "label": "imperial_2022_baseline",
        "description": "Imperial 2022 with zero intervention — sanity check (deltas should be ~0).",
        "fips": "06025", "year": 2022,
        "interventions": {"acCoverageChange": 0, "treeCanopyChange": 0},
    },
    {
        "label": "imperial_2022_ac_plus_10",
        "description": "Case study 1: massive AC expansion (+10 pp) in hottest, lowest-AC county.",
        "fips": "06025", "year": 2022,
        "interventions": {"acCoverageChange": 10, "treeCanopyChange": 0},
    },
    {
        "label": "imperial_2022_tree_plus_5",
        "description": "Imperial 2022 modest tree canopy expansion (+5 pp) in a desert county that starts near 4%.",
        "fips": "06025", "year": 2022,
        "interventions": {"acCoverageChange": 0, "treeCanopyChange": 5},
    },
    {
        "label": "imperial_2022_combined",
        "description": "Imperial 2022 combined: AC +5, trees +3.",
        "fips": "06025", "year": 2022,
        "interventions": {"acCoverageChange": 5, "treeCanopyChange": 3},
    },
    {
        "label": "sacramento_2022_ac_plus_5",
        "description": "Sacramento 2022 + AC +5pp. Sacramento already has ~77% AC, expect smaller drop.",
        "fips": "06067", "year": 2022,
        "interventions": {"acCoverageChange": 5, "treeCanopyChange": 0},
    },
    {
        "label": "yolo_2022_tree_plus_8",
        "description": "Yolo 2022 + tree canopy +8pp. Tests whether tree intervention matters in a moderate-temp county.",
        "fips": "06113", "year": 2022,
        "interventions": {"acCoverageChange": 0, "treeCanopyChange": 8},
    },
]


def main():
    df, model, explainer = _load_artifacts()
    print(f"Loaded panel ({len(df)} rows) + model + explainer")

    results = []
    print("\nScenario sweep:")
    print(f"  {'label':<35}{'origPred':>10}{'newPred':>10}{'delta':>8}")
    print(f"  {'-'*35}{'-'*10}{'-'*10}{'-'*8}")

    for scen in CANNED_SCENARIOS:
        row = _row(df, scen["fips"], scen["year"])
        out = counterfactual_shap(model, explainer, row, scen["interventions"])
        out["scenarioLabel"] = scen["label"]
        out["scenarioDescription"] = scen["description"]
        results.append(out)
        print(f"  {scen['label']:<35}{out['originalPrediction']:>10.2f}"
              f"{out['updatedPrediction']:>10.2f}{out['predictionDelta']:>+8.2f}")

    out_json = OUT_DIR / "counterfactual_examples.json"
    out_json.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {len(results)} scenarios -> {out_json.name}")

    out_ts = OUT_DIR / "counterfactual_types.ts"
    out_ts.write_text(TS_INTERFACE, encoding="utf-8")
    print(f"Wrote TS interface (paste into Pablo's dataTypes.ts) -> {out_ts.name}")

    # Spot-check that the headline scenario (Imperial AC+10) gives a sensible
    # signed shapDelta. The intervention raises acCoverage, so acCoverage's
    # SHAP contribution should move DOWN (it's a protective feature).
    headline = next(r for r in results if r["scenarioLabel"] == "imperial_2022_ac_plus_10")
    ac_delta = next(d["delta"] for d in headline["shapDelta"] if d["feature"] == "acCoverage")
    print(f"\nSanity: Imperial 2022 AC+10 -> acCoverage shapDelta = {ac_delta:+.3f}  "
          f"(expect negative — more AC reduces predicted ED)")


if __name__ == "__main__":
    main()
