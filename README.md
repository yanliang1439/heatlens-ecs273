# HeatLens

HeatLens is a course project for ECS 273 (Visual Analytics) at UC Davis. The
project focuses on county-level heat-health risk in California and combines a
predictive model, explanation views, and an intervention simulator into one
interactive dashboard. The goal is to help a user move from a geographic
overview of risk to a more detailed understanding of what is driving that risk
and how simple mitigation changes could affect the prediction.

The repository includes three main parts. The `backend/` directory contains the
Flask API that serves county prediction, feature, SHAP, and what-if endpoints.
The `ml/` directory contains the model training, evaluation, SHAP export, and
counterfactual code. The `frontend/heatlens-ui/` directory contains the React +
TypeScript dashboard with the four linked views used in the final demo.

For the final version of the project, the dashboard supports four coordinated
views: a California county map overview, a feature detail panel, a SHAP
breakdown panel, and a what-if simulator. The frontend uses backend-first API
calls for the selected county-year record and falls back to local ML-export
snapshots when needed. This keeps the interface usable even if the full backend
path is unavailable.

## Repository Structure

```
heatlens-ecs273/
├── backend/                  # Flask API and backend requirements
│   ├── api/
│   └── requirements.txt
├── data/                     # Processed panel and supporting data files
│   └── processed/
├── frontend/
│   └── heatlens-ui/          # React + TypeScript dashboard
├── ml/                       # Training, evaluation, SHAP, and counterfactual code
│   ├── models/
│   └── outputs/
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yanliang1439/heatlens-ecs273
cd heatlens-ecs273
```

### 2. Set up the backend Python environment

The backend and ML routes were tested with a Python virtual environment from the
project root.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

This installs the backend and ML dependencies used by the Flask API, including
Flask, pandas, GeoPandas, scikit-learn, XGBoost, and SHAP.

Recommended backend environment: Python 3.12. The live `/api/whatif` counterfactual route was tested in a Python 3.12 environment; older local Python/SHAP/XGBoost combinations may cause that endpoint to fail even if the rest of the backend runs.

### 3. Set up the frontend

```bash
cd frontend/heatlens-ui
npm install
```

The frontend uses Vite, React, and TypeScript. During development, Vite proxies
`/api` requests to the Flask backend running on port `5000`.

## Execution

### 1. Start the backend

From the project root:

```bash
source .venv/bin/activate
python3 backend/api/app.py
```

The backend should start on:

```text
http://127.0.0.1:5000
```

You can verify the API is up with:

```bash
curl http://127.0.0.1:5000/api/health
```

### 2. Start the frontend

In a second terminal:

```bash
cd frontend/heatlens-ui
npm run dev
```

Vite will print the local frontend URL, usually:

```text
http://localhost:5173
```

Open that URL in the browser.

## Demo Instructions

Once both services are running:

1. Open the dashboard in the browser.
2. Confirm the header shows that the backend is connected.
3. Use the year selector to switch between available years.
4. Click counties on the map or in the county list.
5. Inspect the Feature Detail panel for climate and vulnerability values.
6. Inspect the SHAP Breakdown panel for the main positive and negative
   contributors to the current prediction.
7. Use the What-If Simulator sliders to change AC coverage or tree canopy and
   observe the updated prediction and SHAP deltas.

## Main Functionality

- **Map Overview:** county-level heat-risk overview for the selected year
- **Feature Detail:** observed and predicted ED rates plus climate and
  vulnerability feature values
- **SHAP Breakdown:** ranked explanation of which features are pushing the
  selected county prediction upward or downward
- **What-If Simulator:** intervention testing through the backend counterfactual
  route when available, with frontend fallback behavior if needed

## Data Notes

This repository includes processed files and ML output snapshots used by the
demo, including:

- processed county-year panel data in `data/processed/`
- model output JSON files in `ml/outputs/`
- frontend snapshot copies in `frontend/heatlens-ui/src/data/mlOutputs/`

Large raw data sources are not bundled in full in this README. The project uses
derived and processed files already present in the repository so the final demo
can run with minimal setup.

## Team

- Yan Liang - machine learning, evaluation, counterfactual SHAP
- Peiyu Lin - data pipeline and backend API
- Pablo Rodriguez - frontend visualization and linked-view interaction
