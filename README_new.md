# HeatLens

> Visual Analytics for California Heat Health Risk

HeatLens is an interactive visual analytics system that predicts heat-related emergency department (ED) visit rates across California counties and lets users explore how interventions like increased AC coverage or tree canopy could change those predictions.

**Course Project — ECS 273 (Visual Analytics), UC Davis**

---

## What HeatLens Does

- **Predicts** county-level heat-related ED visit rates using climate, demographic, and vulnerability features
- **Explains** each prediction using SHAP values
- **Simulates interventions** through a What-if simulator — drag sliders to change AC coverage or tree canopy, and see both the new predicted risk and which features drove the change (Counterfactual SHAP)

---

## Four Linked Views

1. **Map Overview** — California county risk map over time
2. **Feature Detail** — the climate and vulnerability features that drive each county's risk
3. **SHAP Breakdown** — vulnerability force plot
4. **What-if Simulator** — interactive intervention testing with live SHAP delta

---

## Tech Stack

- **Backend**: Python, Flask, pandas, geopandas
- **ML**: XGBoost, SHAP, scikit-learn
- **Frontend**: React, TypeScript, D3.js
- **Data**: NOAA temperature, Tracking California, US Census ACS, NLCD tree canopy, US Census LACE (AC coverage)

---

## Data Sources

The data integrates into a single **county-year panel: 285 rows (57 California counties × 2020–2024)**, of which **226 have a labeled ED target** (the rest are small-county suppressions kept for prediction).

| Dataset | What it provides | Granularity / coverage |
|---|---|---|
| NOAA daily temperature | Daily station temps → 5 engineered climate features | Station-daily, aggregated to county-year (2020–2024) |
| Tracking California | Heat-related ED visit rates (prediction target) | County-year; 226 labeled |
| US Census ACS | Elderly %, poverty % (vulnerability) | County-year |
| NLCD | Tree canopy % (intervention feature) | County |
| US Census LACE | AC coverage % — *experimental, modeled, 2023* (intervention feature) | County (2023, broadcast across years) |

---

## Repository Structure

```
heatlens-ecs273/
├── docs/                      # Project documentation
│   ├── proposal.pdf
│   ├── 14day-plan.md
│   └── api-contract.md
├── data/                      # Data files (raw and processed)
│   ├── raw/
│   ├── processed/
│   └── README.md              # Data dictionary
├── backend/                   # Flask API serving processed data + ML outputs
│   ├── api/                   # app.py (Flask, runs on :5000)
│   └── requirements.txt
├── ml/                        # ML training, evaluation + SHAP
│   ├── schema.py              # feature list + monotonicity constraints
│   ├── train.py               # train XGBoost, save model
│   ├── evaluate.py            # leave-county-out CV, baselines + ablations
│   ├── shap_export.py         # SHAP breakdowns for the frontend
│   ├── counterfactual_shap.py # Counterfactual SHAP (the novelty)
│   ├── bootstrap_shap.py      # SHAP stability under resampling
│   ├── cases/                 # case studies (Imperial, 2022 heat)
│   └── outputs/               # JSON exports consumed by the frontend
├── frontend/                  # React + D3 UI
│   └── heatlens-ui/
└── report/                    # Final report
    └── final_report.tex
```

---

## How to Run

### 1. Backend (API)

The processed county-year panel ships in `data/processed/`, so the API can be started directly.

```bash
cd backend
conda create -n heatlens python=3.12
conda activate heatlens
pip install -r requirements.txt

# Start the Flask API
cd api
python app.py
# API runs on http://localhost:5000
```

### 2. ML Training & Evaluation

```bash
cd ml
python train.py        # trains XGBoost, saves model to models/xgb_model.pkl
python evaluate.py      # leave-county-out CV + baselines + ablations -> outputs/metrics.json
```

### 3. Frontend

```bash
cd frontend/heatlens-ui
npm install
npm start
# UI runs on http://localhost:3000
```

---

## Methodology

### Algorithm
- **Feature engineering**: 9 features per county-year — 5 climate (summer average max temperature, heatwave days, consecutive hot days, warm-night count, tail-percentile temperature) and 4 vulnerability (elderly %, poverty %, AC coverage, tree canopy)
- **Model**: shallow, regularized XGBoost regression with **monotonicity constraints** (protective features such as AC and tree canopy can never raise predicted risk), trained on the county-year panel (226 labeled rows)
- **Evaluation**: leave-county-out cross-validation against a linear-regression and a temperature-only baseline (XGBoost R² ≈ 0.44, linear regression ≈ 0.63, temperature-only ≈ 0.22), plus ablations for the monotonicity constraints and the AC feature
- **Explainability**: SHAP TreeExplainer
- **Novelty — Counterfactual SHAP**: when users adjust intervention sliders, we recompute SHAP values on the modified instance and surface the change in feature contributions

### Visualization
- Four coordinated views with shared React state for cross-view interactions
- What-if simulator with live API calls for real-time intervention testing

---

## Team

- **Peiyu Lin** — Data pipeline + Backend
- **Yan Liang** — ML + Algorithm
- **Pablo Rodriguez** — Frontend + Visualization

---

## Status

✅ Feature-complete — the full ML → Flask backend → React frontend pipeline runs end-to-end, with all four linked views live. Final report in progress (ECS 273, Spring 2026).

---

## License

MIT
