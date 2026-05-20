"""Case Study 2 — California 2022 heatwave.

Question: which counties were hit hardest in 2022, and which features
explain the 2022 elevation relative to a "normal" year?

Method:
  - Baseline = mean prediction across 2017-2019 per county (pre-pandemic).
    We deliberately exclude 2020-2021 (pandemic ED bias, proposal §6).
  - 2022 elevation = 2022 predicted - baseline, per county.
  - Aggregate SHAP attribution for 2022 vs baseline -> which features
    collectively drove the spike.

Output: ml/outputs/case_heatwave_2022.json

Run from ml/:
    python cases/case_heatwave_2022.py
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

from schema import FEATURE_COLUMNS

PANEL_PATH = HERE / "data" / "panel.csv"
MODEL_PATH = HERE / "models" / "xgb_model.pkl"
OUT_PATH = HERE / "outputs" / "case_heatwave_2022.json"

HEATWAVE_YEAR = 2022
BASELINE_YEARS = [2017, 2018, 2019]  # pre-pandemic normal years


def main():
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    model = joblib.load(MODEL_PATH)
    explainer = shap.TreeExplainer(model)

    X = df[FEATURE_COLUMNS]
    df = df.assign(predicted=model.predict(X))
    shap_vals = explainer.shap_values(X)

    print(f"Loaded {len(df)} rows. Comparing {HEATWAVE_YEAR} vs baseline {BASELINE_YEARS}\n")

    # ---- 1. Per-county 2022 elevation ----
    df_2022 = df[df["year"] == HEATWAVE_YEAR]
    baseline_pred = (
        df[df["year"].isin(BASELINE_YEARS)]
        .groupby("countyFips")["predicted"].mean()
    )
    baseline_obs = (
        df[df["year"].isin(BASELINE_YEARS)]
        .groupby("countyFips")["observedEdRate"].mean()
    )

    county_deltas = []
    for _, row in df_2022.iterrows():
        fips = row["countyFips"]
        county_deltas.append({
            "countyFips": fips,
            "countyName": row["countyName"],
            "predicted2022":        round(float(row["predicted"]), 2),
            "observed2022":         round(float(row["observedEdRate"]), 2),
            "predictedBaseline":    round(float(baseline_pred[fips]), 2),
            "observedBaseline":     round(float(baseline_obs[fips]), 2),
            "predictedDelta":       round(float(row["predicted"]) - float(baseline_pred[fips]), 2),
            "observedDelta":        round(float(row["observedEdRate"]) - float(baseline_obs[fips]), 2),
        })
    county_deltas.sort(key=lambda d: d["predictedDelta"], reverse=True)

    print("Top-10 counties by predicted 2022 elevation:")
    print(f"  {'county':<18}{'pred22':>8}{'base':>8}{'Δpred':>8}{'Δobs':>8}")
    print("  " + "-" * 50)
    for d in county_deltas[:10]:
        print(f"  {d['countyName']:<18}{d['predicted2022']:>8.2f}{d['predictedBaseline']:>8.2f}"
              f"{d['predictedDelta']:>+8.2f}{d['observedDelta']:>+8.2f}")

    print("\nBottom-5 (least affected):")
    for d in county_deltas[-5:]:
        print(f"  {d['countyName']:<18}{d['predicted2022']:>8.2f}{d['predictedBaseline']:>8.2f}"
              f"{d['predictedDelta']:>+8.2f}{d['observedDelta']:>+8.2f}")

    # ---- 2. Feature-level attribution: what drove 2022 up? ----
    mask_2022 = (df["year"] == HEATWAVE_YEAR).values
    mask_base = df["year"].isin(BASELINE_YEARS).values

    shap_2022 = shap_vals[mask_2022].mean(axis=0)
    shap_base = shap_vals[mask_base].mean(axis=0)
    shap_delta = shap_2022 - shap_base

    attribution = sorted(
        [
            {
                "feature":         f,
                "shap2022Mean":    round(float(shap_2022[j]), 3),
                "shapBaselineMean": round(float(shap_base[j]), 3),
                "shapDelta":       round(float(shap_delta[j]), 3),
            }
            for j, f in enumerate(FEATURE_COLUMNS)
        ],
        key=lambda d: abs(d["shapDelta"]),
        reverse=True,
    )

    print(f"\nFeature attribution for 2022 elevation (mean SHAP 2022 - baseline):")
    print(f"  {'feature':<22}{'2022 mean':>12}{'base mean':>12}{'delta':>10}")
    print("  " + "-" * 56)
    for a in attribution:
        print(f"  {a['feature']:<22}{a['shap2022Mean']:>+12.3f}"
              f"{a['shapBaselineMean']:>+12.3f}{a['shapDelta']:>+10.3f}")

    # ---- 3. Headline numbers for the report ----
    pred_lift_mean = float(np.mean([d["predictedDelta"] for d in county_deltas]))
    obs_lift_mean  = float(np.mean([d["observedDelta"]  for d in county_deltas]))
    pct_counties_up = sum(1 for d in county_deltas if d["predictedDelta"] > 0) / len(county_deltas)
    headline = {
        "meanPredictedLift":         round(pred_lift_mean, 2),
        "meanObservedLift":          round(obs_lift_mean,  2),
        "pctCountiesWithPositiveLift": round(pct_counties_up, 3),
        "topCountyByLift":            county_deltas[0]["countyName"],
        "topCountyLiftPredicted":     county_deltas[0]["predictedDelta"],
        "dominantDriver":             attribution[0]["feature"],
        "dominantDriverShapDelta":    attribution[0]["shapDelta"],
    }
    print(f"\nReport headline:")
    for k, v in headline.items():
        print(f"  {k:<32}: {v}")

    payload = {
        "heatwaveYear": HEATWAVE_YEAR,
        "baselineYears": BASELINE_YEARS,
        "nCounties": len(county_deltas),
        "headline": headline,
        "countyDeltas": county_deltas,
        "featureAttribution": attribution,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved -> {OUT_PATH}")


if __name__ == "__main__":
    main()
