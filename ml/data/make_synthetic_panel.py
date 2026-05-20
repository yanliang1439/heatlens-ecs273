"""
Generate a synthetic county-year panel matching the schema the frontend expects.

Schema (must stay identical to whatever A's real-data pipeline emits):

    countyFips         str   "06067" (string with leading zero, matches countyFips in frontend dataTypes.ts)
    countyName         str   "Sacramento"
    year               int   2017..2022
    observedEdRate     float training target (heat-related ED visits, native granularity = county-year)

    # 5 climate features (camelCase, matches mockData.ts)
    summerAvgMax       float summer-averaged daily max temp (degF)
    heatwaveDays       int   days exceeding county-specific heatwave threshold
    consecutiveHotDays int   longest streak of consecutive hot days
    warmNightCount     int   nights with min temp > threshold
    tailPercentileTemp float ~99th-percentile daily max (degF)

    # 4 vulnerability features (camelCase)
    elderlyPct         float % of population aged 65+
    povertyPct         float % of population below poverty line
    acCoverage         float % of households with AC
    treeCanopy         float % tree canopy coverage

Shape: 40 California counties x 6 years (2017-2022) = 240 rows
       This matches the proposal's "40-county training set, ~240 obs" target.

Replacement path:
    Once A's pipeline produces the real panel from NOAA + Tracking California + Census,
    it should write to ml/data/panel.csv with these exact columns. train.py / shap_export.py /
    counterfactual_shap.py read only that path and do not care who produced it.
"""

import numpy as np
import pandas as pd

# 40 California counties with hand-tuned climate_intensity in [0, 1]
# 0 = mild coastal, 1 = hottest desert. Drives temp + heatwave features.
COUNTIES = [
    # (fips, name, climate_intensity)
    ("06001", "Alameda",         0.20),
    ("06013", "Contra Costa",    0.30),
    ("06017", "El Dorado",       0.50),
    ("06019", "Fresno",          0.75),
    ("06023", "Humboldt",        0.05),
    ("06025", "Imperial",        1.00),  # desert, hottest, case study target
    ("06029", "Kern",            0.80),
    ("06031", "Kings",           0.75),
    ("06037", "Los Angeles",     0.45),
    ("06039", "Madera",          0.70),
    ("06041", "Marin",           0.10),
    ("06045", "Mendocino",       0.15),
    ("06047", "Merced",          0.65),
    ("06053", "Monterey",        0.20),
    ("06055", "Napa",            0.35),
    ("06057", "Nevada",          0.45),
    ("06059", "Orange",          0.40),
    ("06061", "Placer",          0.50),
    ("06065", "Riverside",       0.85),
    ("06067", "Sacramento",      0.55),  # in frontend mock, anchor sample
    ("06071", "San Bernardino",  0.85),
    ("06073", "San Diego",       0.35),
    ("06075", "San Francisco",   0.05),
    ("06077", "San Joaquin",     0.60),
    ("06079", "San Luis Obispo", 0.30),
    ("06081", "San Mateo",       0.10),
    ("06083", "Santa Barbara",   0.30),
    ("06085", "Santa Clara",     0.30),
    ("06087", "Santa Cruz",      0.15),
    ("06089", "Shasta",          0.60),
    ("06095", "Solano",          0.40),
    ("06097", "Sonoma",          0.25),
    ("06099", "Stanislaus",      0.65),
    ("06101", "Sutter",          0.55),
    ("06103", "Tehama",          0.55),
    ("06107", "Tulare",          0.70),
    ("06109", "Tuolumne",        0.50),
    ("06111", "Ventura",         0.35),
    ("06113", "Yolo",            0.55),  # in frontend mock, anchor sample
    ("06115", "Yuba",            0.55),
]

YEARS = [2017, 2018, 2019, 2020, 2021, 2022]


def _per_county_vulnerability(rng, fips, ci):
    """Each county has stable demographics that drift slightly across years.

    Hot/inland counties are correlated with lower acCoverage and lower treeCanopy
    (proxying for desert/agricultural counties). Poverty slightly higher in hot
    inland areas. These are stylized, not literal — they exist so XGBoost has
    real signal to learn.
    """
    # Use a deterministic per-county seed so each county's baseline is stable
    cseed = int(fips) + 7
    crng = np.random.default_rng(cseed)
    return {
        "elderlyPct_base":  crng.uniform(11, 19),
        "povertyPct_base":  8 + 12 * ci + crng.normal(0, 2),
        "acCoverage_base":  90 - 20 * ci + crng.normal(0, 4),
        "treeCanopy_base":  30 - 22 * ci + crng.normal(0, 3),
    }


def generate_panel(seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []

    for fips, name, ci in COUNTIES:
        vuln = _per_county_vulnerability(rng, fips, ci)
        base_temp = 75 + 30 * ci  # 75degF coastal -> 105degF desert

        for year in YEARS:
            # Year-level climate anomalies. 2022 is a documented California
            # heatwave year (case study 2), so we bump summer temps and
            # heatwave counts broadly.
            if year == 2022:
                year_temp_anom = rng.normal(2.0, 0.6)
                year_hw_anom = rng.normal(5.0, 1.5)
            else:
                year_temp_anom = rng.normal(0.0, 1.0)
                year_hw_anom = rng.normal(0.0, 2.0)

            summer_avg_max = base_temp + year_temp_anom + rng.normal(0, 0.8)
            heatwave_days = max(0, 2 + 30 * ci + year_hw_anom + rng.normal(0, 2.5))
            consecutive_hot = max(1, 1 + 12 * ci + 0.2 * year_hw_anom + rng.normal(0, 1.2))
            warm_nights = max(0, 5 + 30 * ci + year_hw_anom + rng.normal(0, 3))
            tail_pct_temp = summer_avg_max + 6 + 4 * ci + rng.normal(0, 1.2)

            elderly_pct = np.clip(vuln["elderlyPct_base"] + rng.normal(0, 0.4), 8, 25)
            poverty_pct = np.clip(vuln["povertyPct_base"] + rng.normal(0, 0.4), 4, 27)
            ac_coverage = np.clip(vuln["acCoverage_base"] + rng.normal(0, 1.5), 50, 96)
            tree_canopy = np.clip(vuln["treeCanopy_base"] + rng.normal(0, 0.8), 4, 42)

            # Structural target. Coefficients are tuned so the resulting ED
            # values land in roughly the same range as the frontend mock anchors
            # (Sacramento ~13, Yolo ~10, Imperial ~18).
            ed = (
                5.0
                + 0.18 * heatwave_days
                + 0.10 * warm_nights
                + 0.05 * max(0.0, summer_avg_max - 85.0)
                + 0.25 * (elderly_pct - 13.0)
                + 0.20 * (poverty_pct - 12.0)
                - 0.06 * (ac_coverage - 75.0)
                - 0.10 * (tree_canopy - 18.0)
                + rng.normal(0, 0.9)  # irreducible noise
            )
            # Proposal Section 6: 2020-2021 ED rates have downward bias from
            # pandemic care avoidance. Bake it in so the case-study sensitivity
            # analysis has something to find.
            if year in (2020, 2021):
                ed *= 0.85
            ed = max(2.0, ed)

            rows.append({
                "countyFips":         fips,
                "countyName":         name,
                "year":               year,
                "observedEdRate":     round(float(ed), 2),
                "summerAvgMax":       round(float(summer_avg_max), 2),
                "heatwaveDays":       int(round(heatwave_days)),
                "consecutiveHotDays": int(round(consecutive_hot)),
                "warmNightCount":     int(round(warm_nights)),
                "tailPercentileTemp": round(float(tail_pct_temp), 2),
                "elderlyPct":         round(float(elderly_pct), 2),
                "povertyPct":         round(float(poverty_pct), 2),
                "acCoverage":         round(float(ac_coverage), 2),
                "treeCanopy":         round(float(tree_canopy), 2),
            })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    import sys
    from pathlib import Path

    # Make ml/ importable so schema.py is the single source of truth for
    # column names. Downstream scripts (train.py, shap_export.py, ...) also
    # read FEATURE_COLUMNS from there.
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from schema import FEATURE_COLUMNS, TARGET_COLUMN, ID_COLUMNS

    out_path = Path(__file__).parent / "panel.csv"
    df = generate_panel(seed=42)
    # Column order: IDs, target, then features (climate first, vulnerability second)
    df = df[ID_COLUMNS + [TARGET_COLUMN] + FEATURE_COLUMNS]
    df.to_csv(out_path, index=False)

    print(f"Wrote {len(df)} rows -> {out_path}")
    print(f"Counties: {df['countyFips'].nunique()}   Years: {sorted(df['year'].unique())}")
    print("\nED rate distribution by year:")
    print(df.groupby("year")["observedEdRate"].describe()[["mean", "std", "min", "max"]].round(2))
    print("\nAnchor counties (compare to frontend mockData.ts):")
    anchors = df[df["countyFips"].isin(["06067", "06113", "06025"]) & df["year"].isin([2021, 2022])]
    print(anchors[["countyName", "year", "observedEdRate", "heatwaveDays", "warmNightCount",
                   "acCoverage", "treeCanopy"]].to_string(index=False))
