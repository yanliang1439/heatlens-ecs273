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
