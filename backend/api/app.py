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

PANEL_FILE = BASE_DIR / "data" / "processed" / "county_year_panel_with_tree_canopy_ac.csv"

# ML output files
PREDICTION_FILE = BASE_DIR / "ml" / "outputs" / "predictions.csv"
SHAP_FILE = BASE_DIR / "ml" / "outputs" / "shap_values.csv"


# =========================
# Load data
# =========================
def load_panel():
    if not PANEL_FILE.exists():
        raise FileNotFoundError(f"Cannot find panel file: {PANEL_FILE}")

    df = pd.read_csv(PANEL_FILE)

    if "year" in df.columns:
        df["year"] = df["year"].astype(int)

    return df


def load_optional_csv(path: Path):
    """
    Load optional ML output files.
    If the file does not exist yet, return an empty DataFrame.
    """
    if path.exists():
        df = pd.read_csv(path)

        if "year" in df.columns:
            df["year"] = df["year"].astype(int)

        return df

    return pd.DataFrame()


panel_df = load_panel()
prediction_df = load_optional_csv(PREDICTION_FILE)
shap_df = load_optional_csv(SHAP_FILE)


# =========================
# Helper functions
# =========================
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


def filter_county_year(df, county_name, year):
    return df[
        (df["county_name"].str.lower() == county_name.lower())
        & (df["year"] == int(year))
    ].copy()


# =========================
# Basic API endpoints
# =========================
@app.route("/")
def home():
    return jsonify({
        "message": "HeatLens Flask backend API is running",
        "available_endpoints": [
            "/api/health",
            "/api/counties",
            "/api/years",
            "/api/panel",
            "/api/county/<county_name>",
            "/api/map?year=2024",
            "/api/features/<county_name>/<year>",
            "/api/summary",
            "/api/prediction/<county_name>/<year>",
            "/api/shap/<county_name>/<year>",
            "/api/whatif"
        ]
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "panel_file": str(PANEL_FILE),
        "prediction_file_exists": PREDICTION_FILE.exists(),
        "shap_file_exists": SHAP_FILE.exists(),
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
      /api/panel?year=2024
      /api/panel?county=Sacramento
      /api/panel?year=2024&county=Sacramento
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
        "tree_canopy_pct",
        "ac_coverage_pct",
        "no_ac_pct",
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
    df = filter_county_year(panel_df, county_name, year)

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

    if "ac_coverage_pct" in panel_df.columns:
        summary["ac_coverage_pct"] = {
            "min": clean_json_value(panel_df["ac_coverage_pct"].min()),
            "max": clean_json_value(panel_df["ac_coverage_pct"].max()),
            "mean": clean_json_value(panel_df["ac_coverage_pct"].mean())
        }

    return jsonify(summary)


# =========================
# ML endpoints
# =========================
@app.route("/api/prediction/<county_name>/<int:year>")
def get_prediction(county_name, year):
    """
    Return ML prediction for one county-year.
    Expected file:
      ml/outputs/predictions.csv

    Expected columns:
      county_name, year, predicted_ed_rate, risk_level
    """
    if prediction_df.empty:
        return jsonify({
            "error": "Prediction file not found or empty. Please run the ML pipeline first.",
            "expected_file": str(PREDICTION_FILE)
        }), 404

    df = filter_county_year(prediction_df, county_name, year)

    if df.empty:
        return jsonify({
            "error": f"No prediction found for {county_name}, {year}"
        }), 404

    row = df.iloc[0].to_dict()
    row = {k: clean_json_value(v) for k, v in row.items()}

    return jsonify(row)


@app.route("/api/shap/<county_name>/<int:year>")
def get_shap_values(county_name, year):
    """
    Return SHAP values for one county-year.
    Expected file:
      ml/outputs/shap_values.csv

    Expected columns:
      county_name, year, feature, shap_value, feature_value
    """
    if shap_df.empty:
        return jsonify({
            "error": "SHAP file not found or empty. Please run the ML pipeline first.",
            "expected_file": str(SHAP_FILE)
        }), 404

    df = filter_county_year(shap_df, county_name, year)

    if df.empty:
        return jsonify({
            "error": f"No SHAP values found for {county_name}, {year}"
        }), 404

    if "shap_value" in df.columns:
        df = df.sort_values(
            by="shap_value",
            key=lambda x: x.abs(),
            ascending=False
        )

    return jsonify(dataframe_to_json_records(df))


@app.route("/api/whatif", methods=["POST"])
def run_whatif():
    """
    Placeholder what-if endpoint.

    Frontend sends:
    {
      "county_name": "Sacramento",
      "year": 2024,
      "changes": {
        "tree_canopy_pct": 10,
        "ac_coverage_pct": 5
      }
    }

    This version modifies feature values and returns the modified record.
    Later, this endpoint can call the real ML counterfactual pipeline.
    """
    payload = request.get_json()

    if payload is None:
        return jsonify({"error": "Missing JSON body"}), 400

    county_name = payload.get("county_name")
    year = payload.get("year")
    changes = payload.get("changes", {})

    if county_name is None or year is None:
        return jsonify({
            "error": "county_name and year are required"
        }), 400

    if not isinstance(changes, dict):
        return jsonify({
            "error": "changes must be a dictionary of feature deltas"
        }), 400

    base_df = filter_county_year(panel_df, county_name, int(year))

    if base_df.empty:
        return jsonify({
            "error": f"No data found for {county_name}, {year}"
        }), 404

    base_record = base_df.iloc[0].to_dict()

    # Try to get base prediction from ML output
    base_prediction = None

    if not prediction_df.empty:
        pred_df = filter_county_year(prediction_df, county_name, int(year))

        if not pred_df.empty:
            if "predicted_ed_rate" in pred_df.columns:
                base_prediction = pred_df.iloc[0]["predicted_ed_rate"]
            elif "prediction" in pred_df.columns:
                base_prediction = pred_df.iloc[0]["prediction"]

    # Fallback to observed heat ED rate
    if base_prediction is None:
        base_prediction = base_record.get("heat_ed_rate", None)

    modified_record = base_record.copy()

    changed_features = {}

    for feature, delta in changes.items():
        if feature not in modified_record:
            changed_features[feature] = {
                "status": "not_found",
                "old_value": None,
                "new_value": None,
                "delta": delta
            }
            continue

        old_value = modified_record[feature]

        if pd.isna(old_value):
            changed_features[feature] = {
                "status": "missing_value",
                "old_value": None,
                "new_value": None,
                "delta": delta
            }
            continue

        new_value = old_value + delta
        modified_record[feature] = new_value

        changed_features[feature] = {
            "status": "updated",
            "old_value": clean_json_value(old_value),
            "new_value": clean_json_value(new_value),
            "delta": delta
        }

    return jsonify({
        "county_name": county_name,
        "year": int(year),
        "base_prediction": clean_json_value(base_prediction),
        "changed_features": changed_features,
        "modified_record": {
            key: clean_json_value(value)
            for key, value in modified_record.items()
        },
        "note": (
            "This is a placeholder what-if endpoint. "
            "It updates input feature values but does not yet rerun the ML model. "
            "Connect this endpoint to the final ML counterfactual pipeline later."
        )
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)