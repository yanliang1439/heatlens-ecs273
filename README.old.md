# heatlens-ecs273
Visual Analytics for California Heat Health Risk — ECS 273 Final Project
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
2. **Feature Detail** — what climate features drive each county's risk
3. **SHAP Breakdown** — vulnerability force plot
4. **What-if Simulator** — interactive intervention testing with live SHAP delta

---

## Tech Stack

- **Backend**: Python, Flask, pandas, geopandas
- **ML**: XGBoost, SHAP, scikit-learn
- **Frontend**: React, D3.js, Leaflet
- **Data**: NOAA GHCN-Daily, Tracking California, US Census ACS

---

## Data Sources

| Dataset | Granularity | Volume |
|---|---|---|
| NOAA GHCN-Daily | Daily station temperature | ~3 million records (1,500 CA stations × 6 years) |
| Tracking California | County-year heat-related ED visit rates | 240 county-year observations |
| US Census ACS | County + tract-level demographics | ~9,000 tracts × dozens of variables |

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
├── backend/                   # Data pipeline + Flask API
│   ├── data_pipeline/
│   ├── api/
│   └── requirements.txt
├── ml/                        # ML training + SHAP
│   ├── notebooks/
│   ├── train.py
│   └── counterfactual_shap.py
├── frontend/                  # React + D3 UI
│   └── heatlens-ui/
└── report/                    # Final report
    └── final_report.tex
```

---

## How to Run

### 1. Backend (Data + API)

```bash
cd backend
conda create -n heatlens python=3.12
conda activate heatlens
pip install -r requirements.txt

# Run the data pipeline (one-time)
python data_pipeline/run_pipeline.py

# Start the Flask API
cd api
python app.py
# API runs on http://localhost:5000
```

### 2. ML Training

```bash
cd ml
python train.py
# Trains XGBoost, evaluates with leave-county-out CV,
# saves model to models/xgb_model.pkl
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
- **Feature engineering**: ~10 core climate features per county-year (heatwave days, hot night counts, consecutive hot streaks, tail percentiles)
- **Model**: XGBoost regression on county-year panel (~240 observations)
- **Evaluation**: Leave-county-out cross-validation; baselines include linear regression and a temperature-only threshold
- **Explainability**: SHAP TreeExplainer
- **Novelty — Counterfactual SHAP**: when users adjust intervention sliders, we recompute SHAP values on the modified instance and surface the change in feature contributions

### Visualization
- Four coordinated views with shared React state for cross-view interactions
- What-if simulator with live API calls for real-time intervention testing

---

## Team

- **A** — Data pipeline + Backend
- **B** — ML + Algorithm
- **C** — Frontend + Visualization

---

## Status

🚧 Under active development (14-day sprint, see `docs/14day-plan.md`)

---

## License

MIT
