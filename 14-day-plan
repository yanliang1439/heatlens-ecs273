# HeatLens — 14-Day Execution Plan

**Project**: HeatLens — Visual Analytics for California Heat Health Risk
**Course**: ECS 273 — Visual Analytics, UC Davis
**Timeline**: 14 days from kickoff to final submission
**Team**: 3 members (A: Data + Backend, B: ML + Algorithm, C: Frontend)

---

## 1. Overall Plan

In the next 14 days, we're building HeatLens from scratch into a complete prototype: **frontend with 4 linked views (Map / Feature Detail / SHAP Breakdown / What-if Simulator) + backend API + Counterfactual SHAP algorithm + 2 case studies + final report + demo video**.

Days 1-4 each of us focuses on our own track (backend / ML / frontend), Day 5 we connect the API, and Day 7 we hit an end-to-end v0 demo. Days 8-14 everyone shifts toward frontend polish + What-if simulator integration + report writing. Day 11 is feature freeze, Day 13 we record the demo, Day 14 we submit.

The professor specifically called out the frontend and simulator during proposal review, so all 4 views stay in scope. Everyone Googles their own implementation details — if you're stuck for more than an hour, say so in the group chat.

---

## 2. What We Cut (Things Not Promised in the Proposal)

To finish in 14 days, **we only cut things the proposal didn't explicitly commit to** — anything we promised stays.

### Cuts

- **Climate features**: 30+ → ~10 core features. The proposal listed 5 feature categories without specifying counts; 10 features fully cover all 5 categories.
- **Bootstrap SHAP stability**: 50 resamples → 20 resamples. Not promised in the proposal — doing it is a bonus.
- **Hyperparameter tuning**: no full grid search, just manually try 2-3 configurations. Not promised.
- **Deployment**: no cloud deployment, localhost demo. Not promised, and localhost is sufficient for the demo.

### Kept (Proposal Commitments)

- **2 case studies**: Imperial County + 2022 California heatwave
- **2 baselines**: linear regression + temperature-only threshold
- **ACS tract-level data** (~9,000 tracts) — supports our "large data" narrative
- **4 linked views**
- **What-if simulator**
- **Counterfactual SHAP**
- **Leave-county-out CV**

These are written into the proposal — cutting them creates inconsistency and costs points.

---

## 3. Roles

### A — Data + Backend

Owns data pipeline, feature engineering, and the Flask API. Pulls and merges data from NOAA, Tracking California, and Census ACS into a county-year panel; uses geopandas for station-to-county spatial joins; engineers ~10 core climate features; also pulls ACS tract-level data (~9,000 tracts) to preserve the "large data" story. Week 1 builds the Flask API for the frontend; Week 2 switches to supporting C — debugging data format issues for the frontend — and writes the data section of the final report.

### B — ML + Algorithm

Owns model training, SHAP, and the Counterfactual SHAP implementation. Trains an XGBoost regression model on county-year ED rates, evaluates with leave-county-out CV, and compares against two baselines (linear regression + temperature-only threshold). **The key novelty is Counterfactual SHAP** — recomputing SHAP values on the modified instance after intervention and showing the delta. Week 2 runs the 2 case studies (Imperial County + 2022 California heatwave) and writes the algorithm and results sections of the final report.

### C — Frontend + Visualization

Owns the React + D3.js implementation of the 4 linked views (Map, Feature Detail, SHAP Breakdown, What-if Simulator) and the cross-view linking logic. The What-if simulator is the core demo piece — sliders trigger backend calls and update both the prediction and SHAP delta in real time. Week 2 the rest of the team helps with polish and demo recording.

---

## 4. Day-by-Day Plan

### Week 1 — Build Core Components in Parallel

| Day | A (Data + Backend) | B (ML + Algorithm) | C (Frontend) |
|---|---|---|---|
| **D1 Mon** | Set up conda env (meteostat / pandas / geopandas / flask); pull GHCN data for one county (Sacramento) as a test; set up GitHub repo structure | Set up conda env (xgboost / shap / sklearn); run through the Kaggle SHAP demo notebook to get comfortable with the library | Install Node.js + scaffold React project; install D3 + Leaflet; render California outline as hello world |
| **D2 Tue** | Merge 6 Tracking California Excel files + pull ACS county-level data + pull ACS tract-level data (~9,000 tracts); **write a mock JSON for C** | Use the mock data to train a first XGBoost model end-to-end (rough version, just verify the pipeline works) | Load California county-boundary GeoJSON; render a static choropleth using mock JSON |
| **D3 Wed** | Spatial join (stations → counties) using geopandas; engineer ~10 core climate features | Train XGBoost on the real panel once A delivers it; get a baseline R²; explore SHAP TreeExplainer outputs | **View 1 (Map overview)** — connect to mock JSON, color counties by ED rate, add time slider and hover |
| **D4 Thu** | Output `county_year_panel.csv` (~240 rows × ~25 features); start Flask API skeleton | Run leave-county-out CV; train both baselines (linear regression + temperature-only); produce R² comparison report | **View 2 (Feature Detail)** — when a county is clicked, show a D3 bar chart of its climate features |
| **D5 Fri** | Complete API endpoints: `/counties`, `/county/<n>/<y>`, `/predict` | Compute SHAP values; format SHAP JSON output for C to consume | Connect View 1 + View 2 to the real API; implement Map ↔ Feature Detail linking |
| **D6 Sat** | Write `/counterfactual` endpoint (wraps B's counterfactual SHAP function) | **Implement Counterfactual SHAP** — recompute SHAP after intervention, return the delta dict | **View 3 (SHAP Breakdown)** — implement D3 force plot for SHAP values |
| **D7 Sun** | **Integration day** — debug end-to-end with C | **Integration day** — debug end-to-end with C | **View 4 (What-if Simulator)** scaffolding — slider UI, hook to `/counterfactual` endpoint |

**Week 1 milestone**: End-to-end v0 demo working — Map → click county → fetch API → display prediction + features ⭐

---

### Week 2 — Polish, Integrate, Report

| Day | A (Data + Backend) | B (ML + Algorithm) | C (Frontend) |
|---|---|---|---|
| **D8 Mon** | **Switch to frontend support** — help C with D3 data formatting issues | **Case study 1** — Imperial County: run model, generate SHAP, simulate AC intervention with counterfactual SHAP | What-if simulator: sliders update Map prediction live |
| **D9 Tue** | Continue frontend support — debug API integration with C | Bootstrap SHAP stability test (20 resamples); record CV of top features | What-if simulator: add SHAP delta bar chart |
| **D10 Wed** | Frontend support: help with cross-view state management | **Case study 2** — 2022 California heatwave: predict all counties for 2022, compare to non-heatwave years, identify dominant features via SHAP | All 4 views fully connected via shared React state |
| **D11 Thu** | Frontend support + start **final report data section** | Start **final report algorithm + results sections** (R², SHAP, case studies) | UI polish pass 1: colors, spacing, responsiveness — **feature freeze** ⭐ |
| **D12 Fri** | Complete data section + integrate into report | Complete algorithm + results sections | UI polish pass 2 + bug fixes |
| **D13 Sat** | Report integration + proofread | Report integration + proofread | **Record demo video** (2-3 minutes); write UI section of report |
| **D14 Sun** | **Submit** | **Submit** | **Submit** |

**Week 2 milestones**: Day 10 full prototype with all 4 views linked ⭐ | Day 11 feature freeze ⭐ | Day 13 demo video done ⭐ | Day 14 final submission ⭐⭐⭐

---

## 5. Critical Dependencies

```
Day 2:  A → C    (mock JSON delivered to C)
Day 4:  A → B    (real panel CSV delivered to B)
Day 5:  B → C    (SHAP JSON format delivered to C)
Day 6:  A+B → C  (counterfactual API delivered to C)
Day 7:  Integration ⭐  (v0 demo working)
Day 11: Feature freeze ⭐
Day 13: Demo video ⭐
Day 14: Final submission ⭐⭐⭐
```

---

## 6. Communication

- **GitHub repo**: [paste link here]
- **Group chat**: WeChat / Slack / Discord
- **Daily quick sync** in the group chat — what you did + what's blocking
- **Stuck for more than 1 hour?** Ask in the group, don't sit on it.
- **Branch strategy**: A works on `backend` branch, B on `ml` branch, C on `frontend` branch. Don't push directly to `main`. Merge to `main` during Day 7 integration day.

---

## 7. Definition of Done

By Day 14, we must deliver:

- ✅ Working end-to-end prototype on localhost (Map + Feature Detail + SHAP Breakdown + What-if Simulator)
- ✅ Backend API serving predictions and Counterfactual SHAP
- ✅ XGBoost model with leave-county-out CV results vs. 2 baselines
- ✅ 2 case studies (Imperial County + 2022 heatwave)
- ✅ Demo video (2-3 minutes)
- ✅ Final report PDF
- ✅ GitHub repo with clean code + README

Let's go.
