"""Leave-county-out CV for XGBoost + two baselines, full panel and 2020-2021 sensitivity.

Per proposal:
- §4: LOCO-CV required (spatial correlation in 40-county panel)
- §5: compare XGBoost vs linear regression vs temperature-only threshold
- §6: re-run excluding 2020-2021 (pandemic ED bias) as sensitivity check

Output: ml/outputs/metrics.json -> consumed by report §5 and downstream tooling.

Run from ml/:
    python evaluate.py
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import LeaveOneGroupOut

from schema import FEATURE_COLUMNS, TARGET_COLUMN

PANEL_PATH = HERE / "data" / "panel.csv"
METRICS_PATH = HERE / "outputs" / "metrics.json"


def _xgb_factory():
    # Same hyperparameters as train.py, but fixed n_estimators (no early
    # stopping inside CV folds — would require another inner split).
    # 200 is conservative; train.py's full-fit best_iteration was ~156.
    return xgb.XGBRegressor(
        n_estimators=200,
        max_depth=3,
        learning_rate=0.05,
        min_child_weight=5,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.5,
        reg_lambda=2.0,
        random_state=42,
        eval_metric="rmse",
    )


class TemperatureThresholdBaseline:
    """Two-bucket constant predictor based on summerAvgMax exceeding a threshold.

    Threshold picked by minimizing training MAE over a coarse grid. This is
    the deliberately weak baseline proposal §4 calls out — XGBoost must beat
    it to justify the model's complexity.
    """

    def __init__(self, candidates=None):
        self.candidates = candidates or [80, 85, 88, 90, 92, 95, 98, 100, 102, 105]
        self.threshold_ = None
        self.high_mean_ = None
        self.low_mean_ = None

    def fit(self, X, y):
        temps = X["summerAvgMax"].values
        y = np.asarray(y)
        best_mae = float("inf")
        for t in self.candidates:
            mask = temps > t
            if mask.sum() == 0 or (~mask).sum() == 0:
                continue
            hi, lo = y[mask].mean(), y[~mask].mean()
            pred = np.where(mask, hi, lo)
            mae = np.abs(y - pred).mean()
            if mae < best_mae:
                best_mae = mae
                self.threshold_, self.high_mean_, self.low_mean_ = t, hi, lo
        # Fallback if all candidates split poorly: predict global mean
        if self.threshold_ is None:
            self.threshold_ = float(np.median(temps))
            self.high_mean_ = self.low_mean_ = float(y.mean())
        return self

    def predict(self, X):
        return np.where(
            X["summerAvgMax"].values > self.threshold_,
            self.high_mean_,
            self.low_mean_,
        )


def loco_cv(df: pd.DataFrame, model_factory, label: str) -> dict:
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].values
    groups = df["countyFips"].values
    logo = LeaveOneGroupOut()

    preds = np.full_like(y, fill_value=np.nan, dtype=float)
    for train_idx, test_idx in logo.split(X, y, groups):
        model = model_factory()
        model.fit(X.iloc[train_idx], y[train_idx])
        preds[test_idx] = model.predict(X.iloc[test_idx])

    return {
        "model": label,
        "r2":   float(r2_score(y, preds)),
        "mae":  float(mean_absolute_error(y, preds)),
        "rmse": float(np.sqrt(((y - preds) ** 2).mean())),
        "n_obs": int(len(y)),
        "n_counties": int(df["countyFips"].nunique()),
        "years": sorted(int(yr) for yr in df["year"].unique()),
    }


def evaluate_all(df: pd.DataFrame, suffix: str = "") -> list[dict]:
    return [
        loco_cv(df, _xgb_factory,                f"xgboost{suffix}"),
        loco_cv(df, LinearRegression,            f"linear_regression{suffix}"),
        loco_cv(df, TemperatureThresholdBaseline, f"temp_threshold{suffix}"),
    ]


def _print_table(title: str, results: list[dict]) -> None:
    print(f"\n=== {title} ===")
    print(f"{'Model':<32}{'R2':>8}{'MAE':>8}{'RMSE':>8}{'N':>6}")
    print("-" * 62)
    for r in results:
        print(f"{r['model']:<32}{r['r2']:>8.3f}{r['mae']:>8.3f}{r['rmse']:>8.3f}{r['n_obs']:>6}")


if __name__ == "__main__":
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    print(f"Loaded {len(df)} rows, {df['countyFips'].nunique()} counties, "
          f"years {sorted(df['year'].unique())}")

    results_full = evaluate_all(df, "")
    _print_table("Full panel — LOCO-CV", results_full)

    df_clean = df[~df["year"].isin([2020, 2021])].copy()
    results_clean = evaluate_all(df_clean, "_no_2020_2021")
    _print_table("Sensitivity — excluding 2020–2021 (pandemic ED bias)", results_clean)

    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "panel_rows": int(len(df)),
        "n_counties": int(df["countyFips"].nunique()),
        "results_full": results_full,
        "results_no_pandemic": results_clean,
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"\nSaved -> {METRICS_PATH}")
