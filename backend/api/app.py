from pathlib import Path
import sys
import json

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# ============================================================
# Paths
# ============================================================
BASE_DIR = Path(__file__).resolve().parents[2]

# Allow import from project root
sys.path.insert(0, str(BASE_DIR))

PANEL_FILE = BASE_DIR / "data" / "processed" / "county_year_panel_with_tree_canopy_ac.csv"

COUNTY_SUMMARIES_FILE = BASE_DIR / "ml" / "outputs" / "county_summaries.json"
SHAP_BREAKDOWNS_FILE = BASE_DIR / "ml" / "outputs" / "shap_breakdowns.json"

# ============================================================
# ML import and artifact loading
# ============================================================
try:
    from ml.counterfactual_shap import counterfactual_shap, _load_artifacts

    # Load once at startup, not per request
    ml_panel_df, ml_model, ml_explainer = _load_artifacts()
    COUNTERFACTUAL_AVAILABLE = True

except Exception as e:
    counterfactual_shap = None
    ml_panel_df = None
    ml_model = None
    ml_explainer = None
    COUNTERFACTUAL_AVAILABLE = False
    COUNTERFACTUAL_IMPORT_ERROR = str(e)

# ============================================================
# Flask setup
# ============================================================
app = Flask(__name__)
CORS(app)

# ============================================================
# Helper functions
# ============================================================
def clean_json_value(value):
    """Convert NaN values into None for valid JSON."""
    if isinstance(value, dict):
        return {k: clean_json_value(v) for k, v in value.items()}

    if isinstance(value, list):
        return [clean_json_value(v) for v in value]

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    return value


def dataframe_to_json_records(df):
    records = df.to_dict(orient="records")
    return [clean_json_value(row) for row in records]


def clean_county_fips(value):
    """Keep leading zero, e.g. 6025 -> 06025."""
    return str(value).strip().zfill(5)


def load_panel():
    if not PANEL_FILE.exists():
        raise FileNotFoundError(f"Cannot find panel file: {PANEL_FILE}")

    df = pd.read_csv(PANEL_FILE)

    if "year" in df.columns:
        df["year"] = df["year"].astype(int)

    # Normalize FIPS column if available
    if "countyFips" in df.columns:
        df["countyFips"] = df["countyFips"].apply(clean_county_fips)

    elif "county_fips" in df.columns:
        df["countyFips"] = df["county_fips"].apply(clean_county_fips)

    elif "county_fips_acs" in df.columns:
        df["countyFips"] = df["county_fips_acs"].apply(clean_county_fips)

    return df


def load_json_records(path: Path):
    if not path.exists():
        return []

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in ["data", "records", "results"]:
            if key in data and isinstance(data[key], list):
                return data[key]

    return []


def find_json_record(records, county_fips, year):
    county_fips = clean_county_fips(county_fips)
    year = int(year)

    for record in records:
        record_fips = clean_county_fips(record.get("countyFips", ""))
        record_year = int(record.get("year"))

        if record_fips == county_fips and record_year == year:
            return clean_json_value(record)

    return None


# ============================================================
# Load data once at startup
# ============================================================
panel_df = load_panel()
county_summaries = load_json_records(COUNTY_SUMMARIES_FILE)
shap_breakdowns = load_json_records(SHAP_BREAKDOWNS_FILE)

# ============================================================
# Basic endpoints
# ============================================================
@app.route("/")
def home():
    return jsonify({
        "message": "HeatLens Flask backend API is running",
        "availableEndpoints": [
            "/api/health",
            "/api/counties",
            "/api/years",
            "/api/panel",
            "/api/map?year=2024",
            "/api/features/<countyFips>/<year>",
            "/api/prediction/<countyFips>/<year>",
            "/api/shap/<countyFips>/<year>",
            "/api/whatif",
            "/api/summary"
        ]
    })


@app.route("/api/health")
def health():
    result = {
        "status": "ok",
        "panelFile": str(PANEL_FILE),
        "countySummariesFile": str(COUNTY_SUMMARIES_FILE),
        "shapBreakdownsFile": str(SHAP_BREAKDOWNS_FILE),
        "countySummariesLoaded": len(county_summaries),
        "shapBreakdownsLoaded": len(shap_breakdowns),
        "counterfactualAvailable": COUNTERFACTUAL_AVAILABLE,
        "rows": int(len(panel_df)),
        "years": sorted(panel_df["year"].dropna().unique().astype(int).tolist())
        if "year" in panel_df.columns else [],
    }

    if "countyFips" in panel_df.columns:
        result["counties"] = int(panel_df["countyFips"].nunique())

    if not COUNTERFACTUAL_AVAILABLE:
        result["counterfactualImportError"] = COUNTERFACTUAL_IMPORT_ERROR

    return jsonify(result)


@app.route("/api/counties")
def get_counties():
    cols = []

    for col in ["countyFips", "county_fips", "county_name", "countyName"]:
        if col in panel_df.columns:
            cols.append(col)

    if cols:
        df = panel_df[cols].drop_duplicates()

        if "countyFips" in df.columns:
            df = df.sort_values("countyFips")
        elif "county_name" in df.columns:
            df = df.sort_values("county_name")

        return jsonify(dataframe_to_json_records(df))

    return jsonify([])


@app.route("/api/years")
def get_years():
    years = sorted(panel_df["year"].dropna().unique().astype(int).tolist())
    return jsonify(years)


@app.route("/api/panel")
def get_panel():
    """
    Optional:
      /api/panel?year=2024
      /api/panel?countyFips=06025
    """
    df = panel_df.copy()

    year = request.args.get("year")
    county_fips = request.args.get("countyFips")

    if year is not None:
        df = df[df["year"] == int(year)]

    if county_fips is not None and "countyFips" in df.columns:
        county_fips = clean_county_fips(county_fips)
        df = df[df["countyFips"] == county_fips]

    return jsonify(dataframe_to_json_records(df))


@app.route("/api/map")
def get_map_data():
    year = request.args.get("year")

    if year is None:
        year = int(panel_df["year"].max())
    else:
        year = int(year)

    df = panel_df[panel_df["year"] == year].copy()

    columns_to_keep = [
        "countyFips",
        "county_name",
        "countyName",
        "year",
        "heat_ed_rate",
        "predictedEdRate",
        "observedEdRate",
        "riskLevel",
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
    return jsonify(dataframe_to_json_records(df[existing_cols]))


@app.route("/api/features/<county_fips>/<int:year>")
def get_features(county_fips, year):
    county_fips = clean_county_fips(county_fips)

    if "countyFips" not in panel_df.columns:
        return jsonify({
            "error": "countyFips column not found in panel file"
        }), 500

    df = panel_df[
        (panel_df["countyFips"] == county_fips)
        & (panel_df["year"] == int(year))
    ].copy()

    if df.empty:
        return jsonify({
            "error": f"No feature data found for countyFips={county_fips}, year={year}"
        }), 404

    return jsonify(clean_json_value(df.iloc[0].to_dict()))


@app.route("/api/summary")
def get_summary():
    summary = {
        "numRows": int(len(panel_df)),
        "years": sorted(panel_df["year"].dropna().unique().astype(int).tolist()),
    }

    if "countyFips" in panel_df.columns:
        summary["numCounties"] = int(panel_df["countyFips"].nunique())

    for col in [
        "heat_ed_rate",
        "tree_canopy_pct",
        "ac_coverage_pct",
        "avg_summer_tmax_f",
        "heatwave_days",
    ]:
        if col in panel_df.columns:
            summary[col] = {
                "min": clean_json_value(panel_df[col].min()),
                "max": clean_json_value(panel_df[col].max()),
                "mean": clean_json_value(panel_df[col].mean()),
            }

    return jsonify(summary)


# ============================================================
# ML endpoints
# ============================================================
@app.route("/api/prediction/<county_fips>/<int:year>")
def get_prediction(county_fips, year):
    """
    Reads:
      ml/outputs/county_summaries.json

    Expected fields:
      countyName, countyFips, year, predictedEdRate, observedEdRate, riskLevel
    """
    if not county_summaries:
        return jsonify({
            "error": "county_summaries.json not found or empty",
            "expectedFile": str(COUNTY_SUMMARIES_FILE)
        }), 404

    record = find_json_record(county_summaries, county_fips, year)

    if record is None:
        return jsonify({
            "error": f"No prediction found for countyFips={clean_county_fips(county_fips)}, year={year}"
        }), 404

    return jsonify(record)


@app.route("/api/shap/<county_fips>/<int:year>")
def get_shap(county_fips, year):
    """
    Reads:
      ml/outputs/shap_breakdowns.json

    Expected fields:
      countyName, countyFips, year, baseValue, prediction, shapValues[]
    """
    if not shap_breakdowns:
        return jsonify({
            "error": "shap_breakdowns.json not found or empty",
            "expectedFile": str(SHAP_BREAKDOWNS_FILE)
        }), 404

    record = find_json_record(shap_breakdowns, county_fips, year)

    if record is None:
        return jsonify({
            "error": f"No SHAP breakdown found for countyFips={clean_county_fips(county_fips)}, year={year}"
        }), 404

    return jsonify(record)


@app.route("/api/whatif", methods=["POST"])
def run_whatif():
    """
    Expected request:

    {
      "countyFips": "06025",
      "year": 2022,
      "interventions": {
        "acCoverageChange": 0,
        "treeCanopyChange": 5
      }
    }

    Response is exactly what counterfactual_shap() returns.
    """
    if not COUNTERFACTUAL_AVAILABLE:
        return jsonify({
            "error": "counterfactual_shap is not available",
            "details": COUNTERFACTUAL_IMPORT_ERROR
        }), 500

    body = request.get_json()

    if body is None:
        return jsonify({"error": "Missing JSON body"}), 400

    try:
        fips = clean_county_fips(body["countyFips"])
        year = int(body["year"])
    except KeyError as e:
        return jsonify({
            "error": f"Missing required field: {str(e)}"
        }), 400

    interventions = body.get("interventions", {})

    rows = ml_panel_df[
        (ml_panel_df.countyFips.astype(str).str.zfill(5) == fips)
        & (ml_panel_df.year.astype(int) == year)
    ]

    if rows.empty:
        return jsonify({
            "error": f"No row for {fips} {year}"
        }), 404

    try:
        result = counterfactual_shap(
            ml_model,
            ml_explainer,
            rows.iloc[0],
            interventions
        )

        return jsonify(clean_json_value(result))

    except Exception as e:
        return jsonify({
            "error": "counterfactual_shap failed",
            "details": str(e)
        }), 500


# ============================================================
# Run app
# ============================================================
if __name__ == "__main__":
    app.run(debug=True, port=5000)