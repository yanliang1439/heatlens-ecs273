from pathlib import Path
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# =========================
# Flask setup
# =========================
app = Flask(__name__)
CORS(app)

# =========================
# Data paths
# =========================
BASE_DIR = Path(__file__).resolve().parents[2]

PANEL_FILE = BASE_DIR / "data" / "processed" / "county_year_panel_with_tree_canopy.csv"

# If you already have tree canopy merged, use this instead:
# PANEL_FILE = BASE_DIR / "data" / "processed" / "county_year_panel_with_tree_canopy.csv"


def load_panel():
    if not PANEL_FILE.exists():
        raise FileNotFoundError(f"Cannot find panel file: {PANEL_FILE}")

    df = pd.read_csv(PANEL_FILE)

    if "year" in df.columns:
        df["year"] = df["year"].astype(int)

    return df


panel_df = load_panel()


def clean_json_value(value):
    """
    Convert NaN values to None so Flask can safely return JSON.
    """
    if pd.isna(value):
        return None
    return value


def dataframe_to_json_records(df):
    records = df.to_dict(orient="records")

    cleaned_records = []
    for row in records:
        cleaned_row = {k: clean_json_value(v) for k, v in row.items()}
        cleaned_records.append(cleaned_row)

    return cleaned_records


@app.route("/")
def home():
    return jsonify({
        "message": "HeatLens backend API is running",
        "available_endpoints": [
            "/api/health",
            "/api/counties",
            "/api/years",
            "/api/panel",
            "/api/county/<county_name>",
            "/api/map?year=2024",
            "/api/features/<county_name>/<year>",
            "/api/summary"
        ]
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "rows": int(len(panel_df)),
        "counties": int(panel_df["county_name"].nunique()) if "county_name" in panel_df.columns else None,
        "years": sorted(panel_df["year"].dropna().unique().astype(int).tolist()) if "year" in panel_df.columns else []
    })


@app.route("/api/counties")
def get_counties():
    counties = sorted(panel_df["county_name"].dropna().unique().tolist())
    return jsonify(counties)


@app.route("/api/years")
def get_years():
    years = sorted(panel_df["year"].dropna().unique().astype(int).tolist())
    return jsonify(years)


@app.route("/api/panel")
def get_panel():
    """
    Return full county-year panel.
    Optional query params:
      ?year=2024
      ?county=Sacramento
    """
    df = panel_df.copy()

    year = request.args.get("year")
    county = request.args.get("county")

    if year is not None:
        df = df[df["year"] == int(year)]

    if county is not None:
        df = df[df["county_name"].str.lower() == county.lower()]

    return jsonify(dataframe_to_json_records(df))


@app.route("/api/county/<county_name>")
def get_county_data(county_name):
    """
    Return all years for one county.
    Example:
      /api/county/Sacramento
    """
    df = panel_df[
        panel_df["county_name"].str.lower() == county_name.lower()
    ].copy()

    if df.empty:
        return jsonify({"error": f"County not found: {county_name}"}), 404

    df = df.sort_values("year")

    return jsonify(dataframe_to_json_records(df))


@app.route("/api/map")
def get_map_data():
    """
    Return county-level data for map visualization.
    Example:
      /api/map?year=2024
    """
    year = request.args.get("year")

    if year is None:
        year = int(panel_df["year"].max())
    else:
        year = int(year)

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
        "tree_canopy_pct"
    ]

    existing_cols = [col for col in columns_to_keep if col in df.columns]
    df = df[existing_cols]

    return jsonify(dataframe_to_json_records(df))


@app.route("/api/features/<county_name>/<int:year>")
def get_features(county_name, year):
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
        return jsonify({
            "error": f"No data found for {county_name}, {year}"
        }), 404

    row = df.iloc[0].to_dict()
    row = {k: clean_json_value(v) for k, v in row.items()}

    return jsonify(row)


@app.route("/api/summary")
def get_summary():
    """
    Return basic summary statistics for dashboard.
    """
    summary = {
        "num_rows": int(len(panel_df)),
        "num_counties": int(panel_df["county_name"].nunique()),
        "years": sorted(panel_df["year"].dropna().unique().astype(int).tolist()),
    }

    if "heat_ed_rate" in panel_df.columns:
        summary["heat_ed_rate"] = {
            "min": clean_json_value(panel_df["heat_ed_rate"].min()),
            "max": clean_json_value(panel_df["heat_ed_rate"].max()),
            "mean": clean_json_value(panel_df["heat_ed_rate"].mean())
        }

    if "tree_canopy_pct" in panel_df.columns:
        summary["tree_canopy_pct"] = {
            "min": clean_json_value(panel_df["tree_canopy_pct"].min()),
            "max": clean_json_value(panel_df["tree_canopy_pct"].max()),
            "mean": clean_json_value(panel_df["tree_canopy_pct"].mean())
        }

    return jsonify(summary)


if __name__ == "__main__":
    app.run(debug=True, port=5000)