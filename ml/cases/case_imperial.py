"""Case Study 1 — Imperial County (FIPS 06025).

Imperial is the hottest, lowest-AC, lowest-tree-canopy county in the panel,
so it's the natural extreme case for testing whether mitigation interventions
move the needle. This script produces:

  1. Imperial's predicted ED rate trajectory 2017-2022
  2. Average SHAP attribution across those years -> top drivers
  3. AC intervention sweep on 2022 (the headline year)
  4. Tree canopy intervention sweep on 2022
  5. Combined low-cost intervention (AC+5, Tree+5)

Output: ml/outputs/case_imperial.json
        Report §6 (Case Studies) consumes this directly.

Run from ml/:
    python cases/case_imperial.py
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

import joblib
import numpy as np
import pandas as pd
import shap

from counterfactual_shap import counterfactual_shap
from schema import CLIMATE_FEATURES, FEATURE_COLUMNS, VULNERABILITY_FEATURES

PANEL_PATH = HERE / "data" / "panel.csv"
MODEL_PATH = HERE / "models" / "xgb_model.pkl"
OUT_PATH = HERE / "outputs" / "case_imperial.json"

IMPERIAL_FIPS = "06025"
HEADLINE_YEAR = 2022


def _load():
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    model = joblib.load(MODEL_PATH)
    explainer = shap.TreeExplainer(model)
    return df, model, explainer


def trajectory(df, model, explainer):
    """Per-year prediction + SHAP for Imperial 2017-2022."""
    imp = df[df["countyFips"] == IMPERIAL_FIPS].sort_values("year").reset_index(drop=True)
    X = imp[FEATURE_COLUMNS]
    preds = model.predict(X)
    shap_vals = explainer.shap_values(X)

    rows = []
    for i, row in imp.iterrows():
        contribs = [
            {"feature": f, "shapContribution": round(float(shap_vals[i, j]), 3)}
            for j, f in enumerate(FEATURE_COLUMNS)
        ]
        rows.append({
            "year": int(row["year"]),
            "observedEdRate":  round(float(row["observedEdRate"]), 2),
            "predictedEdRate": round(float(preds[i]), 2),
            "topDrivers": sorted(contribs, key=lambda d: abs(d["shapContribution"]), reverse=True)[:5],
        })
    return rows, imp, shap_vals


def average_drivers(imp_df: pd.DataFrame, shap_vals: np.ndarray):
    """Mean SHAP per feature across Imperial's 6 years.

    Ranks features by how much they push Imperial's risk above the panel
    baseline, on average. Stable across years -> structural driver, not
    just a one-year anomaly.
    """
    means = shap_vals.mean(axis=0)
    return sorted(
        [
            {
                "feature": f,
                "meanShap": round(float(means[j]), 3),
                "meanValue": round(float(imp_df[f].mean()), 2),
            }
            for j, f in enumerate(FEATURE_COLUMNS)
        ],
        key=lambda d: abs(d["meanShap"]),
        reverse=True,
    )


def intervention_sweep(df, model, explainer, year, key, deltas):
    """Sweep a single intervention key across multiple delta levels."""
    row = df[(df["countyFips"] == IMPERIAL_FIPS) & (df["year"] == year)].iloc[0]
    return [
        {
            "intervention": {key: d},
            **{
                k: counterfactual_shap(model, explainer, row, {key: d})[k]
                for k in ("originalPrediction", "updatedPrediction", "predictionDelta")
            },
        }
        for d in deltas
    ]


def main():
    df, model, explainer = _load()
    print(f"Imperial County (FIPS {IMPERIAL_FIPS}) case study\n")

    # 1. Trajectory + top drivers per year
    traj, imp_df, imp_shap = trajectory(df, model, explainer)
    print("Year-by-year:")
    for r in traj:
        print(f"  {r['year']}  obs={r['observedEdRate']:5.2f}  pred={r['predictedEdRate']:5.2f}  "
              f"top driver: {r['topDrivers'][0]['feature']} ({r['topDrivers'][0]['shapContribution']:+.2f})")

    # 2. Averaged drivers — structural story for the report
    drivers = average_drivers(imp_df, imp_shap)
    print("\nAveraged SHAP drivers (2017-2022 mean):")
    for d in drivers[:5]:
        print(f"  {d['feature']:<22} meanShap={d['meanShap']:+.3f}   meanValue={d['meanValue']}")

    # 3-5. Intervention sweeps on the headline year
    ac_sweep   = intervention_sweep(df, model, explainer, HEADLINE_YEAR, "acCoverageChange", [0, 5, 10, 15, 20])
    tree_sweep = intervention_sweep(df, model, explainer, HEADLINE_YEAR, "treeCanopyChange", [0, 5, 10, 15])

    # Combined intervention — the policy-relevant one
    row_2022 = df[(df["countyFips"] == IMPERIAL_FIPS) & (df["year"] == HEADLINE_YEAR)].iloc[0]
    combined = counterfactual_shap(
        model, explainer, row_2022,
        {"acCoverageChange": 5, "treeCanopyChange": 5},
    )

    print(f"\nAC intervention on {HEADLINE_YEAR}:")
    for s in ac_sweep:
        print(f"  +{int(s['intervention']['acCoverageChange']):>3} pp -> pred={s['updatedPrediction']:5.2f}  "
              f"({s['predictionDelta']:+.2f})")

    print(f"\nTree-canopy intervention on {HEADLINE_YEAR}:")
    for s in tree_sweep:
        print(f"  +{int(s['intervention']['treeCanopyChange']):>3} pp -> pred={s['updatedPrediction']:5.2f}  "
              f"({s['predictionDelta']:+.2f})")

    print(f"\nCombined (AC+5, Tree+5) on {HEADLINE_YEAR}: "
          f"{combined['originalPrediction']:.2f} -> {combined['updatedPrediction']:.2f} "
          f"({combined['predictionDelta']:+.2f})")

    payload = {
        "county": "Imperial",
        "countyFips": IMPERIAL_FIPS,
        "summary": {
            "yearsAnalyzed": [r["year"] for r in traj],
            "averagePredictedEdRate": round(
                float(np.mean([r["predictedEdRate"] for r in traj])), 2
            ),
            "headlineYear": HEADLINE_YEAR,
        },
        "trajectory": traj,
        "averagedDrivers": drivers,
        "interventions": {
            "acSweep": ac_sweep,
            "treeSweep": tree_sweep,
            "combined": combined,
        },
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved -> {OUT_PATH}")


if __name__ == "__main__":
    main()
