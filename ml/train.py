"""Train the production XGBoost model on the full panel and save it.

This script intentionally fits on ALL 240 rows (no holdout): the saved
xgb_model.pkl is the model that powers SHAP export, the counterfactual API,
and case studies. Honest cross-validated performance lives in evaluate.py
(LOCO-CV + baselines).

Hyperparameters mirror the LOCO-CV config so what we evaluate matches what
we ship. n_estimators=200 is conservative for ~240 obs; an earlier 80/20
fit with early stopping converged around iteration 156.

Run from ml/:
    python train.py
"""

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import joblib
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score

from schema import FEATURE_COLUMNS, TARGET_COLUMN

PANEL_PATH = HERE / "data" / "panel.csv"
MODEL_PATH = HERE / "models" / "xgb_model.pkl"


def load_panel(labeled_only: bool = True) -> pd.DataFrame:
    # Read countyFips as string to preserve leading zero (frontend expects "06067").
    df = pd.read_csv(PANEL_PATH, dtype={"countyFips": str})
    if labeled_only:
        before = len(df)
        df = df[df[TARGET_COLUMN].notna()].reset_index(drop=True)
        if len(df) < before:
            print(f"  filtered out {before - len(df)} rows with missing {TARGET_COLUMN}")
    return df


def make_model() -> xgb.XGBRegressor:
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


def train_full(df: pd.DataFrame):
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    model = make_model()
    model.fit(X, y)
    metrics = {
        "n_obs": int(len(df)),
        "in_sample_r2":  float(r2_score(y, model.predict(X))),
        "in_sample_mae": float(mean_absolute_error(y, model.predict(X))),
    }
    return model, metrics


if __name__ == "__main__":
    df = load_panel()
    print(f"Loaded {len(df)} rows from {PANEL_PATH}")

    model, metrics = train_full(df)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model -> {MODEL_PATH}\n")

    print("In-sample fit (NOT a generalization estimate -- see evaluate.py for LOCO-CV):")
    for k, v in metrics.items():
        print(f"  {k:>16}: {v:.4f}" if isinstance(v, float) else f"  {k:>16}: {v}")
