"""Single source of truth for panel column names.

Both data generators (synthetic panel today, A's real pipeline later) and
downstream scripts (train.py, shap_export.py, counterfactual_shap.py) import
from here. Changing the feature list = change here = re-train + re-export.

The two feature subsets (CLIMATE_FEATURES, VULNERABILITY_FEATURES) match the
split in the frontend's CountyDetailRecord (climateFeatures vs
vulnerabilityFeatures), which is why downstream JSON exports group them.
"""

CLIMATE_FEATURES = [
    "summerAvgMax",
    "heatwaveDays",
    "consecutiveHotDays",
    "warmNightCount",
    "tailPercentileTemp",
]

VULNERABILITY_FEATURES = [
    "elderlyPct",
    "povertyPct",
    "acCoverage",
    "treeCanopy",
]

FEATURE_COLUMNS = CLIMATE_FEATURES + VULNERABILITY_FEATURES
TARGET_COLUMN = "observedEdRate"
ID_COLUMNS = ["countyFips", "countyName", "year"]

# Monotonicity priors for XGBoost (`monotone_constraints`).
#  +1 = predicted ED must be NON-DECREASING in this feature
#  -1 = predicted ED must be NON-INCREASING in this feature
# These encode domain knowledge so the What-if simulator's counterfactual
# interventions are directionally faithful (more tree canopy / AC never raises
# predicted ED; more heat / poverty never lowers it) despite confounding in the
# small observational panel. Without them the unconstrained model gives
# wrong-direction counterfactuals (e.g. +tree -> +predicted ED).
MONOTONE_CONSTRAINTS = {
    "summerAvgMax":       1,
    "heatwaveDays":       1,
    "consecutiveHotDays": 1,
    "warmNightCount":     1,
    "tailPercentileTemp": 1,
    "elderlyPct":         1,
    "povertyPct":         1,
    "acCoverage":        -1,
    "treeCanopy":        -1,
}


def monotone_constraints_tuple() -> tuple:
    """Constraints in FEATURE_COLUMNS order, as XGBoost's monotone_constraints wants."""
    return tuple(MONOTONE_CONSTRAINTS[f] for f in FEATURE_COLUMNS)
