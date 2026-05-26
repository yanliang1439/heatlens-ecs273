from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# =========================
# FastAPI setup
# =========================
app = FastAPI(
    title="HeatLens API",
    description="Backend API for HeatLens visual analytics system",
    version="1.0.0",
)

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for class project demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Data paths
# =========================
BASE_DIR = Path(__file__).resolve().parents[2]

# Use the newest processed panel
PANEL_FILE = BASE_DIR / "data" / "processed" / "county_year_panel_with_tree_canopy_ac.csv"

# If this file does not exist yet, use one of these instead:
# PANEL_FILE = BASE_DIR / "data" / "processed" / "county_year_panel_with_tree_canopy.csv"
# PANEL_FILE = BASE_DIR / "data" / "processed" / "county_year_panel.csv"


def load_panel() -> pd.DataFrame:
    if not PANEL_FILE.exists():
        raise FileNotFoundError(f"Cannot find panel file: {PANEL_FILE}")

    df = pd.read_csv(PANEL_FILE)

    if "year" in df.columns:
        df["year"] = df["year"].astype(int)

    return df


panel_df = load_panel()


def clean_json_value(value):
    """Convert NaN values to None for valid JSON."""
    if pd.isna(value):
        return None
    return value


def dataframe_to_json_records(df: pd.DataFrame):
    records = df.to_dict(orient="records")
    return [
        {key: clean_json_value(value) for key, value in row.items()}
        for row in records
    ]


@app.get("/")
def home():
    return {
        "message": "HeatLens FastAPI backend is running",
        "available_endpoints": [
            "/api/health",
            "/api/counties",
            "/api/years",
            "/api/panel",
            "/api/county/{county_name}",
            "/api/map?year=2024",
            "/api/features/{county_name}/{year}",
            "/api/summary",
        ],
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "panel_file": str(PANEL_FILE),
        "rows": int(len(panel_df)),
        "counties": int(panel_df["county_name"].nunique())
        if "county_name" in panel_df.columns
        else None,
        "years": sorted(panel_df["year"].dropna().unique().astype(int).tolist())
        if "year" in panel_df.columns
        else [],
    }


@app.get("/api/counties")
def get_counties():
    return sorted(panel_df["county_name"].dropna().unique().tolist())


@app.get("/api/years")
def get_years():
    return sorted(panel_df["year"].dropna().unique().astype(int).tolist())


@app.get("/api/panel")
def get_panel(
    year: Optional[int] = Query(default=None),
    county: Optional[str] = Query(default=None),
):
    """
    Return full county-year panel.
    Optional query examples:
      /api/panel?year=2024
      /api/panel?county=Sacramento
      /api/panel?year=2024&county=Sacramento
    """
    df = panel_df.copy()

    if year is not None:
        df = df[df["year"] == year]

    if county is not None:
        df = df[df["county_name"].str.lower() == county.lower()]

    return dataframe_to_json_records(df)


@app.get("/api/county/{county_name}")
def get_county_data(county_name: str):
    """
    Return all years for one county.
    Example:
      /api/county/Sacramento
    """
    df = panel_df[
        panel_df["county_name"].str.lower() == county_name.lower()
    ].copy()

    if df.empty:
        raise HTTPException(status_code=404, detail=f"County not found: {county_name}")

    df = df.sort_values("year")
    return dataframe_to_json_records(df)


@app.get("/api/map")
def get_map_data(year: Optional[int] = Query(default=None)):
    """
    Return county-level data for map visualization.
    Example:
      /api/map?year=2024
    """
    if year is None:
        year = int(panel_df["year"].max())

    df = panel_df[panel_df["year"] == year].copy()

    columns_to_keep = [
        "county_name",
        "year",
        "heat_ed_rate",
        "avg_summer_tmax_f",
        "heatwave_days",
        "hot_nights",
        "max_consecutive_hot_days",
        "median_household_income",
        "pct_65_plus",
        "pct_poverty",
        "tree_canopy_pct",
        "ac_coverage_pct",
        "no_ac_pct",
    ]

    existing_cols = [col for col in columns_to_keep if col in df.columns]
    df = df[existing_cols]

    return dataframe_to_json_records(df)


@app.get("/api/features/{county_name}/{year}")
def get_features(county_name: str, year: int):
    """
    Return one county-year row.
    Example:
      /api/features/Sacramento/2024
    """
    df = panel_df[
        (panel_df["county_name"].str.lower() == county_name.lower())
        & (panel_df["year"] == year)
    ].copy()

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for {county_name}, {year}",
        )

    row = df.iloc[0].to_dict()
    return {key: clean_json_value(value) for key, value in row.items()}


@app.get("/api/summary")
def get_summary():
    summary = {
        "num_rows": int(len(panel_df)),
        "num_counties": int(panel_df["county_name"].nunique()),
        "years": sorted(panel_df["year"].dropna().unique().astype(int).tolist()),
    }

    if "heat_ed_rate" in panel_df.columns:
        summary["heat_ed_rate"] = {
            "min": clean_json_value(panel_df["heat_ed_rate"].min()),
            "max": clean_json_value(panel_df["heat_ed_rate"].max()),
            "mean": clean_json_value(panel_df["heat_ed_rate"].mean()),
        }

    if "tree_canopy_pct" in panel_df.columns:
        summary["tree_canopy_pct"] = {
            "min": clean_json_value(panel_df["tree_canopy_pct"].min()),
            "max": clean_json_value(panel_df["tree_canopy_pct"].max()),
            "mean": clean_json_value(panel_df["tree_canopy_pct"].mean()),
        }

    if "ac_coverage_pct" in panel_df.columns:
        summary["ac_coverage_pct"] = {
            "min": clean_json_value(panel_df["ac_coverage_pct"].min()),
            "max": clean_json_value(panel_df["ac_coverage_pct"].max()),
            "mean": clean_json_value(panel_df["ac_coverage_pct"].mean()),
        }

    return summary