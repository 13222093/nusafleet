"""Constants for the ferry fleet model (physical and numerical, not assumptions).

Anything that is an assumption about North Maluku lives in data/assumptions.yaml.
"""

DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
DAYS_PER_YEAR = 365

# Costs inside the MILP are scaled to billions of rupiah to keep CBC well-conditioned.
RP_PER_BN = 1_000_000_000

# Penalty (in bn Rp) for each route's unmet demand share, used to diagnose infeasibility.
UNMET_DEMAND_PENALTY_BN = 1_000_000

# Wave-height thresholds (m) available in wave_climate.csv.
WAVE_THRESHOLDS_M = (1.0, 1.5, 2.0)
