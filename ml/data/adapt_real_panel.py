"""Adapt A's real-data panel into the schema downstream ML scripts expect.

Reads:  data/processed/county_year_panel_with_tree_canopy_ac.csv  (A's output)
Writes: ml/data/panel.csv                                         (contract path)

What this script does:
  1. Rename columns to camelCase per schema.py
  2. Convert county_fips int (6001) -> 5-char string with leading zero ("06001")
  3. Preserve rows with missing heat_ed_rate (target) so the frontend can
     still show predictions for unlabeled counties

All features are now REAL data — no synthesis. treeCanopy from NLCD,
acCoverage from US Census LACE (Local Air Conditioning Estimates, 2023).

Caveats to disclose in the report:
  - acCoverage is from LACE, an EXPERIMENTAL modeled product, 2023 only, so the
    2023 value is broadcast across all panel years (AC saturation is ~time-
    invariant over 2020-2024). AC is strongly confounded with climate
    (corr ~0.73 with summer max temp) so it is kept as a predictive feature
    but NOT exposed as a What-if intervention slider.
  - Years 2020-2024 only; 2017-2019 not available.

Run from ml/:
    python data/adapt_real_panel.py
"""

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

import pandas as pd

from schema import CLIMATE_FEATURES, FEATURE_COLUMNS, ID_COLUMNS, TARGET_COLUMN, VULNERABILITY_FEATURES

REAL_CSV_PATH = HERE.parent / "data" / "processed" / "county_year_panel_with_tree_canopy_ac.csv"
OUT_PATH = HERE / "data" / "panel.csv"

# Maps A's column names -> our schema. Bonus columns (median_income, pct_renter,
# pct_white, etc.) are dropped here — they could become future features if the
# team decides to extend the feature set, but it's out of scope right now.
COLUMN_RENAMES = {
    "county_name":              "countyName",
    "year":                     "year",
    "avg_summer_tmax_f":        "summerAvgMax",
    "p99_tmax_f":               "tailPercentileTemp",
    "heatwave_days":            "heatwaveDays",
    "hot_nights":               "warmNightCount",
    "max_consecutive_hot_days": "consecutiveHotDays",
    "pct_65_plus":              "elderlyPct",
    "pct_poverty":              "povertyPct",
    "tree_canopy_pct":          "treeCanopy",
    "ac_coverage_pct":          "acCoverage",
    "heat_ed_rate":             "observedEdRate",
}


def main():
    df_raw = pd.read_csv(REAL_CSV_PATH)
    print(f"Loaded real panel: {df_raw.shape}")

    keep_cols = list(COLUMN_RENAMES.keys())
    df = df_raw[keep_cols].rename(columns=COLUMN_RENAMES).copy()

    # countyFips: int -> zero-padded string ("06001")
    df["countyFips"] = df_raw["county_fips"].astype(int).astype(str).str.zfill(5)

    # treeCanopy and acCoverage now come from REAL data via COLUMN_RENAMES
    # (tree_canopy_pct from NLCD; ac_coverage_pct from US Census LACE 2023, an
    # experimental modeled product). LACE is 2023-only, so the same value is
    # broadcast across panel years 2020-2024 — AC saturation is ~time-invariant
    # over this span, unlike climate. No more synthesis.

    # Reorder per schema contract
    df = df[ID_COLUMNS + [TARGET_COLUMN] + FEATURE_COLUMNS]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f"\nWrote -> {OUT_PATH}  ({len(df)} rows, {len(df.columns)} cols)")

    # Diagnostics
    print(f"\nYears: {sorted(df['year'].unique())}")
    print(f"Counties: {df['countyFips'].nunique()}")
    n_obs = df[TARGET_COLUMN].notna().sum()
    print(f"observedEdRate: {n_obs}/{len(df)} non-null, "
          f"range {df[TARGET_COLUMN].min():.2f} - {df[TARGET_COLUMN].max():.2f}")

    n_ac = df["acCoverage"].notna().sum()
    n_tree = df["treeCanopy"].notna().sum()
    print(f"acCoverage:  {n_ac}/{len(df)} non-null")
    print(f"treeCanopy:  {n_tree}/{len(df)} non-null")

    print("\nReal AC/tree by climate type (first row per county):")
    sample = (
        df.drop_duplicates("countyFips")
          .sort_values("summerAvgMax")
          [["countyName", "summerAvgMax", "acCoverage", "treeCanopy"]]
    )
    print("  --- Coolest 5 ---")
    print(sample.head(5).to_string(index=False))
    print("  --- Hottest 5 ---")
    print(sample.tail(5).to_string(index=False))


if __name__ == "__main__":
    main()
