"""Case Study 2 — Spatial heterogeneity of 2022 heat impact across California.

Original framing was "2022 California heatwave: how much did ED rates rise
statewide?" That question turned out to have a boring answer on A's real
panel: mean lift was only +0.69 ED rate units and only ~60% of counties
saw any rise at all. So the more interesting story is the SHAPE of the
distribution, not its mean.

Reframed question: in 2022, where was the heat impact concentrated, and
where did it spare counties entirely?

Method:
  - Baseline = mean prediction/obs per county across all non-2022 years
    in the panel (2020, 2021, 2023, 2024). Caveat: 2020-2021 carry the
    pandemic ED bias and 2024 is itself anomalously hot (Imperial obs
    spikes to 174.73), so the baseline is a noisy proxy for "normal."
  - For each county compute the 2022 minus baseline lift in both
    predicted and observed ED rates.
  - Quantify the spatial spread: quartiles, range, fraction up vs down,
    correlation between lift and baseline ED level.
  - Aggregate SHAP attribution to identify which features distinguish
    2022 from the baseline at the panel level.

Output: ml/outputs/case_heatwave_2022.json
The intended narrative for report §6.2: California in 2022 was NOT a
statewide heat shock; it was a heterogeneous shock concentrated in
specific counties, which is an argument against static statewide
temperature thresholds and FOR county-level interactive analysis.

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
BASELINE_YEARS = [2020, 2021, 2023, 2024]


def _nan_safe_mean(values):
    arr = np.asarray(values, dtype=float)
    arr = arr[~np.isnan(arr)]
    return float(arr.mean()) if len(arr) else float("nan")


def main():
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    model = joblib.load(MODEL_PATH)
    explainer = shap.TreeExplainer(model)

    X = df[FEATURE_COLUMNS]
    df = df.assign(predicted=model.predict(X))
    shap_vals = explainer.shap_values(X)

    print(f"Loaded {len(df)} rows. Comparing {HEATWAVE_YEAR} vs baseline {BASELINE_YEARS}\n")

    df_2022 = df[df["year"] == HEATWAVE_YEAR]
    df_base = df[df["year"].isin(BASELINE_YEARS)]
    baseline_pred = df_base.groupby("countyFips")["predicted"].mean()
    baseline_obs = df_base.groupby("countyFips")["observedEdRate"].mean()

    county_deltas = []
    for _, row in df_2022.iterrows():
        fips = row["countyFips"]
        pred_lift = float(row["predicted"]) - float(baseline_pred[fips])
        # observedDelta may be NaN if either 2022 obs or baseline obs is missing
        obs_2022 = float(row["observedEdRate"]) if pd.notna(row["observedEdRate"]) else float("nan")
        obs_base = float(baseline_obs[fips]) if pd.notna(baseline_obs[fips]) else float("nan")
        obs_lift = obs_2022 - obs_base if not (np.isnan(obs_2022) or np.isnan(obs_base)) else float("nan")

        county_deltas.append({
            "countyFips": fips,
            "countyName": row["countyName"],
            "predicted2022":     round(float(row["predicted"]), 2),
            "observed2022":      None if np.isnan(obs_2022) else round(obs_2022, 2),
            "predictedBaseline": round(float(baseline_pred[fips]), 2),
            "observedBaseline":  None if np.isnan(obs_base) else round(obs_base, 2),
            "predictedDelta":    round(pred_lift, 2),
            "observedDelta":     None if np.isnan(obs_lift) else round(obs_lift, 2),
        })
    county_deltas.sort(key=lambda d: d["predictedDelta"], reverse=True)

    # ---- Heterogeneity statistics (the main story) ----
    pred_lifts = np.array([d["predictedDelta"] for d in county_deltas])
    obs_lifts_present = [d["observedDelta"] for d in county_deltas if d["observedDelta"] is not None]

    spread = {
        "predictedLift_mean":   round(float(pred_lifts.mean()), 2),
        "predictedLift_median": round(float(np.median(pred_lifts)), 2),
        "predictedLift_std":    round(float(pred_lifts.std(ddof=1)), 2),
        "predictedLift_q25":    round(float(np.percentile(pred_lifts, 25)), 2),
        "predictedLift_q75":    round(float(np.percentile(pred_lifts, 75)), 2),
        "predictedLift_min":    round(float(pred_lifts.min()), 2),
        "predictedLift_max":    round(float(pred_lifts.max()), 2),
        "predictedLift_range":  round(float(pred_lifts.max() - pred_lifts.min()), 2),
        "observedLift_mean":    round(float(np.mean(obs_lifts_present)), 2) if obs_lifts_present else None,
        "observedLift_min":     round(float(np.min(obs_lifts_present)), 2) if obs_lifts_present else None,
        "observedLift_max":     round(float(np.max(obs_lifts_present)), 2) if obs_lifts_present else None,
        "pctCountiesWithPositivePredLift": round(float((pred_lifts > 0).mean()), 3),
        "pctCountiesWithLiftAbove5":       round(float((pred_lifts > 5).mean()), 3),
        "pctCountiesWithLiftBelowMinus5":  round(float((pred_lifts < -5).mean()), 3),
        "nCounties": len(county_deltas),
        "nCountiesWithObserved2022":     int(sum(1 for d in county_deltas if d["observedDelta"] is not None)),
    }

    # Correlation between baseline level and 2022 lift: does 2022 hit
    # already-high-risk counties harder, or spare them?
    baseline_levels = np.array([d["predictedBaseline"] for d in county_deltas])
    corr_lift_vs_baseline = float(np.corrcoef(baseline_levels, pred_lifts)[0, 1])
    spread["corr_predictedLift_vs_predictedBaseline"] = round(corr_lift_vs_baseline, 3)

    # ---- Feature attribution: what feature explains 2022 vs baseline best ----
    mask_2022 = (df["year"] == HEATWAVE_YEAR).values
    mask_base = df["year"].isin(BASELINE_YEARS).values

    shap_2022 = shap_vals[mask_2022].mean(axis=0)
    shap_base = shap_vals[mask_base].mean(axis=0)
    shap_delta = shap_2022 - shap_base

    attribution = sorted(
        [
            {
                "feature":          f,
                "shap2022Mean":     round(float(shap_2022[j]), 3),
                "shapBaselineMean": round(float(shap_base[j]), 3),
                "shapDelta":        round(float(shap_delta[j]), 3),
            }
            for j, f in enumerate(FEATURE_COLUMNS)
        ],
        key=lambda d: abs(d["shapDelta"]),
        reverse=True,
    )

    # ---- Console report ----
    print("=== Heterogeneity statistics ===")
    print(f"  mean predicted lift:        {spread['predictedLift_mean']:+.2f}    "
          f"(median {spread['predictedLift_median']:+.2f})")
    print(f"  std predicted lift:         {spread['predictedLift_std']:.2f}")
    print(f"  IQR predicted lift:         [{spread['predictedLift_q25']:+.2f}, {spread['predictedLift_q75']:+.2f}]")
    print(f"  range predicted lift:       {spread['predictedLift_min']:+.2f} ... {spread['predictedLift_max']:+.2f}  "
          f"(spread {spread['predictedLift_range']:.2f})")
    print(f"  observed lift mean:         {spread['observedLift_mean']} "
          f"(min {spread['observedLift_min']}, max {spread['observedLift_max']}, "
          f"n_with_obs={spread['nCountiesWithObserved2022']})")
    print(f"  pct counties lift > 0:      {spread['pctCountiesWithPositivePredLift']:.1%}")
    print(f"  pct counties lift > +5 ED:  {spread['pctCountiesWithLiftAbove5']:.1%}")
    print(f"  pct counties lift < -5 ED:  {spread['pctCountiesWithLiftBelowMinus5']:.1%}")
    print(f"  corr(lift, baseline ED):    {spread['corr_predictedLift_vs_predictedBaseline']:+.3f}  "
          f"(>0 = high-risk counties hit harder; <0 = spared)")

    print("\nTop-10 counties by predicted 2022 lift (hot spots):")
    print(f"  {'county':<18}{'pred22':>9}{'base':>9}{'Δpred':>9}{'Δobs':>9}")
    print("  " + "-" * 54)
    for d in county_deltas[:10]:
        obs_d = d["observedDelta"] if d["observedDelta"] is not None else float("nan")
        print(f"  {d['countyName']:<18}{d['predicted2022']:>9.2f}{d['predictedBaseline']:>9.2f}"
              f"{d['predictedDelta']:>+9.2f}{obs_d:>+9.2f}")

    print("\nBottom-10 counties by predicted 2022 lift (counties spared / cooling):")
    for d in county_deltas[-10:]:
        obs_d = d["observedDelta"] if d["observedDelta"] is not None else float("nan")
        print(f"  {d['countyName']:<18}{d['predicted2022']:>9.2f}{d['predictedBaseline']:>9.2f}"
              f"{d['predictedDelta']:>+9.2f}{obs_d:>+9.2f}")

    print(f"\n=== Feature attribution: which feature explains 2022 vs baseline ===")
    print(f"  {'feature':<22}{'2022 mean':>12}{'base mean':>12}{'delta':>10}")
    print("  " + "-" * 56)
    for a in attribution:
        print(f"  {a['feature']:<22}{a['shap2022Mean']:>+12.3f}"
              f"{a['shapBaselineMean']:>+12.3f}{a['shapDelta']:>+10.3f}")

    print("\n=== Report narrative summary ===")
    print(f"  2022 was a HETEROGENEOUS shock: {spread['pctCountiesWithLiftAbove5']:.0%} of counties "
          f"saw lift > +5 ED units, {spread['pctCountiesWithLiftBelowMinus5']:.0%} saw < -5.")
    print(f"  Hottest county: {county_deltas[0]['countyName']} ({county_deltas[0]['predictedDelta']:+.2f})")
    print(f"  Most-spared:    {county_deltas[-1]['countyName']} ({county_deltas[-1]['predictedDelta']:+.2f})")
    corr = spread["corr_predictedLift_vs_predictedBaseline"]
    if corr > 0.2:
        print(f"  Correlation +{corr:.2f}: already-high-risk counties were hit DISPROPORTIONATELY harder.")
    elif corr < -0.2:
        print(f"  Correlation {corr:.2f}: high-risk counties were SPARED; low-baseline counties saw the shock.")
    else:
        print(f"  Correlation {corr:+.2f}: 2022 lift is roughly INDEPENDENT of baseline risk -- the shock pattern is "
              "not just an amplification of existing risk.")
    print(f"  Dominant explanatory feature: {attribution[0]['feature']} (ΔSHAP {attribution[0]['shapDelta']:+.3f})")

    payload = {
        "heatwaveYear":      HEATWAVE_YEAR,
        "baselineYears":     BASELINE_YEARS,
        "heterogeneityStats": spread,
        "countyDeltas":      county_deltas,
        "featureAttribution": attribution,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved -> {OUT_PATH}")


if __name__ == "__main__":
    main()
