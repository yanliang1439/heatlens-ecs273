"""Bootstrap SHAP stability test.

Question: if the training set had been slightly different, would the SHAP
feature ranking change? This script answers it with 20 bootstrap resamples.

For each of N_BOOTSTRAPS iterations:
  1. Sample 240 rows with replacement (panel size unchanged)
  2. Refit XGBoost
  3. Compute SHAP values on the FIXED original panel
  4. Record mean |SHAP| per feature

Then report per-feature mean / std / CV across the bootstraps. Low CV
(< ~0.2) means the feature's importance is robust to data noise; high CV
means the ranking is sensitive.

Output: ml/outputs/shap_stability.json

Run from ml/:
    python bootstrap_shap.py
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import numpy as np
import pandas as pd
import shap

from schema import FEATURE_COLUMNS, TARGET_COLUMN
from train import make_model

PANEL_PATH = HERE / "data" / "panel.csv"
OUT_PATH = HERE / "outputs" / "shap_stability.json"

N_BOOTSTRAPS = 20
SEED = 42


def main():
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    n_raw = len(df)
    df = df[df[TARGET_COLUMN].notna()].reset_index(drop=True)
    if len(df) < n_raw:
        print(f"Filtered out {n_raw - len(df)} rows with missing {TARGET_COLUMN}")
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    print(f"Loaded {len(df)} rows. Running {N_BOOTSTRAPS} bootstrap resamples...")

    rng = np.random.default_rng(SEED)
    # Rows x features matrix of mean |SHAP| per bootstrap iter.
    mean_abs_shap = np.zeros((N_BOOTSTRAPS, len(FEATURE_COLUMNS)))

    for b in range(N_BOOTSTRAPS):
        idx = rng.integers(0, len(df), size=len(df))
        X_b, y_b = X.iloc[idx], y.iloc[idx]

        model = make_model()
        model.fit(X_b, y_b)

        # SHAP on the FIXED original panel — this is what we want stability
        # of (the explanation of the same population), not the explanation of
        # the bootstrap sample.
        shap_vals = shap.TreeExplainer(model).shap_values(X)
        mean_abs_shap[b] = np.abs(shap_vals).mean(axis=0)
        print(f"  iter {b+1:>2}/{N_BOOTSTRAPS}: done")

    # Per-feature stability stats
    feature_stats = []
    for j, f in enumerate(FEATURE_COLUMNS):
        vals = mean_abs_shap[:, j]
        m = float(vals.mean())
        s = float(vals.std(ddof=1))
        feature_stats.append({
            "feature": f,
            "meanAbsShap":   round(m, 4),
            "stdAbsShap":    round(s, 4),
            "cv":            round(s / m, 4) if m > 0 else None,
            "rankRange":     None,  # filled below
        })

    # How does each feature's RANK vary across bootstraps?
    # Compute rank (1 = largest mean |SHAP|) per iter, then range per feature.
    ranks = np.zeros_like(mean_abs_shap, dtype=int)
    for b in range(N_BOOTSTRAPS):
        order = np.argsort(-mean_abs_shap[b])  # descending
        for rank, j in enumerate(order, start=1):
            ranks[b, j] = rank
    for j, stats in enumerate(feature_stats):
        rmin, rmax = int(ranks[:, j].min()), int(ranks[:, j].max())
        stats["rankRange"] = [rmin, rmax]
        stats["rankMode"]  = int(np.bincount(ranks[:, j]).argmax())

    # Sort by mean for readable output (most important first)
    feature_stats.sort(key=lambda d: d["meanAbsShap"], reverse=True)

    print(f"\n{'Feature':<22}{'mean|SHAP|':>12}{'std':>10}{'CV':>8}  rank range")
    print("-" * 68)
    for s in feature_stats:
        print(f"{s['feature']:<22}{s['meanAbsShap']:>12.3f}{s['stdAbsShap']:>10.3f}"
              f"{s['cv']:>8.3f}  [{s['rankRange'][0]:>2}, {s['rankRange'][1]:>2}]")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps({
            "nBootstraps": N_BOOTSTRAPS,
            "seed": SEED,
            "panelRows": int(len(df)),
            "featureStability": feature_stats,
        }, indent=2),
        encoding="utf-8",
    )
    print(f"\nSaved -> {OUT_PATH}")

    # Quick interpretation
    high_cv = [s for s in feature_stats if s["cv"] is not None and s["cv"] > 0.2]
    if high_cv:
        print(f"\nFeatures with CV > 0.2 (less robust):")
        for s in high_cv:
            print(f"  {s['feature']}  CV={s['cv']:.2f}")
    else:
        print("\nAll features have CV <= 0.2 -> SHAP ranking is robust.")


if __name__ == "__main__":
    main()
